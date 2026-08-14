# Watts My Bill? Product Roadmap

## Product promise

Help anyone understand what is driving an electricity bill, estimate appliance usage, and find the next useful answer without needing utility-industry knowledge.

The experience should feel calm, credible, compact, and premium. It should explain uncertainty instead of hiding it, and it should work across countries without pretending that a national average is a live household tariff.

## Completed in the current improvement sprint

- Rebuilt the result dashboard at the same full content width as the calculator, with a compact energy brief that remains useful at 360-390 px.
- Added a dedicated, persistent dark reading mode across the Learning Hub, Rate Library, methodology, and all guide pages.
- Shipped the first advanced-pricing release: single rate, peak/shoulder/off-peak allocation, two progressive tiers, daily supply charge, percentage tax, and solar export credit.
- Added up to three private, device-local setup snapshots with current-versus-saved usage or cost differences and one-tap restore.
- Retained Geist after a typography QA pass and improved numerical alignment and information hierarchy.
- Reworked the live estimate into a compact, data-aware summary.
- Added progressive disclosure for optional bill inputs and Bill Detective.
- Created a searchable, filterable Learning Hub with 14 original guides.
- Added source-linked article pages, table-of-contents navigation, related reading, breadcrumbs, and structured data.
- Added official government, regulator, or utility rate context for all 28 named countries currently available in the selector.
- Added a searchable Rate Library that separates calculator defaults from official tariff context.
- Published an open methodology covering calculations, sourcing, privacy, limitations, and corrections.
- Added clearer language distinguishing indicative defaults from live tariffs.
- Improved mobile Learning Hub navigation, keyboard country selection, focus visibility, and skip navigation.
- Added sitemap coverage for every guide and verified static production builds.

## Next product priorities

### 1. Support real tariff structures

**First useful version shipped.** The remaining work is to extend the model without expanding the default path.

The current calculator works best with a single blended rate. The next calculator model should support:

- peak, shoulder, and off-peak usage;
- tiered or slab rates;
- daily supply or standing charges;
- taxes and adjustable surcharges;
- separate import and export rates for solar households.

Keep the default path simple. Reveal tariff structure only when a user selects “My bill has more than one rate.”

Implementation details, calculation order, validation, and test cases are defined in [TARIFF_ENGINE_SPEC.md](TARIFF_ENGINE_SPEC.md).

### 2. Build a rate provenance pipeline

Move country defaults into a versioned dataset with:

- jurisdiction and provider coverage;
- currency and tax treatment;
- source URL and authority;
- source period and review date;
- whether the figure is an average, regulated tariff, or illustrative baseline;
- an expiry or re-review rule.

The UI should continue to prefer a user’s bill rate over any default.

### 3. Add saved comparisons, not accounts

**First useful version shipped.** Three local snapshots can now be saved, compared, restored, and removed. Custom names, annualized differences, and shareable assumption summaries remain next.

Let users compare a small number of scenarios locally before adding authentication:

- current household;
- one changed assumption;
- estimated monthly and annual difference;
- shareable summary with assumptions visible.

This keeps the privacy-friendly, no-account advantage while creating a reason to return.

### 4. Measure the useful funnel

Track only the events needed to improve the product:

- calculator started;
- country selected;
- preset or manual path chosen;
- first valid estimate reached;
- Bill Detective completed;
- guide searched, opened, and linked back to calculator;
- share, report, or install action used.

Do not send bill amounts, addresses, appliance names entered by users, or other calculator content to analytics. Add an appropriate consent approach before expanding tracking worldwide.

### 5. Turn unanswered questions into the editorial backlog

Add a privacy-safe “Didn’t find your answer?” interaction. Store only a deliberately submitted question, not every search keystroke. Review common themes monthly and publish guides that answer distinct problems.

Recommended content clusters:

- refrigerator cycling and annual energy labels;
- water-heater running cost and schedules;
- electric-vehicle charging at home;
- prepaid meters and emergency credit;
- demand charges and maximum demand;
- moving home, final readings, and closing bills;
- choosing between fixed, variable, and time-of-use plans;
- safe steps when a meter or appliance may be faulty.

### 6. Create country landing pages only when data is defensible

A country page can attract search traffic, but it should not be a thin template. Each page needs local terminology, common tariff structures, an official-source directory, and a clear review date. Start with countries where official data and meaningful search demand overlap.

## Premium visual guardrails

- One strong emerald moment per screen, supported by white and deep slate surfaces.
- Compact information density with clear grouping; avoid wide dashboard strips that leave empty space.
- Use color to communicate hierarchy or state, not decoration alone.
- Keep primary actions obvious and secondary education one tap away.
- Prefer one excellent chart or comparison over multiple decorative cards.
- Design mobile first at 360–390 px, then constrain desktop reading and calculator widths.
- Keep labels factual: “indicative,” “estimated,” “official context,” and “your rate” must remain visually distinct.

## Release checklist

- Test 360 px, 390 px, 768 px, 1024 px, and 1440 px layouts.
- Complete a keyboard-only calculator and Learning Hub journey.
- Check visible focus, heading order, form labels, dialogs, and error language.
- Verify one simple-rate, one time-of-use, one tiered-rate, and one solar bill scenario when those models are added.
- Run lint, production build, sitemap inspection, and structured-data validation.
- Confirm that country defaults display their source context and never claim to be live tariffs.
- Request recrawling in Google Search Console after favicon or structured-data changes.
- After the new production deployment is live, run `npm run seo:notify` once to notify IndexNow of the current guide URLs.
