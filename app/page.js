"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import { Moon, Sun, RotateCcw, Share2, Copy, BarChart3 } from "lucide-react";

const DEFAULT_APPLIANCE = {
  name: "",
  watts: "",
  quantity: 1,
  hours: "",
  days: ""
};

const LOGO_PATH = "/logo.png";

const COUNTRIES = [
  { name: "Select your country", rate: 0, currency: "", flag: "🌍", isPlaceholder: true },
  { name: "Australia", rate: 0.32, currency: "A$", flag: "🇦🇺" },
  { name: "Canada", rate: 0.17, currency: "C$", flag: "🇨🇦" },
  { name: "China", rate: 0.1, currency: "¥", flag: "🇨🇳" },
  { name: "France", rate: 0.3, currency: "€", flag: "🇫🇷" },
  { name: "Germany", rate: 0.35, currency: "€", flag: "🇩🇪" },
  { name: "India", rate: 0.09, currency: "₹", flag: "🇮🇳" },
  { name: "Italy", rate: 0.29, currency: "€", flag: "🇮🇹" },
  { name: "Japan", rate: 0.3, currency: "¥", flag: "🇯🇵" },
  { name: "New Zealand", rate: 0.33, currency: "NZ$", flag: "🇳🇿" },
  { name: "Philippines", rate: 12.77, currency: "₱", flag: "🇵🇭" },
  { name: "Singapore", rate: 0.25, currency: "S$", flag: "🇸🇬" },
  { name: "South Korea", rate: 0.22, currency: "₩", flag: "🇰🇷" },
  { name: "Spain", rate: 0.27, currency: "€", flag: "🇪🇸" },
  { name: "UAE", rate: 0.2, currency: "د.إ", flag: "🇦🇪" },
  { name: "United Kingdom", rate: 0.28, currency: "£", flag: "🇬🇧" },
  { name: "United States", rate: 0.18, currency: "$", flag: "🇺🇸" },
  { name: "Other Country", rate: 0, currency: "", flag: "🌍" }
];

const PRESETS = [
  { category: "Cooling", name: "Air-conditioning Unit", watts: 1200, hours: 8, days: 25 },
  { category: "Cooling", name: "Window Type Aircon", watts: 900, hours: 8, days: 25 },
  { category: "Cooling", name: "Split Type Aircon", watts: 1100, hours: 8, days: 25 },
  { category: "Cooling", name: "Inverter Aircon", watts: 800, hours: 8, days: 25 },
  { category: "Cooling", name: "Electric Fan", watts: 75, hours: 8, days: 30 },
  { category: "Cooling", name: "Ceiling Fan", watts: 60, hours: 8, days: 30 },
  { category: "Cooling", name: "Air Cooler", watts: 150, hours: 6, days: 25 },

  { category: "Kitchen", name: "Refrigerator", watts: 150, hours: 24, days: 30 },
  { category: "Kitchen", name: "Freezer", watts: 250, hours: 24, days: 30 },
  { category: "Kitchen", name: "Microwave", watts: 1200, hours: 0.25, days: 15 },
  { category: "Kitchen", name: "Oven", watts: 2000, hours: 1, days: 8 },
  { category: "Kitchen", name: "Electric Stove", watts: 2000, hours: 1, days: 20 },
  { category: "Kitchen", name: "Electric Range", watts: 2500, hours: 1, days: 20 },
  { category: "Kitchen", name: "Induction Cooker", watts: 1800, hours: 1, days: 20 },
  { category: "Kitchen", name: "Rice Cooker", watts: 700, hours: 1, days: 30 },
  { category: "Kitchen", name: "Air Fryer", watts: 1400, hours: 0.5, days: 12 },
  { category: "Kitchen", name: "Electric Kettle", watts: 1500, hours: 0.25, days: 30 },
  { category: "Kitchen", name: "Coffee Maker", watts: 900, hours: 0.25, days: 25 },
  { category: "Kitchen", name: "Blender", watts: 400, hours: 0.1, days: 12 },
  { category: "Kitchen", name: "Toaster", watts: 800, hours: 0.1, days: 20 },
  { category: "Kitchen", name: "Rangehood", watts: 200, hours: 1, days: 20 },
  { category: "Kitchen", name: "Dishwasher", watts: 1500, hours: 1, days: 12 },

  { category: "Laundry", name: "Washing Machine", watts: 500, hours: 1, days: 12 },
  { category: "Laundry", name: "Dryer", watts: 3000, hours: 1, days: 8 },
  { category: "Laundry", name: "Spin Dryer", watts: 300, hours: 0.5, days: 12 },
  { category: "Laundry", name: "Flat Iron / Steam Iron", watts: 1000, hours: 1, days: 4 },
  { category: "Laundry", name: "Steamer", watts: 800, hours: 0.5, days: 8 },

  { category: "Electronics", name: "Television", watts: 100, hours: 5, days: 30 },
  { category: "Electronics", name: "LED TV", watts: 80, hours: 5, days: 30 },
  { category: "Electronics", name: "Smart TV", watts: 120, hours: 5, days: 30 },
  { category: "Electronics", name: "Laptop", watts: 65, hours: 8, days: 25 },
  { category: "Electronics", name: "Desktop Computer", watts: 300, hours: 8, days: 25 },
  { category: "Electronics", name: "Gaming PC", watts: 500, hours: 5, days: 20 },
  { category: "Electronics", name: "Monitor", watts: 40, hours: 8, days: 25 },
  { category: "Electronics", name: "Printer", watts: 50, hours: 0.5, days: 10 },
  { category: "Electronics", name: "Phone Charger", watts: 10, hours: 3, days: 30 },
  { category: "Electronics", name: "Tablet Charger", watts: 15, hours: 3, days: 30 },
  { category: "Electronics", name: "Game Console", watts: 150, hours: 3, days: 20 },
  { category: "Electronics", name: "Speaker", watts: 50, hours: 3, days: 20 },

  { category: "Internet", name: "Router", watts: 10, hours: 24, days: 30 },
  { category: "Internet", name: "Modem", watts: 10, hours: 24, days: 30 },
  { category: "Internet", name: "WiFi Mesh", watts: 15, hours: 24, days: 30 },
  { category: "Internet", name: "CCTV Camera", watts: 10, hours: 24, days: 30 },

  { category: "Lighting", name: "LED Bulb", watts: 10, hours: 6, days: 30 },
  { category: "Lighting", name: "Lighting", watts: 60, hours: 6, days: 30 },
  { category: "Lighting", name: "Fluorescent Light", watts: 40, hours: 6, days: 30 },
  { category: "Lighting", name: "Outdoor Light", watts: 50, hours: 10, days: 30 },
  { category: "Lighting", name: "Christmas Lights", watts: 80, hours: 6, days: 20 },

  { category: "Bathroom", name: "Water Heater", watts: 1500, hours: 1, days: 20 },
  { category: "Bathroom", name: "Hair Dryer / Blower", watts: 1000, hours: 0.25, days: 12 },
  { category: "Bathroom", name: "Exhaust Fan", watts: 40, hours: 3, days: 30 },

  { category: "Cleaning", name: "Vacuum Cleaner", watts: 1000, hours: 0.5, days: 8 },
  { category: "Cleaning", name: "Pressure Washer", watts: 1500, hours: 1, days: 4 },
  { category: "Cleaning", name: "Robot Vacuum", watts: 60, hours: 2, days: 20 },

  { category: "Other", name: "Water Pump", watts: 750, hours: 1, days: 20 },
  { category: "Other", name: "Aquarium Pump", watts: 20, hours: 24, days: 30 },
  { category: "Other", name: "Aquarium Heater", watts: 100, hours: 8, days: 30 },
  { category: "Other", name: "Sewing Machine", watts: 100, hours: 2, days: 12 }
];

function getWattageGuide(applianceName = "", category = "") {
  const name = applianceName.toLowerCase();
  const type = category.toLowerCase();

  if (name.includes("aircon") || name.includes("air-conditioning")) {
    return "Typical aircon wattage varies a lot: small inverter units may average around 600W–1000W, while larger or non-inverter units can be 1200W–2500W+. Check the nameplate or model for best accuracy.";
  }

  if (name.includes("refrigerator") || name.includes("freezer")) {
    return "Refrigerators and freezers cycle on and off. Check the energy label, nameplate, or model number. Typical listed running wattage can range from 100W–400W.";
  }

  if (name.includes("tv") || name.includes("television")) {
    return "TV wattage depends on size and type. Typical ranges: 32 inch LED 30W–55W, 43 inch 60W–100W, 55 inch 80W–150W, large OLED/older TVs can be higher.";
  }

  if (name.includes("desktop") || name.includes("gaming pc")) {
    return "Computer wattage depends on workload. Office PCs may use 100W–250W, while gaming PCs can use 300W–700W+ during gaming.";
  }

  if (name.includes("laptop")) {
    return "Laptop chargers usually show wattage on the adapter. Common ranges: 45W–100W for regular laptops, 120W–240W for gaming or workstation laptops.";
  }

  if (name.includes("led bulb") || name.includes("lighting") || type.includes("lighting")) {
    return "Bulb wattage is usually printed on the bulb or box. LED bulbs are commonly 5W–15W each. Use quantity for multiple bulbs.";
  }

  if (name.includes("charger")) {
    return "Phone and tablet chargers usually show output watts on the adapter. Common phone chargers range from 5W–30W, fast chargers can be higher.";
  }

  if (name.includes("router") || name.includes("modem") || name.includes("wifi")) {
    return "Routers and modems are usually low power. Check the adapter label. Typical range is around 8W–20W each.";
  }

  if (name.includes("washing")) {
    return "Washing machine wattage varies by cycle. Check the label or manual. Typical running wattage can range from 400W–1000W.";
  }

  if (name.includes("dryer")) {
    return "Dryers are usually high-consumption appliances. Check the rating label. Electric dryers can commonly range from 2000W–5000W.";
  }

  if (name.includes("kettle") || name.includes("oven") || name.includes("microwave") || name.includes("induction") || name.includes("stove") || name.includes("range")) {
    return "Kitchen heating appliances are usually high wattage. Check the label or manual. Common range is around 1000W–2500W+ depending on appliance.";
  }

  return "For the most accurate estimate, use the actual wattage printed on the appliance sticker, power adapter, user manual, or official product page.";
}


function getApplianceInsight(applianceName = "", category = "") {
  const name = applianceName.toLowerCase();
  const type = category.toLowerCase();

  if (name.includes("aircon") || name.includes("air-conditioning")) {
    return "Air-conditioning usually drives the bill the most. For a better estimate, check if it is inverter or non-inverter, confirm the HP size, and use the actual rated or average wattage from the unit label.";
  }

  if (name.includes("refrigerator") || name.includes("freezer")) {
    return "Refrigerators run all day but cycle on and off. If the estimate feels high, check the energy label or model page instead of relying only on running watts.";
  }

  if (name.includes("tv") || name.includes("television")) {
    return "TV wattage changes by size and panel type. A 32-inch LED TV can be far lower than a 55-inch Smart TV or OLED TV, so searching the exact model can improve accuracy.";
  }

  if (name.includes("desktop") || name.includes("gaming pc")) {
    return "Computers vary a lot. Office use may be moderate, while gaming or rendering can use much more power. Use the power supply only as a maximum, not always the actual usage.";
  }

  if (name.includes("dryer") || name.includes("kettle") || name.includes("oven") || name.includes("microwave") || name.includes("induction") || name.includes("stove") || name.includes("range")) {
    return "This is a high-wattage appliance. Even short use can add up quickly, so accurate hours and days matter more here.";
  }

  if (name.includes("led bulb") || name.includes("lighting") || type.includes("lighting")) {
    return "Lighting is usually easy to estimate. Use the quantity field for multiple bulbs, then enter the wattage printed on one bulb.";
  }

  return "For a more accurate estimate, update the wattage using the appliance label, adapter, manual, or official product page.";
}


const INFO_SECTIONS = [
  {
    id: "about",
    title: "About Watts My Bill?",
    description:
      "Watts My Bill? is a free electricity usage calculator that helps users estimate monthly electricity costs based on appliance wattage, quantity, usage hours, days used, and electricity rate. It is built to help everyday users better understand how appliances may contribute to their bill."
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description:
      "Watts My Bill? currently stores your calculator inputs locally in your browser using localStorage so your session can be restored when you revisit the page. This data stays on your device and is not sent to our server by this calculator. If ads, analytics, or other third-party services are added in the future, this policy should be updated to explain how those services may use cookies or similar technologies."
  },
  {
    id: "terms",
    title: "Terms of Use",
    description:
      "By using Watts My Bill?, you understand that the tool provides estimates for educational and personal budgeting purposes only. You are responsible for checking your actual utility bill, provider rates, and appliance information before making financial or household decisions."
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    description:
      "Watts My Bill? is not an electricity provider and is not affiliated with any utility company. Results are estimates only. Actual electric bills may include generation charges, transmission, distribution, service fees, VAT, taxes, fuel adjustments, demand charges, and other provider-specific charges."
  },
  {
    id: "contact",
    title: "Contact",
    description:
      "For questions, feedback, corrections, or suggestions, you can contact the creator of Watts My Bill? through the official contact details or social links that will be added to this project. Please do not send sensitive billing information unless you are comfortable sharing it."
  }
];



function loadImageAsDataUrl(src) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);

        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height
        });
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
}


function Logo({ darkMode = false }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="w-[48px] h-[48px] md:w-[56px] md:h-[56px] flex items-center justify-center overflow-hidden shrink-0">
        {logoFailed ? (
          <span aria-hidden="true" className="text-3xl">💡</span>
        ) : (
          <img
            src={LOGO_PATH}
            alt="Watts My Bill? logo"
            className="w-full h-full object-contain scale-[1.02]"
            onError={() => setLogoFailed(true)}
          />
        )}
      </div>

      <div className="min-w-0">
        <div className={`font-extrabold text-[1.6rem] min-[390px]:text-[1.7rem] sm:text-[2rem] md:text-[2.25rem] tracking-tight leading-none drop-shadow-none ${darkMode ? "text-white" : "text-gray-950"}`}>
          Watts My Bill?
        </div>

        <div className={`text-xs md:text-sm mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Electricity usage calculator
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [actualBill, setActualBill] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customCountryName, setCustomCountryName] = useState("");
  const [customCurrency, setCustomCurrency] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportAddress, setReportAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showDonate, setShowDonate] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [showWattageHelp, setShowWattageHelp] = useState(false);
  const [showEstimateHelp, setShowEstimateHelp] = useState(false);
  const [activeInfoPage, setActiveInfoPage] = useState(null);
  const [addedToast, setAddedToast] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const applianceSectionRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const highlightTimerRef = useRef(null);

  const [appliances, setAppliances] = useState([DEFAULT_APPLIANCE]);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem("watts-my-bill-data");

      if (savedData) {
        const parsed = JSON.parse(savedData);

        const restoredAppliances = parsed.appliances?.length
          ? parsed.appliances.map((item) => ({
              ...DEFAULT_APPLIANCE,
              ...item,
              quantity: item.quantity || 1
            }))
          : [DEFAULT_APPLIANCE];

        setAppliances(restoredAppliances);
        setActualBill(parsed.actualBill || "");
        setCustomRate(parsed.customRate || "");
        setCustomCountryName(parsed.customCountryName || "");
        setCustomCurrency(parsed.customCurrency || "");
        setReportName(parsed.reportName || "");
        setReportAddress(parsed.reportAddress || "");
        setDarkMode(parsed.darkMode || false);
        setSearchTerm(parsed.searchTerm || "");
        setSelectedCategory(parsed.selectedCategory || "All");
        setShowAllPresets(parsed.showAllPresets || false);
        setShowWattageHelp(parsed.showWattageHelp || false);
        setShowEstimateHelp(parsed.showEstimateHelp || false);

        if (parsed.country?.name) {
          const foundCountry = COUNTRIES.find(
            (c) => c.name === parsed.country.name
          );

          if (foundCountry) {
            setCountry(foundCountry);
          }
        }
      }
    } catch {
      localStorage.removeItem("watts-my-bill-data");
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    localStorage.setItem(
      "watts-my-bill-data",
      JSON.stringify({
        appliances,
        actualBill,
        customRate,
        customCountryName,
        customCurrency,
        reportName,
        reportAddress,
        darkMode,
        country,
        searchTerm,
        selectedCategory,
        showAllPresets,
        showWattageHelp,
        showEstimateHelp
      })
    );
  }, [
    hasLoaded,
    appliances,
    actualBill,
    customRate,
    customCountryName,
    customCurrency,
    reportName,
    reportAddress,
    darkMode,
    country,
    searchTerm,
    selectedCategory,
    showAllPresets,
    showWattageHelp,
    showEstimateHelp
  ]);

  const categories = ["All", ...new Set(PRESETS.map((item) => item.category))];

  const filteredPresets = PRESETS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const visiblePresets = showAllPresets
    ? filteredPresets
    : filteredPresets.slice(0, 10);

  const isOtherCountry = country.name === "Other Country";
  const activeRate = customRate ? Number(customRate) : country.rate;

  const displayCountry = isOtherCountry
    ? customCountryName || "Other Country"
    : country.name;

  const displayCurrency = isOtherCountry
    ? customCurrency || ""
    : country.currency;

  const showAddedFeedback = (name, index) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    setAddedToast(`✅ ${name || "Appliance"} added`);
    setHighlightedIndex(index);

    feedbackTimerRef.current = setTimeout(() => {
      setAddedToast("");
    }, 2200);

    highlightTimerRef.current = setTimeout(() => {
      setHighlightedIndex(null);
    }, 1600);
  };

  const clearAll = () => {
    const confirmed = window.confirm(
      "Clear all saved inputs and start over?"
    );

    if (!confirmed) return;

    localStorage.removeItem("watts-my-bill-data");
    setCountry(COUNTRIES[0]);
    setActualBill("");
    setCustomRate("");
    setCustomCountryName("");
    setCustomCurrency("");
    setReportName("");
    setReportAddress("");
    setSearchTerm("");
    setSelectedCategory("All");
    setShowDonate(false);
    setShowAllPresets(false);
    setShowWattageHelp(false);
    setShowEstimateHelp(false);
    setActiveInfoPage(null);
    setAddedToast("");
    setHighlightedIndex(null);
    setAppliances([{ ...DEFAULT_APPLIANCE }]);
  };

  const addAppliance = () => {
    const newAppliances = [
      ...appliances,
      { ...DEFAULT_APPLIANCE }
    ];

    setAppliances(newAppliances);
    showAddedFeedback("Blank appliance", newAppliances.length - 1);
  };

  const addPreset = (preset) => {
    const newAppliances = [
      ...appliances,
      {
        name: preset.name,
        category: preset.category,
        watts: preset.watts,
        quantity: 1,
        hours: preset.hours,
        days: preset.days,
        wattageGuide: preset.wattageGuide || getWattageGuide(preset.name, preset.category)
      }
    ];

    setAppliances(newAppliances);
    showAddedFeedback(preset.name, newAppliances.length - 1);
  };

  const updateAppliance = (i, field, value) => {
    const copy = [...appliances];
    copy[i][field] = value;
    setAppliances(copy);
  };

  const removeAppliance = (index) => {
    if (appliances.length === 1) {
      setAppliances([{ ...DEFAULT_APPLIANCE }]);
      return;
    }

    setAppliances(appliances.filter((_, i) => i !== index));
  };

  const breakdown = useMemo(() => {
    return appliances.map((a) => {
      const watts = Number(a.watts || 0);
      const quantity = Number(a.quantity || 1);
      const hours = Number(a.hours || 0);
      const days = Number(a.days || 0);

      const kwh = (watts * quantity * hours * days) / 1000;
      const cost = kwh * activeRate;

      return { ...a, quantity, kwh, cost };
    });
  }, [appliances, activeRate]);

  const totalKwh = breakdown.reduce((s, i) => s + i.kwh, 0);
  const total = breakdown.reduce((s, i) => s + i.cost, 0);
  const difference = actualBill ? Number(actualBill) - total : 0;

  const topAppliance = [...breakdown]
    .filter((item) => item.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)[0];

  const topAppliances = [...breakdown]
    .filter((item) => item.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, 5);

  const dailyAverage = total / 30;

  const possibleSavings = topAppliance
    ? ((Number(topAppliance.watts || 0) *
        Number(topAppliance.quantity || 1) *
        1 *
        Number(topAppliance.days || 0)) /
        1000) *
      activeRate
    : 0;

  const topApplianceShare =
    topAppliance && totalKwh > 0 ? (topAppliance.kwh / totalKwh) * 100 : 0;

  const applianceInsight = topAppliance
    ? getApplianceInsight(topAppliance.name, topAppliance.category)
    : "";

  const billComparisonInsight = Number(actualBill) > 0
    ? difference > 0
      ? `Your entered bill is ${displayCurrency}${Math.abs(difference).toFixed(
          2
        )} higher than this estimate. That gap may come from taxes, provider charges, appliances not listed yet, or wattages that are lower than actual.`
      : `Your estimate is ${displayCurrency}${Math.abs(difference).toFixed(
          2
        )} higher than your entered bill. Check if some wattages, hours, or days are too high.`
    : "Add your actual bill to compare it with this estimate.";

  const auditMessage = topAppliance
    ? `${topAppliance.name} is your top estimated energy user at ${topAppliance.kwh.toFixed(
        2
      )} kWh, about ${topApplianceShare.toFixed(
        0
      )}% of your listed usage. Reducing its use by 1 hour per day may save around ${displayCurrency}${possibleSavings.toFixed(
        2
      )} per month. ${applianceInsight}`
    : "Add appliance details to generate an energy audit insight.";

  const buildShareText = () => {
    const estimatedBill = `${displayCurrency}${Number(total).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    const topUsage = topAppliance?.name
      ? ` Highest usage: ${topAppliance.name}.`
      : "";

    return `I estimated my monthly electricity bill using Watts My Bill?: ${estimatedBill}. Total usage: ${totalKwh.toFixed(
      2
    )} kWh.${topUsage}`;
  };

  const copyEstimateLink = async () => {
    const link = typeof window !== "undefined" ? window.location.href : "https://wattsmybill.app";
    const textToCopy = `${buildShareText()}\n${link}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
      alert("Could not copy the estimate. Please copy the website link manually.");
    }
  };

  const shareEstimate = async () => {
    const link = typeof window !== "undefined" ? window.location.href : "https://wattsmybill.app";
    const shareData = {
      title: "Watts My Bill?",
      text: buildShareText(),
      url: link
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        return;
      }
    } else {
      await copyEstimateLink();
    }
  };

  const activeInfoSection = INFO_SECTIONS.find(
    (section) => section.id === activeInfoPage
  );

  const downloadPDF = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 25.4;
      const contentWidth = pageWidth - margin * 2;

      let y = margin;
      let pageNumber = 1;
      const logoImage = await loadImageAsDataUrl(LOGO_PATH);

      const currencyMap = {
        "₱": "PHP ",
        "$": "USD ",
        "£": "GBP ",
        "€": "EUR ",
        "₹": "INR ",
        "A$": "AUD ",
        "C$": "CAD ",
        "NZ$": "NZD ",
        "S$": "SGD ",
        "¥": "JPY ",
        "₩": "KRW ",
        "د.إ": "AED "
      };

      const pdfCurrency = currencyMap[displayCurrency] || displayCurrency || "";

      const cleanText = (value) =>
        String(value || "")
          .replace(/₱/g, "PHP ")
          .replace(/₹/g, "INR ")
          .replace(/₩/g, "KRW ")
          .replace(/¥/g, "JPY ")
          .replace(/€/g, "EUR ")
          .replace(/£/g, "GBP ")
          .replace(/د.إ/g, "AED ")
          .replace(/[^\x20-\x7E]/g, "")
          .replace(/\s+/g, " ")
          .trim();

      const money = (value) =>
        `${pdfCurrency}${Number(value || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;

      const writeWrappedText = (text, x, startY, maxWidth, lineHeight = 5.2) => {
        const lines = doc.splitTextToSize(cleanText(text), maxWidth);
        doc.text(lines, x, startY);
        return startY + lines.length * lineHeight;
      };

      const writeJustifiedText = (text, x, startY, maxWidth, lineHeight = 5.2) => {
        const lines = doc.splitTextToSize(cleanText(text), maxWidth);
        doc.text(lines, x, startY, {
          maxWidth,
          align: "left"
        });

        return startY + lines.length * lineHeight;
      };

      const footer = () => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.25);
        doc.line(
          margin,
          pageHeight - margin + 5,
          pageWidth - margin,
          pageHeight - margin + 5
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);

        doc.text(
          "Estimates only. This report does not replace your official utility bill.",
          margin,
          pageHeight - margin + 11
        );

        doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - margin + 11, {
          align: "right"
        });
      };

      const checkPage = (needed = 20) => {
        if (y + needed > pageHeight - margin - 8) {
          footer();
          doc.addPage();
          pageNumber += 1;
          y = margin;
        }
      };

      const sectionTitle = (title, rightText = "") => {
        checkPage(18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(25, 25, 25);
        doc.text(title, margin, y);

        if (rightText) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(90, 90, 90);
          doc.text(rightText, pageWidth - margin, y, { align: "right" });
        }

        y += 5.5;

        doc.setDrawColor(5, 150, 105);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);

        y += 9;
      };

      const now = new Date();

      const formattedDate = now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });

      const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      });

      const generatedLabel = `Generated on ${formattedDate} at ${formattedTime}`;

      const headerTop = y;
      const logoBoxSize = 13;
      const headerTextX = logoImage?.dataUrl ? margin + 16 : margin;

      if (logoImage?.dataUrl) {
        const logoRatio = logoImage.width / logoImage.height;
        const logoWidth = logoRatio >= 1 ? logoBoxSize : logoBoxSize * logoRatio;
        const logoHeight = logoRatio >= 1 ? logoBoxSize / logoRatio : logoBoxSize;
        const logoX = margin + (logoBoxSize - logoWidth) / 2;
        const logoY = headerTop + 1.5;

        doc.addImage(logoImage.dataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text("Watts My Bill?", headerTextX, headerTop + 7.2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(90, 90, 90);
      doc.text("Energy Audit Report", headerTextX, headerTop + 11.8);

      y += 26;

      sectionTitle("Report Details", generatedLabel);

      const detailLines = [
        ...(reportName ? [["Name", cleanText(reportName)]] : []),
        ...(reportAddress ? [["Address", cleanText(reportAddress)]] : []),
        ["Country", cleanText(displayCountry)],
        [
          "Rate Used",
          `${pdfCurrency}${Number(activeRate || 0).toLocaleString(undefined, {
            maximumFractionDigits: 4
          })}/kWh`
        ]
      ];

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      detailLines.forEach(([label, value]) => {
        checkPage(10);

        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, margin, y);

        doc.setFont("helvetica", "normal");
        y = writeWrappedText(value, margin + 48, y, contentWidth - 48, 5);

        y += 1.8;
      });

      y += 8;

      sectionTitle("Summary");

      const summaryLines = [
        ["Estimated Monthly Bill", money(total)],
        ["Total Consumption", `${totalKwh.toFixed(2)} kWh`],
        ["Estimated Daily Average", `${money(dailyAverage)} / day`],
        ["Highest Usage Appliance", topAppliance?.name || "Not available"]
      ];

      if (Number(actualBill) > 0) {
        summaryLines.push(["Current Monthly Bill Entered", money(Number(actualBill))]);
        summaryLines.push(["Estimated Difference", money(Math.abs(difference))]);
      }

      summaryLines.forEach(([label, value]) => {
        checkPage(9);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`${label}:`, margin, y);

        doc.setFont("helvetica", "normal");
        y = writeWrappedText(value, margin + 74, y, contentWidth - 74, 5);

        y += 1.8;
      });

      y += 10;

      sectionTitle("Energy Insight");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(70, 70, 70);
      y = writeJustifiedText(auditMessage, margin, y, contentWidth, 5.2);

      y += 9;

      sectionTitle("Appliance Breakdown");

      const validRows = breakdown.filter(
        (item) => item.name || item.kwh > 0 || item.cost > 0
      );

      const tableX = margin;
      const col = {
        appliance: tableX,
        qty: tableX + 48,
        watts: tableX + 63,
        hours: tableX + 83,
        days: tableX + 103,
        kwh: tableX + 123,
        cost: tableX + 143
      };

      const tableHeader = () => {
        checkPage(14);

        doc.setFillColor(245, 247, 250);
        doc.rect(tableX, y - 5, contentWidth, 9, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(45, 45, 45);

        doc.text("Appliance", col.appliance + 1, y);
        doc.text("Qty", col.qty, y);
        doc.text("Watts", col.watts, y);
        doc.text("Hours", col.hours, y);
        doc.text("Days", col.days, y);
        doc.text("kWh", col.kwh, y);
        doc.text("Cost", col.cost, y);

        y += 8;
      };

      tableHeader();

      if (validRows.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("No appliance data entered.", tableX + 1, y);
        y += 8;
      } else {
        validRows.forEach((item) => {
          checkPage(12);

          doc.setDrawColor(230, 230, 230);
          doc.line(tableX, y + 2, pageWidth - margin, y + 2);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(50, 50, 50);

          const applianceName = cleanText(item.name || "Unnamed");
          const applianceLines = doc.splitTextToSize(applianceName, 43);
          const rowHeight = Math.max(8, applianceLines.length * 4.5);

          doc.text(applianceLines, col.appliance + 1, y);
          doc.text(String(item.quantity || 1), col.qty, y);
          doc.text(String(item.watts || 0), col.watts, y);
          doc.text(String(item.hours || 0), col.hours, y);
          doc.text(String(item.days || 0), col.days, y);
          doc.text(item.kwh.toFixed(2), col.kwh, y);
          doc.text(money(item.cost), col.cost, y);

          y += rowHeight;
        });
      }

      y += 10;

      sectionTitle("Important Note");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);

      writeWrappedText(
        "This report is for estimation and educational purposes only. Actual electric bills may include taxes, generation charges, transmission, distribution, service fees, VAT, and provider-specific adjustments.",
        margin,
        y,
        contentWidth,
        5
      );

      footer();

      doc.save("watts-my-bill-energy-audit-report.pdf");
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Sorry, the report could not be downloaded. Please refresh the page and try again.");
    }
  };

  const theme = darkMode
    ? "bg-[#101826] text-white"
    : "bg-gray-50 text-gray-900";

  return (
    <div className={`min-h-screen p-4 md:p-6 transition ${theme}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start gap-3 md:gap-4 mb-4">
          <Logo darkMode={darkMode} />

          <div className="flex flex-row items-center gap-2 shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Light Mode" : "Dark Mode"}
              className="w-10 h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center shrink-0 shadow-sm"
            >
              {darkMode ? (
                <Sun size={18} strokeWidth={2.3} />
              ) : (
                <Moon size={18} strokeWidth={2.3} />
              )}
            </button>

            <button
              onClick={clearAll}
              title="Reset calculator"
              className="w-10 h-10 rounded-xl bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition shadow-sm flex items-center justify-center shrink-0"
            >
              <RotateCcw size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="mb-6 p-5 rounded-3xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#2DD4BF] text-white shadow-xl">
          <h2 className="text-3xl font-black leading-tight">
            {displayCurrency}
            {Number(total).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </h2>

          <p className="mt-1 opacity-90">
            Estimated monthly electricity bill
          </p>

          <div className="mt-4 grid md:grid-cols-4 gap-3">
            <div className="bg-white/20 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Total Usage</p>
              <p className="font-bold">⚡ {totalKwh.toFixed(2)} kWh</p>
            </div>

            <div className="bg-white/20 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Country</p>
              <p className="font-bold">
                {country.flag} {displayCountry}
              </p>
            </div>

            <div className="bg-white/20 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Rate Used</p>
              <p className="font-bold">
                {displayCurrency}
                {activeRate || 0}/kWh
              </p>
            </div>

            <div className="bg-white/20 px-4 py-2.5 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Daily Average</p>
              <p className="font-bold">
                {displayCurrency}
                {Number(dailyAverage).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}/day
              </p>
            </div>
          </div>

          {topAppliance?.name && (
            <div className="mt-3 bg-white/20 px-4 py-2.5 rounded-2xl backdrop-blur-sm inline-block">
              🔥 Highest usage: {topAppliance.name}
            </div>
          )}

          <div className="mt-3">
            <button
              onClick={() => setShowEstimateHelp(!showEstimateHelp)}
              className="text-xs underline underline-offset-4 opacity-90 hover:opacity-100"
            >
              {showEstimateHelp ? "Hide estimate note" : "Why is this only an estimate?"}
            </button>

            {showEstimateHelp && (
              <p className="text-xs opacity-80 mt-2 max-w-3xl">
                Actual electric bills may include generation, transmission,
                distribution, service fees, VAT, taxes, and provider-specific
                adjustments that are not included in a simple appliance estimate.
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <select
            className="p-4 rounded-2xl border border-gray-200 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
            value={country.name}
            onChange={(e) => {
              setCountry(
                COUNTRIES.find((c) => c.name === e.target.value) ||
                  COUNTRIES[0]
              );
              setCustomRate("");
              setCustomCountryName("");
              setCustomCurrency("");
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {`${c.flag} ${c.name}`}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="p-4 rounded-2xl border border-gray-200 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
            placeholder="Enter your current monthly bill"
            value={actualBill}
            onChange={(e) => setActualBill(e.target.value)}
          />

          <div>
            <input
              type="number"
              className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder={`Electricity provider rate per kWh (${displayCurrency || "currency"})`}
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
            />
            <p className="text-xs opacity-60 mt-2 px-1">
              Optional. Enter the rate from your electricity provider for a more
              accurate estimate. If left blank, we’ll use the average rate for
              your selected country.
            </p>
          </div>
        </div>

        {isOtherCountry && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              className="p-4 rounded-2xl border border-gray-200 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Your country name"
              value={customCountryName}
              onChange={(e) => setCustomCountryName(e.target.value)}
            />

            <input
              type="text"
              className="p-4 rounded-2xl border border-gray-200 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Currency symbol, e.g. ₱, $, €, RM"
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value)}
            />
          </div>
        )}

        {Number(actualBill) > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-white text-black shadow">
            <div className="flex justify-between items-center">
              <span className="font-medium">Bill Difference</span>

              <span
                className={`font-bold text-lg ${
                  difference > 0 ? "text-red-500" : "text-emerald-600"
                }`}
              >
                {displayCurrency}
                {Number(Math.abs(difference)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>

            <p className="text-xs opacity-60 mt-2">
              This is only a comparison between your entered bill and the
              estimated calculation.
            </p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-lg">Quick Add Appliances</h2>

              <button
                onClick={() => setShowWattageHelp(!showWattageHelp)}
                className="text-xs text-emerald-700 font-semibold mt-2 hover:underline"
              >
                {showWattageHelp ? "Hide wattage help" : "Need help finding wattage?"}
              </button>

              {showWattageHelp && (
                <p className="text-xs opacity-60 mt-2 max-w-xl">
                  Check the appliance sticker, power adapter, user manual, or
                  search the exact appliance model online. Using the actual
                  wattage gives a better estimate than using generic presets.
                </p>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                type="text"
                className="p-3 rounded-2xl border border-gray-200 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                placeholder="Search appliance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="p-3 rounded-2xl border border-gray-200 bg-white text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {visiblePresets.map((p) => (
              <button
                key={`${p.category}-${p.name}`}
                onClick={() => addPreset(p)}
                className="px-4 py-1.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-black text-sm transition shadow-sm"
                title={`${p.category} • ${p.watts}W • ${p.hours}h/day • ${p.days} days`}
              >
                + {p.name}
              </button>
            ))}
          </div>

          {filteredPresets.length > 10 && (
            <button
              onClick={() => setShowAllPresets(!showAllPresets)}
              className="mt-4 px-4 py-2 rounded-2xl bg-gray-200 hover:bg-gray-300 text-sm font-medium transition"
            >
              {showAllPresets
                ? "Show Less Appliances"
                : `Show More Appliances (${filteredPresets.length - 10}+ more)`}
            </button>
          )}

          {filteredPresets.length === 0 && (
            <p className="text-sm opacity-60 mt-3">
              No appliance found. You can still add it manually below.
            </p>
          )}
        </div>

        <div className="hidden md:grid md:grid-cols-5 gap-3 px-2 mb-2">
          <div className="text-sm font-semibold opacity-70">Appliance</div>
          <div className="text-sm font-semibold opacity-70">Quantity</div>
          <div className="text-sm font-semibold opacity-70">Wattage (W)</div>
          <div className="text-sm font-semibold opacity-70">Hours / Day</div>
          <div className="text-sm font-semibold opacity-70">Days of Use</div>
        </div>

        <div ref={applianceSectionRef} className="space-y-4 scroll-mt-24">
          {breakdown.map((item, i) => {
            const wattageGuide = item.name
              ? item.wattageGuide || getWattageGuide(item.name, item.category)
              : "";

            return (
              <div
                key={i}
                className={`p-5 rounded-3xl text-black shadow-lg relative transition-all duration-500 ${
                  highlightedIndex === i
                    ? "bg-emerald-50 ring-2 ring-emerald-400 shadow-2xl"
                    : "bg-white"
                }`}
              >
              <button
                onClick={() => removeAppliance(i)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition"
                title="Remove appliance"
              >
                ×
              </button>

              <div className="grid md:grid-cols-5 gap-3 pr-10">
                <input
                  className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  placeholder="Appliance"
                  value={item.name}
                  onChange={(e) =>
                    updateAppliance(i, "name", e.target.value)
                  }
                />

                <input
                  className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    updateAppliance(i, "quantity", e.target.value)
                  }
                />

                <input
                  className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  type="number"
                  placeholder="W"
                  value={item.watts}
                  onChange={(e) =>
                    updateAppliance(i, "watts", e.target.value)
                  }
                />

                <input
                  className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  type="number"
                  placeholder="Hours"
                  value={item.hours}
                  onChange={(e) =>
                    updateAppliance(i, "hours", e.target.value)
                  }
                />

                <input
                  className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  type="number"
                  placeholder="Days"
                  value={item.days}
                  onChange={(e) =>
                    updateAppliance(i, "days", e.target.value)
                  }
                />
              </div>

              {item.name && (
                <details className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                  <summary className="cursor-pointer text-xs font-semibold text-emerald-800">
                    Need wattage guidance for this appliance?
                  </summary>

                  <p className="mt-2 text-xs leading-relaxed text-gray-700">
                    💡 {wattageGuide}
                  </p>

                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `${item.name} wattage`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    🔎 Search actual wattage for “{item.name}”
                  </a>
                </details>
              )}

              <div className="mt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-60">Consumption</p>

                  <h3 className="font-bold text-lg">
                    {item.kwh.toFixed(2)} kWh
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-sm opacity-60">Estimated Cost</p>

                  <h3 className="font-black text-2xl text-emerald-600">
                    {displayCurrency}
                    {Number(item.cost).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </h3>
                </div>
              </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 mb-6 p-5 rounded-3xl bg-white text-black shadow-lg">
          <p className="text-sm opacity-60 mb-1">Energy Audit Insight</p>

          <h2 className="font-black text-xl mb-2">
            {topAppliance?.name
              ? "Here’s what is driving your estimate."
              : "Your audit is waiting for appliance data."}
          </h2>

          <p className="text-sm opacity-75">{auditMessage}</p>

          {topAppliance?.name && (
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs opacity-60">Top Appliance Share</p>
                <p className="font-black text-lg text-emerald-700">
                  {topApplianceShare.toFixed(0)}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs opacity-60">Potential Monthly Saving</p>
                <p className="font-black text-lg text-emerald-700">
                  {displayCurrency}{Number(possibleSavings).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <p className="text-xs opacity-60 mt-1">If reduced by 1 hour/day</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border">
                <p className="text-xs opacity-60">Bill Check</p>
                <p className="text-sm opacity-75 mt-1">{billComparisonInsight}</p>
              </div>
            </div>
          )}
        </div>


        {topAppliances.length > 0 && (
          <div className="mb-6 p-5 rounded-3xl bg-white text-black shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              <h2 className="font-black text-xl">Appliance Comparison</h2>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              See which appliances contribute the most to your estimated energy usage.
            </p>

            <div className="space-y-4">
              {topAppliances.map((item, index) => {
                const percentage =
                  totalKwh > 0 ? Math.max(4, (item.kwh / totalKwh) * 100) : 0;

                return (
                  <div key={`${item.name}-${item.kwh}-${index}`}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-gray-800">
                        {item.name || "Unnamed appliance"}
                      </span>

                      <span className="text-gray-500">
                        {item.kwh.toFixed(2)} kWh
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6 p-5 rounded-3xl bg-white text-black shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-black text-xl">Share Your Estimate</h2>
              <p className="mt-1 text-sm text-gray-600">
                Send your estimated bill, usage, and highest-usage appliance to someone else.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={shareEstimate}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Share2 size={16} strokeWidth={2.2} />
                Share estimate
              </button>

              <button
                onClick={copyEstimateLink}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Copy size={16} strokeWidth={2.2} />
                {shareCopied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 p-5 rounded-3xl bg-white text-black shadow-lg">
          <h2 className="font-black text-xl mb-2">Energy Audit Report</h2>

          <p className="text-sm opacity-70 mb-4">
            Optionally add your name and address before downloading your report.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              className="p-4 rounded-2xl border border-gray-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Name for report"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />

            <input
              type="text"
              className="p-4 rounded-2xl border border-gray-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Address for report"
              value={reportAddress}
              onChange={(e) => setReportAddress(e.target.value)}
            />
          </div>

          <button
            onClick={downloadPDF}
            className="mt-4 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow"
          >
            Download Energy Audit Report
          </button>
        </div>

        <div className="mb-10 p-5 md:p-6 rounded-3xl bg-white text-black shadow-lg">
          <h2 className="font-black text-xl mb-2">
            Support Watts My Bill?
          </h2>

          <p className="text-sm opacity-70 mb-4">
            This tool is free to use. If it helped you understand your
            electricity bill, you may support the project.
          </p>

          <button
            onClick={() => setShowDonate(!showDonate)}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow transition"
          >
            {showDonate ? "Hide" : "Support"}
          </button>

          {showDonate && (
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="border rounded-3xl p-5 bg-gray-50">
                <img
                  src="/Gcash-qr.jpg"
                  alt="Gcash QR"
                  className="w-52 h-52 object-contain rounded-2xl mx-auto"
                />

                <h3 className="font-bold text-lg mt-4">
                  Gcash
                </h3>

                <p className="text-xs opacity-50 mt-3">
                  Scan using Gcash or InstaPay-supported banking apps.
                </p>
              </div>

              <div className="border rounded-3xl p-5 bg-gray-50">
                <img
                  src="/paypal-qr.jpg"
                  alt="PayPal QR"
                  className="w-52 h-52 object-contain rounded-2xl mx-auto"
                />

                <h3 className="font-bold text-lg mt-4">
                  PayPal
                </h3>

                <p className="text-xs opacity-50 mt-3">
                  Scan the QR code or use the PayPal link.

                  
                </p>
              </div>
            </div>
          )}

          <p className="text-xs opacity-50 mt-4">
            Your support helps keep Watts My Bill? free and improving.
          </p>
        </div>



        <section className="mb-5 rounded-3xl bg-white p-5 md:p-6 text-black shadow-sm">
          <h2 className="text-xl font-black leading-tight">
            Electricity Bill Usage Calculator
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Watts My Bill? is an electricity usage calculator that helps estimate
            monthly electricity costs based on appliance wattage, quantity, usage
            hours, days used, and electricity provider rates.
          </p>

          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Use it to understand how appliances such as air-conditioning units,
            refrigerators, lighting, computers, heaters, and kitchen appliances
            may contribute to your electricity bill.
          </p>
        </section>

        <footer className="mb-24 rounded-3xl border border-gray-200 bg-white p-5 md:p-6 text-black shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold">© 2026 Watts My Bill? All rights reserved.</p>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-600">
                Estimates only. Watts My Bill? is not affiliated with any electricity
                provider. Use this tool as a guide, not as an official bill.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INFO_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() =>
                    setActiveInfoPage(
                      activeInfoPage === section.id ? null : section.id
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeInfoPage === section.id
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {section.title.replace("Watts My Bill?", "").trim()}
                </button>
              ))}
            </div>
          </div>

          {activeInfoSection && (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black text-emerald-900">
                    {activeInfoSection.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    {activeInfoSection.description}
                  </p>
                </div>

                <button
                  onClick={() => setActiveInfoPage(null)}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </footer>


        {addedToast && (
          <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
            {addedToast}
          </div>
        )}

        <button
          onClick={addAppliance}
          className="fixed bottom-5 right-5 bg-black text-white px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition z-50"
        >
          + Add
        </button>
      </div>
    </div>
  );
  
}