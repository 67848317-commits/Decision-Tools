import { describe, expect, it } from 'vitest';
import {
  parseAndValidateFields,
  parseNumericFieldOrNaN,
  parseNumericInput,
  validateBulkBuyInput,
  validateBuyVsRepairInput,
  validateBuyVsSubscribeInput,
  validateDebtVsInvestInput,
  validateDiyVsHireInput,
  validateGasVsEvInput,
  validateJobOfferInput,
  validateLeaseVsBuyInput,
  validateNewVsUsedInput,
  validateNumericField,
  validateRentVsBuyInput,
} from '@decision-tools/validation';
import {
  BULK_BUY_DEFAULTS,
  BUY_VS_REPAIR_DEFAULTS,
  BUY_VS_SUBSCRIBE_DEFAULTS,
  DEBT_VS_INVEST_DEFAULTS,
  DIY_VS_HIRE_DEFAULTS,
  GAS_VS_EV_DEFAULTS,
  JOB_OFFER_DEFAULTS_A,
  LEASE_VS_BUY_DEFAULTS,
  NEW_VS_USED_DEFAULTS,
  RENT_VS_BUY_DEFAULTS,
} from '@decision-tools/decision-core';

describe('Strict Numeric Parsing (Zero-Preserving)', () => {
  it('parses legitimate zero values cleanly without treating them as empty or invalid', () => {
    expect(parseNumericInput('0')).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0' });
    expect(parseNumericInput('0.00')).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0.00' });
    expect(parseNumericInput(0)).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0' });
    expect(parseNumericInput(-0)).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0' });
    expect(parseNumericFieldOrNaN('0')).toBe(0);
    expect(parseNumericFieldOrNaN(0)).toBe(0);
  });

  it('distinguishes empty strings and null/undefined from invalid non-numeric strings', () => {
    expect(parseNumericInput('')).toMatchObject({ status: 'empty', value: null });
    expect(parseNumericInput('   ')).toMatchObject({ status: 'empty', value: null });
    expect(parseNumericInput(null)).toMatchObject({ status: 'empty', value: null });
    expect(parseNumericInput(undefined)).toMatchObject({ status: 'empty', value: null });

    expect(parseNumericInput('abc')).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput('12px')).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput(Number.NaN)).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput(Number.POSITIVE_INFINITY)).toMatchObject({ status: 'invalid', value: null });

    expect(Number.isNaN(parseNumericFieldOrNaN(''))).toBe(true);
    expect(Number.isNaN(parseNumericFieldOrNaN('abc'))).toBe(true);
    expect(Number.isNaN(parseNumericFieldOrNaN('12px'))).toBe(true);
  });

  it('validateNumericField and parseAndValidateFields enforce rules without clamping', () => {
    expect(validateNumericField('apr', '0', { label: 'APR', min: 0, max: 25 })).toEqual({
      value: 0,
      issue: null,
    });
    expect(validateNumericField('price', '0', { label: 'Price', exclusiveMin: 0 }).issue?.code).toBe(
      'MUST_BE_POSITIVE'
    );
    expect(validateNumericField('price', '', { label: 'Price', required: true }).issue?.code).toBe(
      'REQUIRED'
    );
    expect(validateNumericField('price', '12px', { label: 'Price' }).issue?.code).toBe(
      'INVALID_NUMBER'
    );

    const mapResult = parseAndValidateFields({
      downPayment: { raw: '0', rule: { label: 'Down payment', min: 0 } },
      rate: { raw: '', rule: { label: 'Rate', min: 0 } },
    });
    expect(mapResult.valid).toBe(false);
    expect(mapResult.values.downPayment).toBe(0);
    expect(mapResult.errors.rate).toBe('Rate is required.');
  });
});

describe('All 10 Calculator Validators (Valid Zeros, Boundaries & Cross-Field Rules)', () => {
  it('accepts all default calculator inputs', () => {
    expect(validateRentVsBuyInput(RENT_VS_BUY_DEFAULTS).valid).toBe(true);
    expect(validateJobOfferInput(JOB_OFFER_DEFAULTS_A, 'Offer A').valid).toBe(true);
    expect(validateLeaseVsBuyInput(LEASE_VS_BUY_DEFAULTS).valid).toBe(true);
    expect(validateGasVsEvInput(GAS_VS_EV_DEFAULTS).valid).toBe(true);
    expect(validateBuyVsRepairInput(BUY_VS_REPAIR_DEFAULTS).valid).toBe(true);
    expect(validateDiyVsHireInput(DIY_VS_HIRE_DEFAULTS).valid).toBe(true);
    expect(validateDebtVsInvestInput(DEBT_VS_INVEST_DEFAULTS).valid).toBe(true);
    expect(validateBuyVsSubscribeInput(BUY_VS_SUBSCRIBE_DEFAULTS).valid).toBe(true);
    expect(validateNewVsUsedInput(NEW_VS_USED_DEFAULTS).valid).toBe(true);
    expect(validateBulkBuyInput(BULK_BUY_DEFAULTS).valid).toBe(true);
  });

  it('preserves valid zero values across calculators', () => {
    expect(
      validateRentVsBuyInput({
        ...RENT_VS_BUY_DEFAULTS,
        monthlyRent: 0,
        downPayment: 0,
        mortgageRatePercent: 0,
        propertyTaxRatePercent: 0,
        homeInsuranceAnnual: 0,
        annualMaintenancePercent: 0,
        closingCostsPurchase: 0,
        expectedAppreciationPercent: 0,
      }).valid
    ).toBe(true);

    expect(
      validateLeaseVsBuyInput({
        ...LEASE_VS_BUY_DEFAULTS,
        leaseDownPayment: 0,
        leaseFees: 0,
        purchaseDownPayment: 0,
        loanInterestRatePercent: 0,
        salesTaxPercent: 0,
        vehicleResaleValuePercent: 0,
      }).valid
    ).toBe(true);

    expect(
      validateGasVsEvInput({
        ...GAS_VS_EV_DEFAULTS,
        gasPricePerGallon: 0,
        electricityCostPerKwh: 0,
        evHomeChargerInstall: 0,
        evTaxCredit: 0,
        gasAnnualMaintenance: 0,
        evAnnualMaintenance: 0,
      }).valid
    ).toBe(true);

    expect(
      validateDebtVsInvestInput({
        ...DEBT_VS_INVEST_DEFAULTS,
        extraMonthlyCash: 0,
        debtBalance: 0,
        debtInterestRatePercent: 0,
        expectedInvestmentReturnPercent: 0,
        investmentTaxRatePercent: 0,
      }).valid
    ).toBe(true);

    expect(
      validateBuyVsRepairInput({
        ...BUY_VS_REPAIR_DEFAULTS,
        repairQuote: 0,
        currentAnnualOperatingCost: 0,
        subsequentRepairRiskPercent: 0,
        subsequentRepairCost: 0,
        installationAndDisposalFee: 0,
        replacementAnnualOperatingCost: 0,
      }).valid
    ).toBe(true);

    expect(
      validateDiyVsHireInput({
        ...DIY_VS_HIRE_DEFAULTS,
        diyMaterialsCost: 0,
        diyToolsEquipmentCost: 0,
        diyEstimatedHours: 0,
        personalHourlyRate: 0,
        diyReworkRiskPercent: 0,
        homeownerCoordinationHours: 0,
      }).valid
    ).toBe(true);

    expect(
      validateBuyVsSubscribeInput({
        ...BUY_VS_SUBSCRIBE_DEFAULTS,
        purchasePrice: 0,
        setupOrActivationCost: 0,
        annualMaintenanceCost: 0,
        estimatedResaleValue: 0,
        monthlySubscriptionPrice: 0,
        signupFee: 0,
        annualRecurringFees: 0,
      }).valid
    ).toBe(true);

    expect(
      validateNewVsUsedInput({
        ...NEW_VS_USED_DEFAULTS,
        newOption: {
          ...NEW_VS_USED_DEFAULTS.newOption,
          downPayment: 0,
          financingApr: 0,
          annualInsurance: 0,
          annualMaintenance: 0,
          annualOperatingCost: 0,
          expectedResaleValue: 0,
        },
      }).valid
    ).toBe(true);

    expect(
      validateBulkBuyInput({
        ...BULK_BUY_DEFAULTS,
        storageCost: 0,
        expectedWastePercent: 0,
      }).valid
    ).toBe(true);
  });

  it('rejects NaN, negatives, out-of-range boundaries, and cross-field violations', () => {
    const rentInvalid = validateRentVsBuyInput({
      ...RENT_VS_BUY_DEFAULTS,
      homePrice: 200000,
      downPayment: 250000,
      horizonYears: Number.NaN,
    });
    expect(rentInvalid.valid).toBe(false);
    expect(rentInvalid.errors.downPayment).toContain('exceed home purchase price');
    expect(rentInvalid.errors.horizonYears).toBeDefined();

    const jobInvalid = validateJobOfferInput(
      { ...JOB_OFFER_DEFAULTS_A, commuteDaysPerWeek: 5, remoteDaysPerWeek: 4 },
      'Offer A'
    );
    expect(jobInvalid.valid).toBe(false);
    expect(jobInvalid.errors.commuteDaysPerWeek).toContain('7 days');

    const leaseInvalid = validateLeaseVsBuyInput({
      ...LEASE_VS_BUY_DEFAULTS,
      purchasePrice: 30000,
      purchaseDownPayment: 35000,
      loanInterestRatePercent: -1,
    });
    expect(leaseInvalid.valid).toBe(false);
    expect(leaseInvalid.errors.purchaseDownPayment).toBeDefined();
    expect(leaseInvalid.errors.loanInterestRatePercent).toBeDefined();

    const bulkInvalid = validateBulkBuyInput({
      ...BULK_BUY_DEFAULTS,
      normalQuantity: 10,
      bulkQuantity: 4,
      expectedWastePercent: 100,
    });
    expect(bulkInvalid.valid).toBe(false);
    expect(bulkInvalid.errors.bulkQuantity).toBeDefined();
    expect(bulkInvalid.errors.expectedWastePercent).toBeDefined();
  });
});
