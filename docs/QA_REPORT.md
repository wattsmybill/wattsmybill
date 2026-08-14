# Watts My Bill? QA and product review

Date: 2026-08-14

## Outcome

### Dashboard and tariff update

- The live estimate now spans the same content width as the calculator panels and pairs the answer with a compact usage-mix story, proportional bars, visible assumptions, daily signals, and an annual outlook.
- The mobile result keeps the same insight hierarchy without horizontal overflow or empty dashboard space.
- The calculator now supports an optional first release of single-rate, peak/shoulder/off-peak time-of-use, and progressive two-tier pricing, plus daily supply charges, tax, and solar export credit.
- Up to three calculator scenarios can be saved and restored locally without an account or server upload.
- The Learning Hub, Rate Library, methodology, and every guide now share a dedicated persistent dark reading mode.
- Geist remains the product typeface after review because of its numerical clarity, neutral premium character, and readable text shapes. Hierarchy and tabular-number treatment were refined instead of introducing a second display font.

The product now has a clearer three-part information architecture:

1. **Estimate** — a compact, data-aware calculator with optional details revealed only when useful.
2. **Understand** — a searchable Learning Hub with 14 source-linked guides answering real questions.
3. **Verify** — a Rate Library covering 28 named countries with official authority, coverage, and review metadata.

A public methodology page now explains calculation rules, source selection, privacy boundaries, uncertainty, and corrections.

The visual direction remains emerald, white, and deep slate. The key improvement is density and hierarchy: strong color marks the result or destination, while supporting information sits on quieter white surfaces.

## Scenarios reviewed

- No country and no appliance: the hero gives one next action without inventing bill data.
- Appliances but no rate: usage remains visible while cost and savings ask for a rate instead of showing a misleading zero.
- Country default: the interface labels it indicative and links to official context.
- Custom rate: the user’s rate takes priority, with a warning for values likely entered in minor units.
- Actual bill entered: usage cost and non-energy charges remain distinguishable.
- Bill Detective: two periods can be compared using usage, effective rate, fixed charges, and billing days.
- Completed estimate: insights identify the largest load, its share, a realistic reduction, and a related guide.
- Export: sharing remains direct; optional name and address fields are collapsed and processed on-device for PDF generation.

## Accessibility and resilience

- Core palette contrast was verified: white on the brightest primary hero stop is 5.83:1; slate helper copy on white is 4.76:1; dark reading copy is 10.52:1; dark interactive mint is 12.06:1.
- Typography, palette roles, dashboard anatomy, responsive targets, and copy rules are recorded in `docs/DESIGN_SYSTEM.md`.

- Semantic main content and skip links are present.
- Country selection supports arrow keys, Enter, Escape, active-option announcement, and listbox semantics.
- Dialogs have modal semantics and labelled headings; the page behind them does not scroll.
- Keyboard focus is visible across the product.
- Reduced-motion preferences stop nonessential number and fact animations.
- User-entered numeric fields reject negative values and cap impossible hours and days.
- Learning content and country metadata are checked by `npm run validate:content`.

## Search and discovery

- Canonical URLs use the production `www` host.
- The calculator, Learning Hub, Rate Library, and all guide pages are included in the sitemap.
- Guide pages include article, breadcrumb, Open Graph, and Twitter metadata.
- Guides link visibly to the methodology and their primary sources instead of relying on hidden metadata alone.
- The Hub includes collection structured data, query search, topic filters, related paths, and a deliberate question-submission link.
- IndexNow submission is scripted but should only run after the updated deployment is live.

## Known limitations

- The current time-of-use model uses peak and optional shoulder percentages and assigns the remainder to off-peak; appliance-by-period allocation remains future work.
- The current tiered model supports two progressive bands; more complex slabs, minimum bills, demand charges, and controlled loads remain future work.
- Saved scenarios are device-local, limited to three, and do not yet have custom names or shareable comparison links.

- Country defaults are illustrative single rates, not current provider tariffs.
- Demand and controlled-load structures are not yet modeled directly.
- Full privacy-safe funnel measurement and an appropriate worldwide consent approach still need product and legal decisions.
- Final visual acceptance should include hands-on checks at 360, 390, 768, 1024, and 1440 px on real target browsers.

## Automated release gate

The final `npm run qa` result passed:

- ESLint;
- deterministic tariff tests for simple, peak/shoulder/off-peak, progressive-tier, daily-charge, tax, solar-credit, and credit-floor calculations;
- 14 guide and 28 country-reference content validation;
- optimized Next.js production compilation;
- 18 public HTML pages and 18 sitemap URLs;
- canonical, title, social, heading, structured-data, favicon, and internal-link checks;
- whitespace and UTF-8 source integrity.
- production dependency audit: 0 known vulnerabilities reported by npm.

The PDF library is loaded only when a report is requested rather than being referenced by the initial home-page HTML. The local preview returned HTTP 200 for the calculator, Hub, Rate Library, methodology, sitemap, and current favicon assets.

## Recommended build order

1. Add an optional advanced tariff model for time-of-use, standing charges, tiers, and solar import/export.
2. Add two or three locally saved scenarios with a clear monthly and annual difference view—no account required.
3. Introduce privacy-safe funnel events that never contain bill amounts, addresses, or free-text appliance names.
4. Turn deliberately submitted unanswered questions into the editorial backlog.
5. Create reviewed country landing pages only after the source pipeline can track tariff type, period, jurisdiction, and expiry.
