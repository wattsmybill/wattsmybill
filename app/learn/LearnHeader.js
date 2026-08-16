"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LearningThemeToggle } from "./LearningThemeShell";

/**
 * Shared header for every non-calculator route.
 *
 * It previously hid the Rate Library link below 768px and the Learning Hub
 * link below 640px with no menu behind them, so on a phone the Hub and the
 * Rate Library could not reach each other at all — every remaining exit led
 * back to the calculator. The links now collapse into a menu instead of
 * disappearing, and the skip link lives here so no route can forget one.
 */
const LINKS = [
  { href: "/learn", label: "Learning Hub" },
  { href: "/rates", label: "Rate Library" },
  { href: "/history", label: "Bill history" },
  { href: "/methodology", label: "How it works" },
];

export default function LearnHeader({ skipTo = "#main-content" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isCurrent = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="learning-header sticky top-0 z-50 border-b border-emerald-950/10 bg-white/90 backdrop-blur-xl">
      <a
        href={skipTo}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-black focus:text-emerald-800 focus:shadow-lg"
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-7">
        <Link href="/" className="flex items-center gap-3" aria-label="Watts My Bill home">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl sm:h-[46px] sm:w-[46px]">
            <Image src="/logo.png" alt="" width={46} height={47} className="h-auto w-full rounded-xl" />
          </span>
          <div>
            <p className="text-sm font-black tracking-tight text-slate-950 sm:text-base">Watts My Bill?</p>
            <p className="hidden text-xs font-bold text-emerald-700 min-[440px]:block">Understand your electricity bill</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-bold sm:gap-3" aria-label="Site navigation">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(link.href) ? "page" : undefined}
              className={`hidden transition md:inline ${
                isCurrent(link.href) ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/#calculator"
            className="inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-4 py-2.5 text-white shadow-sm transition hover:bg-emerald-800"
          >
            <span className="sm:hidden">Calculator</span>
            <span className="hidden sm:inline">Open calculator</span>
          </Link>

          <LearningThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="learning-menu-button grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-emerald-950/10 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="learning-navigation"
          >
            {menuOpen ? <X size={17} strokeWidth={2.4} /> : <Menu size={17} strokeWidth={2.4} />}
          </button>
        </nav>
      </div>

      {menuOpen && (
        <div id="learning-navigation" className="learning-menu border-t border-emerald-950/10 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-5 py-2 sm:px-7">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={`border-b border-slate-100 py-3 text-[15px] font-bold last:border-0 ${
                  isCurrent(link.href) ? "text-emerald-700" : "text-slate-900 hover:text-emerald-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
