/**
 * Colour contrast gate.
 *
 * Contrast is the one design property that is objectively checkable, and the
 * one most easily broken by an innocuous-looking tweak: nothing errors, nothing
 * looks obviously wrong to the person who made the change, and the text simply
 * becomes harder to read for everyone else. So the pairs the product actually
 * renders are listed here and checked on every release.
 *
 * Thresholds are WCAG 2.1 AA:
 *   text     4.5:1   body copy and anything small
 *   large    3.0:1   >=18.66px bold or >=24px regular
 *   ui       3.0:1   icons and controls that carry meaning
 * Purely decorative marks are listed as `decorative` and only reported.
 *
 * Add a pair whenever a new surface or ink is introduced. A colour that is not
 * listed is not checked.
 */

const THRESHOLDS = { text: 4.5, large: 3, ui: 3, decorative: 0 };

/** Surfaces the product paints things on. */
const S = {
  pageLight: "#eef3f1",
  card: "#ffffff",
  emeraldTint: "#ecfdf5",
  slateTint: "#f1f5f9",

  pageDark: "#06142b",
  cardDark: "#0b1b31",
  sunkDark: "#10233c",
  inputDark: "#0d2038",
  slate950: "#020617",

  emerald700: "#047857",
  emerald800: "#065f46",
  emerald400: "#34d399",

  // Darkest and lightest stops of the hero gradients, so copy is checked
  // against the hardest end rather than an average.
  heroDark: "#043a33",
  heroLight: "#0a7454",
};

/** Inks, including the alpha values used over dark and emerald grounds. */
const INK = {
  slate950: "#020617",
  slate900: "#0f172a",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  emerald950: "#022c22",
  emerald800: "#065f46",
  emerald700: "#047857",
  emerald600: "#059669",
  emerald500: "#10b981",
  emerald300: "#6ee7b7",
  emerald200: "#a7f3d0",
  emerald100: "#d1fae5",
  emerald50: "#ecfdf5",
  white: "#ffffff",
  amber100: "#fef3c7",
  amber900: "#78350f",
  rose300: "#fda4af",
  tabInactive: "#5b6b73",
  tabInactiveDark: "#94a8b8",

  // Values written straight into globals.css for the dark reading theme.
  darkBody: "#f8fafc",
  darkMuted: "#b9c5d6",
  darkFaint: "#cbd5e1",
  darkPlaceholder: "#7f8fa6",
  chartAxisDark: "#93a7b8",
  chartValueDark: "#f1f5f9",
  chartAxisLight: "#64748b",
  chartValueLight: "#0f172a",
  chartBarLight: "#34a382",
  chartBarLightLatest: "#047857",
  chartBarDark: "#2f7f68",
  chartBarDarkLatest: "#4ade9f",
};

const lin = (channel) => {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const luminance = (hex) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** Flattens a translucent ink onto its surface, the way the browser will. */
const over = (hex, alpha, backdrop) => {
  const [r1, g1, b1] = rgb(hex);
  const [r2, g2, b2] = rgb(backdrop);
  const mix = (a, b) => Math.round(a * alpha + b * (1 - alpha));
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

const contrast = (fg, bg) => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
};

/** [label, ink, surface, kind] */
const PAIRS = [
  // --- light theme, calculator and cards ---
  ["Body copy on page", INK.slate900, S.pageLight, "text"],
  ["Body copy on card", INK.slate900, S.card, "text"],
  ["Secondary copy on card", INK.slate600, S.card, "text"],
  ["Muted copy on card", INK.slate500, S.card, "text"],
  // The app pairs slate-600 with the tinted panel, not slate-500; slate-500
  // would land at 4.34 and was only ever a hypothetical in an earlier draft of
  // this list. Checking a pair the product does not render is how a list like
  // this drifts into fiction.
  ["Muted copy on tinted panel", INK.slate600, S.slateTint, "text"],
  ["Result count on card", INK.slate500, S.card, "text"],
  ["Link on card", INK.emerald700, S.card, "text"],
  ["Link on page", INK.emerald700, S.pageLight, "text"],
  ["Emerald copy on tint", INK.emerald800, S.emeraldTint, "text"],
  ["Large figure on card", INK.emerald600, S.card, "large"],
  ["White on emerald button", INK.white, S.emerald700, "text"],
  ["White on emerald button (dark)", INK.white, S.emerald800, "text"],
  ["Dark ink on bright emerald", INK.emerald950, S.emerald400, "text"],

  // --- hero gradients ---
  ["Hero heading, light stop", INK.white, S.heroLight, "large"],
  ["Hero body, light stop", over(INK.emerald50, 0.95, S.heroLight), S.heroLight, "text"],
  ["Hero stat label, light stop", over(INK.emerald50, 0.9, S.heroLight), S.heroLight, "text"],
  ["Hero body, dark stop", over(INK.emerald50, 0.95, S.heroDark), S.heroDark, "text"],

  // --- icons and controls on light ---
  ["Clear-search control", INK.slate500, S.card, "ui"],
  ["Row delete control", INK.slate500, S.card, "ui"],
  ["Checklist tick", INK.emerald600, S.emeraldTint, "ui"],
  ["Decorative arrow", INK.slate300, S.card, "decorative"],
  ["Decorative bullet", INK.emerald500, S.card, "decorative"],

  // --- dark reading theme ---
  ["Dark body on page", INK.darkBody, S.pageDark, "text"],
  ["Dark body on card", INK.darkBody, S.cardDark, "text"],
  ["Dark muted on card", INK.darkMuted, S.cardDark, "text"],
  ["Dark faint on card", INK.darkFaint, S.cardDark, "text"],
  ["Dark emerald on card", INK.emerald300, S.cardDark, "text"],
  ["Dark key points on sunk", INK.emerald200, S.sunkDark, "text"],
  ["Dark input text", INK.darkBody, S.inputDark, "text"],
  ["Dark input placeholder", INK.darkPlaceholder, S.inputDark, "text"],

  // --- bill history dark card ---
  ["Bill card rise", INK.rose300, S.slate950, "text"],
  ["Bill card fall", INK.emerald300, S.slate950, "text"],
  ["Bill card label", over(INK.white, 0.55, S.slate950), S.slate950, "text"],
  ["Bill card body", over(INK.white, 0.7, S.slate950), S.slate950, "text"],

  // --- amber warnings, both themes ---
  ["Amber warning on light", INK.amber900, "#fefce8", "text"],
  ["Amber warning on dark", INK.amber100, over("#fde68a", 0.1, S.pageDark), "text"],

  // --- bottom tab bar (10.5px labels, so held to the text threshold) ---
  ["Tab label, light", INK.tabInactive, over(INK.white, 0.92, S.pageLight), "text"],
  ["Tab label active, light", INK.emerald700, over(INK.white, 0.92, S.pageLight), "text"],
  ["Tab label, dark", INK.tabInactiveDark, over(S.cardDark, 0.94, S.pageDark), "text"],
  ["Tab label active, dark", INK.emerald300, over(S.cardDark, 0.94, S.pageDark), "text"],

  // --- chart ---
  ["Chart axis, light", INK.chartAxisLight, S.card, "text"],
  ["Chart value, light", INK.chartValueLight, S.card, "text"],
  ["Chart bar, light", INK.chartBarLight, S.card, "ui"],
  ["Chart latest bar, light", INK.chartBarLightLatest, S.card, "ui"],
  ["Chart axis, dark", INK.chartAxisDark, S.cardDark, "text"],
  ["Chart value, dark", INK.chartValueDark, S.cardDark, "text"],
  ["Chart bar, dark", INK.chartBarDark, S.cardDark, "ui"],
  ["Chart latest bar, dark", INK.chartBarDarkLatest, S.cardDark, "ui"],
];

const failures = [];
const warnings = [];
const lines = [];

for (const [label, ink, surface, kind] of PAIRS) {
  const value = contrast(ink, surface);
  const needed = THRESHOLDS[kind];
  const status = kind === "decorative" ? "note" : value >= needed ? "pass" : "FAIL";
  if (status === "FAIL") failures.push(`${label}: ${value.toFixed(2)}:1 against a required ${needed}:1 (${ink} on ${surface})`);
  else if (status === "pass" && value < needed + 0.35) warnings.push(`${label}: ${value.toFixed(2)}:1, only just above ${needed}:1`);
  lines.push(`  ${status.padEnd(4)} ${value.toFixed(2).padStart(6)}:1  ${label}`);
}

if (process.env.CONTRAST_VERBOSE) console.log(lines.join("\n"));

if (failures.length) {
  console.error(`Contrast check failed on ${failures.length} pair(s):`);
  console.error(failures.map((f) => `  - ${f}`).join("\n"));
  process.exitCode = 1;
} else {
  const note = warnings.length ? ` ${warnings.length} within 0.35 of the limit.` : "";
  console.log(`Contrast valid: ${PAIRS.length} colour pairs meet WCAG AA.${note}`);
  if (warnings.length) console.log(warnings.map((w) => `  - ${w}`).join("\n"));
}
