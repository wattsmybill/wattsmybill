"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toCountrySlug } from "../lib/countryPages";
import { ArrowRight, ArrowUpRight, Search, ShieldCheck, X } from "lucide-react";

export default function RateLibrary({ entries }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleEntries = useMemo(
    () => entries.filter((entry) => `${entry.name} ${entry.authority} ${entry.label}`.toLowerCase().includes(normalizedQuery)),
    [entries, normalizedQuery]
  );
  const formatRate = (rate) => Number(rate).toLocaleString("en-US", {
    minimumFractionDigits: Number(rate) >= 100 ? 0 : 2,
    maximumFractionDigits: 3,
  });

  return (
    <>
      <div className="relative mt-5 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
        <input
          type="text"
          role="searchbox"
          enterKeyHint="search"
          maxLength={64}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find your country or authority"
          aria-label="Search country rate sources"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm font-semibold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:text-emerald-800">
            <X size={16} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <p className="font-semibold text-slate-600" aria-live="polite"><span className="font-black text-slate-950">{visibleEntries.length}</span> country source guides</p>
      </div>

      {visibleEntries.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleEntries.map((entry) => (
            <article key={entry.name} className="rate-source-card group flex min-h-60 flex-col rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">{entry.currency} per kWh</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    <Link href={`/rates/${toCountrySlug(entry.name)}`} className="hover:text-emerald-700 hover:underline">
                      {entry.flag} {entry.name}
                    </Link>
                  </h2>
                </div>
                <span className="rate-default-pill inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-700 bg-emerald-700 px-3.5 py-2 text-[10px] font-black text-white shadow-[0_5px_12px_rgba(6,78,59,0.18)]" title="Indicative calculator default—not a live tariff">
                  <span>Indicative</span><span aria-hidden="true">·</span><span>{entry.currency}{formatRate(entry.rate)}</span>
                </span>
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.09em] text-slate-500">Official source</p>
              <p className="mt-1 text-sm font-black leading-5 text-slate-900">{entry.authority}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{entry.coverage}</p>

              {/* Every card used to offer exactly one action, and it led off
                  the site. Someone browsing rates wants to use one. */}
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
                <Link
                  href={`/?country=${encodeURIComponent(entry.name)}#calculator`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-800"
                >
                  Use this rate <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[11px] font-semibold text-slate-500">Source checked {entry.checked}</p>
                  <a href={entry.url} target="_blank" rel="noreferrer" aria-label={`Open ${entry.label} for ${entry.name}`} className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-900">
                    {entry.label} <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.65rem] border border-dashed border-emerald-200 bg-emerald-50/55 p-7 text-center">
          <p className="font-black text-slate-950">That country is not in the library yet.</p>
          <p className="mt-1 text-sm text-slate-600">You can still enter the rate printed on your bill in the calculator.</p>
          <Link href="/#calculator" className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700">Use my own rate</Link>
        </div>
      )}

      <aside className="mt-7 rounded-[1.65rem] bg-slate-950 p-6 text-white shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7">
        <div className="flex gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/10"><ShieldCheck size={18} aria-hidden="true" /></span>
          <div>
            <h2 className="text-lg font-black text-white">Your bill is still the best source.</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/70">Defaults are broad budgeting references. Use the exact rate on your bill whenever possible.</p>
          </div>
        </div>
        <Link href="/#calculator" className="mt-5 inline-flex shrink-0 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-300 sm:mt-0">Use my exact rate</Link>
      </aside>
    </>
  );
}
