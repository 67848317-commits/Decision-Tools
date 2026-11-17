import type {
  NewVsUsedInput,
  NewVsUsedResult,
  OptionOwnershipMetrics,
  VehicleOrAssetOption,
} from '@decision-tools/shared-types';
import { validateNewVsUsedInput } from '@decision-tools/validation';
import { formatSummaryDollar } from '../formatters/index';

export type {
  NewVsUsedInput,
  NewVsUsedResult,
  OptionOwnershipMetrics,
  VehicleOrAssetOption,
};
export { validateNewVsUsedInput };

export const NEW_VS_USED_DEFAULTS: NewVsUsedInput = {
  horizonYears: 5,
  newOption: {
    label: 'New Vehicle / Asset',
    purchasePrice: 38000,
    downPayment: 6000,
    financingApr: 5.5,
    loanTermMonths: 60,
    annualInsurance: 1800,
    annualMaintenance: 600,
    annualOperatingCost: 2200,
    expectedResaleValue: 16500,
  },
  usedOption: {
    label: 'Used (3-Year-Old) Vehicle / Asset',
    purchasePrice: 22500,
    downPayment: 4000,
    financingApr: 7.5,
    loanTermMonths: 48,
    annualInsurance: 1500,
    annualMaintenance: 1350,
    annualOperatingCost: 2350,
    expectedResaleValue: 9500,
  },
};

function calculateOptionMetrics(
  opt: VehicleOrAssetOption,
  horizonYears: number
): OptionOwnershipMetrics {
  const purchasePrice = Math.max(0, opt.purchasePrice || 0);
  const upfrontCash = Math.min(purchasePrice, Math.max(0, opt.downPayment || 0));
  const financedAmount = Math.max(0, purchasePrice - upfrontCash);

  const apr = Math.max(0, opt.financingApr || 0);
  const loanTerm = Math.max(1, Math.round(opt.loanTermMonths || 1));
  const horizonMonths = Math.max(1, Math.round(horizonYears * 12));

  let monthlyLoanPayment = 0;
  let remainingLoanBalance = 0;
  let totalInterestOverHorizon = 0;
  let totalPrincipalPaidOverHorizon = 0;
  let totalPaymentsOverHorizon = 0;

  if (financedAmount > 0) {
    const monthlyRate = apr / 100 / 12;
    if (monthlyRate > 0) {
      monthlyLoanPayment =
        financedAmount *
        ((monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
          (Math.pow(1 + monthlyRate, loanTerm) - 1));
    } else {
      monthlyLoanPayment = financedAmount / loanTerm;
    }

    let currentBalance = financedAmount;
    const monthsToSimulate = Math.min(horizonMonths, loanTerm);

    for (let m = 1; m <= monthsToSimulate; m++) {
      const interestThisMonth = currentBalance * monthlyRate;
      const principalThisMonth = Math.min(
        currentBalance,
        monthlyLoanPayment - interestThisMonth
      );
      totalInterestOverHorizon += interestThisMonth;
      totalPrincipalPaidOverHorizon += principalThisMonth;
      totalPaymentsOverHorizon += monthlyLoanPayment;
      currentBalance = Math.max(0, currentBalance - principalThisMonth);
    }

    remainingLoanBalance = horizonMonths < loanTerm ? currentBalance : 0;
  }

  const totalInsurance = Math.round(Math.max(0, opt.annualInsurance || 0) * horizonYears);
  const totalMaintenance = Math.round(Math.max(0, opt.annualMaintenance || 0) * horizonYears);
  const totalOperatingCost = Math.round(
    Math.max(0, opt.annualOperatingCost || 0) * horizonYears
  );

  const endingResaleValue = Math.max(0, opt.expectedResaleValue || 0);
  const estimatedDepreciation = Math.max(0, purchasePrice - endingResaleValue);
  const endingEquity = endingResaleValue - remainingLoanBalance;

  const totalOwnershipCost = Math.round(
    estimatedDepreciation +
      totalInterestOverHorizon +
      totalInsurance +
      totalMaintenance +
      totalOperatingCost
  );

  const annualizedOwnershipCost = Math.round(
    totalOwnershipCost / Math.max(0.25, horizonYears)
  );

  return {
    label: opt.label,
    purchasePrice,
    upfrontCash,
    financedAmount,
    monthlyLoanPayment: Math.round(monthlyLoanPayment),
    totalPaymentsOverHorizon: Math.round(totalPaymentsOverHorizon),
    totalInterestOverHorizon: Math.round(totalInterestOverHorizon),
    totalPrincipalPaidOverHorizon: Math.round(totalPrincipalPaidOverHorizon),
    remainingLoanBalance: Math.round(remainingLoanBalance),
    totalInsurance,
    totalMaintenance,
    totalOperatingCost,
    estimatedDepreciation: Math.round(estimatedDepreciation),
    endingResaleValue: Math.round(endingResaleValue),
    endingEquity: Math.round(endingEquity),
    totalOwnershipCost,
    annualizedOwnershipCost,
  };
}

export function calculateNewVsUsed(input: NewVsUsedInput): NewVsUsedResult {
  const horizonYears = Math.max(0.5, Math.min(20, input.horizonYears || 5));
  const newMetrics = calculateOptionMetrics(input.newOption, horizonYears);
  const usedMetrics = calculateOptionMetrics(input.usedOption, horizonYears);

  const costDifference = Math.abs(
    newMetrics.totalOwnershipCost - usedMetrics.totalOwnershipCost
  );
  let lowerCostOption: 'new' | 'used' | 'equal' = 'equal';
  if (newMetrics.totalOwnershipCost < usedMetrics.totalOwnershipCost) {
    lowerCostOption = 'new';
  } else if (usedMetrics.totalOwnershipCost < newMetrics.totalOwnershipCost) {
    lowerCostOption = 'used';
  }

  const depreciationDifference =
    newMetrics.estimatedDepreciation - usedMetrics.estimatedDepreciation;
  const maintenanceDifference =
    newMetrics.totalMaintenance - usedMetrics.totalMaintenance;
  const interestDifference =
    newMetrics.totalInterestOverHorizon - usedMetrics.totalInterestOverHorizon;
  const insuranceDifference = newMetrics.totalInsurance - usedMetrics.totalInsurance;
  const operatingDifference =
    newMetrics.totalOperatingCost - usedMetrics.totalOperatingCost;

  let summaryText = '';
  if (lowerCostOption === 'used') {
    summaryText = `Under these assumptions, the estimated ${horizonYears}-year ownership cost for the used option is ${formatSummaryDollar(costDifference)} lower than the new option (${formatSummaryDollar(usedMetrics.totalOwnershipCost)} vs. ${formatSummaryDollar(newMetrics.totalOwnershipCost)}). The primary driver is depreciation: the new option loses ${formatSummaryDollar(depreciationDifference)} more in market value over ${horizonYears} years, which outweighs the used option's ${formatSummaryDollar(Math.abs(maintenanceDifference))} higher expected maintenance expenses.`;
  } else if (lowerCostOption === 'new') {
    summaryText = `Under these assumptions, the estimated ${horizonYears}-year ownership cost for the new option is ${formatSummaryDollar(costDifference)} lower than the used option (${formatSummaryDollar(newMetrics.totalOwnershipCost)} vs. ${formatSummaryDollar(usedMetrics.totalOwnershipCost)}). More favorable financing rates and lower cumulative maintenance/repair expenses offset the higher initial acquisition price over this horizon.`;
  } else {
    summaryText = `Under these assumptions, both options yield an identical estimated ${horizonYears}-year ownership cost of ${formatSummaryDollar(newMetrics.totalOwnershipCost)}. The choice balances the new asset's warranty protection and higher initial depreciation against the used asset's lower upfront price and higher expected repair requirements.`;
  }

  return {
    horizonYears,
    newMetrics,
    usedMetrics,
    costDifference,
    lowerCostOption,
    depreciationDifference,
    maintenanceDifference,
    interestDifference,
    insuranceDifference,
    operatingDifference,
    summaryText,
  };
}
