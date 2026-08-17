function nonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, nonNegative(value)));
}

export function calculateTariffEstimate({
  totalKwh,
  billingDays,
  mode = "simple",
  simpleRate,
  peakRate,
  shoulderRate,
  offPeakRate,
  peakShare,
  shoulderShare,
  tierLimit,
  tierOneRate,
  tierTwoRate,
  fixedCharge,
  dailySupplyCharge,
  taxPercent,
  solarExportKwh,
  solarExportRate,
}) {
  const kwh = nonNegative(totalKwh);
  const days = nonNegative(billingDays);
  const peakShareValue = clamp(peakShare, 0, 100);
  const shoulderShareValue = clamp(shoulderShare, 0, 100);
  const peakKwh = kwh * (peakShareValue / 100);
  const shoulderKwh = kwh * (shoulderShareValue / 100);
  const offPeakKwh = Math.max(0, kwh - peakKwh - shoulderKwh);
  // Tier thresholds are published per month, but kwh here covers the whole
  // billing period. Applying the raw limit to a quarterly bill would grant one
  // month of cheap units and charge the remainder at the top rate, overcharging
  // exactly the quarterly-billed households the tier model exists to serve.
  const tierLimitValue = nonNegative(tierLimit);
  const tierMonths = days > 0 ? days / 30 : 1;
  const scaledTierLimit = tierLimitValue * tierMonths;
  const tierProrated = tierLimitValue > 0 && days > 0 && (days < 28 || days > 31);
  const tierOneKwh = Math.min(kwh, scaledTierLimit);
  const tierTwoKwh = Math.max(0, kwh - scaledTierLimit);

  const simpleUsageCost = kwh * nonNegative(simpleRate);
  const timeOfUseCost = peakKwh * nonNegative(peakRate) + shoulderKwh * nonNegative(shoulderRate) + offPeakKwh * nonNegative(offPeakRate);
  const tieredUsageCost = tierOneKwh * nonNegative(tierOneRate) + tierTwoKwh * nonNegative(tierTwoRate);
  const usageCost = mode === "timeOfUse"
    ? timeOfUseCost
    : mode === "tiered"
      ? tieredUsageCost
      : simpleUsageCost;

  const fixedChargeAmount = nonNegative(fixedCharge);
  const supplyChargeAmount = nonNegative(dailySupplyCharge) * days;
  const solarCreditAmount = nonNegative(solarExportKwh) * nonNegative(solarExportRate);
  const preTaxTotal = Math.max(0, usageCost + fixedChargeAmount + supplyChargeAmount - solarCreditAmount);
  const taxAmount = preTaxTotal * (clamp(taxPercent, 0, 100) / 100);
  const total = preTaxTotal + taxAmount;

  return {
    usageCost,
    fixedChargeAmount,
    supplyChargeAmount,
    solarCreditAmount,
    preTaxTotal,
    taxAmount,
    total,
    effectiveEnergyRate: kwh > 0 ? usageCost / kwh : 0,
    /** True when the monthly tier allowance was scaled to a non-monthly bill. */
    tierProrated,
    scaledTierLimit,
    allocation: {
      peakKwh,
      shoulderKwh,
      offPeakKwh,
      tierOneKwh,
      tierTwoKwh,
    },
  };
}
