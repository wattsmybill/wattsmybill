import { renderCard, size, contentType } from "../lib/ogCard";

export const alt = "Guess the Watts — a five-round appliance power game";
export { size, contentType };

export default function Image() {
  return renderCard({
    eyebrow: "Five quick rounds",
    title: "Guess the Watts",
    subtitle: "Can you tell a 60W fan from a 2000W oven? Guess five appliances, see the real figures.",
    figure: "5",
    figureLabel: "rounds",
  });
}
