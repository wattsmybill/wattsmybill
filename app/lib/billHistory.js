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

/**
 * Adds the figures that are derived rather than entered.
 *
 * `credits` covers anything that reduced the bill without reducing the price of
 * energy — solar export payments, rebates, account adjustments. A bill total is
 * net of those, so without adding them back the implied price per kWh reads far
 * lower than the household actually pays, and a solar export large enough to
 * cover the energy charge drove it to zero entirely.
 */
export function deriveEntry(entry) {
  const total = toNumber(entry.total);
  const kwh = toNumber(entry.kwh);
  const credits = toNumber(entry.credits);
  const grossBeforeCredits = total + credits;
  const enteredFixed = toNumber(entry.fixedCharge);
  const fixedCharge = Math.min(enteredFixed, grossBeforeCredits);
  const days = Math.max(toNumber(entry.days) || 30, 1);
  const rawEnergyCost = grossBeforeCredits - fixedCharge;
  const energyCost = Math.max(rawEnergyCost, 0);
  // A fixed charge larger than the whole bill is a typo, not a tariff. Clamping
  // it keeps the arithmetic safe, but explaining a change from figures the user
  // did not enter would be worse than admitting they do not add up.
  const fixedClamped = enteredFixed > grossBeforeCredits + 0.005;

  return {
    ...entry,
    total,
    kwh,
    credits,
    fixedCharge,
    days,
    energyCost,
    // False when the entered figures had to be clamped to stay sensible — the
    // caller should not build an explanation on numbers the user did not enter.
    figuresConsistent: rawEnergyCost >= 0 && !fixedClamped,
    // The rate the household actually paid for energy, which is rarely the
    // headline rate once fixed charges are stripped out and credits added back.
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

  const total = current.total - previous.total;

  // The split is derived from usage and price per unit, so without a kWh figure
  // on both bills there is nothing to divide the change between. Returning the
  // change with `explainable: false` lets the caller report what happened while
  // staying silent on why — the alternative was naming a cause at random, which
  // it did: three components of zero, and "mostly how much you used" printed
  // with full confidence.
  if (!(previous.kwh > 0) || !(current.kwh > 0)) {
    return { total, parts: [], largest: null, explainable: false, missing: "usage", comparablePeriods: true };
  }

  if (!previous.figuresConsistent || !current.figuresConsistent) {
    return { total, parts: [], largest: null, explainable: false, missing: "consistency", comparablePeriods: true };
  }

  const usage = (current.kwh - previous.kwh) * previous.effectiveRate;
  const rate = (current.effectiveRate - previous.effectiveRate) * current.kwh;
  const fixed = current.fixedCharge - previous.fixedCharge;
  // Credits reduce the bill, so a larger credit is a downward force on it. The
  // sign is flipped here to keep every part reading in the same direction:
  // positive pushed the bill up, negative pulled it down.
  const credit = -(current.credits - previous.credits);

  // sentenceLabel is carried separately rather than lower-casing label at the
  // call site, which turned "kWh" into "kwh".
  const parts = [
    { key: "usage", label: "How much you used", sentenceLabel: "how much you used", amount: usage },
    { key: "rate", label: "The price per kWh", sentenceLabel: "the price you paid per kWh", amount: rate },
    { key: "fixed", label: "Fixed daily charges", sentenceLabel: "fixed daily charges", amount: fixed },
  ];

  // Only shown when a credit actually moved, so solar households get the
  // explanation and everyone else keeps three tiles instead of four.
  if (Math.abs(credit) > 0.005) {
    parts.push({ key: "credit", label: "Credits and rebates", sentenceLabel: "a change in credits", amount: credit });
  }

  const largest = [...parts].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

  // The three parts are an identity: they must reconcile to the change they
  // claim to explain. If rounding or clamped inputs ever break that, the
  // explanation is withheld rather than shown alongside a total it contradicts.
  const reconciles = Math.abs(parts.reduce((sum, part) => sum + part.amount, 0) - total) < 0.01;

  return {
    total,
    parts,
    largest,
    explainable: reconciles,
    missing: reconciles ? null : "reconciliation",
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
    const payload = entries.map(({ id, period, total, kwh, fixedCharge, credits, days, currency, note }) => ({
      id, period, total, kwh, fixedCharge, credits, days, currency, note,
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
