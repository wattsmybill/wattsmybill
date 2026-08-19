import { renderCard, size, contentType } from "../../lib/ogCard";
import { ARTICLES, getArticle } from "../articles";

export const alt = "A practical electricity guide from Watts My Bill";
export { size, contentType };

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function Image({ params }) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return renderCard({ eyebrow: "Learning hub", title: "Practical electricity guides" });
  }

  return renderCard({
    eyebrow: article.category,
    title: article.title,
    subtitle: article.description,
    figure: article.readingTime ? String(article.readingTime).replace(/[^0-9]/g, "") : null,
    figureLabel: article.readingTime ? "min read" : null,
  });
}
