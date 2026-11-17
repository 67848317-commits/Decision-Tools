import { describe, expect, it } from 'vitest';
import {
  calculateBulkBuy,
  calculateBuyVsRepair,
  calculateBuyVsSubscribe,
  calculateDebtVsInvest,
  calculateDiyVsHire,
  calculateGasVsEv,
  calculateLeaseVsBuy,
  calculateMonthlyMortgage,
  calculateNewVsUsed,
  calculateRentVsBuy,
  calculateRentVsBuyCostCategoryTotals,
  calculateSingleJobOffer,
  compareJobOffers,
  formatCurrency,
  formatFixedDecimal,
  formatNumber,
  formatSummaryDollar,
  BULK_BUY_DEFAULTS,
  BUY_VS_REPAIR_DEFAULTS,
  BUY_VS_SUBSCRIBE_DEFAULTS,
  DEBT_VS_INVEST_DEFAULTS,
  DIY_VS_HIRE_DEFAULTS,
  GAS_VS_EV_DEFAULTS,
  JOB_OFFER_DEFAULTS_A,
  JOB_OFFER_DEFAULTS_B,
  LEASE_VS_BUY_DEFAULTS,
  NEW_VS_USED_DEFAULTS,
  RENT_VS_BUY_DEFAULTS,
} from '@decision-tools/decision-core';

import rentVsBuyFixture from './fixtures/rent-vs-buy.json';
import jobOfferFixture from './fixtures/job-offer.json';
import leaseVsBuyFixture from './fixtures/lease-vs-buy.json';
import gasVsEvFixture from './fixtures/gas-vs-ev.json';
import buyVsRepairFixture from './fixtures/buy-vs-repair.json';
import diyVsHireFixture from './fixtures/diy-vs-hire.json';
import debtVsInvestFixture from './fixtures/debt-vs-invest.json';
import buyVsSubscribeFixture from './fixtures/buy-vs-subscribe.json';
import newVsUsedFixture from './fixtures/new-vs-used.json';
import bulkBuyFixture from './fixtures/bulk-buy.json';

type FixtureScenario<TInput, TExpected> = {
  id: string;
  description: string;
  input: TInput;
  expected: TExpected;
};

type FixtureFile<TInput, TExpected> = {
  calculator: string;
  capturedFrom: string;
  locale: string;
  scenarios: Array<FixtureScenario<TInput, TExpected>>;
};

/**
 * Compares engine output against committed golden-master fixture expectations:
 * - Integer numbers, strings, booleans, and null use exact `Object.is` equality (`toBe`).
 * - Non-integer floating-point numbers use 6-decimal precision (`toBeCloseTo(expected, 6)`).
 * - Objects require exact sorted key-set equality (detects missing and unexpected fields).
 * - Arrays require exact length and recursive element-by-element parity.
 */
function assertMatchesFixture(actual: unknown, expected: unknown, path = 'result') {
  if (expected === null || typeof expected !== 'object') {
    if (typeof expected === 'number') {
      expect(typeof actual, `${path} should be number`).toBe('number');
      if (Number.isInteger(expected)) {
        expect(actual, `${path} integer mismatch`).toBe(expected);
      } else {
        expect(actual as number, `${path} decimal mismatch`).toBeCloseTo(expected, 6);
      }
    } else {
      expect(actual, `${path} mismatch`).toBe(expected);
    }
    return;
  }

  if (Array.isArray(expected)) {
    expect(Array.isArray(actual), `${path} should be array`).toBe(true);
    const actualArr = actual as unknown[];
    expect(actualArr.length, `${path}.length`).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      assertMatchesFixture(actualArr[i], expected[i], `${path}[${i}]`);
    }
    return;
  }

  expect(actual !== null && typeof actual === 'object', `${path} should be object`).toBe(true);
  const actualObj = actual as Record<string, unknown>;
  const expectedObj = expected as Record<string, unknown>;
  expect(Object.keys(actualObj).sort(), `${path} keys`).toEqual(Object.keys(expectedObj).sort());
  for (const key of Object.keys(expectedObj)) {
    assertMatchesFixture(actualObj[key], expectedObj[key], `${path}.${key}`);
  }
}

describe('Golden-Master Regression Suite (all 10 calculators, 69 scenarios)', () => {
  it.each((rentVsBuyFixture as FixtureFile<any, any>).scenarios)(
    'rent-vs-buy: $id — $description',
    (scenario) => {
      const actual = calculateRentVsBuy(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((jobOfferFixture as FixtureFile<any, any>).scenarios)(
    'job-offer: $id — $description',
    (scenario) => {
      const actual = compareJobOffers(scenario.input.offerA, scenario.input.offerB);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((leaseVsBuyFixture as FixtureFile<any, any>).scenarios)(
    'lease-vs-buy: $id — $description',
    (scenario) => {
      const actual = calculateLeaseVsBuy(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((gasVsEvFixture as FixtureFile<any, any>).scenarios)(
    'gas-vs-ev: $id — $description',
    (scenario) => {
      const actual = calculateGasVsEv(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((buyVsRepairFixture as FixtureFile<any, any>).scenarios)(
    'buy-vs-repair: $id — $description',
    (scenario) => {
      const actual = calculateBuyVsRepair(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((diyVsHireFixture as FixtureFile<any, any>).scenarios)(
    'diy-vs-hire: $id — $description',
    (scenario) => {
      const actual = calculateDiyVsHire(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((debtVsInvestFixture as FixtureFile<any, any>).scenarios)(
    'debt-vs-invest: $id — $description',
    (scenario) => {
      const actual = calculateDebtVsInvest(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((buyVsSubscribeFixture as FixtureFile<any, any>).scenarios)(
    'buy-vs-subscribe: $id — $description',
    (scenario) => {
      const actual = calculateBuyVsSubscribe(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((newVsUsedFixture as FixtureFile<any, any>).scenarios)(
    'new-vs-used: $id — $description',
    (scenario) => {
      const actual = calculateNewVsUsed(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );

  it.each((bulkBuyFixture as FixtureFile<any, any>).scenarios)(
    'bulk-buy: $id — $description',
    (scenario) => {
      const actual = calculateBulkBuy(scenario.input);
      assertMatchesFixture(actual, scenario.expected);
    }
  );
});

describe('Golden-Master Comparator & Precision Verification', () => {
  it('enforces exact Object.is integer equality and rejects off-by-1 or -0 discrepancies', () => {
    expect(() => assertMatchesFixture({ count: 10 }, { count: 10 })).not.toThrow();
    expect(() => assertMatchesFixture({ count: 11 }, { count: 10 })).toThrow();
    expect(() => assertMatchesFixture({ count: 10.000001 }, { count: 10 })).toThrow();
    expect(() => assertMatchesFixture({ count: -0 }, { count: 0 })).toThrow();

    // 4 engines emit exclusively integer numeric metrics across all fixture scenarios
    const rent = calculateRentVsBuy(RENT_VS_BUY_DEFAULTS);
    expect(Number.isInteger(rent.totalRentCost)).toBe(true);
    expect(Number.isInteger(rent.netOwnershipCost)).toBe(true);
    expect(Number.isInteger(rent.netDifference)).toBe(true);
  });

  it('enforces 6-decimal floating-point tolerance and rejects larger deviations', () => {
    expect(() => assertMatchesFixture({ rate: 0.12345678 }, { rate: 0.1234567 })).not.toThrow();
    expect(() => assertMatchesFixture({ rate: 0.12346 }, { rate: 0.12345 })).toThrow();

    const gasEv = calculateGasVsEv(GAS_VS_EV_DEFAULTS);
    expect(gasEv.gasFuelCostPerMile).toBeCloseTo(0.126, 6);
    expect(gasEv.evElectricityCostPerMile).toBeCloseTo(0.052, 6);

    const diy = calculateDiyVsHire(DIY_VS_HIRE_DEFAULTS);
    expect(diy.breakEvenHourlyRate).toBeCloseTo(39.25, 6);
  });

  it('detects missing or unexpected result fields strictly', () => {
    expect(() => assertMatchesFixture({ a: 1 }, { a: 1, b: 2 })).toThrow();
    expect(() => assertMatchesFixture({ a: 1, b: 2, extra: 3 }, { a: 1, b: 2 })).toThrow();
  });

  it('verifies nested breakdown arrays and breakdown object schemas across engines', () => {
    const rent = calculateRentVsBuy(RENT_VS_BUY_DEFAULTS);
    expect(rent.breakdown).toHaveLength(RENT_VS_BUY_DEFAULTS.horizonYears);
    expect(rent.breakdown.map((r) => r.year)).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const lease = calculateLeaseVsBuy(LEASE_VS_BUY_DEFAULTS);
    expect(lease.breakdown.map((r) => r.month)).toEqual([6, 12, 18, 24, 30, 36]);

    const debt = calculateDebtVsInvest(DEBT_VS_INVEST_DEFAULTS);
    expect(debt.breakdown).toHaveLength(DEBT_VS_INVEST_DEFAULTS.horizonYears);
    expect(debt.breakdown.map((r) => r.year)).toEqual([1, 2, 3, 4, 5]);

    const sub = calculateBuyVsSubscribe(BUY_VS_SUBSCRIBE_DEFAULTS);
    expect(sub.yearlyBreakdown.map((r) => r.year)).toEqual([1, 2, 3]);

    expect(() =>
      assertMatchesFixture(
        { breakdown: [{ year: 1, cost: 100 }] },
        { breakdown: [{ year: 1, cost: 100 }, { year: 2, cost: 200 }] }
      )
    ).toThrow();
    expect(() =>
      assertMatchesFixture(
        { breakdown: [{ year: 1, cost: 101 }] },
        { breakdown: [{ year: 1, cost: 100 }] }
      )
    ).toThrow();
  });

  it('normalizes negative zero (-0) across formatters and engine summaries', () => {
    expect(formatNumber(-0)).toBe('0');
    expect(formatCurrency(-0)).toBe('$0');
    expect(formatSummaryDollar(-0)).toBe('$0');
    expect(formatFixedDecimal(-0, 2)).toBe('0.00');

    const outputs = [
      calculateRentVsBuy({ ...RENT_VS_BUY_DEFAULTS, monthlyRent: -0, homeInsuranceAnnual: -0 }).summaryText,
      compareJobOffers(
        { ...JOB_OFFER_DEFAULTS_A, annualBonus: -0, otherCompensationAnnual: -0 },
        { ...JOB_OFFER_DEFAULTS_B, annualBonus: -0 }
      ).summaryText,
      calculateLeaseVsBuy({ ...LEASE_VS_BUY_DEFAULTS, leaseDownPayment: -0, leaseFees: -0 }).summaryText,
      calculateGasVsEv({ ...GAS_VS_EV_DEFAULTS, gasPricePerGallon: -0, electricityCostPerKwh: -0 }).summaryText,
      calculateBuyVsRepair({ ...BUY_VS_REPAIR_DEFAULTS, repairQuote: -0 }).summaryText,
      calculateDiyVsHire({ ...DIY_VS_HIRE_DEFAULTS, diyMaterialsCost: -0 }).summaryText,
      calculateDebtVsInvest({ ...DEBT_VS_INVEST_DEFAULTS, extraMonthlyCash: -0, debtBalance: -0 }).summaryText,
      calculateBuyVsSubscribe({ ...BUY_VS_SUBSCRIBE_DEFAULTS, purchasePrice: -0 }).summaryText,
      calculateNewVsUsed({ ...NEW_VS_USED_DEFAULTS, newOption: { ...NEW_VS_USED_DEFAULTS.newOption, downPayment: -0 } }).summaryText,
      calculateBulkBuy({ ...BULK_BUY_DEFAULTS, storageCost: -0, expectedWastePercent: -0 }).summaryText,
    ];

    for (const summary of outputs) {
      expect(summary).not.toContain('$-0');
      expect(summary).not.toContain('-$0');
    }
  });

  it('produces deterministic en-US summary formatting across engines', () => {
    const rentSummary = calculateRentVsBuy(RENT_VS_BUY_DEFAULTS).summaryText;
    const jobSummary = compareJobOffers(JOB_OFFER_DEFAULTS_A, JOB_OFFER_DEFAULTS_B).summaryText;
    const newUsedSummary = calculateNewVsUsed(NEW_VS_USED_DEFAULTS).summaryText;
    const bulkSummary = calculateBulkBuy(BULK_BUY_DEFAULTS).summaryText;

    expect(rentSummary).toContain('$220,679');
    expect(jobSummary).toContain('$112,885');
    expect(jobSummary).toContain('$1,915');
    expect(newUsedSummary).toContain('$41,971');
    expect(newUsedSummary).toContain('$7,203');
    expect(bulkSummary).toContain('$11.60');
  });
});

describe('Supplementary engine helper behavior', () => {
  it('calculateMonthlyMortgage handles 0 principal and 0% APR deterministically', () => {
    expect(calculateMonthlyMortgage(0, 6.5, 30)).toBe(0);
    expect(calculateMonthlyMortgage(360000, 0, 30)).toBe(1000);
    expect(Math.round(calculateMonthlyMortgage(360000, 6.5, 30))).toBe(2275);
  });

  it('calculateRentVsBuyCostCategoryTotals reconciles exact cost components without heuristics', () => {
    const result = calculateRentVsBuy(RENT_VS_BUY_DEFAULTS);
    const totals = calculateRentVsBuyCostCategoryTotals(RENT_VS_BUY_DEFAULTS);
    expect(totals.upfrontCapitalAndAcquisition).toBe(
      RENT_VS_BUY_DEFAULTS.downPayment + RENT_VS_BUY_DEFAULTS.closingCostsPurchase
    );
    expect(totals.propertyTaxesAndInsuranceTotal).toBe(
      totals.propertyTaxesTotal + totals.homeInsuranceTotal
    );
    expect(totals.cumulativeRent).toBe(result.totalRentCost);
    expect(totals.propertyTaxesTotal).toBeGreaterThan(0);
    expect(totals.homeInsuranceTotal).toBe(
      RENT_VS_BUY_DEFAULTS.homeInsuranceAnnual * RENT_VS_BUY_DEFAULTS.horizonYears
    );
    expect(totals.maintenanceTotal).toBeGreaterThan(0);
  });

  it('calculateSingleJobOffer computes zero commute cost when vehicle cost per mile is 0', () => {
    const offer = calculateSingleJobOffer({
      title: 'Transit / Walk',
      baseSalary: 90000,
      annualBonus: 0,
      employerMatchPercent: 0,
      employeeContributionForMatchPercent: 0,
      annualHealthInsuranceCost: 0,
      paidVacationDays: 15,
      commuteMilesOneWay: 20,
      commuteDaysPerWeek: 5,
      remoteDaysPerWeek: 0,
      otherCompensationAnnual: 0,
      estimatedVehicleCostPerMile: 0,
      averageCommuteSpeedMph: 30,
      annualWorkWeeks: 50,
    });
    expect(offer.annualCommuteMiles).toBe(10000);
    expect(offer.annualCommuteCost).toBe(0);
    expect(offer.netEffectiveCompensation).toBe(90000);
  });
});
