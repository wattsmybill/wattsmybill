# Advanced tariff engine specification

## Goal

Support the bill structures people actually encounter worldwide without making the default calculator harder to use.

The simple path remains one optional per-kWh rate. An advanced path appears only when a user chooses **My bill has more than one rate or charge**.

## Current implementation status

The first progressive-disclosure release is implemented in the calculator. It supports a single rate, peak/shoulder/off-peak percentage allocation, two progressive tiers, daily supply charges, one percentage tax, and solar export credit. The line-item preview shows energy, supply plus fixed charges, export credit, and tax. Arbitrary tier lists, appliance-by-period allocation, demand charges, controlled loads, and measured import/export flows remain later extensions.

## Supported models

### 1. Simple blended rate

- One price per kWh.
- Optional daily supply or standing charge.
- Optional fixed bill-period charges.
- Best for a user who has already calculated an effective rate from a bill.

### 2. Time of use

- Peak, shoulder, and off-peak prices.
- A user assigns either appliance usage or a percentage of total kWh to each period.
- The interface must show whether percentages total 100%.
- A controlled-load or overnight rate can be represented as another named period.

### 3. Tiered or slab rate

- Ordered bands with an upper kWh boundary and a price.
- The final band has no upper boundary.
- Progressive tiers charge each band separately; do not multiply all usage by the highest reached rate.
- Local minimum charges or lifeline blocks belong in explicit adjustments, not hidden logic.

### 4. Solar import and export

- Imported grid kWh and its applicable rate model.
- Exported kWh and feed-in credit per kWh.
- Optional fixed charges.
- Self-consumed solar is not billed import and should not also be counted as export.
- Battery flows remain a later extension unless the user supplies measured grid import and export.

### 5. Demand charge

- Optional maximum-demand value in kW and price per kW.
- Billing demand rules vary significantly; the user must confirm whether the charge uses measured peak, contracted demand, ratchet, or another definition.
- Keep this out of the household default path.

## Proposed data model

```js
{
  model: "simple" | "timeOfUse" | "tiered" | "solar",
  currency: "A$",
  billingDays: 30,
  energy: {
    simpleRate: 0.32,
    periods: [
      { id: "peak", label: "Peak", rate: 0.48, kwh: 84 },
      { id: "offPeak", label: "Off-peak", rate: 0.21, kwh: 126 }
    ],
    tiers: [
      { upToKwh: 100, rate: 0.15 },
      { upToKwh: 300, rate: 0.22 },
      { upToKwh: null, rate: 0.31 }
    ]
  },
  fixedCharges: {
    daily: 1.05,
    billingPeriod: 0
  },
  solar: {
    exportKwh: 92,
    exportRate: 0.07
  },
  demand: {
    kw: 0,
    ratePerKw: 0
  },
  adjustments: [
    { label: "Tax or levy", kind: "percent", value: 10 },
    { label: "Credit", kind: "fixed", value: -12 }
  ],
  provenance: {
    source: "userBill" | "countryDefault" | "manual",
    provider: "",
    jurisdiction: "",
    periodLabel: "",
    sourceUrl: "",
    checked: "YYYY-MM-DD"
  }
}
```

Free-text provider and adjustment labels must never be sent to analytics.

## Calculation order

1. Calculate appliance or entered kWh.
2. Allocate energy to time periods or tiers.
3. Calculate energy charges.
4. Add daily supply charge × billing days.
5. Add fixed bill-period charges.
6. Add an optional demand charge.
7. Subtract solar export credit.
8. Apply fixed and percentage adjustments in a visible order.
9. Show total estimate and a line-item explanation.

### Progressive tier formula

For each tier, charge only the kWh inside that band:

```text
tier kWh = min(remaining kWh, tier width)
tier charge = tier kWh × tier rate
```

### Time-of-use validation

```text
total allocated kWh = peak kWh + shoulder kWh + off-peak kWh
```

The allocated total must equal the estimate’s total kWh within a small rounding tolerance. If the user allocates percentages, normalize only after displaying the discrepancy and receiving confirmation.

## UX sequence

1. User selects country or enters a rate.
2. A quiet link reads **My bill has more than one rate or charge**.
3. User chooses a bill structure using plain examples:
   - one price all day;
   - different prices by time;
   - price changes after a usage threshold;
   - solar import and export.
4. Only the fields for that model appear.
5. A live line-item preview explains each charge before the user applies it.
6. The main hero keeps one total; an expandable detail shows energy, fixed charges, taxes or adjustments, and credits.

## Required test cases

- Simple rate with zero fixed charges.
- Simple rate plus a 30-day standing charge.
- Time-of-use allocation totaling exactly 100%.
- Time-of-use allocation below and above 100%.
- Progressive tiers ending inside the first, middle, and final band.
- Zero-kWh bill with fixed charges only.
- Solar import greater than export, export greater than import, and zero export.
- Credit larger than pre-credit charges without producing an unexplained negative bill.
- Decimal currency, whole-unit currency, and very large minor-unit-looking input.
- Billing periods of 1, 28, 30, 31, and 45 days.

## Non-goals for the first release

- Automatically scraping retailer tariffs.
- Recommending a provider or plan.
- Predicting solar generation from an address.
- Inferring time-of-use allocation without interval data.
- Hiding tariff assumptions behind a single unexplained total.

## Release principle

Every advanced result must answer three questions in plain language:

1. How many kWh were charged in each category?
2. Which rates and fixed charges were applied?
3. Which values came from the user, the bill, or an illustrative default?
