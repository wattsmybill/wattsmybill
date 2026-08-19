import { renderCard, size, contentType } from "../../../lib/ogCard";
import { ROUNDS, parseScore, rankFor } from "../../wattsGame";

export const alt = "A Guess the Watts score";
export { size, contentType };

export default async function Image({ params }) {
  const { score: raw } = await params;
  const score = parseScore(raw);

  if (score === null) {
    return renderCard({ eyebrow: "Five quick rounds", title: "Guess the Watts" });
  }

  return renderCard({
    eyebrow: "Guess the Watts",
    title: rankFor(score),
    subtitle: "Five appliances, one guess each. Can you tell a 60W fan from a 2000W oven?",
    figure: String(score),
    figureLabel: `out of ${ROUNDS * 100}`,
  });
}
