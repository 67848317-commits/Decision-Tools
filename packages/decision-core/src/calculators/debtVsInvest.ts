import type {
  DebtVsInvestInput,
  DebtVsInvestResult,
  YearDebtInvestBreakdown,
} from '@decision-tools/shared-types';
import { validateDebtVsInvestInput } from '@decision-tools/validation';
import { formatFixedDecimal, formatSummaryDollar } from '../formatters/index';

export type {
  DebtVsInvestInput,
  DebtVsInvestResult,
  YearDebtInvestBreakdown,
};
export { validateDebtVsInvestInput };

export const DEBT_VS_INVEST_DEFAULTS: DebtVsInvestInput = {
  extraMonthlyCash: 500,
  debtBalance: 20000,
  debtInterestRatePercent: 18.0,
  debtMinimumMonthlyPayment: 500,
  expectedInvestmentReturnPercent: 8.5,
  investmentTaxRatePercent: 15.0,
  horizonYears: 5,
};

export function calculateDebtVsInvest(input: DebtVsInvestInput): DebtVsInvestResult {
  const {
    extraMonthlyCash,
    debtBalance,
    debtInterestRatePercent,
    debtMinimumMonthlyPayment,
    expectedInvestmentReturnPercent,
    investmentTaxRatePercent,
    horizonYears,
  } = input;

  const totalMonths = horizonYears * 12;
  const debtMonthlyRate = debtInterestRatePercent / 100 / 12;
  const afterTaxReturn =
    expectedInvestmentReturnPercent * (1 - investmentTaxRatePercent / 100);
  const investMonthlyRate = afterTaxReturn / 100 / 12;

  let balA = debtBalance;
  let investA = 0;
  let totalInterestA = 0;
  let debtFreeMonthA = totalMonths;
  let hasClearedDebtA = false;

  let balB = debtBalance;
  let investB = 0;
  let totalInterestB = 0;

  const yearlyBreakdown: YearDebtInvestBreakdown[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    if (balA > 0) {
      const interestA = balA * debtMonthlyRate;
      totalInterestA += interestA;
      balA += interestA;

      const paymentA = debtMinimumMonthlyPayment + extraMonthlyCash;
      if (paymentA >= balA) {
        const leftoverCash = paymentA - balA;
        balA = 0;
        investA += leftoverCash;
        if (!hasClearedDebtA) {
          debtFreeMonthA = m;
          hasClearedDebtA = true;
        }
      } else {
        balA -= paymentA;
      }
    } else {
      investA += investA * investMonthlyRate;
      investA += debtMinimumMonthlyPayment + extraMonthlyCash;
    }

    if (balB > 0) {
      const interestB = balB * debtMonthlyRate;
      totalInterestB += interestB;
      balB += interestB;

      const paymentB = Math.min(balB, debtMinimumMonthlyPayment);
      balB -= paymentB;
      if (balB < 0) balB = 0;
    }

    investB += investB * investMonthlyRate;
    investB += extraMonthlyCash;

    if (m % 12 === 0) {
      const yearNum = m / 12;
      const netA = investA - balA;
      const netB = investB - balB;
      yearlyBreakdown.push({
        year: yearNum,
        debtFirstRemainingBalance: Math.round(balA),
        debtFirstInvestedBalance: Math.round(investA),
        debtFirstNetWorth: Math.round(netA),
        investFirstRemainingBalance: Math.round(balB),
        investFirstInvestedBalance: Math.round(investB),
        investFirstNetWorth: Math.round(netB),
        differenceInNetWorth: Math.round(netA - netB),
      });
    }
  }

  const optionAFinalDebtBalance = Math.round(balA);
  const optionAFinalPortfolioValue = Math.round(investA);
  const optionANetFinancialPosition = Math.round(investA - balA);

  const optionBFinalDebtBalance = Math.round(balB);
  const optionBFinalPortfolioValue = Math.round(investB);
  const optionBNetFinancialPosition = Math.round(investB - balB);

  const netPositionDifference = Math.abs(
    optionANetFinancialPosition - optionBNetFinancialPosition
  );
  let higherNetOption: 'debt_first' | 'invest_first' | 'equal' = 'equal';
  if (optionANetFinancialPosition > optionBNetFinancialPosition) {
    higherNetOption = 'debt_first';
  } else if (optionBNetFinancialPosition > optionANetFinancialPosition) {
    higherNetOption = 'invest_first';
  }

  let summaryText = '';
  if (higherNetOption === 'debt_first') {
    summaryText = `Over ${horizonYears} years, allocating surplus cash to eliminate debt first yields an estimated net financial position that is ${formatSummaryDollar(netPositionDifference)} higher than investing simultaneously (${formatSummaryDollar(optionANetFinancialPosition)} vs. ${formatSummaryDollar(optionBNetFinancialPosition)}). Eliminating the ${debtInterestRatePercent}% contractual interest rate provides interest charges avoided of ${formatSummaryDollar(Math.round(totalInterestB - totalInterestA))} without exposure to market volatility, freeing up monthly cash flow by month ${debtFreeMonthA}.`;
  } else if (higherNetOption === 'invest_first') {
    summaryText = `Over ${horizonYears} years, investing surplus cash while maintaining minimum debt payments produces an estimated net financial position that is ${formatSummaryDollar(netPositionDifference)} higher (${formatSummaryDollar(optionBNetFinancialPosition)} vs. ${formatSummaryDollar(optionANetFinancialPosition)}). Because the prospective after-tax investment return (${formatFixedDecimal(afterTaxReturn, 1)}%) exceeds the net borrowing cost of the debt, modeled investment compounding outpaces contractual interest charges over this horizon. However, actual market returns remain uncertain.`;
  } else {
    summaryText = `Over ${horizonYears} years, both debt acceleration and concurrent investing result in comparable modeled net financial positions (${formatSummaryDollar(optionANetFinancialPosition)}).`;
  }

  return {
    horizonYears,
    extraMonthlyCash,
    optionADebtFreeMonth: debtFreeMonthA,
    optionATotalInterestPaid: Math.round(totalInterestA),
    optionAFinalDebtBalance,
    optionAFinalPortfolioValue,
    optionANetFinancialPosition,
    optionBTotalInterestPaid: Math.round(totalInterestB),
    optionBFinalDebtBalance,
    optionBFinalPortfolioValue,
    optionBNetFinancialPosition,
    netPositionDifference,
    higherNetOption,
    fixedInterestRate: debtInterestRatePercent,
    contractualInterestRate: debtInterestRatePercent,
    guaranteedInterestRate: debtInterestRatePercent,
    breakdown: yearlyBreakdown,
    summaryText,
  };
}
