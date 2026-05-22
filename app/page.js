"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";

const COUNTRIES = [
  { name: "Philippines", rate: 12.5, currency: "₱" },
  { name: "United States", rate: 0.18, currency: "$" },
  { name: "United Kingdom", rate: 0.28, currency: "£" },
  { name: "India", rate: 0.09, currency: "₹" },
  { name: "Australia", rate: 0.32, currency: "A$" },
  { name: "Japan", rate: 0.3, currency: "¥" },
  { name: "Canada", rate: 0.17, currency: "C$" },
  { name: "Germany", rate: 0.35, currency: "€" },
  { name: "France", rate: 0.3, currency: "€" },
  { name: "Italy", rate: 0.29, currency: "€" },
  { name: "Spain", rate: 0.27, currency: "€" },
  { name: "South Korea", rate: 0.22, currency: "₩" },
  { name: "China", rate: 0.1, currency: "¥" },
  { name: "Singapore", rate: 0.25, currency: "S$" },
  { name: "UAE", rate: 0.2, currency: "د.إ" },
  { name: "Other Country", rate: 0, currency: "" }
];

const PRESETS = [
  { name: "Lighting", watts: 60, hours: 6, days: 30 },
  { name: "Air-conditioning Unit", watts: 1200, hours: 8, days: 25 },
  { name: "Refrigerator", watts: 150, hours: 24, days: 30 },
  { name: "Microwave", watts: 1200, hours: 0.25, days: 15 },
  { name: "Oven", watts: 2000, hours: 1, days: 8 },
  { name: "Water Heater", watts: 1500, hours: 1, days: 20 },
  { name: "Steamer", watts: 800, hours: 0.5, days: 8 },
  { name: "Blower", watts: 1000, hours: 0.25, days: 12 },
  { name: "Flat Iron / Steam Iron", watts: 1000, hours: 1, days: 4 },
  { name: "Television", watts: 100, hours: 5, days: 30 },
  { name: "Charger", watts: 10, hours: 3, days: 30 },
  { name: "Electric Fan", watts: 75, hours: 8, days: 30 },
  { name: "Electric Range", watts: 2500, hours: 1, days: 20 },
  { name: "Rangehood", watts: 200, hours: 1, days: 20 },
  { name: "Induction Cooker", watts: 1800, hours: 1, days: 20 }
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#22D3EE] flex items-center justify-center shadow-xl text-white text-2xl">
        💡
      </div>

      <div>
        <div className="font-black text-2xl tracking-tight leading-none">
          Watts My Bill?
        </div>

        <div className="text-xs opacity-60 mt-1">
          Real-world electricity usage calculator
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
  const [appliances, setAppliances] = useState([
    { name: "", watts: "", hours: "", days: "" }
  ]);

  const isOtherCountry = country.name === "Other Country";
  const activeRate = customRate ? Number(customRate) : country.rate;

  const displayCountry = isOtherCountry
    ? customCountryName || "Other Country"
    : country.name;

  const displayCurrency = isOtherCountry
    ? customCurrency || ""
    : country.currency;

  const addAppliance = () => {
    setAppliances([
      ...appliances,
      { name: "", watts: "", hours: "", days: "" }
    ]);
  };

  const addPreset = (preset) => {
    setAppliances([
      ...appliances,
      {
        name: preset.name,
        watts: preset.watts,
        hours: preset.hours,
        days: preset.days
      }
    ]);
  };

  const updateAppliance = (i, field, value) => {
    const copy = [...appliances];
    copy[i][field] = value;
    setAppliances(copy);
  };

  const removeAppliance = (index) => {
    if (appliances.length === 1) {
      setAppliances([{ name: "", watts: "", hours: "", days: "" }]);
      return;
    }

    setAppliances(appliances.filter((_, i) => i !== index));
  };

  const breakdown = useMemo(() => {
    return appliances.map((a) => {
      const watts = Number(a.watts || 0);
      const hours = Number(a.hours || 0);
      const days = Number(a.days || 0);

      const kwh = (watts * hours * days) / 1000;
      const cost = kwh * activeRate;

      return { ...a, kwh, cost };
    });
  }, [appliances, activeRate]);

  const totalKwh = breakdown.reduce((s, i) => s + i.kwh, 0);
  const total = breakdown.reduce((s, i) => s + i.cost, 0);
  const difference = actualBill ? Number(actualBill) - total : 0;

  const topAppliance = [...breakdown]
    .filter((item) => item.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)[0];

  const dailyAverage = total / 30;

  const possibleSavings = topAppliance
    ? ((Number(topAppliance.watts || 0) * 1 * Number(topAppliance.days || 0)) /
        1000) *
      activeRate
    : 0;

  const auditMessage = topAppliance
    ? `${topAppliance.name} appears to be your highest estimated energy user. Reducing its use by 1 hour per day may save around ${displayCurrency}${possibleSavings.toFixed(
        2
      )} per month.`
    : "Add appliance details to generate an energy audit insight.";

  const downloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1 inch margin = 25.4mm
    const margin = 25.4;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;
    let pageNumber = 1;

    const currencyMap = {
      "₱": "PHP ",
      "$": "USD ",
      "£": "GBP ",
      "€": "EUR ",
      "₹": "INR ",
      "A$": "AUD ",
      "C$": "CAD ",
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

    const money = (value) => `${pdfCurrency}${Number(value || 0).toFixed(2)}`;

    const writeWrappedText = (text, x, startY, maxWidth, lineHeight = 5) => {
      const lines = doc.splitTextToSize(cleanText(text), maxWidth);
      doc.text(lines, x, startY);
      return startY + lines.length * lineHeight;
    };

    const footer = () => {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, pageHeight - margin + 5, pageWidth - margin, pageHeight - margin + 5);

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
      if (y + needed > pageHeight - margin - 5) {
        footer();
        doc.addPage();
        pageNumber += 1;
        y = margin;
      }
    };

    const sectionTitle = (title) => {
      checkPage(15);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(title, margin, y);

      y += 4;

      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);

      y += 8;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text("Watts My Bill?", margin, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text("Energy Audit Report", margin, y);

    y += 9;

    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);

    y += 12;

    sectionTitle("Report Details");

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    const detailLines = [
      ["Name", reportName ? cleanText(reportName) : "Not provided"],
      ["Address", reportAddress ? cleanText(reportAddress) : "Not provided"],
      ["Country", cleanText(displayCountry)],
      ["Rate Used", `${pdfCurrency}${activeRate || 0}/kWh`]
    ];

    detailLines.forEach(([label, value]) => {
      checkPage(9);

      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);

      doc.setFont("helvetica", "normal");
      y = writeWrappedText(value, margin + 32, y, contentWidth - 32, 5);

      y += 2;
    });

    y += 4;

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
      checkPage(8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`${label}:`, margin, y);

      doc.setFont("helvetica", "normal");
      y = writeWrappedText(value, margin + 62, y, contentWidth - 62, 5);

      y += 2;
    });

    y += 4;

    sectionTitle("Energy Insight");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    y = writeWrappedText(auditMessage, margin, y, contentWidth, 5);

    y += 8;

    sectionTitle("Appliance Breakdown");

    const validRows = breakdown.filter(
      (item) => item.name || item.kwh > 0 || item.cost > 0
    );

    const tableX = margin;
    const col = {
      appliance: tableX,
      watts: tableX + 58,
      hours: tableX + 78,
      days: tableX + 98,
      kwh: tableX + 118,
      cost: tableX + 140
    };

    const tableHeader = () => {
      checkPage(12);

      doc.setFillColor(245, 247, 250);
      doc.rect(tableX, y - 5, contentWidth, 9, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);

      doc.text("Appliance", col.appliance + 1, y);
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

        doc.setDrawColor(235, 235, 235);
        doc.line(tableX, y + 2, pageWidth - margin, y + 2);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);

        const applianceName = cleanText(item.name || "Unnamed");
        const applianceLines = doc.splitTextToSize(applianceName, 52);
        const rowHeight = Math.max(8, applianceLines.length * 4.5);

        doc.text(applianceLines, col.appliance + 1, y);

        doc.text(String(item.watts || 0), col.watts, y);
        doc.text(String(item.hours || 0), col.hours, y);
        doc.text(String(item.days || 0), col.days, y);
        doc.text(item.kwh.toFixed(2), col.kwh, y);
        doc.text(money(item.cost), col.cost, y);

        y += rowHeight;
      });
    }

    y += 8;

    sectionTitle("Important Note");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);

    writeWrappedText(
      "This report is for estimation and educational purposes only. Actual charges may include taxes, fixed fees, fuel adjustments, demand charges, tiered pricing, time-of-use rates, and other provider-specific charges.",
      margin,
      y,
      contentWidth,
      5
    );

    footer();

    doc.save("watts-my-bill-energy-audit-report.pdf");
  };

  const theme = darkMode
    ? "bg-[#0B0F17] text-white"
    : "bg-gray-50 text-gray-900";

  return (
    <div className={`min-h-screen p-6 transition ${theme}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <Logo />

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-2xl">
          <h2 className="text-3xl font-black">
            {displayCurrency}
            {total.toFixed(2)}
          </h2>

          <p className="mt-2 opacity-90">
            Estimated monthly electricity bill
          </p>

          <div className="mt-5 grid md:grid-cols-4 gap-3">
            <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Total Usage</p>
              <p className="font-bold">⚡ {totalKwh.toFixed(2)} kWh</p>
            </div>

            <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Country</p>
              <p className="font-bold">🌍 {displayCountry}</p>
            </div>

            <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Rate Used</p>
              <p className="font-bold">
                {displayCurrency}
                {activeRate || 0}/kWh
              </p>
            </div>

            <div className="bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm">
              <p className="text-xs opacity-80">Daily Average</p>
              <p className="font-bold">
                {displayCurrency}
                {dailyAverage.toFixed(2)}/day
              </p>
            </div>
          </div>

          {topAppliance?.name && (
            <div className="mt-4 bg-white/20 px-4 py-3 rounded-2xl backdrop-blur-sm inline-block">
              🔥 Highest usage: {topAppliance.name}
            </div>
          )}

          <p className="text-xs opacity-80 mt-5">
            Estimates only. Actual bills may vary depending on provider rates,
            taxes, location, and usage behavior.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <select
            className="p-4 rounded-2xl border bg-white text-black shadow"
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
              <option key={c.name}>{c.name}</option>
            ))}
          </select>

          <input
            type="number"
            className="p-4 rounded-2xl border bg-white text-black shadow"
            placeholder="Enter your current monthly bill"
            value={actualBill}
            onChange={(e) => setActualBill(e.target.value)}
          />

          <div>
            <input
              type="number"
              className="w-full p-4 rounded-2xl border bg-white text-black shadow"
              placeholder={`Custom rate / kWh (${displayCurrency || "currency"})`}
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
            />
            <p className="text-xs opacity-60 mt-2 px-1">
              Optional. If left blank, we’ll use the selected country’s default
              rate. For “Other Country,” please enter your rate.
            </p>
          </div>
        </div>

        {isOtherCountry && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              className="p-4 rounded-2xl border bg-white text-black shadow"
              placeholder="Your country name"
              value={customCountryName}
              onChange={(e) => setCustomCountryName(e.target.value)}
            />

            <input
              type="text"
              className="p-4 rounded-2xl border bg-white text-black shadow"
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
                  difference > 0 ? "text-red-500" : "text-green-500"
                }`}
              >
                {displayCurrency}
                {Math.abs(difference).toFixed(2)}
              </span>
            </div>

            <p className="text-xs opacity-60 mt-2">
              This is only a comparison between your entered bill and the
              estimated calculation.
            </p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="font-bold text-lg mb-3">Quick Add Appliances</h2>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => addPreset(p)}
                className="px-4 py-2 rounded-2xl bg-blue-100 hover:bg-blue-200 text-black text-sm transition shadow-sm"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-4 gap-3 px-2 mb-2">
          <div className="text-sm font-semibold opacity-70">Appliance</div>
          <div className="text-sm font-semibold opacity-70">Wattage (W)</div>
          <div className="text-sm font-semibold opacity-70">Hours / Day</div>
          <div className="text-sm font-semibold opacity-70">Days of Use</div>
        </div>

        <div className="space-y-4">
          {breakdown.map((item, i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-white text-black shadow-lg relative"
            >
              <button
                onClick={() => removeAppliance(i)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition"
                title="Remove appliance"
              >
                ×
              </button>

              <div className="grid md:grid-cols-4 gap-3 pr-10">
                <input
                  className="p-3 border rounded-xl"
                  placeholder="Appliance"
                  value={item.name}
                  onChange={(e) =>
                    updateAppliance(i, "name", e.target.value)
                  }
                />

                <input
                  className="p-3 border rounded-xl"
                  type="number"
                  placeholder="W"
                  value={item.watts}
                  onChange={(e) =>
                    updateAppliance(i, "watts", e.target.value)
                  }
                />

                <input
                  className="p-3 border rounded-xl"
                  type="number"
                  placeholder="Hours"
                  value={item.hours}
                  onChange={(e) =>
                    updateAppliance(i, "hours", e.target.value)
                  }
                />

                <input
                  className="p-3 border rounded-xl"
                  type="number"
                  placeholder="Days"
                  value={item.days}
                  onChange={(e) =>
                    updateAppliance(i, "days", e.target.value)
                  }
                />
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm opacity-60">Consumption</p>

                  <h3 className="font-bold text-lg">
                    {item.kwh.toFixed(2)} kWh
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-sm opacity-60">Estimated Cost</p>

                  <h3 className="font-black text-2xl text-blue-600">
                    {displayCurrency}
                    {item.cost.toFixed(2)}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 mb-6 p-5 rounded-3xl bg-white text-black shadow-lg">
          <p className="text-sm opacity-60 mb-1">Energy Audit Insight</p>

          <h2 className="font-black text-xl mb-2">
            {topAppliance?.name
              ? "Your biggest energy driver is clear."
              : "Your audit is waiting for appliance data."}
          </h2>

          <p className="text-sm opacity-75">{auditMessage}</p>
        </div>

        <div className="mb-24 p-5 rounded-3xl bg-white text-black shadow-lg">
          <h2 className="font-black text-xl mb-2">Energy Audit Report</h2>

          <p className="text-sm opacity-70 mb-4">
            Optionally add your name and address before downloading your report.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              className="p-4 rounded-2xl border bg-white text-black"
              placeholder="Name for report"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />

            <input
              type="text"
              className="p-4 rounded-2xl border bg-white text-black"
              placeholder="Address for report"
              value={reportAddress}
              onChange={(e) => setReportAddress(e.target.value)}
            />
          </div>

          <button
            onClick={downloadPDF}
            className="mt-4 px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow"
          >
            Download Energy Audit Report
          </button>
        </div>

        <button
          onClick={addAppliance}
          className="fixed bottom-6 right-6 bg-black text-white px-5 py-4 rounded-full shadow-2xl hover:scale-105 transition"
        >
          + Add
        </button>
      </div>
    </div>
  );
}