import Link from "next/link";
import { notFound } from "next/navigation";
import LearnHeader from "../../learn/LearnHeader";
import LearningThemeShell from "../../learn/LearningThemeShell";
import AdSlot from "../../components/AdSlot";
import {
  COUNTRY_SLUGS,
  costedAppliances,
  formatMoney,
  getCountryBySlug,
  theCountry,
} from "../../lib/countryPages";

const siteUrl = "https://www.wattsmybill.app";

export function generateStaticParams() {
  return COUNTRY_SLUGS.map((country) => ({ country }));
}

export async function generateMetadata({ params }) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) return {};

  const title = `Electricity Rates in ${theCountry(country.name)}`;
  const description = `What a kWh costs in ${theCountry(country.name)}, who sets the price, and what everyday appliances cost to run at that rate. Sourced from ${country.authority}.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/rates/${slug}` },
    openGraph: {
      title: `${title} | Watts My Bill?`,
      description,
      url: `${siteUrl}/rates/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Watts My Bill?`,
      description,
    },
  };
}

export default async function CountryRatePage({ params }) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const appliances = costedAppliances(country.rate);
  const dearest = appliances[0];
  const cheapest = appliances[appliances.length - 1];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `Electricity Rates in ${theCountry(country.name)}`,
        url: `${siteUrl}/rates/${slug}`,
        description: `Indicative household electricity price for ${theCountry(country.name)} with the official source, and monthly running costs for common appliances at that rate.`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Rate Library", item: `${siteUrl}/rates` },
          { "@type": "ListItem", position: 2, name: country.name, item: `${siteUrl}/rates/${slug}` },
        ],
      },
    ],
  };

  return (
    <LearningThemeShell>
      <div className="min-h-screen bg-[#eef3f1] text-slate-950">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <LearnHeader />

        <main id="main-content" className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs font-bold text-slate-500">
            <Link href="/rates" className="text-emerald-700 hover:underline">Rate Library</Link>
            <span aria-hidden="true"> / </span>
            <span>{country.name}</span>
          </nav>

          <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#043a33_0%,#087157_62%,#0a7454_100%)] px-5 py-7 text-white shadow-[0_18px_44px_rgba(5,84,66,0.16)] sm:px-8 sm:py-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              <span aria-hidden="true">{country.flag} </span>Rate library
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Electricity rates in {theCountry(country.name)}
            </h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50/90 sm:text-base">
              A household kWh in {theCountry(country.name)} costs around{" "}
              <strong className="font-black text-white">{formatMoney(country.rate, country.currency)}</strong>. That is
              an indicative figure for orientation, not a live tariff — your own bill is always the better number.
            </p>
          </section>

          <section className="mt-6 rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
            <h2 className="text-lg font-black tracking-tight">Where this price comes from</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{country.coverage}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Authority</dt>
                <dd className="mt-0.5 text-sm font-bold text-slate-950">{country.authority}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Last checked</dt>
                <dd className="mt-0.5 text-sm font-bold text-slate-950">{country.checked}</dd>
              </div>
            </dl>
            <a
              href={country.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Open {country.label}
            </a>
          </section>

          <section className="mt-4 rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
            <h2 className="text-lg font-black tracking-tight">
              What appliances cost to run in {theCountry(country.name)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Monthly estimates at {formatMoney(country.rate, country.currency)} per kWh, using typical usage for each
              appliance. Change any of it in the calculator.
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <thead>
                  <tr className="border-b border-emerald-950/10 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
                    <th scope="col" className="pb-2 pr-3 font-black">Appliance</th>
                    <th scope="col" className="pb-2 pr-3 text-right font-black">Typical use</th>
                    <th scope="col" className="pb-2 pr-3 text-right font-black">kWh / month</th>
                    <th scope="col" className="pb-2 text-right font-black">Cost / month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/[0.07]">
                  {appliances.map((item) => (
                    <tr key={item.name}>
                      <th scope="row" className="py-2.5 pr-3 text-left font-bold text-slate-950">
                        {item.name}
                        {item.duty && (
                          <span className="block text-[11px] font-semibold text-slate-500">
                            cycles — runs ~{Math.round(item.duty * 100)}% of those hours
                          </span>
                        )}
                      </th>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">
                        {item.watts}W · {item.hours}h · {item.days}d
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">{item.kwh.toFixed(1)}</td>
                      <td className="py-2.5 text-right font-black tabular-nums text-slate-950">
                        {formatMoney(item.cost, country.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dearest && cheapest && (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                The spread runs from{" "}
                <strong className="font-black text-slate-950">
                  {cheapest.name} at {formatMoney(cheapest.cost, country.currency)}
                </strong>{" "}
                a month up to{" "}
                <strong className="font-black text-slate-950">
                  {dearest.name} at {formatMoney(dearest.cost, country.currency)}
                </strong>
                {" "}— usually where the surprise in a bill hides.
              </p>
            )}

            <Link
              href="/#calculator"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Estimate your own bill
            </Link>
          </section>

          <AdSlot placement="learn" className="mt-4" />

          <section className="mt-4 rounded-[26px] bg-white p-6 shadow-sm ring-1 ring-emerald-950/[0.07] sm:p-7">
            <h2 className="text-lg font-black tracking-tight">Next steps</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6">
              <li>
                <Link href="/learn/how-to-find-your-electricity-rate" className="font-bold text-emerald-700 hover:underline">
                  Find your exact rate on your bill
                </Link>{" "}
                <span className="text-slate-600">— more accurate than any national average.</span>
              </li>
              <li>
                <Link href="/learn/why-is-my-electricity-bill-so-high" className="font-bold text-emerald-700 hover:underline">
                  Work out why a bill went up
                </Link>{" "}
                <span className="text-slate-600">— usage, rate, or fixed charges.</span>
              </li>
              <li>
                <Link href="/game" className="font-bold text-emerald-700 hover:underline">
                  Guess the Watts
                </Link>{" "}
                <span className="text-slate-600">— five rounds to learn what appliances actually draw.</span>
              </li>
              <li>
                <Link href="/rates" className="font-bold text-emerald-700 hover:underline">
                  Compare other countries
                </Link>
              </li>
            </ul>
          </section>
        </main>
      </div>
    </LearningThemeShell>
  );
}
