import type {
  RentVsBuyCostCategoryTotals,
  RentVsBuyInput,
  RentVsBuyResult,
  YearRentBuyBreakdown,
} from '@decision-tools/shared-types';
import { validateRentVsBuyInput } from '@decision-tools/validation';
import { formatSummaryDollar } from '../formatters/index';

export type {
  RentVsBuyCostCategoryTotals,
  RentVsBuyInput,
  RentVsBuyResult,
  YearRentBuyBreakdown,
};
export { validateRentVsBuyInput };

/**
 * Monthly mortgage payment calculation using standard amortization formula:
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyMortgage(
  principal: number,
  annualRatePercent: number,
  loanTermYears: number
): number {
  if (principal <= 0) return 0;
  if (annualRatePercent <= 0) {
    return principal / (loanTermYears * 12);
  }
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = loanTermYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * (monthlyRate * factor)) / (factor - 1);
}

export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const horizon = Math.max(1, Math.round(input.horizonYears));
  const loanAmount = Math.max(0, input.homePrice - input.downPayment);
  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    input.mortgageRatePercent,
    input.loanTermYears
  );
  const monthlyRate = input.mortgageRatePercent / 100 / 12;

  let remainingBalance = loanAmount;
  let currentRentMonthly = input.monthlyRent;
  let currentHomeValue = input.homePrice;
  let cumulativeRent = 0;
  let cumulativeOwnership = input.downPayment + input.closingCostsPurchase;

  const breakdown: YearRentBuyBreakdown[] = [];

  for (let yr = 1; yr <= horizon; yr++) {
    const rentAnnual = currentRentMonthly * 12;
    cumulativeRent += rentAnnual;

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

    const ownershipAnnual =
      mortgageAnnual + propertyTaxAnnual + insuranceAnnual + maintenanceAnnual;
    cumulativeOwnership += ownershipAnnual;

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
    summaryText = `Based on the entered assumptions over a ${horizon}-year horizon, renting has an estimated net housing cost of ${formatSummaryDollar(totalRentCost)}, which is ${formatSummaryDollar(diff)} lower than the estimated net ownership cost of ${formatSummaryDollar(netOwnershipCost)}.`;
  } else if (lowerNetOption === 'buy') {
    summaryText = `Based on the entered assumptions over a ${horizon}-year horizon, buying has an estimated net housing cost of ${formatSummaryDollar(netOwnershipCost)} (accounting for ${formatSummaryDollar(finalHomeEquity)} in estimated home equity), which is ${formatSummaryDollar(diff)} lower than the estimated total rent cost of ${formatSummaryDollar(totalRentCost)}.`;
  } else {
    summaryText = `Under the entered parameters over ${horizon} years, both options result in essentially equivalent estimated net housing costs of approximately ${formatSummaryDollar(totalRentCost)}.`;
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

/**
 * Exact non-heuristic category totals complementing `calculateRentVsBuy` without
 * altering the `RentVsBuyResult` output contract.
 */
export function calculateRentVsBuyCostCategoryTotals(
  input: RentVsBuyInput
): RentVsBuyCostCategoryTotals {
  const horizon = Math.max(1, Math.round(input.horizonYears));
  const loanAmount = Math.max(0, input.homePrice - input.downPayment);
  const monthlyMortgage = calculateMonthlyMortgage(
    loanAmount,
    input.mortgageRatePercent,
    input.loanTermYears
  );
  const monthlyRate = input.mortgageRatePercent / 100 / 12;

  let remainingBalance = loanAmount;
  let currentRentMonthly = input.monthlyRent;
  let currentHomeValue = input.homePrice;
  let cumulativeRent = 0;
  let mortgageTotal = 0;
  let propertyTaxesTotal = 0;
  let homeInsuranceTotal = 0;
  let maintenanceTotal = 0;

  for (let yr = 1; yr <= horizon; yr++) {
    cumulativeRent += currentRentMonthly * 12;
    let mortgageYear = 0;
    for (let m = 0; m < 12; m++) {
      if (remainingBalance > 0) {
        const interestMonth = remainingBalance * monthlyRate;
        let principalMonth = monthlyMortgage - interestMonth;
        if (principalMonth > remainingBalance) {
          principalMonth = remainingBalance;
        }
        remainingBalance = Math.max(0, remainingBalance - principalMonth);
        mortgageYear += principalMonth + interestMonth;
      }
    }
    mortgageTotal += mortgageYear;
    propertyTaxesTotal += currentHomeValue * (input.propertyTaxRatePercent / 100);
    homeInsuranceTotal += input.homeInsuranceAnnual;
    maintenanceTotal += currentHomeValue * (input.annualMaintenancePercent / 100);

    currentHomeValue = currentHomeValue * (1 + input.expectedAppreciationPercent / 100);
    currentRentMonthly = currentRentMonthly * (1 + input.annualRentIncreasePercent / 100);
  }

  return {
    upfrontCapitalAndAcquisition: Math.round(input.downPayment + input.closingCostsPurchase),
    mortgagePrincipalAndInterest: Math.round(mortgageTotal),
    propertyTaxesTotal: Math.round(propertyTaxesTotal),
    homeInsuranceTotal: Math.round(homeInsuranceTotal),
    propertyTaxesAndInsuranceTotal: Math.round(propertyTaxesTotal + homeInsuranceTotal),
    maintenanceTotal: Math.round(maintenanceTotal),
    cumulativeRent: Math.round(cumulativeRent),
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
