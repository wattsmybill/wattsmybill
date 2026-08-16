/**
 * One theme for the whole product.
 *
 * The calculator and the Learning Hub each used to own a private dark mode —
 * the calculator inside its saved-session blob, the Hub under its own key — so
 * turning the lights off on one side left the other blazing. Both now read and
 * write THEME_KEY, and the resolved value is stamped on <html> before first
 * paint by the inline script below.
 */

export const THEME_KEY = "watts-my-bill-theme";

/** Legacy key the Learning Hub used before the two systems were merged. */
const LEGACY_LEARNING_KEY = "watts-my-bill-learning-theme";
/** The calculator's saved-session blob, which carried a `darkMode` field. */
const LEGACY_DATA_KEY = "watts-my-bill-data";

/**
 * Runs as a blocking inline script in <head>, before anything renders.
 *
 * Stringified rather than imported so it can execute ahead of the React
 * bundle; a theme restored after hydration is a theme the reader watches
 * flash. Migrates either legacy key on first run so nobody's existing
 * preference is thrown away.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var k="${THEME_KEY}",t=localStorage.getItem(k);
if(t!=="dark"&&t!=="light"){
  var l=localStorage.getItem("${LEGACY_LEARNING_KEY}");
  if(l==="dark"||l==="light"){t=l}
  else{try{var d=JSON.parse(localStorage.getItem("${LEGACY_DATA_KEY}")||"{}");if(typeof d.darkMode==="boolean"){t=d.darkMode?"dark":"light"}}catch(e){}}
  if(t==="dark"||t==="light"){localStorage.setItem(k,t)}
}
if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
document.documentElement.dataset.wmbTheme=t;
document.documentElement.style.colorScheme=t;
}catch(e){}})();`;

/** Reads the theme already resolved onto <html> by the bootstrap script. */
export function readTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.wmbTheme === "dark" ? "dark" : "light";
}

/** Persists a theme and stamps it on <html> so every route agrees immediately. */
export function writeTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  if (typeof document !== "undefined") {
    document.documentElement.dataset.wmbTheme = next;
    document.documentElement.style.colorScheme = next;
  }
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // A browser with storage disabled still gets the theme for this page view.
  }
  return next;
}
