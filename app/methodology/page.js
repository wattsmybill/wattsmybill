import Link from "next/link";
import { BookCheck, Calculator, Database, LockKeyhole, Mail } from "lucide-react";
import LearnHeader from "../learn/LearnHeader";
import LearningThemeShell from "../learn/LearningThemeShell";

const siteUrl = "https://www.wattsmybill.app";

export const metadata = {
  title: "How Watts My Bill Works",
  description: "See how Watts My Bill calculates electricity estimates, chooses sources, handles country defaults, protects calculator inputs, and corrects content.",
  alternates: { canonical: `${siteUrl}/methodology` },
  openGraph: {
    title: "How Watts My Bill Works",
    description: "Calculation, sourcing, privacy, uncertainty, and correction standards for Watts My Bill.",
    url: `${siteUrl}/methodology`,
    images: [`${siteUrl}/og-image-final.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Watts My Bill Works",
    description: "Calculation, sourcing, privacy, uncertainty, and correction standards for Watts My Bill.",
    images: [`${siteUrl}/og-image-final.jpg`],
  },
};

const principles = [
  {
    Icon: Calculator,
    title: "Calculation",
    copy: "Appliance usage is watts × quantity × hours × days ÷ 1,000. A simple rate multiplies kWh by price. Advanced estimates can allocate time periods or progressive tiers, then add visible charges, credits, and tax.",
  },
  {
    Icon: Database,
    title: "Country defaults",
    copy: "Country values are illustrative budgeting defaults—not live household tariffs. The exact provider bill should win because region, usage tier, time, taxes, and plan can change the payable rate.",
  },
  {
    Icon: BookCheck,
    title: "Learning content",
    copy: "Guides answer a distinct user question, state uncertainty, avoid unsafe shortcuts, and link to government, regulator, standards, or utility material whenever a suitable primary source exists.",
  },
  {
    Icon: LockKeyhole,
    title: "Privacy",
    copy: "Calculator inputs and report details are handled in the browser. Report name and address are used to generate the PDF on the device. Users should never enter account numbers or sensitive billing identifiers.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "How Watts My Bill works",
  url: `${siteUrl}/methodology`,
  isPartOf: { "@id": `${siteUrl}/#website` },
  about: { "@id": `${siteUrl}/#webapp` },
};

export default function MethodologyPage() {
  return (
    <LearningThemeShell>
    <div className="min-h-screen bg-[#eef3f1] text-slate-950">
      <LearnHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-7 sm:px-7 sm:pt-10">
        <section className="rounded-[2rem] bg-[linear-gradient(135deg,#043a33_0%,#087157_64%,#11936b_100%)] px-6 py-8 text-white shadow-[0_18px_44px_rgba(5,84,66,0.15)] sm:px-9 sm:py-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Open methodology</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">Useful estimates need visible assumptions.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">Watts My Bill is an educational estimator, not a utility billing engine. This page explains what the numbers mean, where guidance comes from, and where the tool should stop.</p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Methodology principles">
          {principles.map(({ Icon, title, copy }) => (
            <article key={title} className="rounded-[1.65rem] bg-white p-5 shadow-sm ring-1 ring-emerald-950/[0.06]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={19} aria-hidden="true" /></span>
              <h2 className="mt-4 text-lg font-black tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[1.65rem] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.06] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Calculation order</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Every advanced total follows visible steps.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">The calculator does not hide a complex tariff inside one unexplained rate. It shows the pieces used in the estimate.</p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["1", "Usage", "Calculate appliance kWh."],
              ["2", "Energy", "Apply the selected rate structure."],
              ["3", "Charges", "Add daily supply and fixed charges."],
              ["4", "Credits", "Subtract solar export credit."],
              ["5", "Tax", "Apply percentage tax last."],
            ].map(([number, title, copy]) => <li key={number} className="rounded-2xl border border-emerald-100 bg-emerald-50/45 p-4"><span className="text-xs font-black text-emerald-700">{number.padStart(2, "0")}</span><h3 className="mt-2 text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{copy}</p></li>)}
          </ol>
        </section>

        <section className="mt-6 rounded-[1.65rem] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.06] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Accuracy boundaries</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">What can make the actual bill different?</h2>
          <div className="mt-5 grid gap-x-8 gap-y-3 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            {["Appliances cycling or changing power", "Peak, off-peak, tiered, or demand pricing", "Daily supply and standing charges", "Taxes, credits, subsidies, and fuel adjustments", "Billing periods other than 30 days", "Solar import, export, and battery flows", "Weather, occupancy, insulation, and maintenance", "Estimated meter readings or billing corrections"].map((item) => (
              <p key={item} className="flex gap-2"><span className="text-emerald-500" aria-hidden="true">●</span>{item}</p>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[1.65rem] border border-emerald-100 bg-emerald-50/65 p-6 sm:flex sm:items-center sm:justify-between sm:gap-7">
          <div>
            <div className="flex items-center gap-2 text-emerald-800"><Mail size={17} aria-hidden="true" /><p className="text-xs font-black uppercase tracking-[0.12em]">Corrections are welcome</p></div>
            <h2 className="mt-2 text-xl font-black">Found a source, rate context, or explanation we should improve?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Send the page URL, country or provider, what appears wrong, and a public source if available. Do not send an account number or full bill.</p>
          </div>
          <a href="mailto:hello@wattsmybill.app?subject=Watts%20My%20Bill%20correction" className="mt-5 inline-flex shrink-0 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 sm:mt-0">Email a correction</a>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/rates" className="rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 hover:bg-emerald-50">Browse rate sources</Link>
          <Link href="/learn" className="rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 hover:bg-emerald-50">Explore guides</Link>
          <Link href="/#calculator" className="rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-800">Open calculator</Link>
        </div>
      </main>
    </div>
    </LearningThemeShell>
  );
}
