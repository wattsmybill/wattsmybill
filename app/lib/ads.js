/**
 * AdSense configuration.
 *
 * Everything here comes from environment variables rather than the repository,
 * because a publisher ID identifies an account and a payment relationship. Set
 * them in Vercel (Project - Settings - Environment Variables) and redeploy.
 *
 * Until NEXT_PUBLIC_ADSENSE_CLIENT is set, no script loads and no slot renders,
 * so the site behaves exactly as it does today. Each placement additionally
 * needs its own slot ID, so ads can be switched on one page at a time.
 *
 * These are read as static property accesses, not through a computed key,
 * because Next.js inlines NEXT_PUBLIC_* at build time and only replaces
 * literal references.
 */

export const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export const AD_SLOTS = {
  calculator: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CALCULATOR || "",
  learn: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEARN || "",
  game: process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME || "",
};

/** True once a publisher ID exists, which is what gates the script itself. */
export const adsEnabled = Boolean(AD_CLIENT);

/** True when this particular placement has both a publisher ID and a slot. */
export function slotReady(placement) {
  return Boolean(AD_CLIENT && AD_SLOTS[placement]);
}
