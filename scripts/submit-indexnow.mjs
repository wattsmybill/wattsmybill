import { ARTICLES } from "../app/learn/articles.js";

const host = "www.wattsmybill.app";
const key = "ddc94ef336974a7ba3eb21e807622313";
const siteUrl = `https://${host}`;
const urlList = [
  siteUrl,
  `${siteUrl}/learn`,
  `${siteUrl}/rates`,
  `${siteUrl}/methodology`,
  ...ARTICLES.map((article) => `${siteUrl}/learn/${article.slug}`),
];

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
