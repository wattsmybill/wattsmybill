import { renderCard, size, contentType } from "../../lib/ogCard";
import { COUNTRY_SLUGS, getCountryBySlug, theCountry, cardMoney } from "../../lib/countryPages";

export const alt = "Electricity rates and appliance running costs";
export { size, contentType };

export function generateStaticParams() {
  return COUNTRY_SLUGS.map((country) => ({ country }));
}

export default async function Image({ params }) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);

  if (!country) {
    return renderCard({ eyebrow: "Rate library", title: "Electricity rates by country" });
  }

  return renderCard({
    eyebrow: "Rate library",
    title: `Electricity rates in ${theCountry(country.name)}`,
    subtitle: `Sourced from ${country.authority}, with what everyday appliances cost to run.`,
    figure: cardMoney(country.rate, country.currency),
    figureLabel: "per kWh",
  });
}
