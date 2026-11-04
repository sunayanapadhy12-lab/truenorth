import { describe, it, expect } from 'vitest';
import {
  runDeterministicRules,
  recomputeFindingOffsets,
} from '../lib/engine/rules-engine';
import {
  SEED_CLAUSES,
  SEED_TERMINOLOGY,
  SEED_SAMPLE_DRAFTS,
} from '../lib/seed/cranberry-labs-data';

describe('Phase 3: Deterministic Rules Engine', () => {
  const defaultInput = {
    terms: SEED_TERMINOLOGY,
    clauses: SEED_CLAUSES,
    versionId: 'test-v1',
  };

  it('detects banned terms with correct reason and citation', () => {
    const content = 'Our software provides 100% secure storage that is completely unbreakable.';
    const findings = runDeterministicRules({
      ...defaultInput,
      content,
    });

    expect(findings.length).toBeGreaterThanOrEqual(2);

    const secureFinding = findings.find((f) => f.quotedSpan.toLowerCase().includes('100% secure'));
    expect(secureFinding).toBeDefined();
    expect(secureFinding?.sourceId).toBe('CL-CLAIM-01');
    expect(secureFinding?.origin).toBe('rule-based');
    expect(secureFinding?.confidence).toBe(1.0);

    const unbreakableFinding = findings.find((f) => f.quotedSpan.toLowerCase().includes('unbreakable'));
    expect(unbreakableFinding).toBeDefined();
    expect(unbreakableFinding?.sourceId).toBe('CL-CLAIM-01');
  });

  it('enforces case-sensitive product naming', () => {
    const content = 'Deploy your app to Cranberry cloud with ease, or use CranberryCloud for enterprise.';
    const findings = runDeterministicRules({
      ...defaultInput,
      content,
    });

    const casingFinding = findings.find((f) => f.quotedSpan === 'Cranberry cloud');
    expect(casingFinding).toBeDefined();
    expect(casingFinding?.suggestedRewrite).toBe('CranberryCloud');
    expect(casingFinding?.sourceId).toBe('CL-TERM-01');
  });

  it('flags superlative claims and false uptime guarantees', () => {
    const content = 'We offer guaranteed 100% uptime with the fastest latency in the industry.';
    const findings = runDeterministicRules({
      ...defaultInput,
      content,
    });

    const uptimeFinding = findings.find((f) => f.quotedSpan.toLowerCase().includes('guaranteed 100% uptime'));
    expect(uptimeFinding).toBeDefined();
    expect(uptimeFinding?.sourceId).toBe('CL-CLAIM-04');
    expect(uptimeFinding?.severity).toBe('critical');

    const fastestFinding = findings.find((f) => f.quotedSpan.toLowerCase().includes('fastest'));
    expect(fastestFinding).toBeDefined();
    expect(fastestFinding?.sourceId).toBe('CL-CLAIM-01');
  });

  it('detects missing forward-looking disclaimers in press releases', () => {
    const pressRelease =
      'SAN FRANCISCO — Cranberry Labs announced that in Q4 we will launch revolutionary automated pipelines.';
    const findings = runDeterministicRules({
      ...defaultInput,
      content: pressRelease,
      channel: 'press_release',
    });

    const disclaimerFinding = findings.find((f) => f.sourceId === 'CL-CLAIM-03');
    expect(disclaimerFinding).toBeDefined();
    expect(disclaimerFinding?.reason).toContain('safe-harbor notice');
  });

  it('does NOT flag disclaimer if safe-harbor notice is already present', () => {
    const pressReleaseWithDisclaimer =
      'SAN FRANCISCO — In Q4 we will launch automated pipelines. Note: Statements regarding future product releases are forward-looking and subject to change.';
    const findings = runDeterministicRules({
      ...defaultInput,
      content: pressReleaseWithDisclaimer,
      channel: 'press_release',
    });

    const disclaimerFinding = findings.find((f) => f.sourceId === 'CL-CLAIM-03');
    expect(disclaimerFinding).toBeUndefined();
  });

  it('flags accessibility violations like bare "click here"', () => {
    const content = 'To see our metrics, click here to get started.';
    const findings = runDeterministicRules({
      ...defaultInput,
      content,
    });

    const a11yFinding = findings.find((f) => f.sourceId === 'CL-A11Y-01');
    expect(a11yFinding).toBeDefined();
    expect(a11yFinding?.category).toBe('accessibility');
  });

  it('accurately recomputes offsets for remaining findings when text is edited', () => {
    const originalText = 'Use Cranberry cloud and enjoy 100% secure infrastructure.';
    const findings = runDeterministicRules({
      ...defaultInput,
      content: originalText,
    });

    expect(findings.length).toBe(2);
    const firstFinding = findings[0]; // 'Cranberry cloud'
    const secondFinding = findings[1]; // '100% secure'

    expect(originalText.slice(firstFinding.spanStart!, firstFinding.spanEnd!)).toBe(firstFinding.quotedSpan);
    expect(originalText.slice(secondFinding.spanStart!, secondFinding.spanEnd!)).toBe(secondFinding.quotedSpan);

    // Replace 'Cranberry cloud' (len 15) with 'CranberryCloud' (len 14) -> delta is -1
    const newContent = 'Use CranberryCloud and enjoy 100% secure infrastructure.';
    const updatedFindings = recomputeFindingOffsets(
      findings,
      firstFinding.id,
      firstFinding.quotedSpan,
      'CranberryCloud',
      newContent
    );

    const updatedSecondFinding = updatedFindings.find((f) => f.id === secondFinding.id);
    expect(updatedSecondFinding?.spanStart).toBe(secondFinding.spanStart! - 1);
    expect(updatedSecondFinding?.spanEnd).toBe(secondFinding.spanEnd! - 1);

    // Verify verbatim slice in the newly edited content
    const adjustedSlice = newContent.slice(
      updatedSecondFinding?.spanStart!,
      updatedSecondFinding?.spanEnd!
    );
    expect(adjustedSlice).toBe(secondFinding.quotedSpan);
  });

  it('detects multiple intended violations in seeded sample draft 1', () => {
    const draft1 = SEED_SAMPLE_DRAFTS[0];
    const findings = runDeterministicRules({
      ...defaultInput,
      content: draft1.content,
      channel: draft1.channel,
    });

    expect(findings.length).toBeGreaterThanOrEqual(4);

    const foundQuotes = findings.map((f) => f.quotedSpan.toLowerCase());
    expect(foundQuotes.some((q) => q.includes('cranberry cloud'))).toBe(true);
    expect(foundQuotes.some((q) => q.includes('100% secure'))).toBe(true);
    expect(foundQuotes.some((q) => q.includes('game-changing'))).toBe(true);
    expect(foundQuotes.some((q) => q.includes('click here'))).toBe(true);
  });
});

