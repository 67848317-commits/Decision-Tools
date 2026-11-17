import type {
  JobOfferCalculatedOption,
  JobOfferComparisonResult,
  JobOfferDetails,
} from '@decision-tools/shared-types';
import { validateJobOfferInput } from '@decision-tools/validation';
import { formatSummaryDollar } from '../formatters/index';

export type {
  JobOfferCalculatedOption,
  JobOfferComparisonResult,
  JobOfferDetails,
};
export { validateJobOfferInput };

export function calculateSingleJobOffer(offer: JobOfferDetails): JobOfferCalculatedOption {
  const weeks = offer.annualWorkWeeks > 0 ? offer.annualWorkWeeks : 50;
  const speed = offer.averageCommuteSpeedMph > 0 ? offer.averageCommuteSpeedMph : 35;
  const costPerMile =
    offer.estimatedVehicleCostPerMile >= 0 ? offer.estimatedVehicleCostPerMile : 0.725;

  const employerMatchDollars = Math.round(offer.baseSalary * (offer.employerMatchPercent / 100));
  const cashCompensationTotal = Math.round(
    offer.baseSalary + offer.annualBonus + employerMatchDollars + offer.otherCompensationAnnual
  );

  const effectiveCompensationPreCommute = Math.round(
    cashCompensationTotal - offer.annualHealthInsuranceCost
  );

  const roundTripMilesPerCommuteDay = offer.commuteMilesOneWay * 2;
  const annualCommuteDays = offer.commuteDaysPerWeek * weeks;
  const annualCommuteMiles = Math.round(annualCommuteDays * roundTripMilesPerCommuteDay);
  const annualCommuteCost = Math.round(annualCommuteMiles * costPerMile);

  const annualCommuteHours =
    speed > 0 ? Math.round((annualCommuteMiles / speed) * 10) / 10 : 0;

  const netEffectiveCompensation = Math.round(
    effectiveCompensationPreCommute - annualCommuteCost
  );

  const estimatedDailyRate = Math.round(offer.baseSalary / 260);
  const estimatedVacationValue = Math.round(offer.paidVacationDays * estimatedDailyRate);

  return {
    title: offer.title,
    baseSalary: Math.round(offer.baseSalary),
    annualBonus: Math.round(offer.annualBonus),
    employerMatchDollars,
    otherCompensation: Math.round(offer.otherCompensationAnnual),
    cashCompensationTotal,
    annualHealthCost: Math.round(offer.annualHealthInsuranceCost),
    effectiveCompensationPreCommute,
    annualCommuteMiles,
    annualCommuteCost,
    annualCommuteHours,
    netEffectiveCompensation,
    vacationDays: offer.paidVacationDays,
    estimatedDailyRate,
    estimatedVacationValue,
  };
}

export function compareJobOffers(
  offerA: JobOfferDetails,
  offerB: JobOfferDetails
): JobOfferComparisonResult {
  const calculatedA = calculateSingleJobOffer(offerA);
  const calculatedB = calculateSingleJobOffer(offerB);

  const compDiff = Math.abs(
    calculatedA.netEffectiveCompensation - calculatedB.netEffectiveCompensation
  );
  const commuteCostDiff = Math.abs(
    calculatedA.annualCommuteCost - calculatedB.annualCommuteCost
  );
  const commuteHoursDiff =
    Math.round(
      Math.abs(calculatedA.annualCommuteHours - calculatedB.annualCommuteHours) * 10
    ) / 10;
  const vacationDaysDiff = Math.abs(calculatedA.vacationDays - calculatedB.vacationDays);

  let higherNetOption: 'A' | 'B' | 'equal' = 'equal';
  if (calculatedA.netEffectiveCompensation > calculatedB.netEffectiveCompensation) {
    higherNetOption = 'A';
  } else if (calculatedB.netEffectiveCompensation > calculatedA.netEffectiveCompensation) {
    higherNetOption = 'B';
  }

  let summaryText = '';
  if (higherNetOption === 'A') {
    summaryText = `Under the entered parameters, Offer A provides an estimated net effective annual compensation of ${formatSummaryDollar(calculatedA.netEffectiveCompensation)} (after health premiums and commute expenses), which is ${formatSummaryDollar(compDiff)} higher than Offer B (${formatSummaryDollar(calculatedB.netEffectiveCompensation)}). Offer A also requires ${calculatedA.annualCommuteHours} estimated annual commute hours compared to ${calculatedB.annualCommuteHours} hours for Offer B.`;
  } else if (higherNetOption === 'B') {
    summaryText = `Under the entered parameters, Offer B provides an estimated net effective annual compensation of ${formatSummaryDollar(calculatedB.netEffectiveCompensation)} (after health premiums and commute expenses), which is ${formatSummaryDollar(compDiff)} higher than Offer A (${formatSummaryDollar(calculatedA.netEffectiveCompensation)}). Offer B requires ${calculatedB.annualCommuteHours} estimated annual commute hours compared to ${calculatedA.annualCommuteHours} hours for Offer A.`;
  } else {
    summaryText = `Under the entered parameters, both offers provide an identical estimated net effective annual compensation of ${formatSummaryDollar(calculatedA.netEffectiveCompensation)}, with a commute difference of ${commuteHoursDiff} annual hours.`;
  }

  return {
    optionA: calculatedA,
    optionB: calculatedB,
    compensationDifference: compDiff,
    higherNetOption,
    commuteCostDifference: commuteCostDiff,
    commuteHoursDifference: commuteHoursDiff,
    vacationDaysDifference: vacationDaysDiff,
    summaryText,
  };
}

export const JOB_OFFER_DEFAULTS_A: JobOfferDetails = {
  title: 'Offer A',
  baseSalary: 105000,
  annualBonus: 8000,
  employerMatchPercent: 4.0,
  employeeContributionForMatchPercent: 4.0,
  annualHealthInsuranceCost: 2400,
  paidVacationDays: 15,
  commuteMilesOneWay: 18,
  commuteDaysPerWeek: 3,
  remoteDaysPerWeek: 2,
  otherCompensationAnnual: 2000,
  estimatedVehicleCostPerMile: 0.725,
  averageCommuteSpeedMph: 35,
  annualWorkWeeks: 50,
};

export const JOB_OFFER_DEFAULTS_B: JobOfferDetails = {
  title: 'Offer B',
  baseSalary: 115000,
  annualBonus: 5000,
  employerMatchPercent: 3.0,
  employeeContributionForMatchPercent: 3.0,
  annualHealthInsuranceCost: 3200,
  paidVacationDays: 20,
  commuteMilesOneWay: 32,
  commuteDaysPerWeek: 4,
  remoteDaysPerWeek: 1,
  otherCompensationAnnual: 0,
  estimatedVehicleCostPerMile: 0.725,
  averageCommuteSpeedMph: 35,
  annualWorkWeeks: 50,
};
