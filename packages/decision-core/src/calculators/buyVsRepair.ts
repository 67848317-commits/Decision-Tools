import type {
  BuyVsRepairInput,
  BuyVsRepairResult,
  YearBuyRepairBreakdown,
} from '@decision-tools/shared-types';
import { validateBuyVsRepairInput } from '@decision-tools/validation';
import { formatSummaryDollar } from '../formatters/index';

export type {
  BuyVsRepairInput,
  BuyVsRepairResult,
  YearBuyRepairBreakdown,
};
export { validateBuyVsRepairInput };

export const BUY_VS_REPAIR_DEFAULTS: BuyVsRepairInput = {
  itemName: 'Household Appliance',
  repairQuote: 350,
  expectedLifespanAfterRepairYears: 2.5,
  currentAnnualOperatingCost: 165,
  subsequentRepairRiskPercent: 25,
  subsequentRepairCost: 200,

  replacementPrice: 900,
  installationAndDisposalFee: 75,
  replacementExpectedLifespanYears: 10,
  replacementAnnualOperatingCost: 95,
  warrantyYears: 2,
};

export function calculateBuyVsRepair(input: BuyVsRepairInput): BuyVsRepairResult {
  const {
    itemName,
    repairQuote,
    expectedLifespanAfterRepairYears,
    currentAnnualOperatingCost,
    subsequentRepairRiskPercent,
    subsequentRepairCost,
    replacementPrice,
    installationAndDisposalFee,
    replacementExpectedLifespanYears,
    replacementAnnualOperatingCost,
  } = input;

  const repairRatioPercent = Number(
    ((repairQuote / Math.max(1, replacementPrice)) * 100).toFixed(1)
  );

  const riskSubsequent = (subsequentRepairRiskPercent / 100) * subsequentRepairCost;
  const effectiveTotalRepairCapital = repairQuote + riskSubsequent;
  const safeRepairYears = Math.max(0.25, expectedLifespanAfterRepairYears);
  const repairAnnualizedCapitalCost = Math.round(effectiveTotalRepairCapital / safeRepairYears);
  const repairAnnualizedTotalCost = repairAnnualizedCapitalCost + currentAnnualOperatingCost;

  const buyUpfrontCost = replacementPrice + installationAndDisposalFee;
  const safeBuyYears = Math.max(1, replacementExpectedLifespanYears);
  const buyAnnualizedCapitalCost = Math.round(buyUpfrontCost / safeBuyYears);
  const buyAnnualizedTotalCost = buyAnnualizedCapitalCost + replacementAnnualOperatingCost;

  const annualOperatingDifference = currentAnnualOperatingCost - replacementAnnualOperatingCost;
  const annualDifference = Math.abs(repairAnnualizedTotalCost - buyAnnualizedTotalCost);

  let lowerAnnualizedOption: 'repair' | 'buy' | 'equal' = 'equal';
  if (repairAnnualizedTotalCost < buyAnnualizedTotalCost) {
    lowerAnnualizedOption = 'repair';
  } else if (buyAnnualizedTotalCost < repairAnnualizedTotalCost) {
    lowerAnnualizedOption = 'buy';
  }

  const breakdown: YearBuyRepairBreakdown[] = [];
  let cumRepair = repairQuote;
  let cumBuy = buyUpfrontCost;

  for (let y = 1; y <= 5; y++) {
    cumRepair += currentAnnualOperatingCost;
    if (
      y > expectedLifespanAfterRepairYears &&
      y <= Math.ceil(expectedLifespanAfterRepairYears + 1)
    ) {
      cumRepair += riskSubsequent;
    }
    cumBuy += replacementAnnualOperatingCost;

    breakdown.push({
      year: y,
      cumulativeRepairCash: Math.round(cumRepair),
      cumulativeBuyCash: Math.round(cumBuy),
      cumulativeOperatingSavingsWithNew: Math.round(
        (currentAnnualOperatingCost - replacementAnnualOperatingCost) * y
      ),
    });
  }

  const repairTotal5YearEstimatedCost = breakdown[4].cumulativeRepairCash;
  const buyTotal5YearEstimatedCost = breakdown[4].cumulativeBuyCash;

  let summaryText = '';
  if (lowerAnnualizedOption === 'repair') {
    summaryText = `On an annualized basis, repairing the item costs an estimated ${formatSummaryDollar(repairAnnualizedTotalCost)}/year (including operating energy) versus ${formatSummaryDollar(buyAnnualizedTotalCost)}/year for buying a replacement. Repairing requires ${formatSummaryDollar(repairQuote)} upfront, compared to ${formatSummaryDollar(buyUpfrontCost)} to purchase new. Because the repair quote is ${repairRatioPercent}% of the replacement price and adds an estimated ${safeRepairYears} years of functional life, repairing is the lower-cost option in the near term under these assumptions.`;
  } else if (lowerAnnualizedOption === 'buy') {
    summaryText = `On an annualized basis, purchasing a brand-new replacement results in an estimated cost of ${formatSummaryDollar(buyAnnualizedTotalCost)}/year versus ${formatSummaryDollar(repairAnnualizedTotalCost)}/year to repair the existing item. Although purchasing requires a higher immediate cash outlay (${formatSummaryDollar(buyUpfrontCost)} vs. ${formatSummaryDollar(repairQuote)}), the new item's ${safeBuyYears}-year lifespan and ${formatSummaryDollar(annualOperatingDifference)}/year lower operating costs offset the upfront difference over time.`;
  } else {
    summaryText = `Both repairing and buying yield virtually identical annualized operating costs (${formatSummaryDollar(repairAnnualizedTotalCost)}/year). The primary trade-off is conserving immediate cash (${formatSummaryDollar(repairQuote)} repair) versus gaining factory warranty and modern reliability with a replacement.`;
  }

  return {
    itemName,
    repairRatioPercent,
    repairUpfrontCost: repairQuote,
    repairAnnualizedCapitalCost,
    repairAnnualizedTotalCost,
    repairTotal5YearEstimatedCost,
    buyUpfrontCost,
    buyAnnualizedCapitalCost,
    buyAnnualizedTotalCost,
    buyTotal5YearEstimatedCost,
    annualOperatingDifference,
    lowerAnnualizedOption,
    annualDifference,
    breakdown,
    summaryText,
  };
}
