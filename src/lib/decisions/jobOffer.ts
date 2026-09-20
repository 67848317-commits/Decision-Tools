export interface JobOfferDetails {
  title: string;
  baseSalary: number;
  annualBonus: number;
  employerMatchPercent: number; // e.g. 5%
  employeeContributionForMatchPercent: number; // e.g. 5% to capture the match
  annualHealthInsuranceCost: number; // Employee portion of premium
  paidVacationDays: number; // e.g. 15
  commuteMilesOneWay: number; // e.g. 18
  commuteDaysPerWeek: number; // e.g. 3
  remoteDaysPerWeek: number; // e.g. 2
  otherCompensationAnnual: number; // e.g. equity, stipends
  estimatedVehicleCostPerMile: number; // illustrative vehicle cost per mile (e.g. $0.725)
  averageCommuteSpeedMph: number; // e.g. 35 mph
  annualWorkWeeks: number; // usually 50 weeks (allowing 2 weeks holidays/standard)
}

export interface JobOfferCalculatedOption {
  title: string;
  baseSalary: number;
  annualBonus: number;
  employerMatchDollars: number;
  otherCompensation: number;
  cashCompensationTotal: number; // base + bonus + match + other
  annualHealthCost: number;
  effectiveCompensationPreCommute: number; // cashCompensationTotal - healthCost
  annualCommuteMiles: number;
  annualCommuteCost: number;
  annualCommuteHours: number;
  netEffectiveCompensation: number; // effectiveCompensationPreCommute - annualCommuteCost
  vacationDays: number;
  estimatedDailyRate: number; // baseSalary / 260 standard work days
  estimatedVacationValue: number; // vacationDays * dailyRate
}

export interface JobOfferComparisonResult {
  optionA: JobOfferCalculatedOption;
  optionB: JobOfferCalculatedOption;
  compensationDifference: number; // Math.abs(netEffectiveCompensation A - B)
  higherNetOption: 'A' | 'B' | 'equal';
  commuteCostDifference: number;
  commuteHoursDifference: number;
  vacationDaysDifference: number;
  summaryText: string;
}

export function validateJobOfferInput(offer: Partial<JobOfferDetails>, label: string): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (offer.baseSalary === undefined || offer.baseSalary < 0) {
    errors.baseSalary = `${label}: Base salary must be $0 or greater.`;
  }
  if (offer.annualBonus === undefined || offer.annualBonus < 0) {
    errors.annualBonus = `${label}: Annual bonus cannot be negative.`;
  }
  if (offer.employerMatchPercent === undefined || offer.employerMatchPercent < 0 || offer.employerMatchPercent > 100) {
    errors.employerMatchPercent = `${label}: 401(k) match must be between 0% and 100%.`;
  }
  if (offer.annualHealthInsuranceCost === undefined || offer.annualHealthInsuranceCost < 0) {
    errors.annualHealthInsuranceCost = `${label}: Health insurance cost cannot be negative.`;
  }
  if (offer.paidVacationDays === undefined || offer.paidVacationDays < 0 || offer.paidVacationDays > 100) {
    errors.paidVacationDays = `${label}: Vacation days must be between 0 and 100.`;
  }
  if (offer.commuteMilesOneWay === undefined || offer.commuteMilesOneWay < 0 || offer.commuteMilesOneWay > 300) {
    errors.commuteMilesOneWay = `${label}: Commute distance must be between 0 and 300 miles.`;
  }
  if (offer.commuteDaysPerWeek === undefined || offer.commuteDaysPerWeek < 0 || offer.commuteDaysPerWeek > 7) {
    errors.commuteDaysPerWeek = `${label}: Commute days must be between 0 and 7.`;
  }
  if (offer.remoteDaysPerWeek === undefined || offer.remoteDaysPerWeek < 0 || offer.remoteDaysPerWeek > 7) {
    errors.remoteDaysPerWeek = `${label}: Remote days must be between 0 and 7.`;
  }
  if ((offer.commuteDaysPerWeek ?? 0) + (offer.remoteDaysPerWeek ?? 0) > 7) {
    errors.commuteDaysPerWeek = `${label}: Combined commute and remote days cannot exceed 7 days per week.`;
  }
  if (offer.otherCompensationAnnual === undefined || offer.otherCompensationAnnual < 0) {
    errors.otherCompensationAnnual = `${label}: Other compensation cannot be negative.`;
  }
  if (offer.estimatedVehicleCostPerMile !== undefined && (offer.estimatedVehicleCostPerMile < 0 || offer.estimatedVehicleCostPerMile > 10)) {
    errors.estimatedVehicleCostPerMile = `${label}: Vehicle cost per mile must be between $0.00 and $10.00.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateSingleJobOffer(offer: JobOfferDetails): JobOfferCalculatedOption {
  const weeks = offer.annualWorkWeeks > 0 ? offer.annualWorkWeeks : 50;
  const speed = offer.averageCommuteSpeedMph > 0 ? offer.averageCommuteSpeedMph : 35;
  const costPerMile = offer.estimatedVehicleCostPerMile >= 0 ? offer.estimatedVehicleCostPerMile : 0.725;

  // 401(k) employer match: baseSalary * (employerMatchPercent / 100)
  const employerMatchDollars = Math.round(offer.baseSalary * (offer.employerMatchPercent / 100));
  const cashCompensationTotal = Math.round(offer.baseSalary + offer.annualBonus + employerMatchDollars + offer.otherCompensationAnnual);

  const effectiveCompensationPreCommute = Math.round(cashCompensationTotal - offer.annualHealthInsuranceCost);

  // Commute calculations: round trips per year = commuteDaysPerWeek * weeks * 2
  const roundTripMilesPerCommuteDay = offer.commuteMilesOneWay * 2;
  const annualCommuteDays = offer.commuteDaysPerWeek * weeks;
  const annualCommuteMiles = Math.round(annualCommuteDays * roundTripMilesPerCommuteDay);
  const annualCommuteCost = Math.round(annualCommuteMiles * costPerMile);

  // Hours: total miles / average speed
  const annualCommuteHours = speed > 0 ? Math.round((annualCommuteMiles / speed) * 10) / 10 : 0;

  const netEffectiveCompensation = Math.round(effectiveCompensationPreCommute - annualCommuteCost);

  // Vacation valuation: 260 standard workdays in a year
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

export function compareJobOffers(offerA: JobOfferDetails, offerB: JobOfferDetails): JobOfferComparisonResult {
  const calculatedA = calculateSingleJobOffer(offerA);
  const calculatedB = calculateSingleJobOffer(offerB);

  const compDiff = Math.abs(calculatedA.netEffectiveCompensation - calculatedB.netEffectiveCompensation);
  const commuteCostDiff = Math.abs(calculatedA.annualCommuteCost - calculatedB.annualCommuteCost);
  const commuteHoursDiff = Math.round(Math.abs(calculatedA.annualCommuteHours - calculatedB.annualCommuteHours) * 10) / 10;
  const vacationDaysDiff = Math.abs(calculatedA.vacationDays - calculatedB.vacationDays);

  let higherNetOption: 'A' | 'B' | 'equal' = 'equal';
  if (calculatedA.netEffectiveCompensation > calculatedB.netEffectiveCompensation) {
    higherNetOption = 'A';
  } else if (calculatedB.netEffectiveCompensation > calculatedA.netEffectiveCompensation) {
    higherNetOption = 'B';
  }

  let summaryText = '';
  if (higherNetOption === 'A') {
    summaryText = `Under the entered parameters, Offer A provides an estimated net effective annual compensation of $${calculatedA.netEffectiveCompensation.toLocaleString()} (after health premiums and commute expenses), which is $${compDiff.toLocaleString()} higher than Offer B ($${calculatedB.netEffectiveCompensation.toLocaleString()}). Offer A also requires ${calculatedA.annualCommuteHours} estimated annual commute hours compared to ${calculatedB.annualCommuteHours} hours for Offer B.`;
  } else if (higherNetOption === 'B') {
    summaryText = `Under the entered parameters, Offer B provides an estimated net effective annual compensation of $${calculatedB.netEffectiveCompensation.toLocaleString()} (after health premiums and commute expenses), which is $${compDiff.toLocaleString()} higher than Offer A ($${calculatedA.netEffectiveCompensation.toLocaleString()}). Offer B requires ${calculatedB.annualCommuteHours} estimated annual commute hours compared to ${calculatedA.annualCommuteHours} hours for Offer A.`;
  } else {
    summaryText = `Under the entered parameters, both offers provide an identical estimated net effective annual compensation of $${calculatedA.netEffectiveCompensation.toLocaleString()}, with a commute difference of ${commuteHoursDiff} annual hours.`;
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
