import type {
  BulkBuyInput,
  BuyVsRepairInput,
  BuyVsSubscribeInput,
  DebtVsInvestInput,
  DiyVsHireInput,
  GasVsEvInput,
  JobOfferDetails,
  LeaseVsBuyInput,
  NewVsUsedInput,
  RentVsBuyInput,
  ValidationErrorCode,
  ValidationIssue,
  ValidationResult,
  VehicleOrAssetOption,
} from '@decision-tools/shared-types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function addError(
  errors: Record<string, string>,
  issues: ValidationIssue[],
  field: string,
  code: ValidationErrorCode,
  message: string
) {
  if (!(field in errors)) {
    errors[field] = message;
  }
  issues.push({ field, code, message });
}

interface NumberRuleSpec {
  allowNegative?: boolean;
  min?: number;
  exclusiveMin?: number;
  max?: number;
  exclusiveMax?: number;
  integer?: boolean;
  requiredMessage?: string;
  invalidMessage?: string;
  rangeMessage: string;
  integerMessage?: string;
}

function checkNumberRule(
  errors: Record<string, string>,
  issues: ValidationIssue[],
  field: string,
  value: unknown,
  spec: NumberRuleSpec
): value is number {
  if (value === undefined || value === null) {
    addError(
      errors,
      issues,
      field,
      'REQUIRED',
      spec.requiredMessage ?? spec.rangeMessage
    );
    return false;
  }

  if (!isFiniteNumber(value)) {
    addError(
      errors,
      issues,
      field,
      'INVALID_NUMBER',
      spec.invalidMessage ?? spec.rangeMessage
    );
    return false;
  }

  if (!spec.allowNegative && value < 0) {
    const code: ValidationErrorCode =
      spec.exclusiveMin === 0 ? 'MUST_BE_POSITIVE' : 'NEGATIVE_NOT_ALLOWED';
    addError(errors, issues, field, code, spec.rangeMessage);
    return false;
  }

  if (spec.exclusiveMin !== undefined && value <= spec.exclusiveMin) {
    const code: ValidationErrorCode =
      spec.exclusiveMin === 0 ? 'MUST_BE_POSITIVE' : 'BELOW_MIN';
    addError(errors, issues, field, code, spec.rangeMessage);
    return false;
  }

  if (spec.min !== undefined && value < spec.min) {
    addError(errors, issues, field, 'BELOW_MIN', spec.rangeMessage);
    return false;
  }

  if (spec.exclusiveMax !== undefined && value >= spec.exclusiveMax) {
    addError(errors, issues, field, 'ABOVE_MAX', spec.rangeMessage);
    return false;
  }

  if (spec.max !== undefined && value > spec.max) {
    addError(errors, issues, field, 'ABOVE_MAX', spec.rangeMessage);
    return false;
  }

  if (spec.integer && !Number.isInteger(value)) {
    addError(
      errors,
      issues,
      field,
      'MUST_BE_INTEGER',
      spec.integerMessage ?? `${field} must be a whole number.`
    );
    return false;
  }

  return true;
}

export function validateRentVsBuyInput(input: Partial<RentVsBuyInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'monthlyRent', input.monthlyRent, {
    min: 0,
    rangeMessage: 'Monthly rent must be 0 or greater.',
  });
  checkNumberRule(
    errors,
    issues,
    'annualRentIncreasePercent',
    input.annualRentIncreasePercent,
    {
      min: 0,
      max: 20,
      rangeMessage: 'Annual rent increase must be between 0% and 20%.',
    }
  );
  const hasValidHomePrice = checkNumberRule(errors, issues, 'homePrice', input.homePrice, {
    exclusiveMin: 0,
    rangeMessage: 'Home price must be greater than $0.',
  });
  const hasValidDownPayment = checkNumberRule(errors, issues, 'downPayment', input.downPayment, {
    min: 0,
    rangeMessage: 'Down payment cannot be negative.',
  });
  if (hasValidHomePrice && hasValidDownPayment && input.downPayment! > input.homePrice!) {
    addError(
      errors,
      issues,
      'downPayment',
      'CROSS_FIELD_CONSTRAINT',
      'Down payment cannot exceed home purchase price.'
    );
  }
  checkNumberRule(errors, issues, 'mortgageRatePercent', input.mortgageRatePercent, {
    min: 0,
    max: 25,
    rangeMessage: 'Mortgage rate must be between 0% and 25%.',
  });
  checkNumberRule(errors, issues, 'loanTermYears', input.loanTermYears, {
    min: 1,
    max: 50,
    integer: true,
    rangeMessage: 'Loan term must be between 1 and 50 years.',
    integerMessage: 'Loan term must be a whole number of years.',
  });
  checkNumberRule(
    errors,
    issues,
    'propertyTaxRatePercent',
    input.propertyTaxRatePercent,
    {
      min: 0,
      max: 10,
      rangeMessage: 'Property tax rate must be between 0% and 10%.',
    }
  );
  checkNumberRule(errors, issues, 'homeInsuranceAnnual', input.homeInsuranceAnnual, {
    min: 0,
    rangeMessage: 'Home insurance must be 0 or greater.',
  });
  checkNumberRule(
    errors,
    issues,
    'annualMaintenancePercent',
    input.annualMaintenancePercent,
    {
      min: 0,
      max: 10,
      rangeMessage: 'Maintenance rate must be between 0% and 10%.',
    }
  );
  checkNumberRule(errors, issues, 'closingCostsPurchase', input.closingCostsPurchase, {
    min: 0,
    rangeMessage: 'Closing costs cannot be negative.',
  });
  checkNumberRule(
    errors,
    issues,
    'expectedAppreciationPercent',
    input.expectedAppreciationPercent,
    {
      allowNegative: true,
      min: -15,
      max: 25,
      rangeMessage: 'Expected appreciation must be between -15% and 25%.',
    }
  );
  checkNumberRule(errors, issues, 'horizonYears', input.horizonYears, {
    min: 1,
    max: 50,
    integer: true,
    rangeMessage: 'Time horizon must be between 1 and 50 years.',
    integerMessage: 'Time horizon must be a whole number of years.',
  });

  return { valid: issues.length === 0, errors, issues };
}

export function validateJobOfferInput(
  offer: Partial<JobOfferDetails>,
  label = 'Offer'
): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'baseSalary', offer.baseSalary, {
    min: 0,
    rangeMessage: `${label}: Base salary must be $0 or greater.`,
  });
  checkNumberRule(errors, issues, 'annualBonus', offer.annualBonus, {
    min: 0,
    rangeMessage: `${label}: Annual bonus cannot be negative.`,
  });
  checkNumberRule(errors, issues, 'employerMatchPercent', offer.employerMatchPercent, {
    min: 0,
    max: 100,
    rangeMessage: `${label}: 401(k) match must be between 0% and 100%.`,
  });
  checkNumberRule(
    errors,
    issues,
    'annualHealthInsuranceCost',
    offer.annualHealthInsuranceCost,
    {
      min: 0,
      rangeMessage: `${label}: Health insurance cost cannot be negative.`,
    }
  );
  checkNumberRule(errors, issues, 'paidVacationDays', offer.paidVacationDays, {
    min: 0,
    max: 100,
    rangeMessage: `${label}: Vacation days must be between 0 and 100.`,
  });
  checkNumberRule(errors, issues, 'commuteMilesOneWay', offer.commuteMilesOneWay, {
    min: 0,
    max: 300,
    rangeMessage: `${label}: Commute distance must be between 0 and 300 miles.`,
  });
  const hasValidCommuteDays = checkNumberRule(
    errors,
    issues,
    'commuteDaysPerWeek',
    offer.commuteDaysPerWeek,
    {
      min: 0,
      max: 7,
      rangeMessage: `${label}: Commute days must be between 0 and 7.`,
    }
  );
  const hasValidRemoteDays = checkNumberRule(
    errors,
    issues,
    'remoteDaysPerWeek',
    offer.remoteDaysPerWeek,
    {
      min: 0,
      max: 7,
      rangeMessage: `${label}: Remote days must be between 0 and 7.`,
    }
  );
  if (
    hasValidCommuteDays &&
    hasValidRemoteDays &&
    offer.commuteDaysPerWeek! + offer.remoteDaysPerWeek! > 7
  ) {
    addError(
      errors,
      issues,
      'commuteDaysPerWeek',
      'CROSS_FIELD_CONSTRAINT',
      `${label}: Combined commute and remote days cannot exceed 7 days per week.`
    );
  }
  checkNumberRule(errors, issues, 'otherCompensationAnnual', offer.otherCompensationAnnual, {
    min: 0,
    rangeMessage: `${label}: Other compensation cannot be negative.`,
  });
  if (offer.estimatedVehicleCostPerMile !== undefined) {
    checkNumberRule(
      errors,
      issues,
      'estimatedVehicleCostPerMile',
      offer.estimatedVehicleCostPerMile,
      {
        min: 0,
        max: 10,
        rangeMessage: `${label}: Vehicle cost per mile must be between $0.00 and $10.00.`,
      }
    );
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateLeaseVsBuyInput(input: Partial<LeaseVsBuyInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'vehicleMSRP', input.vehicleMSRP, {
    exclusiveMin: 0,
    rangeMessage: 'Vehicle MSRP must be greater than zero.',
  });
  checkNumberRule(errors, issues, 'analysisTermMonths', input.analysisTermMonths, {
    min: 12,
    max: 84,
    integer: true,
    rangeMessage: 'Term must be 12 to 84 months.',
    integerMessage: 'Analysis term must be a whole number of months.',
  });
  checkNumberRule(errors, issues, 'leaseDownPayment', input.leaseDownPayment, {
    min: 0,
    rangeMessage: 'Lease down payment cannot be negative.',
  });
  checkNumberRule(errors, issues, 'leaseMonthlyPayment', input.leaseMonthlyPayment, {
    exclusiveMin: 0,
    rangeMessage: 'Lease payment must be greater than zero.',
  });
  checkNumberRule(errors, issues, 'leaseFees', input.leaseFees, {
    min: 0,
    rangeMessage: 'Lease fees cannot be negative.',
  });
  checkNumberRule(errors, issues, 'leaseAnnualInsurance', input.leaseAnnualInsurance, {
    min: 0,
    rangeMessage: 'Lease insurance cannot be negative.',
  });
  checkNumberRule(errors, issues, 'leaseAnnualMaintenance', input.leaseAnnualMaintenance, {
    min: 0,
    rangeMessage: 'Lease maintenance cannot be negative.',
  });
  const hasValidPurchasePrice = checkNumberRule(
    errors,
    issues,
    'purchasePrice',
    input.purchasePrice,
    {
      exclusiveMin: 0,
      rangeMessage: 'Purchase price must be greater than zero.',
    }
  );
  const hasValidPurchaseDown = checkNumberRule(
    errors,
    issues,
    'purchaseDownPayment',
    input.purchaseDownPayment,
    {
      min: 0,
      rangeMessage: 'Purchase down payment cannot be negative.',
    }
  );
  if (
    hasValidPurchasePrice &&
    hasValidPurchaseDown &&
    input.purchaseDownPayment! > input.purchasePrice!
  ) {
    addError(
      errors,
      issues,
      'purchaseDownPayment',
      'CROSS_FIELD_CONSTRAINT',
      'Purchase down payment cannot exceed purchase price.'
    );
  }
  checkNumberRule(
    errors,
    issues,
    'loanInterestRatePercent',
    input.loanInterestRatePercent,
    {
      min: 0,
      max: 35,
      rangeMessage: 'Loan interest rate must be between 0% and 35%.',
    }
  );
  checkNumberRule(errors, issues, 'loanTermMonths', input.loanTermMonths, {
    min: 1,
    max: 96,
    integer: true,
    rangeMessage: 'Loan term must be between 1 and 96 months.',
    integerMessage: 'Loan term must be a whole number of months.',
  });
  checkNumberRule(errors, issues, 'salesTaxPercent', input.salesTaxPercent, {
    min: 0,
    max: 25,
    rangeMessage: 'Sales tax must be between 0% and 25%.',
  });
  checkNumberRule(errors, issues, 'buyAnnualInsurance', input.buyAnnualInsurance, {
    min: 0,
    rangeMessage: 'Buy insurance cannot be negative.',
  });
  checkNumberRule(errors, issues, 'buyAnnualMaintenance', input.buyAnnualMaintenance, {
    min: 0,
    rangeMessage: 'Buy maintenance cannot be negative.',
  });
  checkNumberRule(
    errors,
    issues,
    'vehicleResaleValuePercent',
    input.vehicleResaleValuePercent,
    {
      min: 0,
      max: 100,
      rangeMessage: 'Residual value must be between 0% and 100%.',
    }
  );

  return { valid: issues.length === 0, errors, issues };
}

export function validateGasVsEvInput(input: Partial<GasVsEvInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'annualMiles', input.annualMiles, {
    min: 500,
    rangeMessage: 'Enter at least 500 annual miles.',
  });
  checkNumberRule(errors, issues, 'horizonYears', input.horizonYears, {
    min: 1,
    max: 20,
    integer: true,
    rangeMessage: 'Horizon must be 1 to 20 years.',
    integerMessage: 'Horizon must be a whole number of years.',
  });
  checkNumberRule(errors, issues, 'gasVehiclePrice', input.gasVehiclePrice, {
    exclusiveMin: 0,
    rangeMessage: 'Gas car price must be greater than zero.',
  });
  checkNumberRule(errors, issues, 'gasMpg', input.gasMpg, {
    exclusiveMin: 0,
    rangeMessage: 'MPG must be greater than zero.',
  });
  checkNumberRule(errors, issues, 'gasPricePerGallon', input.gasPricePerGallon, {
    min: 0,
    rangeMessage: 'Gas price cannot be negative.',
  });
  checkNumberRule(errors, issues, 'gasAnnualMaintenance', input.gasAnnualMaintenance, {
    min: 0,
    rangeMessage: 'Gas maintenance cannot be negative.',
  });
  checkNumberRule(errors, issues, 'gasInsuranceAnnual', input.gasInsuranceAnnual, {
    min: 0,
    rangeMessage: 'Gas insurance cannot be negative.',
  });
  checkNumberRule(errors, issues, 'gasResaleValuePercent', input.gasResaleValuePercent, {
    min: 0,
    max: 100,
    rangeMessage: 'Gas resale percentage must be between 0% and 100%.',
  });
  checkNumberRule(errors, issues, 'evVehiclePrice', input.evVehiclePrice, {
    exclusiveMin: 0,
    rangeMessage: 'EV price must be greater than zero.',
  });
  checkNumberRule(
    errors,
    issues,
    'evEfficiencyMilesPerKwh',
    input.evEfficiencyMilesPerKwh,
    {
      exclusiveMin: 0,
      rangeMessage: 'Efficiency must be greater than zero.',
    }
  );
  checkNumberRule(errors, issues, 'electricityCostPerKwh', input.electricityCostPerKwh, {
    min: 0,
    rangeMessage: 'Electricity cost cannot be negative.',
  });
  checkNumberRule(errors, issues, 'evHomeChargerInstall', input.evHomeChargerInstall, {
    min: 0,
    rangeMessage: 'Charger install cost cannot be negative.',
  });
  checkNumberRule(errors, issues, 'evTaxCredit', input.evTaxCredit, {
    min: 0,
    rangeMessage: 'Tax credit cannot be negative.',
  });
  checkNumberRule(errors, issues, 'evAnnualMaintenance', input.evAnnualMaintenance, {
    min: 0,
    rangeMessage: 'EV maintenance cannot be negative.',
  });
  checkNumberRule(errors, issues, 'evInsuranceAnnual', input.evInsuranceAnnual, {
    min: 0,
    rangeMessage: 'EV insurance cannot be negative.',
  });
  checkNumberRule(errors, issues, 'evResaleValuePercent', input.evResaleValuePercent, {
    min: 0,
    max: 100,
    rangeMessage: 'EV resale percentage must be between 0% and 100%.',
  });

  return { valid: issues.length === 0, errors, issues };
}

export function validateBuyVsRepairInput(input: Partial<BuyVsRepairInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'repairQuote', input.repairQuote, {
    min: 0,
    rangeMessage: 'Repair quote cannot be negative.',
  });
  checkNumberRule(
    errors,
    issues,
    'expectedLifespanAfterRepairYears',
    input.expectedLifespanAfterRepairYears,
    {
      exclusiveMin: 0,
      rangeMessage: 'Expected lifespan must be greater than zero.',
    }
  );
  checkNumberRule(
    errors,
    issues,
    'currentAnnualOperatingCost',
    input.currentAnnualOperatingCost,
    {
      min: 0,
      rangeMessage: 'Current operating cost cannot be negative.',
    }
  );
  checkNumberRule(
    errors,
    issues,
    'subsequentRepairRiskPercent',
    input.subsequentRepairRiskPercent,
    {
      min: 0,
      max: 100,
      rangeMessage: 'Secondary repair risk must be between 0% and 100%.',
    }
  );
  checkNumberRule(errors, issues, 'subsequentRepairCost', input.subsequentRepairCost, {
    min: 0,
    rangeMessage: 'Secondary repair cost cannot be negative.',
  });
  checkNumberRule(errors, issues, 'replacementPrice', input.replacementPrice, {
    exclusiveMin: 0,
    rangeMessage: 'Replacement price must be greater than zero.',
  });
  checkNumberRule(
    errors,
    issues,
    'installationAndDisposalFee',
    input.installationAndDisposalFee,
    {
      min: 0,
      rangeMessage: 'Installation and disposal fee cannot be negative.',
    }
  );
  checkNumberRule(
    errors,
    issues,
    'replacementExpectedLifespanYears',
    input.replacementExpectedLifespanYears,
    {
      exclusiveMin: 0,
      rangeMessage: 'Lifespan must be greater than zero.',
    }
  );
  checkNumberRule(
    errors,
    issues,
    'replacementAnnualOperatingCost',
    input.replacementAnnualOperatingCost,
    {
      min: 0,
      rangeMessage: 'Replacement operating cost cannot be negative.',
    }
  );

  return { valid: issues.length === 0, errors, issues };
}

export function validateDiyVsHireInput(input: Partial<DiyVsHireInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'diyMaterialsCost', input.diyMaterialsCost, {
    min: 0,
    rangeMessage: 'Materials cost cannot be negative.',
  });
  checkNumberRule(errors, issues, 'diyToolsEquipmentCost', input.diyToolsEquipmentCost, {
    min: 0,
    rangeMessage: 'Tools cost cannot be negative.',
  });
  checkNumberRule(errors, issues, 'diyEstimatedHours', input.diyEstimatedHours, {
    min: 0,
    rangeMessage: 'Estimated hours cannot be negative.',
  });
  checkNumberRule(errors, issues, 'personalHourlyRate', input.personalHourlyRate, {
    min: 0,
    rangeMessage: 'Hourly rate cannot be negative.',
  });
  checkNumberRule(errors, issues, 'diyReworkRiskPercent', input.diyReworkRiskPercent, {
    min: 0,
    max: 100,
    rangeMessage: 'Rework risk must be between 0% and 100%.',
  });
  checkNumberRule(errors, issues, 'contractorQuote', input.contractorQuote, {
    exclusiveMin: 0,
    rangeMessage: 'Contractor quote must be greater than zero.',
  });
  checkNumberRule(
    errors,
    issues,
    'homeownerCoordinationHours',
    input.homeownerCoordinationHours,
    {
      min: 0,
      rangeMessage: 'Coordination hours cannot be negative.',
    }
  );

  return { valid: issues.length === 0, errors, issues };
}

export function validateDebtVsInvestInput(input: Partial<DebtVsInvestInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'extraMonthlyCash', input.extraMonthlyCash, {
    min: 0,
    rangeMessage: 'Extra cash cannot be negative.',
  });
  checkNumberRule(errors, issues, 'debtBalance', input.debtBalance, {
    min: 0,
    rangeMessage: 'Debt balance cannot be negative.',
  });
  checkNumberRule(
    errors,
    issues,
    'debtInterestRatePercent',
    input.debtInterestRatePercent,
    {
      min: 0,
      max: 100,
      rangeMessage: 'Interest rate must be between 0% and 100%.',
    }
  );
  checkNumberRule(
    errors,
    issues,
    'debtMinimumMonthlyPayment',
    input.debtMinimumMonthlyPayment,
    {
      exclusiveMin: 0,
      rangeMessage: 'Minimum payment must be greater than zero.',
    }
  );
  checkNumberRule(
    errors,
    issues,
    'expectedInvestmentReturnPercent',
    input.expectedInvestmentReturnPercent,
    {
      allowNegative: true,
      min: -50,
      max: 100,
      rangeMessage: 'Expected investment return must be between -50% and 100%.',
    }
  );
  checkNumberRule(
    errors,
    issues,
    'investmentTaxRatePercent',
    input.investmentTaxRatePercent,
    {
      min: 0,
      max: 100,
      rangeMessage: 'Tax rate must be between 0% and 100%.',
    }
  );
  checkNumberRule(errors, issues, 'horizonYears', input.horizonYears, {
    min: 1,
    max: 30,
    integer: true,
    rangeMessage: 'Horizon must be 1 to 30 years.',
    integerMessage: 'Horizon must be a whole number of years.',
  });

  return { valid: issues.length === 0, errors, issues };
}

export function validateBuyVsSubscribeInput(
  input: Partial<BuyVsSubscribeInput>
): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'horizonYears', input.horizonYears, {
    exclusiveMin: 0,
    max: 25,
    rangeMessage:
      isFiniteNumber(input.horizonYears) && input.horizonYears > 25
        ? 'Comparison horizon cannot exceed 25 years.'
        : 'Comparison horizon must be greater than zero.',
  });

  const hasValidPurchasePrice = checkNumberRule(
    errors,
    issues,
    'purchasePrice',
    input.purchasePrice,
    {
      min: 0,
      rangeMessage: 'Purchase price cannot be negative.',
    }
  );
  checkNumberRule(errors, issues, 'setupOrActivationCost', input.setupOrActivationCost, {
    min: 0,
    rangeMessage: 'Setup cost cannot be negative.',
  });
  checkNumberRule(errors, issues, 'annualMaintenanceCost', input.annualMaintenanceCost, {
    min: 0,
    rangeMessage: 'Annual maintenance cannot be negative.',
  });
  const hasValidResale = checkNumberRule(
    errors,
    issues,
    'estimatedResaleValue',
    input.estimatedResaleValue,
    {
      min: 0,
      rangeMessage: 'Resale value cannot be negative.',
    }
  );
  if (
    hasValidPurchasePrice &&
    hasValidResale &&
    input.purchasePrice! > 0 &&
    input.estimatedResaleValue! >
      input.purchasePrice! +
        (isFiniteNumber(input.setupOrActivationCost) ? input.setupOrActivationCost : 0)
  ) {
    addError(
      errors,
      issues,
      'estimatedResaleValue',
      'CROSS_FIELD_CONSTRAINT',
      'Estimated resale value exceeds initial acquisition cost.'
    );
  }

  const cycle = input.billingCycle ?? 'monthly';
  if (cycle === 'monthly') {
    checkNumberRule(
      errors,
      issues,
      'monthlySubscriptionPrice',
      input.monthlySubscriptionPrice,
      {
        min: 0,
        rangeMessage: 'Monthly subscription price cannot be negative.',
      }
    );
  } else {
    checkNumberRule(
      errors,
      issues,
      'annualSubscriptionPrice',
      input.annualSubscriptionPrice,
      {
        min: 0,
        rangeMessage: 'Annual subscription price cannot be negative.',
      }
    );
  }

  checkNumberRule(errors, issues, 'signupFee', input.signupFee, {
    min: 0,
    rangeMessage: 'Signup fee cannot be negative.',
  });
  checkNumberRule(errors, issues, 'annualRecurringFees', input.annualRecurringFees, {
    min: 0,
    rangeMessage: 'Recurring fees cannot be negative.',
  });

  return { valid: issues.length === 0, errors, issues };
}

function validateVehicleOption(
  option: Partial<VehicleOrAssetOption> | undefined,
  prefix: 'new' | 'used',
  label: string,
  errors: Record<string, string>,
  issues: ValidationIssue[]
) {
  if (!option) {
    addError(
      errors,
      issues,
      `${prefix}PurchasePrice`,
      'REQUIRED',
      `${label} option details are required.`
    );
    return;
  }
  const hasValidPrice = checkNumberRule(
    errors,
    issues,
    `${prefix}PurchasePrice`,
    option.purchasePrice,
    {
      exclusiveMin: 0,
      rangeMessage: `${label} purchase price must be greater than zero.`,
    }
  );
  const hasValidDown = checkNumberRule(
    errors,
    issues,
    `${prefix}DownPayment`,
    option.downPayment,
    {
      min: 0,
      rangeMessage: 'Down payment cannot be negative.',
    }
  );
  if (hasValidPrice && hasValidDown && option.downPayment! > option.purchasePrice!) {
    addError(
      errors,
      issues,
      `${prefix}DownPayment`,
      'CROSS_FIELD_CONSTRAINT',
      'Down payment cannot exceed purchase price.'
    );
  }
  checkNumberRule(errors, issues, `${prefix}FinancingApr`, option.financingApr, {
    min: 0,
    rangeMessage: 'Financing APR cannot be negative.',
  });
  checkNumberRule(errors, issues, `${prefix}LoanTermMonths`, option.loanTermMonths, {
    min: 1,
    integer: true,
    rangeMessage: 'Loan term must be at least 1 month.',
    integerMessage: 'Loan term must be a whole number of months.',
  });
  checkNumberRule(errors, issues, `${prefix}AnnualInsurance`, option.annualInsurance, {
    min: 0,
    rangeMessage: 'Annual insurance cannot be negative.',
  });
  checkNumberRule(errors, issues, `${prefix}AnnualMaintenance`, option.annualMaintenance, {
    min: 0,
    rangeMessage: 'Annual maintenance cannot be negative.',
  });
  checkNumberRule(
    errors,
    issues,
    `${prefix}AnnualOperatingCost`,
    option.annualOperatingCost,
    {
      min: 0,
      rangeMessage: 'Annual operating cost cannot be negative.',
    }
  );
  checkNumberRule(errors, issues, `${prefix}ResaleValue`, option.expectedResaleValue, {
    min: 0,
    rangeMessage: 'Resale value cannot be negative.',
  });
}

export function validateNewVsUsedInput(input: Partial<NewVsUsedInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'horizonYears', input.horizonYears, {
    min: 1,
    max: 20,
    integer: true,
    rangeMessage:
      isFiniteNumber(input.horizonYears) && input.horizonYears > 20
        ? 'Comparison horizon cannot exceed 20 years.'
        : 'Comparison horizon must be at least 1 year.',
    integerMessage: 'Comparison horizon must be a whole number of years.',
  });

  validateVehicleOption(input.newOption, 'new', 'New', errors, issues);
  validateVehicleOption(input.usedOption, 'used', 'Used', errors, issues);

  return { valid: issues.length === 0, errors, issues };
}

export function validateBulkBuyInput(input: Partial<BulkBuyInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  checkNumberRule(errors, issues, 'normalUnitPrice', input.normalUnitPrice, {
    exclusiveMin: 0,
    rangeMessage: 'Normal retail price must be greater than zero.',
  });
  const hasValidNormalQty = checkNumberRule(
    errors,
    issues,
    'normalQuantity',
    input.normalQuantity,
    {
      min: 1,
      integer: true,
      rangeMessage: 'Normal quantity must be at least 1.',
      integerMessage: 'Normal quantity must be a whole number.',
    }
  );
  checkNumberRule(errors, issues, 'bulkPackagePrice', input.bulkPackagePrice, {
    exclusiveMin: 0,
    rangeMessage: 'Bulk package price must be greater than zero.',
  });
  const hasValidBulkQty = checkNumberRule(
    errors,
    issues,
    'bulkQuantity',
    input.bulkQuantity,
    {
      min: 1,
      integer: true,
      rangeMessage: 'Bulk quantity must be at least 1.',
      integerMessage: 'Bulk quantity must be a whole number.',
    }
  );
  if (hasValidNormalQty && hasValidBulkQty && input.bulkQuantity! < input.normalQuantity!) {
    addError(
      errors,
      issues,
      'bulkQuantity',
      'CROSS_FIELD_CONSTRAINT',
      'Bulk quantity should be greater than normal quantity.'
    );
  }
  checkNumberRule(errors, issues, 'expectedMonthlyUsage', input.expectedMonthlyUsage, {
    exclusiveMin: 0,
    rangeMessage: 'Expected usage rate must be greater than zero.',
  });
  checkNumberRule(errors, issues, 'storageCost', input.storageCost, {
    min: 0,
    rangeMessage: 'Storage cost cannot be negative.',
  });
  checkNumberRule(errors, issues, 'expectedWastePercent', input.expectedWastePercent, {
    min: 0,
    exclusiveMax: 100,
    rangeMessage: 'Waste percentage must be between 0% and 99%.',
  });

  return { valid: issues.length === 0, errors, issues };
}
