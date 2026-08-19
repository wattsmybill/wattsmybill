"use client";

import { useEffect, useRef } from "react";
import { AD_CLIENT, AD_SLOTS } from "../lib/ads";

/**
 * One AdSense unit.
 *
 * Two things this guards against.
 *
 * The push is fired once per mount and never again. React re-renders and the
 * back/forward cache both re-run effects, and pushing twice at the same tag
 * makes AdSense throw "All ads-by-google tags already have ads in them", which
 * kills every later slot on the page as well.
 *
 * The space is reserved before the ad arrives. An ad that loads after paint and
 * pushes the page down is the usual way advertising wrecks Cumulative Layout
 * Shift, and Core Web Vitals feed back into search ranking. If the slot comes
 * back unfilled it collapses instead of leaving a hole, handled in globals.css.
 */
export default function AdSlot({ placement, className = "", minHeight = 250 }) {
  const slot = AD_SLOTS[placement] || "";
  const pushed = useRef(false);

  useEffect(() => {
    if (!AD_CLIENT || !slot || pushed.current) return;
    pushed.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // A blocked or failed ad must never take the calculator down with it.
    }
  }, [slot]);

  // Nothing is rendered at all until this placement is configured, so the
  // layout is identical to the unmonetised site rather than holding a gap.
  if (!AD_CLIENT || !slot) return null;

  return (
    <aside className={`wmb-ad ${className}`} aria-label="Advertisement">
      <p className="wmb-ad-label">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
