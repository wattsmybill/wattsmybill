import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ARTICLES } from "../app/learn/articles.js";
import { urlList as indexNowUrls } from "./submit-indexnow.mjs";

const appOutput = join(process.cwd(), ".next", "server", "app");
const siteUrl = "https://www.wattsmybill.app";
const errors = [];
const seenTitles = new Set();
const seenCanonicals = new Set();

const readRequired = (path, label) => {
  if (!existsSync(path)) {
    errors.push(`Missing built ${label}: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const checkPage = ({ path, label, canonical, structuredTypes = [] }) => {
  const html = readRequired(path, label);
  if (!html) return;
  if (!html.includes(`<link rel="canonical" href="${canonical}"`)) errors.push(`Wrong or missing canonical: ${label}`);
  if (!html.includes('<meta name="description"')) errors.push(`Missing description: ${label}`);
  if (!html.includes('property="og:title"')) errors.push(`Missing Open Graph title: ${label}`);
  if (!html.includes('name="twitter:title"')) errors.push(`Missing Twitter title: ${label}`);
  if (structuredTypes.length && !html.includes('type="application/ld+json"')) errors.push(`Missing structured data: ${label}`);
  for (const type of structuredTypes) {
    if (!html.includes(`"@type":"${type}"`)) errors.push(`Missing ${type} structured data: ${label}`);
  }
  if (html.includes("localhost:3000")) errors.push(`Localhost leaked into built metadata: ${label}`);

  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title) errors.push(`Missing title: ${label}`);
  else if (seenTitles.has(title)) errors.push(`Duplicate title: ${title}`);
  else seenTitles.add(title);

  if (seenCanonicals.has(canonical)) errors.push(`Duplicate canonical: ${canonical}`);
  else seenCanonicals.add(canonical);

  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) errors.push(`Expected one h1 in ${label}, found ${h1Count}`);
};

checkPage({ path: join(appOutput, "index.html"), label: "home page", canonical: siteUrl, structuredTypes: ["WebApplication"] });
checkPage({ path: join(appOutput, "learn.html"), label: "Learning Hub", canonical: `${siteUrl}/learn`, structuredTypes: ["CollectionPage", "ItemList"] });
checkPage({ path: join(appOutput, "rates.html"), label: "Rate Library", canonical: `${siteUrl}/rates`, structuredTypes: ["CollectionPage", "ItemList"] });
checkPage({ path: join(appOutput, "history.html"), label: "bill history", canonical: `${siteUrl}/history`, structuredTypes: ["WebApplication"] });
checkPage({ path: join(appOutput, "methodology.html"), label: "methodology page", canonical: `${siteUrl}/methodology`, structuredTypes: ["AboutPage"] });

for (const article of ARTICLES) {
  checkPage({
    path: join(appOutput, "learn", `${article.slug}.html`),
    label: `guide ${article.slug}`,
    canonical: `${siteUrl}/learn/${article.slug}`,
    structuredTypes: ["Article", "BreadcrumbList"],
  });
}

const sitemap = readRequired(join(appOutput, "sitemap.xml.body"), "sitemap");
for (const url of [siteUrl, `${siteUrl}/learn`, `${siteUrl}/rates`, `${siteUrl}/history`, `${siteUrl}/methodology`, ...ARTICLES.map((article) => `${siteUrl}/learn/${article.slug}`)]) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`Missing sitemap URL: ${url}`);
}

const home = readRequired(join(appOutput, "index.html"), "home page");
for (const favicon of ["/favicon-v2.ico", "/favicon-32x32-v2.png", "/icon-192-v2.png", "/icon-512-v2.png", "/apple-touch-icon-v2.png"]) {
  if (!home.includes(favicon)) errors.push(`Missing favicon declaration: ${favicon}`);
}

const knownRoutes = new Set(["/", "/learn", "/rates", "/history", "/methodology", ...ARTICLES.map((article) => `/learn/${article.slug}`)]);
const builtHtml = [
  join(appOutput, "index.html"),
  join(appOutput, "learn.html"),
  join(appOutput, "rates.html"),
  join(appOutput, "history.html"),
  join(appOutput, "methodology.html"),
  ...ARTICLES.map((article) => join(appOutput, "learn", `${article.slug}.html`)),
];

for (const file of builtHtml) {
  const html = readRequired(file, `link-check page ${file}`);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith("/") || href.startsWith("/_next/")) continue;
    const pathname = href.split("#")[0].split("?")[0] || "/";
    const publicFile = join(process.cwd(), "public", pathname.slice(1));
    if (!knownRoutes.has(pathname) && !existsSync(publicFile)) errors.push(`Broken internal link in ${file}: ${href}`);
  }
}

// The IndexNow list has to cover every public route, or a new page ships and is
// never announced to search engines. This drifted once already.
for (const route of knownRoutes) {
  const expected = route === "/" ? siteUrl : `${siteUrl}${route}`;
  if (!indexNowUrls.includes(expected)) {
    errors.push(`Missing from IndexNow submission list (scripts/submit-indexnow.mjs): ${expected}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Build valid: ${ARTICLES.length + 5} public HTML pages, ${ARTICLES.length + 5} sitemap URLs, internal links, canonical/social metadata, structured data, and favicon declarations.`);
}
