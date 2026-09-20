export type SubscriptionBillingCycle = 'monthly' | 'annual';

export interface BuyVsSubscribeInput {
  itemName: string;
  horizonYears: number; // e.g. 3 years

  // Option A: Buy Outright
  purchasePrice: number; // e.g. $800
  setupOrActivationCost: number; // e.g. $50
  annualMaintenanceCost: number; // e.g. $60/yr
  estimatedResaleValue: number; // e.g. $200

  // Option B: Subscribe
  billingCycle: SubscriptionBillingCycle; // 'monthly' | 'annual'
  monthlySubscriptionPrice: number; // e.g. $35
  annualSubscriptionPrice: number; // e.g. $360
  signupFee: number; // e.g. $25
  annualRecurringFees: number; // e.g. $0 (add-on cloud storage, extra seats)
}

export interface YearCostComparison {
  year: number;
  cumulativeBuyCost: number;
  cumulativeSubscribeCost: number;
  difference: number; // buy - subscribe (negative means buy is cheaper)
}

export interface BuyVsSubscribeResult {
  itemName: string;
  horizonYears: number;
  activeBillingCycle: SubscriptionBillingCycle;

  // Buy Metrics
  totalBuyCost: number;
  annualizedBuyCost: number;
  buyCost3Year: number;
  buyCost5Year: number;
  netCapitalCostAfterResale: number;

  // Subscribe Metrics
  totalSubscribeCost: number;
  annualizedSubscribeCost: number;
  subscribeCost3Year: number;
  subscribeCost5Year: number;
  effectiveAnnualSubscriptionRate: number;

  // Comparative
  costDifference: number; // absolute difference over horizon
  lowerCostOption: 'buy' | 'subscribe' | 'equal';
  breakEvenMonths: number | null; // null if no meaningful break-even exists
  breakEvenDescription: string;
  yearlyBreakdown: YearCostComparison[];
  summaryText: string;
}

export const BUY_VS_SUBSCRIBE_DEFAULTS: BuyVsSubscribeInput = {
  itemName: 'Software or Equipment',
  horizonYears: 3,
  purchasePrice: 600,
  setupOrActivationCost: 40,
  annualMaintenanceCost: 50,
  estimatedResaleValue: 120,
  billingCycle: 'monthly',
  monthlySubscriptionPrice: 30,
  annualSubscriptionPrice: 300,
  signupFee: 20,
  annualRecurringFees: 0,
};

export function calculateBuyVsSubscribe(input: BuyVsSubscribeInput): BuyVsSubscribeResult {
  const horizonYears = Math.max(0.25, Math.min(20, input.horizonYears || 3));
  const purchasePrice = Math.max(0, input.purchasePrice || 0);
  const setupCost = Math.max(0, input.setupOrActivationCost || 0);
  const annualMaint = Math.max(0, input.annualMaintenanceCost || 0);
  const resale = Math.max(0, input.estimatedResaleValue || 0);

  const billingCycle = input.billingCycle || 'monthly';
  const signupFee = Math.max(0, input.signupFee || 0);
  const annualFees = Math.max(0, input.annualRecurringFees || 0);

  // Determine annual subscription recurring rate based on active billing cycle
  const effectiveAnnualSubscriptionRate =
    billingCycle === 'monthly'
      ? Math.max(0, input.monthlySubscriptionPrice || 0) * 12
      : Math.max(0, input.annualSubscriptionPrice || 0);

  // Total Buy Cost = (Purchase Price + Setup + Maintenance * Horizon) - Resale Value
  const grossBuyOutlay = purchasePrice + setupCost + annualMaint * horizonYears;
  const netBuyCost = Math.max(0, grossBuyOutlay - resale);
  const annualizedBuyCost = Math.round(netBuyCost / horizonYears);
  const netCapitalCostAfterResale = Math.max(0, purchasePrice + setupCost - resale);

  // Total Subscribe Cost = Signup Fee + (Annual Subscription Rate + Annual Recurring Fees) * Horizon
  const totalSubscribeCost = Math.round(signupFee + (effectiveAnnualSubscriptionRate + annualFees) * horizonYears);
  const annualizedSubscribeCost = Math.round(totalSubscribeCost / horizonYears);

  // Helper for multi-year projections (assuming constant straight-line depreciation of resale value across horizon)
  function getBuyCostAtYear(y: number): number {
    const maintSoFar = annualMaint * y;
    // Resale value is realized at the end of horizon; for intermediate years, scale proportionally or deduct at horizon
    // Standard approach: upfront + maintenance * y - (resale if y >= horizonYears, else straight-line prorated residual)
    const proratedResale = horizonYears > 0 ? resale * Math.max(0, 1 - (y / horizonYears) * 0.5) : 0;
    return Math.max(0, Math.round(purchasePrice + setupCost + maintSoFar - (y === horizonYears ? resale : proratedResale)));
  }

  function getSubscribeCostAtYear(y: number): number {
    return Math.round(signupFee + (effectiveAnnualSubscriptionRate + annualFees) * y);
  }

  const buyCost3Year = Math.max(0, Math.round(purchasePrice + setupCost + annualMaint * 3 - resale));
  const subscribeCost3Year = Math.round(signupFee + (effectiveAnnualSubscriptionRate + annualFees) * 3);

  const buyCost5Year = Math.max(0, Math.round(purchasePrice + setupCost + annualMaint * 5 - resale));
  const subscribeCost5Year = Math.round(signupFee + (effectiveAnnualSubscriptionRate + annualFees) * 5);

  const costDifference = Math.abs(netBuyCost - totalSubscribeCost);
  let lowerCostOption: 'buy' | 'subscribe' | 'equal' = 'equal';
  if (netBuyCost < totalSubscribeCost) {
    lowerCostOption = 'buy';
  } else if (totalSubscribeCost < netBuyCost) {
    lowerCostOption = 'subscribe';
  }

  // Break-even calculation:
  // Upfront cash difference = (Purchase Price + Setup Fee) - Signup Fee
  // Ongoing cost difference per month = Monthly subscription + (Annual Recurring Fees / 12) - (Annual Maintenance / 12)
  const upfrontBuyDelta = purchasePrice + setupCost - signupFee;
  const monthlySubscribeGross = effectiveAnnualSubscriptionRate / 12 + annualFees / 12;
  const monthlyBuyMaintenance = annualMaint / 12;
  const monthlyNetSavingsByBuying = monthlySubscribeGross - monthlyBuyMaintenance;

  let breakEvenMonths: number | null = null;
  let breakEvenDescription = '';

  if (upfrontBuyDelta <= 0 && monthlyNetSavingsByBuying >= 0) {
    // Buying costs less upfront and less or equal monthly
    breakEvenMonths = 0;
    breakEvenDescription = 'Immediate break-even (purchase costs less upfront and equal or less to maintain).';
  } else if (monthlyNetSavingsByBuying <= 0) {
    // Subscription costs less or equal each month, and purchase was more upfront
    breakEvenMonths = null;
    breakEvenDescription = 'No break-even point exists: recurring ownership maintenance equals or exceeds subscription fees.';
  } else {
    // Normal case: Buying is more upfront, but cheaper on an ongoing basis
    const netUpfrontToRecover = Math.max(0, upfrontBuyDelta - resale);
    // Break-even in months to recover net purchase cost (accounting for resale value realized):
    const calculatedMonths = Math.round(netUpfrontToRecover / monthlyNetSavingsByBuying);
    if (isFinite(calculatedMonths) && calculatedMonths > 0 && calculatedMonths <= 240) {
      breakEvenMonths = calculatedMonths;
      const beYears = (calculatedMonths / 12).toFixed(1);
      breakEvenDescription = `Approximately ${calculatedMonths} months (${beYears} years) to recover the upfront purchase premium through avoided subscription fees.`;
    } else {
      breakEvenMonths = null;
      breakEvenDescription = 'Break-even duration exceeds 20 years under entered parameters.';
    }
  }

  // Yearly breakdown table (up to 5 years or horizon, min 3)
  const tableYears = Math.max(3, Math.min(5, Math.ceil(horizonYears)));
  const yearlyBreakdown: YearCostComparison[] = [];
  for (let y = 1; y <= tableYears; y++) {
    const bCost = getBuyCostAtYear(y);
    const sCost = getSubscribeCostAtYear(y);
    yearlyBreakdown.push({
      year: y,
      cumulativeBuyCost: bCost,
      cumulativeSubscribeCost: sCost,
      difference: bCost - sCost,
    });
  }

  let summaryText = '';
  if (lowerCostOption === 'buy') {
    summaryText = `Under these assumptions, the estimated purchase cost is $${costDifference.toLocaleString()} lower over ${horizonYears} ${horizonYears === 1 ? 'year' : 'years'} ($${netBuyCost.toLocaleString()} vs. $${totalSubscribeCost.toLocaleString()}). The one-time purchase requires higher upfront capital ($${(purchasePrice + setupCost).toLocaleString()} vs. $${signupFee.toLocaleString()}), but avoids $${(effectiveAnnualSubscriptionRate * horizonYears).toLocaleString()} in cumulative subscription fees. ${breakEvenDescription}`;
  } else if (lowerCostOption === 'subscribe') {
    summaryText = `Under these assumptions, the estimated subscription cost is $${costDifference.toLocaleString()} lower over ${horizonYears} ${horizonYears === 1 ? 'year' : 'years'} ($${totalSubscribeCost.toLocaleString()} vs. $${netBuyCost.toLocaleString()}). Subscribing preserves upfront capital and costs an estimated $${annualizedSubscribeCost.toLocaleString()} per year compared to $${annualizedBuyCost.toLocaleString()} per year for purchase and maintenance.`;
  } else {
    summaryText = `Under these assumptions, both options result in identical estimated total costs of $${netBuyCost.toLocaleString()} over ${horizonYears} ${horizonYears === 1 ? 'year' : 'years'}. The primary trade-off is conserving upfront capital via a subscription versus retaining physical ownership and residual value through a purchase.`;
  }

  return {
    itemName: input.itemName || 'Software or Equipment',
    horizonYears,
    activeBillingCycle: billingCycle,
    totalBuyCost: netBuyCost,
    annualizedBuyCost,
    buyCost3Year,
    buyCost5Year,
    netCapitalCostAfterResale,
    totalSubscribeCost,
    annualizedSubscribeCost,
    subscribeCost3Year,
    subscribeCost5Year,
    effectiveAnnualSubscriptionRate,
    costDifference,
    lowerCostOption,
    breakEvenMonths,
    breakEvenDescription,
    yearlyBreakdown,
    summaryText,
  };
}

export function validateBuyVsSubscribeInput(input: BuyVsSubscribeInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (input.horizonYears <= 0) {
    errors.horizonYears = 'Comparison horizon must be greater than zero.';
  } else if (input.horizonYears > 25) {
    errors.horizonYears = 'Comparison horizon cannot exceed 25 years.';
  }

  if (input.purchasePrice < 0) {
    errors.purchasePrice = 'Purchase price cannot be negative.';
  }

  if (input.setupOrActivationCost < 0) {
    errors.setupOrActivationCost = 'Setup cost cannot be negative.';
  }

  if (input.annualMaintenanceCost < 0) {
    errors.annualMaintenanceCost = 'Annual maintenance cannot be negative.';
  }

  if (input.estimatedResaleValue < 0) {
    errors.estimatedResaleValue = 'Resale value cannot be negative.';
  } else if (input.estimatedResaleValue > input.purchasePrice + (input.setupOrActivationCost || 0) && input.purchasePrice > 0) {
    errors.estimatedResaleValue = 'Estimated resale value exceeds initial acquisition cost.';
  }

  if (input.billingCycle === 'monthly') {
    if (input.monthlySubscriptionPrice < 0) {
      errors.monthlySubscriptionPrice = 'Monthly subscription price cannot be negative.';
    }
  } else {
    if (input.annualSubscriptionPrice < 0) {
      errors.annualSubscriptionPrice = 'Annual subscription price cannot be negative.';
    }
  }

  if (input.signupFee < 0) {
    errors.signupFee = 'Signup fee cannot be negative.';
  }

  if (input.annualRecurringFees < 0) {
    errors.annualRecurringFees = 'Recurring fees cannot be negative.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
