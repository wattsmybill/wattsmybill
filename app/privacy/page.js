import Link from "next/link";
import LearnHeader from "../learn/LearnHeader";
import LearningThemeShell from "../learn/LearningThemeShell";
import { INFO_SECTIONS } from "../data/infoSections";

const siteUrl = "https://www.wattsmybill.app";

export const metadata = {
  title: "Privacy, Terms and Disclaimer",
  description:
    "How Watts My Bill handles your data: calculator inputs stay on your device, what analytics and advertising cookies are used, and the terms and limits of the estimates.",
  alternates: { canonical: `${siteUrl}/privacy` },
  openGraph: {
    title: "Privacy, Terms and Disclaimer | Watts My Bill?",
    description: "What is stored, what is not, and the limits of the estimates.",
    url: `${siteUrl}/privacy`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy, Terms and Disclaimer | Watts My Bill?",
    description: "What is stored, what is not, and the limits of the estimates.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Privacy, Terms and Disclaimer",
  url: `${siteUrl}/privacy`,
  description: "Privacy policy, terms of use, and disclaimer for the Watts My Bill electricity calculator.",
};

export default function PrivacyPage() {
  return (
    <LearningThemeShell>
      <div className="min-h-screen bg-[#eef3f1] text-slate-950">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <LearnHeader />

        <main id="main-content" className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
          <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#043a33_0%,#087157_62%,#0a7454_100%)] px-5 py-7 text-white shadow-[0_18px_44px_rgba(5,84,66,0.16)] sm:px-8 sm:py-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">The short version</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Privacy, terms and limits</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50/90 sm:text-base">
              Your calculator inputs stay in your own browser. Nothing you type into the calculator is sent to a server
              of ours, and there is no account to create.
            </p>
          </section>

          <div className="mt-6 space-y-4">
            {INFO_SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7"
              >
                <h2 className="text-lg font-black tracking-tight text-slate-950">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
              </section>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/methodology" className="font-bold text-emerald-700 underline underline-offset-2">
              How the estimates are calculated
            </Link>
          </p>
        </main>
      </div>
    </LearningThemeShell>
  );
}
