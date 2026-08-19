import { COUNTRIES } from "../data/countries.js";
import { PRESETS } from "../data/appliances.js";
import { getRateReference } from "../data/rateReferences.js";

/**
 * Per-country rate pages.
 *
 * The rate library held 35 countries of regulator-sourced data on a single
 * page, which is one entry point for thirty-five different questions. People do
 * not search for electricity prices in the abstract: they search for their own
 * country, usually alongside an appliance they are worried about. These pages
 * answer that pairing with figures computed from the same data the calculator
 * runs on, so a page can never quote a number the tool would contradict.
 */

/** Countries that carry real data. The placeholder and "Other Country" do not. */
export const RATE_COUNTRIES = COUNTRIES.filter(
  (country) => !country.isPlaceholder && country.name !== "Other Country",
);

/**
 * Countries whose names take a definite article in running prose. "Electricity
 * rates in Philippines" is how a template writes it; nobody says it that way,
 * and the phrase appears in the H1, the title tag and the meta description, so
 * it is the first thing a search result shows.
 */
const ARTICLE_COUNTRIES = new Set([
  "Philippines",
  "United States",
  "United Kingdom",
  "Netherlands",
  "UAE",
]);

export function theCountry(name) {
  return ARTICLE_COUNTRIES.has(name) ? `the ${name}` : name;
}

export function toCountrySlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCountryBySlug(slug) {
  const match = RATE_COUNTRIES.find((country) => toCountrySlug(country.name) === slug);
  if (!match) return null;
  return { ...match, ...getRateReference(match.name) };
}

export const COUNTRY_SLUGS = RATE_COUNTRIES.map((country) => toCountrySlug(country.name));

/**
 * The appliances costed on every country page.
 *
 * Chosen to span the range and to be recognisable anywhere rather than to be
 * exhaustive: a fridge that never switches off, an aircon that dominates a bill
 * in hot countries, and small things people wrongly assume are expensive. The
 * full 92 are a page nobody reads.
 */
const COSTED_APPLIANCE_NAMES = [
  "Split type aircon 1.0 HP (inverter)",
  "Refrigerator",
  "Electric Fan",
  "Television",
  "Rice Cooker",
  "Washing Machine",
  "Electric Kettle",
  "Water Heater",
  "Laptop",
  "LED Bulb",
];

/**
 * Monthly kWh for a preset, including its duty cycle.
 *
 * A fridge is rated 150W but cycles, so the honest monthly figure is not
 * watts x hours x days. The calculator applies the same factor, and these pages
 * disclose it for the same reason the appliance rows do: otherwise the numbers
 * on the page do not multiply out.
 */
export function monthlyKwh(preset) {
  const duty = Number(preset.duty) > 0 && Number(preset.duty) < 1 ? Number(preset.duty) : 1;
  return (preset.watts * preset.hours * preset.days * duty) / 1000;
}

export function costedAppliances(rate) {
  return COSTED_APPLIANCE_NAMES.map((name) => {
    const preset = PRESETS.find((item) => item.name === name);
    if (!preset) return null;
    const kwh = monthlyKwh(preset);
    return {
      name: preset.name,
      watts: preset.watts,
      hours: preset.hours,
      days: preset.days,
      duty: Number(preset.duty) > 0 && Number(preset.duty) < 1 ? Number(preset.duty) : null,
      kwh,
      cost: kwh * rate,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.cost - a.cost);
}

/**
 * Currency labels for the social card only.
 *
 * The card is rendered by Satori against a single embedded face, and three of
 * these symbols do not survive it: the won and the dong have no glyph in Geist
 * and came out as empty boxes, and the dirham mark reorders against Latin
 * digits under bidi. A three-letter code is unambiguous at thumbnail size and
 * cannot fail to render, so those three use one. The rest keep their symbol,
 * which is more recognisable to the people who actually use it.
 */
const CARD_CURRENCY_CODES = {
  "₩": "KRW ",
  "₫": "VND ",
  "د.إ": "AED ",
};

export function cardMoney(value, currency) {
  const code = CARD_CURRENCY_CODES[currency];
  if (!code) return formatMoney(value, currency);

  const number = Number(value) || 0;
  const decimals = number >= 100 ? 0 : 2;
  return `${code}${number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Money for a country page: its own currency symbol, two decimals. */
export function formatMoney(value, currency) {
  const number = Number(value) || 0;
  const decimals = number >= 100 ? 0 : 2;
  return `${currency}${number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
