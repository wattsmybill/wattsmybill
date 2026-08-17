"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Calculator, Globe2 } from "lucide-react";

/**
 * Bottom navigation for the installed app.
 *
 * The Learning Hub, Rate Library and Bill History were reachable on a phone
 * only through a hamburger menu, which is where features go to be undiscovered.
 * They are the reason someone comes back, so they get a permanent, thumb-height
 * home instead.
 *
 * Shown below 1024px, matching the breakpoint where the header navigation takes
 * over. The two must stay in step: if the bar hid earlier than the header nav
 * appeared, that band of widths would have no primary navigation at all.
 */
const TABS = [
  { href: "/", label: "Estimate", Icon: Calculator },
  { href: "/history", label: "History", Icon: BarChart3 },
  { href: "/learn", label: "Learn", Icon: BookOpen },
  { href: "/rates", label: "Rates", Icon: Globe2 },
];

export default function BottomTabs() {
  const pathname = usePathname();

  const isCurrent = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="wmb-bottom-tabs lg:hidden" aria-label="Main sections">
      <ul>
        {TABS.map(({ href, label, Icon }) => {
          const current = isCurrent(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={current ? "page" : undefined} data-current={current || undefined}>
                <Icon size={19} strokeWidth={current ? 2.4 : 2} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
