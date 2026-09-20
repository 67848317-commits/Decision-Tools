export interface BulkBuyInput {
  itemName: string;
  normalUnitPrice: number; // e.g. $4.50 per standard item/box
  normalQuantity: number; // units per standard package, usually 1
  bulkPackagePrice: number; // e.g. $34.00 for warehouse package
  bulkQuantity: number; // total units in bulk package, e.g. 12
  expectedMonthlyUsage: number; // units consumed per month, e.g. 2
  storageCost: number; // one-time bin/shelf space cost, e.g. $4.00
  expectedWastePercent: number; // expected spoilage/waste %, e.g. 10%
}

export interface BulkBuyResult {
  itemName: string;
  normalCostPerUnit: number;
  nominalBulkCostPerUnit: number;
  nominalEquivalentCost: number; // what you would spend buying bulk quantity at normal retail
  nominalSavings: number;
  nominalSavingsPercent: number;

  effectiveUsableQuantity: number;
  effectiveBulkCostPerUsableUnit: number;
  effectiveNormalCostForUsable: number;
  effectiveTotalBulkOutlay: number; // Bulk package price + storage cost
  effectiveSavings: number;
  effectiveSavingsPercent: number;

  breakEvenUnits: number; // units needed to use before bulk breaks even with standard retail
  breakEvenWastePercent: number; // maximum tolerable waste % before bulk becomes more expensive than retail
  monthsToConsumeBulk: number;
  monthsToConsumeUsable: number;
  isEffectiveSavingsPositive: boolean;
  summaryText: string;
}

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

  // 1. Nominal analysis (without waste and storage)
  const nominalEquivalentCost = Number((bulkQty * normalCostPerUnit).toFixed(2));
  const nominalSavings = Number((nominalEquivalentCost - bulkPackagePrice).toFixed(2));
  const nominalSavingsPercent = nominalEquivalentCost > 0
    ? Number(((nominalSavings / nominalEquivalentCost) * 100).toFixed(1))
    : 0;

  // 2. Effective analysis (accounting for waste and storage cost)
  const effectiveUsableQuantity = Number((bulkQty * (1 - wasteRate)).toFixed(2));
  const effectiveTotalBulkOutlay = Number((bulkPackagePrice + storageCost).toFixed(2));

  const effectiveBulkCostPerUsableUnit = effectiveUsableQuantity > 0
    ? Number((effectiveTotalBulkOutlay / effectiveUsableQuantity).toFixed(2))
    : effectiveTotalBulkOutlay;

  const effectiveNormalCostForUsable = Number((effectiveUsableQuantity * normalCostPerUnit).toFixed(2));
  const effectiveSavings = Number((effectiveNormalCostForUsable - effectiveTotalBulkOutlay).toFixed(2));
  const effectiveSavingsPercent = effectiveNormalCostForUsable > 0
    ? Number(((effectiveSavings / effectiveNormalCostForUsable) * 100).toFixed(1))
    : 0;

  // 3. Break-even points
  // How many units must be consumed to justify paying effectiveTotalBulkOutlay compared to buying retail as needed?
  const breakEvenUnits = normalCostPerUnit > 0
    ? Number((effectiveTotalBulkOutlay / normalCostPerUnit).toFixed(1))
    : bulkQty;

  // Maximum waste rate before bulk unit price exceeds standard retail unit price:
  // (Bulk Price + Storage) / (Bulk Qty * (1 - W)) = Normal Cost Per Unit
  // => (1 - W) = (Bulk Price + Storage) / (Bulk Qty * Normal Cost Per Unit)
  const rawTolerableWaste = 1 - effectiveTotalBulkOutlay / Math.max(0.01, bulkQty * normalCostPerUnit);
  const breakEvenWastePercent = Number(Math.max(0, Math.min(100, rawTolerableWaste * 100)).toFixed(1));

  const monthsToConsumeBulk = Number((bulkQty / monthlyUsage).toFixed(1));
  const monthsToConsumeUsable = Number((effectiveUsableQuantity / monthlyUsage).toFixed(1));

  const isEffectiveSavingsPositive = effectiveSavings > 0;

  let summaryText = '';
  if (isEffectiveSavingsPositive) {
    summaryText = `Under these assumptions, purchasing the bulk package yields an estimated effective net savings of $${effectiveSavings.toFixed(2)} (${effectiveSavingsPercent}% savings) compared to purchasing equivalent standard units. Accounting for ${input.expectedWastePercent}% expected spoilage (${(bulkQty - effectiveUsableQuantity).toFixed(1)} units discarded) and $${storageCost.toFixed(2)} in storage overhead, the effective cost is $${effectiveBulkCostPerUsableUnit.toFixed(2)} per usable unit versus $${normalCostPerUnit.toFixed(2)} for standard units. You must consume at least ${breakEvenUnits} of the ${bulkQty} units to recover the bulk outlay.`;
  } else if (effectiveSavings < 0) {
    const extraCost = Math.abs(effectiveSavings);
    summaryText = `Under these assumptions, purchasing bulk results in an estimated net loss of $${extraCost.toFixed(2)} relative to buying standard units as needed. Even though the bulk sticker price is $${nominalBulkCostPerUnit.toFixed(2)}/unit, factoring in ${input.expectedWastePercent}% spoilage and $${storageCost.toFixed(2)} in storage raises the effective cost to $${effectiveBulkCostPerUsableUnit.toFixed(2)} per usable unit (higher than the standard retail cost of $${normalCostPerUnit.toFixed(2)}/unit).`;
  } else {
    summaryText = `Under these assumptions, both bulk purchasing and buying standard units result in identical effective costs ($${effectiveTotalBulkOutlay.toFixed(2)} total, or $${normalCostPerUnit.toFixed(2)} per usable unit). Spoilage waste and storage overhead fully offset the volume discount.`;
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

export function validateBulkBuyInput(input: BulkBuyInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (input.normalUnitPrice <= 0) {
    errors.normalUnitPrice = 'Normal retail price must be greater than zero.';
  }
  if (input.normalQuantity <= 0) {
    errors.normalQuantity = 'Normal quantity must be at least 1.';
  }
  if (input.bulkPackagePrice <= 0) {
    errors.bulkPackagePrice = 'Bulk package price must be greater than zero.';
  }
  if (input.bulkQuantity <= 0) {
    errors.bulkQuantity = 'Bulk quantity must be at least 1.';
  } else if (input.bulkQuantity < (input.normalQuantity || 1)) {
    errors.bulkQuantity = 'Bulk quantity should be greater than normal quantity.';
  }
  if (input.expectedMonthlyUsage <= 0) {
    errors.expectedMonthlyUsage = 'Expected usage rate must be greater than zero.';
  }
  if (input.storageCost < 0) {
    errors.storageCost = 'Storage cost cannot be negative.';
  }
  if (input.expectedWastePercent < 0 || input.expectedWastePercent >= 100) {
    errors.expectedWastePercent = 'Waste percentage must be between 0% and 99%.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
