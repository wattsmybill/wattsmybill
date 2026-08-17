"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarPlus, LineChart, Minus, Trash2, Wand2 } from "lucide-react";
import {
  METRICS,
  explainChange,
  formatPeriod,
  loadHistory,
  prepareEntries,
  saveHistory,
} from "../lib/billHistory";

const EMPTY_FORM = { period: "", total: "", kwh: "", fixedCharge: "", days: "30" };

function currentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatValue(value, kind, currency) {
  const symbol = currency || "";
  if (kind === "currency") {
    return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (kind === "kwh") {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`;
  }
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;
}

/**
 * A single-series bar chart, drawn by hand.
 *
 * One measure at a time behind a toggle rather than usage and price sharing a
 * plot: they have unrelated scales, and a second axis is the fastest way to
 * make a chart say something untrue. Bars carry the values, the list below
 * carries the same numbers as text for anyone not reading the picture.
 */
function HistoryChart({ entries, metric, currency }) {
  const [active, setActive] = useState(null);
  const containerRef = useRef(null);
  // The viewBox tracks the real rendered width so one SVG unit stays one CSS
  // pixel. With a fixed 720-unit box the whole drawing scaled down on a phone
  // and the 10px labels came out around 4px — bars visible, nothing readable.
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(entry.contentRect.width, 280));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const height = 240;
  // A left gutter for the value axis, so those labels sit beside the plot
  // rather than being painted over by the first bars.
  const padding = { top: 24, right: 10, bottom: 34, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const values = entries.map((entry) => entry[metric.field] || 0);
  const peak = Math.max(...values, 0) || 1;
  const step = plotWidth / entries.length;
  const barWidth = Math.min(Math.max(step - 10, 6), 48);

  // Four recessive gridlines are enough to read a magnitude off; more of them
  // start competing with the bars they are meant to support.
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    fraction,
    y: padding.top + plotHeight - fraction * plotHeight,
    value: peak * fraction,
  }));

  const summary = `${metric.label} across ${entries.length} ${entries.length === 1 ? "bill" : "bills"}, from ${formatPeriod(entries[0].period)} to ${formatPeriod(entries[entries.length - 1].period)}.`;

  // Thin the month labels rather than let them overlap once bars get narrow.
  const labelEvery = Math.max(1, Math.ceil((entries.length * 52) / Math.max(plotWidth, 1)));

  return (
    <div className="wmb-chart relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="w-full"
        role="img"
        aria-label={summary}
        onMouseLeave={() => setActive(null)}
      >
        {gridLines.map((line) => (
          <g key={line.fraction}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={line.y}
              y2={line.y}
              className="wmb-chart-grid"
              strokeWidth="1"
            />
            <text x={padding.left - 8} y={line.y + 3} textAnchor="end" className="wmb-chart-axis" fontSize="10">
              {formatValue(line.value, metric.kind, currency)}
            </text>
          </g>
        ))}

        {entries.map((entry, index) => {
          const value = entry[metric.field] || 0;
          const barHeight = Math.max((value / peak) * plotHeight, value > 0 ? 3 : 0);
          const x = padding.left + index * step + (step - barWidth) / 2;
          const y = padding.top + plotHeight - barHeight;
          const isLatest = index === entries.length - 1;
          const isActive = active === index;

          return (
            <g key={entry.id || entry.period}>
              {/* Hit target deliberately wider than the mark it selects. */}
              <rect
                x={padding.left + index * step}
                y={padding.top}
                width={step}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={`${formatPeriod(entry.period, { long: true })}: ${formatValue(value, metric.kind, currency)}`}
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                className={isLatest ? "wmb-chart-bar-latest" : "wmb-chart-bar"}
                opacity={isActive || isLatest || active === null ? 1 : 0.55}
              />
              {(isLatest || isActive) && value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 7}
                  textAnchor="middle"
                  fontSize="11"
                  className="wmb-chart-value"
                >
                  {formatValue(value, metric.kind, currency)}
                </text>
              )}
              {/* Counted back from the newest bill so the latest is always
                  labelled and the spacing never collides with it. */}
              {(entries.length - 1 - index) % labelEvery === 0 && (
              <text
                x={x + barWidth / 2}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                className="wmb-chart-axis"
              >
                {formatPeriod(entry.period).replace(" ", " ")}
              </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function BillHistory() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [metricId, setMetricId] = useState("total");
  const [currency, setCurrency] = useState("");
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const noticeTimer = useRef(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEntries(loadHistory());
      // The currency the calculator is already working in, so history doesn't
      // ask a question the app can answer itself.
      try {
        const saved = JSON.parse(localStorage.getItem("watts-my-bill-data") || "{}");
        setCurrency(saved.customCurrency || saved.country?.currency || "");
      } catch {
        setCurrency("");
      }
      setForm((current) => ({ ...current, period: currentPeriod() }));
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveHistory(entries);
  }, [entries, ready]);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const flash = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2600);
  };

  const metric = METRICS.find((item) => item.id === metricId) || METRICS[0];
  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  const change = useMemo(() => explainChange(previous, latest), [previous, latest]);

  const addEntry = (event) => {
    event.preventDefault();
    if (!form.period || !form.total) {
      flash("A month and a bill total are needed.");
      return;
    }

    const entry = {
      // The period is the identity: one bill per billing month, and re-saving a
      // month replaces it rather than stacking a second row for the same bill.
      id: form.period,
      period: form.period,
      total: Number(form.total) || 0,
      kwh: Number(form.kwh) || 0,
      fixedCharge: Number(form.fixedCharge) || 0,
      days: Number(form.days) || 30,
      currency,
    };

    setEntries((current) => {
      const withoutSamePeriod = current.filter((item) => item.period !== entry.period);
      const replaced = withoutSamePeriod.length !== current.length;
      flash(replaced ? `${formatPeriod(entry.period)} updated.` : `${formatPeriod(entry.period)} added.`);
      return prepareEntries([...withoutSamePeriod, entry]);
    });

    setForm({ ...EMPTY_FORM, period: form.period, days: form.days });
  };

  /** Pulls whatever the calculator already knows, so nothing is typed twice. */
  const fillFromCalculator = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("watts-my-bill-data") || "{}");
      const filled = {
        period: form.period || currentPeriod(),
        total: saved.actualBill || "",
        kwh: saved.billedKwh || "",
        fixedCharge: saved.fixedCharge || "",
        days: saved.billingDays || "30",
      };
      if (!filled.total && !filled.kwh) {
        flash("Nothing saved in the calculator yet.");
        return;
      }
      setForm(filled);
      flash("Filled from your calculator.");
    } catch {
      flash("Nothing saved in the calculator yet.");
    }
  };

  const removeEntry = (id) => {
    setEntries((current) => current.filter((item) => item.id !== id));
    flash("Bill removed.");
  };

  const field = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  });

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200";
  const labelClass = "block text-xs font-black uppercase tracking-[0.09em] text-slate-500";

  return (
    <>
      <section className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight">Log a bill</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Add each bill as it arrives. Two is enough to see a trend; the more you add, the clearer it gets.
            </p>
          </div>
          <button
            type="button"
            onClick={fillFromCalculator}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            <Wand2 size={14} aria-hidden="true" /> Fill from my calculator
          </button>
        </div>

        <form onSubmit={addEntry} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className={labelClass} htmlFor="bill-period">Billing month</label>
            <input id="bill-period" type="month" required className={`${inputClass} mt-1.5`} {...field("period")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="bill-total">Bill total</label>
            <input id="bill-total" type="number" min="0" step="0.01" required placeholder="240.00" className={`${inputClass} mt-1.5`} {...field("total")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="bill-kwh">Usage (kWh)</label>
            <input id="bill-kwh" type="number" min="0" step="0.01" placeholder="520" className={`${inputClass} mt-1.5`} {...field("kwh")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="bill-fixed">Fixed charges</label>
            <input id="bill-fixed" type="number" min="0" step="0.01" placeholder="32.00" className={`${inputClass} mt-1.5`} {...field("fixedCharge")} />
          </div>
          <div>
            <label className={labelClass} htmlFor="bill-days">Billing days</label>
            <input id="bill-days" type="number" min="1" max="366" step="1" className={`${inputClass} mt-1.5`} {...field("days")} />
          </div>

          <div className="sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              <CalendarPlus size={16} aria-hidden="true" /> Save this bill
            </button>
            <span className="ml-3 text-xs font-bold text-emerald-700" aria-live="polite">{notice}</span>
          </div>
        </form>
      </section>

      {entries.length === 0 ? (
        <section className="mt-6 rounded-[26px] border border-dashed border-emerald-200 bg-emerald-50/55 px-6 py-12 text-center">
          <LineChart className="mx-auto text-emerald-700" size={26} aria-hidden="true" />
          <h2 className="mt-3 text-xl font-black">No bills logged yet.</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Once two bills are here, this page separates the part of the change you caused from the part your
            provider did — and keeps doing it every time a new bill lands.
          </p>
          <Link href="/#calculator" className="mt-5 inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800 hover:bg-emerald-50">
            Estimate a bill instead
          </Link>
        </section>
      ) : (
        <>
          {change && (
            <section className="mt-6 rounded-[26px] bg-slate-950 p-6 text-white sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-300">
                {formatPeriod(previous.period)} → {formatPeriod(latest.period)}
              </p>
              <h2 className="mt-3 flex flex-wrap items-baseline gap-3 text-2xl font-black">
                {change.total === 0 ? (
                  <>Your bill did not move.</>
                ) : (
                  <>
                    Your bill went {change.total > 0 ? "up" : "down"} by{" "}
                    <span className={change.total > 0 ? "text-rose-300" : "text-emerald-300"}>
                      {formatValue(Math.abs(change.total), "currency", currency)}
                    </span>
                  </>
                )}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                {!change.explainable
                  ? "Add the kWh used on both bills and this will show whether it was usage, the price per unit, or fixed charges."
                  : change.largest.amount === 0
                    ? "Usage, price and fixed charges all held steady."
                    : `Mostly ${change.largest.sentenceLabel}.`}
                {!change.comparablePeriods && " These two bills cover different numbers of days, so compare the daily figures below rather than the totals."}
              </p>

              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {change.parts.map((part) => {
                  const rising = part.amount > 0.005;
                  const falling = part.amount < -0.005;
                  const Icon = rising ? ArrowUpRight : falling ? ArrowDownRight : Minus;
                  return (
                    <li key={part.key} className="rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
                      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-white/55">{part.label}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-lg font-black">
                        <Icon size={16} aria-hidden="true" className={rising ? "text-rose-300" : falling ? "text-emerald-300" : "text-white/50"} />
                        <span className={rising ? "text-rose-200" : falling ? "text-emerald-200" : "text-white/70"}>
                          {rising ? "+" : falling ? "−" : ""}
                          {formatValue(Math.abs(part.amount), "currency", currency)}
                        </span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="mt-6 rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">{metric.label}</h2>
                <p className="mt-1 text-sm text-slate-600">{metric.description}</p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Choose what to chart">
                {METRICS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMetricId(item.id)}
                    aria-pressed={item.id === metric.id}
                    className={`rounded-full border px-3.5 py-2 text-xs font-black transition ${
                      item.id === metric.id
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-emerald-950/10 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-800"
                    }`}
                  >
                    {item.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <HistoryChart entries={entries} metric={metric} currency={currency} />
            </div>
          </section>

          <section className="mt-6 rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
            <h2 className="text-xl font-black tracking-tight">Every bill you have logged</h2>
            <div className="mt-4 -mx-2 overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-2 py-2">Month</th>
                    <th className="px-2 py-2 text-right">Paid</th>
                    <th className="px-2 py-2 text-right">Used</th>
                    <th className="px-2 py-2 text-right">Per kWh</th>
                    <th className="px-2 py-2 text-right">Per day</th>
                    <th className="px-2 py-2"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody className="wmb-history-rows">
                  {[...entries].reverse().map((entry) => (
                    <tr key={entry.id || entry.period} className="border-t border-slate-100">
                      <td className="px-2 py-3 font-black text-slate-900">{formatPeriod(entry.period)}</td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums text-slate-700">{formatValue(entry.total, "currency", currency)}</td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums text-slate-700">{formatValue(entry.kwh, "kwh")}</td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums text-slate-700">{formatValue(entry.effectiveRate, "rate", currency)}</td>
                      <td className="px-2 py-3 text-right font-semibold tabular-nums text-slate-700">{formatValue(entry.dailyCost, "currency", currency)}</td>
                      <td className="px-2 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${formatPeriod(entry.period, { long: true })}`}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Bills stay in this browser. Nothing here is uploaded, and clearing your browser data clears them.
            </p>
          </section>
        </>
      )}
    </>
  );
}
