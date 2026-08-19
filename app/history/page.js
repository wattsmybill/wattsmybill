import LearnHeader from "../learn/LearnHeader";
import LearningThemeShell from "../learn/LearningThemeShell";
import BillHistory from "./BillHistory";

const siteUrl = "https://www.wattsmybill.app";

export const metadata = {
  title: "Bill History Tracker",
  description:
    "Track your electricity bills over time and see whether a rising bill came from using more energy, a higher price per kWh, or increased fixed charges.",
  alternates: { canonical: `${siteUrl}/history` },
  openGraph: {
    title: "Electricity Bill History Tracker | Watts My Bill?",
    description:
      "Log each electricity bill and separate the part of the change you caused from the part your provider did.",
    url: `${siteUrl}/history`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Electricity Bill History Tracker | Watts My Bill?",
    description: "Track electricity bills over time and see what actually changed.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Watts My Bill? Bill History Tracker",
  url: `${siteUrl}/history`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  description:
    "A private, on-device electricity bill tracker that separates usage changes from price changes and fixed charges.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function HistoryPage() {
  return (
    <LearningThemeShell>
    <div className="min-h-screen bg-[#eef3f1] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LearnHeader />

      <main id="main-content" className="mx-auto max-w-5xl px-5 pb-16 pt-5 sm:px-7 sm:pt-8">
        <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#043a33_0%,#087157_62%,#0a7454_100%)] px-6 py-8 text-white shadow-[0_18px_44px_rgba(5,84,66,0.16)] sm:px-9 sm:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Bill history</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Did you use more, or did it just get more expensive?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
              Log each bill as it arrives. Every time a new one lands, this page splits the change into the
              three things that can cause it — how much you used, what you paid per unit, and the fixed
              charges you pay regardless. No account, and nothing leaves your device.
            </p>
          </div>
        </section>

        <div className="mt-6">
          <BillHistory />
        </div>
      </main>
    </div>
    </LearningThemeShell>
  );
}
