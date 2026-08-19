import { AD_CLIENT } from "../lib/ads";

/**
 * ads.txt, generated rather than committed.
 *
 * The file has to carry the publisher ID, which does not belong in the
 * repository, so it is served from the same environment variable the ad units
 * read. Without a publisher ID there is nothing truthful to declare, so the
 * route 404s rather than serving an empty authorisation list.
 */
export const dynamic = "force-static";

export function GET() {
  if (!AD_CLIENT) {
    return new Response("Not found", { status: 404 });
  }

  const publisherId = AD_CLIENT.replace(/^ca-/, "");

  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
