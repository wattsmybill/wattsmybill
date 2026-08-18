"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, Gamepad2, Plug, Search, SearchCheck, X } from "lucide-react";
import LearnHeader from "./LearnHeader";
import LearningThemeShell from "./LearningThemeShell";
import { ARTICLES } from "./articles";
import { searchArticles } from "./searchIndex";
import { COUNTRIES } from "../data/countries";
import { PRESETS } from "../data/appliances";

const RATE_SOURCE_COUNT = COUNTRIES.filter(
  (country) => !country.isPlaceholder && country.name !== "Other Country"
).length;

const TOPIC_FILTERS = [
  { id: "all", label: "All guides", categories: [] },
  { id: "bills", label: "Bills & rates", categories: ["Bill troubleshooting", "Reading your bill", "Tariffs and rates"] },
  { id: "appliances", label: "Appliances", categories: ["Energy basics", "Appliance costs"] },
  { id: "saving", label: "Save electricity", categories: ["Saving electricity"] },
  { id: "solar", label: "Solar", categories: ["Solar and storage"] }
];

const QUICK_QUESTIONS = [
  { label: "My bill went up", query: "bill high" },
  { label: "I can’t find my rate", query: "electricity rate" },
  { label: "My night usage looks high", query: "usage high night" },
  { label: "Fan or air conditioner?", query: "fan air conditioner" },
];

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Watts My Bill? Electricity Learning Hub",
  url: "https://www.wattsmybill.app/learn",
  description: "Practical, source-linked answers to everyday electricity questions for a worldwide audience.",
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: ARTICLES.length,
    itemListElement: ARTICLES.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://www.wattsmybill.app/learn/${article.slug}`,
      name: article.title,
    })),
  },
};

export default function LearnPage() {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("all");
  const normalizedQuery = query.trim();
  const selectedTopic = TOPIC_FILTERS.find((topic) => topic.id === activeTopic) || TOPIC_FILTERS[0];

  const filteredArticles = useMemo(() => {
    const inTopic = ARTICLES.filter(
      (article) => selectedTopic.categories.length === 0 || selectedTopic.categories.includes(article.category)
    );
    return normalizedQuery ? searchArticles(inTopic, normalizedQuery) : inTopic;
  }, [normalizedQuery, selectedTopic]);

  // When no guide answers the question, the catalogue often can. Somebody
  // typing "pool pump" wants to know what a pool pump costs to run, so offer
  // the calculator rather than an apology and an email address.
  const applianceSuggestions = useMemo(() => {
    if (!normalizedQuery || filteredArticles.length > 0) return [];
    const terms = normalizedQuery.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
    if (terms.length === 0) return [];
    return PRESETS.filter((preset) => {
      const name = preset.name.toLowerCase();
      return terms.some((term) => name.includes(term));
    }).slice(0, 4);
  }, [normalizedQuery, filteredArticles]);

  return (
    <LearningThemeShell>
    <div className="min-h-screen bg-[#eef3f1] text-slate-950">
      <LearnHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <main id="main-content">
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-10 sm:px-7 sm:pt-14">
          <div className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#043a33_0%,#087256_68%,#0a7454_100%)] px-6 py-9 text-white shadow-sm sm:px-9 sm:py-11">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Watts My Bill? Learning Hub</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Answers for everyday electricity questions.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-emerald-50/95">
                No jargon. No judgement. Start with whatever brought you here, from a changing bill to an appliance you want to understand.
              </p>

              <label className="relative mt-7 block w-full">
                <span className="sr-only">Search electricity questions</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800" size={19} />
                <input
                  type="text"
                  role="searchbox"
                  enterKeyHint="search"
                  maxLength={96}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a question, e.g. why is my bill high?"
                  className="w-full rounded-2xl border border-white/20 bg-white py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-200"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Clear search">
                    <X size={16} />
                  </button>
                )}
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                {QUICK_QUESTIONS.map((question) => (
                  <button key={question.query} type="button" onClick={() => { setQuery(question.query); setActiveTopic("all"); }} className="min-h-11 rounded-full border border-white/15 bg-white/[0.08] px-3 py-2 text-[11px] font-bold leading-4 text-white/85 transition hover:bg-white/[0.14] hover:text-white">
                    {question.label}
                  </button>
                ))}
              </div>

              <div className="mt-7 grid max-w-3xl grid-cols-3 border-t border-white/12 pt-5">
                {/* Padding is symmetric so the middle column is not squeezed against
                    the divider to its left. It had padding-left: 0 while only the last
                    column got any, leaving the columns 84 / 84 / 68 wide. */}
                {[[ARTICLES.length, "practical guides"], ["Global", "local differences"], ["Official", "source links"]].map(([value, label]) => (
                  <div key={label} className="border-r border-white/12 px-3 first:pl-0 last:border-0 last:pr-0 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                    <p className="text-sm font-black text-white">{value}</p>
                    {/* These labels sit low in the hero, where the gradient is
                        at its lightest, and are only 10px — so they carry the
                        least opacity the contrast budget allows, not the least
                        that looked pleasant. */}
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-50/90">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-8 sm:px-7" aria-labelledby="guides-heading">
          <div className="mb-6 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">Start with a question</p>
              <h2 id="guides-heading" className="mt-2 text-3xl font-black tracking-tight">Practical guides</h2>
            </div>
            <p className="hidden max-w-sm text-right text-sm leading-6 text-slate-600 md:block">
              Written for a worldwide audience, with local differences called out instead of hidden.
            </p>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filter guides by topic">
            {TOPIC_FILTERS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setActiveTopic(topic.id)}
                className={`rounded-full border px-3.5 py-2 text-xs font-black transition ${activeTopic === topic.id ? "border-emerald-700 bg-emerald-700 text-white" : "border-emerald-950/10 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-800"}`}
                aria-pressed={activeTopic === topic.id}
              >
                {topic.label}
              </button>
            ))}
            <span className="ml-auto hidden text-xs font-bold text-slate-400 sm:inline" aria-live="polite">{filteredArticles.length} {filteredArticles.length === 1 ? "guide" : "guides"}</span>
            <span className="sr-only sm:hidden" aria-live="polite">{filteredArticles.length} {filteredArticles.length === 1 ? "guide" : "guides"} found</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredArticles.map((article) => (
              <article key={article.slug} className="flex flex-col rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07]">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">{article.category}</p>
                <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight">{article.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{article.description}</p>
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold text-slate-500">{article.readingTime}</span>
                  <Link href={`/learn/${article.slug}`} className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-700 hover:text-emerald-900">
                    Read guide <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="rounded-[26px] border border-emerald-950/[0.07] bg-white px-6 py-10 text-center shadow-sm">
              <Search className="mx-auto text-emerald-700" size={24} />
              <h3 className="mt-3 text-xl font-black">No guide covers that yet.</h3>

              {applianceSuggestions.length > 0 ? (
                <>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    The calculator can still cost it. Add it to an estimate and see what it uses.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {applianceSuggestions.map((preset) => (
                      <Link
                        key={preset.name}
                        href={`/?appliance=${encodeURIComponent(preset.name)}#calculator`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800"
                      >
                        <Plug size={14} aria-hidden="true" /> Cost a {preset.name.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Try a shorter phrase, choose a topic above, or return to the complete guide list.</p>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => { setQuery(""); setActiveTopic("all"); }} className="rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 hover:bg-emerald-50">View all guides</button>
                <a href={`mailto:hello@wattsmybill.app?subject=${encodeURIComponent("Learning Hub question")}&body=${encodeURIComponent(`I would like Watts My Bill? to explain: ${query.trim()}`)}`} className="rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 hover:bg-emerald-50">Suggest this question</a>
              </div>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-7" aria-labelledby="popular-paths-heading">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">Popular paths</p>
              <h2 id="popular-paths-heading" className="mt-2 text-2xl font-black tracking-tight">Start where you are.</h2>
            </div>
            <Link href="/rates" className="text-xs font-black text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-900">Browse {RATE_SOURCE_COUNT} official rate sources</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
          {[
            [SearchCheck, "My bill suddenly changed", "Separate usage, rate, billing-day, and fixed-charge changes.", "/learn/why-is-my-electricity-bill-so-high"],
            [BookOpen, "I want to understand my rate", "Learn peak, off-peak, time-of-use, and standing charges.", "/learn/peak-off-peak-time-of-use-electricity"],
            [Calculator, "I want to cost an appliance", "Turn watts and running time into kWh and money.", "/learn/how-much-does-an-appliance-cost-to-run"],
          ].map(([Icon, title, copy, href]) => (
            <Link key={title} href={href} className="group rounded-3xl border border-emerald-950/[0.07] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={20} /></span>
                <ArrowRight className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" size={18} />
              </div>
              <h3 className="mt-4 text-lg font-black">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
            </Link>
          ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-4 sm:px-7" aria-labelledby="game-heading">
          <Link
            href="/game"
            className="group flex flex-col gap-4 rounded-3xl border border-emerald-950/[0.07] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Gamepad2 size={21} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">Five quick rounds</p>
                <h2 id="game-heading" className="mt-1 text-xl font-black tracking-tight">Guess the Watts</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  Can you tell a 60W fan from a 2000W oven? Guess a few appliances, see the real figures, and filling
                  in the calculator stops being guesswork.
                </p>
              </div>
            </div>
            <ArrowRight className="hidden shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 sm:block" size={20} />
          </Link>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-7">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-slate-950 px-6 py-8 text-white sm:flex-row sm:items-center sm:px-8">
            <div>
              <h2 className="text-2xl font-black">Ready to check your own household?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">The calculator is free, works without an account, and keeps calculator inputs in your browser.</p>
            </div>
            <Link href="/#calculator" className="shrink-0 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-300">
              Calculate my bill
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-emerald-950/10 bg-white px-5 py-8 text-center text-sm text-slate-500">
        © 2026 Watts My Bill? Educational estimates, not utility advice. <Link href="/methodology" className="font-black text-emerald-700 underline underline-offset-4">Our methodology</Link>
      </footer>
    </div>
    </LearningThemeShell>
  );
}
