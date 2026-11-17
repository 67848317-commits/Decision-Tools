import type {
  LeaseVsBuyInput,
  LeaseVsBuyResult,
  MonthLeaseBuyBreakdown,
} from '@decision-tools/shared-types';
import { validateLeaseVsBuyInput } from '@decision-tools/validation';
import { formatSummaryDollar } from '../formatters/index';

export type {
  LeaseVsBuyInput,
  LeaseVsBuyResult,
  MonthLeaseBuyBreakdown,
};
export { validateLeaseVsBuyInput };

export const LEASE_VS_BUY_DEFAULTS: LeaseVsBuyInput = {
  analysisTermMonths: 36,
  vehicleMSRP: 38000,

  leaseDownPayment: 2500,
  leaseMonthlyPayment: 460,
  leaseFees: 950,
  leaseAnnualInsurance: 1800,
  leaseAnnualMaintenance: 250,

  purchasePrice: 38000,
  purchaseDownPayment: 5000,
  loanInterestRatePercent: 6.0,
  loanTermMonths: 60,
  salesTaxPercent: 6.5,
  buyAnnualInsurance: 1700,
  buyAnnualMaintenance: 650,
  vehicleResaleValuePercent: 54,
};

export function calculateLeaseVsBuy(input: LeaseVsBuyInput): LeaseVsBuyResult {
  const {
    analysisTermMonths,
    purchasePrice,
    purchaseDownPayment,
    loanInterestRatePercent,
    loanTermMonths,
    salesTaxPercent,
    buyAnnualInsurance,
    buyAnnualMaintenance,
    vehicleResaleValuePercent,
    leaseDownPayment,
    leaseMonthlyPayment,
    leaseFees,
    leaseAnnualInsurance,
    leaseAnnualMaintenance,
  } = input;

  const analysisTermYears = analysisTermMonths / 12;

  const leaseTotalPayments = leaseMonthlyPayment * analysisTermMonths;
  const leaseTotalUpfront = leaseDownPayment + leaseFees;
  const leaseTotalOperating = (leaseAnnualInsurance + leaseAnnualMaintenance) * analysisTermYears;
  const leaseTotalCashOutflow = leaseTotalPayments + leaseTotalUpfront + leaseTotalOperating;
  const leaseEndEquity = 0;
  const leaseNetCost = leaseTotalCashOutflow - leaseEndEquity;

  const salesTaxAmount = purchasePrice * (salesTaxPercent / 100);
  const loanPrincipal = Math.max(0, purchasePrice - purchaseDownPayment);

  let purchaseLoanMonthlyPayment = 0;
  const monthlyRate = loanInterestRatePercent / 100 / 12;
  if (loanPrincipal > 0) {
    if (monthlyRate > 0) {
      purchaseLoanMonthlyPayment =
        (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
        (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
    } else {
      purchaseLoanMonthlyPayment = loanPrincipal / loanTermMonths;
    }
  }

  let currentBalance = loanPrincipal;
  const breakdown: MonthLeaseBuyBreakdown[] = [];
  let leaseCumCash = leaseTotalUpfront;
  let buyCumCash = purchaseDownPayment + salesTaxAmount;

  const monthlyBuyOperating = (buyAnnualInsurance + buyAnnualMaintenance) / 12;
  const monthlyLeaseOperating = (leaseAnnualInsurance + leaseAnnualMaintenance) / 12;

  for (let m = 1; m <= analysisTermMonths; m++) {
    leaseCumCash += leaseMonthlyPayment + monthlyLeaseOperating;

    if (m <= loanTermMonths && currentBalance > 0) {
      const interestPayment = currentBalance * monthlyRate;
      const principalPayment = Math.min(currentBalance, purchaseLoanMonthlyPayment - interestPayment);
      currentBalance = Math.max(0, currentBalance - principalPayment);
      buyCumCash += purchaseLoanMonthlyPayment + monthlyBuyOperating;
    } else {
      buyCumCash += monthlyBuyOperating;
    }

    const elapsedFraction = m / analysisTermMonths;
    const finalDepreciatedValue = purchasePrice * (vehicleResaleValuePercent / 100);
    const estimatedVehicleValue =
      purchasePrice - (purchasePrice - finalDepreciatedValue) * elapsedFraction;
    const equity = Math.max(0, estimatedVehicleValue - currentBalance);

    if (m % 6 === 0 || m === analysisTermMonths) {
      breakdown.push({
        month: m,
        leaseCumulativeCash: Math.round(leaseCumCash),
        buyCumulativeCash: Math.round(buyCumCash),
        remainingLoanBalance: Math.round(currentBalance),
        estimatedVehicleEquity: Math.round(equity),
        netBuyCostToDate: Math.round(buyCumCash - equity),
      });
    }
  }

  const purchaseRemainingLoanBalance = Math.round(currentBalance);
  const purchaseEstimatedVehicleValue = Math.round(
    purchasePrice * (vehicleResaleValuePercent / 100)
  );
  const purchaseEndEquity = Math.max(
    0,
    purchaseEstimatedVehicleValue - purchaseRemainingLoanBalance
  );

  const purchaseTotalPrincipalAndInterest =
    purchaseLoanMonthlyPayment * Math.min(analysisTermMonths, loanTermMonths);
  const purchaseTotalUpfront = purchaseDownPayment + salesTaxAmount;
  const purchaseTotalOperating = (buyAnnualInsurance + buyAnnualMaintenance) * analysisTermYears;
  const purchaseTotalCashOutflow =
    purchaseTotalUpfront + purchaseTotalPrincipalAndInterest + purchaseTotalOperating;
  const purchaseNetCost = purchaseTotalCashOutflow - purchaseEndEquity;

  const netDifference = Math.abs(leaseNetCost - purchaseNetCost);
  let lowerNetCostOption: 'lease' | 'buy' | 'equal' = 'equal';
  if (leaseNetCost < purchaseNetCost) {
    lowerNetCostOption = 'lease';
  } else if (purchaseNetCost < leaseNetCost) {
    lowerNetCostOption = 'buy';
  }

  let summaryText = '';
  if (lowerNetCostOption === 'buy') {
    summaryText = `Over ${analysisTermMonths} months, purchasing results in an estimated net cost that is ${formatSummaryDollar(Math.round(netDifference))} lower than leasing (${formatSummaryDollar(Math.round(purchaseNetCost))} net cost vs. ${formatSummaryDollar(Math.round(leaseNetCost))}). While purchasing requires higher monthly cash outflow (${formatSummaryDollar(Math.round(purchaseLoanMonthlyPayment))}/mo vs. ${formatSummaryDollar(Math.round(leaseMonthlyPayment))}/mo), you retain an estimated ${formatSummaryDollar(Math.round(purchaseEndEquity))} in asset equity at the end of month ${analysisTermMonths}.`;
  } else if (lowerNetCostOption === 'lease') {
    summaryText = `Over ${analysisTermMonths} months, leasing results in an estimated net cost that is ${formatSummaryDollar(Math.round(netDifference))} lower than purchasing (${formatSummaryDollar(Math.round(leaseNetCost))} vs. ${formatSummaryDollar(Math.round(purchaseNetCost))}). Lower monthly commitments and zero exposure to vehicle market depreciation make leasing less costly over this short time window under current assumptions.`;
  } else {
    summaryText = `Over ${analysisTermMonths} months, both leasing and purchasing yield comparable estimated net costs (${formatSummaryDollar(Math.round(leaseNetCost))}).`;
  }

  return {
    analysisTermMonths,
    analysisTermYears,
    leaseTotalPayments: Math.round(leaseTotalPayments),
    leaseTotalUpfront: Math.round(leaseTotalUpfront),
    leaseTotalOperating: Math.round(leaseTotalOperating),
    leaseTotalCashOutflow: Math.round(leaseTotalCashOutflow),
    leaseEndEquity,
    leaseNetCost: Math.round(leaseNetCost),
    purchaseLoanMonthlyPayment: Math.round(purchaseLoanMonthlyPayment),
    purchaseTotalPrincipalAndInterest: Math.round(purchaseTotalPrincipalAndInterest),
    purchaseTotalUpfront: Math.round(purchaseTotalUpfront),
    purchaseTotalOperating: Math.round(purchaseTotalOperating),
    purchaseTotalCashOutflow: Math.round(purchaseTotalCashOutflow),
    purchaseRemainingLoanBalance,
    purchaseEstimatedVehicleValue,
    purchaseEndEquity,
    purchaseNetCost: Math.round(purchaseNetCost),
    netDifference: Math.round(netDifference),
    lowerNetCostOption,
    breakdown,
    summaryText,
  };
}
