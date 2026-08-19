import { PRESETS } from "../data/appliances.js";
import { encodeSetup } from "./shareState.js";

/**
 * Guides that can hand their subject straight to the calculator.
 *
 * An article about water heaters ended at a button marked "Open calculator",
 * which opened an empty one — the reader had to go and find the appliance they
 * had just spent five minutes reading about. The URL encoding to carry a setup
 * already existed for shared links; this points it at the guides.
 *
 * Deliberately not every article. A guide about reading a prepaid meter or
 * about why an estimate differs from a bill has no appliance at its centre, and
 * prefilling one there would be furniture rather than help. Those keep the
 * plain link.
 */
const PREFILLS = {
  "fan-vs-air-conditioner-electricity-cost": [
    "Electric Fan",
    "Split type aircon 1.0 HP (inverter)",
  ],
  "how-much-electricity-does-a-water-heater-use": ["Water Heater"],
  "watts-kwh-electricity-cost-explained": ["LED Bulb", "Electric Kettle"],
  "how-much-does-an-appliance-cost-to-run": ["Rice Cooker", "Microwave"],
  "peak-off-peak-time-of-use-electricity": ["Washing Machine", "Dryer"],
  "why-electricity-usage-high-at-night": [
    "Refrigerator",
    "Split type aircon 1.0 HP (inverter)",
    "Water Heater",
  ],
  "how-to-lower-electricity-bill-without-guessing": [
    "Split type aircon 1.5 HP (non-inverter)",
    "Refrigerator",
    "Television",
  ],
  "why-is-my-electricity-bill-so-high": [
    "Split type aircon 1.5 HP (non-inverter)",
    "Refrigerator",
    "Electric Fan",
    "Television",
  ],
};

function toAppliance(name) {
  const preset = PRESETS.find((item) => item.name === name);
  if (!preset) return null;

  const duty = Number(preset.duty);
  return {
    name: preset.name,
    watts: preset.watts,
    hours: preset.hours,
    days: preset.days,
    quantity: 1,
    // Only a real cycling factor travels. Anything else resolves by name at the
    // other end, which is what keeps a hand-typed fridge honest.
    duty: duty > 0 && duty < 1 ? duty : 1,
  };
}

/** The appliance names a guide prefills, or null. Exported for the validator. */
export function prefillNames(slug) {
  return PREFILLS[slug] || null;
}

/** A calculator link carrying this guide's appliances, or null. */
export function articlePrefillHref(slug) {
  const names = PREFILLS[slug];
  if (!names) return null;

  const appliances = names.map(toAppliance).filter(Boolean);
  if (appliances.length === 0) return null;

  const token = encodeSetup({ appliances });
  return token ? `/?setup=${token}#calculator` : null;
}

export const PREFILL_SLUGS = Object.keys(PREFILLS);
