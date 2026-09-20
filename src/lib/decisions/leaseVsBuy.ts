export interface LeaseVsBuyInput {
  analysisTermMonths: number; // e.g., 36

  // Vehicle baseline
  vehicleMSRP: number; // e.g., 38,000

  // Lease parameters
  leaseDownPayment: number; // e.g., 2,500
  leaseMonthlyPayment: number; // e.g., 460
  leaseFees: number; // acquisition + disposition fees, e.g., 950
  leaseAnnualInsurance: number; // e.g., 1,800
  leaseAnnualMaintenance: number; // e.g., 250 (most under warranty)

  // Buy / Finance parameters
  purchasePrice: number; // e.g., 38,000
  purchaseDownPayment: number; // e.g., 5,000
  loanInterestRatePercent: number; // e.g., 6.0
  loanTermMonths: number; // e.g., 60
  salesTaxPercent: number; // e.g., 6.5
  buyAnnualInsurance: number; // e.g., 1,700
  buyAnnualMaintenance: number; // e.g., 650
  vehicleResaleValuePercent: number; // e.g., 54% after 36 months
}

export interface MonthLeaseBuyBreakdown {
  month: number;
  leaseCumulativeCash: number;
  buyCumulativeCash: number;
  remainingLoanBalance: number;
  estimatedVehicleEquity: number;
  netBuyCostToDate: number;
}

export interface LeaseVsBuyResult {
  analysisTermMonths: number;
  analysisTermYears: number;

  // Lease Totals
  leaseTotalPayments: number;
  leaseTotalUpfront: number; // down payment + fees
  leaseTotalOperating: number; // insurance + maintenance
  leaseTotalCashOutflow: number;
  leaseEndEquity: number; // $0
  leaseNetCost: number; // Outflow - Equity

  // Buy Totals
  purchaseLoanMonthlyPayment: number;
  purchaseTotalPrincipalAndInterest: number;
  purchaseTotalUpfront: number; // down payment + sales tax
  purchaseTotalOperating: number; // insurance + maintenance
  purchaseTotalCashOutflow: number;
  purchaseRemainingLoanBalance: number;
  purchaseEstimatedVehicleValue: number;
  purchaseEndEquity: number; // Resale value - Remaining loan balance
  purchaseNetCost: number; // Outflow - Equity

  // Comparative
  netDifference: number;
  lowerNetCostOption: 'lease' | 'buy' | 'equal';
  breakdown: MonthLeaseBuyBreakdown[];
  summaryText: string;
}

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

  // --- LEASE CALCULATIONS ---
  const leaseTotalPayments = leaseMonthlyPayment * analysisTermMonths;
  const leaseTotalUpfront = leaseDownPayment + leaseFees;
  const leaseTotalOperating = (leaseAnnualInsurance + leaseAnnualMaintenance) * analysisTermYears;
  const leaseTotalCashOutflow = leaseTotalPayments + leaseTotalUpfront + leaseTotalOperating;
  const leaseEndEquity = 0; // Return vehicle at lease maturity
  const leaseNetCost = leaseTotalCashOutflow - leaseEndEquity;

  // --- BUY / FINANCE CALCULATIONS ---
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

  // Track loan balance month by month until analysis term
  let currentBalance = loanPrincipal;
  let totalInterestPaidInTerm = 0;
  let totalPrincipalPaidInTerm = 0;

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
      totalInterestPaidInTerm += interestPayment;
      totalPrincipalPaidInTerm += principalPayment;
      buyCumCash += purchaseLoanMonthlyPayment + monthlyBuyOperating;
    } else {
      buyCumCash += monthlyBuyOperating;
    }

    // Vehicle value linear/curved depreciation to target resale value
    const elapsedFraction = m / analysisTermMonths;
    const finalDepreciatedValue = purchasePrice * (vehicleResaleValuePercent / 100);
    const estimatedVehicleValue = purchasePrice - (purchasePrice - finalDepreciatedValue) * elapsedFraction;
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
  const purchaseEstimatedVehicleValue = Math.round(purchasePrice * (vehicleResaleValuePercent / 100));
  const purchaseEndEquity = Math.max(0, purchaseEstimatedVehicleValue - purchaseRemainingLoanBalance);

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
    summaryText = `Over ${analysisTermMonths} months, purchasing results in an estimated net cost that is $${Math.round(netDifference).toLocaleString()} lower than leasing ($${Math.round(purchaseNetCost).toLocaleString()} net cost vs. $${Math.round(leaseNetCost).toLocaleString()}). While purchasing requires higher monthly cash outflow ($${Math.round(purchaseLoanMonthlyPayment).toLocaleString()}/mo vs. $${Math.round(leaseMonthlyPayment).toLocaleString()}/mo), you retain an estimated $${Math.round(purchaseEndEquity).toLocaleString()} in asset equity at the end of month ${analysisTermMonths}.`;
  } else if (lowerNetCostOption === 'lease') {
    summaryText = `Over ${analysisTermMonths} months, leasing results in an estimated net cost that is $${Math.round(netDifference).toLocaleString()} lower than purchasing ($${Math.round(leaseNetCost).toLocaleString()} vs. $${Math.round(purchaseNetCost).toLocaleString()}). Lower monthly commitments and zero exposure to vehicle market depreciation make leasing less costly over this short time window under current assumptions.`;
  } else {
    summaryText = `Over ${analysisTermMonths} months, both leasing and purchasing yield comparable estimated net costs ($${Math.round(leaseNetCost).toLocaleString()}).`;
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

export function validateLeaseVsBuyInput(input: LeaseVsBuyInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (input.vehicleMSRP <= 0) errors.vehicleMSRP = 'Vehicle MSRP must be greater than zero.';
  if (input.analysisTermMonths < 12 || input.analysisTermMonths > 84) errors.analysisTermMonths = 'Term must be 12 to 84 months.';
  if (input.leaseMonthlyPayment <= 0) errors.leaseMonthlyPayment = 'Lease payment must be greater than zero.';
  if (input.purchasePrice <= 0) errors.purchasePrice = 'Purchase price must be greater than zero.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
