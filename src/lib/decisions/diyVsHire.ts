export interface DiyVsHireInput {
  projectName: string;

  // DIY Option
  diyMaterialsCost: number; // e.g., $260
  diyToolsEquipmentCost: number; // e.g., $140
  diyEstimatedHours: number; // e.g., 20 hours
  personalHourlyRate: number; // e.g., $35 / hour
  diyReworkRiskPercent: number; // e.g., 15%

  // Hire Professional
  contractorQuote: number; // e.g., $1,150
  homeownerCoordinationHours: number; // e.g., 2 hours (vetting, prep, walkthrough)
}

export interface DiyVsHireResult {
  projectName: string;

  // DIY
  diyDirectCashOutlay: number; // Materials + Tools
  diyOpportunityCostOfTime: number; // Hours * Rate
  diyRiskAdjustedBuffer: number;
  diyTotalEconomicCost: number; // Cash + Time + Risk

  // Professional
  contractorDirectQuote: number;
  contractorCoordinationTimeValue: number;
  contractorTotalEconomicCost: number;

  // Comparative
  directCashSavedByDiy: number; // Contractor quote - DIY cash outlay
  netEconomicDifference: number; // Total economic cost difference
  lowerEconomicCostOption: 'diy' | 'hire' | 'equal';
  breakEvenHourlyRate: number; // Personal rate where DIY economic cost equals hiring
  summaryText: string;
}

export const DIY_VS_HIRE_DEFAULTS: DiyVsHireInput = {
  projectName: 'Home Improvement Project',
  diyMaterialsCost: 280,
  diyToolsEquipmentCost: 150,
  diyEstimatedHours: 18,
  personalHourlyRate: 35,
  diyReworkRiskPercent: 15,

  contractorQuote: 1100,
  homeownerCoordinationHours: 2,
};

export function calculateDiyVsHire(input: DiyVsHireInput): DiyVsHireResult {
  const {
    projectName,
    diyMaterialsCost,
    diyToolsEquipmentCost,
    diyEstimatedHours,
    personalHourlyRate,
    diyReworkRiskPercent,
    contractorQuote,
    homeownerCoordinationHours,
  } = input;

  const diyDirectCashOutlay = Math.round(diyMaterialsCost + diyToolsEquipmentCost);
  const diyOpportunityCostOfTime = Math.round(diyEstimatedHours * personalHourlyRate);
  const diyRiskAdjustedBuffer = Math.round((diyReworkRiskPercent / 100) * diyMaterialsCost);
  const diyTotalEconomicCost = diyDirectCashOutlay + diyOpportunityCostOfTime + diyRiskAdjustedBuffer;

  const contractorDirectQuote = Math.round(contractorQuote);
  const contractorCoordinationTimeValue = Math.round(homeownerCoordinationHours * personalHourlyRate);
  const contractorTotalEconomicCost = contractorDirectQuote + contractorCoordinationTimeValue;

  const directCashSavedByDiy = Math.max(0, contractorDirectQuote - diyDirectCashOutlay);
  const netEconomicDifference = Math.abs(diyTotalEconomicCost - contractorTotalEconomicCost);

  let lowerEconomicCostOption: 'diy' | 'hire' | 'equal' = 'equal';
  if (diyTotalEconomicCost < contractorTotalEconomicCost) {
    lowerEconomicCostOption = 'diy';
  } else if (contractorTotalEconomicCost < diyTotalEconomicCost) {
    lowerEconomicCostOption = 'hire';
  }

  // Break-even hourly rate calculation:
  // DIY Cash + (Hours_DIY * Rate) + Buffer = Contractor Quote + (Hours_Coord * Rate)
  // Rate * (Hours_DIY - Hours_Coord) = Contractor Quote - (DIY Cash + Buffer)
  const netHoursDiff = diyEstimatedHours - homeownerCoordinationHours;
  let breakEvenHourlyRate = 0;
  if (netHoursDiff > 0) {
    breakEvenHourlyRate = Number(
      ((contractorDirectQuote - (diyDirectCashOutlay + diyRiskAdjustedBuffer)) / netHoursDiff).toFixed(2)
    );
  }

  let summaryText = '';
  if (lowerEconomicCostOption === 'diy') {
    summaryText = `Executing this project DIY saves an estimated $${directCashSavedByDiy.toLocaleString()} in direct out-of-pocket cash compared to hiring a contractor ($${diyDirectCashOutlay.toLocaleString()} vs. $${contractorDirectQuote.toLocaleString()}). After valuing your ${diyEstimatedHours} hours of labor at $${personalHourlyRate}/hr, the total economic cost of DIY remains $${netEconomicDifference.toLocaleString()} lower than hiring. Hiring results in a lower total economic cost if your personal time is valued above $${breakEvenHourlyRate.toFixed(2)}/hour.`;
  } else if (lowerEconomicCostOption === 'hire') {
    summaryText = `While DIY requires $${directCashSavedByDiy.toLocaleString()} less direct cash than hiring a professional ($${diyDirectCashOutlay.toLocaleString()} vs. $${contractorDirectQuote.toLocaleString()}), hiring results in an estimated economic cost that is $${netEconomicDifference.toLocaleString()} lower when factoring in your ${diyEstimatedHours} personal hours at $${personalHourlyRate}/hr. The implied wage of doing it yourself ($${breakEvenHourlyRate.toFixed(2)}/hr) is lower than your chosen time valuation ($${personalHourlyRate}/hr).`;
  } else {
    summaryText = `Both doing it yourself and hiring a contractor produce an identical total economic impact of $${diyTotalEconomicCost.toLocaleString()} based on your $${personalHourlyRate}/hr valuation of personal time.`;
  }

  return {
    projectName,
    diyDirectCashOutlay,
    diyOpportunityCostOfTime,
    diyRiskAdjustedBuffer,
    diyTotalEconomicCost,
    contractorDirectQuote,
    contractorCoordinationTimeValue,
    contractorTotalEconomicCost,
    directCashSavedByDiy,
    netEconomicDifference,
    lowerEconomicCostOption,
    breakEvenHourlyRate: Math.max(0, breakEvenHourlyRate),
    summaryText,
  };
}

export function validateDiyVsHireInput(input: DiyVsHireInput): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (input.diyMaterialsCost < 0) errors.diyMaterialsCost = 'Materials cost cannot be negative.';
  if (input.diyEstimatedHours < 0) errors.diyEstimatedHours = 'Estimated hours cannot be negative.';
  if (input.personalHourlyRate < 0) errors.personalHourlyRate = 'Hourly rate cannot be negative.';
  if (input.contractorQuote <= 0) errors.contractorQuote = 'Contractor quote must be greater than zero.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
