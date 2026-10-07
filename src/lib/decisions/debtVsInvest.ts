export interface DebtVsInvestInput {
  extraMonthlyCash: number; // e.g., $500
  debtBalance: number; // e.g., $22,000
  debtInterestRatePercent: number; // e.g., 17.5% APR
  debtMinimumMonthlyPayment: number; // e.g., $550
  expectedInvestmentReturnPercent: number; // e.g., 8.0% annual
  investmentTaxRatePercent: number; // e.g., 15% capital gains / dividend
  horizonYears: number; // e.g., 5 years
}

export interface YearDebtInvestBreakdown {
  year: number;
  // Option A (Debt First)
  debtFirstRemainingBalance: number;
  debtFirstInvestedBalance: number;
  debtFirstNetWorth: number;

  // Option B (Invest Surplus)
  investFirstRemainingBalance: number;
  investFirstInvestedBalance: number;
  investFirstNetWorth: number;

  differenceInNetWorth: number; // Option A - Option B
}

export interface DebtVsInvestResult {
  horizonYears: number;
  extraMonthlyCash: number;

  // Option A (Debt Accelerated)
  optionADebtFreeMonth: number;
  optionATotalInterestPaid: number;
  optionAFinalDebtBalance: number;
  optionAFinalPortfolioValue: number;
  optionANetFinancialPosition: number; // Portfolio - Debt

  // Option B (Invest Surplus)
  optionBTotalInterestPaid: number;
  optionBFinalDebtBalance: number;
  optionBFinalPortfolioValue: number;
  optionBNetFinancialPosition: number; // Portfolio - Debt

  netPositionDifference: number;
  higherNetOption: 'debt_first' | 'invest_first' | 'equal';
  fixedInterestRate: number;
  contractualInterestRate: number;
  guaranteedInterestRate: number;
  breakdown: YearDebtInvestBreakdown[];
  summaryText: string;
}

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
  const afterTaxReturn = expectedInvestmentReturnPercent * (1 - investmentTaxRatePercent / 100);
  const investMonthlyRate = afterTaxReturn / 100 / 12;

  // --- SIMULATION A: PAY OFF DEBT RAPIDLY FIRST ---
  let balA = debtBalance;
  let investA = 0;
  let totalInterestA = 0;
  let debtFreeMonthA = totalMonths;
  let hasClearedDebtA = false;

  // --- SIMULATION B: PAY MINIMUM ON DEBT & INVEST SURPLUS ---
  let balB = debtBalance;
  let investB = 0;
  let totalInterestB = 0;

  const yearlyBreakdown: YearDebtInvestBreakdown[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    // === OPTION A ===
    if (balA > 0) {
      const interestA = balA * debtMonthlyRate;
      totalInterestA += interestA;
      balA += interestA;

      const paymentA = debtMinimumMonthlyPayment + extraMonthlyCash;
      if (paymentA >= balA) {
        // Debt fully paid off this month!
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
      // Debt is 0. Direct minimum payment + extra into investments!
      investA += investA * investMonthlyRate;
      investA += debtMinimumMonthlyPayment + extraMonthlyCash;
    }

    // === OPTION B ===
    if (balB > 0) {
      const interestB = balB * debtMonthlyRate;
      totalInterestB += interestB;
      balB += interestB;

      const paymentB = Math.min(balB, debtMinimumMonthlyPayment);
      balB -= paymentB;
      if (balB < 0) balB = 0;
    }

    // Invest the extra surplus every month
    investB += investB * investMonthlyRate;
    investB += extraMonthlyCash;

    // Record yearly checkpoints
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

  const netPositionDifference = Math.abs(optionANetFinancialPosition - optionBNetFinancialPosition);
  let higherNetOption: 'debt_first' | 'invest_first' | 'equal' = 'equal';
  if (optionANetFinancialPosition > optionBNetFinancialPosition) {
    higherNetOption = 'debt_first';
  } else if (optionBNetFinancialPosition > optionANetFinancialPosition) {
    higherNetOption = 'invest_first';
  }

  let summaryText = '';
  if (higherNetOption === 'debt_first') {
    summaryText = `Over ${horizonYears} years, allocating surplus cash to eliminate debt first yields an estimated net financial position that is $${netPositionDifference.toLocaleString()} higher than investing simultaneously ($${optionANetFinancialPosition.toLocaleString()} vs. $${optionBNetFinancialPosition.toLocaleString()}). Eliminating the ${debtInterestRatePercent}% contractual interest rate provides interest charges avoided of $${Math.round(totalInterestB - totalInterestA).toLocaleString()} without exposure to market volatility, freeing up monthly cash flow by month ${debtFreeMonthA}.`;
  } else if (higherNetOption === 'invest_first') {
    summaryText = `Over ${horizonYears} years, investing surplus cash while maintaining minimum debt payments produces an estimated net financial position that is $${netPositionDifference.toLocaleString()} higher ($${optionBNetFinancialPosition.toLocaleString()} vs. $${optionANetFinancialPosition.toLocaleString()}). Because the prospective after-tax investment return (${afterTaxReturn.toFixed(1)}%) exceeds the net borrowing cost of the debt, modeled investment compounding outpaces contractual interest charges over this horizon. However, actual market returns remain uncertain.`;
  } else {
    summaryText = `Over ${horizonYears} years, both debt acceleration and concurrent investing result in comparable modeled net financial positions ($${optionANetFinancialPosition.toLocaleString()}).`;
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

export function validateDebtVsInvestInput(input: DebtVsInvestInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (input.extraMonthlyCash < 0) errors.extraMonthlyCash = 'Extra cash cannot be negative.';
  if (input.debtBalance < 0) errors.debtBalance = 'Debt balance cannot be negative.';
  if (input.debtInterestRatePercent < 0) errors.debtInterestRatePercent = 'Interest rate cannot be negative.';
  if (input.debtMinimumMonthlyPayment <= 0) errors.debtMinimumMonthlyPayment = 'Minimum payment must be greater than zero.';
  if (input.horizonYears < 1 || input.horizonYears > 30) errors.horizonYears = 'Horizon must be 1 to 30 years.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
