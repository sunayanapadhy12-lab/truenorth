import { GuidelineClause, ApprovedFact } from '../types';

export interface RetrievedEvidence {
  clauses: GuidelineClause[];
  facts: ApprovedFact[];
  sentenceMappings: {
    sentence: string;
    relevantClauseIds: string[];
    relevantFactIds: string[];
  }[];
}

/**
 * Splits text into individual sentences for fine-grained retrieval.
 */
export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/([.?!])\s*(?=[A-Z0-9])/g, '$1|~|')
    .split('|~|')
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

/**
 * Extracts normalized keyword tokens from a string.
 */
function tokenize(text: string): Set<string> {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
    'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between',
    'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'could', 'shall', 'should', 'will', 'would',
    'our', 'we', 'your', 'you', 'it', 'its', 'they', 'them', 'their', 'this', 'that'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9$%]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Computes Jaccard / token overlap similarity between two texts.
 */
function computeTokenOverlap(queryTokens: Set<string>, targetText: string): number {
  if (queryTokens.size === 0) return 0;
  const targetTokens = tokenize(targetText);
  let matchCount = 0;

  queryTokens.forEach((token) => {
    if (targetTokens.has(token)) {
      matchCount++;
    } else {
      // Partial prefix match for plurals or verb forms (e.g. encrypt vs encryption)
      targetTokens.forEach((t) => {
        if ((token.length > 4 && t.startsWith(token)) || (t.length > 4 && token.startsWith(t))) {
          matchCount += 0.5;
        }
      });
    }
  });

  return matchCount / Math.max(queryTokens.size, 1);
}

/**
 * Keyword-based retrieval engine with semantic category boosting.
 * Evaluates candidate guideline clauses and approved facts against the input draft.
 */
export function retrieveEvidence(
  draftText: string,
  clauses: GuidelineClause[],
  facts: ApprovedFact[],
  topKClauses = 8,
  topMFacts = 6
): RetrievedEvidence {
  const sentences = splitIntoSentences(draftText);
  const draftTokens = tokenize(draftText);

  // Score guideline clauses
  const scoredClauses = clauses.map((clause) => {
    const clauseTokens = tokenize(`${clause.title} ${clause.summary} ${clause.fullText}`);
    let score = computeTokenOverlap(clauseTokens, draftText);

    // Boost claims & security policies if numbers/percentages or superlatives appear in draft
    if (clause.category === 'claim' && (/\b\d+%\b|\b(fastest|best|guaranteed?)\b/i.test(draftText))) {
      score += 0.6;
    }
    // Boost pricing/metrics if currency or digits appear
    if (clause.category === 'compliance' && (/\b(soc\s*2|iso|encryption|aes|aws|gdpr)\b/i.test(draftText))) {
      score += 0.6;
    }
    // Boost terminology if product names appear
    if (clause.category === 'terminology' && (/cranberry/i.test(draftText))) {
      score += 0.5;
    }

    return { clause, score };
  });

  scoredClauses.sort((a, b) => b.score - a.score);
  const selectedClauses = scoredClauses
    .slice(0, topKClauses)
    .filter((item, idx) => idx < 3 || item.score > 0.1)
    .map((item) => item.clause);

  // Score approved facts
  const scoredFacts = facts.map((fact) => {
    const factTokens = tokenize(`${fact.statement} ${fact.factValue} ${fact.sourceDoc}`);
    let score = computeTokenOverlap(factTokens, draftText);

    // Boost if price symbols ($) match
    if (fact.statement.toLowerCase().includes('price') && /\$\d+/i.test(draftText)) {
      score += 0.8;
    }
    // Boost if request/customer numbers match
    if (/\b\d+(?:,\d+)*(?:\s*(?:billion|million|active|organizations|customers))?\b/i.test(draftText)) {
      score += 0.5;
    }

    return { fact, score };
  });

  scoredFacts.sort((a, b) => b.score - a.score);
  const selectedFacts = scoredFacts
    .slice(0, topMFacts)
    .filter((item, idx) => idx < 2 || item.score > 0.1)
    .map((item) => item.fact);

  // Sentence-level mappings
  const sentenceMappings = sentences.map((sentence) => {
    const sTokens = tokenize(sentence);
    const relevantClauseIds = selectedClauses
      .filter((c) => computeTokenOverlap(sTokens, `${c.title} ${c.summary}`) > 0.15)
      .map((c) => c.id);

    const relevantFactIds = selectedFacts
      .filter((f) => computeTokenOverlap(sTokens, `${f.statement} ${f.factValue}`) > 0.15)
      .map((f) => f.id);

    return {
      sentence,
      relevantClauseIds,
      relevantFactIds,
    };
  });

  return {
    clauses: selectedClauses,
    facts: selectedFacts,
    sentenceMappings,
  };
}
