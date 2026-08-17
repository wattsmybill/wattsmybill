import assert from "node:assert/strict";
import { calculateTariffEstimate } from "../app/lib/tariff.js";
import { deriveEntry, explainChange } from "../app/lib/billHistory.js";

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
assert.equal(tiered.tierProrated, false, "A 30-day bill should not be flagged as prorated");

// A quarterly bill earns three months of the monthly allowance, not one.
// Unprorated, 650 kWh over 90 days billed 100 cheap units and 550 expensive
// ones instead of 300 and 350 — an overcharge of 20 at these rates.
const quarterlyTiered = calculateTariffEstimate({
  totalKwh: 650,
  billingDays: 90,
  mode: "tiered",
  tierLimit: 100,
  tierOneRate: 0.1,
  tierTwoRate: 0.2,
});
closeTo(quarterlyTiered.allocation.tierOneKwh, 300, "Quarterly first-tier allocation");
closeTo(quarterlyTiered.allocation.tierTwoKwh, 350, "Quarterly next-tier allocation");
closeTo(quarterlyTiered.total, 100, "Quarterly progressive tier total");
assert.equal(quarterlyTiered.tierProrated, true, "A 90-day bill should be flagged as prorated");

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

/* ---------------------------------------------------------------------------
   Bill history: the split between usage, price, fixed charges and credits is an
   identity, not an estimate. If it ever stops summing to the change it claims
   to explain, the page is contradicting itself in public — and that failure is
   invisible in the UI, because the numbers still render.
--------------------------------------------------------------------------- */
const entry = (values) => deriveEntry({ period: "2026-01", days: 30, ...values });

const reconciles = (label, before, after) => {
  const change = explainChange(entry(before), entry(after));
  assert.ok(change.explainable, `${label}: expected an explainable change`);
  const sum = change.parts.reduce((total, part) => total + part.amount, 0);
  closeTo(sum, change.total, `${label}: parts must sum to the total change`);
};

reconciles(
  "Usage and price only",
  { total: 186.4, kwh: 470, fixedCharge: 30 },
  { total: 210.5, kwh: 495, fixedCharge: 31 }
);

// A bill total is net of solar export, so without adding the credit back the
// implied price per kWh collapses and the split stops adding up.
reconciles(
  "Solar credit",
  { total: 180, kwh: 450, fixedCharge: 30, credits: 20 },
  { total: 150, kwh: 460, fixedCharge: 30, credits: 70 }
);

const solar = entry({ total: 150, kwh: 460, fixedCharge: 30, credits: 70 });
closeTo(solar.energyCost, 190, "Credits are added back before the energy charge");
closeTo(solar.effectiveRate, 190 / 460, "Price per kWh ignores credits");

// Anything the app cannot honestly explain must say so rather than guess.
const noUsage = explainChange(
  entry({ total: 200, kwh: 0, fixedCharge: 30 }),
  entry({ total: 260, kwh: 0, fixedCharge: 30 })
);
assert.equal(noUsage.explainable, false, "A change with no kWh must not be attributed");
closeTo(noUsage.total, 60, "The change itself is still reported");

const typo = explainChange(
  entry({ total: 200, kwh: 500, fixedCharge: 30 }),
  entry({ total: 20, kwh: 500, fixedCharge: 300 })
);
assert.equal(typo.explainable, false, "A fixed charge larger than the bill must not be explained");

console.log("Tariff validation passed: simple, time-of-use, tiers, charges, tax, solar credit, non-negative totals, and bill-change reconciliation.");
