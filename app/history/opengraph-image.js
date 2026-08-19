import { renderCard, size, contentType } from "../lib/ogCard";

export const alt = "Electricity bill history tracker";
export { size, contentType };

export default function Image() {
  return renderCard({
    eyebrow: "Bill history",
    title: "See what actually changed on your bill",
    subtitle: "Separate the part you caused from the part your provider did: usage, rate, or fixed charges.",
  });
}
