import { renderCard, size, contentType } from "../lib/ogCard";

export const alt = "Privacy, terms and disclaimer";
export { size, contentType };

export default function Image() {
  return renderCard({
    eyebrow: "The short version",
    title: "Your inputs stay in your browser",
    subtitle: "What is stored, what is not, and the limits of every estimate the calculator gives.",
  });
}
