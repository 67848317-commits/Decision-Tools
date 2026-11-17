import type {
  DiyVsHireInput,
  DiyVsHireResult,
} from '@decision-tools/shared-types';
import { validateDiyVsHireInput } from '@decision-tools/validation';
import { formatFixedDecimal, formatSummaryDollar } from '../formatters/index';

export type { DiyVsHireInput, DiyVsHireResult };
export { validateDiyVsHireInput };

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
  const diyTotalEconomicCost =
    diyDirectCashOutlay + diyOpportunityCostOfTime + diyRiskAdjustedBuffer;

  const contractorDirectQuote = Math.round(contractorQuote);
  const contractorCoordinationTimeValue = Math.round(
    homeownerCoordinationHours * personalHourlyRate
  );
  const contractorTotalEconomicCost =
    contractorDirectQuote + contractorCoordinationTimeValue;

  const directCashSavedByDiy = Math.max(0, contractorDirectQuote - diyDirectCashOutlay);
  const netEconomicDifference = Math.abs(diyTotalEconomicCost - contractorTotalEconomicCost);

  let lowerEconomicCostOption: 'diy' | 'hire' | 'equal' = 'equal';
  if (diyTotalEconomicCost < contractorTotalEconomicCost) {
    lowerEconomicCostOption = 'diy';
  } else if (contractorTotalEconomicCost < diyTotalEconomicCost) {
    lowerEconomicCostOption = 'hire';
  }

  const netHoursDiff = diyEstimatedHours - homeownerCoordinationHours;
  let breakEvenHourlyRate = 0;
  if (netHoursDiff > 0) {
    breakEvenHourlyRate = Number(
      (
        (contractorDirectQuote - (diyDirectCashOutlay + diyRiskAdjustedBuffer)) /
        netHoursDiff
      ).toFixed(2)
    );
  }

  let summaryText = '';
  if (lowerEconomicCostOption === 'diy') {
    summaryText = `Executing this project DIY saves an estimated ${formatSummaryDollar(directCashSavedByDiy)} in direct out-of-pocket cash compared to hiring a contractor (${formatSummaryDollar(diyDirectCashOutlay)} vs. ${formatSummaryDollar(contractorDirectQuote)}). After valuing your ${diyEstimatedHours} hours of labor at $${personalHourlyRate}/hr, the total economic cost of DIY remains ${formatSummaryDollar(netEconomicDifference)} lower than hiring. Hiring results in a lower total economic cost if your personal time is valued above $${formatFixedDecimal(breakEvenHourlyRate, 2)}/hour.`;
  } else if (lowerEconomicCostOption === 'hire') {
    summaryText = `While DIY requires ${formatSummaryDollar(directCashSavedByDiy)} less direct cash than hiring a professional (${formatSummaryDollar(diyDirectCashOutlay)} vs. ${formatSummaryDollar(contractorDirectQuote)}), hiring results in an estimated economic cost that is ${formatSummaryDollar(netEconomicDifference)} lower when factoring in your ${diyEstimatedHours} personal hours at $${personalHourlyRate}/hr. The implied wage of doing it yourself ($${formatFixedDecimal(breakEvenHourlyRate, 2)}/hr) is lower than your chosen time valuation ($${personalHourlyRate}/hr).`;
  } else {
    summaryText = `Both doing it yourself and hiring a contractor produce an identical total economic impact of ${formatSummaryDollar(diyTotalEconomicCost)} based on your $${personalHourlyRate}/hr valuation of personal time.`;
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
