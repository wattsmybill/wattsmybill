import Link from "next/link";
import { notFound } from "next/navigation";
import LearnHeader from "../../../learn/LearnHeader";
import LearningThemeShell from "../../../learn/LearningThemeShell";
import { ROUNDS, parseScore, rankFor } from "../../wattsGame";

const siteUrl = "https://www.wattsmybill.app";
const MAX_SCORE = ROUNDS * 100;

/**
 * A shared score.
 *
 * The game could only be shared as plain text, which arrives in a feed looking
 * like nothing. The score lives in the path rather than a query string because
 * an Open Graph card is generated per route and cannot read search params.
 *
 * Deliberately not indexed. These are share targets, not content: five hundred
 * near-identical pages in the index would be exactly the thin-content problem
 * the country pages were built to avoid.
 */

export async function generateMetadata({ params }) {
  const { score: raw } = await params;
  const score = parseScore(raw);
  if (score === null) return {};

  const title = `${score} out of ${MAX_SCORE} on Guess the Watts`;

  return {
    title,
    description: `${rankFor(score)} — scored ${score} of ${MAX_SCORE} guessing what everyday appliances actually draw. Play the five-round game.`,
    alternates: { canonical: `${siteUrl}/game/score/${score}` },
    robots: { index: false, follow: true },
    openGraph: {
      title: `${title} | Watts My Bill?`,
      description: "Can you tell a 60W fan from a 2000W oven? Five quick rounds.",
      url: `${siteUrl}/game/score/${score}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Watts My Bill?`,
      description: "Can you tell a 60W fan from a 2000W oven? Five quick rounds.",
    },
  };
}

export default async function ScorePage({ params }) {
  const { score: raw } = await params;
  const score = parseScore(raw);
  if (score === null) notFound();

  const rank = rankFor(score);
  const share = Math.round((score / MAX_SCORE) * 100);

  return (
    <LearningThemeShell>
      <div className="min-h-screen bg-[#eef3f1] text-slate-950">
        <LearnHeader />

        <main id="main-content" className="mx-auto max-w-2xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
          <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#043a33_0%,#087157_62%,#0a7454_100%)] px-5 py-9 text-center text-white shadow-[0_18px_44px_rgba(5,84,66,0.16)] sm:px-8 sm:py-11">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Guess the Watts</p>
            <p className="mt-4 text-6xl font-black tracking-[-0.04em] tabular-nums sm:text-7xl">{score}</p>
            <p className="mt-1 text-sm font-bold text-emerald-50/80">out of {MAX_SCORE}</p>
            <p className="mt-4 text-2xl font-black tracking-tight text-amber-300">{rank}</p>
          </section>

          <div className="mt-6 rounded-[26px] bg-white p-6 text-center shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
            <h1 className="text-xl font-black tracking-tight">Someone scored {share}% guessing appliance wattages.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Five appliances, one guess each, scored on how close you land. Most people are surprised by how much a
              kettle draws and how little a laptop does.
            </p>

            <Link
              href="/game"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Play it yourself
            </Link>

            <p className="mt-5 text-sm text-slate-600">
              Or{" "}
              <Link href="/#calculator" className="font-bold text-emerald-700 underline underline-offset-2">
                estimate your own electricity bill
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </LearningThemeShell>
  );
}
