import assert from "node:assert/strict";
import { calculateTariffEstimate } from "../app/lib/tariff.js";

function closeTo(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.000001, `${message}: expected ${expected}, received ${actual}`);
}

const simple = calculateTariffEstimate({ totalKwh: 100, billingDays: 30, simpleRate: 0.3 });
closeTo(simple.usageCost, 30, "Simple energy charge");
closeTo(simple.total, 30, "Simple total");

const timeOfUse = calculateTariffEstimate({
  totalKwh: 100,
  billingDays: 30,
  mode: "timeOfUse",
  peakRate: 0.5,
  offPeakRate: 0.2,
  peakShare: 40,
});
closeTo(timeOfUse.allocation.peakKwh, 40, "Peak allocation");
closeTo(timeOfUse.allocation.offPeakKwh, 60, "Off-peak allocation");
closeTo(timeOfUse.total, 32, "Time-of-use total");

const tiered = calculateTariffEstimate({
  totalKwh: 250,
  billingDays: 30,
  mode: "tiered",
  tierLimit: 100,
  tierOneRate: 0.1,
  tierTwoRate: 0.2,
});
closeTo(tiered.allocation.tierOneKwh, 100, "First-tier allocation");
closeTo(tiered.allocation.tierTwoKwh, 150, "Next-tier allocation");
closeTo(tiered.total, 40, "Progressive tier total");

const threePeriod = calculateTariffEstimate({
  totalKwh: 200,
  billingDays: 30,
  mode: "timeOfUse",
  peakRate: 0.5,
  shoulderRate: 0.3,
  offPeakRate: 0.1,
  peakShare: 25,
  shoulderShare: 25,
});
closeTo(threePeriod.allocation.peakKwh, 50, "Three-period peak allocation");
closeTo(threePeriod.allocation.shoulderKwh, 50, "Shoulder allocation");
closeTo(threePeriod.allocation.offPeakKwh, 100, "Three-period off-peak allocation");
closeTo(threePeriod.total, 50, "Three-period time-of-use total");

const fullBill = calculateTariffEstimate({
  totalKwh: 100,
  billingDays: 30,
  simpleRate: 0.3,
  fixedCharge: 5,
  dailySupplyCharge: 1,
  solarExportKwh: 20,
  solarExportRate: 0.1,
  taxPercent: 10,
});
closeTo(fullBill.supplyChargeAmount, 30, "Daily supply charge");
closeTo(fullBill.solarCreditAmount, 2, "Solar export credit");
closeTo(fullBill.preTaxTotal, 63, "Pre-tax total");
closeTo(fullBill.taxAmount, 6.3, "Tax amount");
closeTo(fullBill.total, 69.3, "Full bill total");

const oversizedCredit = calculateTariffEstimate({
  totalKwh: 10,
  billingDays: 30,
  simpleRate: 0.2,
  solarExportKwh: 100,
  solarExportRate: 1,
  taxPercent: 10,
});
closeTo(oversizedCredit.preTaxTotal, 0, "Credit floor");
closeTo(oversizedCredit.total, 0, "Non-negative final total");

console.log("Tariff validation passed: simple, time-of-use, tiers, charges, tax, solar credit, and non-negative totals.");
