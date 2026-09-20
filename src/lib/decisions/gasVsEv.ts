export interface GasVsEvInput {
  annualMiles: number;
  horizonYears: number;

  // Gas Car
  gasVehiclePrice: number;
  gasMpg: number;
  gasPricePerGallon: number;
  gasAnnualMaintenance: number;
  gasInsuranceAnnual: number;
  gasResaleValuePercent: number; // e.g., 48% after horizon

  // Electric Car
  evVehiclePrice: number;
  evEfficiencyMilesPerKwh: number; // e.g., 3.4 mi/kWh
  electricityCostPerKwh: number; // e.g., $0.16 / kWh
  evHomeChargerInstall: number; // e.g., $1,200
  evTaxCredit: number; // e.g., $7,500
  evAnnualMaintenance: number; // e.g., $550
  evInsuranceAnnual: number; // e.g., $1,900
  evResaleValuePercent: number; // e.g., 44% after horizon
}

export interface YearGasEvBreakdown {
  year: number;
  gasAnnualEnergy: number;
  gasAnnualMaint: number;
  gasAnnualInsurance: number;
  gasAnnualTotal: number;
  gasCumulativeOperating: number;

  evAnnualEnergy: number;
  evAnnualMaint: number;
  evAnnualInsurance: number;
  evAnnualTotal: number;
  evCumulativeOperating: number;

  operatingDifferenceCumulative: number; // Gas operating - EV operating
}

export interface GasVsEvResult {
  horizonYears: number;
  annualMiles: number;
  totalMiles: number;

  // Gas Totals
  gasAnnualFuelCost: number;
  gasFuelCostPerMile: number;
  gasTotalFuelCost: number;
  gasTotalMaintenanceCost: number;
  gasTotalInsuranceCost: number;
  gasTotalOperatingCost: number;
  gasNetAcquisitionCost: number; // Purchase price minus residual resale
  gasTotalCostOfOwnership: number; // Net acquisition + all operating

  // EV Totals
  evAnnualElectricityCost: number;
  evElectricityCostPerMile: number;
  evTotalElectricityCost: number;
  evTotalMaintenanceCost: number;
  evTotalInsuranceCost: number;
  evTotalOperatingCost: number;
  evNetAcquisitionCost: number; // Price + charger - tax credit - residual resale
  evTotalCostOfOwnership: number;

  // Comparative
  annualFuelSavingsWithEv: number;
  annualOperatingSavingsWithEv: number;
  totalTcoDifference: number;
  lowerTcoOption: 'gas' | 'ev' | 'equal';
  breakdown: YearGasEvBreakdown[];
  summaryText: string;
}

export const GAS_VS_EV_DEFAULTS: GasVsEvInput = {
  annualMiles: 13500,
  horizonYears: 5,

  // Gas
  gasVehiclePrice: 35000,
  gasMpg: 29,
  gasPricePerGallon: 3.65,
  gasAnnualMaintenance: 1150,
  gasInsuranceAnnual: 1650,
  gasResaleValuePercent: 48,

  // EV
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

  // Gas Fuel Costs
  const effectiveMpg = Math.max(1, gasMpg);
  const gasGallonsPerYear = annualMiles / effectiveMpg;
  const gasAnnualFuelCost = Math.round(gasGallonsPerYear * gasPricePerGallon);
  const gasFuelCostPerMile = Number((gasPricePerGallon / effectiveMpg).toFixed(3));
  const gasTotalFuelCost = gasAnnualFuelCost * horizonYears;
  const gasTotalMaintenanceCost = gasAnnualMaintenance * horizonYears;
  const gasTotalInsuranceCost = gasInsuranceAnnual * horizonYears;
  const gasTotalOperatingCost = gasTotalFuelCost + gasTotalMaintenanceCost + gasTotalInsuranceCost;

  const gasResidualValue = Math.round(gasVehiclePrice * (gasResaleValuePercent / 100));
  const gasNetAcquisitionCost = gasVehiclePrice - gasResidualValue;
  const gasTotalCostOfOwnership = gasNetAcquisitionCost + gasTotalOperatingCost;

  // EV Electricity Costs
  const effectiveMilesPerKwh = Math.max(0.1, evEfficiencyMilesPerKwh);
  const evKwhPerYear = annualMiles / effectiveMilesPerKwh;
  // Account for typical 10% AC-to-DC charging losses
  const evAdjustedKwhPerYear = evKwhPerYear * 1.1;
  const evAnnualElectricityCost = Math.round(evAdjustedKwhPerYear * electricityCostPerKwh);
  const evElectricityCostPerMile = Number(((electricityCostPerKwh * 1.1) / effectiveMilesPerKwh).toFixed(3));
  const evTotalElectricityCost = evAnnualElectricityCost * horizonYears;
  const evTotalMaintenanceCost = evAnnualMaintenance * horizonYears;
  const evTotalInsuranceCost = evInsuranceAnnual * horizonYears;
  const evTotalOperatingCost = evTotalElectricityCost + evTotalMaintenanceCost + evTotalInsuranceCost;

  const evResidualValue = Math.round(evVehiclePrice * (evResaleValuePercent / 100));
  const evNetAcquisitionCost = evVehiclePrice + evHomeChargerInstall - evTaxCredit - evResidualValue;
  const evTotalCostOfOwnership = evNetAcquisitionCost + evTotalOperatingCost;

  // Comparative
  const annualFuelSavingsWithEv = gasAnnualFuelCost - evAnnualElectricityCost;
  const gasAnnualOperating = gasAnnualFuelCost + gasAnnualMaintenance + gasInsuranceAnnual;
  const evAnnualOperating = evAnnualElectricityCost + evAnnualMaintenance + evInsuranceAnnual;
  const annualOperatingSavingsWithEv = gasAnnualOperating - evAnnualOperating;

  const totalTcoDifference = Math.abs(gasTotalCostOfOwnership - evTotalCostOfOwnership);
  let lowerTcoOption: 'gas' | 'ev' | 'equal' = 'equal';
  if (evTotalCostOfOwnership < gasTotalCostOfOwnership) {
    lowerTcoOption = 'ev';
  } else if (gasTotalCostOfOwnership < evTotalCostOfOwnership) {
    lowerTcoOption = 'gas';
  }

  // Yearly progression
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
    summaryText = `Over a ${horizonYears}-year horizon driving ${annualMiles.toLocaleString()} miles annually, the Electric Vehicle has an estimated total cost of ownership that is $${totalTcoDifference.toLocaleString()} lower than the gasoline vehicle ($${evTotalCostOfOwnership.toLocaleString()} vs. $${gasTotalCostOfOwnership.toLocaleString()}). Lower fuel and maintenance costs provide ongoing operating savings of approximately $${annualOperatingSavingsWithEv.toLocaleString()} per year.`;
  } else if (lowerTcoOption === 'gas') {
    summaryText = `Over a ${horizonYears}-year horizon driving ${annualMiles.toLocaleString()} miles annually, the Gasoline Vehicle has an estimated total cost of ownership that is $${totalTcoDifference.toLocaleString()} lower than the electric vehicle ($${gasTotalCostOfOwnership.toLocaleString()} vs. $${evTotalCostOfOwnership.toLocaleString()}). While the EV yields estimated operating savings of $${annualOperatingSavingsWithEv.toLocaleString()} per year, the higher initial acquisition and insurance costs outweigh those fuel savings within this time frame.`;
  } else {
    summaryText = `Over a ${horizonYears}-year horizon driving ${annualMiles.toLocaleString()} miles annually, both vehicles produce virtually identical total costs of ownership ($${gasTotalCostOfOwnership.toLocaleString()}).`;
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

export function validateGasVsEvInput(input: GasVsEvInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (input.annualMiles < 500) errors.annualMiles = 'Enter at least 500 annual miles.';
  if (input.horizonYears < 1 || input.horizonYears > 20) errors.horizonYears = 'Horizon must be 1 to 20 years.';
  if (input.gasVehiclePrice <= 0) errors.gasVehiclePrice = 'Gas car price must be greater than zero.';
  if (input.gasMpg <= 0) errors.gasMpg = 'MPG must be greater than zero.';
  if (input.gasPricePerGallon < 0) errors.gasPricePerGallon = 'Gas price cannot be negative.';
  if (input.evVehiclePrice <= 0) errors.evVehiclePrice = 'EV price must be greater than zero.';
  if (input.evEfficiencyMilesPerKwh <= 0) errors.evEfficiencyMilesPerKwh = 'Efficiency must be greater than zero.';
  if (input.electricityCostPerKwh < 0) errors.electricityCostPerKwh = 'Electricity cost cannot be negative.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
