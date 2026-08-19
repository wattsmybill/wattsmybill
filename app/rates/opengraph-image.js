import { renderCard, size, contentType } from "../lib/ogCard";
import { RATE_COUNTRIES } from "../lib/countryPages";

export const alt = "Electricity rate sources by country";
export { size, contentType };

export default function Image() {
  return renderCard({
    eyebrow: "Rate library",
    title: "Know where your rate comes from.",
    subtitle: "Official electricity price sources, country by country, with what appliances cost to run.",
    figure: String(RATE_COUNTRIES.length),
    figureLabel: "countries",
  });
}
