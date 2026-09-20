export interface RentVsBuyInput {
  // Rent
  monthlyRent: number;
  annualRentIncreasePercent: number; // e.g., 3.0

  // Buy
  homePrice: number;
  downPayment: number;
  mortgageRatePercent: number; // e.g., 6.5
  loanTermYears: number; // e.g., 30
  propertyTaxRatePercent: number; // e.g., 1.2
  homeInsuranceAnnual: number; // e.g., 1400
  annualMaintenancePercent: number; // e.g., 1.0 of home price
  closingCostsPurchase: number; // e.g., 9000
  expectedAppreciationPercent: number; // e.g., 3.5

  // Time horizon
  horizonYears: number; // e.g., 7
}

export interface YearRentBuyBreakdown {
  year: number;
  rentAnnualCost: number;
  rentCumulativeCost: number;
  ownershipAnnualCost: number;
  ownershipCumulativeCost: number;
  mortgagePrincipalPaidAnnual: number;
  mortgageInterestPaidAnnual: number;
  remainingMortgageBalance: number;
  estimatedHomeValue: number;
  estimatedHomeEquity: number;
  netHousingCost: number;
}

export interface RentVsBuyResult {
  horizonYears: number;
  totalRentCost: number;
  totalOwnershipOutflow: number; // Down payment + closing costs + mortgage payments + taxes + insurance + maintenance
  finalHomeValue: number;
  finalMortgageBalance: number;
  finalHomeEquity: number;
  netOwnershipCost: number; // totalOwnershipOutflow - finalHomeEquity
  netDifference: number; // Math.abs(totalRentCost - netOwnershipCost)
  lowerNetOption: 'rent' | 'buy' | 'equal';
  monthlyMortgagePayment: number;
  loanAmount: number;
  breakdown: YearRentBuyBreakdown[];
  summaryText: string;
}

/**
 * Monthly mortgage payment calculation using standard amortization formula:
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyMortgage(principal: number, annualRatePercent: number, loanTermYears: number): number {
  if (principal <= 0) return 0;
  if (annualRatePercent <= 0) {
    return principal / (loanTermYears * 12);
  }
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = loanTermYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * (monthlyRate * factor)) / (factor - 1);
}

export function validateRentVsBuyInput(input: Partial<RentVsBuyInput>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (input.monthlyRent === undefined || input.monthlyRent < 0) {
    errors.monthlyRent = 'Monthly rent must be 0 or greater.';
  }
  if (input.annualRentIncreasePercent === undefined || input.annualRentIncreasePercent < 0 || input.annualRentIncreasePercent > 20) {
    errors.annualRentIncreasePercent = 'Annual rent increase must be between 0% and 20%.';
  }
  if (input.homePrice === undefined || input.homePrice <= 0) {
    errors.homePrice = 'Home price must be greater than $0.';
  }
  if (input.downPayment === undefined || input.downPayment < 0) {
    errors.downPayment = 'Down payment cannot be negative.';
  } else if (input.homePrice !== undefined && input.downPayment > input.homePrice) {
    errors.downPayment = 'Down payment cannot exceed home purchase price.';
  }
  if (input.mortgageRatePercent === undefined || input.mortgageRatePercent < 0 || input.mortgageRatePercent > 25) {
    errors.mortgageRatePercent = 'Mortgage rate must be between 0% and 25%.';
  }
  if (input.loanTermYears === undefined || input.loanTermYears < 1 || input.loanTermYears > 50) {
    errors.loanTermYears = 'Loan term must be between 1 and 50 years.';
  }
  if (input.propertyTaxRatePercent === undefined || input.propertyTaxRatePercent < 0 || input.propertyTaxRatePercent > 10) {
    errors.propertyTaxRatePercent = 'Property tax rate must be between 0% and 10%.';
  }
  if (input.homeInsuranceAnnual === undefined || input.homeInsuranceAnnual < 0) {
    errors.homeInsuranceAnnual = 'Home insurance must be 0 or greater.';
  }
  if (input.annualMaintenancePercent === undefined || input.annualMaintenancePercent < 0 || input.annualMaintenancePercent > 10) {
    errors.annualMaintenancePercent = 'Maintenance rate must be between 0% and 10%.';
  }
  if (input.closingCostsPurchase === undefined || input.closingCostsPurchase < 0) {
    errors.closingCostsPurchase = 'Closing costs cannot be negative.';
  }
  if (input.expectedAppreciationPercent === undefined || input.expectedAppreciationPercent < -15 || input.expectedAppreciationPercent > 25) {
    errors.expectedAppreciationPercent = 'Expected appreciation must be between -15% and 25%.';
  }
  if (input.horizonYears === undefined || input.horizonYears < 1 || input.horizonYears > 50) {
    errors.horizonYears = 'Time horizon must be between 1 and 50 years.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const horizon = Math.max(1, Math.round(input.horizonYears));
  const loanAmount = Math.max(0, input.homePrice - input.downPayment);
  const monthlyMortgage = calculateMonthlyMortgage(loanAmount, input.mortgageRatePercent, input.loanTermYears);
  const monthlyRate = (input.mortgageRatePercent / 100) / 12;

  let remainingBalance = loanAmount;
  let currentRentMonthly = input.monthlyRent;
  let currentHomeValue = input.homePrice;
  let cumulativeRent = 0;
  let cumulativeOwnership = input.downPayment + input.closingCostsPurchase;

  const breakdown: YearRentBuyBreakdown[] = [];

  for (let yr = 1; yr <= horizon; yr++) {
    // 1. Rent calculation for the year
    const rentAnnual = currentRentMonthly * 12;
    cumulativeRent += rentAnnual;

    // 2. Buy mortgage amortization for the 12 months
    let principalPaidYear = 0;
    let interestPaidYear = 0;

    for (let m = 0; m < 12; m++) {
      if (remainingBalance > 0) {
        const interestMonth = remainingBalance * monthlyRate;
        let principalMonth = monthlyMortgage - interestMonth;
        if (principalMonth > remainingBalance) {
          principalMonth = remainingBalance;
        }
        remainingBalance = Math.max(0, remainingBalance - principalMonth);
        principalPaidYear += principalMonth;
        interestPaidYear += interestMonth;
      }
    }

    const mortgageAnnual = principalPaidYear + interestPaidYear;
    const propertyTaxAnnual = currentHomeValue * (input.propertyTaxRatePercent / 100);
    const insuranceAnnual = input.homeInsuranceAnnual;
    const maintenanceAnnual = currentHomeValue * (input.annualMaintenancePercent / 100);

    const ownershipAnnual = mortgageAnnual + propertyTaxAnnual + insuranceAnnual + maintenanceAnnual;
    cumulativeOwnership += ownershipAnnual;

    // Update appreciated home value at end of year
    currentHomeValue = currentHomeValue * (1 + input.expectedAppreciationPercent / 100);
    const estimatedEquity = Math.max(0, currentHomeValue - remainingBalance);
    const netHousingCost = cumulativeOwnership - estimatedEquity;

    breakdown.push({
      year: yr,
      rentAnnualCost: Math.round(rentAnnual),
      rentCumulativeCost: Math.round(cumulativeRent),
      ownershipAnnualCost: Math.round(ownershipAnnual),
      ownershipCumulativeCost: Math.round(cumulativeOwnership),
      mortgagePrincipalPaidAnnual: Math.round(principalPaidYear),
      mortgageInterestPaidAnnual: Math.round(interestPaidYear),
      remainingMortgageBalance: Math.round(remainingBalance),
      estimatedHomeValue: Math.round(currentHomeValue),
      estimatedHomeEquity: Math.round(estimatedEquity),
      netHousingCost: Math.round(netHousingCost),
    });

    // Escalate rent for next year
    currentRentMonthly = currentRentMonthly * (1 + input.annualRentIncreasePercent / 100);
  }

  const finalBreakdown = breakdown[breakdown.length - 1];
  const totalRentCost = finalBreakdown.rentCumulativeCost;
  const totalOwnershipOutflow = finalBreakdown.ownershipCumulativeCost;
  const finalHomeValue = finalBreakdown.estimatedHomeValue;
  const finalMortgageBalance = finalBreakdown.remainingMortgageBalance;
  const finalHomeEquity = finalBreakdown.estimatedHomeEquity;
  const netOwnershipCost = finalBreakdown.netHousingCost;

  const diff = Math.abs(totalRentCost - netOwnershipCost);
  let lowerNetOption: 'rent' | 'buy' | 'equal' = 'equal';
  if (totalRentCost < netOwnershipCost) {
    lowerNetOption = 'rent';
  } else if (netOwnershipCost < totalRentCost) {
    lowerNetOption = 'buy';
  }

  let summaryText = '';
  if (lowerNetOption === 'rent') {
    summaryText = `Based on the entered assumptions over a ${horizon}-year horizon, renting has an estimated net housing cost of $${totalRentCost.toLocaleString()}, which is $${diff.toLocaleString()} lower than the estimated net ownership cost of $${netOwnershipCost.toLocaleString()}.`;
  } else if (lowerNetOption === 'buy') {
    summaryText = `Based on the entered assumptions over a ${horizon}-year horizon, buying has an estimated net housing cost of $${netOwnershipCost.toLocaleString()} (accounting for $${finalHomeEquity.toLocaleString()} in estimated home equity), which is $${diff.toLocaleString()} lower than the estimated total rent cost of $${totalRentCost.toLocaleString()}.`;
  } else {
    summaryText = `Under the entered parameters over ${horizon} years, both options result in essentially equivalent estimated net housing costs of approximately $${totalRentCost.toLocaleString()}.`;
  }

  return {
    horizonYears: horizon,
    totalRentCost,
    totalOwnershipOutflow,
    finalHomeValue,
    finalMortgageBalance,
    finalHomeEquity,
    netOwnershipCost,
    netDifference: diff,
    lowerNetOption,
    monthlyMortgagePayment: Math.round(monthlyMortgage),
    loanAmount,
    breakdown,
    summaryText,
  };
}

export const RENT_VS_BUY_DEFAULTS: RentVsBuyInput = {
  monthlyRent: 2400,
  annualRentIncreasePercent: 3.0,
  homePrice: 450000,
  downPayment: 90000,
  mortgageRatePercent: 6.5,
  loanTermYears: 30,
  propertyTaxRatePercent: 1.2,
  homeInsuranceAnnual: 1500,
  annualMaintenancePercent: 1.0,
  closingCostsPurchase: 9000,
  expectedAppreciationPercent: 3.5,
  horizonYears: 7,
};
