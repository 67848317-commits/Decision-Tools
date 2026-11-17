// ============================================================================
// Catalog, Guide, and Domain Types
// ============================================================================

export type DecisionCategory =
  | 'housing'
  | 'career'
  | 'transportation'
  | 'lifestyle'
  | 'finance';

export type CalculatorSlug =
  | 'rent-vs-buy'
  | 'job-offer'
  | 'lease-vs-buy'
  | 'gas-vs-ev'
  | 'buy-vs-repair'
  | 'diy-vs-hire'
  | 'debt-vs-invest'
  | 'buy-vs-subscribe'
  | 'new-vs-used'
  | 'bulk-buy';

export interface CategoryInfo {
  id: DecisionCategory;
  name: string;
  description: string;
  count?: number;
}

export interface DecisionFAQItem {
  question: string;
  answer: string;
}

export interface DecisionItem {
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  category: DecisionCategory;
  featured: boolean;
  timeToEstimate: string;
  optionAName: string;
  optionBName: string;
  keyMetric: string;
  primaryKeyword?: string;
  relatedGuides: string[];
  relatedDecisions: string[];
  faq: DecisionFAQItem[];
}

export interface GuideTable {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  callout?: string;
  table?: GuideTable;
  bullets?: string[];
  subparagraphs?: string[];
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

/**
 * Canonical GuideItem interface reconciled across catalog and editorial guides.
 */
export interface GuideItem {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  readTime: string;
  topicTag: string;
  category: DecisionCategory;
  publishDate: string;
  modifiedDate?: string;
  publishDateIso?: string;
  modifiedDateIso?: string;
  primaryKeyword?: string;
  relatedDecisionSlug: string;
  relatedGuideSlugs?: string[];
  summaryPoints: string[];
  contentSections: GuideSection[];
  faq?: GuideFAQ[];
}

export interface PlannedGuideTopic {
  slug: string;
  title: string;
  shortTitle: string;
  category: DecisionCategory;
  relatedDecisionSlug: string;
  isPublished: boolean;
  primaryKeyword?: string;
  targetTitle?: string;
  targetMetaDescription?: string;
  targetH1?: string;
  searchIntent?: string;
  relatedGuideSlugs?: string[];
}

// ============================================================================
// Validation & Parsing Types
// ============================================================================

export type NumericParseStatus = 'empty' | 'invalid' | 'valid';

export type NumericSign = 'zero' | 'positive' | 'negative';

export interface ParsedNumericInput {
  status: NumericParseStatus;
  value: number | null;
  sign: NumericSign | null;
  raw: string;
}

export type ValidationErrorCode =
  | 'REQUIRED'
  | 'INVALID_NUMBER'
  | 'NEGATIVE_NOT_ALLOWED'
  | 'MUST_BE_POSITIVE'
  | 'BELOW_MIN'
  | 'ABOVE_MAX'
  | 'MUST_BE_INTEGER'
  | 'CROSS_FIELD_CONSTRAINT';

export interface ValidationIssue {
  field: string;
  code: ValidationErrorCode;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  issues?: ValidationIssue[];
}

export interface NumericFieldRule {
  label: string;
  required?: boolean;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  exclusiveMin?: number;
  integer?: boolean;
}

// ============================================================================
// 1. Rent vs. Buy Types
// ============================================================================

export interface RentVsBuyInput {
  monthlyRent: number;
  annualRentIncreasePercent: number;
  homePrice: number;
  downPayment: number;
  mortgageRatePercent: number;
  loanTermYears: number;
  propertyTaxRatePercent: number;
  homeInsuranceAnnual: number;
  annualMaintenancePercent: number;
  closingCostsPurchase: number;
  expectedAppreciationPercent: number;
  horizonYears: number;
}

export interface YearRentBuyBreakdown {
  year: number;
  rentAnnualCost: number;
  rentCumulativeCost: number;
  ownershipAnnualCost: number;
  ownershipCumulativeCost: number;
  mortgagePrincipalPaidAnnual: number;
  mortgageInterestPaidAnnual: number;
  remainingMortgageBalance: number;
  estimatedHomeValue: number;
  estimatedHomeEquity: number;
  netHousingCost: number;
}

export interface RentVsBuyResult {
  horizonYears: number;
  totalRentCost: number;
  totalOwnershipOutflow: number;
  finalHomeValue: number;
  finalMortgageBalance: number;
  finalHomeEquity: number;
  netOwnershipCost: number;
  netDifference: number;
  lowerNetOption: 'rent' | 'buy' | 'equal';
  monthlyMortgagePayment: number;
  loanAmount: number;
  breakdown: YearRentBuyBreakdown[];
  summaryText: string;
}

export interface RentVsBuyCostCategoryTotals {
  upfrontCapitalAndAcquisition: number;
  mortgagePrincipalAndInterest: number;
  propertyTaxesTotal: number;
  homeInsuranceTotal: number;
  propertyTaxesAndInsuranceTotal: number;
  maintenanceTotal: number;
  cumulativeRent: number;
}

// ============================================================================
// 2. Job Offer Comparison Types
// ============================================================================

export interface JobOfferDetails {
  title: string;
  baseSalary: number;
  annualBonus: number;
  employerMatchPercent: number;
  employeeContributionForMatchPercent: number;
  annualHealthInsuranceCost: number;
  paidVacationDays: number;
  commuteMilesOneWay: number;
  commuteDaysPerWeek: number;
  remoteDaysPerWeek: number;
  otherCompensationAnnual: number;
  estimatedVehicleCostPerMile: number;
  averageCommuteSpeedMph: number;
  annualWorkWeeks: number;
}

export interface JobOfferCalculatedOption {
  title: string;
  baseSalary: number;
  annualBonus: number;
  employerMatchDollars: number;
  otherCompensation: number;
  cashCompensationTotal: number;
  annualHealthCost: number;
  effectiveCompensationPreCommute: number;
  annualCommuteMiles: number;
  annualCommuteCost: number;
  annualCommuteHours: number;
  netEffectiveCompensation: number;
  vacationDays: number;
  estimatedDailyRate: number;
  estimatedVacationValue: number;
}

export interface JobOfferComparisonResult {
  optionA: JobOfferCalculatedOption;
  optionB: JobOfferCalculatedOption;
  compensationDifference: number;
  higherNetOption: 'A' | 'B' | 'equal';
  commuteCostDifference: number;
  commuteHoursDifference: number;
  vacationDaysDifference: number;
  summaryText: string;
}

// ============================================================================
// 3. Lease vs. Buy Types
// ============================================================================

export interface LeaseVsBuyInput {
  analysisTermMonths: number;
  vehicleMSRP: number;
  leaseDownPayment: number;
  leaseMonthlyPayment: number;
  leaseFees: number;
  leaseAnnualInsurance: number;
  leaseAnnualMaintenance: number;
  purchasePrice: number;
  purchaseDownPayment: number;
  loanInterestRatePercent: number;
  loanTermMonths: number;
  salesTaxPercent: number;
  buyAnnualInsurance: number;
  buyAnnualMaintenance: number;
  vehicleResaleValuePercent: number;
}

export interface MonthLeaseBuyBreakdown {
  month: number;
  leaseCumulativeCash: number;
  buyCumulativeCash: number;
  remainingLoanBalance: number;
  estimatedVehicleEquity: number;
  netBuyCostToDate: number;
}

export interface LeaseVsBuyResult {
  analysisTermMonths: number;
  analysisTermYears: number;
  leaseTotalPayments: number;
  leaseTotalUpfront: number;
  leaseTotalOperating: number;
  leaseTotalCashOutflow: number;
  leaseEndEquity: number;
  leaseNetCost: number;
  purchaseLoanMonthlyPayment: number;
  purchaseTotalPrincipalAndInterest: number;
  purchaseTotalUpfront: number;
  purchaseTotalOperating: number;
  purchaseTotalCashOutflow: number;
  purchaseRemainingLoanBalance: number;
  purchaseEstimatedVehicleValue: number;
  purchaseEndEquity: number;
  purchaseNetCost: number;
  netDifference: number;
  lowerNetCostOption: 'lease' | 'buy' | 'equal';
  breakdown: MonthLeaseBuyBreakdown[];
  summaryText: string;
}

// ============================================================================
// 4. Gas vs. EV Types
// ============================================================================

export interface GasVsEvInput {
  annualMiles: number;
  horizonYears: number;
  gasVehiclePrice: number;
  gasMpg: number;
  gasPricePerGallon: number;
  gasAnnualMaintenance: number;
  gasInsuranceAnnual: number;
  gasResaleValuePercent: number;
  evVehiclePrice: number;
  evEfficiencyMilesPerKwh: number;
  electricityCostPerKwh: number;
  evHomeChargerInstall: number;
  evTaxCredit: number;
  evAnnualMaintenance: number;
  evInsuranceAnnual: number;
  evResaleValuePercent: number;
}

export interface YearGasEvBreakdown {
  year: number;
  gasAnnualEnergy: number;
  gasAnnualMaint: number;
  gasAnnualInsurance: number;
  gasAnnualTotal: number;
  gasCumulativeOperating: number;
  evAnnualEnergy: number;
  evAnnualMaint: number;
  evAnnualInsurance: number;
  evAnnualTotal: number;
  evCumulativeOperating: number;
  operatingDifferenceCumulative: number;
}

export interface GasVsEvResult {
  horizonYears: number;
  annualMiles: number;
  totalMiles: number;
  gasAnnualFuelCost: number;
  gasFuelCostPerMile: number;
  gasTotalFuelCost: number;
  gasTotalMaintenanceCost: number;
  gasTotalInsuranceCost: number;
  gasTotalOperatingCost: number;
  gasNetAcquisitionCost: number;
  gasTotalCostOfOwnership: number;
  evAnnualElectricityCost: number;
  evElectricityCostPerMile: number;
  evTotalElectricityCost: number;
  evTotalMaintenanceCost: number;
  evTotalInsuranceCost: number;
  evTotalOperatingCost: number;
  evNetAcquisitionCost: number;
  evTotalCostOfOwnership: number;
  annualFuelSavingsWithEv: number;
  annualOperatingSavingsWithEv: number;
  totalTcoDifference: number;
  lowerTcoOption: 'gas' | 'ev' | 'equal';
  breakdown: YearGasEvBreakdown[];
  summaryText: string;
}

// ============================================================================
// 5. Buy vs. Repair Types
// ============================================================================

export interface BuyVsRepairInput {
  itemName: string;
  repairQuote: number;
  expectedLifespanAfterRepairYears: number;
  currentAnnualOperatingCost: number;
  subsequentRepairRiskPercent: number;
  subsequentRepairCost: number;
  replacementPrice: number;
  installationAndDisposalFee: number;
  replacementExpectedLifespanYears: number;
  replacementAnnualOperatingCost: number;
  warrantyYears: number;
}

export interface YearBuyRepairBreakdown {
  year: number;
  cumulativeRepairCash: number;
  cumulativeBuyCash: number;
  cumulativeOperatingSavingsWithNew: number;
}

export interface BuyVsRepairResult {
  itemName: string;
  repairRatioPercent: number;
  repairUpfrontCost: number;
  repairAnnualizedCapitalCost: number;
  repairAnnualizedTotalCost: number;
  repairTotal5YearEstimatedCost: number;
  buyUpfrontCost: number;
  buyAnnualizedCapitalCost: number;
  buyAnnualizedTotalCost: number;
  buyTotal5YearEstimatedCost: number;
  annualOperatingDifference: number;
  lowerAnnualizedOption: 'repair' | 'buy' | 'equal';
  annualDifference: number;
  breakdown: YearBuyRepairBreakdown[];
  summaryText: string;
}

// ============================================================================
// 6. DIY vs. Hire Types
// ============================================================================

export interface DiyVsHireInput {
  projectName: string;
  diyMaterialsCost: number;
  diyToolsEquipmentCost: number;
  diyEstimatedHours: number;
  personalHourlyRate: number;
  diyReworkRiskPercent: number;
  contractorQuote: number;
  homeownerCoordinationHours: number;
}

export interface DiyVsHireResult {
  projectName: string;
  diyDirectCashOutlay: number;
  diyOpportunityCostOfTime: number;
  diyRiskAdjustedBuffer: number;
  diyTotalEconomicCost: number;
  contractorDirectQuote: number;
  contractorCoordinationTimeValue: number;
  contractorTotalEconomicCost: number;
  directCashSavedByDiy: number;
  netEconomicDifference: number;
  lowerEconomicCostOption: 'diy' | 'hire' | 'equal';
  breakEvenHourlyRate: number;
  summaryText: string;
}

// ============================================================================
// 7. Debt vs. Invest Types
// ============================================================================

export interface DebtVsInvestInput {
  extraMonthlyCash: number;
  debtBalance: number;
  debtInterestRatePercent: number;
  debtMinimumMonthlyPayment: number;
  expectedInvestmentReturnPercent: number;
  investmentTaxRatePercent: number;
  horizonYears: number;
}

export interface YearDebtInvestBreakdown {
  year: number;
  debtFirstRemainingBalance: number;
  debtFirstInvestedBalance: number;
  debtFirstNetWorth: number;
  investFirstRemainingBalance: number;
  investFirstInvestedBalance: number;
  investFirstNetWorth: number;
  differenceInNetWorth: number;
}

export interface DebtVsInvestResult {
  horizonYears: number;
  extraMonthlyCash: number;
  optionADebtFreeMonth: number;
  optionATotalInterestPaid: number;
  optionAFinalDebtBalance: number;
  optionAFinalPortfolioValue: number;
  optionANetFinancialPosition: number;
  optionBTotalInterestPaid: number;
  optionBFinalDebtBalance: number;
  optionBFinalPortfolioValue: number;
  optionBNetFinancialPosition: number;
  netPositionDifference: number;
  higherNetOption: 'debt_first' | 'invest_first' | 'equal';
  fixedInterestRate: number;
  contractualInterestRate: number;
  guaranteedInterestRate: number;
  breakdown: YearDebtInvestBreakdown[];
  summaryText: string;
}

// ============================================================================
// 8. Buy vs. Subscribe Types
// ============================================================================

export type SubscriptionBillingCycle = 'monthly' | 'annual';

export interface BuyVsSubscribeInput {
  itemName: string;
  horizonYears: number;
  purchasePrice: number;
  setupOrActivationCost: number;
  annualMaintenanceCost: number;
  estimatedResaleValue: number;
  billingCycle: SubscriptionBillingCycle;
  monthlySubscriptionPrice: number;
  annualSubscriptionPrice: number;
  signupFee: number;
  annualRecurringFees: number;
}

export interface YearCostComparison {
  year: number;
  cumulativeBuyCost: number;
  cumulativeSubscribeCost: number;
  difference: number;
}

export interface BuyVsSubscribeResult {
  itemName: string;
  horizonYears: number;
  activeBillingCycle: SubscriptionBillingCycle;
  totalBuyCost: number;
  annualizedBuyCost: number;
  buyCost3Year: number;
  buyCost5Year: number;
  netCapitalCostAfterResale: number;
  totalSubscribeCost: number;
  annualizedSubscribeCost: number;
  subscribeCost3Year: number;
  subscribeCost5Year: number;
  effectiveAnnualSubscriptionRate: number;
  costDifference: number;
  lowerCostOption: 'buy' | 'subscribe' | 'equal';
  breakEvenMonths: number | null;
  breakEvenDescription: string;
  yearlyBreakdown: YearCostComparison[];
  summaryText: string;
}

// ============================================================================
// 9. New vs. Used Types
// ============================================================================

export interface VehicleOrAssetOption {
  label: string;
  purchasePrice: number;
  downPayment: number;
  financingApr: number;
  loanTermMonths: number;
  annualInsurance: number;
  annualMaintenance: number;
  annualOperatingCost: number;
  expectedResaleValue: number;
}

export interface NewVsUsedInput {
  horizonYears: number;
  newOption: VehicleOrAssetOption;
  usedOption: VehicleOrAssetOption;
}

export interface OptionOwnershipMetrics {
  label: string;
  purchasePrice: number;
  upfrontCash: number;
  financedAmount: number;
  monthlyLoanPayment: number;
  totalPaymentsOverHorizon: number;
  totalInterestOverHorizon: number;
  totalPrincipalPaidOverHorizon: number;
  remainingLoanBalance: number;
  totalInsurance: number;
  totalMaintenance: number;
  totalOperatingCost: number;
  estimatedDepreciation: number;
  endingResaleValue: number;
  endingEquity: number;
  totalOwnershipCost: number;
  annualizedOwnershipCost: number;
}

export interface NewVsUsedResult {
  horizonYears: number;
  newMetrics: OptionOwnershipMetrics;
  usedMetrics: OptionOwnershipMetrics;
  costDifference: number;
  lowerCostOption: 'new' | 'used' | 'equal';
  depreciationDifference: number;
  maintenanceDifference: number;
  interestDifference: number;
  insuranceDifference: number;
  operatingDifference: number;
  summaryText: string;
}

// ============================================================================
// 10. Bulk Buy Types
// ============================================================================

export interface BulkBuyInput {
  itemName: string;
  normalUnitPrice: number;
  normalQuantity: number;
  bulkPackagePrice: number;
  bulkQuantity: number;
  expectedMonthlyUsage: number;
  storageCost: number;
  expectedWastePercent: number;
}

export interface BulkBuyResult {
  itemName: string;
  normalCostPerUnit: number;
  nominalBulkCostPerUnit: number;
  nominalEquivalentCost: number;
  nominalSavings: number;
  nominalSavingsPercent: number;
  effectiveUsableQuantity: number;
  effectiveBulkCostPerUsableUnit: number;
  effectiveNormalCostForUsable: number;
  effectiveTotalBulkOutlay: number;
  effectiveSavings: number;
  effectiveSavingsPercent: number;
  breakEvenUnits: number;
  breakEvenWastePercent: number;
  monthsToConsumeBulk: number;
  monthsToConsumeUsable: number;
  isEffectiveSavingsPositive: boolean;
  summaryText: string;
}

// ============================================================================
// Scenario Comparison & Saved Decision Types (Pure Data Models)
// ============================================================================

export interface SavedDecisionScenario<TInput = unknown, TResult = unknown> {
  id: string;
  calculatorSlug: CalculatorSlug;
  title: string;
  inputs: TInput;
  resultsSnapshot: TResult;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
