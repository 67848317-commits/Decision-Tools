import type {
  GasVsEvInput,
  GasVsEvResult,
  YearGasEvBreakdown,
} from '@decision-tools/shared-types';
import { validateGasVsEvInput } from '@decision-tools/validation';
import { formatNumber, formatSummaryDollar } from '../formatters/index';

export type {
  GasVsEvInput,
  GasVsEvResult,
  YearGasEvBreakdown,
};
export { validateGasVsEvInput };

export const GAS_VS_EV_DEFAULTS: GasVsEvInput = {
  annualMiles: 13500,
  horizonYears: 5,

  gasVehiclePrice: 35000,
  gasMpg: 29,
  gasPricePerGallon: 3.65,
  gasAnnualMaintenance: 1150,
  gasInsuranceAnnual: 1650,
  gasResaleValuePercent: 48,

  evVehiclePrice: 43000,
  evEfficiencyMilesPerKwh: 3.4,
  electricityCostPerKwh: 0.16,
  evHomeChargerInstall: 1200,
  evTaxCredit: 7500,
  evAnnualMaintenance: 550,
  evInsuranceAnnual: 1900,
  evResaleValuePercent: 44,
};

export function calculateGasVsEv(input: GasVsEvInput): GasVsEvResult {
  const {
    annualMiles,
    horizonYears,
    gasVehiclePrice,
    gasMpg,
    gasPricePerGallon,
    gasAnnualMaintenance,
    gasInsuranceAnnual,
    gasResaleValuePercent,
    evVehiclePrice,
    evEfficiencyMilesPerKwh,
    electricityCostPerKwh,
    evHomeChargerInstall,
    evTaxCredit,
    evAnnualMaintenance,
    evInsuranceAnnual,
    evResaleValuePercent,
  } = input;

  const totalMiles = annualMiles * horizonYears;

  const effectiveMpg = Math.max(1, gasMpg);
  const gasGallonsPerYear = annualMiles / effectiveMpg;
  const gasAnnualFuelCost = Math.round(gasGallonsPerYear * gasPricePerGallon);
  const gasFuelCostPerMile = Number((gasPricePerGallon / effectiveMpg).toFixed(3));
  const gasTotalFuelCost = gasAnnualFuelCost * horizonYears;
  const gasTotalMaintenanceCost = gasAnnualMaintenance * horizonYears;
  const gasTotalInsuranceCost = gasInsuranceAnnual * horizonYears;
  const gasTotalOperatingCost =
    gasTotalFuelCost + gasTotalMaintenanceCost + gasTotalInsuranceCost;

  const gasResidualValue = Math.round(gasVehiclePrice * (gasResaleValuePercent / 100));
  const gasNetAcquisitionCost = gasVehiclePrice - gasResidualValue;
  const gasTotalCostOfOwnership = gasNetAcquisitionCost + gasTotalOperatingCost;

  const effectiveMilesPerKwh = Math.max(0.1, evEfficiencyMilesPerKwh);
  const evKwhPerYear = annualMiles / effectiveMilesPerKwh;
  const evAdjustedKwhPerYear = evKwhPerYear * 1.1;
  const evAnnualElectricityCost = Math.round(evAdjustedKwhPerYear * electricityCostPerKwh);
  const evElectricityCostPerMile = Number(
    ((electricityCostPerKwh * 1.1) / effectiveMilesPerKwh).toFixed(3)
  );
  const evTotalElectricityCost = evAnnualElectricityCost * horizonYears;
  const evTotalMaintenanceCost = evAnnualMaintenance * horizonYears;
  const evTotalInsuranceCost = evInsuranceAnnual * horizonYears;
  const evTotalOperatingCost =
    evTotalElectricityCost + evTotalMaintenanceCost + evTotalInsuranceCost;

  const evResidualValue = Math.round(evVehiclePrice * (evResaleValuePercent / 100));
  const evNetAcquisitionCost =
    evVehiclePrice + evHomeChargerInstall - evTaxCredit - evResidualValue;
  const evTotalCostOfOwnership = evNetAcquisitionCost + evTotalOperatingCost;

  const annualFuelSavingsWithEv = gasAnnualFuelCost - evAnnualElectricityCost;
  const gasAnnualOperating =
    gasAnnualFuelCost + gasAnnualMaintenance + gasInsuranceAnnual;
  const evAnnualOperating =
    evAnnualElectricityCost + evAnnualMaintenance + evInsuranceAnnual;
  const annualOperatingSavingsWithEv = gasAnnualOperating - evAnnualOperating;

  const totalTcoDifference = Math.abs(gasTotalCostOfOwnership - evTotalCostOfOwnership);
  let lowerTcoOption: 'gas' | 'ev' | 'equal' = 'equal';
  if (evTotalCostOfOwnership < gasTotalCostOfOwnership) {
    lowerTcoOption = 'ev';
  } else if (gasTotalCostOfOwnership < evTotalCostOfOwnership) {
    lowerTcoOption = 'gas';
  }

  const breakdown: YearGasEvBreakdown[] = [];
  let gasCumOp = 0;
  let evCumOp = 0;

  for (let y = 1; y <= horizonYears; y++) {
    gasCumOp += gasAnnualOperating;
    evCumOp += evAnnualOperating;
    breakdown.push({
      year: y,
      gasAnnualEnergy: gasAnnualFuelCost,
      gasAnnualMaint: gasAnnualMaintenance,
      gasAnnualInsurance: gasInsuranceAnnual,
      gasAnnualTotal: gasAnnualOperating,
      gasCumulativeOperating: gasCumOp,

      evAnnualEnergy: evAnnualElectricityCost,
      evAnnualMaint: evAnnualMaintenance,
      evAnnualInsurance: evInsuranceAnnual,
      evAnnualTotal: evAnnualOperating,
      evCumulativeOperating: evCumOp,

      operatingDifferenceCumulative: gasCumOp - evCumOp,
    });
  }

  let summaryText = '';
  if (lowerTcoOption === 'ev') {
    summaryText = `Over a ${horizonYears}-year horizon driving ${formatNumber(annualMiles)} miles annually, the Electric Vehicle has an estimated total cost of ownership that is ${formatSummaryDollar(totalTcoDifference)} lower than the gasoline vehicle (${formatSummaryDollar(evTotalCostOfOwnership)} vs. ${formatSummaryDollar(gasTotalCostOfOwnership)}). Lower fuel and maintenance costs provide ongoing operating savings of approximately ${formatSummaryDollar(annualOperatingSavingsWithEv)} per year.`;
  } else if (lowerTcoOption === 'gas') {
    summaryText = `Over a ${horizonYears}-year horizon driving ${formatNumber(annualMiles)} miles annually, the Gasoline Vehicle has an estimated total cost of ownership that is ${formatSummaryDollar(totalTcoDifference)} lower than the electric vehicle (${formatSummaryDollar(gasTotalCostOfOwnership)} vs. ${formatSummaryDollar(evTotalCostOfOwnership)}). While the EV yields estimated operating savings of ${formatSummaryDollar(annualOperatingSavingsWithEv)} per year, the higher initial acquisition and insurance costs outweigh those fuel savings within this time frame.`;
  } else {
    summaryText = `Over a ${horizonYears}-year horizon driving ${formatNumber(annualMiles)} miles annually, both vehicles produce virtually identical total costs of ownership (${formatSummaryDollar(gasTotalCostOfOwnership)}).`;
  }

  return {
    horizonYears,
    annualMiles,
    totalMiles,
    gasAnnualFuelCost,
    gasFuelCostPerMile,
    gasTotalFuelCost,
    gasTotalMaintenanceCost,
    gasTotalInsuranceCost,
    gasTotalOperatingCost,
    gasNetAcquisitionCost,
    gasTotalCostOfOwnership,
    evAnnualElectricityCost,
    evElectricityCostPerMile,
    evTotalElectricityCost,
    evTotalMaintenanceCost,
    evTotalInsuranceCost,
    evTotalOperatingCost,
    evNetAcquisitionCost,
    evTotalCostOfOwnership,
    annualFuelSavingsWithEv,
    annualOperatingSavingsWithEv,
    totalTcoDifference,
    lowerTcoOption,
    breakdown,
    summaryText,
  };
}
