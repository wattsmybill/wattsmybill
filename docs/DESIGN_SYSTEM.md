# Watts My Bill? interface system

## Design intent

The product should feel calm, useful, globally credible, and quietly premium. It is a utility, not a financial trading dashboard. Every screen should answer one question first, then reveal deeper detail only when requested.

## Typography

**Primary typeface: Geist Sans.** Retain it across calculator and editorial experiences.

Why it fits:

- clear shapes at small mobile sizes;
- excellent numerical legibility for rates, kWh, and money;
- a neutral international character that does not suggest one country;
- enough weight range for strong hierarchy without adding a decorative display face.

Use Geist Mono only for formulas or code-like calculation examples. Use tabular numerals for prominent results and dashboard values.

Hierarchy rules:

- Result number: black weight, tight tracking, tabular numerals.
- Page title: black weight with restrained negative tracking.
- Card title: bold or black, never oversized merely to fill width.
- Body: regular weight, comfortable line height, generally 55-75 characters per line on reading pages.
- Eyebrow: 9-12 px, uppercase, black weight, increased tracking; use only to establish context.

## Color roles

### Brand result

Use the emerald gradient for one primary destination or live result per screen:

- deep edge: `#043a33`;
- middle: `#075342` to `#0b7356`;
- bright edge: `#10956c`.

White text remains readable even at the brighter `#0b7356` stop (5.83:1 contrast). Avoid placing small low-opacity text directly over the brightest gradient area without a darker local surface.

### Light utility surfaces

- page background: `#eef3f1`;
- primary surface: `#ffffff`;
- input surface: `#f7f8f8`;
- heading: `#0f172a`;
- body and helper copy: `#64748b`;
- interactive emerald: `#047857`.

Verified contrast:

- `#0f172a` on white: 17.85:1;
- `#64748b` on white: 4.76:1;
- `#047857` on white: 5.48:1.

### Dark reading surfaces

- page background: `#06142b`;
- raised surface: `#0b1b31`;
- secondary surface: `#10233c`;
- heading: `#f8fafc`;
- body: `#b9c5d6`;
- interactive mint: `#6ee7b7`.

Verified contrast:

- `#f8fafc` on `#06142b`: 17.56:1;
- `#b9c5d6` on `#06142b`: 10.52:1;
- `#6ee7b7` on `#06142b`: 12.06:1.

Dark reading mode is independent from the calculator theme and persists across the Learning Hub, Rate Library, methodology, and individual guides.

## Dashboard anatomy

The result card uses the same maximum width as calculator panels. It should not float as a narrow island on desktop.

1. **Answer:** bill estimate or usage estimate.
2. **Scope:** tariff type and billing period.
3. **Assumptions:** appliance count, rate provenance, and whether extra bill items are included.
4. **Actions:** review, insights, and save.
5. **Usage story:** one human sentence plus proportional bars for the two largest loads and the remainder.
6. **Outlook:** usage per day, cost per day, and annualized cost at the same use and rate.

Phones stack answer and brief. Tablets and desktops use two columns. The card should remain about 400-440 px tall on small phones and about 275-300 px on desktop.

## Surface and spacing rules

- One strong emerald surface per viewport; support it with white or deep navy.
- Use 22-28 px radii for major panels and 14-18 px for nested controls.
- Use borders and subtle tonal shifts before adding shadows.
- Prefer compact 8-16 px internal gaps for dashboard data; use 20-28 px for major section separation.
- Do not create a wide card unless the right-hand space contains useful information.
- Keep optional complexity collapsed. The collapsed label must explain why opening it is useful.

## Data and state colors

- Emerald: action, verified path, positive opportunity, or brand focus.
- Amber: incomplete or attention-required input.
- Rose: real adverse difference or error, never decoration.
- Slate: neutral metadata and uncertainty.

Color should not be the only signal; pair it with a label, icon, or plain-language message.

## Responsive acceptance

Check every main route at 360, 390, 768, 1024, and 1440 px.

- No horizontal overflow.
- Result actions stay on one row where practical.
- Reading headers do not wrap the brand awkwardly.
- Long appliance names truncate without hiding the percentage or units.
- Optional tariff inputs remain one clear sequence on phones and a compact grid on larger screens.

## Copy standard

Prefer direct, factual language:

- “estimated,” not “your bill will be”;
- “indicative default,” not “current tariff”;
- “official context,” not “official rate” when a source does not define the user’s payable price;
- “at the same usage and rate” for annualized projections;
- “saved on this device” for local scenarios.

Every insight should either explain a result, identify a driver, or suggest the next safe action.
