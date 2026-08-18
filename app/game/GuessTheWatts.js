"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Gauge, Lightbulb, RotateCcw, Share2, Trophy } from "lucide-react";
import {
  ROUNDS,
  bulbComparison,
  buildRound,
  loadBestScore,
  positionToWatts,
  rankFor,
  saveBestScore,
  scoreGuess,
  verdictFor,
  wattsToPosition,
} from "./wattsGame";

const START_POSITION = wattsToPosition(150);

const TONE_CLASS = {
  great: "text-emerald-700",
  good: "text-emerald-700",
  ok: "text-slate-700",
  weak: "text-slate-600",
};

export default function GuessTheWatts() {
  const [rounds, setRounds] = useState(null);
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState(START_POSITION);
  const [results, setResults] = useState([]);
  const [best, setBest] = useState(0);
  const [copied, setCopied] = useState(false);

  // Deferred a frame for the same reason LearningThemeShell defers: the round is
  // drawn at random, so choosing it during render would hand the server one
  // appliance and the browser another, and hydration would tear.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRounds(buildRound());
      setBest(loadBestScore());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const guess = positionToWatts(position);
  const current = rounds?.[index] ?? null;
  const revealed = results.length > index;
  const lastResult = revealed ? results[index] : null;
  const finished = rounds !== null && results.length === ROUNDS && index === ROUNDS - 1 && revealed;
  const total = results.reduce((sum, item) => sum + item.points, 0);

  const lockIn = () => {
    if (!current || revealed) return;
    const points = scoreGuess(guess, current.watts);
    const next = [...results, { name: current.name, guess, actual: current.watts, points }];
    setResults(next);
    if (next.length === ROUNDS) {
      const finalTotal = next.reduce((sum, item) => sum + item.points, 0);
      if (finalTotal > loadBestScore()) {
        saveBestScore(finalTotal);
        setBest(finalTotal);
      }
    }
  };

  const nextRound = () => {
    setIndex((value) => Math.min(value + 1, ROUNDS - 1));
    setPosition(START_POSITION);
  };

  const playAgain = () => {
    setRounds(buildRound());
    setIndex(0);
    setResults([]);
    setPosition(START_POSITION);
    setCopied(false);
  };

  const copyResult = async () => {
    const lines = results.map((item) => `${item.name}: guessed ${item.guess}W, actual ${item.actual}W`);
    const text = `Guess the Watts — ${total}/${ROUNDS * 100} (${rankFor(total)})\n${lines.join("\n")}\nhttps://www.wattsmybill.app/game`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (!current) {
    return (
      <div className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
        <p className="text-sm text-slate-600">Shuffling appliances…</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
        <div className="text-center">
          <Trophy className="mx-auto text-emerald-700" size={30} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black tracking-tight">
            {total} / {ROUNDS * 100}
          </h2>
          <p className="mt-1 text-sm font-bold text-emerald-700">{rankFor(total)}</p>
          {best > 0 && <p className="mt-1 text-xs text-slate-500">Your best: {best}</p>}
        </div>

        <ul className="mt-5 divide-y divide-emerald-950/[0.07] border-y border-emerald-950/[0.07]">
          {results.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate font-bold text-slate-950">{item.name}</span>
              <span className="shrink-0 text-slate-600">
                {item.guess}W vs <strong className="font-black text-slate-950">{item.actual}W</strong>
              </span>
              <span className="w-12 shrink-0 text-right font-black text-emerald-700">+{item.points}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={playAgain}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <RotateCcw size={16} aria-hidden="true" /> Play again
          </button>
          <button
            type="button"
            onClick={copyResult}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-950/15 px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700"
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
            {copied ? "Copied" : "Copy result"}
          </button>
          <Link
            href="/#calculator"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-950/15 px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-700"
          >
            <Gauge size={16} aria-hidden="true" /> Estimate your bill
          </Link>
        </div>
      </div>
    );
  }

  const verdict = lastResult ? verdictFor(lastResult.points) : null;

  return (
    <div className="rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Round {index + 1} of {ROUNDS}
        </p>
        <p className="text-xs font-bold text-slate-500">
          {total} pts{best > 0 ? ` · best ${best}` : ""}
        </p>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-emerald-950/10" aria-hidden="true">
        <div
          className="h-full rounded-full bg-emerald-700 transition-all duration-300"
          style={{ width: `${((index + (revealed ? 1 : 0)) / ROUNDS) * 100}%` }}
        />
      </div>

      <div className="mt-5 text-center">
        <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
          {current.category}
        </span>
        <h2 className="mt-2.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{current.name}</h2>
        <p className="mt-1 text-sm text-slate-600">How many watts does it draw while running?</p>
      </div>

      <div className="mt-6">
        <p className="text-center text-4xl font-black tracking-tight text-slate-950 tabular-nums">
          {revealed ? lastResult.guess : guess}
          <span className="ml-1 text-xl text-slate-500">W</span>
        </p>
        <input
          type="range"
          min="0"
          max="1000"
          step="1"
          value={revealed ? wattsToPosition(lastResult.guess) : position}
          disabled={revealed}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={`Your guess for ${current.name}`}
          aria-valuetext={`${revealed ? lastResult.guess : guess} watts`}
          className="mt-3 h-11 w-full cursor-pointer accent-emerald-700 disabled:cursor-default disabled:opacity-70"
        />
        <div className="flex justify-between text-[11px] font-bold text-slate-500">
          <span>5W</span>
          <span>3000W</span>
        </div>
      </div>

      {revealed ? (
        <div className="mt-5 rounded-2xl bg-emerald-50/70 p-4 text-center">
          <p className={`text-sm font-black ${TONE_CLASS[verdict.tone]}`}>
            {verdict.label} · +{lastResult.points}
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            {current.name}: about {current.watts}W
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-600">
            <Lightbulb size={13} aria-hidden="true" /> That is {bulbComparison(current.watts)} at once.
          </p>
          {current.duty && (
            <p className="mt-1 text-xs text-slate-600">
              It cycles though — it only draws that for roughly {Math.round(current.duty * 100)}% of the time it is
              plugged in.
            </p>
          )}
          <button
            type="button"
            onClick={nextRound}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            {index + 1 === ROUNDS ? "See your score" : "Next appliance"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={lockIn}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Lock in {guess}W
        </button>
      )}
    </div>
  );
}
