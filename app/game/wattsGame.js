import { PRESETS } from "../data/appliances.js";

/**
 * Guess the Watts — pure game logic, deliberately free of React.
 *
 * The calculator's hardest moment is a blank Power (W) field: most people have
 * never had a reason to know what a kettle draws. This turns acquiring that
 * intuition into five rounds of a game, using the same preset table the
 * calculator itself is built on, so a score can never drift from the estimates.
 */

export const ROUNDS = 5;
export const MIN_WATTS = 5;
export const MAX_WATTS = 3000;
export const BEST_SCORE_KEY = "watts-my-bill-game-best";

/** The bulb every reveal is measured against — the one appliance everyone owns. */
const BULB_WATTS = 10;

/**
 * A curated subset rather than all 92 presets.
 *
 * The full table carries 23 aircon variants that differ only by horsepower and
 * inverter type. Asking someone to separate a 1.0 HP inverter split from a 1.0
 * HP inverter window unit tests whether they have memorised a spec sheet, not
 * whether they can sense how much power a machine draws. One representative
 * aircon stays; the ladder goes. "Aircon — other / not sure" goes too: an
 * appliance defined by not knowing makes an unfair thing to be scored on.
 */
const POOL_NAMES = new Set([
  "Smart Speaker",
  "Phone Charger",
  "Router",
  "LED Bulb",
  "Monitor",
  "Exhaust Fan",
  "Printer",
  "Ceiling Fan",
  "Robot Vacuum",
  "Laptop",
  "Electric Fan",
  "LED TV",
  "Television",
  "Smart TV",
  "Refrigerator",
  "Game Console",
  "Rangehood",
  "Freezer",
  "Desktop Computer",
  "Blender",
  "Washing Machine",
  "Gaming PC",
  "Rice Cooker",
  "Water Pump",
  "Toaster",
  "Coffee Maker",
  "Flat Iron / Steam Iron",
  "Hair Dryer / Blower",
  "Vacuum Cleaner",
  "Microwave",
  "Split type aircon 1.5 HP (non-inverter)",
  "Air Fryer",
  "Electric Kettle",
  "Dishwasher",
  "Water Heater",
  "Induction Cooker",
  "Oven",
  "Electric Stove",
  "Electric Range",
  "Dryer",
]);

export const GAME_APPLIANCES = PRESETS
  .filter((preset) => POOL_NAMES.has(preset.name))
  .map((preset) => ({
    name: preset.name,
    category: preset.category,
    watts: preset.watts,
    duty: Number(preset.duty) > 0 && Number(preset.duty) < 1 ? Number(preset.duty) : null,
  }))
  .sort((a, b) => a.watts - b.watts);

/**
 * One appliance drawn from each fifth of the wattage range.
 *
 * Drawing five at random from a pool that runs 8W to 3000W regularly dealt five
 * kitchen appliances in a row, which makes the same guess correct every time.
 * Banding guarantees a round near the bottom and a round near the top.
 */
export function buildRound(random = Math.random) {
  const pool = GAME_APPLIANCES;
  const bandSize = pool.length / ROUNDS;
  const picks = [];

  for (let band = 0; band < ROUNDS; band += 1) {
    const start = Math.floor(band * bandSize);
    const end = Math.max(start + 1, Math.floor((band + 1) * bandSize));
    const slice = pool.slice(start, end).filter((item) => !picks.some((p) => p.name === item.name));
    const source = slice.length > 0 ? slice : pool;
    picks.push(source[Math.floor(random() * source.length)]);
  }

  // Shuffled so the game does not climb predictably from bulb to dryer.
  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }

  return picks;
}

/**
 * Scored on ratio, not on difference.
 *
 * Being 200W out on a 3000W dryer is a good guess; being 200W out on a 10W bulb
 * is not. An absolute scale would call those two the same answer, so closeness
 * is measured as a factor: exact scores 100, twice or half scores 50, and four
 * times out or worse scores nothing.
 */
export function scoreGuess(guess, actual) {
  const g = Number(guess);
  const a = Number(actual);
  if (!Number.isFinite(g) || !Number.isFinite(a) || g <= 0 || a <= 0) return 0;
  const ratio = Math.max(g, a) / Math.min(g, a);
  const points = 100 * (1 - Math.log(ratio) / Math.log(4));
  return Math.max(0, Math.min(100, Math.round(points)));
}

export function verdictFor(points) {
  if (points >= 97) return { label: "Spot on", tone: "great" };
  if (points >= 75) return { label: "Very close", tone: "good" };
  if (points >= 45) return { label: "Close", tone: "ok" };
  if (points > 0) return { label: "Not quite", tone: "weak" };
  return { label: "Way off", tone: "weak" };
}

export function rankFor(total) {
  const max = ROUNDS * 100;
  const share = max > 0 ? total / max : 0;
  if (share >= 0.9) return "Meter reader";
  if (share >= 0.75) return "Sharp eye";
  if (share >= 0.5) return "Getting the feel";
  if (share >= 0.25) return "Still guessing";
  return "Worth another round";
}

/** Slider position (0–1000) to watts, on a log scale so the low end stays usable. */
export function positionToWatts(position) {
  const clamped = Math.max(0, Math.min(1000, Number(position) || 0));
  const raw = MIN_WATTS * Math.pow(MAX_WATTS / MIN_WATTS, clamped / 1000);
  if (raw < 100) return Math.max(MIN_WATTS, Math.round(raw / 5) * 5);
  if (raw < 1000) return Math.round(raw / 10) * 10;
  return Math.round(raw / 50) * 50;
}

export function wattsToPosition(watts) {
  const clamped = Math.max(MIN_WATTS, Math.min(MAX_WATTS, Number(watts) || MIN_WATTS));
  return Math.round((Math.log(clamped / MIN_WATTS) / Math.log(MAX_WATTS / MIN_WATTS)) * 1000);
}

/** The reveal line: nameplate draw expressed in the one unit everybody owns. */
export function bulbComparison(watts) {
  const bulbs = watts / BULB_WATTS;
  if (bulbs >= 2) return `about ${Math.round(bulbs)} LED bulbs`;
  if (bulbs >= 1) return "about one LED bulb";
  return `less than one LED bulb`;
}

export function loadBestScore() {
  if (typeof window === "undefined") return 0;
  try {
    const stored = Number(window.localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(stored) && stored > 0 ? Math.min(stored, ROUNDS * 100) : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(total) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(total));
  } catch {
    // A blocked localStorage costs the player a remembered best score, nothing more.
  }
}
