import { pathToFileURL } from "node:url";
import { ARTICLES } from "../app/learn/articles.js";

const host = "www.wattsmybill.app";
const key = "ddc94ef336974a7ba3eb21e807622313";
const siteUrl = `https://${host}`;

/**
 * Every URL worth telling search engines about.
 *
 * Exported so the build validator can check it against the routes it already
 * knows, because this list silently drifted once: /history shipped in the
 * sitemap and the validator but was missing here, so the one genuinely new page
 * would never have been submitted.
 */
export const urlList = [
  siteUrl,
  `${siteUrl}/learn`,
  `${siteUrl}/rates`,
  `${siteUrl}/history`,
  `${siteUrl}/methodology`,
  ...ARTICLES.map((article) => `${siteUrl}/learn/${article.slug}`),
];

async function submit() {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${siteUrl}/${key}.txt`,
      urlList,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`IndexNow submission failed (${response.status}): ${details}`);
  }

  console.log(`IndexNow accepted ${urlList.length} updated URLs.`);
}

// Only submits when run directly. Importing this module — as the build
// validator does — must never fire a live submission as a side effect.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await submit();
}
