export const INSIGHT_ARTICLES = [
  {
    slug: "smart-meter-display-does-not-match-electricity-bill",
    title: "Why Doesn’t My Smart Meter Display Match My Electricity Bill?",
    description:
      "Reconcile smart-meter usage, an in-home display, provider data, and the final bill by comparing the same dates, units, readings, and charges.",
    category: "Reading your bill",
    readingTime: "7 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "A smart meter, provider portal, in-home display, and electricity bill can all show different numbers without any one of them being broken. They may cover different dates, update at different times, or include different charges. Reconcile the energy first, then the money.",
    takeaways: [
      "Compare kWh over exactly the same start and end dates.",
      "Check whether the bill used actual or estimated meter readings.",
      "A display estimate may exclude fixed charges, taxes, credits, or tariff changes.",
      "Contact the provider when readings or meter identifiers cannot be reconciled."
    ],
    sections: [
      {
        heading: "Start by matching the time period",
        paragraphs: [
          "A live display may show today, this week, or a rolling month, while the bill covers a fixed billing period. Provider portals can also lag behind the physical meter. Write down the start date, end date, and time zone for each figure before comparing them.",
          "Use kWh rather than cost for the first comparison. Cost displays may use an old tariff or a simplified rate and may not know about taxes, fixed charges, or account credits."
        ]
      },
      {
        heading: "Check the reading type and meter register",
        paragraphs: [
          "Look for actual, customer, smart, or estimated beside the opening and closing readings. An estimated bill can diverge from the physical meter even when the meter itself is recording usage correctly.",
          "Time-of-use and solar meters can have several registers. Make sure you are comparing the same import register and tariff window rather than combining peak, off-peak, controlled-load, or export values incorrectly."
        ]
      },
      {
        heading: "Rebuild the usage before the price",
        paragraphs: [
          "For a simple cumulative meter, subtract the opening reading from the closing reading. Compare that result with billed kWh. Then apply each tariff rate to its matching usage and add fixed charges separately.",
          "Small differences may result from rounding or data cut-off times. Large unexplained differences need the provider’s meter and billing records."
        ],
        formula: "Usage for the period = closing meter reading - opening meter reading"
      },
      {
        heading: "Know when to escalate",
        paragraphs: [
          "Contact the provider if the bill uses the wrong meter number, an unexpected estimate, the wrong tariff register, or readings that do not follow the physical meter. Keep dated meter photographs and screenshots of the provider portal.",
          "Do not open meter enclosures or attempt electrical work. Ask the provider about its meter-test and billing-dispute process when the records remain inconsistent."
        ]
      }
    ],
    calculatorPrompt:
      "Enter the billed kWh and dates in Bill Detective, then keep fixed charges separate from the energy rate while you compare.",
    sources: [
      {
        label: "Ofgem: smart meter performance and manual readings",
        url: "https://www.ofgem.gov.uk/energy-regulation/domestic-and-non-domestic/metering/smart-meters/smart-meter-performance"
      },
      {
        label: "Energy Made Easy: estimated bills and meter readings",
        url: "https://www.energymadeeasy.gov.au/article/estimated-bills-overcharging-and-undercharging"
      }
    ]
  },
  {
    slug: "fan-vs-air-conditioner-electricity-cost",
    title: "Fan vs Air Conditioner: Which Uses More Electricity?",
    description:
      "Compare a fan and air conditioner fairly using watts, runtime, cooling purpose, climate, and the way each appliance changes comfort.",
    category: "Appliance costs",
    readingTime: "7 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "A fan and an air conditioner do different jobs. A fan moves air and can make occupants feel cooler; an air conditioner removes heat and often humidity from a space. The fan usually draws less power, but a useful comparison must include comfort, runtime, room conditions, and safe temperatures.",
    takeaways: [
      "Compare monthly kWh, not wattage alone.",
      "Fans cool people through air movement; they do not lower an empty room’s temperature.",
      "A fan may complement air conditioning when it allows a modest thermostat adjustment.",
      "Room size, humidity, insulation, equipment sizing, and maintenance affect cooling energy."
    ],
    sections: [
      {
        heading: "Compare power and running time",
        paragraphs: [
          "Find the input watts for each appliance and estimate how many hours it actually runs. Air conditioners may cycle or vary output, so rated input can be higher than the average over a mild hour and lower than demand during extreme conditions.",
          "Calculate both scenarios over the same number of days. If a fan runs much longer than the air conditioner, runtime narrows the gap even though its wattage is lower."
        ],
        formula: "Monthly kWh = watts × hours per day × days ÷ 1,000"
      },
      {
        heading: "Recognize that the cooling effect is different",
        paragraphs: [
          "Air movement helps people feel cooler but does not remove heat from the room. An air conditioner transfers heat outside and may reduce humidity. In hot or humid conditions, these are not interchangeable outcomes.",
          "Turn a fan off when nobody benefits from its airflow. Do not compromise safe indoor temperatures for people vulnerable to heat."
        ]
      },
      {
        heading: "Use both deliberately",
        paragraphs: [
          "A fan can distribute cooled air and may let some households use a slightly warmer thermostat setting while maintaining comfort. Test a small adjustment rather than assuming a universal temperature or savings percentage.",
          "Close unnecessary openings, reduce direct solar heat where practical, clean filters, and use appropriately sized equipment. These changes can matter as much as choosing a mode."
        ]
      },
      {
        heading: "Make the cost comparison honest",
        paragraphs: [
          "Use your provider rate and include time-of-use pricing if cooling occurs mainly during an expensive window. Compare realistic hours and test a range for variable-power equipment.",
          "The cheapest scenario is not automatically the best if it cannot maintain healthy, safe, or productive conditions."
        ]
      }
    ],
    calculatorPrompt:
      "Add a fan and air conditioner as separate appliances, then compare realistic daily hours instead of their label wattage alone.",
    sources: [
      {
        label: "ENERGY STAR: using ceiling fans with cooling",
        url: "https://www.energystar.gov/products/heating_cooling/keep_your_cool_and_save_your_money_summer"
      },
      {
        label: "ENERGY STAR: choosing the right room air conditioner capacity",
        url: "https://www.energystar.gov/products/room_air_conditioners"
      }
    ]
  },
  {
    slug: "why-electricity-usage-high-at-night",
    title: "Why Is My Electricity Usage High at Night?",
    description:
      "Find overnight baseload from refrigeration, water heating, standby devices, pumps, charging, cooling, heating, and scheduled equipment.",
    category: "Bill troubleshooting",
    readingTime: "7 min read",
    published: "2026-08-14",
    updated: "2026-08-14",
    intro:
      "Electricity use does not fall to zero when a household goes to sleep. Refrigeration, hot-water systems, climate control, pumps, charging, networking equipment, security devices, and standby loads can continue. The useful question is whether the overnight baseline matches what should be running.",
    takeaways: [
      "Separate normal overnight baseload from a new or abnormal increase.",
      "Check scheduled and thermostatically controlled equipment first.",
      "Use interval data over several comparable nights when available.",
      "Never switch off safety-critical equipment or investigate live wiring yourself."
    ],
    sections: [
      {
        heading: "Understand overnight baseload",
        paragraphs: [
          "Baseload is the electricity used while obvious activities are quiet. It can include refrigerators, freezers, routers, security systems, standby electronics, water heaters, aquarium equipment, medical devices, and equipment timers.",
          "A steady baseline is different from a short spike. Interval or smart-meter data can show whether usage is continuous, cyclic, or scheduled."
        ]
      },
      {
        heading: "Look for equipment that starts automatically",
        paragraphs: [
          "Storage water heating, pool pumps, electric-vehicle charging, dishwashers, laundry, battery charging, and tariff-controlled loads may start overnight. Heating and cooling can also run more than expected because of weather, thermostat settings, open windows, insulation, or maintenance issues.",
          "Compare the timing of the usage pattern with appliance timers and household routines. A matching start and stop time is a stronger clue than appliance wattage alone."
        ]
      },
      {
        heading: "Estimate the baseline cost",
        paragraphs: [
          "Use the average overnight power shown by a trusted meter or provider portal and multiply by the number of hours. If you only have appliance estimates, add the likely always-on devices and use a range for cycling equipment.",
          "Apply the correct overnight tariff. Off-peak energy can cost less per kWh, but a large amount of it can still be material."
        ],
        formula: "Overnight kWh = average overnight watts × hours ÷ 1,000"
      },
      {
        heading: "Investigate safely and methodically",
        paragraphs: [
          "Change one safe, nonessential load at a time and compare several similar nights. Plug-in meters can help with compatible appliances, but they cannot measure hard-wired circuits.",
          "Contact the provider or a qualified electrician if usage rises suddenly, the meter data does not match the bill, equipment appears faulty, or investigation would require access to a panel, fixed wiring, or meter enclosure."
        ]
      }
    ],
    calculatorPrompt:
      "Add the devices that run overnight, use their overnight hours, and check whether their combined kWh explains the provider’s interval data.",
    sources: [
      {
        label: "U.S. Department of Energy: measuring standby power",
        url: "https://www.energy.gov/cmei/femp/measuring-standby-power"
      },
      {
        label: "Ofgem: smart meters and accurate usage readings",
        url: "https://www.ofgem.gov.uk/energy-regulation/domestic-and-non-domestic/metering/smart-meters/smart-meter-performance"
      }
    ]
  }
];
