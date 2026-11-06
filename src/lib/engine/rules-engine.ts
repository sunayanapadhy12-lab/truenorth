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
    replacement: 'ultra-low latency',
  },
  {
    regex: /\b(100%\s+security)\b/gi,
    reason: 'Absolute security claims are legally indefensible under FTC advertising standards (CL-CLAIM-01).',
    sourceId: 'CL-CLAIM-01',
    severity: 'critical',
    replacement: 'defense-in-depth security',
  },
  {
    regex: /\b(100%\s+secure|(?:completely\s+)?unbreakable|unhackable|bulletproof\s+security)\b/gi,
    reason: 'Absolute security and protection claims are legally indefensible under FTC advertising standards (CL-CLAIM-01).',
    sourceId: 'CL-CLAIM-01',
    severity: 'critical',
    replacement: 'highly resilient',
  },
  {
    regex: /\b(guaranteed?\s+100%\s+uptime|guarantee\s+you\s+will\s+never\s+experience\s+downtime|zero\s+downtime\s+guaranteed?)\b/gi,
    reason: 'SLA guarantees are defined strictly in service agreements; describe as engineered availability (CL-CLAIM-04).',
    sourceId: 'CL-CLAIM-04',
    severity: 'critical',
    replacement: 'engineered 99.99% availability',
  },
  {
    regex: /\b(guaranteed?\s+(?:results?|outcomes?|success|performance))\b/gi,
    reason: 'Absolute performance or outcome guarantees are prohibited under FTC truth-in-advertising guidelines (CL-CLAIM-01).',
    sourceId: 'CL-CLAIM-01',
    severity: 'critical',
    replacement: 'measurable outcomes',
  },
  {
    regex: /\b(best-in-class|best\s+in\s+class|unbeatable|unmatched\s+in\s+the\s+market)\b/gi,
    reason: 'Unsubstantiated superlative claims violate FTC guidelines unless accompanied by a named award citation (CL-CLAIM-01).',
    sourceId: 'CL-CLAIM-01',
    severity: 'warning',
    replacement: 'industry-leading',
  },
  {
    regex: /\b(foolproof)\b/gi,
    reason: 'Patronizing tone that violates our user-respect principle (CL-TONE-01).',
    sourceId: 'CL-TONE-01',
    severity: 'warning',
    replacement: 'intuitive',
  },
  {
    regex: /\b(military-grade\s+encryption)\b/gi,
    reason: 'Prohibited colloquialism. Specify exact cryptographic ciphers (e.g. AES-256) (CL-COMP-01).',
    sourceId: 'CL-COMP-01',
    severity: 'critical',
    replacement: 'industry-standard AES-256 encryption',
  },
  {
    regex: /\b(military-grade)\b/gi,
    reason: 'Prohibited colloquialism. Specify exact cryptographic ciphers (e.g. AES-256) (CL-COMP-01).',
    sourceId: 'CL-COMP-01',
    severity: 'critical',
    replacement: 'AES-256',
  },
  {
    regex: /\b(revolutionary)\b/gi,
    reason: 'Violates Cranberry Labs anti-hype style policy. Focus on concrete technical merits (CL-TONE-02).',
    sourceId: 'CL-TONE-02',
    severity: 'warning',
    replacement: 'next-generation',
  },
  {
    regex: /\b(game-changing)\b/gi,
    reason: 'Violates Cranberry Labs anti-hype style policy. Focus on concrete technical merits (CL-TONE-02).',
    sourceId: 'CL-TONE-02',
    severity: 'warning',
    replacement: 'high-impact',
  },
  {
    regex: /\b(miracle)\b/gi,
    reason: 'Violates Cranberry Labs anti-hype style policy. Focus on concrete technical merits (CL-TONE-02).',
    sourceId: 'CL-TONE-02',
    severity: 'warning',
    replacement: 'breakthrough',
  },
  {
    regex: /\b(magical)\b/gi,
    reason: 'Violates Cranberry Labs anti-hype style policy. Focus on concrete technical merits (CL-TONE-02).',
    sourceId: 'CL-TONE-02',
    severity: 'warning',
    replacement: 'intuitive',
  },
  {
    regex: /\b(click\s+here(?:\s+to\s+[a-z]+)?)\b/gi,
    reason: 'Accessibility violation (WCAG AA). Hyperlink text must describe destination (CL-A11Y-01).',
    sourceId: 'CL-A11Y-01',
    severity: 'warning',
    replacement: 'explore documentation',
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

  // Helper to test if two spans overlap
  const hasOverlap = (start: number, end: number, list: Finding[]): boolean => {
    return list.some(
      (f) =>
        f.spanStart !== undefined &&
        f.spanEnd !== undefined &&
        Math.max(start, f.spanStart) < Math.min(end, f.spanEnd)
    );
  };

  // 1. Terminology Dictionary Checks (Banned & Preferred Terms)
  for (const termItem of terms) {
    if (!termItem.isBanned) continue;

    // Build regex respecting case sensitivity and word boundaries
    const flags = termItem.caseSensitive ? 'g' : 'gi';
    const escaped = termItem.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const startBoundary = /^\w/.test(termItem.term) ? '\\b' : '';
    const endBoundary = /\w$/.test(termItem.term) ? '\\b' : '';
    const pattern = `${startBoundary}${escaped}${endBoundary}`;
    const regex = new RegExp(pattern, flags);

    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const spanStart = match.index;
      const quotedSpan = match[0];
      const spanEnd = spanStart + quotedSpan.length;

      if (hasOverlap(spanStart, spanEnd, findings)) continue;

      const sourceId = getValidClauseId(termItem.clauseId || 'CL-TERM-01', 'CL-TERM-01');
      const clause = clauseMap.get(sourceId);
      const titlePrefix = clause ? `${clause.title} — ` : '';

      findings.push({
        id: `rule-term-${findingCounter++}`,
        versionId,
        quotedSpan,
        spanStart,
        spanEnd,
        category: clause?.category || 'terminology',
        sourceId,
        sourceType: 'terminology',
        reason: `${titlePrefix}${termItem.reason}`,
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

      if (hasOverlap(spanStart, spanEnd, findings)) continue;

      const sourceId = getValidClauseId(productRule.sourceId, 'CL-TERM-01');
      const clause = clauseMap.get(sourceId);
      const titlePrefix = clause ? `${clause.title} — ` : '';

      findings.push({
        id: `rule-casing-${findingCounter++}`,
        versionId,
        quotedSpan,
        spanStart,
        spanEnd,
        category: 'terminology',
        sourceId,
        sourceType: 'clause',
        reason: `${titlePrefix}Product name "${quotedSpan}" has incorrect casing. Official brand standard is "${productRule.correctName}".`,
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

      // Ensure no overlap with previously matched terminology, casing, or claim rules
      if (hasOverlap(spanStart, spanEnd, findings)) continue;

      const sourceId = getValidClauseId(supRule.sourceId, 'CL-CLAIM-01');
      const clause = clauseMap.get(sourceId);
      const titlePrefix = clause ? `${clause.title} — ` : '';

      findings.push({
        id: `rule-claim-${findingCounter++}`,
        versionId,
        quotedSpan,
        spanStart,
        spanEnd,
        category: clause?.category || 'claim',
        sourceId,
        sourceType: 'clause',
        reason: `${titlePrefix}${supRule.reason}`,
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

        if (hasOverlap(spanStart, spanEnd, findings)) continue;

        const sourceId = getValidClauseId('CL-CLAIM-03', 'CL-CLAIM-01');
        const clause = clauseMap.get(sourceId);
        const titlePrefix = clause ? `${clause.title} — ` : '';

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
            `${titlePrefix}Content discusses forward-looking product releases or metrics without the mandatory safe-harbor notice required by legal policy (CL-CLAIM-03).`,
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

  // Sort by spanStart ascending
  const sortedFindings = findings.sort((a, b) => (a.spanStart || 0) - (b.spanStart || 0));

  // Guarantee strictly no overlapping spans exist
  const nonOverlappingFindings: Finding[] = [];
  for (const f of sortedFindings) {
    if (f.spanStart === undefined || f.spanEnd === undefined) continue;
    const overlaps = nonOverlappingFindings.some(
      (existing) =>
        existing.spanStart !== undefined &&
        existing.spanEnd !== undefined &&
        Math.max(f.spanStart!, existing.spanStart) < Math.min(f.spanEnd!, existing.spanEnd)
    );
    if (!overlaps) {
      nonOverlappingFindings.push(f);
    }
  }

  // Strict citation & span validation:
  // Discard any finding whose quotedSpan is not verbatim in content at spanStart or whose sourceId is not in clauseMap
  const validatedFindings = nonOverlappingFindings.filter((f) => {
    if (!f.quotedSpan || f.spanStart === undefined || f.spanEnd === undefined) return false;
    const actualSubstring = content.substring(f.spanStart, f.spanEnd);
    if (actualSubstring !== f.quotedSpan) return false;
    if (content.indexOf(f.quotedSpan) === -1) return false;
    if (!clauseMap.has(f.sourceId)) return false;
    return true;
  });

  return validatedFindings;
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

export interface ReplacementResult {
  success: boolean;
  newContent?: string;
  actualOldSpan?: string;
  actualNewSpan?: string;
  error?: string;
}

/**
 * Applies a position-aware replacement to a document draft.
 * Prevents overlapping/stale span replacements, avoids adjacent word duplication,
 * and preserves punctuation, whitespace, and grammatical sentence structure.
 */
export function applyCleanReplacement(
  originalContent: string,
  targetFinding: {
    quotedSpan: string;
    spanStart?: number;
    spanEnd?: number;
  },
  replacementText: string
): ReplacementResult {
  if (!originalContent) {
    return { success: false, error: 'Original content is empty.' };
  }

  const cleanReplacement = replacementText.trim();
  if (!cleanReplacement) {
    return { success: false, error: 'Replacement text cannot be empty.' };
  }

  const { quotedSpan, spanStart, spanEnd } = targetFinding;
  let startIdx = -1;
  let endIdx = -1;

  // 1. Check if given spanStart and spanEnd match quotedSpan
  if (
    typeof spanStart === 'number' &&
    typeof spanEnd === 'number' &&
    spanStart >= 0 &&
    spanEnd <= originalContent.length &&
    spanStart < spanEnd
  ) {
    const slice = originalContent.substring(spanStart, spanEnd);
    if (slice === quotedSpan) {
      startIdx = spanStart;
      endIdx = spanEnd;
    }
  }

  // 2. If not matched at exact span, search in a local window around spanStart
  if (startIdx === -1 && typeof spanStart === 'number') {
    const windowStart = Math.max(0, spanStart - 50);
    const windowEnd = Math.min(originalContent.length, spanStart + quotedSpan.length + 50);
    const windowText = originalContent.substring(windowStart, windowEnd);
    const localIdx = windowText.indexOf(quotedSpan);
    if (localIdx !== -1) {
      startIdx = windowStart + localIdx;
      endIdx = startIdx + quotedSpan.length;
    }
  }

  // 3. If still not matched, search entire content for the exact string
  if (startIdx === -1) {
    startIdx = originalContent.indexOf(quotedSpan);
    if (startIdx !== -1) {
      endIdx = startIdx + quotedSpan.length;
    }
  }

  // 4. Fallback to case-insensitive exact word boundary search
  if (startIdx === -1) {
    const escaped = quotedSpan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    const match = regex.exec(originalContent);
    if (match) {
      startIdx = match.index;
      endIdx = startIdx + match[0].length;
    }
  }

  if (startIdx === -1) {
    return {
      success: false,
      error: `Could not locate quoted span "${quotedSpan}" in document text.`,
    };
  }

  const prefix = originalContent.substring(0, startIdx);
  const suffix = originalContent.substring(endIdx);
  let finalReplacement = cleanReplacement;

  // --- Duplicate Word Prevention at Boundaries ---

  // Check leading word of replacement against trailing word of prefix
  // e.g. prefix ends with "We promise " and replacement starts with "promise "
  const prefixLastWordMatch = prefix.match(/([a-zA-Z0-9_-]+)\s*$/);
  const repFirstWordMatch = finalReplacement.match(/^([a-zA-Z0-9_-]+)/);
  if (prefixLastWordMatch && repFirstWordMatch) {
    const lastPrefixWord = prefixLastWordMatch[1].toLowerCase();
    const firstRepWord = repFirstWordMatch[1].toLowerCase();
    if (lastPrefixWord === firstRepWord) {
      // Remove duplicate leading word from replacement
      finalReplacement = finalReplacement.slice(repFirstWordMatch[0].length).trim();
    }
  }

  // Check trailing word of replacement against leading word of suffix
  // e.g. replacement ends with "outcomes" and suffix starts with "outcomes"
  const repLastWordMatch = finalReplacement.match(/([a-zA-Z0-9_-]+)\s*$/);
  const suffixFirstWordMatch = suffix.match(/^\s*([a-zA-Z0-9_-]+)/);
  if (repLastWordMatch && suffixFirstWordMatch) {
    const lastRepWord = repLastWordMatch[1].toLowerCase();
    const firstSuffixWord = suffixFirstWordMatch[1].toLowerCase();
    if (lastRepWord === firstSuffixWord) {
      // Remove duplicate trailing word from replacement
      finalReplacement = finalReplacement.slice(0, finalReplacement.length - repLastWordMatch[0].length).trim();
    }
  }

  // Whitespace and Punctuation Handling:
  // If prefix does not end with whitespace, and doesn't end with opening quotes/parens, add space
  const prefixEndsWithSpace = /\s$/.test(prefix);
  const prefixEndsWithOpenPunct = /["'(\[{]$/.test(prefix);
  const needsSpaceBefore = prefix.length > 0 && !prefixEndsWithSpace && !prefixEndsWithOpenPunct;

  // If suffix starts with punctuation (like .,!?;:), NO space between replacement and punctuation
  const suffixStartsWithPunct = /^[\.,!?;:)'"\]}]/.test(suffix);
  const suffixStartsWithSpace = /^\s/.test(suffix);
  const needsSpaceAfter = suffix.length > 0 && !suffixStartsWithSpace && !suffixStartsWithPunct;

  const formattedPrefix = needsSpaceBefore ? `${prefix} ` : prefix;
  const formattedSuffix = needsSpaceAfter ? ` ${suffix}` : suffix;

  let newContent = formattedPrefix + finalReplacement + formattedSuffix;

  // Clean any accidental duplicate adjacent identical words created by overlapping or spliced edits
  // e.g., "word word" -> "word"
  newContent = newContent.replace(/\b([a-zA-Z0-9_-]{3,})\s+\1\b/gi, '$1');

  // Clean any accidental fused duplicate words like "engineerengineered" or "outcomesoutcomes"
  newContent = newContent.replace(/\b([a-zA-Z]{3,})\1(ed|ing|s|es)?\b/gi, '$1$2');

  // Fix multiple consecutive spaces (preserves newlines)
  newContent = newContent.replace(/[^\S\r\n]{2,}/g, ' ');

  // Fix spaces before punctuation (e.g. "word ." -> "word.")
  newContent = newContent.replace(/\s+([.,!?;:])/g, '$1');

  return {
    success: true,
    newContent,
    actualOldSpan: originalContent.substring(startIdx, endIdx),
    actualNewSpan: finalReplacement,
  };
}

