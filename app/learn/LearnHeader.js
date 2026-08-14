import Image from "next/image";
import Link from "next/link";
import { LearningThemeToggle } from "./LearningThemeShell";

export default function LearnHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-950/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-7">
        <Link href="/" className="flex items-center gap-3" aria-label="Watts My Bill home">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl sm:h-[46px] sm:w-[46px]">
            <Image src="/logo.png" alt="" width={46} height={47} className="h-auto w-full rounded-xl" />
          </span>
          <div>
            <p className="text-sm font-black tracking-tight text-slate-950 sm:text-base">Watts My Bill?</p>
            <p className="hidden text-xs font-bold text-emerald-700 min-[440px]:block">Understand your electricity bill</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-bold sm:gap-3" aria-label="Learning Hub navigation">
          <Link href="/rates" className="hidden text-slate-600 transition hover:text-emerald-700 md:inline">
            Rate Library
          </Link>
          <Link href="/learn" className="hidden text-slate-600 transition hover:text-emerald-700 sm:inline">
            Learning Hub
          </Link>
          <Link
            href="/#calculator"
            className="inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-4 py-2.5 text-white shadow-sm transition hover:bg-emerald-800"
          >
            <span className="sm:hidden">Calculator</span><span className="hidden sm:inline">Open calculator</span>
          </Link>
          <LearningThemeToggle />
        </nav>
      </div>
    </header>
  );
}
