import { renderCard, size, contentType } from "../lib/ogCard";
import { ARTICLES } from "./articles";

export const alt = "Watts My Bill Learning Hub — practical electricity guides";
export { size, contentType };

export default function Image() {
  return renderCard({
    eyebrow: "Learning hub",
    title: "Practical guides to your electricity bill",
    subtitle: "Plain explanations of rates, usage, tariffs and the charges that surprise people.",
    figure: String(ARTICLES.length),
    figureLabel: "guides",
  });
}
