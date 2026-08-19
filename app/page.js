"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun, RotateCcw, Share2, Copy, BarChart3, Calculator, Gamepad2, Home, CheckCircle2, Coffee, ArrowUp, X, SearchCheck, ChevronDown, ChevronLeft, ChevronRight, BookmarkPlus, Trash2, RotateCw, SlidersHorizontal } from "lucide-react";

import { COUNTRIES } from "./data/countries";
import { PRESETS } from "./data/appliances";
import { HOUSEHOLD_PRESETS } from "./data/householdPresets";
import { getRateReference } from "./data/rateReferences";
import { calculateTariffEstimate } from "./lib/tariff";
import { readTheme, writeTheme } from "./lib/theme";
import { buildShareUrl, readSetupFromUrl } from "./lib/shareState";
import AdSlot from "./components/AdSlot";
import { INFO_SECTIONS } from "./data/infoSections";

const DEFAULT_APPLIANCE = {
  name: "",
  watts: "",
  quantity: 1,
  hours: "",
  days: "",
  // Duty is deliberately absent rather than 1: resolveDuty falls back to a
  // lookup by appliance name, and a default here would short-circuit it, so a
  // hand-typed fridge would be costed at full nameplate draw while the same
  // appliance added from the catalogue got its duty cycle.
};

/** Duty is a fraction of 1; anything outside that is treated as "always on". */
function safeDuty(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= 1 ? number : 1;
}

/** Duty factors keyed by appliance name, taken from the catalogue. */
const DUTY_BY_NAME = new Map(
  PRESETS.filter((preset) => preset.duty).map((preset) => [preset.name.toLowerCase(), preset.duty])
);

/**
 * Resolves an appliance's duty factor.
 *
 * Looking it up by name rather than requiring every row to carry the field
 * means household presets, hand-typed entries and sessions saved before duty
 * existed all get the same treatment, without the factor having to be
 * duplicated into each data file where it could silently fall out of step.
 */
function resolveDuty(item) {
  // Only a genuine duty cycle — below 1 — is worth honouring on the row itself.
  // A stored 1 means either "always on" or the old default that used to be
  // written into every appliance, and sessions saved with it are still out
  // there; treating it as unset lets the name lookup correct them on load
  // rather than needing a migration, and lands on 1 anyway when nothing matches.
  const stored = Number(item?.duty);
  if (Number.isFinite(stored) && stored > 0 && stored < 1) return stored;
  return DUTY_BY_NAME.get(String(item?.name || "").trim().toLowerCase()) ?? 1;
}

const LOGO_PATH = "/logo-v2.png";
const PROVIDER_RATE_GUIDE_PATH = "/provider-rate-guide.png";
const WATTAGE_GUIDE_PATH = "/wattage-guide.png";
const COUNTRY_PLACEHOLDER_NAME = "Select your country";
/** Holds the visitor's own estimate while a shared link is being viewed. */
const PRIOR_SESSION_KEY = "watts-my-bill-prior-session";

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

function cleanCappedNumberInput(value, max, { allowZero = true } = {}) {
  const cleanedValue = cleanNonNegativeInput(value, { allowZero });

  if (cleanedValue === "") return "";

  const number = Number(cleanedValue);

  if (!Number.isFinite(number)) return "";
  if (number > max) return String(max);

  return cleanedValue;
}

function cleanDigitCappedNumberInput(value, maxDigits, { allowZero = true } = {}) {
  const cleanedValue = cleanNonNegativeInput(value, { allowZero });

  if (cleanedValue === "") return "";

  const [wholePart = "", decimalPart] = String(cleanedValue).split(".");
  const cappedWholePart = wholePart.slice(0, maxDigits);

  return decimalPart !== undefined
    ? `${cappedWholePart}.${decimalPart}`
    : cappedWholePart;
}


function calculatePresetKwh(preset) {
  return preset.appliances.reduce((sum, item) => {
    const watts = safeNumber(item.watts);
    const quantity = safePositiveNumber(item.quantity);
    const hours = safeNumber(item.hours);
    const days = safeNumber(item.days);

    return sum + (watts * quantity * hours * days * resolveDuty(item)) / 1000;
  }, 0);
}

function summarizePresetAppliances(preset) {
  return preset.appliances
    .slice(0, 6)
    .map((item) => `${item.quantity || 1} ${item.name}`)
    .join(" • ");
}

function getApplianceGuidePath(name = "", category = "") {
  const searchable = `${name} ${category}`.toLowerCase();
  if (/air.?con|air conditioner|fan|cooling/.test(searchable)) {
    return "/learn/fan-vs-air-conditioner-electricity-cost";
  }
  return "/learn/how-much-does-an-appliance-cost-to-run";
}

function getPresetTypeLabel(preset) {
  const name = preset.name.toLowerCase();

  if (name.includes("studio")) return "Starter home";
  if (name.includes("condo")) return "Condo setup";
  if (name.includes("house")) return "Family home";

  return "Home preset";
}


function getProviderExample(countryName = "") {
  const normalized = countryName.toLowerCase();

  const examples = [
    { match: "philippines", provider: "Meralco" },
    { match: "united states", provider: "PG&E or your local utility" },
    { match: "usa", provider: "PG&E or your local utility" },
    { match: "united kingdom", provider: "Octopus Energy or British Gas" },
    { match: "uk", provider: "Octopus Energy or British Gas" },
    { match: "australia", provider: "AGL or Origin Energy" },
    { match: "japan", provider: "TEPCO or Kansai Electric" },
    { match: "poland", provider: "PGE or Tauron" },
    { match: "canada", provider: "Hydro One or BC Hydro" },
    { match: "new zealand", provider: "Meridian or Contact Energy" },
    { match: "singapore", provider: "SP Group" },
    { match: "india", provider: "Tata Power or your local DISCOM" },
    { match: "malaysia", provider: "TNB" },
    { match: "indonesia", provider: "PLN" },
    { match: "thailand", provider: "MEA or PEA" },
    { match: "vietnam", provider: "EVN" },
    { match: "south africa", provider: "Eskom" },
    { match: "mexico", provider: "CFE" },
    { match: "brazil", provider: "Enel or your local utility" },
    { match: "united arab emirates", provider: "DEWA or ADDC" },
    { match: "uae", provider: "DEWA or ADDC" }
  ];

  return examples.find((item) => normalized.includes(item.match))?.provider || "";
}


function getWattageGuide(applianceName = "", category = "") {
  const name = applianceName.toLowerCase();
  const type = category.toLowerCase();

  if (name.includes("aircon") || name.includes("air-conditioning")) {
    return "Aircon use can vary a lot. Inverter units may use less after cooling the room, while non-inverter units cycle on and off. Preset watts are starting estimates — adjust using your unit label for better accuracy.";
  }

  if (name.includes("refrigerator") || name.includes("freezer")) {
    return "Refrigerator and freezer wattage cycles on and off during the day, so actual average use may be lower than the rated watts.";
  }

  if (name.includes("induction") || name.includes("electric stove") || name.includes("electric range")) {
    return "Rated watts show maximum power. Actual use depends on heat level, cooking mode, pan size, and cooking time.";
  }

  if (name.includes("microwave")) {
    return "Use the input wattage if available, since output wattage may be lower than the actual electricity used.";
  }

  if (name.includes("washing")) {
    return "Actual use can vary depending on wash mode, water heating, spin cycle, and load size.";
  }

  if (name.includes("dryer")) {
    return "Dryers use high wattage, but actual cost depends heavily on cycle length and how often you use them.";
  }

  if (name.includes("desktop") || name.includes("gaming pc")) {
    return "Power supply wattage is usually the maximum capacity, not normal everyday usage. Actual use depends on workload, parts, and idle time.";
  }

  if (name.includes("laptop")) {
    return "Charger wattage is the maximum output. Actual use may be lower depending on workload, battery level, and charging.";
  }

  if (name.includes("water heater") || name.includes("shower heater")) {
    return "Water heaters use high wattage. Even short usage times can affect electricity cost.";
  }

  if (name.includes("electric fan") || name.includes("ceiling fan")) {
    return "Fan wattage is usually easier to estimate, but actual use can change depending on speed setting.";
  }

  if (name.includes("tv") || name.includes("television")) {
    return "TV wattage depends on size and screen type. Check the model label or manual for a better estimate.";
  }

  if (name.includes("led bulb") || name.includes("lighting") || type.includes("lighting")) {
    return "Bulb wattage is usually printed on the bulb or box. Use quantity for multiple bulbs.";
  }

  if (name.includes("charger")) {
    return "Charger wattage is usually the maximum output. Actual use may be lower depending on the device and charging state.";
  }

  if (name.includes("router") || name.includes("modem") || name.includes("wifi")) {
    return "Routers and modems are usually low power. Check the adapter label for the best estimate.";
  }

  if (name.includes("speaker") || name.includes("amplifier") || name.includes("sound system") || name.includes("subwoofer") || name.includes("karaoke") || type.includes("audio") || type.includes("sound system")) {
    return "Audio equipment use can change with volume and setup. If you use speakers, an amplifier, or a subwoofer together, estimate the whole setup.";
  }

  if (name.includes("kettle") || name.includes("oven") || name.includes("stove") || name.includes("range")) {
    return "Heating appliances often show maximum wattage. Actual use depends on heat setting and usage time.";
  }

  return "Preset watts are starting estimates. For better accuracy, use your appliance label or adjust based on your normal use.";
}

function getApplianceInsight(applianceName = "", category = "") {
  const name = applianceName.toLowerCase();
  const type = category.toLowerCase();

  if (name.includes("aircon") || name.includes("air-conditioning")) {
    return "Air-conditioning often uses the most electricity. For a better estimate, check if it is inverter or non-inverter, confirm the HP size, and use the wattage on the unit label.";
  }

  if (name.includes("refrigerator") || name.includes("freezer")) {
    return "Refrigerators are plugged in all day, but they turn on and off to keep the temperature steady. If the estimate feels high, check the energy label or model page.";
  }

  if (name.includes("tv") || name.includes("television")) {
    return "TV wattage changes by size and screen type. A 32-inch LED TV can use much less than a 55-inch Smart TV or OLED TV, so checking the exact model can help.";
  }

  if (name.includes("desktop") || name.includes("gaming pc")) {
    return "Computers can vary a lot. Office use may be moderate, while gaming can use much more electricity. Treat the power supply number as a maximum, not the normal use.";
  }

  if (name.includes("speaker") || name.includes("amplifier") || name.includes("sound system") || name.includes("subwoofer") || name.includes("karaoke") || type.includes("audio") || type.includes("sound system")) {
    return "Audio equipment can use more or less electricity depending on volume and setup. If you use speakers, an amplifier, or a subwoofer together, estimate the whole setup.";
  }

  if (name.includes("dryer") || name.includes("kettle") || name.includes("oven") || name.includes("microwave") || name.includes("induction") || name.includes("stove") || name.includes("range")) {
    return "This appliance can use a lot of electricity. Even short use can add up, so accurate hours and days matter here.";
  }

  if (name.includes("led bulb") || name.includes("lighting") || type.includes("lighting")) {
    return "Lighting is usually easy to estimate. Use the quantity field for multiple bulbs, then enter the wattage printed on one bulb.";
  }

  return "For a more accurate estimate, update the wattage using the appliance label, adapter, manual, or official product page.";
}


function getPersonalizedSavingTip(applianceName = "", category = "", savingsText = "", periodLabel = "month", reductionLabel = "1 hour/day") {
  const name = applianceName.toLowerCase();
  const type = category.toLowerCase();

  if (name.includes("aircon") || name.includes("air-conditioning") || type.includes("cooling")) {
    return `Try raising the temperature slightly, cleaning the filter, or reducing ${applianceName} by ${reductionLabel}. Possible saving: ${savingsText}/${periodLabel}.`;
  }

  if (name.includes("refrigerator") || name.includes("freezer")) {
    return `Check the door seal, avoid opening it too often, and keep airflow clear around ${applianceName}. Possible saving: ${savingsText}/${periodLabel}.`;
  }

  if (name.includes("dryer")) {
    return `Use spin-dry first or air-dry some loads to reduce ${applianceName} usage. Possible saving from ${reductionLabel} less use: ${savingsText}/${periodLabel}.`;
  }

  if (name.includes("induction") || name.includes("cooker") || name.includes("kettle") || name.includes("oven") || name.includes("microwave")) {
    return `Use the right heat level, cover pots when possible, and avoid longer cooking time on ${applianceName}. Possible saving from ${reductionLabel} less use: ${savingsText}/${periodLabel}.`;
  }

  if (name.includes("desktop") || name.includes("gaming pc") || name.includes("laptop") || type.includes("computer")) {
    return `Use sleep mode when idle and reduce heavy-use hours on ${applianceName}. Possible saving from ${reductionLabel} less use: ${savingsText}/${periodLabel}.`;
  }

  if (name.includes("led bulb") || name.includes("lighting") || type.includes("lighting")) {
    return `Turn off unused lights or group them by room. Possible saving from reducing ${applianceName} by ${reductionLabel}: ${savingsText}/${periodLabel}.`;
  }

  return `Try reducing ${applianceName} by ${reductionLabel} or adjusting how often it runs. Possible saving: ${savingsText}/${periodLabel}.`;
}





function loadImageAsDataUrl(src) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const image = new window.Image();
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
    <div className="flex items-center gap-1 md:gap-1.5">
      <div className="w-[46px] h-[46px] md:w-[54px] md:h-[54px] flex items-center justify-center overflow-hidden shrink-0">
        {logoFailed ? (
          <span aria-hidden="true" className="text-3xl">💡</span>
        ) : (
          <Image
            src={LOGO_PATH}
            alt="Watts My Bill? logo"
            width={54}
            height={55}
            priority
            onError={() => setLogoFailed(true)}
            className="h-auto w-full object-contain scale-100"
          />
        )}
      </div>

      <div className="min-w-0">
        <h1 className={`m-0 font-bold text-[1.55rem] min-[390px]:text-[1.65rem] sm:text-[1.92rem] md:text-[2.12rem] tracking-[-0.035em] leading-none drop-shadow-none ${darkMode ? "text-white" : "text-gray-950"}`}>
          Watts My Bill?
        </h1>

        <div className={`text-xs md:text-sm mt-1 ${darkMode ? "text-gray-300/90" : "text-gray-600/90"}`}>
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
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReducedMotion || jumpSize > largeJumpThreshold) {
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
  const [countrySearchTerm, setCountrySearchTerm] = useState(
    COUNTRIES[0]?.name === COUNTRY_PLACEHOLDER_NAME ? "" : COUNTRIES[0]?.name || ""
  );
  const [showCountryOptions, setShowCountryOptions] = useState(false);
  const [countryOptionIndex, setCountryOptionIndex] = useState(-1);
  const [darkMode, setDarkMode] = useState(false);
  const [actualBill, setActualBill] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [billingDays, setBillingDays] = useState("30");
  const [fixedCharge, setFixedCharge] = useState("");
  const [showAdvancedTariff, setShowAdvancedTariff] = useState(false);
  const [tariffMode, setTariffMode] = useState("simple");
  const [peakRate, setPeakRate] = useState("");
  const [shoulderRate, setShoulderRate] = useState("");
  const [offPeakRate, setOffPeakRate] = useState("");
  const [peakShare, setPeakShare] = useState("35");
  const [shoulderShare, setShoulderShare] = useState("0");
  const [tierLimit, setTierLimit] = useState("100");
  const [tierOneRate, setTierOneRate] = useState("");
  const [tierTwoRate, setTierTwoRate] = useState("");
  const [dailySupplyCharge, setDailySupplyCharge] = useState("");
  const [taxPercent, setTaxPercent] = useState("");
  const [solarExportKwh, setSolarExportKwh] = useState("");
  const [solarExportRate, setSolarExportRate] = useState("");
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioNotice, setScenarioNotice] = useState("");
  const [billedKwh, setBilledKwh] = useState("");
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showBillDetective, setShowBillDetective] = useState(false);
  const [heroInsightSlide, setHeroInsightSlide] = useState(0);
  const [previousBill, setPreviousBill] = useState("");
  const [previousBilledKwh, setPreviousBilledKwh] = useState("");
  const [previousBillingDays, setPreviousBillingDays] = useState("30");
  const [previousFixedCharge, setPreviousFixedCharge] = useState("");
  const [customCountryName, setCustomCountryName] = useState("");
  const [customCurrency, setCustomCurrency] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportAddress, setReportAddress] = useState("");
  const [pdfDownload, setPdfDownload] = useState(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showDonate, setShowDonate] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [showAllHouseholdPresets, setShowAllHouseholdPresets] = useState(false);
  const [selectedHouseholdPreset, setSelectedHouseholdPreset] = useState(null);
  const [pendingHouseholdPreset, setPendingHouseholdPreset] = useState(null);
  const [showWattageHelp, setShowWattageHelp] = useState(false);
  const [showWattageGuideImage, setShowWattageGuideImage] = useState(false);
  const [showEstimateHelp, setShowEstimateHelp] = useState(false);
  const [showProviderRateGuide, setShowProviderRateGuide] = useState(false);
  const [activeInfoPage, setActiveInfoPage] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  // Set when a link replaced an estimate the visitor had already built, so the
  // replacement can be undone.
  const [replacedOwnEstimate, setReplacedOwnEstimate] = useState(false);
  const [showBackToEstimate, setShowBackToEstimate] = useState(false);
  const [showLiveEstimateBar, setShowLiveEstimateBar] = useState(false);
  const [showWattageEducation, setShowWattageEducation] = useState(false);
  const [showSimpleTerms, setShowSimpleTerms] = useState(false);
  const [showAllAddedAppliances, setShowAllAddedAppliances] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const heroSectionRef = useRef(null);
  const inputSectionRef = useRef(null);
  const insightsSectionRef = useRef(null);
  const howEstimatesSectionRef = useRef(null);
  const applianceSectionRef = useRef(null);
  const householdPresetSectionRef = useRef(null);
  const quickAddSectionRef = useRef(null);
  const footerRef = useRef(null);
  const countryDropdownRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const pdfDownloadUrlRef = useRef("");

  const [appliances, setAppliances] = useState([DEFAULT_APPLIANCE]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (pdfDownloadUrlRef.current) URL.revokeObjectURL(pdfDownloadUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const closeOverlays = (event) => {
      if (event.key !== "Escape") return;
      setShowMobileMenu(false);
      setShowCountryOptions(false);
      setActiveInfoPage(null);
      setShowDonate(false);
      setShowInstallHelp(false);
      setPendingHouseholdPreset(null);
      setShowWattageGuideImage(false);
      setShowProviderRateGuide(false);
    };

    window.addEventListener("keydown", closeOverlays);
    return () => window.removeEventListener("keydown", closeOverlays);
  }, []);

  useEffect(() => {
    const hasBlockingOverlay = Boolean(
      activeInfoPage ||
      showDonate ||
      showInstallHelp ||
      pendingHouseholdPreset ||
      showWattageGuideImage ||
      showProviderRateGuide
    );
    if (!hasBlockingOverlay) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeInfoPage, pendingHouseholdPreset, showDonate, showInstallHelp, showProviderRateGuide, showWattageGuideImage]);

  // Restores the saved session, and sets hasLoaded, which gates the theme, the
  // URL setup and every save back to storage. This ran inside
  // requestAnimationFrame, which schedules against paint — and a hidden tab
  // never paints. Opening the app in a background tab therefore restored
  // nothing: no saved appliances, and no link contents either, because the
  // setup effect waits on hasLoaded. It stayed empty until the tab was focused.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    {
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
          setBillingDays(parsed.billingDays || "30");
          setFixedCharge(parsed.fixedCharge || "");
          setShowAdvancedTariff(parsed.showAdvancedTariff || false);
          setTariffMode(parsed.tariffMode || "simple");
          setPeakRate(parsed.peakRate || "");
          setShoulderRate(parsed.shoulderRate || "");
          setOffPeakRate(parsed.offPeakRate || "");
          setPeakShare(parsed.peakShare || "35");
          setShoulderShare(parsed.shoulderShare || "0");
          setTierLimit(parsed.tierLimit || "100");
          setTierOneRate(parsed.tierOneRate || "");
          setTierTwoRate(parsed.tierTwoRate || "");
          setDailySupplyCharge(parsed.dailySupplyCharge || "");
          setTaxPercent(parsed.taxPercent || "");
          setSolarExportKwh(parsed.solarExportKwh || "");
          setSolarExportRate(parsed.solarExportRate || "");
          setBilledKwh(parsed.billedKwh || "");
          setShowBillDetails(parsed.showBillDetails || false);
          setShowBillDetective(parsed.showBillDetective || false);
          setPreviousBill(parsed.previousBill || "");
          setPreviousBilledKwh(parsed.previousBilledKwh || "");
          setPreviousBillingDays(parsed.previousBillingDays || "30");
          setPreviousFixedCharge(parsed.previousFixedCharge || "");
          setCustomCountryName(parsed.customCountryName || "");
          setCustomCurrency(parsed.customCurrency || "");
          setReportName(parsed.reportName || "");
          setReportAddress(parsed.reportAddress || "");
          // darkMode is deliberately not restored here — the theme is shared
          // with the Learning Hub and is resolved from THEME_KEY below.
          setSearchTerm(parsed.searchTerm || "");
          setSelectedCategory(parsed.selectedCategory || "All");
          setShowAllPresets(parsed.showAllPresets || false);
          setShowAllHouseholdPresets(parsed.showAllHouseholdPresets || false);
          setSelectedHouseholdPreset(parsed.selectedHouseholdPreset || null);
          setShowWattageHelp(parsed.showWattageHelp || false);
          setShowEstimateHelp(false);
          setShowProviderRateGuide(false);

          if (parsed.country?.name) {
            const foundCountry = COUNTRIES.find(
              (c) => c.name === parsed.country.name
            );

            if (foundCountry) {
              setCountry(foundCountry);
              setCountrySearchTerm(
                foundCountry.name === COUNTRY_PLACEHOLDER_NAME ? "" : foundCountry.name
              );
            }
          }
        }

        const storedScenarios = localStorage.getItem("watts-my-bill-scenarios");
        if (storedScenarios) {
          const parsedScenarios = JSON.parse(storedScenarios);
          if (Array.isArray(parsedScenarios)) setSavedScenarios(parsedScenarios.slice(0, 3));
        }
      } catch {
        localStorage.removeItem("watts-my-bill-data");
        localStorage.removeItem("watts-my-bill-scenarios");
        localStorage.removeItem(PRIOR_SESSION_KEY);
      }

      setHasLoaded(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // The theme belongs to the visitor, not to a route. The root layout has
  // already stamped it on <html>; adopt that, then keep the two in step so
  // walking into the Learning Hub doesn't turn the lights back on.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDarkMode(readTheme() === "dark"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    writeTheme(darkMode ? "dark" : "light");
  }, [darkMode, hasLoaded]);

  // A link that carries a setup — a shared estimate, a rate chosen in the Rate
  // Library, an appliance picked from a guide — is applied once the saved
  // session has been restored, so the link wins over whatever was here before.
  // Read from window rather than useSearchParams: this page is prerendered, and
  // that hook would force the whole tree to render on the client instead.
  const urlSetupApplied = useRef(false);

  useEffect(() => {
    if (!hasLoaded || urlSetupApplied.current) return;

    const setup = readSetupFromUrl(window.location.search);
    if (!setup) {
      urlSetupApplied.current = true;
      return;
    }

    // A shared link overwrites whatever is on screen, and the save effect then
    // writes that over the visitor's stored session — so someone who opens a
    // friend's estimate would lose their own with no way back. Keep a copy
    // first and offer to put it back.
    let priorSession = null;
    try {
      const raw = localStorage.getItem(PRIOR_SESSION_KEY) || localStorage.getItem("watts-my-bill-data");
      const parsed = raw ? JSON.parse(raw) : null;
      const hasRealWork = parsed?.appliances?.some((item) => item?.name || item?.watts);
      if (hasRealWork) {
        priorSession = parsed;
        localStorage.setItem(PRIOR_SESSION_KEY, JSON.stringify(parsed));
      }
    } catch {
      priorSession = null;
    }

    // Applied directly, not deferred through requestAnimationFrame. rAF
    // schedules against paint and a hidden tab never paints, so a link opened
    // in a background tab — middle-clicked from a guide, "open in new tab" from
    // a message — landed on an empty calculator and stayed empty until the tab
    // was focused. That silently emptied every shared estimate, every Rate
    // Library country link and every guide prefill. Verified with
    // document.hidden true: the callback did not run within a second.
    /* eslint-disable react-hooks/set-state-in-effect */
    {
      urlSetupApplied.current = true;
      if (priorSession) setReplacedOwnEstimate(true);

      if (setup.country) {
        const match = COUNTRIES.find(
          (item) => item.name.toLowerCase() === setup.country.toLowerCase()
        );
        if (match) {
          setCountry(match);
          setCountrySearchTerm(match.name === COUNTRY_PLACEHOLDER_NAME ? "" : match.name);
        }
      }

      if (setup.customRate) setCustomRate(setup.customRate);
      if (setup.billingDays) setBillingDays(setup.billingDays);
      if (setup.fixedCharge) setFixedCharge(setup.fixedCharge);
      if (setup.actualBill) setActualBill(setup.actualBill);
      if (setup.billedKwh) setBilledKwh(setup.billedKwh);

      if (setup.appliances?.length) {
        setAppliances(setup.appliances.map((item) => ({ ...DEFAULT_APPLIANCE, ...item })));
      }

      // A single named appliance arrives from the Learning Hub when someone
      // searched for something the guides don't cover but the catalogue does.
      if (setup.appliance) {
        const preset = PRESETS.find(
          (item) => item.name.toLowerCase() === setup.appliance.toLowerCase()
        );
        if (preset) {
          setAppliances((current) => {
            const existing = current.filter((item) => item.name || item.watts);
            return [
              ...existing,
              {
                ...DEFAULT_APPLIANCE,
                name: preset.name,
                watts: String(preset.watts),
                hours: String(preset.hours),
                days: String(preset.days),
                duty: resolveDuty(preset),
              },
            ];
          });
        }
      }

      inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;

    localStorage.setItem(
      "watts-my-bill-data",
      JSON.stringify({
        appliances,
        actualBill,
        customRate,
        billingDays,
        fixedCharge,
        showAdvancedTariff,
        tariffMode,
        peakRate,
        shoulderRate,
        offPeakRate,
        peakShare,
        shoulderShare,
        tierLimit,
        tierOneRate,
        tierTwoRate,
        dailySupplyCharge,
        taxPercent,
        solarExportKwh,
        solarExportRate,
        billedKwh,
        showBillDetails,
        showBillDetective,
        previousBill,
        previousBilledKwh,
        previousBillingDays,
        previousFixedCharge,
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
    billingDays,
    fixedCharge,
    showAdvancedTariff,
    tariffMode,
    peakRate,
    shoulderRate,
    offPeakRate,
    peakShare,
    shoulderShare,
    tierLimit,
    tierOneRate,
    tierTwoRate,
    dailySupplyCharge,
    taxPercent,
    solarExportKwh,
    solarExportRate,
    billedKwh,
    showBillDetails,
    showBillDetective,
    previousBill,
    previousBilledKwh,
    previousBillingDays,
    previousFixedCharge,
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
    if (!hasLoaded) return;
    localStorage.setItem("watts-my-bill-scenarios", JSON.stringify(savedScenarios.slice(0, 3)));
  }, [hasLoaded, savedScenarios]);

  useEffect(() => {
    const handleScroll = () => {
      const footerTop = footerRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const householdPresetRect = householdPresetSectionRef.current?.getBoundingClientRect();
      const quickAddRect = quickAddSectionRef.current?.getBoundingClientRect();
      const applianceBuilderRect = applianceSectionRef.current?.getBoundingClientRect();
      const howEstimatesElement = howEstimatesSectionRef.current;
      const howEstimatesRect = howEstimatesElement?.getBoundingClientRect();
      const isNearFooter = footerTop < window.innerHeight - 24;
      const isMobile = window.innerWidth < 768;
      const isHouseholdPresetVisibleOnMobile =
        isMobile &&
        householdPresetRect &&
        householdPresetRect.bottom > window.innerHeight * 0.08 &&
        householdPresetRect.top < window.innerHeight * 0.92;
      const isQuickAddVisibleOnMobile =
        isMobile &&
        quickAddRect &&
        quickAddRect.bottom > window.innerHeight * 0.08 &&
        quickAddRect.top < window.innerHeight * 0.92;
      const hasReachedApplianceBuilderOnMobile =
        !isMobile ||
        (applianceBuilderRect && applianceBuilderRect.top < window.innerHeight * 0.46);
      const hasReachedLearningArea =
        Boolean(howEstimatesRect) && howEstimatesRect.top < window.innerHeight * 0.92;

      setShowBackToEstimate(window.scrollY > 1180);
      setShowLiveEstimateBar(
        window.scrollY > 520 &&
        hasReachedApplianceBuilderOnMobile &&
        !isNearFooter &&
        !hasReachedLearningArea &&
        !isHouseholdPresetVisibleOnMobile &&
        !isQuickAddVisibleOnMobile
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showCountryOptions) return;
      if (!countryDropdownRef.current) return;

      if (!countryDropdownRef.current.contains(event.target)) {
        const exactCountry = COUNTRIES.find(
          (item) =>
            item.name !== COUNTRY_PLACEHOLDER_NAME &&
            item.name.toLowerCase() === countrySearchTerm.trim().toLowerCase()
        );

        if (exactCountry) {
          const countryChanged = exactCountry.name !== country.name;

          setCountry(exactCountry);
          setCountrySearchTerm(exactCountry.name);

          if (countryChanged) {
            setCustomRate("");
            setCustomCountryName("");
            setCustomCurrency("");
          }
        } else {
          setCountrySearchTerm(
            country.name === COUNTRY_PLACEHOLDER_NAME ? "" : country.name
          );
        }

        setShowCountryOptions(false);
        setCountryOptionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [country, countrySearchTerm, showCountryOptions]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standaloneMode =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    const installedStateFrame = window.requestAnimationFrame(() => {
      setIsAppInstalled(Boolean(standaloneMode));
    });

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPromptEvent(null);
      setShowInstallHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.cancelAnimationFrame(installedStateFrame);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const categories = ["All", ...new Set(PRESETS.map((item) => item.category))];

  const selectableCountries = useMemo(
    () => COUNTRIES.filter((item) => item.name !== COUNTRY_PLACEHOLDER_NAME),
    []
  );

  const filteredCountries = useMemo(() => {
    const query = countrySearchTerm.trim().toLowerCase();

    if (!query) return selectableCountries;

    return selectableCountries.filter((item) =>
      `${item.flag || ""} ${item.name}`.toLowerCase().includes(query)
    );
  }, [countrySearchTerm, selectableCountries]);

  useEffect(() => {
    if (!showCountryOptions || countryOptionIndex < 0) return;
    document.getElementById(`country-option-${countryOptionIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [countryOptionIndex, showCountryOptions]);

  const selectCountry = (selectedCountry) => {
    const countryChanged = selectedCountry.name !== country.name;

    setCountry(selectedCountry);
    setCountrySearchTerm(selectedCountry.name);
    setShowCountryOptions(false);
    setCountryOptionIndex(-1);

    if (countryChanged) {
      setCustomRate("");
      setCustomCountryName("");
      setCustomCurrency("");
    }
  };

  const openCountryOptions = () => {
    const selectedIndex = filteredCountries.findIndex((item) => item.name === country.name);
    setCountryOptionIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setShowCountryOptions(true);
  };

  const handleCountryKeyDown = (event) => {
    if (event.key === "Escape") {
      setShowCountryOptions(false);
      setCountryOptionIndex(-1);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setShowCountryOptions(true);
      setCountryOptionIndex((current) => {
        if (filteredCountries.length === 0) return -1;
        if (event.key === "ArrowDown") return current >= filteredCountries.length - 1 ? 0 : current + 1;
        return current <= 0 ? filteredCountries.length - 1 : current - 1;
      });
      return;
    }

    if (event.key === "Enter" && showCountryOptions && filteredCountries[countryOptionIndex]) {
      event.preventDefault();
      selectCountry(filteredCountries[countryOptionIndex]);
    }
  };

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
  const rateReference = getRateReference(country.name);

  const displayCountry = isOtherCountry
    ? customCountryName || "Other Country"
    : country.name;

  const displayCurrency = isOtherCountry
    ? customCurrency || ""
    : country.currency;

  const providerExample = getProviderExample(displayCountry);

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
        maximumFractionDigits: 1
      })}`;
    }

    if (number >= 1_000) {
      return `${displayCurrency}${number.toLocaleString(undefined, {
        notation: "compact",
        maximumFractionDigits: 2
      })}`;
    }

    return formatCurrency(number);
  };

  const formatSignedCurrency = (value) => {
    const number = Number(value) || 0;
    const prefix = number > 0 ? "+" : number < 0 ? "−" : "";
    return `${prefix}${formatCurrency(Math.abs(number))}`;
  };

  const formatSignedPercent = (value) => {
    const number = Number(value) || 0;
    const prefix = number > 0 ? "+" : number < 0 ? "−" : "";
    return `${prefix}${Math.abs(number).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  };

  const formatCompactNumber = (value, digits = 2) => {
    const number = safeNumber(value);

    if (number >= 1_000_000_000) {
      return number.toLocaleString(undefined, {
        notation: "compact",
        maximumFractionDigits: 1
      });
    }

    if (number >= 1_000) {
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

  const customRateValue = safeNumber(customRate);
  const indicativeRateValue = safeNumber(country.rate);
  const rateWarningType = hasCustomRate && indicativeRateValue > 0
    ? customRateValue > indicativeRateValue * 8
      ? "high"
      : customRateValue > 0 && customRateValue < indicativeRateValue / 20
        ? "low"
        : null
    : null;

  /**
   * What to actually tell someone whose rate looks wrong.
   *
   * The thresholds above are relative to the country default, so they already
   * behave for currencies of very different magnitude — ₫2,050 or Rp1,450 per
   * kWh are normal, not alarming. The advice did not follow: telling a
   * Vietnamese or Indonesian user to check "cents or full currency units" is
   * meaningless, because those currencies are not used with a subunit. Name the
   * country's own typical figure instead, and only mention subunits where a
   * hundredfold slip is genuinely the likely mistake.
   */
  const rateWarningMessage = (() => {
    if (!rateWarningType) return "";

    const ratio = customRateValue / indicativeRateValue;
    const typical = `${displayCurrency}${indicativeRateValue.toLocaleString(undefined, {
      maximumFractionDigits: indicativeRateValue >= 100 ? 0 : 2,
    })}`;
    const opening = `That rate looks ${rateWarningType} for ${country.name}, where bills are typically around ${typical} per kWh.`;

    // A ~100x slip in a currency that is quoted in small units is almost always
    // cents entered as whole units, or the reverse.
    const subunitLikely = indicativeRateValue < 10 && (ratio > 40 || ratio < 1 / 40);
    if (subunitLikely) {
      return `${opening} Check whether your bill shows the price in cents rather than whole ${displayCurrency ? "units" : "currency units"} per kWh.`;
    }

    return `${opening} Check you have used the price per kWh from your own bill, in your own currency, rather than a total or a converted figure.`;
  })();

  const isBlankAppliance = (item) =>
    !String(item.name || "").trim() &&
    !String(item.watts || "").trim() &&
    !String(item.hours || "").trim() &&
    !String(item.days || "").trim() &&
    safePositiveNumber(item.quantity) === 1;

  const hasExistingAppliances = !appliances.every(isBlankAppliance);

  const showAddedFeedback = (index) => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    setHighlightedIndex(index);

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
    localStorage.removeItem("watts-my-bill-scenarios");
    // Clearing means clearing: without this, a stash kept from an earlier
    // shared link would later offer to restore an estimate the visitor had
    // deliberately deleted.
    localStorage.removeItem(PRIOR_SESSION_KEY);
    setReplacedOwnEstimate(false);
    setSavedScenarios([]);
    setCountry(COUNTRIES[0]);
    setCountrySearchTerm(
      COUNTRIES[0]?.name === COUNTRY_PLACEHOLDER_NAME ? "" : COUNTRIES[0]?.name || ""
    );
    setShowCountryOptions(false);
    setActualBill("");
    setCustomRate("");
    setBillingDays("30");
    setFixedCharge("");
    setShowAdvancedTariff(false);
    setTariffMode("simple");
    setPeakRate("");
    setShoulderRate("");
    setOffPeakRate("");
    setPeakShare("35");
    setShoulderShare("0");
    setTierLimit("100");
    setTierOneRate("");
    setTierTwoRate("");
    setDailySupplyCharge("");
    setTaxPercent("");
    setSolarExportKwh("");
    setSolarExportRate("");
    setBilledKwh("");
    setShowBillDetails(false);
    setShowBillDetective(false);
    setPreviousBill("");
    setPreviousBilledKwh("");
    setPreviousBillingDays("30");
    setPreviousFixedCharge("");
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
    setShowWattageGuideImage(false);
    setShowEstimateHelp(false);
    setShowProviderRateGuide(false);
    setActiveInfoPage(null);
    setHighlightedIndex(null);
    setAppliances([{ ...DEFAULT_APPLIANCE }]);
  };

  const addAppliance = () => {
    const newAppliances = [
      { ...DEFAULT_APPLIANCE },
      ...appliances
    ];

    setAppliances(newAppliances);
    showAddedFeedback(0);

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
      duty: resolveDuty(preset),
      wattageGuide: preset.wattageGuide || getWattageGuide(preset.name, preset.category)
    };

    const shouldReplaceBlankRows = appliances.every(isBlankAppliance);
    const newAppliances = shouldReplaceBlankRows
      ? [newAppliance]
      : [newAppliance, ...appliances];

    setAppliances(newAppliances);
    showAddedFeedback(0);

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
    setHighlightedIndex(0);

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

  const applyHouseholdPresetFromPreview = (preset, mode = "replace") => {
    if (mode === "replace" && hasExistingAppliances) {
      setPendingHouseholdPreset(preset);
      return;
    }

    applyHouseholdPreset(preset, mode);
  };

  const addHouseholdPreset = (preset) => {
    setSelectedHouseholdPreset(preset.name);
    setPendingHouseholdPreset(null);
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

  const billPeriodDays = safePositiveNumber(billingDays, 30);
  const billingPeriodMultiplier = billPeriodDays / 30;

  const rawBreakdown = useMemo(() => {
    return appliances.map((a) => {
      const watts = safeNumber(a.watts);
      const quantity = safePositiveNumber(a.quantity);
      const hours = safeNumber(a.hours);
      const days = safeNumber(a.days);

      const monthlyKwh = (watts * quantity * hours * days * resolveDuty(a)) / 1000;
      const kwh = monthlyKwh * billingPeriodMultiplier;

      return { ...a, quantity, kwh };
    });
  }, [appliances, billingPeriodMultiplier]);

  const totalKwh = rawBreakdown.reduce((s, i) => s + i.kwh, 0);
  const {
    usageCost,
    fixedChargeAmount,
    supplyChargeAmount,
    solarCreditAmount,
    taxAmount,
    total: calculatedTotal,
    effectiveEnergyRate: calculatedEffectiveEstimateRate,
    tierProrated,
    scaledTierLimit,
  } = calculateTariffEstimate({
    totalKwh,
    billingDays: billPeriodDays,
    mode: tariffMode,
    simpleRate: activeRate,
    peakRate,
    shoulderRate,
    offPeakRate,
    peakShare,
    shoulderShare,
    tierLimit,
    tierOneRate,
    tierTwoRate,
    fixedCharge,
    dailySupplyCharge,
    taxPercent,
    solarExportKwh,
    solarExportRate,
  });
  const hasValidRateForEstimate = tariffMode === "timeOfUse"
    ? safeNumber(peakRate) > 0 &&
      safeNumber(offPeakRate) > 0 &&
      safeNumber(peakShare) + safeNumber(shoulderShare) <= 100 &&
      (safeNumber(shoulderShare) <= 0 || safeNumber(shoulderRate) > 0)
    : tariffMode === "tiered"
      ? safeNumber(tierOneRate) > 0 && safeNumber(tierTwoRate) > 0
      : safeNumber(activeRate) > 0;
  const isAdvancedRateIncomplete = tariffMode === "timeOfUse"
    ? ((safeNumber(peakRate) > 0) !== (safeNumber(offPeakRate) > 0)) ||
      (safeNumber(shoulderShare) > 0 && safeNumber(shoulderRate) <= 0) ||
      safeNumber(peakShare) + safeNumber(shoulderShare) > 100
    : tariffMode === "tiered"
      ? (safeNumber(tierOneRate) > 0) !== (safeNumber(tierTwoRate) > 0)
      : false;
  const total = isAdvancedRateIncomplete ? 0 : calculatedTotal;
  const effectiveEstimateRate = isAdvancedRateIncomplete ? 0 : calculatedEffectiveEstimateRate;
  const tariffLabel = tariffMode === "timeOfUse"
    ? "Time-of-use"
    : tariffMode === "tiered"
      ? "Tiered rate"
      : "Single rate";
  const breakdown = rawBreakdown.map((item) => ({ ...item, cost: item.kwh * effectiveEstimateRate }));
  const difference = actualBill ? safeNumber(actualBill) - total : 0;

  const topAppliance = [...breakdown]
    .filter((item) => item.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)[0];

  const topAppliances = [...breakdown]
    .filter((item) => item.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, 5);
  const completedApplianceCount = breakdown.filter((item) => item.kwh > 0).length;

  const primaryUsageMix = topAppliances.slice(0, 2).map((item, index) => ({
    label: String(item.name || "").trim() || `Appliance ${index + 1}`,
    kwh: item.kwh,
    share: totalKwh > 0 ? (item.kwh / totalKwh) * 100 : 0,
  }));
  const primaryUsageKwh = primaryUsageMix.reduce((sum, item) => sum + item.kwh, 0);
  const remainingUsageKwh = Math.max(0, totalKwh - primaryUsageKwh);
  const usageMixRows = remainingUsageKwh > totalKwh * 0.005
    ? [...primaryUsageMix, {
        label: completedApplianceCount > 2 ? `Everything else (${completedApplianceCount - 2})` : "Everything else",
        kwh: remainingUsageKwh,
        share: totalKwh > 0 ? (remainingUsageKwh / totalKwh) * 100 : 0,
      }]
    : primaryUsageMix;
  const primaryUsageShare = totalKwh > 0 ? (primaryUsageKwh / totalKwh) * 100 : 0;
  const usageMixSummary = totalKwh <= 0
    ? "Add a household setup to reveal the loads shaping your bill."
    : primaryUsageMix.length > 1
      ? primaryUsageShare >= 70
        ? `Your top two loads make up ${primaryUsageShare.toFixed(0)}% of usage. Focus there first.`
        : `Usage is spread more evenly. Your top two loads make up ${primaryUsageShare.toFixed(0)}%.`
      : `${topAppliance?.name || "One appliance"} currently represents all estimated usage.`;
  const compactUsageMixSummary = totalKwh <= 0
    ? "Add appliances to reveal your usage mix."
    : primaryUsageMix.length > 1
      ? `Top two loads: ${primaryUsageShare.toFixed(0)}% of usage. Focus there first.`
      : `${topAppliance?.name || "One appliance"} represents all usage.`;
  const hasExtraBillItems = fixedChargeAmount > 0 || supplyChargeAmount > 0 || taxAmount > 0 || solarCreditAmount > 0;

  const dailyAverage = total / billPeriodDays;
  const effectiveRateNumerator = safeNumber(actualBill) - fixedChargeAmount;
  const effectiveRate = safeNumber(billedKwh) > 0 && effectiveRateNumerator > 0
    ? effectiveRateNumerator / safeNumber(billedKwh)
    : 0;

  const previousBillValue = safeNumber(previousBill);
  const previousKwhValue = safeNumber(previousBilledKwh);
  const previousDaysValue = safePositiveNumber(previousBillingDays, 30);
  const previousFixedValue = safeNumber(previousFixedCharge);
  const previousVariableSpend = previousBillValue - previousFixedValue;
  const previousEffectiveRate = previousKwhValue > 0 && previousVariableSpend > 0
    ? previousVariableSpend / previousKwhValue
    : 0;
  const enteredCurrentBillValue = safeNumber(actualBill);
  const enteredCurrentKwhValue = safeNumber(billedKwh);
  const hasEnteredCurrentBill = enteredCurrentBillValue > 0 && enteredCurrentKwhValue > 0;
  const usesDashboardEstimateForDetective = !hasEnteredCurrentBill && total > 0 && totalKwh > 0 && hasValidRateForEstimate;
  const currentBillValue = hasEnteredCurrentBill ? enteredCurrentBillValue : usesDashboardEstimateForDetective ? total : 0;
  const currentKwhValue = hasEnteredCurrentBill ? enteredCurrentKwhValue : usesDashboardEstimateForDetective ? totalKwh : 0;
  const currentDetectiveFixedValue = hasEnteredCurrentBill ? fixedChargeAmount : supplyChargeAmount + fixedChargeAmount;
  const currentVariableSpend = currentBillValue - currentDetectiveFixedValue;
  const currentDetectiveEffectiveRate = currentKwhValue > 0 && currentVariableSpend > 0
    ? currentVariableSpend / currentKwhValue
    : 0;
  const hasCurrentDetectiveInputs = currentBillValue > 0 && currentKwhValue > 0;
  const hasPreviousDetectiveInputs = previousBillValue > 0 && previousKwhValue > 0;
  const hasValidDetectiveCharges = currentVariableSpend > 0 && previousVariableSpend > 0;
  const isBillDetectiveReady = hasCurrentDetectiveInputs && hasPreviousDetectiveInputs && hasValidDetectiveCharges;

  const currentKwhPerDay = currentKwhValue > 0 ? currentKwhValue / billPeriodDays : 0;
  const previousKwhPerDay = previousKwhValue > 0 ? previousKwhValue / previousDaysValue : 0;
  const normalizedCurrentKwh = currentKwhPerDay * 30;
  const normalizedPreviousKwh = previousKwhPerDay * 30;
  const normalizedCurrentFixed = (currentDetectiveFixedValue / billPeriodDays) * 30;
  const normalizedPreviousFixed = (previousFixedValue / previousDaysValue) * 30;
  const normalizedCurrentBill = (currentBillValue / billPeriodDays) * 30;
  const normalizedPreviousBill = (previousBillValue / previousDaysValue) * 30;
  const normalizedBillChange = normalizedCurrentBill - normalizedPreviousBill;
  const usageImpact = isBillDetectiveReady
    ? (normalizedCurrentKwh - normalizedPreviousKwh) * previousEffectiveRate
    : 0;
  const rateImpact = isBillDetectiveReady
    ? normalizedCurrentKwh * (currentDetectiveEffectiveRate - previousEffectiveRate)
    : 0;
  const fixedImpact = isBillDetectiveReady
    ? normalizedCurrentFixed - normalizedPreviousFixed
    : 0;
  const usageChangePercent = normalizedPreviousKwh > 0
    ? ((normalizedCurrentKwh - normalizedPreviousKwh) / normalizedPreviousKwh) * 100
    : 0;
  const rateChangePercent = previousEffectiveRate > 0
    ? ((currentDetectiveEffectiveRate - previousEffectiveRate) / previousEffectiveRate) * 100
    : 0;

  const detectiveDrivers = [
    {
      key: "usage",
      label: "energy use",
      impact: usageImpact,
      explanation: usageImpact >= 0
        ? "Higher daily electricity use added the most to the normalized bill."
        : "Lower daily electricity use delivered the largest reduction.",
    },
    {
      key: "rate",
      label: "effective rate",
      impact: rateImpact,
      explanation: rateImpact >= 0
        ? "A higher blended price per kWh added the most to the normalized bill."
        : "A lower blended price per kWh delivered the largest reduction.",
    },
    {
      key: "fixed",
      label: "fixed charges",
      impact: fixedImpact,
      explanation: fixedImpact >= 0
        ? "Higher daily fixed charges added the most to the normalized bill."
        : "Lower daily fixed charges delivered the largest reduction.",
    },
  ];
  const primaryDetectiveDriver = detectiveDrivers.reduce(
    (largest, item) => Math.abs(item.impact) > Math.abs(largest.impact) ? item : largest,
    detectiveDrivers[0]
  );

  const billDetectiveSummary = isBillDetectiveReady
    ? Math.abs(normalizedBillChange) < 0.01
      ? `After adjusting both periods to 30 days, the ${usesDashboardEstimateForDetective ? "current estimate and previous bill are" : "two bills are"} effectively the same.`
      : `After adjusting both periods to 30 days, the ${usesDashboardEstimateForDetective ? "current estimate" : "current bill"} is ${formatCurrency(Math.abs(normalizedBillChange))} ${normalizedBillChange > 0 ? "higher" : "lower"}. ${primaryDetectiveDriver.explanation}`
    : hasCurrentDetectiveInputs
      ? `${usesDashboardEstimateForDetective ? "Your dashboard estimate is ready." : "Your current bill is ready."} Add the previous bill details to reveal the likely driver.`
      : "Add the current bill total and kWh above, then add the previous bill details below to reveal the likely driver.";

  const applyEffectiveRate = () => {
    if (effectiveRate <= 0) return;
    setCustomRate(String(Number(effectiveRate.toFixed(6))));
  };

  const animatedTotal = useAnimatedNumber(total);
  const animatedTotalKwh = useAnimatedNumber(totalKwh);
  const animatedDailyAverage = useAnimatedNumber(dailyAverage);
  const liveEstimateDesktopText = hasValidRateForEstimate
    ? formatCompactCurrency(animatedTotal)
    : country.name === COUNTRY_PLACEHOLDER_NAME
      ? "Select country to calculate"
      : "Add electricity rate";

  const liveEstimateMobileText = hasValidRateForEstimate
    ? formatCompactCurrency(animatedTotal)
    : country.name === COUNTRY_PLACEHOLDER_NAME
      ? "Select country"
      : "Add rate";
  const savingsReductionHours = topAppliance ? Math.min(1, safeNumber(topAppliance.hours)) : 0;
  const savingsReductionLabel = savingsReductionHours >= 1
    ? "1 hour/day"
    : savingsReductionHours * 60 < 1
      ? "less than 1 min/day"
      : `${Math.round(savingsReductionHours * 60)} min/day`;
  const possibleSavings = topAppliance
    ? ((safeNumber(topAppliance.watts) *
        safePositiveNumber(topAppliance.quantity) *
        savingsReductionHours *
        safeNumber(topAppliance.days)) /
        1000) *
      effectiveEstimateRate *
      billingPeriodMultiplier
    : 0;

  const hasRateForSavings = hasValidRateForEstimate;
  const savingsPeriodLabel = billPeriodDays === 30 ? "month" : `${billPeriodDays}-day period`;

  const topApplianceShare =
    topAppliance && totalKwh > 0 ? (topAppliance.kwh / totalKwh) * 100 : 0;

  const heroInsightTitles = ["Your biggest opportunity", "Where your energy goes", "How the estimate is built"];
  const billAdditionsAmount = supplyChargeAmount + fixedChargeAmount + taxAmount;

  const applianceInsight = topAppliance
    ? getApplianceInsight(topAppliance.name, topAppliance.category)
    : "";

  const topApplianceGuidePath = topAppliance
    ? getApplianceGuidePath(topAppliance.name, topAppliance.category)
    : "/learn/how-much-does-an-appliance-cost-to-run";

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
    ? !hasValidRateForEstimate
      ? "Complete the electricity-rate fields before comparing this estimate with your entered bill."
      : difference > 0
        ? `Your entered bill is ${formatCurrency(Math.abs(difference))} higher than this estimate. The difference may come from electricity price changes, taxes, extra provider charges, appliances not listed yet, or appliance wattages that are too low.`
        : difference < 0
          ? `Your estimate is ${formatCurrency(Math.abs(difference))} higher than your entered bill. Check the electricity rate, fixed charges, and appliance watts or hours for values that may be too high.`
          : "Your entered bill matches this estimate."
    : "Add your actual bill to compare it with this estimate.";

  const auditMessage = topAppliance
    ? `${topAppliance.name} is your top estimated energy user at ${topAppliance.kwh.toFixed(
        2
      )} kWh, about ${topApplianceShare.toFixed(
        0
      )}% of your total estimated usage. Reducing its use by 1 hour per day may save around ${displayCurrency}${possibleSavings.toFixed(
        2
      )} per ${savingsPeriodLabel}. ${coolingShare >= 40 ? `Cooling appliances account for about ${coolingShare.toFixed(0)}% of your total estimated usage. ` : ""}${applianceInsight}`
    : "Add appliance details to generate an energy audit insight.";

  const usageDriverLabel = "Biggest energy user";

  const savingsTip = topAppliance
    ? hasRateForSavings
      ? getPersonalizedSavingTip(topAppliance.name, topAppliance.category, formatCompactCurrency(possibleSavings), savingsPeriodLabel, savingsReductionLabel)
      : "Select a country or enter your rate to see possible savings."
    : "Add appliances to unlock usage insights and saving suggestions.";

  const coolingInsight = coolingShare >= 40
    ? `Cooling appliances account for about ${coolingShare.toFixed(0)}% of your total estimated usage.`
    : "Your cooling usage does not dominate the estimate yet.";

  const topCategoryKwh = topAppliance?.category
    ? breakdown
        .filter((item) => item.category === topAppliance.category)
        .reduce((sum, item) => sum + item.kwh, 0)
    : 0;

  const topCategoryShare = totalKwh > 0 ? (topCategoryKwh / totalKwh) * 100 : 0;

  const topCategoryLabel = topAppliance?.category
    ? `${topAppliance.category.toLowerCase()} usage`
    : "one appliance group";

  const usagePatternInsight = topAppliance?.name
    ? topAppliance.category && topCategoryShare >= 40
      ? `About ${topCategoryShare.toFixed(0)}% of your estimated usage comes from ${topAppliance.category.toLowerCase()} appliances.`
      : topApplianceShare >= 50
        ? `About ${topApplianceShare.toFixed(0)}% of your estimated usage is concentrated in one appliance.`
        : "Your estimated usage is spread across multiple appliances."
    : "Add appliances to see your usage pattern.";

  const nextBestStep = totalKwh <= 0
    ? {
        label: "A calm place to start",
        message: "Add one appliance you use often, or choose a household preset. You can refine every detail later.",
        action: "Choose a starting point",
        target: "presets",
      }
    : !hasValidRateForEstimate
      ? {
          label: "Your usage is already mapped",
          message: `${formatCompactNumber(totalKwh)} kWh is accounted for. Add your electricity rate to reveal what that usage may cost.`,
          action: "Add my rate",
          target: "inputs",
        }
      : tariffMode === "simple" && !hasCustomRate
        ? {
            label: "Make this estimate yours",
            message: "This is a useful starting point. Enter the exact rate from your bill for a more personal result.",
            action: "Use my bill rate",
            target: "inputs",
          }
        : {
            label: "Personalized with your pricing",
            message: topAppliance
              ? `${topAppliance.name} is your largest practical opportunity at about ${topApplianceShare.toFixed(0)}% of mapped usage.`
              : "Your estimate now reflects the electricity pricing you entered.",
            action: topAppliance ? "See my top opportunity" : "Review my inputs",
            target: topAppliance ? "insights" : "inputs",
          };

  const showNextBestStep = () => {
    const targetRef = nextBestStep.target === "presets"
      ? householdPresetSectionRef
      : nextBestStep.target === "insights"
        ? insightsSectionRef
        : inputSectionRef;
    targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const shouldCollapseAppliances = breakdown.length > 4;
  const applianceDisplayEntries = breakdown.map((item, index) => ({ item, index }));
  const visibleApplianceEntries =
    shouldCollapseAppliances && !showAllAddedAppliances
      ? applianceDisplayEntries.slice(0, 4)
      : applianceDisplayEntries;

  const isUnusuallyHighAppliance = (item) =>
    safeNumber(item.kwh) >= 10000 ||
    safeNumber(item.cost) >= 10000 ||
    safePositiveNumber(item.quantity) > 500 ||
    safeNumber(item.watts) > 100000;

  const saveCurrentScenario = () => {
    if (totalKwh <= 0) return;

    const nextId = savedScenarios.reduce((largest, item) => Math.max(largest, safeNumber(item.id)), 0) + 1;
    const scenario = {
      id: nextId,
      name: `${selectedHouseholdPreset || `${completedApplianceCount}-appliance setup`} ${nextId}`,
      totalKwh,
      total,
      hasRate: hasValidRateForEstimate,
      currency: displayCurrency,
      billPeriodDays,
      applianceCount: completedApplianceCount,
      topApplianceName: topAppliance?.name || "",
      tariffLabel,
      countryName: country.name,
      customCountryName,
      customCurrency,
      appliances,
      customRate,
      billingDays,
      fixedCharge,
      tariffMode,
      peakRate,
      shoulderRate,
      offPeakRate,
      peakShare,
      shoulderShare,
      tierLimit,
      tierOneRate,
      tierTwoRate,
      dailySupplyCharge,
      taxPercent,
      solarExportKwh,
      solarExportRate,
    };

    setSavedScenarios((current) => [scenario, ...current].slice(0, 3));
    setScenarioNotice("Saved on this device");
    window.setTimeout(() => setScenarioNotice(""), 2200);
  };

  const restoreScenario = (scenario) => {
    const restoredCountry = COUNTRIES.find((item) => item.name === scenario.countryName) || COUNTRIES[0];
    setCountry(restoredCountry);
    setCountrySearchTerm(restoredCountry.name === COUNTRY_PLACEHOLDER_NAME ? "" : restoredCountry.name);
    setCustomCountryName(scenario.customCountryName || "");
    setCustomCurrency(scenario.customCurrency || "");
    setAppliances(Array.isArray(scenario.appliances) && scenario.appliances.length ? scenario.appliances : [{ ...DEFAULT_APPLIANCE }]);
    setCustomRate(scenario.customRate || "");
    setBillingDays(scenario.billingDays || "30");
    setFixedCharge(scenario.fixedCharge || "");
    setTariffMode(scenario.tariffMode || "simple");
    setPeakRate(scenario.peakRate || "");
    setShoulderRate(scenario.shoulderRate || "");
    setOffPeakRate(scenario.offPeakRate || "");
    setPeakShare(scenario.peakShare || "35");
    setShoulderShare(scenario.shoulderShare || "0");
    setTierLimit(scenario.tierLimit || "100");
    setTierOneRate(scenario.tierOneRate || "");
    setTierTwoRate(scenario.tierTwoRate || "");
    setDailySupplyCharge(scenario.dailySupplyCharge || "");
    setTaxPercent(scenario.taxPercent || "");
    setSolarExportKwh(scenario.solarExportKwh || "");
    setSolarExportRate(scenario.solarExportRate || "");
    setShowAdvancedTariff((scenario.tariffMode || "simple") !== "simple" || Boolean(scenario.dailySupplyCharge || scenario.taxPercent || scenario.solarExportKwh));
    setScenarioNotice(`Loaded ${scenario.name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => setScenarioNotice(""), 2200);
  };

  const removeScenario = (scenarioId) => {
    setSavedScenarios((current) => current.filter((scenario) => scenario.id !== scenarioId));
  };


  const buildShareText = () => {
    const estimatedBill = `${displayCurrency}${safeNumber(total).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    const topUsage = topAppliance?.name
      ? ` Top energy user: ${topAppliance.name}.`
      : "";

    return `I estimated my ${billPeriodDays}-day electricity bill using Watts My Bill?: ${estimatedBill}.
Total usage: ${totalKwh.toFixed(
      2
    )} kWh.${topUsage ? `
${topUsage.trim()}` : ""}`;
  };

  /**
   * The shareable address for the current estimate. This used to be
   * `window.location.href` — the bare homepage — so "copy a link to this setup"
   * handed the recipient a number they had no way to check and an empty
   * calculator. The setup now travels with the link.
   */
  /**
   * Puts back the estimate a shared link displaced.
   *
   * The query string is cleared at the same time, otherwise a refresh would
   * silently re-apply the shared setup and undo the undo.
   */
  const restoreOwnEstimate = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PRIOR_SESSION_KEY) || "null");
      if (!parsed) return;

      setAppliances(
        parsed.appliances?.length
          ? parsed.appliances.map((item) => ({ ...DEFAULT_APPLIANCE, ...item }))
          : [DEFAULT_APPLIANCE]
      );
      setCustomRate(parsed.customRate || "");
      setBillingDays(parsed.billingDays || "30");
      setFixedCharge(parsed.fixedCharge || "");
      setActualBill(parsed.actualBill || "");
      setBilledKwh(parsed.billedKwh || "");

      const foundCountry = parsed.country?.name
        ? COUNTRIES.find((item) => item.name === parsed.country.name)
        : null;
      if (foundCountry) {
        setCountry(foundCountry);
        setCountrySearchTerm(foundCountry.name === COUNTRY_PLACEHOLDER_NAME ? "" : foundCountry.name);
      }

      localStorage.removeItem(PRIOR_SESSION_KEY);
      window.history.replaceState(null, "", `${window.location.pathname}#calculator`);
      setReplacedOwnEstimate(false);
    } catch {
      setReplacedOwnEstimate(false);
    }
  };

  /** Dismisses the notice and keeps the shared estimate. */
  const keepSharedEstimate = () => {
    try {
      localStorage.removeItem(PRIOR_SESSION_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    setReplacedOwnEstimate(false);
  };

  const buildEstimateLink = () => {
    if (typeof window === "undefined") return "https://wattsmybill.app";
    return buildShareUrl(window.location.origin, {
      // Duty is resolved before encoding. An unset value would travel as 1 and
      // then short-circuit the name lookup on the recipient's side, so a shared
      // fridge would cost three times what it does for the sender.
      appliances: appliances.map((item) => ({ ...item, duty: resolveDuty(item) })),
      country: country?.isPlaceholder ? "" : country?.name,
      customRate,
      billingDays,
      fixedCharge,
      actualBill,
      billedKwh,
    });
  };

  const copyEstimateLink = async () => {
    const link = buildEstimateLink();
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
    const link = buildEstimateLink();
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

  const scrollToSection = (targetRef, offset = 18) => {
    setShowMobileMenu(false);

    if (!targetRef.current || typeof window === "undefined") return;

    const targetTop = targetRef.current.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth"
    });
  };

  const openInfoSection = (sectionId) => {
    setShowMobileMenu(false);
    setActiveInfoPage(sectionId);
  };

  const openSupportPanel = () => {
    setShowMobileMenu(false);
    setShowDonate(true);
  };

  const handleInstallApp = async () => {
    setShowMobileMenu(false);

    if (isAppInstalled) {
      setShowInstallHelp(true);
      return;
    }

    if (installPromptEvent) {
      installPromptEvent.prompt();

      try {
        await installPromptEvent.userChoice;
      } catch {
        // Keep fallback available if the prompt fails.
      }

      setInstallPromptEvent(null);
      return;
    }

    setShowInstallHelp(true);
  };

  const downloadPDF = async () => {
    setIsPdfGenerating(true);

    try {
      const { default: jsPDF } = await import("jspdf");
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

        doc.addImage(logoImage.dataUrl, "PNG", logoX, logoY, logoWidth, logoHeight, "wmb-logo", "FAST");
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

      const countryChosen = displayCountry && displayCountry !== COUNTRY_PLACEHOLDER_NAME;

      const detailLines = [
        ...(reportName ? [["Name", cleanText(reportName)]] : []),
        ...(reportAddress ? [["Address", cleanText(reportAddress)]] : []),
        ["Country", countryChosen ? cleanText(displayCountry) : "Not specified"],
        [
          "Rate Used",
          `${pdfCurrency}${safeNumber(activeRate).toLocaleString(undefined, {
            maximumFractionDigits: 4
          })} per kWh`
        ],
        // Without a country there is no currency, so every figure below would be
        // a bare number. Say so rather than let the reader supply their own guess.
        ...(pdfCurrency ? [] : [["Currency", "Not set - amounts are in your local currency"]])
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
      doc.text(`Estimated ${billPeriodDays}-Day Bill`, marginX + 6, y + 1);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(5, 150, 105);
      doc.text(cleanText(money(total)), marginX + 6, y + 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(85, 105, 100);
      doc.text(`${totalKwh.toFixed(2)} kWh estimated for this period`, pageWidth - marginX - 6, y + 13, { align: "right" });

      y += 34;

      const summaryLines = [
        ["Total Usage", `${totalKwh.toFixed(2)} kWh`],
        ["Daily Average", `${money(dailyAverage)} / day`],
        ["Top Energy User", topAppliance?.name || "Not available"]
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
        doc.text(
          cleanText(
            `${money(Math.abs(difference))} ${difference > 0 ? "higher than this estimate" : difference < 0 ? "lower than this estimate" : "-"}`
          ),
          marginX + 40,
          y
        );

        y += 7;
      }

      if (isBillDetectiveReady) {
        checkPage(56);
        y += 3;

        doc.setDrawColor(230, 230, 230);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text("Bill Detective", marginX, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(70, 70, 70);
        y = writeWrappedText(cleanText(billDetectiveSummary), marginX, y, contentWidth, 5);
        y += 4;

        [
          ["Energy-use contribution", formatSignedCurrency(usageImpact)],
          ["Effective-rate contribution", formatSignedCurrency(rateImpact)],
          ["Fixed-charge contribution", formatSignedCurrency(fixedImpact)],
        ].forEach(([label, value]) => {
          checkPage(8);
          doc.setFont("helvetica", "bold");
          doc.text(`${label}:`, marginX, y);
          doc.setFont("helvetica", "normal");
          doc.text(cleanText(value), marginX + 52, y);
          y += 6;
        });
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

      const cyclingRows = [];

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
          // A fridge shown as 150W for 24h across 30 days does not multiply out
          // to the 37.80 kWh beside it, because it cycles. Marking the row and
          // footnoting the factor keeps the arithmetic checkable by the reader.
          const duty = resolveDuty(item);
          if (duty < 1 && item.kwh > 0) cyclingRows.push([item.name, duty]);
          const applianceName = cleanText(`${item.name || "Unnamed"}${duty < 1 && item.kwh > 0 ? " *" : ""}`);
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

        // The reader should not have to add up the column themselves.
        checkPage(12);
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.4);
        doc.line(tableX, y - 3.5, pageWidth - marginX, y - 3.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        doc.setTextColor(30, 30, 30);
        doc.text("Total", col.appliance + 1, y);
        doc.text(totalKwh.toFixed(2), col.kwh, y);
        doc.text(money(total), col.cost, y);
        y += 8;
      }

      if (cyclingRows.length > 0) {
        checkPage(14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.4);
        doc.setTextColor(110, 110, 110);
        // Two fridges in one estimate are two rows but one footnote.
        const seenCycling = new Map();
        cyclingRows.forEach(([name, duty]) => {
          const key = cleanText(name).toLowerCase();
          if (!seenCycling.has(key)) seenCycling.set(key, [cleanText(name), duty]);
        });
        const note = [...seenCycling.values()]
          .map(([name, duty]) => `${name} runs about ${Math.round(duty * 100)}% of the hours shown`)
          .join("; ");
        y = writeWrappedText(
          `* Thermostat-controlled appliances cycle on and off: ${note}. The kWh column already accounts for this, so those rows will not multiply out exactly.`,
          marginX,
          y,
          contentWidth,
          4.2
        );
        y += 4;
      }

      y += 10;

      const usageGrouped = new Map();
      breakdown
        .filter((item) => item.kwh > 0)
        .forEach((item) => {
          const name = item.name || "Unnamed appliance";
          const key = name.trim().toLowerCase();
          const existing = usageGrouped.get(key);
          if (existing) {
            existing.kwh += item.kwh;
            existing.cost += item.cost;
            existing.count += 1;
          } else {
            usageGrouped.set(key, { name, kwh: item.kwh, cost: item.cost, count: 1 });
          }
        });

      const usageRanked = [...usageGrouped.values()].sort((a, b) => b.kwh - a.kwh);

      if (usageRanked.length > 0 && totalKwh > 0) {
        // Ordered by descending lightness rather than picked for variety, so the
        // chart still reads as a sequence when the report is printed in black
        // and white, which is how a report attached to an email usually ends up.
        const USAGE_COLORS = [
          [4, 120, 87],
          [13, 148, 136],
          [245, 158, 11],
          [100, 116, 139],
          [110, 231, 183],
          [146, 64, 14],
        ];
        const OTHER_COLOR = [203, 213, 225];

        const shown = usageRanked.slice(0, USAGE_COLORS.length);
        const rest = usageRanked.slice(USAGE_COLORS.length);

        const segments = shown.map((item, index) => ({
          name: item.count > 1 ? `${item.name} x${item.count}` : item.name,
          kwh: item.kwh,
          cost: item.cost,
          color: USAGE_COLORS[index],
        }));

        if (rest.length > 0) {
          segments.push({
            name: `Other (${rest.length} ${rest.length === 1 ? "appliance" : "appliances"})`,
            kwh: rest.reduce((sum, item) => sum + item.kwh, 0),
            cost: rest.reduce((sum, item) => sum + item.cost, 0),
            color: OTHER_COLOR,
          });
        }

        // A heading stranded at the foot of one page with its chart on the next
        // is worse than a page break, so the whole block is reserved up front.
        const chartHeight = Math.max(50, segments.length * 6.4 + 10);
        checkPage(chartHeight + 26);

        sectionTitle("Where Your Energy Goes", `${totalKwh.toFixed(2)} kWh total`);

        const centreX = marginX + 25;
        const centreY = y + 24;
        const outerR = 22;
        const innerR = 12.6;

        // jsPDF has no arc primitive, so each wedge is a polygon fanned out from
        // the centre and the hole is punched afterwards with a filled circle.
        const drawWedge = (fromAngle, toAngle, color) => {
          const sweep = toAngle - fromAngle;
          const steps = Math.max(2, Math.ceil((sweep * 180) / Math.PI / 4));
          const deltas = [];
          let prevX = centreX;
          let prevY = centreY;

          for (let step = 0; step <= steps; step += 1) {
            const angle = fromAngle + (sweep * step) / steps;
            const pointX = centreX + outerR * Math.cos(angle);
            const pointY = centreY + outerR * Math.sin(angle);
            deltas.push([pointX - prevX, pointY - prevY]);
            prevX = pointX;
            prevY = pointY;
          }

          deltas.push([centreX - prevX, centreY - prevY]);
          doc.setFillColor(color[0], color[1], color[2]);
          doc.lines(deltas, centreX, centreY, [1, 1], "F", true);
        };

        // Starts at twelve o'clock and runs clockwise, which is how a reader
        // expects to be walked through a share.
        let angleCursor = -Math.PI / 2;

        segments.forEach((segment) => {
          const sweep = (segment.kwh / totalKwh) * Math.PI * 2;
          drawWedge(angleCursor, angleCursor + sweep, segment.color);
          angleCursor += sweep;
        });

        doc.setFillColor(255, 255, 255);
        doc.circle(centreX, centreY, innerR, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(totalKwh.toFixed(1), centreX, centreY - 0.4, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(120, 120, 120);
        doc.text("kWh total", centreX, centreY + 4.2, { align: "center" });

        // The legend sits beside the ring rather than under it, so the whole
        // picture stays on one page instead of splitting from its own key.
        const legendX = marginX + 54;
        let legendY = y + 6;

        segments.forEach((segment) => {
          const share = (segment.kwh / totalKwh) * 100;

          doc.setFillColor(segment.color[0], segment.color[1], segment.color[2]);
          doc.circle(legendX + 1.5, legendY - 1, 1.5, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.2);
          doc.setTextColor(45, 45, 45);
          const fullLabel = cleanText(segment.name);
          const labelLines = doc.splitTextToSize(fullLabel, 42);
          doc.text(labelLines.length > 1 ? `${labelLines[0].trim()}...` : labelLines[0], legendX + 5, legendY);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(95, 95, 95);
          doc.text(`${segment.kwh.toFixed(2)} kWh`, marginX + 112, legendY, { align: "right" });
          doc.text(money(segment.cost), marginX + 140, legendY, { align: "right" });

          doc.setFont("helvetica", "bold");
          doc.setTextColor(60, 60, 60);
          doc.text(`${share.toFixed(1)}%`, pageWidth - marginX, legendY, { align: "right" });

          legendY += 6.4;
        });

        y = Math.max(centreY + outerR, legendY) + 12;
      }

      sectionTitle("Important Note");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);

      writeWrappedText(
        "This report is for estimation and learning purposes only. Actual electric bills may include taxes, electricity supply charges, delivery charges, service fees, and other provider charges.",
        marginX,
        y,
        contentWidth,
        5
      );

      footer();

      const filename = "watts-my-bill-energy-audit-report.pdf";
      const pdfBlob = doc.output("blob");

      if (!(pdfBlob instanceof Blob) || pdfBlob.size === 0) {
        throw new Error("The generated PDF was empty.");
      }

      if (pdfDownloadUrlRef.current) {
        URL.revokeObjectURL(pdfDownloadUrlRef.current);
      }

      const pdfUrl = URL.createObjectURL(pdfBlob);
      pdfDownloadUrlRef.current = pdfUrl;
      setPdfDownload({ url: pdfUrl, filename, size: pdfBlob.size });

      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = filename;
      downloadLink.rel = "noopener";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Sorry, the report could not be downloaded. Please refresh the page and try again.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const theme = darkMode
    ? "bg-[#06142b] text-white"
    : "bg-[#eef3f1] text-gray-900";

  return (
    <div className={`min-h-screen p-4 md:p-6 transition-colors duration-300 ${theme} ${darkMode ? "wmb-dashboard-dark" : ""}`}>
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="relative z-[80] mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-3 md:items-center">
            <button
              type="button"
              onClick={() => scrollToSection(heroSectionRef)}
              className="cursor-pointer text-left"
              aria-label="Go to Watts My Bill home"
            >
              <Logo darkMode={darkMode} />
            </button>

            <nav className="hidden items-center gap-4 translate-y-[10px] lg:flex lg:gap-5" aria-label="Main navigation">
              <Link href="/learn" className={`relative px-0.5 py-2 text-sm font-bold transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-200 hover:after:scale-x-100 ${darkMode ? "text-white/88 hover:text-white after:bg-emerald-300/85" : "text-slate-700 hover:text-emerald-800 after:bg-emerald-500"}`}>
                Learn
              </Link>
              <Link href="/rates" className={`relative px-0.5 py-2 text-sm font-bold transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-200 hover:after:scale-x-100 ${darkMode ? "text-white/88 hover:text-white after:bg-emerald-300/85" : "text-slate-700 hover:text-emerald-800 after:bg-emerald-500"}`}>
                Rates
              </Link>
              <button type="button" onClick={() => openInfoSection("about")} className={`relative cursor-pointer px-0.5 py-2 text-sm font-bold transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-200 hover:after:scale-x-100 ${darkMode ? "text-white/88 hover:text-white after:bg-emerald-300/85" : "text-slate-700 hover:text-emerald-800 after:bg-emerald-500"}`}>
                About
              </button>
              <button type="button" onClick={openSupportPanel} className={`relative cursor-pointer px-0.5 py-2 text-sm font-bold transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-200 hover:after:scale-x-100 ${darkMode ? "text-white/88 hover:text-white after:bg-emerald-300/85" : "text-slate-700 hover:text-emerald-800 after:bg-emerald-500"}`}>
                Support
              </button>
              <button type="button" onClick={handleInstallApp} className={`relative cursor-pointer px-0.5 py-2 text-sm font-bold transition after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-200 hover:after:scale-x-100 ${darkMode ? "text-white/88 hover:text-white after:bg-emerald-300/85" : "text-slate-700 hover:text-emerald-800 after:bg-emerald-500"}`}>
                {isAppInstalled ? "Installed" : "Install App"}
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((current) => !current)}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className={`grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border transition ${darkMode ? "border-white/10 bg-white/[0.06] text-emerald-100 hover:bg-white/[0.12]" : "border-emerald-950/10 bg-white/65 text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700"}`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={17} strokeWidth={2.25} /> : <Moon size={17} strokeWidth={2.25} />}
              </button>
            </nav>

            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={`ml-auto grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border transition lg:hidden ${darkMode ? "border-white/10 bg-white/[0.06] text-emerald-100 hover:bg-white/[0.12]" : "border-emerald-950/10 bg-white/65 text-slate-700 shadow-sm hover:border-emerald-200 hover:text-emerald-700"}`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={17} strokeWidth={2.25} /> : <Moon size={17} strokeWidth={2.25} />}
            </button>

            <button
              type="button"
              onClick={() => setShowMobileMenu((current) => !current)}
              className={`cursor-pointer grid h-11 w-11 shrink-0 place-items-center rounded-none border border-transparent bg-transparent shadow-none transition lg:hidden ${
                darkMode
                  ? "text-white hover:text-emerald-200"
                  : "text-slate-900 hover:text-emerald-700"
              }`}
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={showMobileMenu}
              aria-controls="mobile-navigation"
            >
              {showMobileMenu ? <X size={24} strokeWidth={2.5} /> : <span className="text-[1.55rem] font-black leading-none">☰</span>}
            </button>
          </div>

          {showMobileMenu && (
            <div id="mobile-navigation" className={`absolute left-0 right-0 top-[calc(100%+0.65rem)] z-[90] overflow-hidden rounded-[22px] border shadow-xl lg:hidden ${
              darkMode
                ? "border-white/10 bg-slate-950/92 text-white"
                : "border-emerald-950/[0.08] bg-white/95 text-slate-950"
            }`}>
              <div className="py-2">
                <button type="button" onClick={handleInstallApp} className={`block w-full cursor-pointer px-5 py-2.5 text-left text-[15px] font-bold transition-colors ${darkMode ? "text-white/92 hover:text-emerald-200 active:text-emerald-200" : "text-slate-900 hover:text-emerald-700 active:text-emerald-700"}`}>
                  {isAppInstalled ? "Installed" : "Install App"}
                </button>
                <Link href="/methodology" onClick={() => setShowMobileMenu(false)} className={`block w-full cursor-pointer px-5 py-2.5 text-left text-[15px] font-bold transition-colors ${darkMode ? "text-white/92 hover:text-emerald-200 active:text-emerald-200" : "text-slate-900 hover:text-emerald-700 active:text-emerald-700"}`}>
                  How it works
                </Link>
                <button type="button" onClick={() => openInfoSection("about")} className={`block w-full cursor-pointer px-5 py-2.5 text-left text-[15px] font-bold transition-colors ${darkMode ? "text-white/92 hover:text-emerald-200 active:text-emerald-200" : "text-slate-900 hover:text-emerald-700 active:text-emerald-700"}`}>
                  About
                </button>
                <button type="button" onClick={() => openInfoSection("disclaimer")} className={`block w-full cursor-pointer px-5 py-2.5 text-left text-[15px] font-bold transition-colors ${darkMode ? "text-white/92 hover:text-emerald-200 active:text-emerald-200" : "text-slate-900 hover:text-emerald-700 active:text-emerald-700"}`}>
                  Disclaimer
                </button>
                <button type="button" onClick={openSupportPanel} className={`block w-full cursor-pointer px-5 py-2.5 text-left text-[15px] font-bold transition-colors ${darkMode ? "text-white/92 hover:text-emerald-200 active:text-emerald-200" : "text-slate-900 hover:text-emerald-700 active:text-emerald-700"}`}>
                  Support
                </button>
                <button type="button" onClick={() => openInfoSection("contact")} className={`block w-full cursor-pointer px-5 py-2.5 text-left text-[15px] font-bold transition-colors ${darkMode ? "text-white/92 hover:text-emerald-200 active:text-emerald-200" : "text-slate-900 hover:text-emerald-700 active:text-emerald-700"}`}>
                  Contact
                </button>

                <div className={`mt-1 border-t px-5 pt-2 ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                  <button type="button" onClick={() => openInfoSection("privacy")} className={`block w-full cursor-pointer py-1.5 text-left text-[13px] font-semibold transition-colors ${darkMode ? "text-white/82 hover:text-emerald-200 active:text-emerald-200" : "text-slate-600 hover:text-emerald-700 active:text-emerald-700"}`}>
                    Privacy Policy
                  </button>
                  <button type="button" onClick={() => openInfoSection("terms")} className={`block w-full cursor-pointer py-1.5 text-left text-[13px] font-semibold transition-colors ${darkMode ? "text-white/82 hover:text-emerald-200 active:text-emerald-200" : "text-slate-600 hover:text-emerald-700 active:text-emerald-700"}`}>
                    Terms of Use
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        <main id="main-content">

        <section ref={heroSectionRef} className="wmb-hero-card relative mb-4 w-full overflow-hidden rounded-[28px] border border-emerald-200/[0.12] p-4 text-left text-white shadow-sm sm:p-6 lg:p-7">
          <div className="grid min-w-0 gap-3 sm:gap-5 md:grid-cols-[minmax(0,0.82fr)_minmax(340px,1.18fr)] md:items-stretch md:gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1.18fr)] lg:gap-7">
            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.17em] text-emerald-100/85">
                  {totalKwh > 0 ? (hasValidRateForEstimate ? "Estimated bill" : "Estimated usage") : "Start your estimate"}
                </p>
                <h2 className={`mt-1.5 break-words font-black leading-none tracking-[-0.05em] ${totalKwh > 0 ? "text-[2.45rem] sm:text-[3.5rem]" : "max-w-lg text-[1.9rem] leading-[1.02] sm:text-[2.7rem]"}`}>
                  {totalKwh > 0
                    ? hasValidRateForEstimate
                      ? formatCompactCurrency(animatedTotal)
                      : `${formatCompactNumber(animatedTotalKwh)} kWh`
                    : "Understand what powers your bill."}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                  {totalKwh > 0
                    ? hasValidRateForEstimate
                      ? `${tariffLabel} estimate for ${billPeriodDays} days.`
                      : "Add your electricity rate to reveal the estimated cost."
                    : "Choose your country and add appliances, or begin with a household preset."}
                </p>
                {totalKwh > 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[9.5px] font-black text-white/72">
                  <span title="Appliances currently included in this estimate" className="rounded-full border border-white/[0.09] bg-white/[0.055] px-2.5 py-1.5">{completedApplianceCount} {completedApplianceCount === 1 ? "appliance" : "appliances"}</span>
                  <button type="button" title="Review the electricity rate used for this estimate" onClick={() => inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className={`cursor-pointer rounded-full border px-2.5 py-1.5 transition ${hasValidRateForEstimate ? "border-white/[0.09] bg-white/[0.055] hover:bg-white/[0.1]" : "border-amber-200/25 bg-amber-200/10 text-amber-100 hover:bg-amber-200/15"}`}>
                    {hasValidRateForEstimate ? tariffMode === "simple" ? hasCustomRate ? "Your rate" : "Indicative rate" : tariffLabel : "Rate missing"}
                  </button>
                  <span title={hasExtraBillItems ? "The estimate includes at least one supply charge, fixed charge, tax, or solar credit" : "No supply charge, fixed charge, tax, or solar credit is included"} className="rounded-full border border-white/[0.09] bg-white/[0.055] px-2.5 py-1.5">{hasExtraBillItems ? "Bill items included" : "Energy only"}</span>
                </div>}

                <div className="mt-3 border-l-2 border-emerald-200/55 pl-3 sm:mt-3.5">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-emerald-100/70">{nextBestStep.label}</p>
                  <p className="mt-1 max-w-md text-[12.5px] font-semibold leading-5 text-white/92">{nextBestStep.message}</p>
                  <button
                    type="button"
                    onClick={showNextBestStep}
                    className="mt-1.5 cursor-pointer text-[11px] font-black text-emerald-100 underline decoration-emerald-200/45 underline-offset-4 transition hover:text-white"
                  >
                    {nextBestStep.action} →
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-3.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-[11px] font-black text-white transition hover:bg-white/20 lg:gap-2 lg:px-4 lg:py-2.5 lg:text-xs"
                >
                  <Calculator size={14} strokeWidth={2.3} />
                  <span className="lg:hidden">{totalKwh > 0 && !hasValidRateForEstimate ? "Add rate" : totalKwh > 0 ? "Review" : "Start"}</span>
                  <span className="hidden lg:inline">{totalKwh > 0 && !hasValidRateForEstimate ? "Add a rate" : totalKwh > 0 ? "Review inputs" : "Get started"}</span>
                </button>
                {totalKwh > 0 && <button
                  type="button"
                  onClick={() => insightsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/10 bg-emerald-950/20 px-3 py-2 text-[11px] font-black text-white/88 transition hover:bg-emerald-950/30 lg:gap-2 lg:px-4 lg:py-2.5 lg:text-xs"
                >
                  <BarChart3 size={14} strokeWidth={2.2} /> Insights
                </button>}
                {totalKwh > 0 && <button
                  type="button"
                  onClick={saveCurrentScenario}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-black text-white/88 transition hover:bg-white/[0.12] lg:gap-2 lg:px-4 lg:py-2.5 lg:text-xs"
                >
                  <BookmarkPlus size={14} strokeWidth={2.2} /> <span className="lg:hidden">{scenarioNotice || "Save"}</span><span className="hidden lg:inline">{scenarioNotice || "Save setup"}</span>
                </button>}
                <Link
                  href="/game"
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-2 text-[11px] font-black text-amber-100 transition hover:bg-amber-400/25 lg:gap-2 lg:px-4 lg:py-2.5 lg:text-xs"
                >
                  <Gamepad2 size={14} strokeWidth={2.2} /> Guess the Watts
                </Link>
              </div>
            </div>

            {/* The result panel only appears once there is a result. An empty
                session used to meet a full dashboard with the numbers removed —
                usage mix, top appliance, cost per day, annual outlook and a
                carousel — the furniture of an answer before anyone had asked a
                question. */}
            {totalKwh > 0 && (
            <div className="rounded-[22px] border border-white/[0.1] bg-emerald-950/25 p-3 backdrop-blur-sm sm:p-4 md:flex md:flex-col md:justify-between" role="region" aria-roledescription="carousel" aria-label="Estimate infographics">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100/75">{heroInsightTitles[heroInsightSlide]}</p>
                  <div className="flex shrink-0 items-center gap-1" aria-label={`Infographic ${heroInsightSlide + 1} of ${heroInsightTitles.length}`}>
                    <button type="button" onClick={() => setHeroInsightSlide((current) => (current + heroInsightTitles.length - 1) % heroInsightTitles.length)} aria-label="Previous infographic" className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 transition hover:bg-white/[0.12] hover:text-white"><ChevronLeft size={14} /></button>
                    <span className="min-w-8 text-center text-[9px] font-black text-white/55">{heroInsightSlide + 1}/{heroInsightTitles.length}</span>
                    <button type="button" onClick={() => setHeroInsightSlide((current) => (current + 1) % heroInsightTitles.length)} aria-label="Next infographic" className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 transition hover:bg-white/[0.12] hover:text-white"><ChevronRight size={14} /></button>
                  </div>
                </div>
                <p className="mt-1 text-[12.5px] font-bold leading-5 text-white/90 sm:text-[13px]">
                  {heroInsightSlide === 0 && (topAppliance ? `${topAppliance.name} is the clearest place to investigate first.` : "Add appliances to reveal your largest practical opportunity.")}
                  {heroInsightSlide === 1 && <><span className="sm:hidden">{compactUsageMixSummary}</span><span className="hidden sm:inline">{usageMixSummary}</span></>}
                  {heroInsightSlide === 2 && (hasValidRateForEstimate ? (hasExtraBillItems ? "See how energy and bill items combine into your estimate." : "Your estimate currently reflects energy use only.") : "Add a rate to reveal what shapes the estimated cost.")}
                </p>
              </div>

              {heroInsightSlide === 1 && (usageMixRows.length > 0 ? <div className="mt-2.5 space-y-2 sm:mt-3" role="list" aria-label="Estimated appliance usage mix">
                {usageMixRows.map((item) => <div key={item.label} role="listitem" className={`${item.label.startsWith("Everything else") ? "hidden sm:grid" : "grid"} grid-cols-[minmax(0,1fr)_42px] items-center gap-3`}>
                  <div className="min-w-0">
                    <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[10px] font-bold text-white/78">
                      <span className="truncate">{item.label}</span>
                      <span className="shrink-0 text-white/55">{formatCompactNumber(item.kwh, 1)} kWh</span>
                    </div>
                    <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-[linear-gradient(90deg,#6ee7b7,#d1fae5)]" style={{ width: `${Math.max(2, Math.min(100, item.share))}%` }} /></div>
                  </div>
                  <span className="text-right text-[11px] font-black text-emerald-100">{item.share.toFixed(0)}%</span>
                </div>)}
              </div> : <div className="mt-3 grid grid-cols-3 gap-2">
                {["Top appliance", "Cost per day", "Annual outlook"].map((label) => <div key={label} className="rounded-xl border border-dashed border-white/[0.1] px-2 py-3 text-center text-[9px] font-bold text-white/45">{label}</div>)}
              </div>)}

              {heroInsightSlide === 2 && (
                <div className="mt-3" aria-live="polite">
                  {hasValidRateForEstimate ? <>
                    <div className="rounded-xl border border-white/[0.09] bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:hidden" aria-label="Energy use multiplied by the electricity rate equals the estimated energy cost">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-emerald-100/60">Usage × rate</p>
                          <p className="mt-1 truncate text-[11px] font-bold text-white/72">{formatCompactNumber(animatedTotalKwh, 1)} kWh × {formatCompactCurrency(effectiveEstimateRate)}/kWh</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-emerald-100/60">Energy cost</p>
                          <p className="mt-1 text-base font-black text-emerald-100">{formatCompactCurrency(usageCost)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="hidden grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)_18px_minmax(0,1fr)] items-stretch gap-1 sm:grid" aria-label="Energy use multiplied by the electricity rate equals the estimated energy cost">
                      <div className="rounded-xl border border-white/[0.09] bg-white/[0.055] px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.11em] text-emerald-100/60">Usage</p>
                        <p className="mt-1 truncate text-sm font-black text-white">{formatCompactNumber(animatedTotalKwh, 1)} <span className="text-[9px] text-white/55">kWh</span></p>
                      </div>
                      <span className="grid place-items-center text-sm font-black text-emerald-100/55" aria-hidden="true">×</span>
                      <div className="rounded-xl border border-white/[0.09] bg-white/[0.055] px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.11em] text-emerald-100/60">Rate</p>
                        <p className="mt-1 truncate text-sm font-black text-white">{formatCompactCurrency(effectiveEstimateRate)}<span className="text-[9px] text-white/55">/kWh</span></p>
                      </div>
                      <span className="grid place-items-center text-sm font-black text-emerald-100/55" aria-hidden="true">=</span>
                      <div className="rounded-xl border border-emerald-200/20 bg-emerald-300 px-2.5 py-2.5 text-emerald-950 shadow-[0_6px_16px_rgba(2,44,34,0.18),inset_0_1px_0_rgba(255,255,255,0.35)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.11em] text-emerald-950/65">Energy cost</p>
                        <p className="mt-1 truncate text-sm font-black">{formatCompactCurrency(usageCost)}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 rounded-xl border border-white/[0.08] bg-black/10 px-2.5 py-2" aria-label="Energy cost plus bill additions minus credits equals the estimated bill">
                      <div className="min-w-0"><p className="text-[7.5px] font-black uppercase tracking-[0.08em] text-white/45">Energy</p><p className="truncate text-[10.5px] font-black text-white">{formatCompactCurrency(usageCost)}</p></div>
                      <span className="text-[10px] font-black text-white/35" aria-hidden="true">+</span>
                      <div className="min-w-0 text-center"><p className="text-[7.5px] font-black uppercase tracking-[0.08em] text-white/45">Bill items</p><p className="truncate text-[10.5px] font-black text-white">{formatCompactCurrency(billAdditionsAmount)}</p></div>
                      <span className="text-[10px] font-black text-white/35" aria-hidden="true">−</span>
                      <div className="min-w-0 text-right"><p className="text-[7.5px] font-black uppercase tracking-[0.08em] text-white/45">Credits</p><p className={`truncate text-[10.5px] font-black ${solarCreditAmount > 0 ? "text-cyan-100" : "text-white"}`}>{formatCompactCurrency(solarCreditAmount)}</p></div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 px-0.5 text-[9px]">
                      <span className="font-semibold text-white/52">{hasExtraBillItems ? "Includes the bill details you added." : "Energy-only until you add supply charges or credits."}</span>
                      <span className="shrink-0 font-black text-emerald-100">Estimate {formatCompactCurrency(total)}</span>
                    </div>
                  </> : <div className="grid grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)_18px_minmax(0,1fr)] items-center gap-1">{["Usage", "Rate", "Estimated cost"].map((label, index) => <div key={label} className="contents"><div className="rounded-xl border border-dashed border-white/[0.1] px-2 py-4 text-center text-[9px] font-bold text-white/45">{label}</div>{index < 2 && <span className="text-center text-xs font-black text-white/30">{index === 0 ? "×" : "="}</span>}</div>)}</div>}
                </div>
              )}

              {heroInsightSlide === 0 && (
                <div className="mt-3 grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4" aria-live="polite">
                  <div className="relative grid aspect-square place-items-center rounded-full" style={{ background: `conic-gradient(#6ee7b7 0 ${Math.min(100, topApplianceShare)}%, rgba(255,255,255,0.1) ${Math.min(100, topApplianceShare)}% 100%)` }}>
                    <div className="grid h-[76%] w-[76%] place-items-center rounded-full bg-[#075647] text-center shadow-inner">
                      <div><p className="text-xl font-black text-white">{topAppliance ? `${topApplianceShare.toFixed(0)}%` : "—"}</p><p className="text-[8px] font-black uppercase tracking-[0.08em] text-emerald-100/60">of usage</p></div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-black leading-5 text-white">{topAppliance?.name || "No appliance yet"}</p>
                    <p className="mt-1 text-[10.5px] leading-4 text-white/62">{topAppliance ? `${formatCompactNumber(topAppliance.kwh, 1)} kWh across this ${billPeriodDays}-day estimate.` : "Add an appliance or preset to map your opportunity."}</p>
                    {topAppliance && hasRateForSavings && <div className="mt-2 rounded-xl border border-white/[0.09] bg-white/[0.055] px-3 py-2"><p className="text-[8px] font-black uppercase tracking-[0.09em] text-emerald-100/60">Possible change</p><p className="mt-0.5 text-xs font-black text-white">{formatCompactCurrency(possibleSavings)} / {savingsPeriodLabel}</p><p className="mt-0.5 text-[9px] text-white/50">if reduced by {savingsReductionLabel}</p></div>}
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.09] border-t border-white/[0.09] pt-3">
                <div className="min-w-0 pr-2"><p className="text-[8.5px] font-black uppercase tracking-[0.1em] text-white/50">Usage / day</p><p className="mt-1 truncate text-xs font-black text-white">{totalKwh > 0 ? `${formatCompactNumber(animatedTotalKwh / billPeriodDays)} kWh` : "\u2014"}</p></div>
                <div className="min-w-0 px-2"><p className="text-[8.5px] font-black uppercase tracking-[0.1em] text-white/50">{hasValidRateForEstimate ? "Cost / day" : "Appliances"}</p><p className="mt-1 truncate text-xs font-black text-white">{hasValidRateForEstimate ? formatCompactCurrency(animatedDailyAverage) : completedApplianceCount || "\u2014"}</p></div>
                <div className="min-w-0 pl-2"><p className="text-[8.5px] font-black uppercase tracking-[0.1em] text-white/50">{hasValidRateForEstimate ? "Year outlook" : "Bill period"}</p><p className="mt-1 truncate text-xs font-black text-white" title={hasValidRateForEstimate ? "Projected at the same usage and rate" : undefined}>{hasValidRateForEstimate ? formatCompactCurrency(total * (365 / billPeriodDays)) : `${billPeriodDays} days`}</p></div>
              </div>
            </div>
            )}
          </div>
        </section>

        {savedScenarios.length > 0 && (
          <section className="wmb-theme-panel mb-4 rounded-[24px] border border-emerald-950/[0.07] bg-white p-4 text-slate-950 shadow-sm sm:p-5" aria-labelledby="saved-scenarios-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>Private by default</p>
                <h2 id="saved-scenarios-heading" className="mt-1 text-base font-black tracking-tight">Compare saved setups</h2>
                <p className={`mt-1 text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Up to three snapshots stay only on this device. Load one to revisit it.</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${darkMode ? "bg-white/[0.07] text-slate-200" : "bg-slate-100 text-slate-600"}`}>{savedScenarios.length}/3 saved</span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {savedScenarios.map((scenario) => {
                const scenarioDays = safePositiveNumber(scenario.billPeriodDays, 30);
                const currentMonthlyKwh = (totalKwh / billPeriodDays) * 30;
                const scenarioMonthlyKwh = (safeNumber(scenario.totalKwh) / scenarioDays) * 30;
                const usageDelta = currentMonthlyKwh - scenarioMonthlyKwh;
                const currentMonthlyCost = (total / billPeriodDays) * 30;
                const scenarioMonthlyCost = (safeNumber(scenario.total) / scenarioDays) * 30;
                const costDelta = currentMonthlyCost - scenarioMonthlyCost;
                const annualCostDelta = costDelta * (365 / 30);
                const canCompareCost = scenario.hasRate && hasValidRateForEstimate && scenario.currency === displayCurrency;
                return <article key={scenario.id} className={`rounded-2xl border px-3.5 py-3 ${darkMode ? "border-white/[0.08] bg-white/[0.035]" : "border-slate-200/80 bg-[#f8faf9]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{scenario.name}</p>
                      <p className={`mt-0.5 truncate text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{scenario.countryName === COUNTRY_PLACEHOLDER_NAME ? scenario.customCountryName || "No country" : scenario.countryName} / {scenario.tariffLabel} / {scenario.billPeriodDays} days</p>
                    </div>
                    <button type="button" onClick={() => removeScenario(scenario.id)} aria-label={`Remove ${scenario.name}`} className={`grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full ${darkMode ? "text-slate-400 hover:bg-white/[0.08] hover:text-white" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"}`}><Trash2 size={13} /></button>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-base font-black">{scenario.hasRate ? `${scenario.currency || ""}${safeNumber(scenario.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${safeNumber(scenario.totalKwh).toFixed(1)} kWh`}</p>
                      <p className={`mt-0.5 text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{canCompareCost ? `${formatSignedCurrency(costDelta)} / 30 days` : `${usageDelta >= 0 ? "+" : ""}${usageDelta.toFixed(1)} kWh / 30 days`}</p>
                      {canCompareCost && <p className={`mt-0.5 text-[10px] font-bold ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>~ {formatSignedCurrency(annualCostDelta)} / year</p>}
                    </div>
                    <button type="button" onClick={() => restoreScenario(scenario)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-black ${darkMode ? "border-emerald-300/20 text-emerald-200 hover:bg-emerald-300/10" : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}><RotateCw size={12} /> Load</button>
                  </div>
                </article>;
              })}
            </div>
          </section>
        )}

        <section className="hidden">
          <div>
            <div className="min-w-0 pr-10">
              <p className="text-[11px] font-black uppercase tracking-[0.17em] text-emerald-100/85">
                {totalKwh > 0 ? (activeRate > 0 ? "Estimated bill" : "Estimated usage") : "Start your estimate"}
              </p>
              <h2 className={`mt-2 break-words font-black leading-none tracking-[-0.045em] ${totalKwh > 0 ? "text-[2.7rem] md:text-[3.4rem]" : "max-w-lg text-[2rem] leading-[1.02] md:text-[2.6rem]"}`}>
                {totalKwh > 0
                  ? activeRate > 0
                    ? formatCompactCurrency(animatedTotal)
                    : `${formatCompactNumber(animatedTotalKwh)} kWh`
                  : "Understand what powers your bill."}
              </h2>
              <p className="mt-2 text-sm text-white/82">
                {totalKwh > 0
                  ? activeRate > 0
                    ? `Estimated cost for ${billPeriodDays} days.`
                    : "Select your country or enter a rate to reveal the estimated cost."
                  : "Choose your country and add appliances—or begin with a household preset."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/20"
                >
                  <Calculator size={14} strokeWidth={2.3} /> {totalKwh > 0 && activeRate <= 0 ? "Add a rate" : totalKwh > 0 ? "Review inputs" : "Get started"}
                </button>
                {totalKwh > 0 && <button
                  type="button"
                  onClick={() => insightsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-emerald-950/20 px-4 py-2.5 text-xs font-black text-white/85 transition hover:bg-emerald-950/30"
                >
                  <BarChart3 size={14} strokeWidth={2.2} /> Insights
                </button>}
              </div>
            </div>

            {totalKwh > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.12] pt-4">
                <div className="rounded-2xl border border-white/[0.08] bg-emerald-950/28 px-3.5 py-3">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-white/88">{activeRate > 0 ? "Total usage" : "Appliances"}</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{activeRate > 0 ? `${formatCompactNumber(animatedTotalKwh)} kWh` : completedApplianceCount}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-emerald-950/28 px-3.5 py-3">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-white/88">{activeRate > 0 ? "Rate used" : "Billing period"}</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{activeRate > 0 ? `${displayCurrency}${activeRate}/kWh` : `${billPeriodDays} days`}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-emerald-950/28 px-3.5 py-3">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-white/88">{activeRate > 0 ? "Average per day" : "Usage per day"}</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{activeRate > 0 ? formatCompactCurrency(animatedDailyAverage) : `${formatCompactNumber(animatedTotalKwh / billPeriodDays)} kWh`}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-emerald-950/28 px-3.5 py-3">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-white/88">Biggest energy user</p>
                  <div className="mt-1 flex min-w-0 items-baseline justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-black text-white">{topAppliance?.name || "—"}</p>
                    {topAppliance?.name && <span className="shrink-0 text-[11px] font-black text-emerald-100">{topApplianceShare.toFixed(0)}%</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {false && <div className="hidden">
          <div className="relative z-20 grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(440px,1fr)] lg:items-stretch lg:gap-6">
            <div className="flex max-w-2xl flex-col pr-10 lg:pr-0">
              <p className="mb-2 text-[13px] font-black uppercase tracking-[0.18em] text-white/88 md:text-[14px]">
                Live estimate
              </p>

              <h2 className="max-w-full break-words text-[1.95rem] font-black leading-none md:text-[2.45rem]">
                {formatCompactCurrency(animatedTotal)}
              </h2>

              <p className="mt-1 max-w-[340px] text-[14.5px] leading-relaxed text-white/97 md:mt-1.5 md:text-base">
                {totalKwh > 0
                  ? `Estimated ${billPeriodDays}-day electricity bill`
                  : "Start with your country, then add appliances."}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-3.5">
                <button
                  type="button"
                  onClick={() =>
                    inputSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    })
                  }
                  className="wmb-hero-action-primary min-w-0 cursor-pointer rounded-full px-2 py-1.5 text-[11px] font-extrabold text-white min-[390px]:shrink-0 min-[390px]:px-3.5 min-[390px]:text-[12px] md:px-4 md:py-2"
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
                  className="wmb-hero-action-secondary min-w-0 cursor-pointer rounded-full px-2 py-1.5 text-[11px] font-bold text-white/92 min-[390px]:shrink-0 min-[390px]:px-3.5 min-[390px]:text-[12px]"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <BarChart3 size={13} strokeWidth={2.15} /> Insights
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection(howEstimatesSectionRef, 12)}
                  className="hidden"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} strokeWidth={2.15} /> <span className="min-[390px]:hidden">Learn</span><span className="hidden min-[390px]:inline">Let’s learn</span>
                  </span>
                </button>
              </div>


              <div className="mt-5 hidden max-w-[390px] text-white/88 lg:block">
                <button
                  type="button"
                  onClick={() => setShowEstimateHelp(!showEstimateHelp)}
                  className="w-fit cursor-pointer text-xs font-extrabold underline underline-offset-4 text-white/95 hover:text-white"
                >
                  {showEstimateHelp ? "Hide estimate note" : "Why is this only an estimate?"}
                </button>

                <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-white/78">
                  Your actual bill may include extra charges, taxes, price changes, and usage differences.
                </p>

                {showEstimateHelp && (
                  <p className="mt-2 text-[12px] leading-relaxed text-white/74">
                    Actual bills may also include electricity supply charges, delivery charges, service fees, VAT/taxes, and other provider charges.
                  </p>
                )}
              </div>
            </div>

            <div className="hidden">
              <div className="flex h-full flex-col justify-center">
                <p className="text-[12px] font-black uppercase tracking-[0.14em] text-white">
                      Estimate in 3 simple steps
                </p>

                <div className="mt-1.5 grid grid-cols-3 items-stretch gap-1 text-[9px] font-extrabold text-white/94 min-[390px]:text-[10px] lg:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      inputSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      })
                    }
                    className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full bg-white/[0.145] px-1 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.18] min-[390px]:px-2"
                  >
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100/24 text-[10px] text-white">1</span>
                    <span className="truncate">Country</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      inputSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      })
                    }
                    className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full bg-white/[0.145] px-1 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.18] min-[390px]:px-2"
                  >
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100/24 text-[10px] text-white">2</span>
                    <span className="truncate">Bill / rate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      householdPresetSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      })
                    }
                    className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-1 rounded-full bg-white/[0.145] px-1 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.18] min-[390px]:px-2"
                  >
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100/24 text-[10px] text-white">3</span>
                    <span className="truncate">Appliances</span>
                  </button>
                </div>

                <div className="mt-2 hidden gap-1.5 text-[12px] font-extrabold text-white/94 lg:grid">
                  <button
                    type="button"
                    onClick={() =>
                      inputSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      })
                    }
                    className="flex min-h-[31px] w-full cursor-pointer items-center gap-2 rounded-xl bg-white/[0.145] px-3 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.18]"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100/24 text-[11px] text-white">1</span>
                    <span>Select country</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      inputSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      })
                    }
                    className="flex min-h-[31px] w-full cursor-pointer items-center gap-2 rounded-xl bg-white/[0.145] px-3 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.18]"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100/24 text-[11px] text-white">2</span>
                    <span>Optional bill / rate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      householdPresetSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      })
                    }
                    className="flex min-h-[31px] w-full cursor-pointer items-center gap-2 rounded-xl bg-white/[0.145] px-3 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.18]"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100/24 text-[11px] text-white">3</span>
                    <span>Add appliances</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2 lg:mr-8 xl:mr-10">
              <div className="grid min-w-0 grid-cols-3 border-y border-white/[0.14] py-3">
                <div className="min-w-0 pr-3">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-white/60">Usage</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{formatCompactNumber(animatedTotalKwh)} kWh</p>
                </div>
                <div className="min-w-0 border-l border-white/[0.14] px-3">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-white/60">Rate</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{activeRate > 0 ? `${displayCurrency}${activeRate}/kWh` : "Not set"}</p>
                </div>
                <div className="min-w-0 border-l border-white/[0.14] pl-3">
                  <p className="text-[9.5px] font-black uppercase tracking-[0.1em] text-white/60">Per day</p>
                  <p className="mt-1 truncate text-sm font-black text-white">{formatCompactCurrency(animatedDailyAverage)}</p>
                </div>
              </div>

              <div className={`wmb-mobile-driver-strip min-h-[92px] items-center rounded-2xl px-3 py-3 lg:min-h-[92px] lg:px-3.5 ${topAppliance?.name ? "flex" : "hidden"}`}>
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/76">
                      Biggest energy user
                    </p>

                    <p className="mt-0.5 truncate text-sm font-black text-white">
                      {topAppliance?.name || "Start by adding appliances"}
                    </p>

                    <p className="mt-1 text-[12px] font-semibold leading-snug text-white/86">
                      {topAppliance?.name
                        ? hasRateForSavings
                          ? `Possible savings estimate: ${formatCompactCurrency(possibleSavings)}/${savingsPeriodLabel} by reducing usage by ${savingsReductionLabel}.`
                          : "Select a country or enter your rate to see possible savings."
                        : "Your highest energy-consuming appliance will appear here."}
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
          </div>

        </div>}


        {replacedOwnEstimate && (
          <div
            role="status"
            className={`mb-4 flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
              darkMode
                ? "border-amber-200/25 bg-amber-200/10 text-amber-100"
                : "border-amber-200/70 bg-amber-50/70 text-amber-900"
            }`}
          >
            <p className="text-xs font-semibold leading-5">
              You&rsquo;re looking at a shared estimate. Your own is saved and can be brought back.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={restoreOwnEstimate}
                className={`cursor-pointer rounded-full px-3.5 py-2 text-xs font-black transition ${
                  darkMode ? "bg-amber-200/20 text-amber-50 hover:bg-amber-200/30" : "bg-amber-200/80 text-amber-950 hover:bg-amber-200"
                }`}
              >
                Restore mine
              </button>
              <button
                type="button"
                onClick={keepSharedEstimate}
                className={`cursor-pointer rounded-full px-3.5 py-2 text-xs font-bold transition ${
                  darkMode ? "text-amber-100/80 hover:text-amber-50" : "text-amber-900/80 hover:text-amber-950"
                }`}
              >
                Keep this one
              </button>
            </div>
          </div>
        )}

        <div id="calculator" ref={inputSectionRef} className="grid scroll-mt-6 md:grid-cols-2 gap-4 mb-6">
          <div ref={countryDropdownRef} className="relative">
            <label className="block">
              <span className={`mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] ${
                darkMode ? "text-slate-200" : "text-slate-500"
              }`}>
                Country
              </span>

              <div className="relative">
                <input
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={showCountryOptions}
                  aria-controls="country-options"
                  aria-activedescendant={showCountryOptions && countryOptionIndex >= 0 ? `country-option-${countryOptionIndex}` : undefined}
                  className="w-full p-4 pr-12 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
                  placeholder="Select or type your country"
                  value={countrySearchTerm}
                  onFocus={openCountryOptions}
                  onKeyDown={handleCountryKeyDown}
                  onChange={(e) => {
                    setCountrySearchTerm(e.target.value);
                    setShowCountryOptions(true);
                    setCountryOptionIndex(0);
                  }}
                />

                <button
                  type="button"
                  onClick={() => showCountryOptions ? setShowCountryOptions(false) : openCountryOptions()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-xl px-2 py-1 text-sm font-black text-emerald-700 hover:bg-emerald-50"
                  aria-label="Show country options"
                  aria-expanded={showCountryOptions}
                  aria-controls="country-options"
                >
                  <ChevronDown size={17} className={`transition-transform ${showCountryOptions ? "rotate-180" : ""}`} />
                </button>
              </div>
            </label>

            {showCountryOptions && (
              <div id="country-options" role="listbox" aria-label="Countries" className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-emerald-100 bg-white p-1.5 text-black shadow-xl ring-1 ring-emerald-950/[0.08]">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c, index) => (
                    <button
                      id={`country-option-${index}`}
                      key={c.name}
                      type="button"
                      role="option"
                      aria-selected={c.name === country.name}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setCountryOptionIndex(index)}
                      onClick={() => selectCountry(c)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-emerald-50 ${
                        c.name === country.name || index === countryOptionIndex ? "bg-emerald-50 font-black text-emerald-800" : "text-gray-800"
                      }`}
                    >
                      <span className="min-w-0 truncate">{c.flag} {c.name}</span>
                      {c.name === country.name && (
                        <span className="shrink-0 text-xs font-black text-emerald-700">Selected</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-gray-500">No country found.</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block">
              <span className={`mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] ${
              darkMode ? "text-slate-200" : "text-slate-500"
            }`}>
                Electricity Rate / kWh
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

            <div className={`mt-2.5 space-y-2 px-1 text-[11.5px] ${darkMode ? "text-slate-200/85" : "text-slate-500"}`}>
              <p className="leading-5">Leave this blank to use an indicative country default.</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={() => setShowProviderRateGuide(true)}
                  className={`font-extrabold underline decoration-emerald-300/50 underline-offset-4 transition-colors ${darkMode ? "text-emerald-200 hover:text-emerald-100" : "text-emerald-700 hover:text-emerald-800"}`}
                >
                  Find my bill rate
                </button>
                <Link href="/rates" className={`font-extrabold underline decoration-emerald-300/50 underline-offset-4 transition-colors ${darkMode ? "text-emerald-200 hover:text-emerald-100" : "text-emerald-700 hover:text-emerald-800"}`}>
                  Browse official sources
                </Link>
                {country.name !== COUNTRY_PLACEHOLDER_NAME && !isOtherCountry && (
                  <>
                    <span className="wmb-rate-status-pill">{hasCustomRate ? "Using your custom rate" : "Indicative default"}</span>
                    {!hasCustomRate && rateReference && (
                      <a href={rateReference.url} target="_blank" rel="noopener noreferrer" title={`${rateReference.authority}. ${rateReference.coverage}`} aria-label={`Official rate context from ${rateReference.label}. ${rateReference.coverage}`} className={`text-[10.5px] font-black underline underline-offset-4 ${darkMode ? "text-emerald-200" : "text-emerald-700"}`}>
                        Source: {rateReference.label}
                      </a>
                    )}
                    {!hasCustomRate && !rateReference && <span className="text-[10.5px] font-semibold">Verify it against your provider bill.</span>}
                  </>
                )}
              </div>
            </div>

            {rateWarningType && (
              <p className={`mt-2 rounded-2xl border px-3 py-2 text-xs font-medium ${darkMode ? "border-amber-200/25 bg-amber-200/10 text-amber-100" : "border-amber-200/70 bg-amber-50/70 text-amber-800"}`}>
                {rateWarningMessage}
              </p>
            )}
          </div>
        </div>


        {isOtherCountry && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              aria-label="Country name"
              maxLength={64}
              className="p-4 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Your country name"
              value={customCountryName}
              onChange={(e) => setCustomCountryName(e.target.value)}
            />

            <input
              type="text"
              aria-label="Currency symbol or code"
              maxLength={8}
              className="p-4 rounded-2xl border border-gray-200 bg-[#f7f8f8] text-black shadow-sm ring-1 ring-emerald-950/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition"
              placeholder="Currency symbol, e.g. ₱, $, €, RM"
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value)}
            />
          </div>
        )}


        <div className="mb-4 mt-7 rounded-3xl bg-[#f7f8f8] p-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] md:mt-0 md:flex md:items-center md:justify-between md:gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Start here</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-gray-950">Choose how you want to build your estimate.</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">Start with a preset, or add appliances manually.</p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 md:mt-0 md:min-w-[360px]">
            <button
              type="button"
              onClick={() =>
                householdPresetSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md active:scale-[0.98]"
            >
              <Home size={16} strokeWidth={2.4} />
              Start with preset
            </button>

            <button
              type="button"
              onClick={() =>
                quickAddSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md active:scale-[0.98]"
            >
              <Calculator size={16} strokeWidth={2.4} />
              Build manually
            </button>
          </div>
        </div>

        <div ref={householdPresetSectionRef} className="mb-4 rounded-3xl bg-[#f7f8f8] p-5 md:px-5 md:py-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition-all duration-200 hover:shadow-md">
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
              Tap a preset to preview the included appliances first. For better accuracy, review the wattage, hours, and days after using a preset.
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
                        Details
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
                    Estimated preset usage: <span className="font-bold text-gray-800">~{calculatePresetKwh(activeHouseholdPreset).toFixed(0)} kWh/month</span> before edits.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyHouseholdPresetFromPreview(activeHouseholdPreset, "replace")}
                    className="cursor-pointer rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md active:scale-[0.98]"
                  >
                    Use this preset
                  </button>

                  {hasExistingAppliances && (
                    <button
                      type="button"
                      onClick={() => applyHouseholdPreset(activeHouseholdPreset, "add")}
                      className="cursor-pointer rounded-full border border-emerald-100 bg-emerald-50/60 px-3.5 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100/70 hover:shadow-md active:scale-[0.98]"
                    >
                      Add to existing
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedHouseholdPreset(null)}
                    className="cursor-pointer rounded-full border border-emerald-100/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  >
                    Hide details
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activeHouseholdPreset.appliances.map((item) => (
                  <div
                    key={`${activeHouseholdPreset.name}-${item.category}-${item.name}`}
                    className="rounded-2xl border border-gray-200/80 bg-white/85 px-3 py-2 text-xs text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                  >
                    <span className="font-extrabold">{item.quantity || 1}× {item.name}</span>
                    {/* The duty factor is shown, not applied invisibly: without
                        it the figures on this line would not multiply out to the
                        kWh beside them. */}
                    <span className="block text-gray-500">
                      {item.watts}W • {item.hours}h/day
                      {resolveDuty(item) < 1 ? ` • runs ~${Math.round(resolveDuty(item) * 100)}% of that` : ""}
                      {" • "}{item.days} days/mo
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              const nextShowAll = !showAllHouseholdPresets;
              setShowAllHouseholdPresets(nextShowAll);

              if (!nextShowAll) {
                setSelectedHouseholdPreset(null);
              }
            }}
            className="mt-4 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
          >
            {showAllHouseholdPresets ? "Show Less" : "More Presets"}
          </button>
        </div>

        <div ref={quickAddSectionRef} className="mb-2 rounded-3xl bg-[#f7f8f8] p-4 md:mb-4 md:px-5 md:py-5 text-black shadow-sm ring-1 ring-emerald-950/[0.06]">
          <div className="mb-3.5 flex flex-col gap-3.5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold">Quick Add Appliances</h2>
                <span className="rounded-full border border-emerald-100/80 bg-emerald-50/45 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  Manual builder
                </span>
              </div>
              <div className="mt-1 text-sm leading-relaxed text-gray-600">
                <p>
                  Choose a common appliance, then fine-tune its power, hours, and days.
                </p>

                <button
                  type="button"
                  onClick={() => setShowWattageHelp(!showWattageHelp)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline"
                >
                  <CheckCircle2 size={12} strokeWidth={2.4} />
                  {showWattageHelp ? "Hide wattage help" : "Where do I find wattage?"}
                </button>
              </div>

              {showWattageHelp && (
                <div className="mt-2 max-w-xl rounded-2xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-xs leading-relaxed text-gray-600 transition-all duration-300 ease-out">
                  <p>
                    Look for the label or sticker on the appliance, power adapter, user manual, or search the exact model online. The actual appliance power gives a better estimate than a generic preset.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowWattageGuideImage(true)}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                  >
                    <CheckCircle2 size={12} strokeWidth={2.4} />
                    View visual guide
                  </button>
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[380px] md:flex-row md:items-center">
              <input
                type="text"
                maxLength={80}
                className="w-full rounded-2xl border border-gray-200 bg-white/70 px-3 py-2.5 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 md:min-w-[240px] md:p-3"
                placeholder="Search appliance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="w-full rounded-2xl border border-gray-200 bg-white/70 px-3 py-2.5 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 md:w-[130px] md:p-3"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Popular appliances
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Start with common appliances, then fine-tune the details below.
              </p>
            </div>

            {filteredPresets.length > 10 && showAllPresets && (
              <button
                type="button"
                onClick={() => setShowAllPresets(false)}
                className="w-fit cursor-pointer rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                Show less
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {visiblePresets.map((p, index) => {
              const hideOnMobile = !showAllPresets && index >= 4;

              return (
                <button
                  key={`${p.category}-${p.name}`}
                  onClick={() => addPreset(p)}
                  className={`${hideOnMobile ? "hidden md:inline-flex" : "inline-flex"} items-center rounded-full border border-emerald-100/80 bg-emerald-50/65 px-2.5 py-1.5 text-[13px] font-semibold text-emerald-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100/80 hover:shadow-md active:scale-[0.98] md:px-3.5 md:py-1.5 md:text-sm`}
                  title={`${p.category} • ${p.watts}W • ${p.hours}h/day • ${p.days} days/month`}
                >
                  + {p.name}
                </button>
              );
            })}
          </div>

          <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {filteredPresets.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllPresets((current) => !current)}
                  className="cursor-pointer rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  {showAllPresets ? "Show less" : "Show more"}
                </button>
              )}

              <button
                onClick={addAppliance}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md"
              >
                + Add custom appliance
              </button>
            </div>

            <button
              onClick={clearAll}
              title="Reset all calculator inputs"
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:text-red-900"
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

        <div ref={applianceSectionRef} className="mb-8 space-y-3.5 scroll-mt-24 md:space-y-4">
          <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                Appliance builder
              </p>
              <p className={`mt-1 text-sm ${darkMode ? "text-white/70" : "text-slate-600"}`}>
                Review each appliance, then fine-tune watts, hours, and usage days.
              </p>
            </div>

            {completedApplianceCount > 0 && (
              <div className={`text-xs font-bold ${darkMode ? "text-white/62" : "text-slate-500"}`}>
                {completedApplianceCount} active {completedApplianceCount === 1 ? "appliance" : "appliances"}
              </div>
            )}
          </div>

          {visibleApplianceEntries.map(({ item, index }) => {
            const i = index;
            const wattageGuide = item.name
              ? item.wattageGuide || getWattageGuide(item.name, item.category)
              : "";
            const showUnusuallyHighWarning = isUnusuallyHighAppliance(item);

            return (
              <div
                key={i}
                className={`relative overflow-hidden rounded-[18px] border p-3 text-black shadow-sm transition-all duration-500 md:rounded-[20px] md:p-4 ${
                  highlightedIndex === i
                    ? "border-emerald-300/95 bg-emerald-50/95 shadow-[0_12px_30px_rgba(5,150,105,0.10)] ring-2 ring-emerald-300/75"
                    : "border-emerald-950/[0.07] bg-[#fbfcfa]/95 shadow-[0_8px_22px_rgba(15,23,42,0.035)] ring-1 ring-white/80 hover:border-emerald-300/80 hover:bg-white/95 hover:shadow-[0_10px_26px_rgba(5,150,105,0.075)] hover:ring-1 hover:ring-emerald-200/75"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-3 pr-7 md:mb-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
                        Appliance {i + 1}
                      </p>

                      {item.category && (
                        <span className="border-l border-emerald-200 pl-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700/80">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-0.5 truncate pr-2 text-[15px] font-black tracking-tight text-slate-950 md:mt-0.5 md:text-lg">
                      {item.name || "Custom appliance"}
                    </h3>
                  </div>

                  <button
                    onClick={() => removeAppliance(i)}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-base font-semibold leading-none text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 md:right-4 md:top-4"
                    title="Remove appliance"
                    aria-label="Remove appliance"
                  >
                    ×
                  </button>
                </div>

                <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_300px] md:items-start md:gap-3">
                  <div className="min-w-0 space-y-2 md:space-y-2.5">
                    <div className="grid gap-2.5 md:grid-cols-[minmax(180px,1.35fr)_82px_110px_110px_110px] md:gap-2.5">
                        <label className="block min-w-0">
                          <span className="mb-1.5 block text-xs font-bold text-slate-600">Appliance</span>
                          <input
                            className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] shadow-[0_3px_10px_rgba(15,23,42,0.045)] transition focus:border-emerald-400/85 focus:outline-none focus:ring-2 focus:ring-emerald-200/70 md:rounded-xl md:py-2 md:text-sm"
                            placeholder="Appliance name"
                            value={item.name}
                            onChange={(e) => updateAppliance(i, "name", e.target.value)}
                          />
                        </label>

                        <label className="block min-w-0">
                          <span className="mb-1.5 block text-xs font-bold text-slate-600">Quantity</span>
                          <input
                            className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] shadow-[0_3px_10px_rgba(15,23,42,0.045)] transition focus:border-emerald-400/85 focus:outline-none focus:ring-2 focus:ring-emerald-200/70 md:rounded-xl md:py-2 md:text-sm"
                            type="number"
                            min="1"
                            max="999999"
                            step="1"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateAppliance(i, "quantity", cleanDigitCappedNumberInput(e.target.value, 6, { allowZero: false }))}
                          />
                        </label>

                        <label className="block min-w-0">
                          <span className="mb-1.5 block text-xs font-bold text-slate-600" title="Appliance power in watts. This is usually printed on the appliance label or adapter.">Power (W)</span>
                          <input
                            className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] shadow-[0_3px_10px_rgba(15,23,42,0.045)] transition focus:border-emerald-400/85 focus:outline-none focus:ring-2 focus:ring-emerald-200/70 md:rounded-xl md:py-2 md:text-sm"
                            type="number"
                            min="0"
                            max="9999999"
                            step="any"
                            placeholder="e.g. 150"
                            value={item.watts}
                            onChange={(e) => updateAppliance(i, "watts", cleanDigitCappedNumberInput(e.target.value, 7))}
                          />
                        </label>

                        <label className="block min-w-0">
                          <span className="mb-1.5 block text-xs font-bold text-slate-600" title="How many hours you usually use this appliance per day.">Hours / Day</span>
                          <input
                            className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] shadow-[0_3px_10px_rgba(15,23,42,0.045)] transition focus:border-emerald-400/85 focus:outline-none focus:ring-2 focus:ring-emerald-200/70 md:rounded-xl md:py-2 md:text-sm"
                            type="number"
                            min="0"
                            max="24"
                            step="any"
                            placeholder="e.g. 8"
                            value={item.hours}
                            onChange={(e) => updateAppliance(i, "hours", cleanCappedNumberInput(e.target.value, 24))}
                          />
                        </label>

                        <label className="block min-w-0">
                          <span className="mb-1.5 block text-xs font-bold text-slate-600" title="How many days per month you usually use this appliance.">Days / Month</span>
                          <input
                            className="w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-2.5 text-[15px] shadow-[0_3px_10px_rgba(15,23,42,0.045)] transition focus:border-emerald-400/85 focus:outline-none focus:ring-2 focus:ring-emerald-200/70 md:rounded-xl md:py-2 md:text-sm"
                            type="number"
                            min="0"
                            max="31"
                            step="any"
                            placeholder="e.g. 30"
                            value={item.days}
                            onChange={(e) => updateAppliance(i, "days", cleanCappedNumberInput(e.target.value, 31))}
                          />
                        </label>
                      </div>

                    {item.name && (
                      <details className="pt-1 md:pt-1.5">
                        <summary className="inline-flex cursor-pointer items-center text-xs font-semibold text-emerald-800/95 transition hover:text-emerald-700 hover:underline">
                          Need help finding appliance power?
                        </summary>

                        <div className="mt-1.5 space-y-2">
                          <p className="text-xs leading-relaxed text-slate-600/95">
                            💡 {wattageGuide}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowWattageGuideImage(true)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition hover:bg-emerald-50"
                            >
                              View visual guide
                            </button>

                            <Link
                              href="/game"
                              className="inline-flex items-center rounded-lg border border-emerald-100/80 bg-white/65 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:underline"
                            >
                              Play Guess the Watts
                            </Link>

                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(
                                `${item.name} watts power consumption`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg border border-emerald-100/80 bg-white/65 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:underline"
                            >
                              🔎 Search actual power for “{item.name}”
                            </a>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="md:mt-[9px] md:self-start">
                    <div className="grid grid-cols-2 items-center gap-3 rounded-[15px] border border-emerald-200/75 bg-emerald-50/35 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] md:min-h-[66px] md:rounded-[16px] md:px-5 md:py-2.5">
                      <div className="min-w-0 md:text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500/90 md:text-[10.5px]">Consumption</p>
                        <h3 className={`mt-0.5 whitespace-nowrap font-black leading-tight text-slate-950 ${showUnusuallyHighWarning ? "text-[0.88rem] md:text-[0.92rem]" : "text-[0.98rem] md:text-[1.02rem]"}`}>
                          {safeNumber(item.watts) > 0 ? `${formatCompactNumber(item.kwh)} kWh` : "—"}
                        </h3>
                        {resolveDuty(item) < 1 && safeNumber(item.watts) > 0 && (
                          <p className="mt-0.5 text-[10px] font-semibold leading-snug text-slate-500">
                            runs ~{Math.round(resolveDuty(item) * 100)}% of those hours
                          </p>
                        )}
                      </div>

                      <div className="min-w-0 border-l border-emerald-200/55 pl-3 text-right md:pl-4 md:text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500/90 md:text-[10.5px]">Estimated cost</p>
                        <h3 className={`mt-0.5 whitespace-nowrap font-black leading-tight tracking-tight text-emerald-600 ${showUnusuallyHighWarning ? "text-[0.96rem] md:text-[1rem]" : "text-[1.18rem] md:text-[1.2rem]"}`}>
                          {safeNumber(item.watts) <= 0 ? "—" : hasValidRateForEstimate ? formatCompactCurrency(item.cost) : "Add rate"}
                        </h3>
                      </div>
                    </div>

                    <p
                      className={`mt-1.5 min-h-[1.7rem] text-[11px] font-semibold leading-snug text-amber-700 transition-opacity ${
                        showUnusuallyHighWarning ? "opacity-100" : "pointer-events-none opacity-0"
                      }`}
                      aria-hidden={!showUnusuallyHighWarning}
                    >
                      ⚠ Check this appliance — the estimate looks unusually high.
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

          {shouldCollapseAppliances && (
            <div className="flex justify-center pt-0 mb-8">
              <button
                type="button"
                onClick={() => setShowAllAddedAppliances((current) => !current)}
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-extrabold text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
              >
                {showAllAddedAppliances ? "Show fewer appliances" : "Show more appliances"}
              </button>
            </div>
          )}


        {/* Everything that refines an estimate now sits after the estimate
            exists. These three panels used to stand between the rate field and
            the appliance list, so the path to a first number ran through tariff
            modelling, bill reconciliation and a diagnostic tool. */}
        <div className="mb-2 mt-5 px-1">
          <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${darkMode ? "text-emerald-200/80" : "text-emerald-700"}`}>Refine your estimate</p>
          <p className={`mt-1 text-[12.5px] leading-5 ${darkMode ? "text-white/70" : "text-slate-600"}`}>Optional. Add time-of-use or tiered pricing, enter details from your bill, or compare two bills.</p>
        </div>
        <section className="wmb-light-panel mb-4 overflow-hidden rounded-3xl border border-emerald-950/[0.07] bg-white text-slate-950 shadow-sm" aria-labelledby="advanced-tariff-heading">
          <button
            type="button"
            onClick={() => setShowAdvancedTariff((current) => !current)}
            className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left sm:px-5"
            aria-expanded={showAdvancedTariff}
            aria-controls="advanced-tariff-content"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><SlidersHorizontal size={16} /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="advanced-tariff-heading" className="text-base font-black tracking-tight">Advanced electricity pricing</h2>
                  <span className="wmb-meta-pill">Optional</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">Use time-of-use, tiered prices, supply charges, tax, or solar export credit.</p>
              </div>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition">
              <ChevronDown size={18} className={`transition-transform duration-200 ${showAdvancedTariff ? "rotate-180" : ""}`} />
            </span>
          </button>

          {showAdvancedTariff && <div id="advanced-tariff-content" className="border-t border-slate-200 p-4 sm:p-5">
            <div className="inline-flex w-full rounded-2xl bg-slate-100 p-1 sm:w-auto" role="group" aria-label="Electricity pricing type">
              {[
                { id: "simple", label: "Single rate" },
                { id: "timeOfUse", label: "Time-of-use" },
                { id: "tiered", label: "Tiered" },
              ].map((mode) => <button
                key={mode.id}
                type="button"
                onClick={() => setTariffMode(mode.id)}
                className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-[11px] font-black transition sm:flex-none ${tariffMode === mode.id ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}
              >{mode.label}</button>)}
            </div>

            {tariffMode === "simple" && <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3 text-xs leading-5 text-slate-700">The main electricity-rate field above is used for every kWh. Add the bill items below only if they apply.</p>}

            {tariffMode === "timeOfUse" && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Peak rate / kWh</span><input type="number" min="0" step="any" value={peakRate} onChange={(event) => setPeakRate(cleanNonNegativeInput(event.target.value))} placeholder={`${displayCurrency || "Currency"} peak`} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Off-peak rate / kWh</span><input type="number" min="0" step="any" value={offPeakRate} onChange={(event) => setOffPeakRate(cleanNonNegativeInput(event.target.value))} placeholder={`${displayCurrency || "Currency"} off-peak`} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Usage during peak</span><div className="relative"><input type="number" min="0" max="100" value={peakShare} onChange={(event) => setPeakShare(cleanCappedNumberInput(event.target.value, 100))} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 pr-10 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">%</span></div></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Shoulder rate / kWh</span><input type="number" min="0" step="any" value={shoulderRate} onChange={(event) => setShoulderRate(cleanNonNegativeInput(event.target.value))} placeholder="Optional" className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Usage during shoulder</span><div className="relative"><input type="number" min="0" max="100" value={shoulderShare} onChange={(event) => setShoulderShare(cleanCappedNumberInput(event.target.value, 100))} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 pr-10 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">%</span></div></label>
            </div>}

            {tariffMode === "timeOfUse" && <p className={`mt-2 text-[11px] leading-5 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Enter peak and optional shoulder shares from your bill or meter. The remaining usage is assigned to off-peak.</p>}

            {tariffMode === "tiered" && <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>First tier ends at</span><div className="relative"><input type="number" min="0" value={tierLimit} onChange={(event) => setTierLimit(cleanNonNegativeInput(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 pr-12 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">kWh</span></div></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>First-tier rate</span><input type="number" min="0" step="any" value={tierOneRate} onChange={(event) => setTierOneRate(cleanNonNegativeInput(event.target.value))} placeholder={`${displayCurrency || "Currency"} / kWh`} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Next-tier rate</span><input type="number" min="0" step="any" value={tierTwoRate} onChange={(event) => setTierTwoRate(cleanNonNegativeInput(event.target.value))} placeholder={`${displayCurrency || "Currency"} / kWh`} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 text-sm text-black outline-none ring-1 ring-emerald-950/[0.04] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /></label>
            </div>}

            {tariffMode === "tiered" && <p className={`mt-2 text-[11px] leading-5 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Only the kWh above the first-tier threshold is charged at the next-tier rate.</p>}

            {isAdvancedRateIncomplete && <p role="status" className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold leading-5 text-amber-900">{safeNumber(peakShare) + safeNumber(shoulderShare) > 100 ? "Peak and shoulder shares must total 100% or less." : safeNumber(shoulderShare) > 0 && safeNumber(shoulderRate) <= 0 ? "Add a shoulder rate for the shoulder usage share." : "Add both peak and off-peak rates to avoid treating a missing price as zero."}</p>}

            {/* Prorating a monthly allowance is the right arithmetic, but it is
                not what the bill literally says, so it is stated rather than
                done quietly. */}
            {tariffMode === "tiered" && tierProrated && (
              <p role="status" className={`mt-3 rounded-2xl border px-3.5 py-2.5 text-xs font-semibold leading-5 ${darkMode ? "border-emerald-200/20 bg-emerald-200/10 text-emerald-100" : "border-emerald-200/70 bg-emerald-50/70 text-emerald-900"}`}>
                Tier allowances are monthly, and this bill covers {billPeriodDays} days — so the first tier has been
                scaled to {scaledTierLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh for this period.
              </p>
            )}

            <div className={`mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4 ${darkMode ? "border-white/[0.08]" : "border-slate-100"}`}>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Daily supply charge</span><input type="number" min="0" step="any" value={dailySupplyCharge} onChange={(event) => setDailySupplyCharge(cleanNonNegativeInput(event.target.value))} placeholder={`${displayCurrency || "Currency"} / day`} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 text-sm text-black outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Tax</span><div className="relative"><input type="number" min="0" max="100" value={taxPercent} onChange={(event) => setTaxPercent(cleanCappedNumberInput(event.target.value, 100))} placeholder="Optional" className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 pr-10 text-sm text-black outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">%</span></div></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Solar exported</span><div className="relative"><input type="number" min="0" step="any" value={solarExportKwh} onChange={(event) => setSolarExportKwh(cleanNonNegativeInput(event.target.value))} placeholder="Optional" className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 pr-12 text-sm text-black outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">kWh</span></div></label>
              <label className="block"><span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Export credit / kWh</span><input type="number" min="0" step="any" value={solarExportRate} onChange={(event) => setSolarExportRate(cleanNonNegativeInput(event.target.value))} placeholder={`${displayCurrency || "Currency"} credit`} className="w-full rounded-2xl border border-slate-200 bg-[#f7f8f8] p-3.5 text-sm text-black outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200" /></label>
            </div>

            <p className={`mt-2 text-[11px] leading-5 ${darkMode ? "text-slate-300" : "text-slate-500"}`}>For solar, use exported grid kWh from your bill. Electricity used directly in the home is not export.</p>

            {totalKwh > 0 && hasValidRateForEstimate && <div className={`mt-4 grid gap-2 rounded-2xl border p-3 sm:grid-cols-4 ${darkMode ? "border-emerald-300/10 bg-emerald-300/[0.05]" : "border-emerald-100 bg-emerald-50/55"}`}>
              {[
                ["Energy", formatCompactCurrency(usageCost)],
                ["Supply + fixed", formatCompactCurrency(supplyChargeAmount + fixedChargeAmount)],
                ["Solar credit", solarCreditAmount > 0 ? `-${formatCompactCurrency(solarCreditAmount)}` : formatCompactCurrency(0)],
                ["Tax", formatCompactCurrency(taxAmount)],
              ].map(([label, value]) => <div key={label}><p className={`text-[9px] font-black uppercase tracking-[0.1em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>)}
            </div>}
          </div>}
        </section>
        <section className="wmb-light-panel mb-4 overflow-hidden rounded-3xl border border-emerald-950/[0.07] bg-white text-slate-950 shadow-sm" aria-labelledby="bill-details-heading">
          <button
            type="button"
            onClick={() => setShowBillDetails((current) => !current)}
            className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left sm:px-5"
            aria-expanded={showBillDetails}
            aria-controls="bill-details-content"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="bill-details-heading" className="text-base font-black tracking-tight">Bill details</h2>
                <span className="wmb-meta-pill">Optional</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Use details from your bill for a more precise estimate.</p>
            </div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition">
              <ChevronDown size={18} className={`transition-transform duration-200 ${showBillDetails ? "rotate-180" : ""}`} />
            </span>
          </button>

          {showBillDetails && <div id="bill-details-content" className="border-t border-slate-100 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">Current bill total</span>
              <input
                type="number"
                min="0"
                className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f8] p-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={`${displayCurrency || "Currency"} total`}
                value={actualBill}
                onChange={(event) => setActualBill(cleanNonNegativeInput(event.target.value))}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">Billing period days</span>
              <input
                type="number"
                min="1"
                max="366"
                className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f8] p-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={billingDays}
                onChange={(event) => setBillingDays(cleanCappedNumberInput(event.target.value, 366, { allowZero: false }))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">Fixed charges for period</span>
              <input
                type="number"
                min="0"
                step="any"
                className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f8] p-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={`${displayCurrency || "Currency"} total`}
                value={fixedCharge}
                onChange={(event) => setFixedCharge(cleanNonNegativeInput(event.target.value))}
              />
              <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Supply, standing, service, or other known fixed charges.</p>
            </label>

            <div>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.055em] text-slate-500">kWh shown on your bill</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="w-full rounded-2xl border border-gray-200 bg-[#f7f8f8] p-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Billed energy use"
                  value={billedKwh}
                  onChange={(event) => setBilledKwh(cleanNonNegativeInput(event.target.value))}
                />
              </label>

              {effectiveRate > 0 ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2">
                  <p className="text-xs font-bold text-emerald-800">
                    Effective rate: {displayCurrency}{effectiveRate.toLocaleString(undefined, { maximumFractionDigits: 4 })}/kWh
                  </p>
                  <button type="button" onClick={applyEffectiveRate} className="shrink-0 text-xs font-black text-emerald-700 underline underline-offset-4">
                    Use rate
                  </button>
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Add your bill total and billed kWh to calculate an effective usage rate.</p>
              )}
            </div>
          </div>

          {fixedChargeAmount > 0 && (
            <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:grid-cols-3">
              <p>Usage estimate: <span className="font-black">{formatCurrency(usageCost)}</span></p>
              <p>Fixed charges: <span className="font-black">{formatCurrency(fixedChargeAmount)}</span></p>
              <p>Combined estimate: <span className="font-black text-emerald-700">{formatCurrency(total)}</span></p>
            </div>
          )}
          </div>}
        </section>
        <section className="wmb-light-panel mb-4 overflow-hidden rounded-3xl border border-emerald-950/[0.07] bg-white text-slate-950 shadow-sm" aria-labelledby="bill-detective-heading">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                <SearchCheck size={22} strokeWidth={2.3} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Explain a bill change</p>
                  <span className="wmb-meta-pill">Beta</span>
                </div>
                <h2 id="bill-detective-heading" className="mt-1 text-xl font-black tracking-tight">Bill Detective</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Compare two bills fairly and estimate whether usage, the effective rate, or fixed charges drove the change.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBillDetective((current) => !current)}
              aria-expanded={showBillDetective}
              aria-controls="bill-detective-content"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 sm:w-auto"
            >
              {showBillDetective ? "Hide comparison" : "Compare two bills"}
              <ChevronDown size={16} className={`transition-transform ${showBillDetective ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showBillDetective && (
            <div id="bill-detective-content" className="border-t border-emerald-950/[0.07] px-5 pb-6 pt-5 md:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">{usesDashboardEstimateForDetective ? "Current estimate" : "Current bill"}</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${hasCurrentDetectiveInputs ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}>
                      {usesDashboardEstimateForDetective ? "From dashboard" : hasCurrentDetectiveInputs ? "Bill details" : "Add details above"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Total</p>
                      <p className="mt-0.5 font-black">{currentBillValue > 0 ? formatCurrency(currentBillValue) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Usage</p>
                      <p className="mt-0.5 font-black">{currentKwhValue > 0 ? `${formatCompactNumber(currentKwhValue)} kWh` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Period</p>
                      <p className="mt-0.5 font-black">{billPeriodDays} days</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Effective rate</p>
                      <p className="mt-0.5 font-black">{currentDetectiveEffectiveRate > 0 ? `${displayCurrency}${currentDetectiveEffectiveRate.toLocaleString(undefined, { maximumFractionDigits: 4 })}/kWh` : "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Previous bill</p>
                    <span className={`text-[11px] font-bold ${hasPreviousDetectiveInputs ? "text-emerald-700" : "text-slate-400"}`}>
                      {hasPreviousDetectiveInputs ? "Ready" : "Enter below"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">Bill total</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label="Previous bill total"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder={`${displayCurrency || "Currency"} total`}
                        value={previousBill}
                        onChange={(event) => setPreviousBill(cleanNonNegativeInput(event.target.value))}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">Billed kWh</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label="Previous billed kWh"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder="Energy use"
                        value={previousBilledKwh}
                        onChange={(event) => setPreviousBilledKwh(cleanNonNegativeInput(event.target.value))}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">Period days</span>
                      <input
                        type="number"
                        min="1"
                        max="366"
                        aria-label="Previous billing period days"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        value={previousBillingDays}
                        onChange={(event) => setPreviousBillingDays(cleanCappedNumberInput(event.target.value, 366, { allowZero: false }))}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">Fixed charges</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label="Previous fixed charges"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder="Optional"
                        value={previousFixedCharge}
                        onChange={(event) => setPreviousFixedCharge(cleanNonNegativeInput(event.target.value))}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {!hasValidDetectiveCharges && hasCurrentDetectiveInputs && hasPreviousDetectiveInputs && (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                  A fixed-charge value cannot be equal to or greater than its bill total. Check the current and previous fixed charges.
                </p>
              )}

              <div className={`mt-4 rounded-[24px] border p-5 ${isBillDetectiveReady ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-start gap-3">
                  <BarChart3 className={`mt-0.5 shrink-0 ${isBillDetectiveReady ? "text-emerald-700" : "text-slate-400"}`} size={20} />
                  <div>
                    <p className={`text-[11px] font-black uppercase tracking-[0.12em] ${isBillDetectiveReady ? "text-emerald-700" : "text-slate-500"}`}>Detective result</p>
                    <h3 className="mt-1 text-lg font-black leading-snug">{billDetectiveSummary}</h3>
                    {isBillDetectiveReady && (
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        Comparison uses 30-day equivalents so different billing-period lengths do not distort the result.{usesDashboardEstimateForDetective ? " The current side comes from your calculator estimate, not a provider bill." : ""}
                      </p>
                    )}
                  </div>
                </div>

                {isBillDetectiveReady && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {detectiveDrivers.map((driver) => {
                      const isPrimary = driver.key === primaryDetectiveDriver.key;
                      return (
                        <div key={driver.key} className={`rounded-2xl border p-4 ${isPrimary ? "border-emerald-300 bg-white" : "border-emerald-100 bg-white/75"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{driver.label}</p>
                            {isPrimary && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-800">Main driver</span>}
                          </div>
                          <p className={`mt-2 text-xl font-black ${driver.impact > 0 ? "text-rose-600" : driver.impact < 0 ? "text-emerald-700" : ""}`}>
                            {formatSignedCurrency(driver.impact)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">estimated 30-day contribution</p>
                          {driver.key === "usage" && <p className="mt-2 text-xs font-bold">Daily usage {formatSignedPercent(usageChangePercent)}</p>}
                          {driver.key === "rate" && <p className="mt-2 text-xs font-bold">Effective rate {formatSignedPercent(rateChangePercent)}</p>}
                          {driver.key === "fixed" && <p className="mt-2 text-xs font-bold">Fixed cost {formatSignedCurrency(fixedImpact)}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isBillDetectiveReady && (
                  <p className="mt-4 text-[11px] leading-5 text-slate-500">
                    The three contributions add up to the normalized bill change. The effective rate is blended and may include variable taxes or adjustments. This is a diagnostic estimate, not a provider audit.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section ref={howEstimatesSectionRef} className="mb-5 scroll-mt-32 rounded-3xl bg-white p-4 text-black shadow-sm ring-1 ring-emerald-950/[0.06] sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">How the estimate works</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Power × quantity × time becomes kWh, then your electricity rate turns usage into an estimated cost.
            </p>
          </div>
          <Link href="/learn" className="mt-3 inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 sm:mt-0">
            Visit Learning Hub
          </Link>
        </section>

        <section className="mb-5 rounded-3xl bg-amber-50 p-4 text-black shadow-sm ring-1 ring-amber-600/30 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-5">
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500 text-amber-950">
              <Gamepad2 size={21} strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-800">Learn by playing</p>
              <p className="text-base font-black leading-6 text-slate-950">Guess the Watts</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Not sure what your appliances draw? Guess five of them, see the real figures, and the boxes above get much easier to fill in.
              </p>
            </div>
          </div>
          <Link href="/game" className="mt-3 inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-amber-700 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-amber-800 sm:mt-0">
            Play now
          </Link>
        </section>


        <section className="hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Simple terms
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Electricity words, explained plainly.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowSimpleTerms((current) => !current)}
              className="md:hidden inline-flex shrink-0 cursor-pointer items-center rounded-full border border-emerald-200 bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
            >
              {showSimpleTerms ? "Hide terms" : "Show terms"}
            </button>
          </div>

          <div className={`${showSimpleTerms ? "grid" : "hidden"} mt-4 gap-3 md:grid md:grid-cols-4`}>
            <div className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-emerald-950/[0.05]">
              <h3 className="font-black text-gray-950">Wattage</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">How much electricity an appliance uses while it is running.</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-emerald-950/[0.05]">
              <h3 className="font-black text-gray-950">kWh</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">The total electricity your appliances use over time.</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-emerald-950/[0.05]">
              <h3 className="font-black text-gray-950">Electricity rate</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                The price of each kWh from your electricity provider{providerExample ? `, such as ${providerExample}` : ""}.
              </p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-emerald-950/[0.05]">
              <h3 className="font-black text-gray-950">Estimate</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">A helpful guess based on your inputs. Your actual bill may still include extra charges.</p>
            </div>
          </div>
        </section>

        <section className="hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Understanding wattage
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Wattage is not always constant.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Some appliance labels show the highest possible wattage, but actual use can go up and down while the appliance runs. The label is helpful, but it may not be the amount used every minute.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowWattageGuideImage(true)}
                className="inline-flex w-fit shrink-0 cursor-pointer items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                View wattage guide
              </button>

              <button
                type="button"
                onClick={() => setShowWattageEducation((current) => !current)}
                className="inline-flex w-fit shrink-0 cursor-pointer items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                {showWattageEducation ? "Show less" : "Show more"}
              </button>
            </div>
          </div>

          {showWattageEducation && (
            <div className="mt-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-950/[0.06]">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-lg">💡</div>
                  <h3 className="font-black text-gray-950">Steady wattage</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Lights, basic fans, routers, and chargers usually stay close to their listed wattage while running.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-950/[0.06]">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-lg">🔁</div>
                  <h3 className="font-black text-gray-950">Cycling usage</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    These appliances do not use full power nonstop. Refrigerators, freezers, and some heaters run for a while, then pause once the right temperature is reached.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-950/[0.06]">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-lg">⚙️</div>
                  <h3 className="font-black text-gray-950">Variable wattage</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    Inverter aircons and induction cookers can use more or less electricity depending on the setting, room temperature, cookware, and how hard they are working. Their label may show the highest possible wattage, not the usual average.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm leading-relaxed text-emerald-950">
                For example, an aircon listed at 1,900W may only reach that level during heavy cooling. In normal use, especially with inverter units, it may use much less.
                An induction cooker listed at 2,000W may also use less at lower heat settings.
                For a better estimate, use the wattage that matches your normal use, not always the highest number on the label.
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
                : "Add an appliance to unlock your usage insights."}
            </h2>

            <p className="mt-2 max-w-none text-sm leading-relaxed text-gray-600">
              {topAppliance?.name
                ? `${topAppliance.name} is currently your biggest estimated energy user. Check its wattage and daily hours first if you want a more accurate estimate.`
                : "Start with a preset or add one appliance manually. Your top usage, savings, and comparisons will appear here."}
            </p>
            {topAppliance?.name && (
              <Link href={topApplianceGuidePath} className="mt-3 inline-flex text-xs font-black text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-900">
                Understand this result in the Learning Hub
              </Link>
            )}
          </div>

          {topAppliance?.name ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                <p className="text-xs font-semibold text-gray-500">Potential saving</p>
                <p className="mt-1 text-lg font-black text-emerald-700">
                  {hasRateForSavings ? `${displayCurrency}${safeNumber(possibleSavings).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}` : "—"}
                </p>
                <p className="mt-1 text-xs text-gray-500">{hasRateForSavings ? `over this ${savingsPeriodLabel}, if reduced by ${savingsReductionLabel}` : "Add your electricity rate to estimate money saved"}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <p className="text-xs font-semibold text-gray-500">Usage pattern</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-gray-800">{usagePatternInsight}</p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                <p className="text-xs font-semibold text-gray-500">Quick action</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-gray-800">{savingsTip}</p>
              </div>
            </div>

          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-gray-600">
              Add one appliance with wattage, hours, and days to unlock top-usage insights, possible savings, and appliance comparisons.
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
                        {item.kwh.toFixed(2)} kWh · {totalKwh > 0 ? ((item.kwh / totalKwh) * 100).toFixed(0) : 0}%
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

        {topAppliances.length > 0 && (
          <section className="mb-5 rounded-3xl bg-[#f7f8f8] p-5 text-black shadow-sm ring-1 ring-emerald-950/[0.06] md:px-5 md:py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Keep your result</p>
                <h2 className="mt-1 text-xl font-black tracking-tight">Save or share your estimate.</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Download a private PDF, share from your device, or copy a link to this setup.</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={downloadPDF}
                  disabled={isPdfGenerating}
                  aria-busy={isPdfGenerating}
                  className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md disabled:cursor-wait disabled:opacity-70"
                >
                  {isPdfGenerating ? "Preparing PDF…" : "Download PDF"}
                </button>

                {pdfDownload && (
                  <a
                    href={pdfDownload.url}
                    download={pdfDownload.filename}
                    className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100"
                  >
                    Download again
                    <span className="sr-only"> ({Math.max(1, Math.round(pdfDownload.size / 1024))} KB)</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={shareEstimate}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/55 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
                >
                  <Share2 size={15} strokeWidth={2.2} />
                  Share
                </button>

                <button
                  type="button"
                  onClick={copyEstimateLink}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
                >
                  <Copy size={16} strokeWidth={2.2} />
                  {shareCopied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>

            <details className="group mt-4 border-t border-slate-200/80 pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-emerald-800 marker:hidden">
                Personalize the PDF <span className="text-xs font-semibold text-slate-500 group-open:hidden">Optional</span>
                <ChevronDown size={17} className="ml-auto transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">Your name and address are used only to generate the PDF on this device and are not sent to our server.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.055em] text-slate-500">Name for report</span>
                  <input
                    type="text"
                    maxLength={80}
                    className="w-full rounded-2xl border border-gray-200 bg-white p-3.5 text-black transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter your name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.055em] text-slate-500">Address for report</span>
                  <input
                    type="text"
                    maxLength={160}
                    className="w-full rounded-2xl border border-gray-200 bg-white p-3.5 text-black transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter your address"
                    value={reportAddress}
                    onChange={(e) => setReportAddress(e.target.value)}
                  />
                </label>
              </div>
            </details>
          </section>
        )}



        <AdSlot placement="calculator" />

        </main>

        <footer ref={footerRef} className={`mb-24 px-1 py-6 md:px-0 md:py-8 ${darkMode ? "text-white" : "text-slate-950"}`}>
          <div>
            <p className="text-lg font-black tracking-tight">Watts My Bill?</p>
            <p className="mt-1 text-sm font-semibold text-emerald-800">
              Understand Your Electricity Bill.
            </p>
            <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${darkMode ? "text-white/82" : "text-slate-600"}`}>
              Estimates are based on appliance wattage, usage patterns, and electricity rates. Actual bills may vary.
            </p>
          </div>

          <div className={`mt-6 flex flex-col gap-3 border-t pt-4 text-xs font-semibold md:flex-row md:items-center md:justify-between ${darkMode ? "border-white/[0.12] text-white/72" : "border-slate-300/70 text-slate-500"}`}>
            <p>© 2026 Watts My Bill? All rights reserved.</p>

            <div className="hidden items-center gap-4 md:flex">
              <Link href="/learn" className={`transition hover:text-emerald-700 ${darkMode ? "text-white/78 hover:text-white" : "text-slate-500"}`}>
                Learning Hub
              </Link>
              <Link href="/rates" className={`transition hover:text-emerald-700 ${darkMode ? "text-white/78 hover:text-white" : "text-slate-500"}`}>
                Rate Library
              </Link>
              <Link href="/methodology" className={`transition hover:text-emerald-700 ${darkMode ? "text-white/78 hover:text-white" : "text-slate-500"}`}>
                Methodology
              </Link>
              <button type="button" onClick={() => openInfoSection("privacy")} className={`cursor-pointer transition hover:text-emerald-700 ${darkMode ? "text-white/78 hover:text-white" : "text-slate-500"}`}>
                Privacy Policy
              </button>
              <button type="button" onClick={() => openInfoSection("terms")} className={`cursor-pointer transition hover:text-emerald-700 ${darkMode ? "text-white/78 hover:text-white" : "text-slate-500"}`}>
                Terms of Use
              </button>
            </div>
          </div>
        </footer>

        {showLiveEstimateBar && completedApplianceCount > 0 && !activeInfoSection && !showBillDetective && (
          <div className="wmb-above-tabs fixed inset-x-0 bottom-10 z-[110] flex justify-center px-0 md:bottom-8 md:px-3">
            <div className={`w-[calc(100%-5.5rem)] max-w-[380px] rounded-[18px] border px-2.5 py-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.085)] backdrop-blur-[26px] transition-all duration-300 md:w-full md:max-w-[620px] md:rounded-[22px] md:px-3.5 md:py-2.5 md:shadow-[0_12px_28px_rgba(15,23,42,0.095)] ${darkMode ? "border-emerald-200/[0.12] bg-emerald-950/64 text-white ring-1 ring-white/[0.05]" : "border-emerald-100/28 bg-[rgba(5,88,70,0.60)] text-white ring-1 ring-white/[0.12]"}`}>
              <div className="flex items-center justify-between gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection(heroSectionRef)}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                  aria-label="View live estimate summary"
                >
                  <p className="text-[7.5px] font-black uppercase tracking-[0.15em] text-emerald-100/78 md:text-[9.5px] md:text-emerald-100/88">
                    Live estimate
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 md:gap-x-3 md:gap-y-1">
                    <p className="text-[0.95rem] font-black leading-none tracking-tight text-white md:text-[1.32rem]">
                      <span className="md:hidden">{liveEstimateMobileText}</span>
                      <span className="hidden md:inline">{liveEstimateDesktopText}</span>
                    </p>
                    <p className="text-[9px] font-semibold text-white/68 md:text-[11.5px] md:text-white/68">
                      {formatCompactNumber(animatedTotalKwh)} kWh <span className="px-0.5 text-white/32 md:px-1">·</span> {completedApplianceCount} {completedApplianceCount === 1 ? "appliance" : "appliances"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection(insightsSectionRef)}
                  className="shrink-0 cursor-pointer rounded-2xl border border-emerald-100/14 bg-emerald-500/62 px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500/78 md:px-3.5 md:py-2 md:text-xs"
                >
                  <span className="md:hidden">Insights</span>
                  <span className="hidden md:inline">View insights</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeInfoSection && (
          <div role="dialog" aria-modal="true" aria-labelledby="info-dialog-title" className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-[28px] bg-white p-5 text-slate-950 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Watts My Bill?</p>
                  <h2 id="info-dialog-title" className="mt-1 text-2xl font-black tracking-tight">{activeInfoSection.title}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveInfoPage(null)}
                  className="cursor-pointer grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                  aria-label="Close information"
                >
                  <X size={21} strokeWidth={2.4} />
                </button>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {activeInfoSection.description}
              </p>

              {activeInfoSection.id === "contact" && (
                <a
                  href="mailto:hello@wattsmybill.app"
                  className="mt-5 inline-flex rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  Email hello@wattsmybill.app
                </a>
              )}
            </div>
          </div>
        )}

        {showDonate && (
          <div role="dialog" aria-modal="true" aria-labelledby="support-dialog-title" className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-[#f2fbf6] p-5 text-slate-950 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Support</p>
                  <h2 id="support-dialog-title" className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight">
                    <Coffee size={21} className="text-emerald-700" />
                    Enjoying Watts My Bill?
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    This tool is free to use. If it helped you understand your electricity bill, you may support the project.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDonate(false)}
                  className="cursor-pointer grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
                  aria-label="Close support"
                >
                  <X size={21} strokeWidth={2.4} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-emerald-900/[0.06]">
                  <Image
                    src="/Gcash-qr.jpg"
                    alt="Gcash QR"
                    width={208}
                    height={208}
                    className="mx-auto h-52 w-52 rounded-2xl object-contain"
                  />
                  <h3 className="mt-4 text-lg font-bold">GCash</h3>
                  <p className="mt-3 text-xs text-slate-500">
                    Scan using GCash or InstaPay-supported banking apps.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-emerald-900/[0.06]">
                  <Image
                    src="/paypal-qr.jpg"
                    alt="PayPal QR"
                    width={208}
                    height={208}
                    className="mx-auto h-52 w-52 rounded-2xl object-contain"
                  />
                  <h3 className="mt-4 text-lg font-bold">PayPal</h3>
                  <p className="mt-3 text-xs text-slate-500">
                    Scan the QR code or use the PayPal link.
                  </p>
                  <a
                    href="https://paypal.me/wattsmybill"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block cursor-pointer text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    paypal.me/wattsmybill
                  </a>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Your support helps keep Watts My Bill? free and improving.
              </p>
            </div>
          </div>
        )}

          {showInstallHelp && (
          <div role="dialog" aria-modal="true" aria-labelledby="install-dialog-title" className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-[#f7f8f8] p-5 text-black shadow-2xl ring-1 ring-white/20">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Install Watts My Bill
                  </p>
                  <h3 id="install-dialog-title" className="mt-1 text-xl font-black tracking-tight text-gray-950">
                    Add Watts My Bill to your phone.
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInstallHelp(false)}
                  className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
                  aria-label="Close install instructions"
                >
                  <X size={19} strokeWidth={2.4} />
                </button>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-gray-600">
                {isAppInstalled ? (
                  <p>Watts My Bill already appears to be installed on this device.</p>
                ) : (
                  <>
                    <p>
                      If your browser does not show an install prompt, you can still add it from your browser menu.
                    </p>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
                      <p className="font-bold text-gray-950">Android Chrome / Edge</p>
                      <p className="mt-1">Tap the browser menu, then choose <span className="font-bold">Install app</span> or <span className="font-bold">Add to Home screen</span>.</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                      <p className="font-bold text-gray-950">iPhone Safari</p>
                      <p className="mt-1">Tap Share, then choose <span className="font-bold">Add to Home Screen</span>.</p>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="mt-5 w-full cursor-pointer rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Got it
              </button>
            </div>
          </div>
        )}

          {pendingHouseholdPreset && (
          <div role="dialog" aria-modal="true" aria-labelledby="preset-dialog-title" className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-[#f7f8f8] p-5 text-black shadow-2xl ring-1 ring-white/20">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Household preset action
                </p>
                <h3 id="preset-dialog-title" className="mt-1 text-xl font-black tracking-tight text-gray-950">
                  You already have appliances listed.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Using {pendingHouseholdPreset.name} will replace your current appliance list. You can still edit every appliance afterward.
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
                  className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-md active:scale-[0.98]"
                >
                  Replace list
                </button>

                <button
                  onClick={() => setPendingHouseholdPreset(null)}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        

      </div>



      {showWattageGuideImage && (
        <div role="dialog" aria-modal="true" aria-labelledby="wattage-dialog-title" className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm md:p-5">
          <div className="relative h-full w-full overflow-hidden bg-white text-black shadow-2xl md:h-auto md:max-h-[92vh] md:max-w-6xl md:rounded-[28px]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 md:px-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Wattage guide</p>
                <h3 id="wattage-dialog-title" className="text-base font-black tracking-tight text-slate-950 md:text-lg">Where to find appliance power</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowWattageGuideImage(false)}
                className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close wattage guide"
              >
                <X size={20} strokeWidth={2.4} />
              </button>
            </div>

            <div className="h-[calc(100%-65px)] overflow-y-auto p-3 md:max-h-[calc(92vh-65px)] md:p-5">
              <Image
                src={WATTAGE_GUIDE_PATH}
                alt="Guide showing where to find appliance wattage or power labels"
                width={1536}
                height={1024}
                sizes="(max-width: 768px) 100vw, 960px"
                className="mx-auto h-auto w-full rounded-2xl border border-slate-200/70 shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {showProviderRateGuide && (
        <div role="dialog" aria-modal="true" aria-labelledby="rate-dialog-title" className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm md:p-5">
          <div className="relative h-full w-full overflow-hidden bg-white text-black shadow-2xl md:h-auto md:max-h-[92vh] md:max-w-5xl md:rounded-[28px]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 md:px-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Provider rate guide</p>
                <h3 id="rate-dialog-title" className="text-base font-black tracking-tight text-slate-950 md:text-lg">How to find your kWh rate</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowProviderRateGuide(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close provider rate guide"
              >
                <X size={20} strokeWidth={2.4} />
              </button>
            </div>

            <div className="h-[calc(100%-65px)] overflow-y-auto p-3 md:max-h-[calc(92vh-65px)] md:p-5">
              <Image
                src={PROVIDER_RATE_GUIDE_PATH}
                alt="Guide showing where to find or estimate your electricity rate per kWh"
                width={1458}
                height={1024}
                sizes="(max-width: 768px) 100vw, 960px"
                className="mx-auto h-auto w-full rounded-2xl border border-slate-200/70 shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {showBackToEstimate && (
        <button
          type="button"
          onClick={() =>
            heroSectionRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            })
          }
          className={`wmb-above-tabs fixed bottom-[calc(env(safe-area-inset-bottom)+0.9rem)] right-3 z-[70] inline-flex items-center gap-1 rounded-full border border-emerald-200/25 bg-white/55 px-2.5 py-1.5 text-[10px] font-bold text-emerald-900/65 shadow-[0_6px_16px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.025] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/80 hover:text-emerald-950 md:right-5 md:px-3 md:text-[11px] ${showLiveEstimateBar ? "max-md:hidden" : ""}`}
          aria-label="Back to top"
        >
          <ArrowUp size={13} strokeWidth={2.4} />
          Top
        </button>
      )}

    </div>
  );
  
}
