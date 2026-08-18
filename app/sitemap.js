import { ARTICLES } from "./learn/articles";

export default function sitemap() {
  const articleEntries = ARTICLES.map((article) => ({
    url: `https://www.wattsmybill.app/learn/${article.slug}`,
    lastModified: new Date(article.updated),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [
    {
      url: "https://www.wattsmybill.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.wattsmybill.app/learn",
      lastModified: new Date("2026-08-14"),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: "https://www.wattsmybill.app/rates",
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.wattsmybill.app/history",
      lastModified: new Date("2026-08-16"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.wattsmybill.app/game",
      lastModified: new Date("2026-08-18"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://www.wattsmybill.app/methodology",
      lastModified: new Date("2026-08-14"),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...articleEntries,
  ];
}
