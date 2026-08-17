import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, ExternalLink, List } from "lucide-react";
import LearnHeader from "../LearnHeader";
import LearningThemeShell from "../LearningThemeShell";
import { ARTICLES, getArticle } from "../articles";

const siteUrl = "https://www.wattsmybill.app";
const socialImage = `${siteUrl}/og-image-final.jpg`;

function headingId(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function displayHeading(heading) {
  return heading.replace(/^\d+\.\s*/, "");
}

function formatArticleDate(date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    authors: [{ name: "Watts My Bill?" }],
    category: article.category,
    alternates: { canonical: `/learn/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${siteUrl}/learn/${article.slug}`,
      type: "article",
      publishedTime: article.published,
      modifiedTime: article.updated,
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Watts My Bill? electricity calculator and learning hub" }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [socialImage],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) notFound();

  const related = ARTICLES.filter((item) => item.slug !== article.slug)
    .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
    .slice(0, 3);
  const articleUrl = `${siteUrl}/learn/${article.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.published,
      dateModified: article.updated,
      mainEntityOfPage: articleUrl,
      author: { "@type": "Organization", name: "Watts My Bill?" },
      publisher: {
        "@type": "Organization",
        name: "Watts My Bill?",
        logo: { "@type": "ImageObject", url: `${siteUrl}/icon-512-v2.png` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Learning Hub", item: `${siteUrl}/learn` },
        { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
      ],
    },
  ];

  return (
    <LearningThemeShell>
    <div className="min-h-screen bg-[#eef3f1] text-slate-950">
      <LearnHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main id="main-content" className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-7 sm:pt-12">
        <Link href="/learn" className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900">
          <ArrowLeft size={16} /> Back to Learning Hub
        </Link>

        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-emerald-950/[0.07]">
            <header className="border-b border-slate-100 px-6 py-9 sm:px-10 sm:py-12">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">{article.category}</p>
              <h1 className="mt-4 max-w-3xl text-[2.15rem] font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">{article.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{article.intro}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {article.readingTime}</span>
                <span>Updated {formatArticleDate(article.updated)}</span>
                <span>{article.sections.length} clear sections</span>
                <Link href="/methodology" className="text-emerald-700 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-900">How we source guides</Link>
              </div>
              <nav className="mt-7 rounded-3xl bg-[#073f36] p-5 text-white shadow-sm lg:hidden" aria-label="In this guide">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-200"><List size={15} /> In this guide</p>
                <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                  {article.sections.map((section, index) => (
                    <li key={section.heading}>
                      <a href={`#${headingId(section.heading)}`} className="flex gap-2 text-sm font-bold leading-5 text-white/80 transition hover:text-white">
                        <span className="text-emerald-300">{String(index + 1).padStart(2, "0")}</span>
                        <span>{displayHeading(section.heading)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </header>

            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <section className="learning-key-points border-l-[3px] border-emerald-600 bg-emerald-50/65 px-5 py-5 shadow-[0_8px_22px_rgba(6,78,59,0.06)]" aria-labelledby="key-points">
                <h2 id="key-points" className="text-lg font-black text-emerald-950">Key points</h2>
                <ul className="mt-4 space-y-3">
                  {article.takeaways.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-emerald-950/80">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="mt-10 space-y-10">
                {/* The scroll offset below only needs to clear a pinned header,
                    and the header is pinned from 1024px up. */}
                {article.sections.map((section) => (
                  <section key={section.heading} id={headingId(section.heading)} className="scroll-mt-6 lg:scroll-mt-28">
                    <h2 className="text-2xl font-black tracking-tight">{section.heading}</h2>
                    <div className="mt-4 space-y-4 text-base leading-7 text-slate-700">
                      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    {section.formula && (
                      <div className="learning-formula mt-5 overflow-x-auto border-l-[3px] border-emerald-500 bg-slate-100 px-5 py-4 font-mono text-sm font-bold text-emerald-900">
                        {section.formula}
                      </div>
                    )}
                  </section>
                ))}
              </div>

              <section className="mt-12 rounded-[26px] bg-slate-950 p-6 text-white sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-300">Try it with your numbers</p>
                <h2 className="mt-3 text-2xl font-black">Turn the explanation into an estimate.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">{article.calculatorPrompt}</p>
                <Link href="/#calculator" className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-300">
                  Open calculator <ArrowRight size={16} />
                </Link>
              </section>

              <section className="mt-10 border-t border-slate-200 pt-8" aria-labelledby="sources-heading">
                <h2 id="sources-heading" className="text-lg font-black">Sources and further reading</h2>
                <ul className="mt-4 space-y-3">
                  {article.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-sm font-bold leading-6 text-emerald-700 hover:text-emerald-900 hover:underline">
                        {source.label} <ExternalLink className="mt-1 shrink-0" size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs leading-5 text-slate-500">Information is educational and country-neutral. Always check your provider bill and local tariff rules before making financial or electrical decisions. <Link href="/methodology" className="font-black text-emerald-700 underline underline-offset-4">Read our methodology.</Link></p>
              </section>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <nav className="hidden rounded-3xl bg-[#073f36] p-5 text-white shadow-sm lg:block" aria-label="In this guide">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-200"><List size={15} /> In this guide</p>
              <ol className="mt-4 space-y-3 border-l border-white/15 pl-4">
                {article.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a href={`#${headingId(section.heading)}`} className="group flex gap-2 text-sm font-bold leading-5 text-white/76 transition hover:text-white">
                      <span className="text-emerald-300">{String(index + 1).padStart(2, "0")}</span>
                      <span>{displayHeading(section.heading)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-emerald-950/[0.07]">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Read next</p>
              <div className="mt-4 space-y-4">
                {related.map((item) => (
                  <Link key={item.slug} href={`/learn/${item.slug}`} className="group block border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-black leading-5 group-hover:text-emerald-700">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.readingTime}</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
    </LearningThemeShell>
  );
}
