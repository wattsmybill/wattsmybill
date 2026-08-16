/**
 * Search for the Learning Hub.
 *
 * The first version joined each guide's title, description, category and
 * takeaways, then required every typed word to appear as a raw substring. That
 * failed the way real people type: "solar panel" found nothing despite a solar
 * billing guide, "fridge" found nothing, "aircon" found nothing while "air con"
 * found one, and "ac" matched nine guides through the letters inside
 * "practical". This version indexes the article body too, understands that
 * households call the same object different things, and ranks partial matches
 * instead of answering with silence.
 */

/** Words that carry no signal in a question and would otherwise dilute scores. */
const STOP_WORDS = new Set([
  "a", "about", "am", "an", "and", "are", "as", "at", "be", "but", "by", "can",
  "do", "does", "for", "from", "get", "has", "have", "how", "i", "if", "in",
  "is", "it", "its", "me", "much", "my", "of", "on", "or", "our", "should",
  "so", "than", "that", "the", "their", "them", "then", "there", "these",
  "they", "this", "to", "too", "use", "very", "was", "we", "what", "when",
  "where", "which", "who", "why", "will", "with", "you", "your",
]);

/**
 * Everyday and regional vocabulary mapped onto the words the guides use.
 * Deliberately two-way at lookup time: typing either side finds the other.
 */
const SYNONYM_GROUPS = [
  ["aircon", "ac", "a/c", "airconditioner", "air", "conditioner", "conditioning", "cooling", "hvac"],
  ["fridge", "refrigerator", "freezer", "icebox"],
  ["geyser", "boiler", "immersion", "heater", "water", "hot"],
  ["washer", "washing", "machine", "laundry"],
  ["dryer", "tumble", "drier"],
  ["tv", "television", "telly"],
  ["pc", "computer", "laptop", "desktop"],
  ["bulb", "globe", "lamp", "lighting", "light", "led"],
  ["power", "electric", "electricity", "energy"],
  ["bill", "invoice", "statement", "billing"],
  // "kwh" and "cost" deliberately excluded: a unit and a generic noun, not
  // words that mean "tariff", and including them dragged unit-explainer
  // queries onto the time-of-use guide.
  ["rate", "tariff", "pricing"],
  ["solar", "pv", "panel", "panels", "photovoltaic", "export", "feed-in", "feedin"],
  ["save", "saving", "savings", "reduce", "lower", "cut", "cheaper", "money"],
  ["meter", "metering", "reading", "smart"],
  ["expensive", "high", "higher", "costly", "spike", "spiked", "increase", "increased", "up"],
  ["pool", "pump", "spa"],
  ["standby", "vampire", "phantom", "idle"],
  ["ev", "car", "vehicle", "charging", "charger"],
  ["oven", "stove", "cooker", "hob", "kettle", "microwave", "kitchen"],
  ["wrong", "error", "mistake", "incorrect", "dispute", "overcharged"],
];

const SYNONYMS = (() => {
  const map = new Map();
  for (const group of SYNONYM_GROUPS) {
    for (const word of group) {
      const existing = map.get(word) || new Set();
      group.forEach((other) => other !== word && existing.add(other));
      map.set(word, existing);
    }
  }
  return map;
})();

/** Crude but adequate singulariser — the corpus is English and small. */
function stem(word) {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith("es") && !word.endsWith("ses")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function words(text) {
  return String(text || "")
    .toLowerCase()
    // Strip diacritics so "électricité" reaches "electricity" and "climatiseur"
    // is not chopped into fragments. Without this, an accented word lost its
    // accented letters entirely and degraded into a weak fuzzy match.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9/+-]+/)
    .filter(Boolean);
}

/**
 * Field weights. A hit in the title says far more about relevance than the
 * same word buried in a paragraph, so body matches inform ranking without
 * being able to outrank a headline match on their own.
 */
const WEIGHTS = { title: 6, takeaway: 3, description: 3, category: 2, heading: 2, body: 1 };

function addTerms(target, text, weight) {
  for (const word of words(text)) {
    const key = stem(word);
    target.set(key, Math.max(target.get(key) || 0, weight));
  }
}

/** Builds a term → best-weight map for one article, body text included. */
function buildDocument(article) {
  const terms = new Map();
  addTerms(terms, article.title, WEIGHTS.title);
  addTerms(terms, article.description, WEIGHTS.description);
  addTerms(terms, article.category, WEIGHTS.category);
  article.takeaways?.forEach((item) => addTerms(terms, item, WEIGHTS.takeaway));
  article.keywords?.forEach((item) => addTerms(terms, item, WEIGHTS.takeaway));
  article.sections?.forEach((section) => {
    addTerms(terms, section.heading, WEIGHTS.heading);
    section.paragraphs?.forEach((paragraph) => addTerms(terms, paragraph, WEIGHTS.body));
  });
  addTerms(terms, article.intro, WEIGHTS.body);
  return terms;
}

/** Turns a typed question into the terms worth searching for. */
export function parseQuery(query) {
  const raw = words(query).filter((word) => !STOP_WORDS.has(word));
  const seen = new Set();
  const tokens = [];

  for (const word of raw) {
    // Two-letter fragments only survive when they are a known appliance
    // shorthand; otherwise "ac" matches the middle of "practical".
    if (word.length < 3 && !SYNONYMS.has(word)) continue;
    const key = stem(word);
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push({
      term: key,
      variants: [key, ...[...(SYNONYMS.get(word) || [])].map(stem)],
    });
  }

  return tokens;
}

/**
 * Ranks articles against a query.
 *
 * Every token contributes its best field weight, and articles matching more of
 * the question sort above articles matching more strongly but narrowly — so a
 * two-word query prefers the guide covering both words. Synonym hits score at
 * two thirds of a direct hit so exact wording still wins.
 */
export function searchArticles(articles, query) {
  const tokens = parseQuery(query);

  if (tokens.length === 0) {
    // An empty box means "show everything". A box with something in it that
    // yielded no searchable terms — punctuation, or a script the Latin-only
    // tokeniser drops, such as a question typed in Japanese — is a search that
    // found nothing, and saying so is honest. Reporting fourteen results for a
    // query nobody matched would be worse, and it also lets the appliance
    // suggestions in the empty state do their job.
    return String(query || "").trim() ? [] : articles;
  }

  const documents = articles.map((article) => ({ article, terms: buildDocument(article) }));

  /**
   * How rare a term is across the corpus. Every guide on an electricity site
   * says "electricity", "power" and "bill", so without this a query containing
   * one of them matches all fourteen and ranking becomes meaningless. Terms
   * present in every document end up worth nothing; "conditioner" or
   * "photovoltaic" carry real weight.
   */
  const rarity = (term) => {
    let seenIn = 0;
    for (const { terms } of documents) if (terms.has(term)) seenIn += 1;
    if (seenIn === 0) return 0;
    return Math.log((documents.length + 1) / seenIn);
  };
  const rarityCache = new Map();
  const rarityOf = (term) => {
    if (!rarityCache.has(term)) rarityCache.set(term, rarity(term));
    return rarityCache.get(term);
  };

  // Someone typing a phrase that appears verbatim in a headline has almost
  // certainly found the guide they want; term-by-term scoring alone can let a
  // broader article edge it out on a single common word.
  const phrase = words(query).filter((word) => !STOP_WORDS.has(word)).join(" ");
  const containsPhrase = (text) =>
    phrase.length > 2 && words(text).join(" ").includes(phrase);

  const scored = documents
    .map(({ article, terms }) => {
      let score = 0;
      let matched = 0;

      if (containsPhrase(article.title)) score += 12;
      else if (containsPhrase(`${article.description} ${article.category}`)) score += 4;

      for (const token of tokens) {
        let best = 0;
        for (const [index, variant] of token.variants.entries()) {
          let weight = terms.get(variant) || 0;
          let matchedTerm = variant;

          // Prefix matching lets "solar" reach "solars" and "bill" reach
          // "billing" without a real stemmer.
          // Both sides need real length: without the term-length guard a
          // one-letter word in some paragraph counted as a prefix of whatever
          // was typed, and long queries matched everything weakly.
          if (!weight && variant.length >= 4) {
            for (const [term, termWeight] of terms) {
              if (term.length < 4) continue;
              if (term.startsWith(variant) || variant.startsWith(term)) {
                if (termWeight * 0.8 > weight) {
                  weight = termWeight * 0.8;
                  matchedTerm = term;
                }
              }
            }
          }

          if (!weight) continue;
          // Synonym hits score well below the word the reader actually typed,
          // so expansion rescues empty results without hijacking good ones.
          const value = (index === 0 ? weight : weight * 0.45) * rarityOf(matchedTerm);
          if (value > best) best = value;
        }
        if (best > 0) {
          score += best;
          matched += 1;
        }
      }

      return { article, score, matched };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.matched - a.matched || b.score - a.score);

  // A guide that barely brushes the question is worse than not listing it:
  // it makes the Hub look like it answered when it didn't.
  const best = scored[0]?.score ?? 0;
  return scored
    .filter((result) => result.score >= best * 0.28)
    .map((result) => result.article);
}
