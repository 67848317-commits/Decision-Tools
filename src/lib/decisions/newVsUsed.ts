export interface VehicleOrAssetOption {
  label: string; // 'New' or 'Used'
  purchasePrice: number; // e.g. $38,000 or $22,000
  downPayment: number; // e.g. $6,000 or $4,000
  financingApr: number; // e.g. 5.5% or 7.5%
  loanTermMonths: number; // e.g. 60 or 48 months
  annualInsurance: number; // e.g. $1,800 or $1,500
  annualMaintenance: number; // e.g. $600 or $1,300
  annualOperatingCost: number; // e.g. $2,200 or $2,400 (fuel/energy)
  expectedResaleValue: number; // dollar value at end of comparison horizon
}

export interface NewVsUsedInput {
  horizonYears: number; // e.g. 5 years
  newOption: VehicleOrAssetOption;
  usedOption: VehicleOrAssetOption;
}

export interface OptionOwnershipMetrics {
  label: string;
  purchasePrice: number;
  upfrontCash: number;
  financedAmount: number;
  monthlyLoanPayment: number;
  totalPaymentsOverHorizon: number;
  totalInterestOverHorizon: number;
  totalPrincipalPaidOverHorizon: number;
  remainingLoanBalance: number;
  totalInsurance: number;
  totalMaintenance: number;
  totalOperatingCost: number;
  estimatedDepreciation: number;
  endingResaleValue: number;
  endingEquity: number;
  totalOwnershipCost: number;
  annualizedOwnershipCost: number;
}

export interface NewVsUsedResult {
  horizonYears: number;
  newMetrics: OptionOwnershipMetrics;
  usedMetrics: OptionOwnershipMetrics;
  costDifference: number; // absolute difference in total ownership cost
  lowerCostOption: 'new' | 'used' | 'equal';
  depreciationDifference: number;
  maintenanceDifference: number;
  interestDifference: number;
  insuranceDifference: number;
  operatingDifference: number;
  summaryText: string;
}

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
    expectedResaleValue: 16500, // ~43% residual after 5 years
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
    expectedResaleValue: 9500, // ~42% residual of used price after 5 years
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

    // Amortize month by month through the horizon
    let currentBalance = financedAmount;
    const monthsToSimulate = Math.min(horizonMonths, loanTerm);

    for (let m = 1; m <= monthsToSimulate; m++) {
      const interestThisMonth = currentBalance * monthlyRate;
      const principalThisMonth = Math.min(currentBalance, monthlyLoanPayment - interestThisMonth);
      totalInterestOverHorizon += interestThisMonth;
      totalPrincipalPaidOverHorizon += principalThisMonth;
      totalPaymentsOverHorizon += monthlyLoanPayment;
      currentBalance = Math.max(0, currentBalance - principalThisMonth);
    }

    // If horizon is shorter than loan term, remaining balance is what is left
    remainingLoanBalance = horizonMonths < loanTerm ? currentBalance : 0;
  }

  const totalInsurance = Math.round(Math.max(0, opt.annualInsurance || 0) * horizonYears);
  const totalMaintenance = Math.round(Math.max(0, opt.annualMaintenance || 0) * horizonYears);
  const totalOperatingCost = Math.round(Math.max(0, opt.annualOperatingCost || 0) * horizonYears);

  const endingResaleValue = Math.max(0, opt.expectedResaleValue || 0);
  const estimatedDepreciation = Math.max(0, purchasePrice - endingResaleValue);

  // Ending equity = Resale value - remaining debt
  const endingEquity = endingResaleValue - remainingLoanBalance;

  // True Economic Cost of Ownership over the horizon:
  // Depreciation + Loan Interest Paid + Insurance + Maintenance + Operating
  // Equivalently: Cash Outflows (Down Payment + Monthly Payments Made + Insurance + Maint + Op) - Ending Equity
  const totalOwnershipCost = Math.round(
    estimatedDepreciation +
      totalInterestOverHorizon +
      totalInsurance +
      totalMaintenance +
      totalOperatingCost
  );

  const annualizedOwnershipCost = Math.round(totalOwnershipCost / Math.max(0.25, horizonYears));

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

  const costDifference = Math.abs(newMetrics.totalOwnershipCost - usedMetrics.totalOwnershipCost);
  let lowerCostOption: 'new' | 'used' | 'equal' = 'equal';
  if (newMetrics.totalOwnershipCost < usedMetrics.totalOwnershipCost) {
    lowerCostOption = 'new';
  } else if (usedMetrics.totalOwnershipCost < newMetrics.totalOwnershipCost) {
    lowerCostOption = 'used';
  }

  const depreciationDifference = newMetrics.estimatedDepreciation - usedMetrics.estimatedDepreciation;
  const maintenanceDifference = newMetrics.totalMaintenance - usedMetrics.totalMaintenance;
  const interestDifference = newMetrics.totalInterestOverHorizon - usedMetrics.totalInterestOverHorizon;
  const insuranceDifference = newMetrics.totalInsurance - usedMetrics.totalInsurance;
  const operatingDifference = newMetrics.totalOperatingCost - usedMetrics.totalOperatingCost;

  let summaryText = '';
  if (lowerCostOption === 'used') {
    summaryText = `Under these assumptions, the estimated ${horizonYears}-year ownership cost for the used option is $${costDifference.toLocaleString()} lower than the new option ($${usedMetrics.totalOwnershipCost.toLocaleString()} vs. $${newMetrics.totalOwnershipCost.toLocaleString()}). The primary driver is depreciation: the new option loses $${depreciationDifference.toLocaleString()} more in market value over ${horizonYears} years, which outweighs the used option's $${Math.abs(maintenanceDifference).toLocaleString()} higher expected maintenance expenses.`;
  } else if (lowerCostOption === 'new') {
    summaryText = `Under these assumptions, the estimated ${horizonYears}-year ownership cost for the new option is $${costDifference.toLocaleString()} lower than the used option ($${newMetrics.totalOwnershipCost.toLocaleString()} vs. $${usedMetrics.totalOwnershipCost.toLocaleString()}). More favorable financing rates and lower cumulative maintenance/repair expenses offset the higher initial acquisition price over this horizon.`;
  } else {
    summaryText = `Under these assumptions, both options yield an identical estimated ${horizonYears}-year ownership cost of $${newMetrics.totalOwnershipCost.toLocaleString()}. The choice balances the new asset's warranty protection and higher initial depreciation against the used asset's lower upfront price and higher expected repair requirements.`;
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

export function validateNewVsUsedInput(input: NewVsUsedInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (input.horizonYears <= 0) {
    errors.horizonYears = 'Comparison horizon must be greater than zero.';
  } else if (input.horizonYears > 20) {
    errors.horizonYears = 'Comparison horizon cannot exceed 20 years.';
  }

  // Validate New
  if (input.newOption.purchasePrice <= 0) {
    errors.newPurchasePrice = 'New purchase price must be greater than zero.';
  }
  if (input.newOption.downPayment < 0) {
    errors.newDownPayment = 'Down payment cannot be negative.';
  } else if (input.newOption.downPayment > input.newOption.purchasePrice) {
    errors.newDownPayment = 'Down payment cannot exceed purchase price.';
  }
  if (input.newOption.financingApr < 0) {
    errors.newFinancingApr = 'Financing APR cannot be negative.';
  }
  if (input.newOption.loanTermMonths <= 0) {
    errors.newLoanTermMonths = 'Loan term must be at least 1 month.';
  }
  if (input.newOption.expectedResaleValue < 0) {
    errors.newResaleValue = 'Resale value cannot be negative.';
  }

  // Validate Used
  if (input.usedOption.purchasePrice <= 0) {
    errors.usedPurchasePrice = 'Used purchase price must be greater than zero.';
  }
  if (input.usedOption.downPayment < 0) {
    errors.usedDownPayment = 'Down payment cannot be negative.';
  } else if (input.usedOption.downPayment > input.usedOption.purchasePrice) {
    errors.usedDownPayment = 'Down payment cannot exceed purchase price.';
  }
  if (input.usedOption.financingApr < 0) {
    errors.usedFinancingApr = 'Financing APR cannot be negative.';
  }
  if (input.usedOption.loanTermMonths <= 0) {
    errors.usedLoanTermMonths = 'Loan term must be at least 1 month.';
  }
  if (input.usedOption.expectedResaleValue < 0) {
    errors.usedResaleValue = 'Resale value cannot be negative.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
