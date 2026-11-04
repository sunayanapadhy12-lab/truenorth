import { describe, it, expect } from 'vitest';
import { verifyAndFilterFindings } from '../lib/engine/verifier';
import { executeReviewPipeline } from '../lib/engine/pipeline';
import {
  SEED_CLAUSES,
  SEED_FACTS,
  CRANBERRY_ORG,
} from '../lib/seed/cranberry-labs-data';
import { RawLLMFinding } from '../lib/engine/llm-judge';

describe('Phase 4: Citation Verifier & Pipeline Fallback', () => {
  const draftContent =
    'CranberryCloud delivers extreme speed for all web applications at a cheap price of $19/seat/month.';

  it('discards findings with hallucinated spans not in the draft', () => {
    const rawFindings: RawLLMFinding[] = [
      {
        quoted_span: 'this phrase never appears anywhere in the text',
        category: 'tone',
        source_id: 'CL-TONE-01',
        source_type: 'clause',
        plain_language_reason: 'Fabricated quote test',
        severity: 'warning',
      },
    ];

    const result = verifyAndFilterFindings({
      draftContent,
      versionId: 'v1',
      rawFindings,
      knownClauses: SEED_CLAUSES,
      knownFacts: SEED_FACTS,
    });

    expect(result.verifiedFindings.length).toBe(0);
    expect(result.discardedCount).toBe(1);
    expect(result.discardReasons[0].reason).toContain('not literally present in the draft');
  });

  it('discards findings with hallucinated source IDs that do not exist', () => {
    const rawFindings: RawLLMFinding[] = [
      {
        quoted_span: 'cheap price',
        category: 'tone',
        source_id: 'CL-NON-EXISTENT-99', // Fake ID!
        source_type: 'clause',
        plain_language_reason: 'Citing fake source test',
        severity: 'warning',
      },
    ];

    const result = verifyAndFilterFindings({
      draftContent,
      versionId: 'v1',
      rawFindings,
      knownClauses: SEED_CLAUSES,
      knownFacts: SEED_FACTS,
    });

    expect(result.verifiedFindings.length).toBe(0);
    expect(result.discardedCount).toBe(1);
    expect(result.discardReasons[0].reason).toContain('does not exist in the organization');
  });

  it('accepts verified findings with verbatim spans and real citations', () => {
    const rawFindings: RawLLMFinding[] = [
      {
        quoted_span: '$19/seat/month',
        category: 'claim',
        source_id: 'FACT-PRICE-03-EXPIRED', // Real expired fact in knowledge base!
        source_type: 'fact',
        plain_language_reason: 'Starter plan price was updated to $29; $19 expired on Dec 31, 2025.',
        severity: 'critical',
        suggested_rewrite: '$29/seat/month',
      },
    ];

    const result = verifyAndFilterFindings({
      draftContent,
      versionId: 'v1',
      rawFindings,
      knownClauses: SEED_CLAUSES,
      knownFacts: SEED_FACTS,
    });

    expect(result.verifiedFindings.length).toBe(1);
    const verified = result.verifiedFindings[0];
    expect(verified.sourceId).toBe('FACT-PRICE-03-EXPIRED');
    expect(verified.origin).toBe('ai-assisted');
    expect(verified.confidence).toBeGreaterThan(0.8);
    expect(verified.spanStart).toBe(draftContent.indexOf('$19/seat/month'));
    expect(draftContent.slice(verified.spanStart!, verified.spanEnd!)).toBe('$19/seat/month');
  });

  it('discards AI findings that overlap with higher-priority deterministic rules', () => {
    const rawFindings: RawLLMFinding[] = [
      {
        quoted_span: 'cheap',
        category: 'tone',
        source_id: 'CL-TONE-01',
        source_type: 'clause',
        plain_language_reason: 'Avoid cheap',
        severity: 'warning',
      },
    ];

    // Simulate an existing deterministic rule already covering 'cheap'
    const ruleStart = draftContent.indexOf('cheap');
    const ruleFindings = [
      {
        id: 'rule-term-1',
        versionId: 'v1',
        quotedSpan: 'cheap',
        spanStart: ruleStart,
        spanEnd: ruleStart + 5,
        category: 'tone' as const,
        sourceId: 'CL-TONE-01',
        sourceType: 'terminology' as const,
        reason: 'Cheap connotes substandard engineering',
        severity: 'warning' as const,
        origin: 'rule-based' as const,
        confidence: 1.0,
        status: 'open' as const,
      },
    ];

    const result = verifyAndFilterFindings({
      draftContent,
      versionId: 'v1',
      rawFindings,
      knownClauses: SEED_CLAUSES,
      knownFacts: SEED_FACTS,
      ruleFindings,
    });

    expect(result.verifiedFindings.length).toBe(0);
    expect(result.discardedCount).toBe(1);
    expect(result.discardReasons[0].reason).toContain('Overlaps with higher-priority deterministic rule');
  });

  it('gracefully degrades to rule-based fallback when AI key is missing or fails', async () => {
    // Pipeline without valid GEMINI_API_KEY
    const result = await executeReviewPipeline({
      content: draftContent,
      versionId: 'v-fallback-test',
      channel: 'blog',
      organizationId: CRANBERRY_ORG.id,
    });

    // Must NOT crash
    expect(result).toBeDefined();
    expect(result.isAiFallback).toBe(true);
    expect(result.fallbackReason).toBeDefined();
    // Deterministic rules still ran!
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.every((f) => f.origin === 'rule-based')).toBe(true);
  });
});

