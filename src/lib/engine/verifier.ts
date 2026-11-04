import {
  Finding,
  GuidelineClause,
  ApprovedFact,
  FindingSourceType,
} from '../types';
import { RawLLMFinding } from './llm-judge';

export interface VerifierInput {
  draftContent: string;
  versionId: string;
  rawFindings: RawLLMFinding[];
  knownClauses: GuidelineClause[];
  knownFacts: ApprovedFact[];
  ruleFindings?: Finding[];
}

export interface VerificationResult {
  verifiedFindings: Finding[];
  discardedCount: number;
  discardReasons: { quotedSpan: string; reason: string }[];
}

/**
 * Strict Citation & Verbatim Span Verifier.
 * Discards any finding whose quoted_span is not literally present in the draft
 * or whose source_id does not exist in the organization's knowledge base.
 */
export function verifyAndFilterFindings(input: VerifierInput): VerificationResult {
  const {
    draftContent,
    versionId,
    rawFindings,
    knownClauses,
    knownFacts,
    ruleFindings = [],
  } = input;

  const validClauseIds = new Set(knownClauses.map((c) => c.id));
  const validFactIds = new Set(knownFacts.map((f) => f.id));

  const verifiedFindings: Finding[] = [];
  const discardReasons: { quotedSpan: string; reason: string }[] = [];
  let discardedCount = 0;
  let findingCounter = 100;

  for (const raw of rawFindings) {
    const rawSpan = raw.quoted_span?.trim();

    // 1. Check: Quoted span must be non-empty and exist verbatim in draft
    if (!rawSpan) {
      discardedCount++;
      discardReasons.push({ quotedSpan: '', reason: 'Empty quoted_span' });
      continue;
    }

    const spanIndex = draftContent.indexOf(rawSpan);
    if (spanIndex === -1) {
      // Span is not literally in the text (Hallucination detection!)
      discardedCount++;
      discardReasons.push({
        quotedSpan: rawSpan,
        reason: `Quoted span "${rawSpan.substring(0, 40)}..." is not literally present in the draft content.`,
      });
      continue;
    }

    // 2. Check: Source ID must exist in organization's known clauses or facts
    const rawSourceId = raw.source_id?.trim();
    let sourceType: FindingSourceType = 'clause';

    if (validClauseIds.has(rawSourceId)) {
      sourceType = 'clause';
    } else if (validFactIds.has(rawSourceId)) {
      sourceType = 'fact';
    } else {
      // Fabricated source ID! Discard immediately.
      discardedCount++;
      discardReasons.push({
        quotedSpan: rawSpan,
        reason: `Source ID "${rawSourceId}" does not exist in the organization's approved knowledge base.`,
      });
      continue;
    }

    // 3. Check for span overlap with an existing rule-based finding
    const spanEnd = spanIndex + rawSpan.length;
    const overlapsWithRule = ruleFindings.some(
      (rf) =>
        rf.spanStart !== undefined &&
        rf.spanEnd !== undefined &&
        Math.max(rf.spanStart, spanIndex) < Math.min(rf.spanEnd, spanEnd)
    );

    if (overlapsWithRule) {
      // Deterministic rule takes precedence
      discardedCount++;
      discardReasons.push({
        quotedSpan: rawSpan,
        reason: 'Overlaps with higher-priority deterministic rule finding.',
      });
      continue;
    }

    // 4. Compute confidence score (0.85 - 0.95 for validated AI findings)
    const isExactPhrase = rawSpan.length > 10;
    const confidence = isExactPhrase ? 0.92 : 0.85;

    verifiedFindings.push({
      id: `ai-finding-${findingCounter++}`,
      versionId,
      quotedSpan: rawSpan,
      spanStart: spanIndex,
      spanEnd,
      category: raw.category || 'claim',
      sourceId: rawSourceId,
      sourceType,
      reason: raw.plain_language_reason || 'Identified brand guideline violation.',
      severity: raw.severity || 'warning',
      suggestedRewrite: raw.suggested_rewrite || undefined,
      origin: 'ai-assisted',
      confidence,
      status: 'open',
    });
  }

  return {
    verifiedFindings,
    discardedCount,
    discardReasons,
  };
}
