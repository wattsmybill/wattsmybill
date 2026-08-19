import { renderCard, size, contentType } from "../lib/ogCard";

export const alt = "How Watts My Bill calculates its estimates";
export { size, contentType };

export default function Image() {
  return renderCard({
    eyebrow: "How it works",
    title: "How these estimates are calculated",
    subtitle: "Sourcing, uncertainty, and the corrections standard behind every figure the calculator shows.",
  });
}
