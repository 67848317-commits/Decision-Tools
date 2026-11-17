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

function issueCodeFor(
  result: { issues?: Array<{ field: string; code: string; message: string }> },
  field: string
): string | undefined {
  return result.issues?.find((i) => i.field === field)?.code;
}

describe('Strict Numeric Parsing (Zero-Preserving)', () => {
  it('parses legitimate zero values cleanly without treating them as empty or invalid', () => {
    expect(parseNumericInput('0')).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0' });
    expect(parseNumericInput('0.00')).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0.00' });
    expect(parseNumericInput(0)).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0' });
    expect(parseNumericInput(-0)).toEqual({ status: 'valid', value: 0, sign: 'zero', raw: '0' });
    expect(parseNumericFieldOrNaN('0')).toBe(0);
    expect(parseNumericFieldOrNaN(0)).toBe(0);
    expect(Object.is(parseNumericFieldOrNaN(-0), 0)).toBe(true);
  });

  it('distinguishes empty strings and null/undefined from invalid non-numeric strings', () => {
    expect(parseNumericInput('')).toMatchObject({ status: 'empty', value: null });
    expect(parseNumericInput('   ')).toMatchObject({ status: 'empty', value: null });
    expect(parseNumericInput(null)).toMatchObject({ status: 'empty', value: null });
    expect(parseNumericInput(undefined)).toMatchObject({ status: 'empty', value: null });

    expect(parseNumericInput('abc')).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput('12px')).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput({})).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput(Number.NaN)).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput(Number.POSITIVE_INFINITY)).toMatchObject({ status: 'invalid', value: null });
    expect(parseNumericInput(Number.NEGATIVE_INFINITY)).toMatchObject({ status: 'invalid', value: null });

    expect(Number.isNaN(parseNumericFieldOrNaN(''))).toBe(true);
    expect(Number.isNaN(parseNumericFieldOrNaN('abc'))).toBe(true);
    expect(Number.isNaN(parseNumericFieldOrNaN('12px'))).toBe(true);
    expect(Number.isNaN(parseNumericFieldOrNaN(Number.POSITIVE_INFINITY))).toBe(true);
  });

  it('validateNumericField and parseAndValidateFields enforce rules without clamping', () => {
    expect(validateNumericField('apr', '0', { label: 'APR', min: 0, max: 25 })).toEqual({
      value: 0,
      issue: null,
    });
    expect(validateNumericField('price', '0', { label: 'Price', exclusiveMin: 0 }).issue?.code).toBe(
      'MUST_BE_POSITIVE'
    );
    expect(validateNumericField('price', '-5', { label: 'Price' }).issue?.code).toBe(
      'NEGATIVE_NOT_ALLOWED'
    );
    expect(validateNumericField('horizon', '0', { label: 'Horizon', min: 1 }).issue?.code).toBe(
      'BELOW_MIN'
    );
    expect(validateNumericField('horizon', '51', { label: 'Horizon', max: 50 }).issue?.code).toBe(
      'ABOVE_MAX'
    );
    expect(validateNumericField('horizon', '3.5', { label: 'Horizon', integer: true }).issue?.code).toBe(
      'MUST_BE_INTEGER'
    );
    expect(validateNumericField('price', '', { label: 'Price', required: true }).issue?.code).toBe(
      'REQUIRED'
    );
    expect(validateNumericField('price', '', { label: 'Price', required: false })).toEqual({
      value: null,
      issue: null,
    });
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

describe('1. Rent vs. Buy Validation', () => {
  it('accepts defaults and valid zeros including negative appreciation within -15%..25%', () => {
    expect(validateRentVsBuyInput(RENT_VS_BUY_DEFAULTS).valid).toBe(true);
    expect(
      validateRentVsBuyInput({
        ...RENT_VS_BUY_DEFAULTS,
        monthlyRent: 0,
        annualRentIncreasePercent: 0,
        downPayment: 0,
        mortgageRatePercent: 0,
        propertyTaxRatePercent: 0,
        homeInsuranceAnnual: 0,
        annualMaintenancePercent: 0,
        closingCostsPurchase: 0,
        expectedAppreciationPercent: -15,
        loanTermYears: 1,
        horizonYears: 50,
      }).valid
    ).toBe(true);
  });

  it('rejects missing, NaN/Infinity, negatives, range violations, decimals on integer years, and downPayment > homePrice', () => {
    const missing = validateRentVsBuyInput({});
    expect(missing.valid).toBe(false);
    expect(issueCodeFor(missing, 'homePrice')).toBe('REQUIRED');

    const badNums = validateRentVsBuyInput({
      ...RENT_VS_BUY_DEFAULTS,
      monthlyRent: Number.NaN,
      homePrice: Number.POSITIVE_INFINITY,
    });
    expect(badNums.valid).toBe(false);
    expect(issueCodeFor(badNums, 'monthlyRent')).toBe('INVALID_NUMBER');
    expect(issueCodeFor(badNums, 'homePrice')).toBe('INVALID_NUMBER');

    const bounds = validateRentVsBuyInput({
      ...RENT_VS_BUY_DEFAULTS,
      monthlyRent: -100,
      annualRentIncreasePercent: 20.1,
      homePrice: 0,
      downPayment: -1,
      mortgageRatePercent: 26,
      loanTermYears: 0,
      propertyTaxRatePercent: 10.5,
      homeInsuranceAnnual: -50,
      annualMaintenancePercent: 11,
      closingCostsPurchase: -10,
      expectedAppreciationPercent: -16,
      horizonYears: 51,
    });
    expect(bounds.valid).toBe(false);
    expect(issueCodeFor(bounds, 'monthlyRent')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'annualRentIncreasePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'homePrice')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(bounds, 'downPayment')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'mortgageRatePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'loanTermYears')).toBe('BELOW_MIN');
    expect(issueCodeFor(bounds, 'propertyTaxRatePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'homeInsuranceAnnual')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'annualMaintenancePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'closingCostsPurchase')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'expectedAppreciationPercent')).toBe('BELOW_MIN');
    expect(issueCodeFor(bounds, 'horizonYears')).toBe('ABOVE_MAX');

    const decimals = validateRentVsBuyInput({
      ...RENT_VS_BUY_DEFAULTS,
      loanTermYears: 30.5,
      horizonYears: 7.25,
    });
    expect(decimals.valid).toBe(false);
    expect(issueCodeFor(decimals, 'loanTermYears')).toBe('MUST_BE_INTEGER');
    expect(issueCodeFor(decimals, 'horizonYears')).toBe('MUST_BE_INTEGER');

    const crossField = validateRentVsBuyInput({
      ...RENT_VS_BUY_DEFAULTS,
      homePrice: 300000,
      downPayment: 300001,
    });
    expect(crossField.valid).toBe(false);
    expect(issueCodeFor(crossField, 'downPayment')).toBe('CROSS_FIELD_CONSTRAINT');
    expect(crossField.errors.downPayment).toContain('exceed home purchase price');
  });
});

describe('2. Job Offer Validation', () => {
  it('accepts defaults, zeros (including $0/mi transit & 5-day remote), and boundary 7-day combined week', () => {
    expect(validateJobOfferInput(JOB_OFFER_DEFAULTS_A, 'Offer A').valid).toBe(true);
    expect(
      validateJobOfferInput(
        {
          ...JOB_OFFER_DEFAULTS_A,
          baseSalary: 0,
          annualBonus: 0,
          employerMatchPercent: 0,
          annualHealthInsuranceCost: 0,
          paidVacationDays: 0,
          commuteMilesOneWay: 0,
          commuteDaysPerWeek: 2,
          remoteDaysPerWeek: 5,
          otherCompensationAnnual: 0,
          estimatedVehicleCostPerMile: 0,
        },
        'Offer A'
      ).valid
    ).toBe(true);
  });

  it('rejects negatives, range violations, NaN/Infinity, and combined commute+remote > 7', () => {
    const missing = validateJobOfferInput({}, 'Offer A');
    expect(missing.valid).toBe(false);
    expect(issueCodeFor(missing, 'baseSalary')).toBe('REQUIRED');

    const bounds = validateJobOfferInput(
      {
        ...JOB_OFFER_DEFAULTS_A,
        baseSalary: -1,
        annualBonus: -100,
        employerMatchPercent: 105,
        annualHealthInsuranceCost: -50,
        paidVacationDays: 101,
        commuteMilesOneWay: 350,
        commuteDaysPerWeek: 8,
        remoteDaysPerWeek: -1,
        otherCompensationAnnual: Number.NaN,
        estimatedVehicleCostPerMile: 12,
      },
      'Offer B'
    );
    expect(bounds.valid).toBe(false);
    expect(issueCodeFor(bounds, 'baseSalary')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'annualBonus')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'employerMatchPercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'annualHealthInsuranceCost')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'paidVacationDays')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'commuteMilesOneWay')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'commuteDaysPerWeek')).toBe('ABOVE_MAX');
    expect(issueCodeFor(bounds, 'remoteDaysPerWeek')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(bounds, 'otherCompensationAnnual')).toBe('INVALID_NUMBER');
    expect(issueCodeFor(bounds, 'estimatedVehicleCostPerMile')).toBe('ABOVE_MAX');
    expect(bounds.errors.baseSalary).toContain('Offer B:');

    const crossField = validateJobOfferInput(
      { ...JOB_OFFER_DEFAULTS_A, commuteDaysPerWeek: 5, remoteDaysPerWeek: 3 },
      'Offer A'
    );
    expect(crossField.valid).toBe(false);
    expect(issueCodeFor(crossField, 'commuteDaysPerWeek')).toBe('CROSS_FIELD_CONSTRAINT');
  });
});

describe('3. Lease vs. Buy Validation', () => {
  it('accepts defaults and valid zeros (0% APR, 0% sales tax, 0 down, 0 residual)', () => {
    expect(validateLeaseVsBuyInput(LEASE_VS_BUY_DEFAULTS).valid).toBe(true);
    expect(
      validateLeaseVsBuyInput({
        ...LEASE_VS_BUY_DEFAULTS,
        leaseDownPayment: 0,
        leaseFees: 0,
        leaseAnnualInsurance: 0,
        leaseAnnualMaintenance: 0,
        purchaseDownPayment: 0,
        loanInterestRatePercent: 0,
        salesTaxPercent: 0,
        buyAnnualInsurance: 0,
        buyAnnualMaintenance: 0,
        vehicleResaleValuePercent: 0,
        analysisTermMonths: 12,
        loanTermMonths: 96,
      }).valid
    ).toBe(true);
  });

  it('rejects out-of-range terms/percentages, decimal months, negatives, NaN, and purchaseDownPayment > purchasePrice', () => {
    const res = validateLeaseVsBuyInput({
      ...LEASE_VS_BUY_DEFAULTS,
      vehicleMSRP: 0,
      analysisTermMonths: 11,
      leaseMonthlyPayment: 0,
      purchasePrice: 30000,
      purchaseDownPayment: 30001,
      loanInterestRatePercent: 36,
      loanTermMonths: 97,
      salesTaxPercent: 26,
      vehicleResaleValuePercent: 101,
    });
    expect(res.valid).toBe(false);
    expect(issueCodeFor(res, 'vehicleMSRP')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'analysisTermMonths')).toBe('BELOW_MIN');
    expect(issueCodeFor(res, 'leaseMonthlyPayment')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'purchaseDownPayment')).toBe('CROSS_FIELD_CONSTRAINT');
    expect(issueCodeFor(res, 'loanInterestRatePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'loanTermMonths')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'salesTaxPercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'vehicleResaleValuePercent')).toBe('ABOVE_MAX');

    const decimalMonths = validateLeaseVsBuyInput({
      ...LEASE_VS_BUY_DEFAULTS,
      analysisTermMonths: 36.5,
      loanTermMonths: 60.2,
    });
    expect(decimalMonths.valid).toBe(false);
    expect(issueCodeFor(decimalMonths, 'analysisTermMonths')).toBe('MUST_BE_INTEGER');
    expect(issueCodeFor(decimalMonths, 'loanTermMonths')).toBe('MUST_BE_INTEGER');
  });
});

describe('4. Gas vs. EV Validation', () => {
  it('accepts defaults and valid zeros ($0 gas, $0/kWh electricity, $0 tax credit/charger)', () => {
    expect(validateGasVsEvInput(GAS_VS_EV_DEFAULTS).valid).toBe(true);
    expect(
      validateGasVsEvInput({
        ...GAS_VS_EV_DEFAULTS,
        annualMiles: 500,
        horizonYears: 20,
        gasPricePerGallon: 0,
        gasAnnualMaintenance: 0,
        gasInsuranceAnnual: 0,
        gasResaleValuePercent: 0,
        electricityCostPerKwh: 0,
        evHomeChargerInstall: 0,
        evTaxCredit: 0,
        evAnnualMaintenance: 0,
        evInsuranceAnnual: 0,
        evResaleValuePercent: 100,
      }).valid
    ).toBe(true);
  });

  it('rejects annualMiles < 500, out-of-range horizon/resale, decimal horizonYears, non-positive efficiency/prices, and negatives', () => {
    const res = validateGasVsEvInput({
      ...GAS_VS_EV_DEFAULTS,
      annualMiles: 499,
      horizonYears: 21,
      gasVehiclePrice: 0,
      gasMpg: 0,
      gasPricePerGallon: -0.5,
      gasResaleValuePercent: 101,
      evVehiclePrice: -1000,
      evEfficiencyMilesPerKwh: 0,
      electricityCostPerKwh: -0.1,
      evHomeChargerInstall: -1,
      evTaxCredit: -1,
      evResaleValuePercent: -5,
    });
    expect(res.valid).toBe(false);
    expect(issueCodeFor(res, 'annualMiles')).toBe('BELOW_MIN');
    expect(issueCodeFor(res, 'horizonYears')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'gasVehiclePrice')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'gasMpg')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'gasPricePerGallon')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'gasResaleValuePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'evVehiclePrice')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'evEfficiencyMilesPerKwh')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'electricityCostPerKwh')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'evResaleValuePercent')).toBe('NEGATIVE_NOT_ALLOWED');

    const decimalHorizon = validateGasVsEvInput({ ...GAS_VS_EV_DEFAULTS, horizonYears: 5.5 });
    expect(decimalHorizon.valid).toBe(false);
    expect(issueCodeFor(decimalHorizon, 'horizonYears')).toBe('MUST_BE_INTEGER');
  });
});

describe('5. Buy vs. Repair Validation', () => {
  it('accepts defaults, valid zeros, and fractional lifespans (e.g. 2.5 or 0.25 years)', () => {
    expect(validateBuyVsRepairInput(BUY_VS_REPAIR_DEFAULTS).valid).toBe(true);
    expect(
      validateBuyVsRepairInput({
        ...BUY_VS_REPAIR_DEFAULTS,
        repairQuote: 0,
        expectedLifespanAfterRepairYears: 0.25,
        currentAnnualOperatingCost: 0,
        subsequentRepairRiskPercent: 0,
        subsequentRepairCost: 0,
        installationAndDisposalFee: 0,
        replacementExpectedLifespanYears: 5.5,
        replacementAnnualOperatingCost: 0,
      }).valid
    ).toBe(true);
  });

  it('rejects negatives, zero lifespans/replacementPrice, and risk > 100%', () => {
    const res = validateBuyVsRepairInput({
      ...BUY_VS_REPAIR_DEFAULTS,
      repairQuote: -10,
      expectedLifespanAfterRepairYears: 0,
      currentAnnualOperatingCost: -1,
      subsequentRepairRiskPercent: 105,
      subsequentRepairCost: -5,
      replacementPrice: 0,
      installationAndDisposalFee: -1,
      replacementExpectedLifespanYears: 0,
      replacementAnnualOperatingCost: Number.NaN,
    });
    expect(res.valid).toBe(false);
    expect(issueCodeFor(res, 'repairQuote')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'expectedLifespanAfterRepairYears')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'subsequentRepairRiskPercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'replacementPrice')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'replacementExpectedLifespanYears')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'replacementAnnualOperatingCost')).toBe('INVALID_NUMBER');
  });
});

describe('6. DIY vs. Hire Validation', () => {
  it('accepts defaults and valid zeros across DIY cost/hour/risk fields', () => {
    expect(validateDiyVsHireInput(DIY_VS_HIRE_DEFAULTS).valid).toBe(true);
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
  });

  it('rejects negatives, rework risk > 100%, and non-positive contractor quote', () => {
    const res = validateDiyVsHireInput({
      ...DIY_VS_HIRE_DEFAULTS,
      diyMaterialsCost: -1,
      diyToolsEquipmentCost: -1,
      diyEstimatedHours: -1,
      personalHourlyRate: -1,
      diyReworkRiskPercent: 101,
      contractorQuote: 0,
      homeownerCoordinationHours: -0.5,
    });
    expect(res.valid).toBe(false);
    expect(issueCodeFor(res, 'diyMaterialsCost')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'diyToolsEquipmentCost')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'diyEstimatedHours')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'personalHourlyRate')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'diyReworkRiskPercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'contractorQuote')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'homeownerCoordinationHours')).toBe('NEGATIVE_NOT_ALLOWED');
  });
});

describe('7. Debt vs. Invest Validation', () => {
  it('accepts defaults, valid zeros, and negative investment returns down to -50%', () => {
    expect(validateDebtVsInvestInput(DEBT_VS_INVEST_DEFAULTS).valid).toBe(true);
    expect(
      validateDebtVsInvestInput({
        ...DEBT_VS_INVEST_DEFAULTS,
        extraMonthlyCash: 0,
        debtBalance: 0,
        debtInterestRatePercent: 0,
        expectedInvestmentReturnPercent: -50,
        investmentTaxRatePercent: 0,
        horizonYears: 30,
      }).valid
    ).toBe(true);
  });

  it('rejects negatives, non-positive minimum payment, out-of-range returns/taxes/horizon, and decimal horizonYears', () => {
    const res = validateDebtVsInvestInput({
      ...DEBT_VS_INVEST_DEFAULTS,
      extraMonthlyCash: -1,
      debtBalance: -1,
      debtInterestRatePercent: 101,
      debtMinimumMonthlyPayment: 0,
      expectedInvestmentReturnPercent: -51,
      investmentTaxRatePercent: 101,
      horizonYears: 31,
    });
    expect(res.valid).toBe(false);
    expect(issueCodeFor(res, 'extraMonthlyCash')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'debtBalance')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'debtInterestRatePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'debtMinimumMonthlyPayment')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'expectedInvestmentReturnPercent')).toBe('BELOW_MIN');
    expect(issueCodeFor(res, 'investmentTaxRatePercent')).toBe('ABOVE_MAX');
    expect(issueCodeFor(res, 'horizonYears')).toBe('ABOVE_MAX');

    const decimalHorizon = validateDebtVsInvestInput({
      ...DEBT_VS_INVEST_DEFAULTS,
      horizonYears: 5.5,
    });
    expect(decimalHorizon.valid).toBe(false);
    expect(issueCodeFor(decimalHorizon, 'horizonYears')).toBe('MUST_BE_INTEGER');
  });
});

describe('8. Buy vs. Subscribe Validation', () => {
  it('accepts defaults, valid zeros, fractional horizonYears (0.5), and annual billingCycle', () => {
    expect(validateBuyVsSubscribeInput(BUY_VS_SUBSCRIBE_DEFAULTS).valid).toBe(true);
    expect(
      validateBuyVsSubscribeInput({
        ...BUY_VS_SUBSCRIBE_DEFAULTS,
        horizonYears: 0.5,
        purchasePrice: 0,
        setupOrActivationCost: 0,
        annualMaintenanceCost: 0,
        estimatedResaleValue: 0,
        billingCycle: 'annual',
        annualSubscriptionPrice: 0,
        signupFee: 0,
        annualRecurringFees: 0,
      }).valid
    ).toBe(true);
  });

  it('rejects horizon <= 0 or > 25, negatives, active billing cycle price < 0, and resale > acquisition cost', () => {
    const tooLong = validateBuyVsSubscribeInput({
      ...BUY_VS_SUBSCRIBE_DEFAULTS,
      horizonYears: 26,
      billingCycle: 'annual',
      annualSubscriptionPrice: -10,
    });
    expect(tooLong.valid).toBe(false);
    expect(issueCodeFor(tooLong, 'horizonYears')).toBe('ABOVE_MAX');
    expect(issueCodeFor(tooLong, 'annualSubscriptionPrice')).toBe('NEGATIVE_NOT_ALLOWED');

    const resaleCross = validateBuyVsSubscribeInput({
      ...BUY_VS_SUBSCRIBE_DEFAULTS,
      horizonYears: 0,
      purchasePrice: 500,
      setupOrActivationCost: 50,
      estimatedResaleValue: 600,
    });
    expect(resaleCross.valid).toBe(false);
    expect(issueCodeFor(resaleCross, 'horizonYears')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(resaleCross, 'estimatedResaleValue')).toBe('CROSS_FIELD_CONSTRAINT');
  });
});

describe('9. New vs. Used Validation', () => {
  it('accepts defaults and valid zeros across vehicle options', () => {
    expect(validateNewVsUsedInput(NEW_VS_USED_DEFAULTS).valid).toBe(true);
    expect(
      validateNewVsUsedInput({
        ...NEW_VS_USED_DEFAULTS,
        horizonYears: 1,
        newOption: {
          ...NEW_VS_USED_DEFAULTS.newOption,
          downPayment: 0,
          financingApr: 0,
          annualInsurance: 0,
          annualMaintenance: 0,
          annualOperatingCost: 0,
          expectedResaleValue: 0,
        },
        usedOption: {
          ...NEW_VS_USED_DEFAULTS.usedOption,
          downPayment: 0,
          financingApr: 0,
          annualInsurance: 0,
          annualMaintenance: 0,
          annualOperatingCost: 0,
          expectedResaleValue: 0,
        },
      }).valid
    ).toBe(true);
  });

  it('rejects missing options, horizon out of bounds, decimals on years/months, negatives, and downPayment > purchasePrice', () => {
    const missingOpts = validateNewVsUsedInput({ horizonYears: 5 });
    expect(missingOpts.valid).toBe(false);
    expect(issueCodeFor(missingOpts, 'newPurchasePrice')).toBe('REQUIRED');
    expect(issueCodeFor(missingOpts, 'usedPurchasePrice')).toBe('REQUIRED');

    const invalid = validateNewVsUsedInput({
      horizonYears: 21,
      newOption: {
        ...NEW_VS_USED_DEFAULTS.newOption,
        purchasePrice: 20000,
        downPayment: 25000,
        financingApr: -1,
        loanTermMonths: 60.5,
      },
      usedOption: {
        ...NEW_VS_USED_DEFAULTS.usedOption,
        purchasePrice: 0,
        loanTermMonths: 0,
      },
    });
    expect(invalid.valid).toBe(false);
    expect(issueCodeFor(invalid, 'horizonYears')).toBe('ABOVE_MAX');
    expect(issueCodeFor(invalid, 'newDownPayment')).toBe('CROSS_FIELD_CONSTRAINT');
    expect(issueCodeFor(invalid, 'newFinancingApr')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(invalid, 'newLoanTermMonths')).toBe('MUST_BE_INTEGER');
    expect(issueCodeFor(invalid, 'usedPurchasePrice')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(invalid, 'usedLoanTermMonths')).toBe('BELOW_MIN');

    const decimalHorizon = validateNewVsUsedInput({ ...NEW_VS_USED_DEFAULTS, horizonYears: 5.5 });
    expect(decimalHorizon.valid).toBe(false);
    expect(issueCodeFor(decimalHorizon, 'horizonYears')).toBe('MUST_BE_INTEGER');
  });
});

describe('10. Bulk Buy Validation', () => {
  it('accepts defaults and valid zeros for storageCost and expectedWastePercent', () => {
    expect(validateBulkBuyInput(BULK_BUY_DEFAULTS).valid).toBe(true);
    expect(
      validateBulkBuyInput({
        ...BULK_BUY_DEFAULTS,
        storageCost: 0,
        expectedWastePercent: 0,
      }).valid
    ).toBe(true);
  });

  it('rejects quantities < 1 or non-integer, waste >= 100%, negatives, and bulkQuantity < normalQuantity', () => {
    const res = validateBulkBuyInput({
      ...BULK_BUY_DEFAULTS,
      normalUnitPrice: 0,
      normalQuantity: 10,
      bulkPackagePrice: 0,
      bulkQuantity: 4,
      expectedMonthlyUsage: 0,
      storageCost: -5,
      expectedWastePercent: 100,
    });
    expect(res.valid).toBe(false);
    expect(issueCodeFor(res, 'normalUnitPrice')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'bulkPackagePrice')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'bulkQuantity')).toBe('CROSS_FIELD_CONSTRAINT');
    expect(issueCodeFor(res, 'expectedMonthlyUsage')).toBe('MUST_BE_POSITIVE');
    expect(issueCodeFor(res, 'storageCost')).toBe('NEGATIVE_NOT_ALLOWED');
    expect(issueCodeFor(res, 'expectedWastePercent')).toBe('ABOVE_MAX');

    const fractionalQty = validateBulkBuyInput({
      ...BULK_BUY_DEFAULTS,
      normalQuantity: 0.5,
      bulkQuantity: 12.5,
    });
    expect(fractionalQty.valid).toBe(false);
    expect(issueCodeFor(fractionalQty, 'normalQuantity')).toBe('BELOW_MIN');
    expect(issueCodeFor(fractionalQty, 'bulkQuantity')).toBe('MUST_BE_INTEGER');
  });
});
