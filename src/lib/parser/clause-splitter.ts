import { ClauseCategory, GuidelineClause, Severity } from '../types';

export interface SplitClauseDraft {
  id: string;
  category: ClauseCategory;
  title: string;
  summary: string;
  fullText: string;
  severity: Severity;
}

/**
 * Heuristically infers the clause category from text keywords.
 */
export function inferCategory(text: string): ClauseCategory {
  const lower = text.toLowerCase();

  // Accessibility should take precedence over visual terms like "visual diagram"
  if (
    lower.includes('accessibility') ||
    lower.includes('a11y') ||
    lower.includes('alt text') ||
    lower.includes('screen reader') ||
    lower.includes('wcag') ||
    lower.includes('click here') ||
    lower.includes('anchor text')
  ) {
    return 'accessibility';
  }

  if (
    lower.includes('contrast') ||
    lower.includes('color') ||
    lower.includes('palette') ||
    lower.includes('logo') ||
    lower.includes('visual') ||
    lower.includes('typography') ||
    lower.includes('dark mode')
  ) {
    return 'visual';
  }

  if (
    lower.includes('claim') ||
    lower.includes('fastest') ||
    lower.includes('100%') ||
    lower.includes('guarantee') ||
    lower.includes('uptime') ||
    lower.includes('sla') ||
    lower.includes('benchmark') ||
    lower.includes('saving') ||
    lower.includes('superlative')
  ) {
    return 'claim';
  }

  if (
    lower.includes('term') ||
    lower.includes('casing') ||
    lower.includes('spelling') ||
    lower.includes('naming') ||
    lower.includes('banned') ||
    lower.includes('whitelist') ||
    lower.includes('allowlist') ||
    lower.includes('denylist') ||
    lower.includes('jargon')
  ) {
    return 'terminology';
  }

  if (
    lower.includes('soc 2') ||
    lower.includes('gdpr') ||
    lower.includes('iso') ||
    lower.includes('compliance') ||
    lower.includes('legal') ||
    lower.includes('encryption') ||
    lower.includes('cipher') ||
    lower.includes('disclaimer') ||
    lower.includes('safe harbor')
  ) {
    return 'compliance';
  }

  if (
    lower.includes('tone') ||
    lower.includes('voice') ||
    lower.includes('hype') ||
    lower.includes('buzzword') ||
    lower.includes('active voice') ||
    lower.includes('empath') ||
    lower.includes('humor')
  ) {
    return 'tone';
  }

  return 'messaging';
}

/**
 * Infers clause severity from prohibitive or recommendation language.
 */
export function inferSeverity(text: string): Severity {
  const lower = text.toLowerCase();
  if (
    lower.includes('prohibited') ||
    lower.includes('never') ||
    lower.includes('must not') ||
    lower.includes('strictly') ||
    lower.includes('zero tolerance') ||
    lower.includes('critical') ||
    lower.includes('illegal') ||
    lower.includes('violation')
  ) {
    return 'critical';
  }

  if (
    lower.includes('avoid') ||
    lower.includes('should not') ||
    lower.includes('warning') ||
    lower.includes('caution') ||
    lower.includes('prefer') ||
    lower.includes('strongly recommended')
  ) {
    return 'warning';
  }

  return 'info';
}

/**
 * Splits raw document text or markdown into distinct guideline clauses.
 */
export function splitTextIntoClauses(
  rawText: string,
  organizationId: string,
  idPrefix = 'CL-IMP'
): GuidelineClause[] {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const sections: { title: string; content: string }[] = [];

  // 1. Try splitting by Markdown headings (# or ## or ###)
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const headingMatches = Array.from(normalized.matchAll(headingRegex));

  if (headingMatches.length >= 2) {
    for (let i = 0; i < headingMatches.length; i++) {
      const match = headingMatches[i];
      const title = match[2].trim();
      const startIndex = match.index! + match[0].length;
      const endIndex =
        i + 1 < headingMatches.length ? headingMatches[i + 1].index! : normalized.length;

      const content = normalized.slice(startIndex, endIndex).trim();
      if (content.length > 0) {
        sections.push({ title, content });
      }
    }
  } else {
    // 2. Try splitting by numbered clauses (e.g., "1. ", "Clause 1:", "Section 2.1")
    const clauseRegex = /^(?:Clause\s+\d+|Section\s+[\d.]+|\d+\.|\d+\))\s*(.+)$/gm;
    const clauseMatches = Array.from(normalized.matchAll(clauseRegex));

    if (clauseMatches.length >= 2) {
      for (let i = 0; i < clauseMatches.length; i++) {
        const match = clauseMatches[i];
        const lineText = match[1].trim();
        const startIndex = match.index!;
        const nextIndex =
          i + 1 < clauseMatches.length ? clauseMatches[i + 1].index! : normalized.length;
        const fullBlock = normalized.slice(startIndex, nextIndex).trim();

        // Extract title: if line has ":", split title from content
        let title = lineText;
        let content = fullBlock;
        if (lineText.includes(':')) {
          const colonIdx = lineText.indexOf(':');
          title = lineText.substring(0, colonIdx).trim();
        } else if (lineText.length > 50) {
          title = lineText.substring(0, 50).trim() + '...';
        }

        sections.push({ title, content });
      }
    } else {
      // 3. Fallback: Split by double newlines into discrete paragraphs
      const paragraphs = normalized.split(/\n\n+/).filter((p) => p.trim().length > 30);
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i].trim();
        const firstSentenceEnd = p.indexOf('. ');
        const title =
          firstSentenceEnd > 0 && firstSentenceEnd < 60
            ? p.substring(0, firstSentenceEnd)
            : `Guideline Rule ${i + 1}`;
        sections.push({ title, content: p });
      }
    }
  }

  // Convert sections into typed GuidelineClause items
  const now = new Date().toISOString();
  return sections.map((sec, idx) => {
    const combined = `${sec.title} ${sec.content}`;
    const category = inferCategory(combined);
    const severity = inferSeverity(combined);

    // Extract 1-sentence summary
    const cleanContent = sec.content.replace(/\n+/g, ' ');
    const firstPeriod = cleanContent.indexOf('.');
    const summary =
      firstPeriod > 20 && firstPeriod < 150
        ? cleanContent.substring(0, firstPeriod + 1)
        : cleanContent.substring(0, 120) + '...';

    const clauseId = `${idPrefix}-${String(idx + 1).padStart(2, '0')}`;

    return {
      id: clauseId,
      organizationId,
      category,
      title: sec.title.replace(/^[*_#\s]+|[*_#\s]+$/g, ''),
      summary,
      fullText: sec.content,
      severity,
      createdAt: now,
    };
  });
}
