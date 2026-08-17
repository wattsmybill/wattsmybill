/**
 * Carrying an estimate in the URL.
 *
 * Two problems shared one cause. The Rate Library could only ever send someone
 * to an empty calculator, because nothing could be handed over; and the export
 * panel's "copy a link to this setup" copied the bare homepage address, so the
 * recipient opened an empty calculator too. The calculator now accepts state
 * from the query string, which makes both honest.
 *
 * Nothing here touches the report name or address fields — those are the one
 * genuinely personal thing the app holds, and they stay on the device.
 */

/** Short keys keep a shared link short enough to survive messaging apps. */
const FIELD_KEYS = {
  c: "country",
  r: "customRate",
  d: "billingDays",
  f: "fixedCharge",
  b: "actualBill",
  k: "billedKwh",
};

function toBase64Url(text) {
  const base64 = typeof btoa === "function"
    ? btoa(unescape(encodeURIComponent(text)))
    : Buffer.from(text, "utf8").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text) {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = typeof atob === "function"
    ? decodeURIComponent(escape(atob(base64)))
    : Buffer.from(base64, "base64").toString("utf8");
  return decoded;
}

/**
 * Packs a setup into a compact token.
 *
 * Appliances become positional arrays rather than objects — with a handful of
 * appliances the key names would otherwise dominate the link.
 */
export function encodeSetup({ appliances = [], country, customRate, billingDays, fixedCharge, actualBill, billedKwh } = {}) {
  const payload = {
    v: 1,
    a: appliances
      .filter((item) => item?.name || item?.watts)
      .slice(0, 20)
      // Positional, and duty is appended last so links made before it existed
      // still decode — a missing sixth value simply means "always on".
      .map((item) => [
        String(item.name || "").slice(0, 40),
        Number(item.watts) || 0,
        Number(item.hours) || 0,
        Number(item.days) || 0,
        Number(item.quantity) || 1,
        Number(item.duty) > 0 && Number(item.duty) <= 1 ? Number(item.duty) : 1,
      ]),
  };

  const scalars = { c: country, r: customRate, d: billingDays, f: fixedCharge, b: actualBill, k: billedKwh };
  for (const [key, value] of Object.entries(scalars)) {
    if (value !== undefined && value !== null && value !== "") payload[key] = value;
  }

  try {
    return toBase64Url(JSON.stringify(payload));
  } catch {
    return "";
  }
}

/** Unpacks a token. Returns null for anything malformed rather than throwing. */
export function decodeSetup(token) {
  if (!token) return null;

  try {
    const payload = JSON.parse(fromBase64Url(token));
    if (!payload || payload.v !== 1) return null;

    const result = {};
    for (const [key, field] of Object.entries(FIELD_KEYS)) {
      if (payload[key] !== undefined) result[field] = String(payload[key]);
    }

    if (Array.isArray(payload.a)) {
      result.appliances = payload.a
        .filter((row) => Array.isArray(row))
        .slice(0, 20)
        .map(([name, watts, hours, days, quantity, duty]) => ({
          name: String(name || "").slice(0, 40),
          watts: watts ? String(watts) : "",
          hours: hours ? String(hours) : "",
          days: days ? String(days) : "",
          quantity: Math.min(Math.max(Number(quantity) || 1, 1), 99),
          duty: Number(duty) > 0 && Number(duty) <= 1 ? Number(duty) : 1,
        }));
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Reads whatever the current URL offers.
 *
 * `setup` is the full shared estimate. `country` and `appliance` are the
 * readable single-purpose forms other pages link with, so a Rate Library card
 * or a guide can produce a link a human can still read.
 */
export function readSetupFromUrl(search) {
  if (!search) return null;

  const params = new URLSearchParams(search);
  const fromToken = decodeSetup(params.get("setup"));
  const result = fromToken || {};

  const country = params.get("country");
  if (country) result.country = country.slice(0, 60);

  const rate = params.get("rate");
  if (rate && Number.isFinite(Number(rate)) && Number(rate) > 0) result.customRate = rate;

  const appliance = params.get("appliance");
  if (appliance) result.appliance = appliance.slice(0, 40);

  return Object.keys(result).length > 0 ? result : null;
}

/** Builds the shareable address for a setup. */
export function buildShareUrl(origin, setup) {
  const token = encodeSetup(setup);
  if (!token) return origin;
  return `${origin}/?setup=${token}#calculator`;
}
