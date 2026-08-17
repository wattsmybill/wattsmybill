/** @type {import('next').NextConfig} */

/**
 * Note on icon caching, because this cost real time to work out:
 *
 * Files in public/ are served by Vercel's static layer with max-age=14400, and
 * a `headers()` block here does NOT override that — it was tried, with both a
 * regex and literal paths, and the response headers never changed. Replacing
 * icon artwork at a stable URL therefore leaves browsers on the old bytes for
 * hours, and an installed PWA keeps its icon indefinitely.
 *
 * The fix in use is the version suffix on the icon filenames (icon-512-v2.png
 * and friends). A new URL is the one thing a cache cannot ignore. When the
 * artwork changes, bump the suffix and update the references listed in the
 * icons block of app/layout.js and public/site.webmanifest.
 *
 * If per-file cache headers are ever genuinely needed, the mechanism on this
 * platform is a `headers` entry in vercel.json, not this file.
 */
const nextConfig = {};

export default nextConfig;
