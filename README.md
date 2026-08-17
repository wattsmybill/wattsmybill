# Watts My Bill?

Watts My Bill? is a free, privacy-conscious electricity estimator and Learning Hub for a worldwide audience. It helps people estimate appliance energy use, understand what changed between two bills, find their electricity rate, and learn how common tariff and household-energy concepts work.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run validate:content
npm run validate:tariff
npm run lint
npm run build
npm run validate:build
npm run qa
```

The tariff validator checks simple, time-of-use, shoulder, progressive-tier, standing-charge, tax, solar-credit, and non-negative-total calculations. The content validator checks guide structure, dates, categories, source links, appliance ranges, country defaults, and rate metadata. The build validator checks generated pages, sitemap entries, canonical and social metadata, structured data, and favicon declarations. `qa` runs the complete release gate.

## Main areas

- `/` — calculator, household presets, Bill Detective, insights, sharing, and PDF report
- `/learn` — searchable and filterable electricity Learning Hub
- `/learn/[slug]` — static, source-linked guides with article metadata and structured data
- `/rates` — searchable country source directory with transparent calculator defaults
- `/methodology` — calculation, sourcing, privacy, and correction standards
- `/sitemap.xml` and `/robots.txt` — search discovery

## Data and trust model

- Calculator inputs are stored locally in the browser so a session can be restored.
- Country rates are indicative planning defaults, not live tariffs.
- A user-entered provider rate always takes precedence over the country default.
- Every named country in the selector links to official government, regulator, or utility context and includes a coverage caveat.
- Guides cite first-party or authoritative sources and show their update date.

## Installed-app launch screen

Android paints its own splash when the installed app is opened, built from the manifest's `background_color` and the app icon. It happens before any of our code runs, so it cannot be removed, shortened, or animated.

**Chrome draws that splash from the `maskable` icon.** Supplying a separate `purpose: "any"` icon does not change it — this was tried on a real device and had no effect, so the manifest deliberately keeps both icons as `any maskable` rather than carrying a second set that nothing uses.

Because the tiled icon on the splash is therefore fixed, the launch animation is what adapts to it. It opens on the same teal tile the splash just showed, so there is no visible handoff, then dissolves the tile away while the mark draws itself and finishes on the untiled logo.

The animation lives in `app/layout.js` (markup) and the launch-screen block of `app/globals.css` (timings and geometry). Its paths were traced from `android-chrome-512x512.png` and match the real logo; if the icon artwork ever changes, re-trace them or the two will drift apart.

## Search notification

After a production deployment containing new or updated URLs is live, notify participating IndexNow search engines once:

```bash
npm run seo:notify
```

Google recrawling should be requested separately through URL Inspection in Google Search Console.

## Product direction

See [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md) for the product direction, [docs/QA_REPORT.md](docs/QA_REPORT.md) for the current review, [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for the visual rules, and [docs/TARIFF_ENGINE_SPEC.md](docs/TARIFF_ENGINE_SPEC.md) for the advanced calculator model.
