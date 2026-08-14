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
  const tierLimitValue = nonNegative(tierLimit);
  const tierOneKwh = Math.min(kwh, tierLimitValue);
  const tierTwoKwh = Math.max(0, kwh - tierLimitValue);

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
    allocation: {
      peakKwh,
      shoulderKwh,
      offPeakKwh,
      tierOneKwh,
      tierTwoKwh,
    },
  };
}
