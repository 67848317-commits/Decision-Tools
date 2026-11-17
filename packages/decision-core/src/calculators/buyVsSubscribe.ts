import type {
  BuyVsSubscribeInput,
  BuyVsSubscribeResult,
  SubscriptionBillingCycle,
  YearCostComparison,
} from '@decision-tools/shared-types';
import { validateBuyVsSubscribeInput } from '@decision-tools/validation';
import { formatFixedDecimal, formatSummaryDollar } from '../formatters/index';

export type {
  BuyVsSubscribeInput,
  BuyVsSubscribeResult,
  SubscriptionBillingCycle,
  YearCostComparison,
};
export { validateBuyVsSubscribeInput };

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

export function calculateBuyVsSubscribe(
  input: BuyVsSubscribeInput
): BuyVsSubscribeResult {
  const horizonYears = Math.max(0.25, Math.min(20, input.horizonYears || 3));
  const purchasePrice = Math.max(0, input.purchasePrice || 0);
  const setupCost = Math.max(0, input.setupOrActivationCost || 0);
  const annualMaint = Math.max(0, input.annualMaintenanceCost || 0);
  const resale = Math.max(0, input.estimatedResaleValue || 0);

  const billingCycle = input.billingCycle || 'monthly';
  const signupFee = Math.max(0, input.signupFee || 0);
  const annualFees = Math.max(0, input.annualRecurringFees || 0);

  const effectiveAnnualSubscriptionRate =
    billingCycle === 'monthly'
      ? Math.max(0, input.monthlySubscriptionPrice || 0) * 12
      : Math.max(0, input.annualSubscriptionPrice || 0);

  const grossBuyOutlay = purchasePrice + setupCost + annualMaint * horizonYears;
  const netBuyCost = Math.max(0, grossBuyOutlay - resale);
  const annualizedBuyCost = Math.round(netBuyCost / horizonYears);
  const netCapitalCostAfterResale = Math.max(0, purchasePrice + setupCost - resale);

  const totalSubscribeCost = Math.round(
    signupFee + (effectiveAnnualSubscriptionRate + annualFees) * horizonYears
  );
  const annualizedSubscribeCost = Math.round(totalSubscribeCost / horizonYears);

  function getBuyCostAtYear(y: number): number {
    const maintSoFar = annualMaint * y;
    const proratedResale =
      horizonYears > 0 ? resale * Math.max(0, 1 - (y / horizonYears) * 0.5) : 0;
    return Math.max(
      0,
      Math.round(
        purchasePrice +
          setupCost +
          maintSoFar -
          (y === horizonYears ? resale : proratedResale)
      )
    );
  }

  function getSubscribeCostAtYear(y: number): number {
    return Math.round(signupFee + (effectiveAnnualSubscriptionRate + annualFees) * y);
  }

  const buyCost3Year = Math.max(
    0,
    Math.round(purchasePrice + setupCost + annualMaint * 3 - resale)
  );
  const subscribeCost3Year = Math.round(
    signupFee + (effectiveAnnualSubscriptionRate + annualFees) * 3
  );

  const buyCost5Year = Math.max(
    0,
    Math.round(purchasePrice + setupCost + annualMaint * 5 - resale)
  );
  const subscribeCost5Year = Math.round(
    signupFee + (effectiveAnnualSubscriptionRate + annualFees) * 5
  );

  const costDifference = Math.abs(netBuyCost - totalSubscribeCost);
  let lowerCostOption: 'buy' | 'subscribe' | 'equal' = 'equal';
  if (netBuyCost < totalSubscribeCost) {
    lowerCostOption = 'buy';
  } else if (totalSubscribeCost < netBuyCost) {
    lowerCostOption = 'subscribe';
  }

  const upfrontBuyDelta = purchasePrice + setupCost - signupFee;
  const monthlySubscribeGross = effectiveAnnualSubscriptionRate / 12 + annualFees / 12;
  const monthlyBuyMaintenance = annualMaint / 12;
  const monthlyNetSavingsByBuying = monthlySubscribeGross - monthlyBuyMaintenance;

  let breakEvenMonths: number | null = null;
  let breakEvenDescription = '';

  if (upfrontBuyDelta <= 0 && monthlyNetSavingsByBuying >= 0) {
    breakEvenMonths = 0;
    breakEvenDescription =
      'Immediate break-even (purchase costs less upfront and equal or less to maintain).';
  } else if (monthlyNetSavingsByBuying <= 0) {
    breakEvenMonths = null;
    breakEvenDescription =
      'No break-even point exists: recurring ownership maintenance equals or exceeds subscription fees.';
  } else {
    const netUpfrontToRecover = Math.max(0, upfrontBuyDelta - resale);
    const calculatedMonths = Math.round(netUpfrontToRecover / monthlyNetSavingsByBuying);
    if (isFinite(calculatedMonths) && calculatedMonths > 0 && calculatedMonths <= 240) {
      breakEvenMonths = calculatedMonths;
      const beYears = formatFixedDecimal(calculatedMonths / 12, 1);
      breakEvenDescription = `Approximately ${calculatedMonths} months (${beYears} years) to recover the upfront purchase premium through avoided subscription fees.`;
    } else {
      breakEvenMonths = null;
      breakEvenDescription = 'Break-even duration exceeds 20 years under entered parameters.';
    }
  }

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
    summaryText = `Under these assumptions, the estimated purchase cost is ${formatSummaryDollar(costDifference)} lower over ${horizonYears} ${horizonYears === 1 ? 'year' : 'years'} (${formatSummaryDollar(netBuyCost)} vs. ${formatSummaryDollar(totalSubscribeCost)}). The one-time purchase requires higher upfront capital (${formatSummaryDollar(purchasePrice + setupCost)} vs. ${formatSummaryDollar(signupFee)}), but avoids ${formatSummaryDollar(effectiveAnnualSubscriptionRate * horizonYears)} in cumulative subscription fees. ${breakEvenDescription}`;
  } else if (lowerCostOption === 'subscribe') {
    summaryText = `Under these assumptions, the estimated subscription cost is ${formatSummaryDollar(costDifference)} lower over ${horizonYears} ${horizonYears === 1 ? 'year' : 'years'} (${formatSummaryDollar(totalSubscribeCost)} vs. ${formatSummaryDollar(netBuyCost)}). Subscribing preserves upfront capital and costs an estimated ${formatSummaryDollar(annualizedSubscribeCost)} per year compared to ${formatSummaryDollar(annualizedBuyCost)} per year for purchase and maintenance.`;
  } else {
    summaryText = `Under these assumptions, both options result in identical estimated total costs of ${formatSummaryDollar(netBuyCost)} over ${horizonYears} ${horizonYears === 1 ? 'year' : 'years'}. The primary trade-off is conserving upfront capital via a subscription versus retaining physical ownership and residual value through a purchase.`;
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
