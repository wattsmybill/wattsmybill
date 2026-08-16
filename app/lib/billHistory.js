/**
 * Bill history.
 *
 * The calculator answers a question once and then has no reason to be reopened.
 * Bills, though, keep arriving. Logging each one as it lands turns a one-shot
 * estimate into a record that answers the question people actually argue about:
 * did we use more, or did it just get more expensive?
 *
 * Everything here is pure so the arithmetic can be checked without a browser.
 * Storage stays on the device — this is somebody's household spending.
 */

export const HISTORY_KEY = "watts-my-bill-history";
export const MAX_ENTRIES = 36;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

/** Adds the figures that are derived rather than entered. */
export function deriveEntry(entry) {
  const total = toNumber(entry.total);
  const kwh = toNumber(entry.kwh);
  const fixedCharge = Math.min(toNumber(entry.fixedCharge), total);
  const days = Math.max(toNumber(entry.days) || 30, 1);
  const energyCost = Math.max(total - fixedCharge, 0);

  return {
    ...entry,
    total,
    kwh,
    fixedCharge,
    days,
    energyCost,
    // The rate the household actually paid for energy, which is rarely the
    // headline rate once fixed charges are stripped out.
    effectiveRate: kwh > 0 ? energyCost / kwh : 0,
    dailyKwh: kwh / days,
    dailyCost: total / days,
  };
}

/**
 * Sorts oldest first and fills in derived figures.
 *
 * One bill per billing month: a repeated period is the same bill re-entered, so
 * the later one wins. Without this, storage edited by hand (or written by an
 * older build) could produce two rows sharing a React key and two bars sitting
 * on the same chart position.
 */
export function prepareEntries(entries = []) {
  const byPeriod = new Map();
  for (const entry of entries) {
    if (!entry || !entry.period) continue;
    byPeriod.set(String(entry.period), entry);
  }

  return [...byPeriod.values()]
    .map(deriveEntry)
    .sort((a, b) => String(a.period).localeCompare(String(b.period)))
    .slice(-MAX_ENTRIES);
}

/**
 * Splits the change between two bills into the three things that can cause it.
 *
 * usage  — same prices, different consumption
 * rate   — same consumption, different price per kWh
 * fixed  — standing charges, which move independently of both
 *
 * The three add up to the total change exactly, so the explanation can never
 * quietly disagree with the number it is explaining.
 */
export function explainChange(previous, current) {
  if (!previous || !current) return null;

  const usage = (current.kwh - previous.kwh) * previous.effectiveRate;
  const rate = (current.effectiveRate - previous.effectiveRate) * current.kwh;
  const fixed = current.fixedCharge - previous.fixedCharge;
  const total = current.total - previous.total;

  // sentenceLabel is carried separately rather than lower-casing label at the
  // call site, which turned "kWh" into "kwh".
  const parts = [
    { key: "usage", label: "How much you used", sentenceLabel: "how much you used", amount: usage },
    { key: "rate", label: "The price per kWh", sentenceLabel: "the price you paid per kWh", amount: rate },
    { key: "fixed", label: "Fixed daily charges", sentenceLabel: "fixed daily charges", amount: fixed },
  ];

  const largest = [...parts].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

  return {
    total,
    parts,
    largest,
    // Comparing a 30-day bill with a 92-day one on totals alone is misleading,
    // so the caller can warn rather than quietly mislead.
    comparablePeriods: Math.abs(current.days - previous.days) <= 3,
  };
}

/** Reads the stored history, tolerating anything malformed. */
export function loadHistory() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? prepareEntries(parsed) : [];
  } catch {
    return [];
  }
}

/** Persists history, keeping only the fields that were actually entered. */
export function saveHistory(entries) {
  if (typeof localStorage === "undefined") return;
  try {
    const payload = entries.map(({ id, period, total, kwh, fixedCharge, days, currency, note }) => ({
      id, period, total, kwh, fixedCharge, days, currency, note,
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(payload.slice(-MAX_ENTRIES)));
  } catch {
    // Storage can be full or disabled; the session still works in memory.
  }
}

/** "2026-08" → "Aug 2026", for axis labels and list rows. */
export function formatPeriod(period, { long = false } = {}) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(period || ""));
  if (!match) return String(period || "");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat("en", {
    month: long ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export const METRICS = [
  {
    id: "total",
    label: "What you paid",
    shortLabel: "Paid",
    field: "total",
    kind: "currency",
    description: "The whole bill, including fixed charges.",
  },
  {
    id: "kwh",
    label: "How much you used",
    shortLabel: "Used",
    field: "kwh",
    kind: "kwh",
    description: "Energy consumed, independent of price.",
  },
  {
    id: "rate",
    label: "Price per kWh",
    shortLabel: "Rate",
    field: "effectiveRate",
    kind: "rate",
    description: "What you actually paid per unit, after fixed charges are removed.",
  },
];
