const EUROSTAT_COUNTRIES = new Set([
  "Austria",
  "Belgium",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Ireland",
  "Italy",
  "Netherlands",
  "Norway",
  "Poland",
  "Portugal",
  "Spain",
  "Sweden"
]);

const REFERENCES = {
  Australia: {
    label: "Energy Made Easy",
    url: "https://www.energymadeeasy.gov.au/article/understanding-gas-and-electricity-charges",
    authority: "Australian Energy Regulator",
    coverage: "Official guidance for comparing household electricity charges in eligible Australian regions",
    checked: "2026-08-14"
  },
  Brazil: {
    label: "ANEEL",
    url: "https://www.gov.br/aneel/pt-br/centrais-de-conteudos/relatorios-e-indicadores/tarifas-e-informacoes-economico-financeiras",
    authority: "Brazilian Electricity Regulatory Agency",
    coverage: "Official residential tariff reports; distributor, tax, and tariff-flag charges vary",
    checked: "2026-08-14"
  },
  Canada: {
    label: "Canada Energy Regulator",
    url: "https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/market-snapshots/2026/market-snapshot-how-much-do-your-neighbours-across-canada-pay-for-electricity.html",
    authority: "Canada Energy Regulator",
    coverage: "Official provincial and territorial household price comparison; local fees and regulation vary widely",
    checked: "2026-08-14"
  },
  China: {
    label: "China NEA",
    url: "https://www.nea.gov.cn/2013-12/26/c_132998400.htm",
    authority: "National Energy Administration of China",
    coverage: "Official residential tier-pricing policy context; detailed prices are set locally",
    checked: "2026-08-14"
  },
  India: {
    label: "India Ministry of Power",
    url: "https://powermin.gov.in/sites/default/files/uploads/LS06.02.2025_Eng.pdf",
    authority: "Government of India Ministry of Power",
    coverage: "Official state and utility tariff comparison; State Electricity Regulatory Commissions set local rates",
    checked: "2026-08-14"
  },
  Indonesia: {
    label: "Indonesia ESDM",
    url: "https://www.esdm.go.id/en/media-center/news-archives/jaga-stabilitas-awal-tahun-2026-pemerintah-putuskan-tarif-listrik-tetap",
    authority: "Ministry of Energy and Mineral Resources of Indonesia",
    coverage: "Official PLN tariff-adjustment context; customer class and subsidy status affect the payable rate",
    checked: "2026-08-14"
  },
  Japan: {
    label: "Japan ANRE",
    url: "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/fee/stracture/ratesystem.html",
    authority: "Agency for Natural Resources and Energy, Japan",
    coverage: "Official explanation of tiered and time-based electricity plans; retailer and region determine the price",
    checked: "2026-08-14"
  },
  Malaysia: {
    label: "Malaysia Energy Commission",
    url: "https://www.st.gov.my/jadual-elektrik-baharu-lebih-236-juta-pengguna-domestik-semenanjung-nikmati-kadar-lebih-adil",
    authority: "Suruhanjaya Tenaga",
    coverage: "Official Peninsular Malaysia household tariff context; regional coverage and adjustment components vary",
    checked: "2026-08-14"
  },
  Mexico: {
    label: "Mexico CFE",
    url: "https://app.cfe.mx/Aplicaciones/CCFE/Tarifas/TarifasCRECasa/Casa.aspx",
    authority: "Comisión Federal de Electricidad",
    coverage: "Official household tariff directory; climate zone, consumption band, and high-consumption status affect price",
    checked: "2026-08-14"
  },
  "New Zealand": {
    label: "MBIE",
    url: "https://www.mbie.govt.nz/building-and-energy/energy-and-natural-resources/energy-statistics-and-modelling/energy-statistics/energy-prices/electricity-cost-and-price-monitoring",
    authority: "New Zealand Ministry of Business, Innovation and Employment",
    coverage: "Official national residential cost monitoring and advertised retail tariff data",
    checked: "2026-08-14"
  },
  Philippines: {
    label: "Philippines ERC",
    url: "https://www.erc.gov.ph/Latest-Approved-Rates",
    authority: "Energy Regulatory Commission of the Philippines",
    coverage: "Official approved rate schedules; the payable rate varies by distribution utility and month",
    checked: "2026-08-14"
  },
  Singapore: {
    label: "Singapore EMA",
    url: "https://www.ema.gov.sg/consumer-information/electricity/buying-electricity/buying-at-regulated-tariff",
    authority: "Energy Market Authority of Singapore",
    coverage: "Official regulated household tariff context; retailer plans may differ",
    checked: "2026-08-14"
  },
  "South Africa": {
    label: "Eskom",
    url: "https://www.eskom.co.za/distribution/2026-2027-tariff-increase/",
    authority: "Eskom",
    coverage: "Published standard tariff changes for direct customers; municipal tariffs vary",
    checked: "2026-08-14"
  },
  "South Korea": {
    label: "KEPCO",
    url: "https://home.kepco.co.kr/kepco/front/html/CY/H/C/CYHCHP00207.html",
    authority: "Korea Electric Power Corporation",
    coverage: "Official residential base-charge and progressive energy-rate context",
    checked: "2026-08-14"
  },
  Thailand: {
    label: "Thailand PEA",
    url: "https://www.pea.co.th/en/our-services/tariff",
    authority: "Provincial Electricity Authority",
    coverage: "Official tariff structure and fuel-adjustment context; provider and usage tier may differ",
    checked: "2026-08-14"
  },
  UAE: {
    label: "DEWA",
    url: "https://www.dewa.gov.ae/en/consumer/billing/slab-tariff",
    authority: "Dubai Electricity and Water Authority",
    coverage: "Official Dubai slab-tariff context; other emirates and fuel surcharges differ",
    checked: "2026-08-14"
  },
  Vietnam: {
    label: "Vietnam Electricity",
    url: "https://en.evn.com.vn/en-US/news-l/Electricity%20Tariff-60-28",
    authority: "Vietnam Electricity",
    coverage: "Official retail tariff directory; residential pricing uses consumption tiers",
    checked: "2026-08-14"
  },
  "United Kingdom": {
    label: "Ofgem",
    url: "https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-unit-rates-and-standing-charges",
    authority: "Great Britain energy regulator",
    coverage: "Official consumer guidance on unit rates and standing charges in Great Britain",
    checked: "2026-08-14"
  },
  "United States": {
    label: "U.S. EIA",
    url: "https://www.eia.gov/energyexplained/electricity/prices-and-factors-affecting-prices.php",
    authority: "U.S. Energy Information Administration",
    coverage: "Official national electricity price context; actual utility rates vary by state and plan",
    checked: "2026-08-14"
  }
};

const EUROSTAT_REFERENCE = {
  label: "Eurostat",
  url: "https://ec.europa.eu/eurostat/cache/visualisations/energy-prices/enprices.html?consumer=HOUSEHOLD&dataset=nrg_pc_204&time=2025-S2&unit=KWH",
  authority: "Statistical office of the European Union",
  coverage: "Official 2025 household electricity price comparison; supplier plans, consumption bands, taxes, and local charges vary",
  checked: "2026-08-14"
};

export function getRateReference(countryName) {
  if (EUROSTAT_COUNTRIES.has(countryName)) return EUROSTAT_REFERENCE;
  return REFERENCES[countryName] || null;
}
