export const ADDITIONAL_ARTICLES = [
  {
    slug: "how-much-does-an-appliance-cost-to-run",
    title: "How Much Does an Appliance Cost to Run?",
    description:
      "Calculate appliance running cost from watts, time, quantity, and your electricity rate without confusing power with energy.",
    category: "Appliance costs",
    readingTime: "7 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "The price of running an appliance depends on more than the wattage printed on its label. You also need to know how long it runs, how often it cycles, how many units you own, and the price charged for each kilowatt-hour. A simple estimate can still be useful when each assumption is visible and easy to change.",
    takeaways: [
      "Convert watts and running time into kWh before calculating cost.",
      "Use your own provider rate whenever possible.",
      "Treat label wattage as a starting point for cycling or variable-power appliances.",
      "Compare appliances over the same number of days."
    ],
    sections: [
      {
        heading: "Start with energy, not money",
        paragraphs: [
          "Multiply the appliance power by quantity, hours used per day, and days used. Divide by 1,000 to convert watt-hours into kilowatt-hours. Only then multiply by the electricity rate.",
          "For short-use appliances, convert minutes to a fraction of an hour. Ten minutes is about 0.167 hours. Small conversion errors repeated every day can noticeably distort a monthly estimate."
        ],
        formula: "Running cost = (watts × quantity × hours × days ÷ 1,000) × rate per kWh"
      },
      {
        heading: "Use the best power figure available",
        paragraphs: [
          "A label may show rated or maximum input, not the average used every minute. Refrigerators cycle, inverter air conditioners change output, and computers vary with workload. An energy label, provider monitoring portal, or plug-in meter can give a better average for suitable appliances.",
          "Keep the label figure when no better measurement exists, but describe the result as an estimate and test a reasonable lower and upper range."
        ]
      },
      {
        heading: "Compare the right scenario",
        paragraphs: [
          "A high-wattage kettle used briefly may cost less than a lower-power device that runs all day. Compare monthly kWh, not wattage alone. When considering a replacement, compare annual energy use and the full purchase cost rather than assuming the lowest watt number is automatically the best choice."
        ]
      },
      {
        heading: "Remember charges the appliance does not cause",
        paragraphs: [
          "Supply, standing, service, demand, tax, and adjustment charges may remain even when appliance usage falls. Keep fixed charges separate so a running-cost estimate does not promise savings the bill structure cannot deliver."
        ]
      }
    ],
    calculatorPrompt:
      "Add the appliance, enter its normal daily runtime, and compare scenarios by changing one assumption at a time.",
    sources: [
      {
        label: "U.S. Department of Energy: estimating appliance energy use",
        url: "https://www.energy.gov/energysaver/estimating-appliance-and-home-electronic-energy-use"
      },
      {
        label: "European Commission: energy-efficient products",
        url: "https://energy-efficient-products.ec.europa.eu/index_en"
      }
    ]
  },
  {
    slug: "peak-off-peak-time-of-use-electricity",
    title: "Peak, Off-Peak, and Time-of-Use Electricity Explained",
    description:
      "Understand changing electricity prices by time of day and decide whether shifting flexible appliance use may help.",
    category: "Tariffs and rates",
    readingTime: "8 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "A time-of-use tariff charges different prices at different times. Peak periods cost more, off-peak periods cost less, and some plans include a shoulder price between them. The plan only saves money when your actual usage pattern fits its time windows.",
    takeaways: [
      "Check the exact time windows on your own tariff.",
      "Do not compare a peak rate alone with a flat-rate plan.",
      "Shift flexible loads, not essential comfort or safety needs.",
      "A compatible smart or interval meter may be required."
    ],
    sections: [
      {
        heading: "How time-of-use pricing works",
        paragraphs: [
          "Peak periods usually align with times when demand on the electricity network is high. Off-peak periods are cheaper, while shoulder periods sit between them. Names and schedules vary by provider, location, season, weekday, and public holiday.",
          "Some bills also combine time windows with usage blocks, controlled-load rates, demand charges, or solar export credits. Read every relevant line rather than relying on one advertised rate."
        ]
      },
      {
        heading: "Calculate a weighted rate",
        paragraphs: [
          "Estimate how many kWh you use in each time window, multiply each amount by its rate, then add the results. Dividing that total by all kWh produces a blended rate for comparison, but it does not reveal the value of shifting a specific appliance."
        ],
        formula: "Blended rate = total time-of-use usage charges ÷ total kWh"
      },
      {
        heading: "Choose flexible loads carefully",
        paragraphs: [
          "Dishwashers, laundry, water heating, pool pumps, battery charging, and electric-vehicle charging may be movable when equipment and household routines allow it. Use built-in timers safely and follow manufacturer instructions.",
          "Cooling, heating, cooking, medical equipment, and sleep comfort may be less flexible. A cheaper rate is not a saving if it causes unsafe or impractical behavior."
        ]
      },
      {
        heading: "Know when a flat rate may be better",
        paragraphs: [
          "If much of your consumption occurs during expensive peak hours and cannot move, a flat tariff may be more predictable. Compare plans using your own interval data or several recent bills instead of a generic household profile."
        ]
      }
    ],
    calculatorPrompt:
      "Open Advanced electricity pricing in the calculator to enter peak, optional shoulder, and off-peak rates with the share of usage in each period.",
    sources: [
      {
        label: "Energy Made Easy: electricity peak prices",
        url: "https://www.energymadeeasy.gov.au/hot-topics/time-to-checkout-peak-prices"
      },
      {
        label: "Energy Made Easy: understanding tariff charges",
        url: "https://www.energymadeeasy.gov.au/article/understanding-gas-and-electricity-charges"
      }
    ]
  },
  {
    slug: "estimated-vs-actual-electricity-bill",
    title: "Estimated vs Actual Electricity Bills",
    description:
      "Learn why a provider may estimate a meter reading, how catch-up bills happen, and what evidence to check before disputing a bill.",
    category: "Bill troubleshooting",
    readingTime: "7 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "An estimated bill uses calculated consumption instead of a meter reading for the full billing period. It may be reasonable, too high, or too low. When a later actual reading arrives, the provider can correct the difference, which may create an unexpectedly large credit or catch-up charge.",
    takeaways: [
      "Check whether the bill says actual, estimated, measured, or calculated.",
      "Compare the bill reading with the meter only when it is safe to do so.",
      "Keep dated meter photographs and previous bills.",
      "Ask the provider how a corrected bill will be handled."
    ],
    sections: [
      {
        heading: "Find the reading type and date",
        paragraphs: [
          "Look near the meter number, previous reading, current reading, and usage table. Providers use different labels, but the bill should indicate whether consumption was measured or estimated. Confirm that the meter identifier matches your property.",
          "Do not compare today’s meter display directly with an old bill without allowing for electricity used since the bill’s reading date."
        ]
      },
      {
        heading: "Why estimates can create later surprises",
        paragraphs: [
          "If several estimates were lower than actual use, the eventual measured bill may contain a catch-up amount. If estimates were too high, the correction may create a credit. Compare daily kWh across billing periods to separate a reading correction from genuine household change."
        ]
      },
      {
        heading: "Prepare evidence before contacting the provider",
        paragraphs: [
          "Keep the bill, previous bills, clear meter photographs, reading dates, and notes about access problems or meter replacement. Ask which reading was used, how the estimate was calculated, and whether you can submit a self-read where local rules permit it.",
          "Do not open electrical enclosures or touch damaged equipment. Contact the provider or a qualified professional when a meter is inaccessible or unsafe."
        ]
      },
      {
        heading: "Use the calculator as a reasonableness check",
        paragraphs: [
          "An appliance estimate cannot prove a meter error, but it can show whether the billed kWh is broadly plausible for your major loads. Treat a large unexplained gap as a reason to investigate further, not as proof of overbilling."
        ]
      }
    ],
    calculatorPrompt:
      "Enter the billed kWh and billing days, then compare daily usage with a previous period in Bill Detective.",
    sources: [
      {
        label: "Energy Made Easy: estimated energy bills",
        url: "https://www.energymadeeasy.gov.au/article/estimated-bills-overcharging-and-undercharging"
      },
      {
        label: "Energy Made Easy: how to read an electricity bill",
        url: "https://www.energymadeeasy.gov.au/article/account-summary"
      }
    ]
  },
  {
    slug: "how-to-lower-electricity-bill-without-guessing",
    title: "How to Lower Your Electricity Bill Without Guessing",
    description:
      "Use a measured, comfort-aware process to find the changes that can actually affect your household electricity costs.",
    category: "Saving electricity",
    readingTime: "9 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "Generic advice can waste effort because every home has a different climate, tariff, appliance mix, and daily routine. A better approach is to identify the largest energy drivers, verify the assumptions, and test changes that are safe, realistic, and repeatable.",
    takeaways: [
      "Start with billed kWh and the largest household loads.",
      "Prioritize hours of use before replacing working equipment.",
      "Protect health, food safety, sleep, and essential equipment.",
      "Measure the result over comparable billing periods."
    ],
    sections: [
      {
        heading: "Separate the bill from the energy use",
        paragraphs: [
          "First check whether the increase came from kWh, the rate, fixed charges, or a longer billing period. Usage changes cannot remove a fixed daily charge, and switching providers does not automatically reduce consumption.",
          "Normalize kWh by billing days, then compare similar seasons where possible."
        ]
      },
      {
        heading: "Rank the biggest loads",
        paragraphs: [
          "Cooling, heating, water heating, dryers, pumps, refrigeration, and equipment that runs continuously are often worth checking first. The exact ranking depends on your household. Estimate monthly kWh for the largest candidates before focusing on tiny standby loads.",
          "A low-watt device can still matter if it runs all day, while a high-watt device may contribute little when used for only a few minutes."
        ]
      },
      {
        heading: "Change one important assumption",
        paragraphs: [
          "Test a shorter runtime, a moderate thermostat adjustment, maintenance, scheduling, or a more efficient operating mode. Avoid unrealistic scenarios such as turning off refrigeration or compromising safe indoor temperatures.",
          "For heating and cooling, building drafts, insulation, filters, shading, room size, and weather can matter as much as the equipment label."
        ]
      },
      {
        heading: "Confirm whether the change worked",
        paragraphs: [
          "Compare daily kWh before and after the change, allowing for weather and occupancy. Provider portals, smart-meter data, or safe plug-in monitoring can shorten the feedback loop. Keep changes that improve both cost and household comfort."
        ]
      }
    ],
    calculatorPrompt:
      "Open your usage insights, identify the largest appliance, and compare one realistic reduction before changing anything else.",
    sources: [
      {
        label: "U.S. Department of Energy: why energy efficiency matters",
        url: "https://www.energy.gov/energysaver/why-energy-efficiency-matters"
      },
      {
        label: "U.S. Department of Energy: measuring standby power",
        url: "https://www.energy.gov/cmei/femp/measuring-standby-power"
      }
    ]
  },
  {
    slug: "understand-solar-electricity-bill-import-export",
    title: "How to Read a Solar Electricity Bill: Import, Export, and Credits",
    description:
      "Understand grid imports, solar exports, feed-in credits, net metering, and why a solar home can still receive an electricity bill.",
    category: "Solar and storage",
    readingTime: "8 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "A solar bill can contain at least two different energy flows: electricity bought from the grid and excess solar electricity sent back. Those kWh may have different prices. Fixed charges, tariff windows, batteries, and local credit rules can also affect the total.",
    takeaways: [
      "Do not subtract export kWh from import kWh unless the billing method does that.",
      "The export credit rate may be lower than the import rate.",
      "Self-consumed solar may never appear as purchased grid energy.",
      "Check local net-metering or feed-in rules with the provider or regulator."
    ],
    sections: [
      {
        heading: "Separate import, export, and solar generation",
        paragraphs: [
          "Import is electricity drawn from the grid. Export is excess solar sent to the grid. Total solar generation also includes electricity used immediately inside the home, which may not appear as export.",
          "A home can generate substantial solar energy and still import electricity at night, during bad weather, or when household demand exceeds generation."
        ]
      },
      {
        heading: "Understand how credits are calculated",
        paragraphs: [
          "Some programs credit each exported kWh at a feed-in rate. Others use net metering or more complex settlement rules. Eligibility, credit values, system limits, and rollover arrangements vary by location and provider.",
          "Keep import charges and export credits as separate calculations unless your tariff explicitly nets them."
        ],
        formula: "Illustrative net energy amount = import charges - export credits + fixed charges"
      },
      {
        heading: "Check time-of-use interactions",
        paragraphs: [
          "Imports during an evening peak may be expensive even when midday exports are high. A battery may shift some solar energy to later hours, but its value depends on tariff differences, usable capacity, efficiency, degradation, installation cost, and local incentives."
        ]
      },
      {
        heading: "Investigate an unexpected solar bill",
        paragraphs: [
          "Compare import and export kWh, tariff dates, meter readings, system monitoring, inverter alerts, fixed charges, and seasonal generation. Contact the installer or provider when the monitoring data and bill cannot be reconciled."
        ]
      }
    ],
    calculatorPrompt:
      "Estimate household consumption, then open Advanced electricity pricing to subtract exported grid kWh at the feed-in credit shown on your bill.",
    sources: [
      {
        label: "U.S. Department of Energy: homeowner’s guide to solar",
        url: "https://www.energy.gov/cmei/systems/homeowners-guide-solar"
      },
      {
        label: "Energy Made Easy: how plan estimates use solar exports",
        url: "https://www.energymadeeasy.gov.au/article/how-the-energy-made-easy-plan-search-works"
      }
    ]
  }
];
