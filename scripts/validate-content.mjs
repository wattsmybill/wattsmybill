import { ARTICLES } from "../app/learn/articles.js";
import { PRESETS } from "../app/data/appliances.js";
import { HOUSEHOLD_PRESETS } from "../app/data/householdPresets.js";
import { COUNTRIES } from "../app/data/countries.js";
import { getRateReference } from "../app/data/rateReferences.js";
import { PREFILL_SLUGS, articlePrefillHref, prefillNames } from "../app/lib/articlePrefill.js";
import { decodeSetup } from "../app/lib/shareState.js";

const errors = [];
const seenSlugs = new Set();
const allowedCategories = new Set(["Appliance costs", "Bill troubleshooting", "Energy basics", "Reading your bill", "Saving electricity", "Solar and storage", "Tariffs and rates"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);

for (const article of ARTICLES) {
  if (seenSlugs.has(article.slug)) errors.push(`Duplicate article slug: ${article.slug}`);
  seenSlugs.add(article.slug);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) errors.push(`Invalid article slug: ${article.slug}`);
  if (!allowedCategories.has(article.category)) errors.push(`Unsupported category: ${article.slug} (${article.category})`);
  if (!/^\d+ min read$/.test(article.readingTime || "")) errors.push(`Invalid reading time: ${article.slug}`);
  if (!isoDatePattern.test(article.published || "") || !isoDatePattern.test(article.updated || "")) {
    errors.push(`Invalid article date: ${article.slug}`);
  } else {
    if (article.updated < article.published) errors.push(`Updated date precedes publication: ${article.slug}`);
    if (article.updated > today) errors.push(`Future updated date: ${article.slug}`);
  }

  if (!article.title || !article.description || !article.intro) {
    errors.push(`Missing required copy: ${article.slug}`);
  }
  if (!Array.isArray(article.takeaways) || article.takeaways.length < 3) {
    errors.push(`Needs at least three takeaways: ${article.slug}`);
  }
  if (!Array.isArray(article.sections) || article.sections.length < 3) {
    errors.push(`Needs at least three sections: ${article.slug}`);
  }
  if (!Array.isArray(article.sources) || article.sources.length === 0) {
    errors.push(`Needs at least one source: ${article.slug}`);
  } else if (article.sources.some((source) => !source.url?.startsWith("https://"))) {
    errors.push(`Source URLs must use HTTPS: ${article.slug}`);
  } else if (new Set(article.sources.map((source) => source.url)).size !== article.sources.length) {
    errors.push(`Duplicate source URL: ${article.slug}`);
  }
}

const validateAppliance = (item, context) => {
  if (!item.name) errors.push(`Missing appliance name: ${context}`);
  if (!(Number(item.watts) > 0)) errors.push(`Invalid wattage: ${context}`);
  if (Number(item.hours) < 0 || Number(item.hours) > 24) errors.push(`Invalid hours: ${context}`);
  if (Number(item.days) < 0 || Number(item.days) > 31) errors.push(`Invalid days: ${context}`);
  if (item.quantity !== undefined && !(Number(item.quantity) > 0)) errors.push(`Invalid quantity: ${context}`);
};

PRESETS.forEach((item) => validateAppliance(item, `preset ${item.name || "unnamed"}`));
HOUSEHOLD_PRESETS.forEach((preset) => {
  preset.appliances.forEach((item) => validateAppliance(item, `${preset.name}: ${item.name || "unnamed"}`));
});

const countryNames = COUNTRIES.map((country) => country.name);
if (new Set(countryNames).size !== countryNames.length) errors.push("Country names must be unique");

const namedCountries = COUNTRIES.filter((country) => !country.isPlaceholder && country.name !== "Other Country");
for (const country of namedCountries) {
  if (!(Number(country.rate) > 0)) errors.push(`Named country needs a positive default rate: ${country.name}`);
  if (!country.currency) errors.push(`Named country needs a currency: ${country.name}`);
}

const sourcedCountries = COUNTRIES.filter((country) => {
  const reference = getRateReference(country.name);
  if (!reference) return false;
  if (!reference.url?.startsWith("https://") || !reference.authority || !reference.coverage || !reference.checked) {
    errors.push(`Incomplete rate reference: ${country.name}`);
  }
  if (!isoDatePattern.test(reference.checked || "") || reference.checked > today) {
    errors.push(`Invalid rate reference check date: ${country.name}`);
  }
  return true;
});

for (const country of namedCountries) {
  if (!getRateReference(country.name)) errors.push(`Missing rate reference: ${country.name}`);
}

// Guides that hand their appliances to the calculator. A preset renamed in the
// catalogue would otherwise leave the link silently short an appliance, or drop
// the prefill entirely, with nothing failing.
for (const slug of PREFILL_SLUGS) {
  if (!ARTICLES.some((article) => article.slug === slug)) {
    errors.push(`Prefill points at a guide that does not exist: ${slug}`);
    continue;
  }

  for (const name of prefillNames(slug)) {
    if (!PRESETS.some((preset) => preset.name === name)) {
      errors.push(`Prefill for ${slug} names an appliance not in the catalogue: ${name}`);
    }
  }

  const href = articlePrefillHref(slug);
  if (!href) {
    errors.push(`Prefill for ${slug} produced no link`);
    continue;
  }

  const expected = prefillNames(slug).length;
  const decoded = decodeSetup(href.match(/setup=([^#]+)/)?.[1] || "");
  if (decoded?.appliances?.length !== expected) {
    errors.push(
      `Prefill for ${slug} does not round-trip: expected ${expected}, decoded ${decoded?.appliances?.length ?? 0}`,
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Content valid: ${ARTICLES.length} guides, ${PRESETS.length} appliance presets, ${HOUSEHOLD_PRESETS.length} household presets, ${namedCountries.length} named countries, ${sourcedCountries.length} with official rate context, ${PREFILL_SLUGS.length} guide prefills round-trip.`
  );
}
