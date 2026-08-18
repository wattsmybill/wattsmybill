import Link from "next/link";
import LearnHeader from "../learn/LearnHeader";
import LearningThemeShell from "../learn/LearningThemeShell";
import GuessTheWatts from "./GuessTheWatts";

const siteUrl = "https://www.wattsmybill.app";

export const metadata = {
  title: "Guess the Watts — Appliance Power Game",
  description:
    "A quick five-round game: guess how many watts everyday appliances draw, then see the real figure. Build the intuition that makes estimating your electricity bill easy.",
  alternates: { canonical: `${siteUrl}/game` },
  openGraph: {
    title: "Guess the Watts | Watts My Bill?",
    description: "Five rounds. Guess what a kettle, a fridge or a dryer really draws.",
    url: `${siteUrl}/game`,
    type: "website",
    images: [{ url: `${siteUrl}/og-image-final.jpg`, width: 1200, height: 630, alt: "Watts My Bill? electricity calculator and learning hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Watts | Watts My Bill?",
    description: "Can you tell a 60W fan from a 2000W oven? Five rounds to find out.",
    images: [`${siteUrl}/og-image-final.jpg`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Guess the Watts",
  url: `${siteUrl}/game`,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  description:
    "A five-round guessing game that teaches how much power everyday household appliances draw.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function GamePage() {
  return (
    <LearningThemeShell>
      <div className="min-h-screen bg-[#eef3f1] text-slate-950">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <LearnHeader />

        <main id="main-content" className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
          <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#043a33_0%,#087157_62%,#0a7454_100%)] px-5 py-7 text-white shadow-[0_18px_44px_rgba(5,84,66,0.16)] sm:px-8 sm:py-9">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Five quick rounds</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Guess the Watts</h1>
              <p className="mt-3 text-sm leading-6 text-emerald-50/90 sm:text-base">
                The hardest part of estimating a bill is knowing what your appliances actually draw. Guess a few, see
                the real numbers, and the calculator gets a lot easier to fill in.
              </p>
            </div>
          </section>

          <section className="mt-6" aria-label="Guess the Watts game">
            <GuessTheWatts />
          </section>

          <p className="mt-6 text-center text-sm text-slate-600">
            Ready for the real thing?{" "}
            <Link href="/#calculator" className="font-bold text-emerald-700 underline underline-offset-2">
              Estimate your electricity bill
            </Link>
            .
          </p>
        </main>
      </div>
    </LearningThemeShell>
  );
}
