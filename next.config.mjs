/** @type {import('next').NextConfig} */

/**
 * Icons and the manifest are served from public/, which defaults to a four-hour
 * max-age. That is why swapping the artwork left phones and browsers showing the
 * previous icon long after it was deployed. The version suffix in the filenames
 * is the real fix — a cache cannot ignore a new URL — and these headers make a
 * stale copy revalidate rather than be served blind.
 *
 * Literal sources rather than one regex: a pattern that silently fails to match
 * looks identical to a working one until someone checks the response headers.
 */
const REVALIDATE_ALWAYS = [
  "/icon-192-v2.png",
  "/icon-512-v2.png",
  "/apple-touch-icon-v2.png",
  "/favicon-32x32-v2.png",
  "/favicon-16x16-v2.png",
  "/favicon-v2.ico",
  "/logo-v2.png",
  "/site.webmanifest",
];

const nextConfig = {
  async headers() {
    return REVALIDATE_ALWAYS.map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
    }));
  },
};

export default nextConfig;
