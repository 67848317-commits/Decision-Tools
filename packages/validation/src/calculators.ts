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

export function validateRentVsBuyInput(input: Partial<RentVsBuyInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.monthlyRent) || input.monthlyRent < 0) {
    addError(errors, issues, 'monthlyRent', 'BELOW_MIN', 'Monthly rent must be 0 or greater.');
  }
  if (
    !isFiniteNumber(input.annualRentIncreasePercent) ||
    input.annualRentIncreasePercent < 0 ||
    input.annualRentIncreasePercent > 20
  ) {
    addError(
      errors,
      issues,
      'annualRentIncreasePercent',
      'BELOW_MIN',
      'Annual rent increase must be between 0% and 20%.'
    );
  }
  if (!isFiniteNumber(input.homePrice) || input.homePrice <= 0) {
    addError(errors, issues, 'homePrice', 'MUST_BE_POSITIVE', 'Home price must be greater than $0.');
  }
  if (!isFiniteNumber(input.downPayment) || input.downPayment < 0) {
    addError(errors, issues, 'downPayment', 'NEGATIVE_NOT_ALLOWED', 'Down payment cannot be negative.');
  } else if (isFiniteNumber(input.homePrice) && input.downPayment > input.homePrice) {
    addError(
      errors,
      issues,
      'downPayment',
      'CROSS_FIELD_CONSTRAINT',
      'Down payment cannot exceed home purchase price.'
    );
  }
  if (
    !isFiniteNumber(input.mortgageRatePercent) ||
    input.mortgageRatePercent < 0 ||
    input.mortgageRatePercent > 25
  ) {
    addError(
      errors,
      issues,
      'mortgageRatePercent',
      'BELOW_MIN',
      'Mortgage rate must be between 0% and 25%.'
    );
  }
  if (!isFiniteNumber(input.loanTermYears) || input.loanTermYears < 1 || input.loanTermYears > 50) {
    addError(
      errors,
      issues,
      'loanTermYears',
      'BELOW_MIN',
      'Loan term must be between 1 and 50 years.'
    );
  }
  if (
    !isFiniteNumber(input.propertyTaxRatePercent) ||
    input.propertyTaxRatePercent < 0 ||
    input.propertyTaxRatePercent > 10
  ) {
    addError(
      errors,
      issues,
      'propertyTaxRatePercent',
      'BELOW_MIN',
      'Property tax rate must be between 0% and 10%.'
    );
  }
  if (!isFiniteNumber(input.homeInsuranceAnnual) || input.homeInsuranceAnnual < 0) {
    addError(
      errors,
      issues,
      'homeInsuranceAnnual',
      'NEGATIVE_NOT_ALLOWED',
      'Home insurance must be 0 or greater.'
    );
  }
  if (
    !isFiniteNumber(input.annualMaintenancePercent) ||
    input.annualMaintenancePercent < 0 ||
    input.annualMaintenancePercent > 10
  ) {
    addError(
      errors,
      issues,
      'annualMaintenancePercent',
      'BELOW_MIN',
      'Maintenance rate must be between 0% and 10%.'
    );
  }
  if (!isFiniteNumber(input.closingCostsPurchase) || input.closingCostsPurchase < 0) {
    addError(
      errors,
      issues,
      'closingCostsPurchase',
      'NEGATIVE_NOT_ALLOWED',
      'Closing costs cannot be negative.'
    );
  }
  if (
    !isFiniteNumber(input.expectedAppreciationPercent) ||
    input.expectedAppreciationPercent < -15 ||
    input.expectedAppreciationPercent > 25
  ) {
    addError(
      errors,
      issues,
      'expectedAppreciationPercent',
      'BELOW_MIN',
      'Expected appreciation must be between -15% and 25%.'
    );
  }
  if (!isFiniteNumber(input.horizonYears) || input.horizonYears < 1 || input.horizonYears > 50) {
    addError(
      errors,
      issues,
      'horizonYears',
      'BELOW_MIN',
      'Time horizon must be between 1 and 50 years.'
    );
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateJobOfferInput(
  offer: Partial<JobOfferDetails>,
  label = 'Offer'
): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(offer.baseSalary) || offer.baseSalary < 0) {
    addError(errors, issues, 'baseSalary', 'NEGATIVE_NOT_ALLOWED', `${label}: Base salary must be $0 or greater.`);
  }
  if (!isFiniteNumber(offer.annualBonus) || offer.annualBonus < 0) {
    addError(errors, issues, 'annualBonus', 'NEGATIVE_NOT_ALLOWED', `${label}: Annual bonus cannot be negative.`);
  }
  if (!isFiniteNumber(offer.employerMatchPercent) || offer.employerMatchPercent < 0 || offer.employerMatchPercent > 100) {
    addError(
      errors,
      issues,
      'employerMatchPercent',
      'BELOW_MIN',
      `${label}: 401(k) match must be between 0% and 100%.`
    );
  }
  if (!isFiniteNumber(offer.annualHealthInsuranceCost) || offer.annualHealthInsuranceCost < 0) {
    addError(
      errors,
      issues,
      'annualHealthInsuranceCost',
      'NEGATIVE_NOT_ALLOWED',
      `${label}: Health insurance cost cannot be negative.`
    );
  }
  if (!isFiniteNumber(offer.paidVacationDays) || offer.paidVacationDays < 0 || offer.paidVacationDays > 100) {
    addError(
      errors,
      issues,
      'paidVacationDays',
      'BELOW_MIN',
      `${label}: Vacation days must be between 0 and 100.`
    );
  }
  if (!isFiniteNumber(offer.commuteMilesOneWay) || offer.commuteMilesOneWay < 0 || offer.commuteMilesOneWay > 300) {
    addError(
      errors,
      issues,
      'commuteMilesOneWay',
      'BELOW_MIN',
      `${label}: Commute distance must be between 0 and 300 miles.`
    );
  }
  if (!isFiniteNumber(offer.commuteDaysPerWeek) || offer.commuteDaysPerWeek < 0 || offer.commuteDaysPerWeek > 7) {
    addError(
      errors,
      issues,
      'commuteDaysPerWeek',
      'BELOW_MIN',
      `${label}: Commute days must be between 0 and 7.`
    );
  }
  if (!isFiniteNumber(offer.remoteDaysPerWeek) || offer.remoteDaysPerWeek < 0 || offer.remoteDaysPerWeek > 7) {
    addError(
      errors,
      issues,
      'remoteDaysPerWeek',
      'BELOW_MIN',
      `${label}: Remote days must be between 0 and 7.`
    );
  }
  if (
    isFiniteNumber(offer.commuteDaysPerWeek) &&
    isFiniteNumber(offer.remoteDaysPerWeek) &&
    offer.commuteDaysPerWeek + offer.remoteDaysPerWeek > 7
  ) {
    addError(
      errors,
      issues,
      'commuteDaysPerWeek',
      'CROSS_FIELD_CONSTRAINT',
      `${label}: Combined commute and remote days cannot exceed 7 days per week.`
    );
  }
  if (!isFiniteNumber(offer.otherCompensationAnnual) || offer.otherCompensationAnnual < 0) {
    addError(
      errors,
      issues,
      'otherCompensationAnnual',
      'NEGATIVE_NOT_ALLOWED',
      `${label}: Other compensation cannot be negative.`
    );
  }
  if (
    offer.estimatedVehicleCostPerMile !== undefined &&
    (!isFiniteNumber(offer.estimatedVehicleCostPerMile) ||
      offer.estimatedVehicleCostPerMile < 0 ||
      offer.estimatedVehicleCostPerMile > 10)
  ) {
    addError(
      errors,
      issues,
      'estimatedVehicleCostPerMile',
      'BELOW_MIN',
      `${label}: Vehicle cost per mile must be between $0.00 and $10.00.`
    );
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateLeaseVsBuyInput(input: Partial<LeaseVsBuyInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.vehicleMSRP) || input.vehicleMSRP <= 0) {
    addError(errors, issues, 'vehicleMSRP', 'MUST_BE_POSITIVE', 'Vehicle MSRP must be greater than zero.');
  }
  if (!isFiniteNumber(input.analysisTermMonths) || input.analysisTermMonths < 12 || input.analysisTermMonths > 84) {
    addError(errors, issues, 'analysisTermMonths', 'BELOW_MIN', 'Term must be 12 to 84 months.');
  }
  if (!isFiniteNumber(input.leaseDownPayment) || input.leaseDownPayment < 0) {
    addError(errors, issues, 'leaseDownPayment', 'NEGATIVE_NOT_ALLOWED', 'Lease down payment cannot be negative.');
  }
  if (!isFiniteNumber(input.leaseMonthlyPayment) || input.leaseMonthlyPayment <= 0) {
    addError(errors, issues, 'leaseMonthlyPayment', 'MUST_BE_POSITIVE', 'Lease payment must be greater than zero.');
  }
  if (!isFiniteNumber(input.leaseFees) || input.leaseFees < 0) {
    addError(errors, issues, 'leaseFees', 'NEGATIVE_NOT_ALLOWED', 'Lease fees cannot be negative.');
  }
  if (!isFiniteNumber(input.leaseAnnualInsurance) || input.leaseAnnualInsurance < 0) {
    addError(errors, issues, 'leaseAnnualInsurance', 'NEGATIVE_NOT_ALLOWED', 'Lease insurance cannot be negative.');
  }
  if (!isFiniteNumber(input.leaseAnnualMaintenance) || input.leaseAnnualMaintenance < 0) {
    addError(errors, issues, 'leaseAnnualMaintenance', 'NEGATIVE_NOT_ALLOWED', 'Lease maintenance cannot be negative.');
  }
  if (!isFiniteNumber(input.purchasePrice) || input.purchasePrice <= 0) {
    addError(errors, issues, 'purchasePrice', 'MUST_BE_POSITIVE', 'Purchase price must be greater than zero.');
  }
  if (!isFiniteNumber(input.purchaseDownPayment) || input.purchaseDownPayment < 0) {
    addError(errors, issues, 'purchaseDownPayment', 'NEGATIVE_NOT_ALLOWED', 'Purchase down payment cannot be negative.');
  } else if (isFiniteNumber(input.purchasePrice) && input.purchaseDownPayment > input.purchasePrice) {
    addError(
      errors,
      issues,
      'purchaseDownPayment',
      'CROSS_FIELD_CONSTRAINT',
      'Purchase down payment cannot exceed purchase price.'
    );
  }
  if (!isFiniteNumber(input.loanInterestRatePercent) || input.loanInterestRatePercent < 0 || input.loanInterestRatePercent > 35) {
    addError(
      errors,
      issues,
      'loanInterestRatePercent',
      'BELOW_MIN',
      'Loan interest rate must be between 0% and 35%.'
    );
  }
  if (!isFiniteNumber(input.loanTermMonths) || input.loanTermMonths < 1 || input.loanTermMonths > 96) {
    addError(errors, issues, 'loanTermMonths', 'BELOW_MIN', 'Loan term must be between 1 and 96 months.');
  }
  if (!isFiniteNumber(input.salesTaxPercent) || input.salesTaxPercent < 0 || input.salesTaxPercent > 25) {
    addError(errors, issues, 'salesTaxPercent', 'BELOW_MIN', 'Sales tax must be between 0% and 25%.');
  }
  if (!isFiniteNumber(input.buyAnnualInsurance) || input.buyAnnualInsurance < 0) {
    addError(errors, issues, 'buyAnnualInsurance', 'NEGATIVE_NOT_ALLOWED', 'Buy insurance cannot be negative.');
  }
  if (!isFiniteNumber(input.buyAnnualMaintenance) || input.buyAnnualMaintenance < 0) {
    addError(errors, issues, 'buyAnnualMaintenance', 'NEGATIVE_NOT_ALLOWED', 'Buy maintenance cannot be negative.');
  }
  if (
    !isFiniteNumber(input.vehicleResaleValuePercent) ||
    input.vehicleResaleValuePercent < 0 ||
    input.vehicleResaleValuePercent > 100
  ) {
    addError(
      errors,
      issues,
      'vehicleResaleValuePercent',
      'BELOW_MIN',
      'Residual value must be between 0% and 100%.'
    );
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateGasVsEvInput(input: Partial<GasVsEvInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.annualMiles) || input.annualMiles < 500) {
    addError(errors, issues, 'annualMiles', 'BELOW_MIN', 'Enter at least 500 annual miles.');
  }
  if (!isFiniteNumber(input.horizonYears) || input.horizonYears < 1 || input.horizonYears > 20) {
    addError(errors, issues, 'horizonYears', 'BELOW_MIN', 'Horizon must be 1 to 20 years.');
  }
  if (!isFiniteNumber(input.gasVehiclePrice) || input.gasVehiclePrice <= 0) {
    addError(errors, issues, 'gasVehiclePrice', 'MUST_BE_POSITIVE', 'Gas car price must be greater than zero.');
  }
  if (!isFiniteNumber(input.gasMpg) || input.gasMpg <= 0) {
    addError(errors, issues, 'gasMpg', 'MUST_BE_POSITIVE', 'MPG must be greater than zero.');
  }
  if (!isFiniteNumber(input.gasPricePerGallon) || input.gasPricePerGallon < 0) {
    addError(errors, issues, 'gasPricePerGallon', 'NEGATIVE_NOT_ALLOWED', 'Gas price cannot be negative.');
  }
  if (!isFiniteNumber(input.gasAnnualMaintenance) || input.gasAnnualMaintenance < 0) {
    addError(errors, issues, 'gasAnnualMaintenance', 'NEGATIVE_NOT_ALLOWED', 'Gas maintenance cannot be negative.');
  }
  if (!isFiniteNumber(input.gasInsuranceAnnual) || input.gasInsuranceAnnual < 0) {
    addError(errors, issues, 'gasInsuranceAnnual', 'NEGATIVE_NOT_ALLOWED', 'Gas insurance cannot be negative.');
  }
  if (!isFiniteNumber(input.gasResaleValuePercent) || input.gasResaleValuePercent < 0 || input.gasResaleValuePercent > 100) {
    addError(
      errors,
      issues,
      'gasResaleValuePercent',
      'BELOW_MIN',
      'Gas resale percentage must be between 0% and 100%.'
    );
  }
  if (!isFiniteNumber(input.evVehiclePrice) || input.evVehiclePrice <= 0) {
    addError(errors, issues, 'evVehiclePrice', 'MUST_BE_POSITIVE', 'EV price must be greater than zero.');
  }
  if (!isFiniteNumber(input.evEfficiencyMilesPerKwh) || input.evEfficiencyMilesPerKwh <= 0) {
    addError(errors, issues, 'evEfficiencyMilesPerKwh', 'MUST_BE_POSITIVE', 'Efficiency must be greater than zero.');
  }
  if (!isFiniteNumber(input.electricityCostPerKwh) || input.electricityCostPerKwh < 0) {
    addError(errors, issues, 'electricityCostPerKwh', 'NEGATIVE_NOT_ALLOWED', 'Electricity cost cannot be negative.');
  }
  if (!isFiniteNumber(input.evHomeChargerInstall) || input.evHomeChargerInstall < 0) {
    addError(errors, issues, 'evHomeChargerInstall', 'NEGATIVE_NOT_ALLOWED', 'Charger install cost cannot be negative.');
  }
  if (!isFiniteNumber(input.evTaxCredit) || input.evTaxCredit < 0) {
    addError(errors, issues, 'evTaxCredit', 'NEGATIVE_NOT_ALLOWED', 'Tax credit cannot be negative.');
  }
  if (!isFiniteNumber(input.evAnnualMaintenance) || input.evAnnualMaintenance < 0) {
    addError(errors, issues, 'evAnnualMaintenance', 'NEGATIVE_NOT_ALLOWED', 'EV maintenance cannot be negative.');
  }
  if (!isFiniteNumber(input.evInsuranceAnnual) || input.evInsuranceAnnual < 0) {
    addError(errors, issues, 'evInsuranceAnnual', 'NEGATIVE_NOT_ALLOWED', 'EV insurance cannot be negative.');
  }
  if (!isFiniteNumber(input.evResaleValuePercent) || input.evResaleValuePercent < 0 || input.evResaleValuePercent > 100) {
    addError(
      errors,
      issues,
      'evResaleValuePercent',
      'BELOW_MIN',
      'EV resale percentage must be between 0% and 100%.'
    );
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateBuyVsRepairInput(input: Partial<BuyVsRepairInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.repairQuote) || input.repairQuote < 0) {
    addError(errors, issues, 'repairQuote', 'NEGATIVE_NOT_ALLOWED', 'Repair quote cannot be negative.');
  }
  if (!isFiniteNumber(input.expectedLifespanAfterRepairYears) || input.expectedLifespanAfterRepairYears <= 0) {
    addError(
      errors,
      issues,
      'expectedLifespanAfterRepairYears',
      'MUST_BE_POSITIVE',
      'Expected lifespan must be greater than zero.'
    );
  }
  if (!isFiniteNumber(input.currentAnnualOperatingCost) || input.currentAnnualOperatingCost < 0) {
    addError(
      errors,
      issues,
      'currentAnnualOperatingCost',
      'NEGATIVE_NOT_ALLOWED',
      'Current operating cost cannot be negative.'
    );
  }
  if (
    !isFiniteNumber(input.subsequentRepairRiskPercent) ||
    input.subsequentRepairRiskPercent < 0 ||
    input.subsequentRepairRiskPercent > 100
  ) {
    addError(
      errors,
      issues,
      'subsequentRepairRiskPercent',
      'BELOW_MIN',
      'Secondary repair risk must be between 0% and 100%.'
    );
  }
  if (!isFiniteNumber(input.subsequentRepairCost) || input.subsequentRepairCost < 0) {
    addError(
      errors,
      issues,
      'subsequentRepairCost',
      'NEGATIVE_NOT_ALLOWED',
      'Secondary repair cost cannot be negative.'
    );
  }
  if (!isFiniteNumber(input.replacementPrice) || input.replacementPrice <= 0) {
    addError(errors, issues, 'replacementPrice', 'MUST_BE_POSITIVE', 'Replacement price must be greater than zero.');
  }
  if (!isFiniteNumber(input.installationAndDisposalFee) || input.installationAndDisposalFee < 0) {
    addError(
      errors,
      issues,
      'installationAndDisposalFee',
      'NEGATIVE_NOT_ALLOWED',
      'Installation and disposal fee cannot be negative.'
    );
  }
  if (!isFiniteNumber(input.replacementExpectedLifespanYears) || input.replacementExpectedLifespanYears <= 0) {
    addError(errors, issues, 'replacementExpectedLifespanYears', 'MUST_BE_POSITIVE', 'Lifespan must be greater than zero.');
  }
  if (!isFiniteNumber(input.replacementAnnualOperatingCost) || input.replacementAnnualOperatingCost < 0) {
    addError(
      errors,
      issues,
      'replacementAnnualOperatingCost',
      'NEGATIVE_NOT_ALLOWED',
      'Replacement operating cost cannot be negative.'
    );
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateDiyVsHireInput(input: Partial<DiyVsHireInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.diyMaterialsCost) || input.diyMaterialsCost < 0) {
    addError(errors, issues, 'diyMaterialsCost', 'NEGATIVE_NOT_ALLOWED', 'Materials cost cannot be negative.');
  }
  if (!isFiniteNumber(input.diyToolsEquipmentCost) || input.diyToolsEquipmentCost < 0) {
    addError(errors, issues, 'diyToolsEquipmentCost', 'NEGATIVE_NOT_ALLOWED', 'Tools cost cannot be negative.');
  }
  if (!isFiniteNumber(input.diyEstimatedHours) || input.diyEstimatedHours < 0) {
    addError(errors, issues, 'diyEstimatedHours', 'NEGATIVE_NOT_ALLOWED', 'Estimated hours cannot be negative.');
  }
  if (!isFiniteNumber(input.personalHourlyRate) || input.personalHourlyRate < 0) {
    addError(errors, issues, 'personalHourlyRate', 'NEGATIVE_NOT_ALLOWED', 'Hourly rate cannot be negative.');
  }
  if (!isFiniteNumber(input.diyReworkRiskPercent) || input.diyReworkRiskPercent < 0 || input.diyReworkRiskPercent > 100) {
    addError(errors, issues, 'diyReworkRiskPercent', 'BELOW_MIN', 'Rework risk must be between 0% and 100%.');
  }
  if (!isFiniteNumber(input.contractorQuote) || input.contractorQuote <= 0) {
    addError(errors, issues, 'contractorQuote', 'MUST_BE_POSITIVE', 'Contractor quote must be greater than zero.');
  }
  if (!isFiniteNumber(input.homeownerCoordinationHours) || input.homeownerCoordinationHours < 0) {
    addError(
      errors,
      issues,
      'homeownerCoordinationHours',
      'NEGATIVE_NOT_ALLOWED',
      'Coordination hours cannot be negative.'
    );
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateDebtVsInvestInput(input: Partial<DebtVsInvestInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.extraMonthlyCash) || input.extraMonthlyCash < 0) {
    addError(errors, issues, 'extraMonthlyCash', 'NEGATIVE_NOT_ALLOWED', 'Extra cash cannot be negative.');
  }
  if (!isFiniteNumber(input.debtBalance) || input.debtBalance < 0) {
    addError(errors, issues, 'debtBalance', 'NEGATIVE_NOT_ALLOWED', 'Debt balance cannot be negative.');
  }
  if (!isFiniteNumber(input.debtInterestRatePercent) || input.debtInterestRatePercent < 0 || input.debtInterestRatePercent > 100) {
    addError(
      errors,
      issues,
      'debtInterestRatePercent',
      'BELOW_MIN',
      'Interest rate must be between 0% and 100%.'
    );
  }
  if (!isFiniteNumber(input.debtMinimumMonthlyPayment) || input.debtMinimumMonthlyPayment <= 0) {
    addError(
      errors,
      issues,
      'debtMinimumMonthlyPayment',
      'MUST_BE_POSITIVE',
      'Minimum payment must be greater than zero.'
    );
  }
  if (
    !isFiniteNumber(input.expectedInvestmentReturnPercent) ||
    input.expectedInvestmentReturnPercent < -50 ||
    input.expectedInvestmentReturnPercent > 100
  ) {
    addError(
      errors,
      issues,
      'expectedInvestmentReturnPercent',
      'BELOW_MIN',
      'Expected investment return must be between -50% and 100%.'
    );
  }
  if (!isFiniteNumber(input.investmentTaxRatePercent) || input.investmentTaxRatePercent < 0 || input.investmentTaxRatePercent > 100) {
    addError(
      errors,
      issues,
      'investmentTaxRatePercent',
      'BELOW_MIN',
      'Tax rate must be between 0% and 100%.'
    );
  }
  if (!isFiniteNumber(input.horizonYears) || input.horizonYears < 1 || input.horizonYears > 30) {
    addError(errors, issues, 'horizonYears', 'BELOW_MIN', 'Horizon must be 1 to 30 years.');
  }

  return { valid: issues.length === 0, errors, issues };
}

export function validateBuyVsSubscribeInput(input: Partial<BuyVsSubscribeInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.horizonYears) || input.horizonYears <= 0) {
    addError(errors, issues, 'horizonYears', 'MUST_BE_POSITIVE', 'Comparison horizon must be greater than zero.');
  } else if (input.horizonYears > 25) {
    addError(errors, issues, 'horizonYears', 'ABOVE_MAX', 'Comparison horizon cannot exceed 25 years.');
  }

  if (!isFiniteNumber(input.purchasePrice) || input.purchasePrice < 0) {
    addError(errors, issues, 'purchasePrice', 'NEGATIVE_NOT_ALLOWED', 'Purchase price cannot be negative.');
  }
  if (!isFiniteNumber(input.setupOrActivationCost) || input.setupOrActivationCost < 0) {
    addError(errors, issues, 'setupOrActivationCost', 'NEGATIVE_NOT_ALLOWED', 'Setup cost cannot be negative.');
  }
  if (!isFiniteNumber(input.annualMaintenanceCost) || input.annualMaintenanceCost < 0) {
    addError(errors, issues, 'annualMaintenanceCost', 'NEGATIVE_NOT_ALLOWED', 'Annual maintenance cannot be negative.');
  }
  if (!isFiniteNumber(input.estimatedResaleValue) || input.estimatedResaleValue < 0) {
    addError(errors, issues, 'estimatedResaleValue', 'NEGATIVE_NOT_ALLOWED', 'Resale value cannot be negative.');
  } else if (
    isFiniteNumber(input.purchasePrice) &&
    input.purchasePrice > 0 &&
    input.estimatedResaleValue > input.purchasePrice + (isFiniteNumber(input.setupOrActivationCost) ? input.setupOrActivationCost : 0)
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
    if (!isFiniteNumber(input.monthlySubscriptionPrice) || input.monthlySubscriptionPrice < 0) {
      addError(
        errors,
        issues,
        'monthlySubscriptionPrice',
        'NEGATIVE_NOT_ALLOWED',
        'Monthly subscription price cannot be negative.'
      );
    }
  } else {
    if (!isFiniteNumber(input.annualSubscriptionPrice) || input.annualSubscriptionPrice < 0) {
      addError(
        errors,
        issues,
        'annualSubscriptionPrice',
        'NEGATIVE_NOT_ALLOWED',
        'Annual subscription price cannot be negative.'
      );
    }
  }

  if (!isFiniteNumber(input.signupFee) || input.signupFee < 0) {
    addError(errors, issues, 'signupFee', 'NEGATIVE_NOT_ALLOWED', 'Signup fee cannot be negative.');
  }
  if (!isFiniteNumber(input.annualRecurringFees) || input.annualRecurringFees < 0) {
    addError(errors, issues, 'annualRecurringFees', 'NEGATIVE_NOT_ALLOWED', 'Recurring fees cannot be negative.');
  }

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
    addError(errors, issues, `${prefix}PurchasePrice`, 'REQUIRED', `${label} option details are required.`);
    return;
  }
  if (!isFiniteNumber(option.purchasePrice) || option.purchasePrice <= 0) {
    addError(errors, issues, `${prefix}PurchasePrice`, 'MUST_BE_POSITIVE', `${label} purchase price must be greater than zero.`);
  }
  if (!isFiniteNumber(option.downPayment) || option.downPayment < 0) {
    addError(errors, issues, `${prefix}DownPayment`, 'NEGATIVE_NOT_ALLOWED', 'Down payment cannot be negative.');
  } else if (isFiniteNumber(option.purchasePrice) && option.downPayment > option.purchasePrice) {
    addError(errors, issues, `${prefix}DownPayment`, 'CROSS_FIELD_CONSTRAINT', 'Down payment cannot exceed purchase price.');
  }
  if (!isFiniteNumber(option.financingApr) || option.financingApr < 0) {
    addError(errors, issues, `${prefix}FinancingApr`, 'NEGATIVE_NOT_ALLOWED', 'Financing APR cannot be negative.');
  }
  if (!isFiniteNumber(option.loanTermMonths) || option.loanTermMonths <= 0) {
    addError(errors, issues, `${prefix}LoanTermMonths`, 'MUST_BE_POSITIVE', 'Loan term must be at least 1 month.');
  }
  if (!isFiniteNumber(option.annualInsurance) || option.annualInsurance < 0) {
    addError(errors, issues, `${prefix}AnnualInsurance`, 'NEGATIVE_NOT_ALLOWED', 'Annual insurance cannot be negative.');
  }
  if (!isFiniteNumber(option.annualMaintenance) || option.annualMaintenance < 0) {
    addError(errors, issues, `${prefix}AnnualMaintenance`, 'NEGATIVE_NOT_ALLOWED', 'Annual maintenance cannot be negative.');
  }
  if (!isFiniteNumber(option.annualOperatingCost) || option.annualOperatingCost < 0) {
    addError(errors, issues, `${prefix}AnnualOperatingCost`, 'NEGATIVE_NOT_ALLOWED', 'Annual operating cost cannot be negative.');
  }
  if (!isFiniteNumber(option.expectedResaleValue) || option.expectedResaleValue < 0) {
    addError(errors, issues, `${prefix}ResaleValue`, 'NEGATIVE_NOT_ALLOWED', 'Resale value cannot be negative.');
  }
}

export function validateNewVsUsedInput(
  input: Partial<NewVsUsedInput>
): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.horizonYears) || input.horizonYears <= 0) {
    addError(errors, issues, 'horizonYears', 'MUST_BE_POSITIVE', 'Comparison horizon must be greater than zero.');
  } else if (input.horizonYears > 20) {
    addError(errors, issues, 'horizonYears', 'ABOVE_MAX', 'Comparison horizon cannot exceed 20 years.');
  }

  validateVehicleOption(input.newOption, 'new', 'New', errors, issues);
  validateVehicleOption(input.usedOption, 'used', 'Used', errors, issues);

  return { valid: issues.length === 0, errors, issues };
}

export function validateBulkBuyInput(input: Partial<BulkBuyInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const issues: ValidationIssue[] = [];

  if (!isFiniteNumber(input.normalUnitPrice) || input.normalUnitPrice <= 0) {
    addError(errors, issues, 'normalUnitPrice', 'MUST_BE_POSITIVE', 'Normal retail price must be greater than zero.');
  }
  if (!isFiniteNumber(input.normalQuantity) || input.normalQuantity <= 0) {
    addError(errors, issues, 'normalQuantity', 'BELOW_MIN', 'Normal quantity must be at least 1.');
  }
  if (!isFiniteNumber(input.bulkPackagePrice) || input.bulkPackagePrice <= 0) {
    addError(errors, issues, 'bulkPackagePrice', 'MUST_BE_POSITIVE', 'Bulk package price must be greater than zero.');
  }
  if (!isFiniteNumber(input.bulkQuantity) || input.bulkQuantity <= 0) {
    addError(errors, issues, 'bulkQuantity', 'BELOW_MIN', 'Bulk quantity must be at least 1.');
  } else if (isFiniteNumber(input.normalQuantity) && input.bulkQuantity < input.normalQuantity) {
    addError(
      errors,
      issues,
      'bulkQuantity',
      'CROSS_FIELD_CONSTRAINT',
      'Bulk quantity should be greater than normal quantity.'
    );
  }
  if (!isFiniteNumber(input.expectedMonthlyUsage) || input.expectedMonthlyUsage <= 0) {
    addError(errors, issues, 'expectedMonthlyUsage', 'MUST_BE_POSITIVE', 'Expected usage rate must be greater than zero.');
  }
  if (!isFiniteNumber(input.storageCost) || input.storageCost < 0) {
    addError(errors, issues, 'storageCost', 'NEGATIVE_NOT_ALLOWED', 'Storage cost cannot be negative.');
  }
  if (
    !isFiniteNumber(input.expectedWastePercent) ||
    input.expectedWastePercent < 0 ||
    input.expectedWastePercent >= 100
  ) {
    addError(
      errors,
      issues,
      'expectedWastePercent',
      'BELOW_MIN',
      'Waste percentage must be between 0% and 99%.'
    );
  }

  return { valid: issues.length === 0, errors, issues };
}
