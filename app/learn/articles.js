import { ADDITIONAL_ARTICLES } from "./additionalArticles.js";
import { INSIGHT_ARTICLES } from "./insightArticles.js";
import { SPECIAL_USE_ARTICLES } from "./specialUseArticles.js";

export const ARTICLES = [
  {
    slug: "why-is-my-electricity-bill-so-high",
    title: "Why Is My Electricity Bill So High?",
    description:
      "A practical, country-neutral checklist for separating higher usage, changing rates, fixed charges, seasonal demand, and possible billing problems.",
    category: "Bill troubleshooting",
    readingTime: "8 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "A higher electricity bill does not automatically mean one appliance is faulty. The total can rise because you used more energy, the price of each unit changed, fixed charges increased, the billing period was longer, or several small changes happened together. The fastest way to find the cause is to separate those possibilities instead of guessing.",
    takeaways: [
      "Compare kWh before comparing money.",
      "Check the number of days in each billing period.",
      "Separate usage charges from fixed charges, taxes, and adjustments.",
      "Investigate cooling, heating, hot water, and always-on devices first.",
    ],
    sections: [
      {
        heading: "1. Compare energy use, not only the total bill",
        paragraphs: [
          "Find the kWh figure on your current bill and on a previous bill. If the cost increased but kWh stayed similar, the likely cause is the tariff, a fixed charge, tax, credit, or adjustment. If kWh increased, household usage is the more likely driver.",
          "Use comparable periods. A 35-day bill will naturally contain more usage than a 28-day bill. Divide kWh by billing days to calculate average daily use before deciding that consumption has changed.",
        ],
        formula: "Average daily use = billed kWh / number of billing days",
      },
      {
        heading: "2. Check whether your price changed",
        paragraphs: [
          "Electricity bills may include a usage rate, daily supply or standing charge, taxes, network costs, fuel adjustments, and other local charges. Some plans also use peak and off-peak prices or charge different rates after you cross a usage tier.",
          "Calculate an effective usage rate by subtracting known fixed charges from the total and dividing the remainder by billed kWh. This is still an approximation when the bill contains credits or several tariff periods, but it is much more useful than assuming one national average.",
        ],
        formula: "Effective usage rate = (bill total - fixed charges) / billed kWh",
      },
      {
        heading: "3. Look for seasonal and household changes",
        paragraphs: [
          "Cooling and heating often dominate seasonal changes because they run for long periods and work harder during extreme weather. Hot-water systems, clothes dryers, dehumidifiers, pool pumps, additional refrigerators, guests, working from home, and electric-vehicle charging are other common causes.",
          "Think about what changed during the exact billing period. A new appliance matters, but a familiar appliance running for more hours can matter just as much.",
        ],
      },
      {
        heading: "4. Test the largest possibilities first",
        paragraphs: [
          "Estimate the appliances most likely to explain the increase. Start with cooling, heating, hot water, refrigeration, dryers, pumps, and equipment that stays on all day. Use the appliance label as a starting point, but remember that refrigerators cycle and inverter air conditioners vary their power.",
          "A plug-in energy monitor can improve confidence for suitable plug-in appliances. Do not attempt electrical-panel or meter work yourself; use a qualified professional where required.",
        ],
      },
      {
        heading: "5. Know when to contact the provider",
        paragraphs: [
          "Contact your electricity provider if the meter reading on the bill does not match the meter, the bill is estimated rather than measured, a discount disappeared, the tariff changed unexpectedly, or the usage increase cannot be explained after checking major appliances.",
          "Keep the current bill, a previous bill, meter photographs, and dates of any household changes. These make the conversation much more productive.",
        ],
      },
    ],
    calculatorPrompt:
      "Use Bill Detective to compare your current and previous bills, then add major appliances to see how much of the change your household usage can explain.",
    sources: [
      {
        label: "Ofgem: understand electricity and gas bills",
        url: "https://www.ofgem.gov.uk/understand-your-electricity-and-gas-bills",
      },
      {
        label: "Australian Energy Made Easy: understanding charges",
        url: "https://www.energymadeeasy.gov.au/article/understanding-gas-and-electricity-charges",
      },
      {
        label: "US EIA: factors affecting electricity prices",
        url: "https://www.eia.gov/energyexplained/electricity/prices-and-factors-affecting-prices.php",
      },
    ],
  },
  {
    slug: "how-to-find-your-electricity-rate",
    title: "How to Find the Electricity Rate on Your Bill",
    description:
      "Find the correct price per kWh, understand fixed charges and time-of-use rates, and calculate an effective rate when your bill is complicated.",
    category: "Reading your bill",
    readingTime: "7 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "The electricity rate is the price charged for each kilowatt-hour, usually written as price/kWh or cents/kWh. It is often not the same as bill total divided by usage because bills can contain fixed charges, taxes, credits, and more than one usage rate.",
    takeaways: [
      "Look in the usage, energy, or consumption section of the bill.",
      "Match the currency unit: cents and dollars are not interchangeable.",
      "Do not add a fixed daily charge to the per-kWh field.",
      "Enter separate peak and off-peak rates only in a time-of-use calculator.",
    ],
    sections: [
      {
        heading: "Where the rate normally appears",
        paragraphs: [
          "Look for a table containing usage, consumption, energy charge, unit rate, or tariff. The row often shows the number of kWh, the price for each kWh, and the resulting charge. Your provider may split this into several rows.",
          "The rate may be displayed in a smaller unit. For example, 30 cents/kWh should be entered as 0.30 dollars/kWh in a calculator displaying dollars. A rate of 12 currency units/kWh should be entered as 12, not 0.12.",
        ],
      },
      {
        heading: "Separate usage rates from fixed charges",
        paragraphs: [
          "A supply, service, connection, or standing charge is usually paid each day or billing period regardless of how much electricity you use. Keep it separate from the usage rate. Watts My Bill can add a fixed charge after estimating appliance usage.",
          "Taxes and adjustments vary by location. If they are percentage-based or calculated using rules the calculator does not support, treat the final result as an energy-cost estimate and compare it with the real bill.",
        ],
      },
      {
        heading: "If your bill has several rates",
        paragraphs: [
          "A time-of-use plan may have peak, shoulder, and off-peak prices. A tiered plan may charge one rate for the first block of kWh and another after a threshold. Solar customers may also see separate import and export rates.",
          "For a simple estimate, derive a blended effective rate from the bill. For decisions about shifting appliance use between times, use the individual tariff rates because an average hides the possible savings.",
        ],
      },
      {
        heading: "Calculate an effective rate",
        paragraphs: [
          "If the bill does not show one clear rate, subtract any known fixed charge from the total, then divide by billed kWh. Remove one-off credits or penalties when possible. The result estimates what each kWh cost across the billing period.",
        ],
        formula: "Effective rate = (bill total - known fixed charges) / billed kWh",
      },
      {
        heading: "Why country averages need caution",
        paragraphs: [
          "National averages are useful when you have no bill, but actual prices can vary by region, provider, consumption band, meter type, payment method, and time of day. Always replace an average with the rate from your own bill when you can.",
        ],
      },
    ],
    calculatorPrompt:
      "Use the bill details fields to calculate an effective rate, then apply it to your appliance estimate with one click.",
    sources: [
      {
        label: "Ofgem: unit rates and standing charges",
        url: "https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-unit-rates-and-standing-charges",
      },
      {
        label: "Eurostat: household electricity-price methodology",
        url: "https://ec.europa.eu/eurostat/cache/metadata/en/nrg_pc_204_sims.htm",
      },
      {
        label: "US EIA: electricity prices and factors",
        url: "https://www.eia.gov/energyexplained/electricity/prices-and-factors-affecting-prices.php",
      },
    ],
  },
  {
    slug: "watts-kwh-electricity-cost-explained",
    title: "Watts, kWh, and Electricity Cost Explained",
    description:
      "Understand the difference between appliance power and energy use, calculate running cost, and avoid the most common estimation mistakes.",
    category: "Energy basics",
    readingTime: "6 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "Watts describe how quickly an appliance uses electricity. Kilowatt-hours describe how much electricity it uses over time. Your bill normally charges for kilowatt-hours, which is why both power and running time matter.",
    takeaways: [
      "Watts measure power; kWh measure energy used over time.",
      "Divide watts by 1,000 before multiplying by hours.",
      "A low-power device can still cost more if it runs continuously.",
      "Rated power may differ from average real-world power.",
    ],
    sections: [
      {
        heading: "Watts measure power",
        paragraphs: [
          "The watt figure on a label describes power at a moment in time. A 2,000-watt heater draws power much faster than a 10-watt LED lamp while both are operating. That does not by itself tell you the monthly cost because the running time may be completely different.",
        ],
      },
      {
        heading: "Kilowatt-hours measure energy",
        paragraphs: [
          "One kilowatt-hour is the energy used by a 1,000-watt device running for one hour. The same one kWh could come from a 100-watt device operating for ten hours or a 2,000-watt device operating for half an hour.",
        ],
        formula: "kWh = (watts x quantity x hours x days) / 1,000",
      },
      {
        heading: "Convert energy into cost",
        paragraphs: [
          "Multiply estimated kWh by the electricity rate. If the rate is 0.30 per kWh and an appliance uses 60 kWh, its usage charge is 18.00 in that currency. Add fixed charges separately because they are not caused by the appliance.",
        ],
        formula: "Usage cost = kWh x electricity rate",
      },
      {
        heading: "Example: two very different appliances",
        paragraphs: [
          "A 2,000-watt kettle used for ten minutes a day consumes about 10 kWh in 30 days. A 100-watt device running 24 hours a day consumes 72 kWh in the same period. The lower-power device uses more energy because it runs much longer.",
          "This is why reducing unnecessary running time can be more useful than focusing only on the largest watt number.",
        ],
      },
      {
        heading: "Why real usage may differ from the label",
        paragraphs: [
          "Refrigerators and some heaters cycle on and off. Inverter air conditioners change output as conditions change. Computers vary with workload, and power-adapter ratings can represent a maximum rather than normal use. A measured average or annual energy label is usually more accurate than maximum rated watts.",
        ],
      },
      {
        heading: "Common mistakes to avoid",
        paragraphs: [
          "Do not confuse watts with kilowatts, cents with dollars, or daily use with monthly use. Check quantities for repeated appliances, and avoid assuming a cycling appliance runs at full rated power for 24 hours. Small unit mistakes can make an estimate 10, 100, or 1,000 times too high.",
        ],
      },
    ],
    calculatorPrompt:
      "Choose an appliance or enter its label wattage, then adjust hours and days to see its estimated kWh and cost.",
    sources: [
      {
        label: "US EIA: measuring electricity",
        url: "https://www.eia.gov/energyexplained/electricity/measuring-electricity.php",
      },
      {
        label: "US Department of Energy: measuring standby power",
        url: "https://www.energy.gov/cmei/femp/measuring-standby-power",
      },
      {
        label: "EU: understanding appliance energy labels",
        url: "https://europa.eu/youreurope/citizens/consumers/shopping/energy-labels/index_en.htm",
      },
    ],
  },
  ...ADDITIONAL_ARTICLES,
  ...INSIGHT_ARTICLES,
  ...SPECIAL_USE_ARTICLES,
];

export function getArticle(slug) {
  return ARTICLES.find((article) => article.slug === slug);
}
