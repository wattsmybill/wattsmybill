"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LearningThemeToggle } from "./LearningThemeShell";

/**
 * Shared header for every non-calculator route.
 *
 * It carries no menu of its own. Below 1024px the bottom tab bar owns primary
 * navigation, and this header duplicating it put Learning Hub, Rate Library and
 * Bill History on screen twice at once. Above 1024px the tab bar is gone, so the
 * links appear here instead — one home per destination, per width.
 */
const LINKS = [
  { href: "/learn", label: "Learning Hub" },
  { href: "/rates", label: "Rate Library" },
  { href: "/history", label: "Bill history" },
  { href: "/methodology", label: "How it works" },
];

export default function LearnHeader() {
  const pathname = usePathname();
  const isCurrent = (href) => pathname === href || pathname.startsWith(`${href}/`);

  // Sticky only where it earns the space. Below 1024px the tab bar carries
  // navigation, so this bar held nothing but a logo and a theme toggle while
  // permanently occupying 77px above an already-fixed 57px — a sixth of a phone
  // screen spent on chrome, on the pages people come to read. It now scrolls
  // away there, as the calculator's header already does. At 1024px and up the
  // tab bar is gone and these links are the only navigation, so it stays pinned.
  return (
    <header className="learning-header relative z-50 border-b border-emerald-950/10 bg-white/90 backdrop-blur-xl lg:sticky lg:top-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-7">
        <Link href="/" className="flex items-center gap-3" aria-label="Watts My Bill home">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl sm:h-[46px] sm:w-[46px]">
            <Image src="/logo-v2.png" alt="" width={46} height={47} className="h-auto w-full rounded-xl" />
          </span>
          <div>
            <p className="text-sm font-black tracking-tight text-slate-950 sm:text-base">Watts My Bill?</p>
            <p className="hidden text-xs font-bold text-emerald-700 min-[440px]:block">Understand your electricity bill</p>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm font-bold" aria-label="Site navigation">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              className={`hidden transition lg:inline ${
                isCurrent(link.href) ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Below 1024px the Estimate tab is a thumb's reach away. */}
          <Link
            href="/#calculator"
            className="hidden min-h-11 items-center rounded-full bg-emerald-700 px-4 py-2.5 text-white shadow-sm transition hover:bg-emerald-800 lg:inline-flex"
          >
            Open calculator
          </Link>

          <LearningThemeToggle />
        </nav>
      </div>
    </header>
  );
}
