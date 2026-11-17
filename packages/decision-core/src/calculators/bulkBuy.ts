import type { BulkBuyInput, BulkBuyResult } from '@decision-tools/shared-types';
import { validateBulkBuyInput } from '@decision-tools/validation';
import { formatFixedDecimal } from '../formatters/index';

export type { BulkBuyInput, BulkBuyResult };
export { validateBulkBuyInput };

export const BULK_BUY_DEFAULTS: BulkBuyInput = {
  itemName: 'Pantry Staples / Paper Goods',
  normalUnitPrice: 4.5,
  normalQuantity: 1,
  bulkPackagePrice: 34.0,
  bulkQuantity: 12,
  expectedMonthlyUsage: 2,
  storageCost: 3.0,
  expectedWastePercent: 10,
};

export function calculateBulkBuy(input: BulkBuyInput): BulkBuyResult {
  const normalPackagePrice = Math.max(0.01, input.normalUnitPrice || 0.01);
  const normalPackQty = Math.max(1, input.normalQuantity || 1);
  const normalCostPerUnit = normalPackagePrice / normalPackQty;

  const bulkPackagePrice = Math.max(0.01, input.bulkPackagePrice || 0.01);
  const bulkQty = Math.max(1, input.bulkQuantity || 1);
  const nominalBulkCostPerUnit = bulkPackagePrice / bulkQty;

  const storageCost = Math.max(0, input.storageCost || 0);
  const wasteRate = Math.min(100, Math.max(0, input.expectedWastePercent || 0)) / 100;
  const monthlyUsage = Math.max(0.1, input.expectedMonthlyUsage || 1);

  const nominalEquivalentCost = Number((bulkQty * normalCostPerUnit).toFixed(2));
  const nominalSavings = Number((nominalEquivalentCost - bulkPackagePrice).toFixed(2));
  const nominalSavingsPercent =
    nominalEquivalentCost > 0
      ? Number(((nominalSavings / nominalEquivalentCost) * 100).toFixed(1))
      : 0;

  const effectiveUsableQuantity = Number((bulkQty * (1 - wasteRate)).toFixed(2));
  const effectiveTotalBulkOutlay = Number((bulkPackagePrice + storageCost).toFixed(2));

  const effectiveBulkCostPerUsableUnit =
    effectiveUsableQuantity > 0
      ? Number((effectiveTotalBulkOutlay / effectiveUsableQuantity).toFixed(2))
      : effectiveTotalBulkOutlay;

  const effectiveNormalCostForUsable = Number(
    (effectiveUsableQuantity * normalCostPerUnit).toFixed(2)
  );
  const effectiveSavings = Number(
    (effectiveNormalCostForUsable - effectiveTotalBulkOutlay).toFixed(2)
  );
  const effectiveSavingsPercent =
    effectiveNormalCostForUsable > 0
      ? Number(((effectiveSavings / effectiveNormalCostForUsable) * 100).toFixed(1))
      : 0;

  const breakEvenUnits =
    normalCostPerUnit > 0
      ? Number((effectiveTotalBulkOutlay / normalCostPerUnit).toFixed(1))
      : bulkQty;

  const rawTolerableWaste =
    1 - effectiveTotalBulkOutlay / Math.max(0.01, bulkQty * normalCostPerUnit);
  const breakEvenWastePercent = Number(
    Math.max(0, Math.min(100, rawTolerableWaste * 100)).toFixed(1)
  );

  const monthsToConsumeBulk = Number((bulkQty / monthlyUsage).toFixed(1));
  const monthsToConsumeUsable = Number((effectiveUsableQuantity / monthlyUsage).toFixed(1));

  const isEffectiveSavingsPositive = effectiveSavings > 0;

  let summaryText = '';
  if (isEffectiveSavingsPositive) {
    summaryText = `Under these assumptions, purchasing the bulk package yields an estimated effective net savings of $${formatFixedDecimal(effectiveSavings, 2)} (${effectiveSavingsPercent}% savings) compared to purchasing equivalent standard units. Accounting for ${input.expectedWastePercent}% expected spoilage (${formatFixedDecimal(bulkQty - effectiveUsableQuantity, 1)} units discarded) and $${formatFixedDecimal(storageCost, 2)} in storage overhead, the effective cost is $${formatFixedDecimal(effectiveBulkCostPerUsableUnit, 2)} per usable unit versus $${formatFixedDecimal(normalCostPerUnit, 2)} for standard units. You must consume at least ${breakEvenUnits} of the ${bulkQty} units to recover the bulk outlay.`;
  } else if (effectiveSavings < 0) {
    const extraCost = Math.abs(effectiveSavings);
    summaryText = `Under these assumptions, purchasing bulk results in an estimated net loss of $${formatFixedDecimal(extraCost, 2)} relative to buying standard units as needed. Even though the bulk sticker price is $${formatFixedDecimal(nominalBulkCostPerUnit, 2)}/unit, factoring in ${input.expectedWastePercent}% spoilage and $${formatFixedDecimal(storageCost, 2)} in storage raises the effective cost to $${formatFixedDecimal(effectiveBulkCostPerUsableUnit, 2)} per usable unit (higher than the standard retail cost of $${formatFixedDecimal(normalCostPerUnit, 2)}/unit).`;
  } else {
    summaryText = `Under these assumptions, both bulk purchasing and buying standard units result in identical effective costs ($${formatFixedDecimal(effectiveTotalBulkOutlay, 2)} total, or $${formatFixedDecimal(normalCostPerUnit, 2)} per usable unit). Spoilage waste and storage overhead fully offset the volume discount.`;
  }

  return {
    itemName: input.itemName || 'Goods',
    normalCostPerUnit: Number(normalCostPerUnit.toFixed(2)),
    nominalBulkCostPerUnit: Number(nominalBulkCostPerUnit.toFixed(2)),
    nominalEquivalentCost,
    nominalSavings,
    nominalSavingsPercent,
    effectiveUsableQuantity,
    effectiveBulkCostPerUsableUnit,
    effectiveNormalCostForUsable,
    effectiveTotalBulkOutlay,
    effectiveSavings,
    effectiveSavingsPercent,
    breakEvenUnits,
    breakEvenWastePercent,
    monthsToConsumeBulk,
    monthsToConsumeUsable,
    isEffectiveSavingsPositive,
    summaryText,
  };
}
