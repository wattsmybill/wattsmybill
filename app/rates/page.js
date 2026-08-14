import { COUNTRIES } from "../data/countries";
import { getRateReference } from "../data/rateReferences";
import RateLibrary from "./RateLibrary";
import LearnHeader from "../learn/LearnHeader";
import LearningThemeShell from "../learn/LearningThemeShell";

const siteUrl = "https://www.wattsmybill.app";

export const metadata = {
  title: "Electricity Rate Sources by Country",
  description: "Find official electricity price and tariff sources by country, then use your own local kWh rate for a clearer electricity bill estimate.",
  alternates: { canonical: `${siteUrl}/rates` },
  openGraph: {
    title: "Electricity Rate Sources by Country | Watts My Bill?",
    description: "A transparent worldwide directory of official electricity tariff starting points.",
    url: `${siteUrl}/rates`,
    images: [`${siteUrl}/og-image-final.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Electricity Rate Sources by Country | Watts My Bill?",
    description: "Find official electricity tariff starting points and understand why your own bill rate is more precise.",
    images: [`${siteUrl}/og-image-final.jpg`],
  },
};

const rateEntries = COUNTRIES
  .filter((country) => !country.isPlaceholder && country.name !== "Other Country")
  .map((country) => ({ ...country, ...getRateReference(country.name) }));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Electricity rate sources by country",
  url: `${siteUrl}/rates`,
  description: "Official electricity tariff and price context for countries supported by the Watts My Bill calculator.",
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: rateEntries.length,
    itemListElement: rateEntries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${entry.name} electricity rate source`,
      url: entry.url,
    })),
  },
};

export default function RatesPage() {
  return (
    <LearningThemeShell>
    <div className="min-h-screen bg-[#eef3f1] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href="#rate-library" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-black">Skip to rate library</a>
      <LearnHeader />

      <main id="rate-library" className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#043a33_0%,#087157_62%,#11936b_100%)] px-5 py-7 text-white shadow-[0_18px_44px_rgba(5,84,66,0.16)] sm:px-8 sm:py-9">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Worldwide rate library</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Know where your rate comes from.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">Use these official authorities as a starting point, then use the exact per-kWh rate on your bill whenever possible. No default here is presented as a live tariff.</p>
          </div>
        </section>
        <section className="mt-6" aria-label="Country electricity rate sources">
          <RateLibrary entries={rateEntries} />
        </section>
      </main>
    </div>
    </LearningThemeShell>
  );
}
