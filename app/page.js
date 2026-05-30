"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import { Moon, Sun, RotateCcw, Share2, Copy, BarChart3, Calculator, Home, CheckCircle2, Coffee, ArrowUp } from "lucide-react";

import { COUNTRIES } from "./data/countries";
import { PRESETS } from "./data/appliances";
import { HOUSEHOLD_PRESETS } from "./data/householdPresets";

const DEFAULT_APPLIANCE = {
  name: "",
  watts: "",
  quantity: 1,
  hours: "",
  days: ""
};

const LOGO_PATH = "/logo.png";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function safePositiveNumber(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function cleanNonNegativeInput(value, { allowZero = true } = {}) {
  if (value === "") return "";

  const number = Number(value);

  if (!Number.isFinite(number)) return "";
  if (number < 0) return allowZero ? "0" : "1";
  if (!allowZero && number === 0) return "1";

  return value;
}

const DID_YOU_KNOW_INSIGHTS = [
  "Cooling appliances usually become the biggest part of a household electricity bill.",
  "Small wattage changes can create noticeable monthly differences over time.",
  "Air-conditioners, refrigerators, and water heaters often drive the highest usage.",
  "Reducing your top appliance by even 1 hour/day can lower your estimate noticeably.",
  "Provider rates can change over time, so updating your bill improves estimate accuracy.",
  "High-watt appliances are not always expensive if they are only used briefly.",
  "Low-watt appliances can still add up when running continuously throughout the day.",
  "Electricity costs are usually driven more by usage habits than appliance quantity.",
  "Cooling settings and room insulation can greatly affect aircon electricity usage.",
  "Your estimate becomes more accurate when appliance wattage labels are used directly."
];

function calculatePresetKwh(preset) {
  return preset.appliances.reduce((sum, item) => {
    const watts = safeNumber(item.watts);
    const quantity = safePositiveNumber(item.quantity);
    const hours = safeNumber(item.hours);
    const days = safeNumber(item.days);

    return sum + (watts * quantity * hours * days) / 1000;
  }, 0);
}

function summarizePresetAppliances(preset) {
  return preset.appliances
    .slice(0, 6)
    .map((item) => `${item.quantity || 1} ${item.name}`)
    .join(" • ");
}

function getPresetTypeLabel(preset) {
  const name = preset.name.toLowerCase();

  if (name.includes("studio")) return "Starter home";
  if (name.includes("condo")) return "Condo setup";
  if (name.includes("house")) return "Family home";

  return "Home preset";
}


function getWattageGuide(applianceName = "", category = "") {
  const name = applianceName.toLowerCase();
  const type = category.toLowerCase();

  if (name.includes("aircon") || name.includes("air-conditioning")) {
    return "Aircon wattage is not always constant. A label may show the maximum input, but actual use can ramp up and down depending on inverter/non-inverter type, room temperature, thermostat setting, insulation, and compressor load. Use the label as a guide, but average running watts may be lower than the maximum.";
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

  if (name.includes("induction")) {
    return "Induction cooker wattage is often the maximum input rating. It may not use the full wattage continuously because power changes by heat level, pan size, cooking mode, and cycling behavior. For a closer estimate, use the setting you usually cook with rather than only the maximum rating.";
  }

  if (name.includes("kettle") || name.includes("oven") || name.includes("microwave") || name.includes("stove") || name.includes("range")) {
    return "Kitchen heating appliances are usually high wattage. The label often shows the maximum input, but actual use can depend on heat setting, cycle behavior, and cooking time. Check the label or manual, then use a realistic average for your normal use.";
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
      "Watts My Bill? is a free electricity usage calculator that helps users estimate monthly electricity costs based on appliance wattage, quantity, usage hours, days per month, and electricity rate. It is built to help everyday users better understand how appliances may contribute to their bill."
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
      "For questions, feedback, corrections, or suggestions, you can contact Watts My Bill? at hello@wattsmybill.app. Please avoid sending account numbers, billing references, exact addresses, or other sensitive personal billing information."
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
          Understand Your Electricity Bill
        </div>
      </div>
    </div>
  );
}

function useAnimatedNumber(value, duration = 520, largeJumpThreshold = 25000) {
  const [displayValue, setDisplayValue] = useState(safeNumber(value));
  const previousValueRef = useRef(safeNumber(value));

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = safeNumber(value);
    const jumpSize = Math.abs(endValue - startValue);

    if (jumpSize > largeJumpThreshold) {
      setDisplayValue(endValue);
      previousValueRef.current = endValue;
      return;
    }

    if (jumpSize < 0.01) {
      setDisplayValue(endValue);
      previousValueRef.current = endValue;
      return;
    }

    let animationFrame;
    let startTime;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
        setDisplayValue(endValue);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, largeJumpThreshold]);

  return displayValue;
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
  const [showAllHouseholdPresets, setShowAllHouseholdPresets] = useState(false);
  const [selectedHouseholdPreset, setSelectedHouseholdPreset] = useState(null);
  const [pendingHouseholdPreset, setPendingHouseholdPreset] = useState(null);
  const [showWattageHelp, setShowWattageHelp] = useState(false);
  const [showEstimateHelp, setShowEstimateHelp] = useState(false);
  const [activeInfoPage, setActiveInfoPage] = useState(null);
  const [addedToast, setAddedToast] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showBackToEstimate, setShowBackToEstimate] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [didYouKnowIndex, setDidYouKnowIndex] = useState(0);
  const [showWattageEducation, setShowWattageEducation] = useState(false);

  const heroSectionRef = useRef(null);
  const inputSectionRef = useRef(null);
  const insightsSectionRef = useRef(null);
  const howEstimatesSectionRef = useRef(null);
  const applianceSectionRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const highlightTimerRef = useRef(null);

  const [appliances, setAppliances] = useState([DEFAULT_APPLIANCE]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem("watts-my-bill-data");

      if (savedData) {
        const parsed = JSON.parse(savedData);

        const restoredAppliances = parsed.appliances?.length
          ? parsed.appliances.map((item) => ({
              ...DEFAULT_APPLIANCE,
              ...item,
              quantity: safePositiveNumber(item.quantity)
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
        setShowAllHouseholdPresets(parsed.showAllHouseholdPresets || false);
        setSelectedHouseholdPreset(parsed.selectedHouseholdPreset || null);
        setShowWattageHelp(parsed.showWattageHelp || false);
        setShowEstimateHelp(false);

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
        showAllHouseholdPresets,
        selectedHouseholdPreset,
        showWattageHelp,
        // showEstimateHelp intentionally not persisted so the hero note starts closed
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
    showAllHouseholdPresets,
    selectedHouseholdPreset,
    showWattageHelp
  ]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToEstimate(window.scrollY > 760);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const didYouKnowTimer = window.setInterval(() => {
      setDidYouKnowIndex((current) => (current + 1) % DID_YOU_KNOW_INSIGHTS.length);
    }, 9000);

    return () => window.clearInterval(didYouKnowTimer);
  }, [DID_YOU_KNOW_INSIGHTS.length]);

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

  const visibleHouseholdPresets = showAllHouseholdPresets
    ? HOUSEHOLD_PRESETS
    : HOUSEHOLD_PRESETS.slice(0, 4);

  const activeHouseholdPreset = HOUSEHOLD_PRESETS.find(
    (preset) => preset.name === selectedHouseholdPreset
  );

  const isOtherCountry = country.name === "Other Country";
  const hasCustomRate = String(customRate || "").trim() !== "";
  const activeRate = hasCustomRate ? safeNumber(customRate) : safeNumber(country.rate);

  const displayCountry = isOtherCountry
    ? customCountryName || "Other Country"
    : country.name;

  const displayCurrency = isOtherCountry
    ? customCurrency || ""
    : country.currency;

  const formatCurrency = (value) =>
    `${displayCurrency}${safeNumber(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const formatCompactCurrency = (value) => {
    const number = safeNumber(value);

    if (number >= 1_000_000_000) {
      return `${displayCurrency}${number.toLocaleString(undefined, {
        notation: "compact",
        maximumFractionDigits: 2
      })}`;
    }

    return formatCurrency(number);
  };

  const formatCompactNumber = (value, digits = 2) => {
    const number = safeNumber(value);

    if (number >= 1_000_000) {
      return number.toLocaleString(undefined, {
        notation: "compact",
        maximumFractionDigits: 2
      });
    }

    return number.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  };

  const rateWarning =
    hasCustomRate && safeNumber(customRate) > Math.max(safeNumber(country.rate) * 8, 1000);

  const popularQuestions = [
    {
      question: "How much does my aircon cost?",
      answer:
        "Aircon cost depends on its wattage, hours used, days per month, and your electricity rate. Add your aircon below for a more accurate estimate."
    },
    {
      question: "Why is my bill so high?",
      answer:
        "High bills often come from cooling, long daily use, appliances running all day, provider fees, or rates that changed."
    },
    {
      question: "Is this appliance expensive to run?",
      answer:
        "Check watts, hours, and days. A high-watt appliance can be fine if used briefly, while a low-watt appliance can add up if used all day."
    },
    {
      question: "What uses the most electricity?",
      answer:
        "Usually air-conditioning, heaters, dryers, cooking appliances, refrigerators, and appliances used for many hours."
    }
  ];

  const isBlankAppliance = (item) =>
    !String(item.name || "").trim() &&
    !String(item.watts || "").trim() &&
    !String(item.hours || "").trim() &&
    !String(item.days || "").trim() &&
    safePositiveNumber(item.quantity) === 1;

  const showAddedFeedback = (name, index) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    setAddedToast("");
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
    setShowAllHouseholdPresets(false);
    setSelectedHouseholdPreset(null);
    setPendingHouseholdPreset(null);
    setShowWattageHelp(false);
    setShowEstimateHelp(false);
    setActiveInfoPage(null);
    setActiveQuestion(null);
    setAddedToast("");
    setHighlightedIndex(null);
    setAppliances([{ ...DEFAULT_APPLIANCE }]);
  };

  const addAppliance = () => {
    const newAppliances = [
      { ...DEFAULT_APPLIANCE },
      ...appliances
    ];

    setAppliances(newAppliances);
    showAddedFeedback("Appliance", 0);

    setTimeout(() => {
      applianceSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 120);
  };

  const addPreset = (preset) => {
    const newAppliance = {
      name: preset.name,
      category: preset.category,
      watts: preset.watts,
      quantity: 1,
      hours: preset.hours,
      days: preset.days,
      wattageGuide: preset.wattageGuide || getWattageGuide(preset.name, preset.category)
    };

    const shouldReplaceBlankRows = appliances.every(isBlankAppliance);
    const newAppliances = shouldReplaceBlankRows
      ? [newAppliance]
      : [newAppliance, ...appliances];

    setAppliances(newAppliances);
    showAddedFeedback(preset.name, 0);

    setTimeout(() => {
      applianceSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 120);
  };

  const buildHouseholdPresetAppliances = (preset) =>
    preset.appliances.map((item) => ({
      ...DEFAULT_APPLIANCE,
      ...item,
      wattageGuide: getWattageGuide(item.name, item.category)
    }));

  const applyHouseholdPreset = (preset, mode = "replace") => {
    const presetAppliances = buildHouseholdPresetAppliances(preset);
    const newAppliances =
      mode === "add" ? [...presetAppliances, ...appliances] : presetAppliances;

    setSelectedHouseholdPreset(preset.name);
    setPendingHouseholdPreset(null);
    setAppliances(newAppliances);
    setAddedToast("");
    setHighlightedIndex(0);

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = setTimeout(() => setHighlightedIndex(null), 1200);

    setTimeout(() => {
      applianceSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 120);
  };

  const addHouseholdPreset = (preset) => {
    setSelectedHouseholdPreset(preset.name);

    if (appliances.every(isBlankAppliance)) {
      applyHouseholdPreset(preset, "replace");
      return;
    }

    setPendingHouseholdPreset(preset);
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
      const watts = safeNumber(a.watts);
      const quantity = safePositiveNumber(a.quantity);
      const hours = safeNumber(a.hours);
      const days = safeNumber(a.days);

      const kwh = (watts * quantity * hours * days) / 1000;
      const cost = kwh * activeRate;

      return { ...a, quantity, kwh, cost };
    });
  }, [appliances, activeRate]);

  const totalKwh = breakdown.reduce((s, i) => s + i.kwh, 0);
  const total = breakdown.reduce((s, i) => s + i.cost, 0);
  const difference = actualBill ? safeNumber(actualBill) - total : 0;
  const currentMicroInsight = DID_YOU_KNOW_INSIGHTS[didYouKnowIndex % DID_YOU_KNOW_INSIGHTS.length];

  const topAppliance = [...breakdown]
    .filter((item) => item.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)[0];

  const topAppliances = [...breakdown]
    .filter((item) => item.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, 5);

  const dailyAverage = total / 30;

  const animatedTotal = useAnimatedNumber(total);
  const animatedTotalKwh = useAnimatedNumber(totalKwh);
  const animatedDailyAverage = useAnimatedNumber(dailyAverage);
  const possibleSavings = topAppliance
    ? ((safeNumber(topAppliance.watts) *
        safePositiveNumber(topAppliance.quantity) *
        1 *
        safeNumber(topAppliance.days)) /
        1000) *
      activeRate
    : 0;

  const topApplianceShare =
    topAppliance && totalKwh > 0 ? (topAppliance.kwh / totalKwh) * 100 : 0;

  const applianceInsight = topAppliance
    ? getApplianceInsight(topAppliance.name, topAppliance.category)
    : "";

  const coolingKwh = breakdown
    .filter((item) => item.category === "Cooling")
    .reduce((sum, item) => sum + item.kwh, 0);

  const coolingShare = totalKwh > 0 ? (coolingKwh / totalKwh) * 100 : 0;

  const differenceLabelColor =
    difference > 0
      ? "rgba(225, 29, 72, 0.68)"
      : difference < 0
        ? "rgba(217, 119, 6, 0.72)"
        : "rgba(5, 150, 105, 0.72)";

  const differenceAmountColor =
    difference > 0
      ? "#e11d48"
      : difference < 0
        ? "#d97706"
        : "#059669";

  const billComparisonInsight = safeNumber(actualBill) > 0
    ? difference > 0
      ? `Your entered bill is ${formatCurrency(Math.abs(difference))} higher than this estimate. This may come from taxes, provider fees, appliances not listed yet, or wattages that are lower than actual.`
      : difference < 0
        ? `Your estimate is ${formatCurrency(Math.abs(difference))} higher than your entered bill. Check if some wattages, hours, or days are too high.`
        : "Your entered bill matches this estimate."
    : "Add your actual bill to compare it with this estimate.";

  const auditMessage = topAppliance
    ? `${topAppliance.name} is your top estimated energy user at ${topAppliance.kwh.toFixed(
        2
      )} kWh, about ${topApplianceShare.toFixed(
        0
      )}% of your total estimated usage. Reducing its use by 1 hour per day may save around ${displayCurrency}${possibleSavings.toFixed(
        2
      )} per month. ${coolingShare >= 40 ? `Cooling appliances account for about ${coolingShare.toFixed(0)}% of your total estimated usage. ` : ""}${applianceInsight}`
    : "Add appliance details to generate an energy audit insight.";

  const usageDriverLabel = "Biggest energy user";

  const savingsTip = topAppliance
    ? `Try reducing ${topAppliance.name} by 1 hour/day to test a possible monthly saving.`
    : "Add appliances to unlock usage insights and saving suggestions.";

  const coolingInsight = coolingShare >= 40
    ? `Cooling appliances account for about ${coolingShare.toFixed(0)}% of your total estimated usage.`
    : "Your cooling usage does not dominate the estimate yet.";

  const buildShareText = () => {
    const estimatedBill = `${displayCurrency}${safeNumber(total).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    const topUsage = topAppliance?.name
      ? ` Top energy user: ${topAppliance.name}.`
      : "";

    return `I estimated my monthly electricity bill using Watts My Bill?: ${estimatedBill}.
Total usage: ${totalKwh.toFixed(
      2
    )} kWh.${topUsage ? `
${topUsage.trim()}` : ""}`;
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

      const marginX = 25.4; // 1 inch left/right
      const marginTop = 19.05; // 0.75 inch top
      const marginBottom = 25.4; // 1 inch bottom
      const contentWidth = pageWidth - marginX * 2;

      let y = marginTop;
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
        "₫": "VND ",
        "zł": "PLN ",
        "kr": "KR ",
        "Rp": "IDR ",
        "RM": "MYR ",
        "MX$": "MXN ",
        "R$": "BRL ",
        "R": "ZAR ",
        "฿": "THB ",
        "د.إ": "AED "
      };

      const pdfCurrency = currencyMap[displayCurrency] || displayCurrency || "";

      const cleanText = (value) =>
        String(value || "")
          .replace(/₱/g, "PHP ")
          .replace(/₹/g, "INR ")
          .replace(/₩/g, "KRW ")
          .replace(/₫/g, "VND ")
          .replace(/¥/g, "JPY ")
          .replace(/€/g, "EUR ")
          .replace(/£/g, "GBP ")
          .replace(/د.إ/g, "AED ")
          .replace(/[^\x20-\x7E]/g, "")
          .replace(/\s+/g, " ")
          .trim();

      const money = (value) =>
        cleanText(`${pdfCurrency}${safeNumber(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`);

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
          marginX,
          pageHeight - marginBottom + 5,
          pageWidth - marginX,
          pageHeight - marginBottom + 5
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);

        doc.text(
          "Estimates only. This report does not replace your official utility bill.",
          marginX,
          pageHeight - marginBottom + 11
        );

        doc.text(`Page ${pageNumber}`, pageWidth - marginX, pageHeight - marginBottom + 11, {
          align: "right"
        });
      };

      const checkPage = (needed = 20) => {
        if (y + needed > pageHeight - marginBottom - 8) {
          footer();
          doc.addPage();
          pageNumber += 1;
          y = marginTop;
        }
      };

      const sectionTitle = (title, rightText = "") => {
        checkPage(18);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(25, 25, 25);
        doc.text(title, marginX, y);

        if (rightText) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(90, 90, 90);
          doc.text(rightText, pageWidth - marginX, y, { align: "right" });
        }

        y += 5.5;

        doc.setDrawColor(5, 150, 105);
        doc.setLineWidth(0.5);
        doc.line(marginX, y, pageWidth - marginX, y);

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
      const headerTextX = logoImage?.dataUrl ? marginX + 16 : marginX;

      if (logoImage?.dataUrl) {
        const logoRatio = logoImage.width / logoImage.height;
        const logoWidth = logoRatio >= 1 ? logoBoxSize : logoBoxSize * logoRatio;
        const logoHeight = logoRatio >= 1 ? logoBoxSize / logoRatio : logoBoxSize;
        const logoX = marginX + (logoBoxSize - logoWidth) / 2;
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
          `${pdfCurrency}${safeNumber(activeRate).toLocaleString(undefined, {
            maximumFractionDigits: 4
          })}/kWh`
        ]
      ];

      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      detailLines.forEach(([label, value]) => {
        checkPage(10);

        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, marginX, y);

        doc.setFont("helvetica", "normal");
        y = writeWrappedText(value, marginX + 48, y, contentWidth - 48, 5);

        y += 1.8;
      });

      y += 8;

      sectionTitle("Executive Summary");

      checkPage(42);

      doc.setFillColor(235, 252, 245);
      doc.setDrawColor(180, 235, 215);
      doc.roundedRect(marginX, y - 5, contentWidth, 28, 4, 4, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(85, 105, 100);
      doc.text("Estimated Monthly Bill", marginX + 6, y + 1);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(5, 150, 105);
      doc.text(cleanText(money(total)), marginX + 6, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(85, 105, 100);
      doc.text(`${totalKwh.toFixed(2)} kWh estimated monthly usage`, pageWidth - marginX - 6, y + 13, { align: "right" });

      y += 34;

      const summaryLines = [
        ["Total Usage", `${totalKwh.toFixed(2)} kWh`],
        ["Daily Average", `${money(dailyAverage)} / day`],
        ["Top Energy User", topAppliance?.name || "Not available"],
        ["Country", cleanText(displayCountry)]
      ];

      summaryLines.forEach(([label, value]) => {
        checkPage(8);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(50, 50, 50);
        doc.text(`${label}:`, marginX, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 70, 70);
        y = writeWrappedText(value, marginX + 42, y, contentWidth - 42, 5);

        y += 2;
      });

      if (safeNumber(actualBill) > 0) {
        y += 3;

        doc.setDrawColor(230, 230, 230);
        doc.line(marginX, y, pageWidth - marginX, y);

        y += 7;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Bill Comparison", marginX, y);

        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Current Bill", marginX, y);

        doc.setFont("helvetica", "normal");
        doc.text(money(safeNumber(actualBill)), marginX + 40, y);

        y += 8;

        doc.setFont("helvetica", "bold");
        doc.text("Estimated Difference", marginX, y);

        doc.setFont("helvetica", "normal");
        doc.text(money(Math.abs(difference)), marginX + 40, y);

        y += 7;

        
      }

      y += 12;

      sectionTitle("Energy Insight");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(70, 70, 70);
      y = writeJustifiedText(auditMessage, marginX, y, contentWidth, 5.2);

      y += 10;

      sectionTitle("Appliance Breakdown");

      const validRows = breakdown.filter(
        (item) => item.name || item.kwh > 0 || item.cost > 0
      );

      const tableX = marginX;
      const col = {
          appliance: tableX,
          qty: tableX + 44,
          watts: tableX + 58,
          hours: tableX + 76,
          days: tableX + 94,
          kwh: tableX + 112,
          cost: tableX + 132
      };

      const tableHeader = () => {
        doc.setFillColor(245, 247, 250);
        doc.rect(tableX, y - 5, contentWidth, 9, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.3);
        doc.setTextColor(45, 45, 45);

        doc.text("Appliance", col.appliance + 1, y);
        doc.text("Qty", col.qty, y);
        doc.text("Watts", col.watts, y);
        doc.text("Hours", col.hours, y);
        doc.text("Days/Mo", col.days, y);
        doc.text("kWh", col.kwh, y);
        doc.text("Cost", col.cost, y);

        y += 8;
      };

      const newPdfPageWithTableHeader = () => {
        footer();
        doc.addPage();
        pageNumber += 1;
        y = marginTop;
        tableHeader();
      };

      if (validRows.length === 0) {
        checkPage(18);
        tableHeader();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("No appliance data entered.", tableX + 1, y);
        y += 8;
      } else {
        checkPage(26);
        tableHeader();

        validRows.forEach((item) => {
          const applianceName = cleanText(item.name || "Unnamed");
          const applianceLines = doc.splitTextToSize(applianceName, 42);
          const rowHeight = Math.max(8, applianceLines.length * 4.5);

          if (y + rowHeight > pageHeight - marginBottom - 8) {
            newPdfPageWithTableHeader();
          }

          doc.setDrawColor(230, 230, 230);
          doc.line(tableX, y + 2, pageWidth - marginX, y + 2);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.3);
          doc.setTextColor(50, 50, 50);

          doc.text(applianceLines, col.appliance + 1, y);
          doc.text(String(safePositiveNumber(item.quantity)), col.qty, y);
          doc.text(String(safeNumber(item.watts)), col.watts, y);
          doc.text(String(safeNumber(item.hours)), col.hours, y);
          doc.text(String(safeNumber(item.days)), col.days, y);
          doc.text(item.kwh.toFixed(2), col.kwh, y);
          doc.text(money(item.cost), col.cost, y);

          y += rowHeight;
        });
      }

      y += 10;

      if (topAppliances.length > 0) {
        sectionTitle("Top Appliance Highlights");

        topAppliances.slice(0, 3).forEach((item) => {
          checkPage(12);

          const percent = totalKwh > 0 ? Math.min(100, (item.kwh / totalKwh) * 100) : 0;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(45, 45, 45);
          doc.text(cleanText(item.name || "Unnamed appliance"), marginX, y);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(90, 90, 90);
          doc.text(`${item.kwh.toFixed(2)} kWh`, pageWidth - marginX, y, { align: "right" });

          y += 3.5;

          doc.setFillColor(235, 245, 240);
          doc.roundedRect(marginX, y, contentWidth, 3, 1.5, 1.5, "F");

          doc.setFillColor(5, 150, 105);
          doc.roundedRect(marginX, y, Math.max(8, (contentWidth * percent) / 100), 3, 1.5, 1.5, "F");

          y += 10;
        });

        y += 16;
      }

      sectionTitle("Important Note");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);

      writeWrappedText(
        "This report is for estimation and educational purposes only. Actual electric bills may include taxes, generation charges, transmission, distribution, service fees, VAT, and provider-specific adjustments.",
        marginX,
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
    ? "bg-[#06142b] text-white"
    : "bg-[#eef3f1] text-gray-900";

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-300 ${theme}`}>



      <div className="mx-auto w-full max-w-[1250px]">
        <div className="flex justify-between items-start gap-3 md:gap-4 mb-4">
          <Logo darkMode={darkMode} />
        </div>

        <div ref={heroSectionRef} className="wmb-hero-card relative isolate mb-5 md:mb-7 overflow-hidden rounded-[30px] px-4 py-4 md:px-6 md:py-5 lg:py-6 text-white">
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="pointer-events-auto absolute right-4 top-4 z-[60] grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.12] bg-emerald-950/[0.15] text-white/88"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun size={17} strokeWidth={2.25} />
            ) : (
              <Moon size={17} strokeWidth={2.25} />
            )}
          </button>

          <div className="relative z-20 grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(360px,0.9fr)] lg:items-start lg:gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(250px,0.48fr)_minmax(370px,0.72fr)] xl:gap-4">
            <div className="max-w-2xl pr-10 lg:pr-0">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/88">
                Live estimate
              </p>

              <h2 className="max-w-full break-words text-[2.05rem] font-black leading-none md:text-[2.45rem]">
                {formatCompactCurrency(animatedTotal)}
              </h2>

              <p className="mt-2 text-[15px] text-white/97 md:text-base">
                {totalKwh > 0
                  ? "Estimated monthly electricity bill"
                  : "Add appliances below to begin"}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    inputSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    })
                  }
                  className="wmb-hero-action-primary rounded-full px-4 py-2 text-[12px] font-extrabold text-white"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Calculator size={13} strokeWidth={2.2} /> Start
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    insightsSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    })
                  }
                  className="wmb-hero-action-secondary rounded-full px-3.5 py-1.5 text-[12px] font-bold text-white/92"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <BarChart3 size={13} strokeWidth={2.15} /> Insights
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    howEstimatesSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    })
                  }
                  className="wmb-hero-action-quiet rounded-full px-3.5 py-1.5 text-[12px] font-bold text-white/84"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} strokeWidth={2.15} /> How it works
                  </span>
                </button>
              </div>
            </div>

            <div className="wmb-flow-panel hidden rounded-2xl px-[18px] py-3.5 xl:block">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-[10.5px] font-black uppercase tracking-[0.14em] text-white/78">
                    Biggest energy user
                  </p>

                  {topAppliance?.name ? (
                    <>
                      <h3 className="mt-2 line-clamp-2 text-sm font-black leading-tight text-white">
                        {topAppliance.name}
                      </h3>

                      <p className="mt-2 text-[12px] leading-relaxed text-white/84">
                        About <span className="font-black text-white/86">{topApplianceShare.toFixed(0)}%</span> of your estimated usage comes from this appliance.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-2 text-sm font-black leading-tight text-white">
                        Add appliances to reveal your biggest energy driver.
                      </h3>

                      <p className="mt-2 text-[12px] leading-relaxed text-white/84">
                        Your biggest energy user will appear here once usage is added.
                      </p>
                    </>
                  )}
                </div>

                <p className="mt-3 text-[11.5px] font-bold leading-relaxed text-white/86">
                  {topAppliance?.name
                    ? `💡 Try reducing it by 1 hour/day to test possible savings.`
                    : `Start with an appliance or household preset.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:mr-8 lg:gap-2.5 xl:mr-10 xl:gap-2.5">
              <div className="wmb-stat-tile flex min-h-[66px] flex-col justify-center rounded-[16px] px-3.5 py-2.5 lg:min-h-[62px] lg:px-3.5 lg:py-2.5">
                <p className="text-[10.5px] font-black uppercase tracking-[0.075em] text-white/88">Total Usage</p>
                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm">⚡</span>
                  <p className="min-w-0 truncate text-[0.96rem] font-black leading-tight text-white md:text-[0.98rem]">{formatCompactNumber(animatedTotalKwh)} kWh</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  inputSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  })
                }
                className="wmb-stat-tile flex min-h-[66px] flex-col justify-center rounded-[16px] px-3.5 py-2.5 text-left transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-200/50 lg:min-h-[62px] lg:px-3.5 lg:py-2.5"
                aria-label="Select or change country"
              >
                <p className="text-[10.5px] font-black uppercase tracking-[0.075em] text-white/88">Country</p>
                <div className="mt-1.5 flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-sm">{country.flag}</span>
                  <p className="min-w-0 truncate text-[0.96rem] font-black leading-tight text-white md:text-[0.98rem]">
                    {displayCountry === "Select your country" ? "Select country" : displayCountry}
                  </p>
                </div>
              </button>

              <div className="wmb-stat-tile flex min-h-[66px] flex-col justify-center rounded-[16px] px-3.5 py-2.5 lg:min-h-[62px] lg:px-3.5 lg:py-2.5">
                <p className="text-[10.5px] font-black uppercase tracking-[0.075em] text-white/88">Rate Used</p>
                <p className="mt-1.5 min-w-0 truncate text-[0.96rem] font-black leading-tight text-white md:text-[0.98rem]">
                  {displayCurrency}
                  {activeRate || 0}/kWh
                </p>
              </div>

              <div className="wmb-stat-tile flex min-h-[66px] flex-col justify-center rounded-[16px] px-3.5 py-2.5 lg:min-h-[62px] lg:px-3.5 lg:py-2.5">
                <p className="text-[10.5px] font-black uppercase tracking-[0.075em] text-white/88">Daily Average</p>
                <p className="mt-1.5 min-w-0 truncate text-[0.96rem] font-black leading-tight text-white md:text-[0.98rem]">
                  {formatCompactCurrency(animatedDailyAverage)}/day
                </p>
              </div>
            </div>

            <div className="wmb-mobile-driver-strip mt-1.5 rounded-2xl px-3.5 py-3 lg:col-span-2 xl:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/76">
                    Biggest energy user
                  </p>

                  <p className="mt-0.5 truncate text-sm font-black text-white">
                    {topAppliance?.name || "Add appliances"}
                  </p>

                  <p className="mt-1 text-[12px] font-semibold leading-snug text-white/86">
                    {topAppliance?.name
                      ? "Try reducing it by 1 hour/day to test possible savings."
                      : "Your biggest energy user will appear here"}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-emerald-200/[0.12] bg-white/[0.055] px-2.5 py-1.5 text-right">
                  <p className="text-base font-black text-white/94">
                    {topAppliance?.name ? `${topApplianceShare.toFixed(0)}%` : "—"}
                  </p>

                  <p className="text-[10.5px] font-bold text-white/70">
                    usage
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-20 mt-3 flex justify-start pt-1.5">
            <button
              onClick={() => setShowEstimateHelp(!showEstimateHelp)}
              className="w-fit text-xs font-semibold underline underline-offset-4 text-white/95 hover:text-white"
            >
              {showEstimateHelp ? "Hide estimate note" : "Why is this only an estimate?"}
            </button>
          </div>

          {showEstimateHelp && (
            <p className="relative z-20 mt-2 max-w-2xl text-xs leading-relaxed text-white/84">
              Actual electric bills may include generation, transmission,
              distribution, service fees, VAT, taxes, and provider-specific
              adjustments that are not included in a simple appliance estimate.
            </p>
          )}
        </div>

        <div className={`relative z-10 -mt-1 mb-5 px-1 text-[14px] leading-relaxed ${
          darkMode ? "text-slate-100/94" : "text-slate-800"
        }`}>
          <span className={darkMode ? "font-black text-emerald-300" : "font-black text-emerald-700"}>
            Did you know?
          </span>{" "}
          <span key={didYouKnowIndex} className="inline font-medium leading-relaxed">
            {currentMicroInsight}
          </span>
        </div>

        <div className="mb-6 md:mb-7" aria-hidden="true" />


        <div ref={inputSectionRef} className="grid md:grid-cols-3 gap-4 mb-6">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">
              Country
            </span>

            <select
              className="w-full p-4 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
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
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">
              Current Monthly Bill
            </span>

            <input
              type="number"
              min="0"
              className="w-full p-4 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Enter amount"
              value={actualBill}
              onChange={(e) => setActualBill(cleanNonNegativeInput(e.target.value))}
            />
          </label>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">
                Provider Rate / kWh
              </span>

              <input
                type="number"
                min="0"
                step="any"
                className="w-full p-4 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                placeholder={`${displayCurrency || "Currency"} per kWh`}
                value={customRate}
                onChange={(e) => setCustomRate(cleanNonNegativeInput(e.target.value))}
              />
            </label>

            <p className="mt-2 px-1 text-[12px] leading-relaxed text-slate-500">
              Optional. Add your provider’s rate for a more accurate estimate. 
              Otherwise, we’ll use your country’s average rate.
            </p>

            {rateWarning && (
              <p className="mt-2 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-xs font-medium text-amber-800">
                This rate seems unusually high. Please double-check your provider rate.
              </p>
            )}
          </div>
        </div>

        {isOtherCountry && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              className="p-4 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Your country name"
              value={customCountryName}
              onChange={(e) => setCustomCountryName(e.target.value)}
            />

            <input
              type="text"
              className="p-4 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Currency symbol, e.g. ₱, $, €, RM"
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value)}
            />
          </div>
        )}

                <div className="mb-4 rounded-3xl bg-[#f7f8f8] p-5 md:px-5 md:py-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition-all duration-200 hover:shadow-md">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 font-black text-xl tracking-tight">
              <Home size={19} className="text-emerald-600" />
              Household Presets
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
              Start with a typical home setup. You can still edit every appliance afterward.
            </p>

            <div className="mt-3 max-w-3xl rounded-2xl border border-emerald-200/45 bg-emerald-50/45 px-3 py-2 text-[11px] leading-relaxed text-emerald-950/75">
              <span className="font-extrabold">Preset note:</span>{" "}
              These are starting estimates only. For better accuracy, review the appliances, wattage, hours, and days after applying a preset.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-2.5 lg:grid-cols-4 xl:gap-3">
            {visibleHouseholdPresets.map((preset) => {
              const presetKwh = calculatePresetKwh(preset);
              const isSelected = selectedHouseholdPreset === preset.name;

              return (
                <button
                  key={preset.name}
                  onClick={() => addHouseholdPreset(preset)}
                  className={`group min-h-[86px] md:min-h-[88px] rounded-2xl border p-2.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_3px_10px_rgba(16,185,129,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_22px_rgba(16,185,129,0.14)] active:scale-[0.98] ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-100/90 ring-1 ring-emerald-300 shadow-emerald-900/10"
                      : "border-emerald-200/75 bg-white/75 hover:border-emerald-100 hover:bg-[#dcf4ea] hover:ring-1 hover:ring-emerald-200/70"
                  }`}
                  aria-label={`${preset.name} ${preset.size}`}
                >
                  <span className="mb-1.5 flex items-start justify-between gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-white text-sm shadow-sm ring-1 ring-emerald-100">
                      {preset.icon}
                    </span>

                    {isSelected ? (
                      <CheckCircle2 size={17} className="text-emerald-700" />
                    ) : (
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 ring-1 ring-emerald-100/80">
                        Use preset
                      </span>
                    )}
                  </span>

                  <span className="block font-black leading-tight text-gray-950">
                    {preset.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{preset.size}</span>
                  <span className="mt-1 block text-xs font-semibold text-emerald-800">
                    Estimated: ~{presetKwh.toFixed(0)} kWh/month
                  </span>
                </button>
              );
            })}
          </div>

          {activeHouseholdPreset && (
            <div className="mt-4 rounded-3xl border border-emerald-100/80 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    What’s included • {getPresetTypeLabel(activeHouseholdPreset)}
                  </p>
                  <h3 className="mt-1 font-black text-gray-950">
                    {activeHouseholdPreset.icon} {activeHouseholdPreset.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Estimated preset usage: ~{calculatePresetKwh(activeHouseholdPreset).toFixed(0)} kWh/month before edits.
                  </p>
                </div>

                <button
                  onClick={() => setSelectedHouseholdPreset(null)}
                  className="self-start rounded-full border border-emerald-100/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  Hide details
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activeHouseholdPreset.appliances.map((item) => (
                  <div
                    key={`${activeHouseholdPreset.name}-${item.category}-${item.name}`}
                    className="rounded-2xl border border-gray-100 bg-[#f7f8f8] px-3 py-2 text-xs text-gray-700"
                  >
                    <span className="font-extrabold">{item.quantity || 1}× {item.name}</span>
                    <span className="block text-gray-500">{item.watts}W • {item.hours}h/day • {item.days} days/mo</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedHouseholdPreset(null)}
                className="mt-4 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 sm:hidden"
              >
                Hide details
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAllHouseholdPresets(!showAllHouseholdPresets)}
            className="mt-4 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
          >
            {showAllHouseholdPresets ? "Show Less" : "More Presets"}
          </button>
        </div>

        <div className="mb-4 rounded-3xl bg-[#f7f8f8] p-5 md:px-5 md:py-5 text-black shadow-sm ring-1 ring-emerald-950/[0.06]">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold">Quick Add Appliances</h2>
                <span className="rounded-full border border-emerald-100/80 bg-emerald-50/45 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  Manual builder
                </span>
              </div>
              <div className="mt-1 text-sm leading-relaxed text-gray-600">
                <p>
                  Build your estimate appliance by appliance, then fine-tune wattage, hours, and days below.
                </p>

                <button
                  type="button"
                  onClick={() => setShowWattageHelp(!showWattageHelp)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
                >
                  <CheckCircle2 size={12} strokeWidth={2.4} />
                  {showWattageHelp ? "Hide wattage guide" : "Wattage guide"}
                </button>
              </div>

              {showWattageHelp && (
                <p className="mt-2 max-w-xl rounded-2xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs leading-relaxed text-gray-600 transition-all duration-300 ease-out">
                  Check the appliance sticker, power adapter, user manual, or search the exact appliance model online. Actual wattage gives a better estimate than generic presets.
                </p>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[380px] md:flex-row md:items-center">
              <input
                type="text"
                className="w-full rounded-2xl border border-gray-200 bg-white/70 p-3 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 md:min-w-[240px]"
                placeholder="Search appliance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="w-full rounded-2xl border border-gray-200 bg-white/70 p-3 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 md:w-[130px]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Popular appliances
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Start with common appliances, then fine-tune the details below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {visiblePresets.map((p, index) => {
              const hideOnMobile = !showAllPresets && index >= 6;

              return (
                <button
                  key={`${p.category}-${p.name}`}
                  onClick={() => addPreset(p)}
                  className={`${hideOnMobile ? "hidden md:inline-flex" : "inline-flex"} items-center rounded-full border border-emerald-100/80 bg-emerald-50/75 px-3 py-1.5 text-sm font-semibold text-emerald-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100/80 hover:shadow-md active:scale-[0.98] md:px-3.5 md:py-1.5`}
                  title={`${p.category} • ${p.watts}W • ${p.hours}h/day • ${p.days} days/month`}
                >
                  + {p.name}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {filteredPresets.length > 10 && (
                <button
                  onClick={() => setShowAllPresets(!showAllPresets)}
                  className="rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  {showAllPresets ? "Show Less" : "Show More"}
                </button>
              )}

              <button
                onClick={addAppliance}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md"
              >
                + Add Appliance
              </button>
            </div>

            <button
              onClick={clearAll}
              title="Reset all calculator inputs"
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-red-200/70 bg-red-50/35 px-3 py-1.5 text-xs font-semibold text-red-500/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <RotateCcw size={13} strokeWidth={2.1} />
              Reset all
            </button>
          </div>

          {filteredPresets.length === 0 && (
            <p className="text-sm opacity-60 mt-3">
              No appliance found. You can still add it manually below.
            </p>
          )}
        </div>

        <div ref={applianceSectionRef} className="mb-5 space-y-4 scroll-mt-24">
          {breakdown.map((item, i) => {
            const wattageGuide = item.name
              ? item.wattageGuide || getWattageGuide(item.name, item.category)
              : "";

            return (
              <div
                key={i}
                className={`p-5 rounded-3xl text-black shadow-sm relative transition-all duration-500 ${
                  highlightedIndex === i
                    ? "bg-emerald-50 ring-2 ring-emerald-400 shadow-2xl"
                    : "bg-[#f7f8f8] shadow-sm ring-1 ring-emerald-950/[0.06] hover:shadow-md"
                }`}
              >
              <button
                onClick={() => removeAppliance(i)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-sm ring-1 ring-emerald-950/[0.06] hover:bg-red-100 text-gray-500 hover:text-red-600 transition"
                title="Remove appliance"
              >
                ×
              </button>

              <div className="grid md:grid-cols-5 gap-3 pr-10">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-500">Appliance</span>
                  <input
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                    placeholder="Appliance name"
                    value={item.name}
                    onChange={(e) => updateAppliance(i, "name", e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-500">Quantity</span>
                  <input
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateAppliance(i, "quantity", cleanNonNegativeInput(e.target.value, { allowZero: false }))}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-500">Wattage (W)</span>
                  <input
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="W"
                    value={item.watts}
                    onChange={(e) => updateAppliance(i, "watts", cleanNonNegativeInput(e.target.value))}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-500">Hours / Day</span>
                  <input
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Hours"
                    value={item.hours}
                    onChange={(e) => updateAppliance(i, "hours", cleanNonNegativeInput(e.target.value))}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-gray-500">Days / Month</span>
                  <input
                    className="w-full p-3.5 border border-gray-200 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Days"
                    value={item.days}
                    onChange={(e) => updateAppliance(i, "days", cleanNonNegativeInput(e.target.value))}
                  />
                </label>
              </div>

              {item.name && (
                <details className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 shadow-sm">
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

                  <h3 className="font-extrabold">
                    {item.kwh.toFixed(2)} kWh
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-sm opacity-60">Estimated Cost</p>

                  <h3 className="font-black text-2xl text-emerald-600">
                    {displayCurrency}
                    {safeNumber(item.cost).toLocaleString(undefined, {
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


        <section ref={howEstimatesSectionRef} className="mb-5 scroll-mt-24 rounded-3xl bg-[#fbfaf6] p-5 md:px-5 md:py-4 text-black shadow-sm ring-1 ring-amber-900/[0.05]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                How estimates work
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Transparent, simple calculation.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
                Energy usage is estimated using appliance watts, quantity, hours used, and days used per month. Your estimated cost uses your selected country’s average electricity rate or your custom provider rate.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-900">
              Watts × Qty × Hours × Days ÷ 1000 = kWh
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-3xl bg-[#f7fbf8] p-5 text-black shadow-sm ring-1 ring-emerald-950/[0.06]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Understanding appliance wattage
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Wattage is not always constant.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Some appliance labels show the maximum power input, but real usage can change while you use them. The number on the label is helpful, but it is not always the amount used every minute.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWattageEducation((current) => !current)}
              className="inline-flex w-fit shrink-0 items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              {showWattageEducation ? "Show less" : "Show more"}
            </button>
          </div>

          {showWattageEducation && (
            <div className="mt-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-950/[0.06]">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-lg">💡</div>
                  <h3 className="font-black text-gray-950">Steady usage</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Lights, basic fans, routers, and chargers usually stay closer to their listed wattage while running.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-950/[0.06]">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-lg">🔁</div>
                  <h3 className="font-black text-gray-950">Cycling usage</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    These appliances do not pull power every second. Refrigerators, freezers, and some heaters run for a while, then pause once the target temperature is reached.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-950/[0.06]">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-lg">⚙️</div>
                  <h3 className="font-black text-gray-950">Variable usage</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Inverter aircons and induction cookers can go higher or lower depending on settings, room temperature, cooking level, and load. Their label may show the maximum, not the usual average.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm leading-relaxed text-emerald-950">
                Example: an aircon rated up to 1,900W may only hit that level during heavy cooling, startup, or full load. During normal use, especially with inverter units, it can drop much lower. An induction cooker rated at 2,000W may also use less on lower heat settings or while cycling. For better estimates, use the wattage that best matches your normal usage, not always the maximum label.
              </div>
            </div>
          )}
        </section>

        <div ref={insightsSectionRef} className="mt-5 mb-5 rounded-3xl bg-[#f4faf6] p-5 md:px-5 md:py-4 text-black shadow-sm ring-1 ring-emerald-900/[0.07]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Smart usage insights</p>

            <h2 className="mt-1 text-xl font-black tracking-tight">
              {topAppliance?.name
                ? "Here’s what is driving your estimate."
                : "Your audit is waiting for appliance data."}
            </h2>

            <p className="mt-2 max-w-none text-sm leading-relaxed text-gray-600">
              {topAppliance?.name
                ? `${topAppliance.name} is currently your biggest estimated energy user. Check its wattage and daily hours first if you want a more accurate estimate.`
                : "Add appliance details to see which item is driving your estimated usage the most."}
            </p>
          </div>

          {topAppliance?.name ? (
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <p className="text-xs font-semibold text-gray-500">{usageDriverLabel}</p>
                <p className="mt-1 text-base font-black leading-snug text-emerald-700 break-words">
                  {topAppliance.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-600">
                  {topApplianceShare.toFixed(0)}% of total estimated usage
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <p className="text-xs font-semibold text-gray-500">Potential monthly saving</p>
                <p className="mt-1 text-lg font-black text-emerald-700">
                  {displayCurrency}{safeNumber(possibleSavings).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <p className="mt-1 text-xs text-gray-500">if reduced by 1 hour/day</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <p className="text-xs font-semibold text-gray-500">Usage pattern</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-gray-800">{coolingInsight}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <p className="text-xs font-semibold text-gray-500">Quick action</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-gray-800">{savingsTip}</p>
              </div>
            </div>

          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-gray-600">
              Add at least one appliance with wattage, hours, and days to unlock top-usage insights, possible savings, and appliance comparisons.
            </div>
          )}

          {safeNumber(actualBill) > 0 && topAppliance?.name && (
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white/80 p-4">
              <p className="text-xs font-semibold text-gray-500">Bill check</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{billComparisonInsight}</p>
            </div>
          )}
        </div>

        {topAppliances.length > 0 && (
          <div className="mb-5 p-5 md:px-5 md:py-4 rounded-3xl bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06]">
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

        <div className="mb-5 p-5 md:px-5 md:py-4 rounded-3xl bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06]">
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
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
              >
                <Share2 size={16} strokeWidth={2.2} />
                Share estimate
              </button>

              <button
                onClick={copyEstimateLink}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
              >
                <Copy size={16} strokeWidth={2.2} />
                {shareCopied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-5 p-5 md:px-5 md:py-4 rounded-3xl bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06]">
          <h2 className="font-black text-xl mb-2">Energy Audit Report</h2>

          <p className="text-sm opacity-70 mb-2">
            Optionally add your name and address before downloading your report.
          </p>

          <p className="mb-4 text-xs leading-relaxed text-gray-500">
            Your name and address are only used to generate the PDF on your device and are not sent to our server.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">
                Name for Report
              </span>

              <input
                type="text"
                className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                placeholder="Enter your name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">
                Address for Report
              </span>

              <input
                type="text"
                className="w-full p-4 rounded-2xl border border-gray-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                placeholder="Enter your address"
                value={reportAddress}
                onChange={(e) => setReportAddress(e.target.value)}
              />
            </label>
          </div>

          <button
            onClick={downloadPDF}
            className="mt-4 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            Download Energy Audit Report
          </button>
        </div>



        <div className="mt-8 mb-10 md:mt-10 md:mb-12 rounded-3xl bg-[#f2fbf6] p-5 md:px-5 md:py-4 text-black shadow-sm ring-1 ring-emerald-900/[0.07] transition-all duration-200 hover:shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-black text-xl mb-2">
                <Coffee size={19} className="text-emerald-700" />
                Support Watts My Bill?
              </h2>

              <p className="text-sm opacity-70">
                This tool is free to use. If it helped you understand your
                electricity bill, you may support the project.
              </p>
            </div>

            <button
              onClick={() => setShowDonate(!showDonate)}
              className="self-start px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
            >
              {showDonate ? "Hide" : "Support"}
            </button>
          </div>

          {showDonate && (
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              <div className="rounded-3xl bg-white/86 p-5 shadow-sm ring-1 ring-emerald-900/[0.06]">
                <img
                  src="/Gcash-qr.jpg"
                  alt="Gcash QR"
                  className="w-52 h-52 object-contain rounded-2xl mx-auto"
                />

                <h3 className="font-bold text-lg mt-4">
                  GCash
                </h3>

                <p className="text-xs opacity-50 mt-3">
                  Scan using GCash or InstaPay-supported banking apps.
                </p>
              </div>

              <div className="rounded-3xl bg-white/86 p-5 shadow-sm ring-1 ring-emerald-900/[0.06]">
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

                <a
                  href="https://paypal.me/wattsmybill"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
                >
                  paypal.me/wattsmybill
                </a>
              </div>
            </div>
          )}

          <p className="text-xs opacity-50 mt-4">
            Your support helps keep Watts My Bill? free and improving.
          </p>
        </div>



        <section className="mb-4 mt-0 rounded-3xl bg-[#fbfaf6] p-5 md:px-5 md:py-4 text-black shadow-sm ring-1 ring-amber-900/[0.05]">
          <h2 className="text-xl font-black leading-tight">
            Electricity Bill Usage Calculator
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Watts My Bill? is your friendly tool that helps estimate monthly
            electricity costs based on appliance wattage, quantity, usage, hours, 
            days per month, and electricity provider rates.
          </p>

          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Use it to understand how appliances such as air-conditioning units,
            refrigerators, lighting, computers, heaters, and kitchen appliances
            may contribute to your electricity bill.
          </p>
        </section>

        <footer className="mb-24 rounded-3xl bg-[#f7f8f8] p-5 text-black shadow-sm ring-1 ring-emerald-950/[0.06] md:px-5 md:py-5">
          <div className="grid gap-6 md:grid-cols-[1fr_minmax(320px,0.72fr)] md:items-start">
            <div>
              <p className="text-lg font-black tracking-tight">Watts My Bill?</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                Understand Your Electricity Bill
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
                Estimate appliance energy costs and understand your electricity bill.
                For guidance only; not affiliated with any utility provider.
              </p>
            </div>

            <div className="grid gap-3 md:text-right">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">Contact</p>
                <a
                  href="mailto:hello@wattsmybill.app"
                  className="mt-1 inline-block text-[13px] font-bold text-emerald-700 hover:underline"
                >
                  hello@wattsmybill.app
                </a>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">Other Information</p>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
                  {INFO_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() =>
                        setActiveInfoPage(
                          activeInfoPage === section.id ? null : section.id
                        )
                      }
                      className={`text-[13px] font-semibold transition-colors duration-200 hover:text-emerald-700 hover:underline hover:underline-offset-4 ${
                        activeInfoPage === section.id
                          ? "text-emerald-700 underline underline-offset-4"
                          : "text-slate-600"
                      }`}
                    >
                      {section.title.replace("Watts My Bill?", "").trim()}
                    </button>
                  ))}
                </div>
              </div>
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

          <div className="mt-6 border-t border-gray-200 pt-4 text-xs font-semibold text-gray-500">
            © 2026 Watts My Bill? All rights reserved.
          </div>

          {pendingHouseholdPreset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-[#f7f8f8] p-5 text-black shadow-2xl ring-1 ring-white/20">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Household preset action
                </p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-gray-950">
                  You already have appliances listed.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Do you want to replace your current appliance list with the {pendingHouseholdPreset.name} preset, or add this preset to your existing list?
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm text-gray-700">
                <span className="font-bold text-gray-950">
                  {pendingHouseholdPreset.icon} {pendingHouseholdPreset.name}
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  ~{calculatePresetKwh(pendingHouseholdPreset).toFixed(0)} kWh/month • {pendingHouseholdPreset.appliances.length} appliances
                </span>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => applyHouseholdPreset(pendingHouseholdPreset, "replace")}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
                >
                  Replace list
                </button>

                <button
                  onClick={() => applyHouseholdPreset(pendingHouseholdPreset, "add")}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md active:scale-[0.98]"
                >
                  Add to list
                </button>

                <button
                  onClick={() => setPendingHouseholdPreset(null)}
                  className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        </footer>

      </div>


      {showBackToEstimate && (
        <button
          type="button"
          onClick={() =>
            heroSectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            })
          }
          className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-1.5 rounded-full border border-emerald-200/25 bg-white/62 px-3 py-1.5 text-[11px] font-bold text-emerald-900/72 shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/86 hover:text-emerald-950"
          aria-label="Back to top"
        >
          <ArrowUp size={14} strokeWidth={2.4} />
          Back to top
        </button>
      )}
    </div>
  );
  
}