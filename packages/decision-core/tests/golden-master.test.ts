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
