export const SPECIAL_USE_ARTICLES = [
  {
    slug: "how-much-does-it-cost-to-charge-an-ev-at-home",
    title: "How Much Does It Cost to Charge an EV at Home?",
    description: "Estimate home EV charging from distance, vehicle efficiency, charging losses, your electricity tariff, and the time of day you plug in.",
    category: "Appliance costs",
    readingTime: "8 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro: "An electric vehicle can become one of a household’s largest electricity loads, but its cost is straightforward to estimate when you separate driving demand, vehicle efficiency, charging losses, and the tariff used during charging. Charger power mainly changes speed; energy delivered and price per kWh drive the bill.",
    takeaways: [
      "Use energy drawn from the wall, not battery capacity alone.",
      "Estimate from distance and the vehicle’s kWh-per-distance rating when possible.",
      "Time-of-use prices can make charging time as important as charging speed.",
      "Electrical capacity, permits, and installation safety need qualified local advice."
    ],
    sections: [
      {
        heading: "Start with how far you drive",
        paragraphs: [
          "Find the vehicle’s energy-consumption rating, often shown as kWh per 100 km or kWh per 100 miles. Multiply it by the distance driven during the period, then allow for energy lost between the wall and battery.",
          "A full-battery calculation is useful for a road trip, but normal monthly charging is better estimated from actual distance or charging records. Most drivers do not refill an empty battery every night."
        ],
        formula: "Driving energy = distance ÷ 100 × vehicle kWh per 100 distance units"
      },
      {
        heading: "Separate charging speed from charging cost",
        paragraphs: [
          "A higher-power home charger can deliver the required energy faster, but it does not automatically mean more monthly energy. Cost rises when more kWh are delivered, the charging process is less efficient, or the electricity price is higher.",
          "Check the vehicle or charger app for wall energy when available. That figure includes charging losses and is usually more useful for bill reconciliation than battery percentage."
        ]
      },
      {
        heading: "Apply the tariff that actually runs",
        paragraphs: [
          "If the home uses time-of-use pricing, split charging kWh between peak and off-peak windows. A timer can help, but confirm that delayed charging still meets the household’s travel and safety needs.",
          "Also check whether the utility offers an EV plan, whether it adds a fixed fee, and whether unusually high demand can affect a commercial or demand-based tariff."
        ],
        formula: "Charging cost = wall kWh × electricity price for that charging window"
      },
      {
        heading: "Plan installation separately",
        paragraphs: [
          "The electricity estimate does not determine whether a circuit, switchboard, outlet, or service can safely support charging. Follow the vehicle and equipment manufacturer’s guidance and use the locally required licensed electrical professional.",
          "Ask about electrical capacity, permits, protective devices, cable location, and utility requirements before purchasing equipment or electrical upgrades."
        ]
      }
    ],
    calculatorPrompt: "Add EV charging as an appliance using charger input watts and actual charging hours, or calculate monthly wall kWh from the vehicle app and compare it with your bill.",
    sources: [
      { label: "U.S. DOE Alternative Fuels Data Center: charging electric vehicles at home", url: "https://afdc.energy.gov/fuels/electricity-charging-home" },
      { label: "U.S. DOE Alternative Fuels Data Center: electric vehicles for consumers", url: "https://afdc.energy.gov/vehicles/electric-consumers" }
    ]
  },
  {
    slug: "how-much-electricity-does-a-water-heater-use",
    title: "How Much Electricity Does a Water Heater Use?",
    description: "Estimate electric water-heating cost by separating heater type, input power, heating time, standby losses, household demand, and tariff timing.",
    category: "Appliance costs",
    readingTime: "8 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro: "Water heating can be hard to estimate because the label power is not the same as continuous power. An instantaneous heater draws heavily while water flows, a resistance tank cycles to maintain temperature, and a heat-pump water heater moves heat using a different process. Start by identifying the system before entering hours.",
    takeaways: [
      "Identify whether the system is instantaneous, storage resistance, heat pump, or solar-assisted.",
      "For short showers, convert minutes to decimal hours rather than entering one full hour.",
      "Storage systems use energy for reheating and heat loss even when nobody is showering.",
      "Efficiency labels and measured energy are better than assuming the rated element runs continuously."
    ],
    sections: [
      {
        heading: "Identify what the wattage means",
        paragraphs: [
          "On an instantaneous unit, the input rating describes power while the heating element is operating. For a ten-minute shower, use 0.167 hours—not one hour. Quantity should reflect simultaneous heaters, not the number of people who shower.",
          "On a storage unit, one or more elements cycle. Entering the element’s full wattage for 24 hours will usually overstate consumption because the thermostat switches it on and off."
        ],
        formula: "Instantaneous heater kWh = watts × minutes used ÷ 60 ÷ 1,000"
      },
      {
        heading: "Account for storage and household demand",
        paragraphs: [
          "Tank size, incoming water temperature, thermostat setting, hot-water volume, pipe and tank heat loss, and recovery after use all affect storage-system energy. Compare several ordinary days rather than one unusually busy day.",
          "If the meter or system controller provides a dedicated reading, use it to calibrate the estimate. Otherwise, use an appliance label or official product documentation and test a reasonable range."
        ]
      },
      {
        heading: "Compare technologies with efficiency measures",
        paragraphs: [
          "Uniform Energy Factor or a local equivalent is designed to compare overall water-heater efficiency; a higher value means more useful hot water per unit of energy under the test method. It is not a promise of one household’s exact cost.",
          "Heat-pump water heaters move heat from surrounding air and can use materially less electricity than standard electric resistance systems, but installation space, climate, noise, recovery mode, and upfront cost also matter."
        ]
      },
      {
        heading: "Look for safe, practical reductions",
        paragraphs: [
          "Reduce unnecessary hot-water volume, fix leaks, and use suitable efficient fixtures. Ask a qualified professional before changing temperature settings because hot-water systems must also manage scalding and microbial risks under local guidance.",
          "For time-controlled systems, confirm that changing a schedule will still provide safe and adequate hot water. Never open fixed wiring or a heater enclosure to investigate consumption."
        ]
      }
    ],
    calculatorPrompt: "Add an instantaneous heater using minutes converted to hours. For a storage or heat-pump unit, use measured daily kWh when available rather than treating label wattage as continuous.",
    sources: [
      { label: "ENERGY STAR: residential water-heater efficiency criteria", url: "https://www.energystar.gov/products/water_heaters/residential_water_heaters_key_product_criteria" },
      { label: "ENERGY STAR: heat-pump water-heater guide", url: "https://www.energystar.gov/partner-resources/residential_new/educational_resources/sup_program_guidance/heat_pump_water_heater_guide" }
    ]
  },
  {
    slug: "how-does-a-prepaid-electricity-meter-work",
    title: "How Does a Prepaid Electricity Meter Work?",
    description: "Understand prepaid electricity credit, unit prices, standing charges, debt deductions, emergency support, and what to record when credit disappears quickly.",
    category: "Reading your bill",
    readingTime: "7 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro: "A prepaid or pay-as-you-go meter converts purchased credit into electricity under a local tariff. Credit can fall even when obvious appliance use is low because the meter may also collect fixed charges, tariff adjustments, or an agreed debt amount. Rules and support vary by country and provider, so the display and provider terms matter.",
    takeaways: [
      "Record both credit and kWh, because money alone hides price and deductions.",
      "Check unit rates, standing charges, debt recovery, and tariff updates separately.",
      "Compare the same time period and similar household activity before blaming an appliance.",
      "If supply or affordability is at risk, contact the provider promptly about local support."
    ],
    sections: [
      {
        heading: "Know what the meter may deduct",
        paragraphs: [
          "Purchased credit can pay for energy units, daily or monthly fixed charges, taxes, emergency-credit repayment, and an agreed debt-recovery amount. The exact order and timing depend on the provider and local rules.",
          "Use the meter menu, receipt, app, or provider statement to find the per-kWh price and any non-energy deductions. A large top-up does not necessarily buy the same number of kWh after a price change."
        ]
      },
      {
        heading: "Measure use in kWh, not only money",
        paragraphs: [
          "Write down the meter’s kWh reading and credit at the same time each day for several representative days. Note unusual cooking, cooling, heating, charging, or visitors. This separates higher energy use from a higher tariff or fixed deduction.",
          "If the meter only shows remaining credit, ask the provider how to view total kWh, tariff information, and deduction history. Keep top-up receipts and photographs of unexplained messages or codes."
        ],
        formula: "Approximate energy-only cost = kWh used × applicable unit price"
      },
      {
        heading: "Investigate credit that falls too quickly",
        paragraphs: [
          "First compare the current unit rate and fixed charges with the provider’s published tariff. Then check whether emergency credit or debt is being repaid. Finally, estimate large loads such as water heating, space cooling, cooking, and pumps.",
          "Contact the provider when the tariff, debt amount, meter identifier, top-up, or usage record cannot be reconciled. Do not open, bypass, or alter the meter."
        ]
      },
      {
        heading: "Ask for help before supply is lost",
        paragraphs: [
          "Emergency credit, friendly-hours credit, hardship support, repayment changes, and protections for vulnerable households exist in some markets, but eligibility and rules are local. Contact the provider early and explain any health, disability, age, or access issue relevant to maintaining supply.",
          "For example, Great Britain’s regulator says suppliers must offer support when a customer cannot afford to top up and explains additional credit and affordable repayment options. Treat this as a local example, not a worldwide rule."
        ]
      }
    ],
    calculatorPrompt: "Use the calculator to estimate major appliances, then compare estimated kWh—not just money—with the prepaid meter over the same dates.",
    sources: [
      { label: "Ofgem: prepayment meter consumer guidance", url: "https://www.ofgem.gov.uk/prepayment-meters-consumer-guidance" },
      { label: "Ofgem: additional support credit expectations", url: "https://www.ofgem.gov.uk/guidance/additional-support-credit-our-expectations" }
    ]
  }
];
