import {
  Finding,
  TerminologyItem,
  GuidelineClause,
  SubmissionChannel,
  SubmissionAudience,
  Severity,
} from '../types';

export interface RulesEngineInput {
  content: string;
  versionId?: string;
  channel?: SubmissionChannel;
  audience?: SubmissionAudience;
  terms: TerminologyItem[];
  clauses: GuidelineClause[];
}

/**
 * Superlative & absolute claim patterns with associated guidance and citations
 */
const SUPERLATIVE_PATTERNS: {
  regex: RegExp;
  reason: string;
  sourceId: string;
  severity: Severity;
  replacement?: string;
}[] = [
  {
    regex: /\b(unconditionally\s+the\s+fastest|fastest\s+in\s+the\s+(?:galaxy|universe|world|industry)|fastest)\b/gi,
    reason: 'Superlative speed claims require a verifiable, dated benchmark citation (CL-CLAIM-01, CL-CLAIM-02).',
    sourceId: 'CL-CLAIM-01',
    severity: 'critical',
    replacement: 'designed for ultra-low latency',
  },
  {
    regex: /\b(100%\s+secure|completely\s+unbreakable|unhackable|bulletproof\s+security)\b/gi,
    reason: 'Absolute security claims are legally indefensible under FTC advertising standards (CL-CLAIM-01).',
    sourceId: 'CL-CLAIM-01',
    severity: 'critical',
    replacement: 'architected with defense-in-depth security',
  },
  {
    regex: /\b(guaranteed?\s+100%\s+uptime|guarantee\s+you\s+will\s+never\s+experience\s+downtime|zero\s+downtime\s+guaranteed?)\b/gi,
    reason: 'SLA guarantees are defined strictly in service agreements; describe as engineered availability (CL-CLAIM-04).',
    sourceId: 'CL-CLAIM-04',
    severity: 'critical',
    replacement: 'engineered for 99.99% multi-region availability',
  },
  {
    regex: /\b(best-in-class|best\s+in\s+class|unbeatable|unmatched\s+in\s+the\s+market)\b/gi,
    reason: 'Unsubstantiated superlative claims violate FTC guidelines unless accompanied by a named award citation (CL-CLAIM-01).',
    sourceId: 'CL-CLAIM-01',
    severity: 'warning',
    replacement: 'top-rated in independent developer benchmarks',
  },
  {
    regex: /\b(foolproof)\b/gi,
    reason: 'Patronizing tone that violates our user-respect principle (CL-TONE-01).',
    sourceId: 'CL-TONE-01',
    severity: 'warning',
    replacement: 'intuitive and streamlined',
  },
  {
    regex: /\b(military-grade(?:\s+encryption)?)\b/gi,
    reason: 'Prohibited colloquialism. Specify exact cryptographic ciphers (e.g. AES-256) (CL-COMP-01).',
    sourceId: 'CL-COMP-01',
    severity: 'critical',
    replacement: 'industry-standard AES-256 encryption',
  },
  {
    regex: /\b(game-changing|revolutionary|magical|miracle)\b/gi,
    reason: 'Violates Cranberry Labs anti-hype style policy. Focus on concrete technical merits (CL-TONE-02).',
    sourceId: 'CL-TONE-02',
    severity: 'warning',
    replacement: 'workflow-accelerating',
  },
  {
    regex: /\b(click\s+here(?:\s+to\s+[a-z]+)?)\b/gi,
    reason: 'Accessibility violation (WCAG AA). Hyperlink text must describe destination (CL-A11Y-01).',
    sourceId: 'CL-A11Y-01',
    severity: 'warning',
    replacement: 'explore our documentation',
  },
];

/**
 * Product casing rules for Cranberry Labs products
 */
const PRODUCT_CASING_RULES: {
  incorrectRegex: RegExp;
  correctName: string;
  sourceId: string;
}[] = [
  {
    incorrectRegex: /\b(cranberry\s+cloud|cranberrycloud|Cranberry\s+cloud|Cranberry\s+Cloud)\b/g,
    correctName: 'CranberryCloud',
    sourceId: 'CL-TERM-01',
  },
  {
    incorrectRegex: /\b(cranberry\s+pulse|cranberrypulse|Cranberry\s+pulse|Cranberry\s+Pulse)\b/g,
    correctName: 'CranberryPulse',
    sourceId: 'CL-TERM-01',
  },
  {
    incorrectRegex: /\b(cranberry\s+vault|cranberryvault|Cranberry\s+vault|Cranberry\s+Vault)\b/g,
    correctName: 'CranberryVault',
    sourceId: 'CL-TERM-01',
  },
];

/**
 * Forward-looking projection indicators that require a safe harbor disclaimer in press releases & blogs
 */
const FORWARD_LOOKING_INDICATORS = [
  /\b(?:in\s+Q[1-4]|will\s+launch|projected\s+to|expect\s+to\s+(?:grow|double)|forecasted)\b/i,
];

const SAFE_HARBOR_KEYWORDS = [
  'forward-looking',
  'subject to change',
  'safe harbor',
  'future releases',
];

/**
 * Deterministic Rules Engine: Evaluates draft text against deterministic rules,
 * terminology dictionaries, casing rules, superlatives, and required disclaimers.
 */
export function runDeterministicRules(input: RulesEngineInput): Finding[] {
  const { content, versionId = 'v-temp', channel, terms, clauses } = input;
  const findings: Finding[] = [];
  let findingCounter = 1;

  if (!content || !content.trim()) return [];

  // Helper to ensure valid source ID
  const clauseMap = new Map(clauses.map((c) => [c.id, c]));
  const getValidClauseId = (preferredId: string, fallbackId = 'CL-TERM-01'): string => {
    if (clauseMap.has(preferredId)) return preferredId;
    return clauseMap.has(fallbackId) ? fallbackId : clauses[0]?.id || 'CL-TONE-01';
  };

  // 1. Terminology Dictionary Checks (Banned & Preferred Terms)
  for (const termItem of terms) {
    if (!termItem.isBanned) continue;

    // Build regex respecting case sensitivity
    const flags = termItem.caseSensitive ? 'g' : 'gi';
    const escaped = termItem.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Word boundary check if alphanumeric
    const hasWordBoundary = /^\w+$/.test(termItem.term);
    const pattern = hasWordBoundary ? `\\b${escaped}\\b` : escaped;
    const regex = new RegExp(pattern, flags);

    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const spanStart = match.index;
      const quotedSpan = match[0];
      const spanEnd = spanStart + quotedSpan.length;

      const sourceId = getValidClauseId(termItem.clauseId || 'CL-TERM-01', 'CL-TERM-01');
      const clause = clauseMap.get(sourceId);

      findings.push({
        id: `rule-term-${findingCounter++}`,
        versionId,
        quotedSpan,
        spanStart,
        spanEnd,
        category: clause?.category || 'terminology',
        sourceId,
        sourceType: 'terminology',
        reason: termItem.reason,
        severity: clause?.severity || 'critical',
        suggestedRewrite: termItem.preferredTerm || undefined,
        origin: 'rule-based',
        confidence: 1.0,
        status: 'open',
      });
    }
  }

  // 2. Product Name Casing Checks
  for (const productRule of PRODUCT_CASING_RULES) {
    let match: RegExpExecArray | null;
    while ((match = productRule.incorrectRegex.exec(content)) !== null) {
      const quotedSpan = match[0];
      // Skip if already correctly cased
      if (quotedSpan === productRule.correctName) continue;

      const spanStart = match.index;
      const spanEnd = spanStart + quotedSpan.length;
      const sourceId = getValidClauseId(productRule.sourceId, 'CL-TERM-01');

      findings.push({
        id: `rule-casing-${findingCounter++}`,
        versionId,
        quotedSpan,
        spanStart,
        spanEnd,
        category: 'terminology',
        sourceId,
        sourceType: 'clause',
        reason: `Product name "${quotedSpan}" has incorrect casing. Official brand standard is "${productRule.correctName}".`,
        severity: 'critical',
        suggestedRewrite: productRule.correctName,
        origin: 'rule-based',
        confidence: 1.0,
        status: 'open',
      });
    }
  }

  // 3. Absolute & Superlative Claims
  for (const supRule of SUPERLATIVE_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(supRule.regex.source, supRule.regex.flags);
    while ((match = regex.exec(content)) !== null) {
      const quotedSpan = match[0];
      const spanStart = match.index;
      const spanEnd = spanStart + quotedSpan.length;

      // Check if we already covered this exact span with a term rule
      const alreadyCovered = findings.some(
        (f) => Math.abs((f.spanStart || 0) - spanStart) < 3 && f.quotedSpan.toLowerCase() === quotedSpan.toLowerCase()
      );
      if (alreadyCovered) continue;

      const sourceId = getValidClauseId(supRule.sourceId, 'CL-CLAIM-01');
      const clause = clauseMap.get(sourceId);

      findings.push({
        id: `rule-claim-${findingCounter++}`,
        versionId,
        quotedSpan,
        spanStart,
        spanEnd,
        category: clause?.category || 'claim',
        sourceId,
        sourceType: 'clause',
        reason: supRule.reason,
        severity: supRule.severity,
        suggestedRewrite: supRule.replacement,
        origin: 'rule-based',
        confidence: 1.0,
        status: 'open',
      });
    }
  }

  // 4. Channel-Specific Required Disclaimers
  // Check if content discusses future roadmap/milestones in a press release or blog without safe harbor
  const mentionsFuture = FORWARD_LOOKING_INDICATORS.some((re) => re.test(content));
  const hasSafeHarbor = SAFE_HARBOR_KEYWORDS.some((kw) => content.toLowerCase().includes(kw));

  if (mentionsFuture && !hasSafeHarbor && (channel === 'press_release' || channel === 'blog')) {
    // Find where future projection is mentioned
    for (const indicator of FORWARD_LOOKING_INDICATORS) {
      const match = indicator.exec(content);
      if (match) {
        const spanStart = match.index;
        const quotedSpan = match[0];
        const spanEnd = spanStart + quotedSpan.length;
        const sourceId = getValidClauseId('CL-CLAIM-03', 'CL-CLAIM-01');

        findings.push({
          id: `rule-disclaimer-${findingCounter++}`,
          versionId,
          quotedSpan,
          spanStart,
          spanEnd,
          category: 'claim',
          sourceId,
          sourceType: 'clause',
          reason:
            'Content discusses forward-looking product releases or metrics without the mandatory safe-harbor notice required by legal policy (CL-CLAIM-03).',
          severity: 'critical',
          suggestedRewrite: `${quotedSpan} (Note: Statements regarding future product releases are forward-looking and subject to change without notice.)`,
          origin: 'rule-based',
          confidence: 1.0,
          status: 'open',
        });
        break;
      }
    }
  }

  // Deduplicate findings by spanStart and quotedSpan
  const seenSpans = new Set<string>();
  const uniqueFindings = findings.filter((f) => {
    const key = `${f.spanStart}-${f.spanEnd}-${f.quotedSpan.toLowerCase()}`;
    if (seenSpans.has(key)) return false;
    seenSpans.add(key);
    return true;
  });

  // Sort by spanStart ascending
  return uniqueFindings.sort((a, b) => (a.spanStart || 0) - (b.spanStart || 0));
}

/**
 * Recomputes character offsets for remaining open findings after an Accept or Edit operation modifies draft text.
 */
export function recomputeFindingOffsets(
  findings: Finding[],
  actionedFindingId: string,
  oldSpan: string,
  newSpan: string,
  newContent: string
): Finding[] {
  const target = findings.find((f) => f.id === actionedFindingId);
  if (!target || target.spanStart === undefined || target.spanEnd === undefined) {
    return findings;
  }

  const offsetDelta = newSpan.length - oldSpan.length;
  const targetEnd = target.spanEnd;

  return findings.map((f) => {
    if (f.id === actionedFindingId) {
      return {
        ...f,
        spanEnd: (f.spanStart || 0) + newSpan.length,
        quotedSpan: newSpan,
      };
    }

    // Only adjust findings that appear strictly AFTER the replaced span
    if (f.spanStart !== undefined && f.spanEnd !== undefined && f.spanStart >= targetEnd) {
      const adjustedStart = f.spanStart + offsetDelta;
      const adjustedEnd = f.spanEnd + offsetDelta;

      // Verify that the adjusted slice matches the quoted span
      const slice = newContent.slice(adjustedStart, adjustedEnd);
      if (slice === f.quotedSpan) {
        return {
          ...f,
          spanStart: adjustedStart,
          spanEnd: adjustedEnd,
        };
      }

      // If exact slice doesn't match due to multiple edits, relocate nearest occurrence
      const relocatedIndex = newContent.indexOf(f.quotedSpan, Math.max(0, adjustedStart - 50));
      if (relocatedIndex !== -1 && Math.abs(relocatedIndex - adjustedStart) < 100) {
        return {
          ...f,
          spanStart: relocatedIndex,
          spanEnd: relocatedIndex + f.quotedSpan.length,
        };
      }

      return {
        ...f,
        spanStart: adjustedStart,
        spanEnd: adjustedEnd,
      };
    }

    return f;
  });
}

