import { renderCard, size, contentType } from "./lib/ogCard";

export const alt = "Watts My Bill? — estimate and understand your electricity bill";
export { size, contentType };

export default function Image() {
  return renderCard({
    eyebrow: "Free electricity calculator",
    title: "Understand what powers your bill.",
    subtitle: "Add your appliances, add your rate, and see where the money actually goes.",
  });
}
