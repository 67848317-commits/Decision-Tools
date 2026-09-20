export interface BuyVsRepairInput {
  itemName: string; // e.g., 'Refrigerator' or 'Washing Machine'

  // Repair Option
  repairQuote: number; // e.g., $380
  expectedLifespanAfterRepairYears: number; // e.g., 2.5 years
  currentAnnualOperatingCost: number; // e.g., $160 / yr
  subsequentRepairRiskPercent: number; // e.g., 25%
  subsequentRepairCost: number; // e.g., $220

  // Buy Option
  replacementPrice: number; // e.g., $950
  installationAndDisposalFee: number; // e.g., $75
  replacementExpectedLifespanYears: number; // e.g., 10 years
  replacementAnnualOperatingCost: number; // e.g., $90 / yr
  warrantyYears: number; // e.g., 2 years
}

export interface YearBuyRepairBreakdown {
  year: number;
  cumulativeRepairCash: number;
  cumulativeBuyCash: number;
  cumulativeOperatingSavingsWithNew: number;
}

export interface BuyVsRepairResult {
  itemName: string;
  repairRatioPercent: number; // Repair quote / New purchase price

  // Repair Metrics
  repairUpfrontCost: number;
  repairAnnualizedCapitalCost: number; // Repair cost amortized over extended life
  repairAnnualizedTotalCost: number; // Capital + Operating + Risk
  repairTotal5YearEstimatedCost: number;

  // Buy Replacement Metrics
  buyUpfrontCost: number;
  buyAnnualizedCapitalCost: number; // (Price + Install) / Lifespan
  buyAnnualizedTotalCost: number; // Capital + Operating
  buyTotal5YearEstimatedCost: number;

  annualOperatingDifference: number; // Current operating - New operating
  lowerAnnualizedOption: 'repair' | 'buy' | 'equal';
  annualDifference: number;
  breakdown: YearBuyRepairBreakdown[];
  summaryText: string;
}

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

  const repairRatioPercent = Number(((repairQuote / Math.max(1, replacementPrice)) * 100).toFixed(1));

  // Risk-weighted repair cost
  const riskSubsequent = (subsequentRepairRiskPercent / 100) * subsequentRepairCost;
  const effectiveTotalRepairCapital = repairQuote + riskSubsequent;
  const safeRepairYears = Math.max(0.25, expectedLifespanAfterRepairYears);
  const repairAnnualizedCapitalCost = Math.round(effectiveTotalRepairCapital / safeRepairYears);
  const repairAnnualizedTotalCost = repairAnnualizedCapitalCost + currentAnnualOperatingCost;

  // Buy Amortization
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

  // 5-year cumulative projection
  const breakdown: YearBuyRepairBreakdown[] = [];
  let cumRepair = repairQuote;
  let cumBuy = buyUpfrontCost;

  for (let y = 1; y <= 5; y++) {
    cumRepair += currentAnnualOperatingCost;
    if (y > expectedLifespanAfterRepairYears && y <= Math.ceil(expectedLifespanAfterRepairYears + 1)) {
      cumRepair += riskSubsequent; // Add risk-adjusted secondary repair or subsequent replacement
    }
    cumBuy += replacementAnnualOperatingCost;

    breakdown.push({
      year: y,
      cumulativeRepairCash: Math.round(cumRepair),
      cumulativeBuyCash: Math.round(cumBuy),
      cumulativeOperatingSavingsWithNew: Math.round((currentAnnualOperatingCost - replacementAnnualOperatingCost) * y),
    });
  }

  const repairTotal5YearEstimatedCost = breakdown[4].cumulativeRepairCash;
  const buyTotal5YearEstimatedCost = breakdown[4].cumulativeBuyCash;

  let summaryText = '';
  if (lowerAnnualizedOption === 'repair') {
    summaryText = `On an annualized basis, repairing the item costs an estimated $${repairAnnualizedTotalCost.toLocaleString()}/year (including operating energy) versus $${buyAnnualizedTotalCost.toLocaleString()}/year for buying a replacement. Repairing requires $${repairQuote.toLocaleString()} upfront, compared to $${buyUpfrontCost.toLocaleString()} to purchase new. Because the repair quote is ${repairRatioPercent}% of the replacement price and adds an estimated ${safeRepairYears} years of functional life, repairing is the lower-cost option in the near term under these assumptions.`;
  } else if (lowerAnnualizedOption === 'buy') {
    summaryText = `On an annualized basis, purchasing a brand-new replacement results in an estimated cost of $${buyAnnualizedTotalCost.toLocaleString()}/year versus $${repairAnnualizedTotalCost.toLocaleString()}/year to repair the existing item. Although purchasing requires a higher immediate cash outlay ($${buyUpfrontCost.toLocaleString()} vs. $${repairQuote.toLocaleString()}), the new item's ${safeBuyYears}-year lifespan and $${annualOperatingDifference.toLocaleString()}/year lower operating costs offset the upfront difference over time.`;
  } else {
    summaryText = `Both repairing and buying yield virtually identical annualized operating costs ($${repairAnnualizedTotalCost.toLocaleString()}/year). The primary trade-off is conserving immediate cash ($${repairQuote.toLocaleString()} repair) versus gaining factory warranty and modern reliability with a replacement.`;
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

export function validateBuyVsRepairInput(input: BuyVsRepairInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (input.repairQuote < 0) errors.repairQuote = 'Repair quote cannot be negative.';
  if (input.expectedLifespanAfterRepairYears <= 0) errors.expectedLifespanAfterRepairYears = 'Expected lifespan must be greater than zero.';
  if (input.replacementPrice <= 0) errors.replacementPrice = 'Replacement price must be greater than zero.';
  if (input.replacementExpectedLifespanYears <= 0) errors.replacementExpectedLifespanYears = 'Lifespan must be greater than zero.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
