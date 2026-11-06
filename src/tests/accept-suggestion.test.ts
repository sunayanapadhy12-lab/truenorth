import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  applyCleanReplacement,
  runDeterministicRules,
} from '../lib/engine/rules-engine';
import {
  SEED_USERS,
  SEED_CLAUSES,
  SEED_TERMINOLOGY,
} from '../lib/seed/cranberry-labs-data';
import { mockStore } from '../lib/supabase/mock-store';
import { POST as createSubmissionHandler } from '../app/api/submissions/route';
import { GET as getSubmissionDetailHandler } from '../app/api/submissions/[id]/route';
import { POST as handleAction } from '../app/api/submissions/[id]/action/route';
import { Finding } from '../lib/types';

// Mock cookies for API auth
const mockCookieMap = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      const val = mockCookieMap.get(name);
      return val ? { name, value: val } : undefined;
    },
    set: (name: string, value: string) => {
      mockCookieMap.set(name, value);
    },
    delete: (name: string) => {
      mockCookieMap.delete(name);
    },
  }),
}));

describe('Accept Suggestion Workflow & Text Replacement Engine', () => {
  const creatorUser = SEED_USERS[1];

  beforeEach(() => {
    mockStore.resetToSeed();
    mockCookieMap.clear();
    mockCookieMap.set('truenorth_role', 'creator');
    mockCookieMap.set('truenorth_user_id', creatorUser.id);
  });

  describe('Unit: applyCleanReplacement', () => {
    it('handles single-word replacement cleanly with grammar preservation', () => {
      const original = "Our platform is the fastest solution in the cloud.";
      const target = {
        quotedSpan: 'fastest',
        spanStart: 20,
        spanEnd: 27,
      };
      const result = applyCleanReplacement(original, target, 'ultra-low latency');
      expect(result.success).toBe(true);
      expect(result.newContent).toBe("Our platform is the ultra-low latency solution in the cloud.");
    });

    it('handles multi-word replacement cleanly', () => {
      const original = "Our cloud guarantees 100% security for all customers.";
      const target = {
        quotedSpan: '100% security',
        spanStart: 21,
        spanEnd: 34,
      };
      const result = applyCleanReplacement(original, target, 'defense-in-depth security');
      expect(result.success).toBe(true);
      expect(result.newContent).toBe("Our cloud guarantees defense-in-depth security for all customers.");
    });

    it('preserves punctuation immediately following replacement without stray spaces', () => {
      const original = "Our infrastructure is completely unbreakable! Do not worry.";
      const target = {
        quotedSpan: 'unbreakable',
        spanStart: 33,
        spanEnd: 44,
      };
      const result = applyCleanReplacement(original, target, 'highly resilient');
      expect(result.success).toBe(true);
      expect(result.newContent).toBe("Our infrastructure is completely highly resilient! Do not worry.");
      expect(result.newContent).not.toContain('resilient !');
    });

    it('prevents duplicate adjacent words and fused tokens (e.g. outcomesoutcomes, engineerengineered)', () => {
      // 1. Boundary word duplication prevention
      const text1 = "We engineered guaranteed results for our clients.";
      const target1 = {
        quotedSpan: 'guaranteed results',
        spanStart: 14,
        spanEnd: 32,
      };
      // Suppose replacement started with "engineered measurable outcomes"
      const result1 = applyCleanReplacement(text1, target1, 'engineered measurable outcomes');
      expect(result1.success).toBe(true);
      expect(result1.newContent).not.toContain('engineered engineered');
      expect(result1.newContent).toContain('We engineered measurable outcomes for our clients.');

      // 2. Trailing duplicate word prevention
      const text2 = "We deliver measurable outcomes to every team.";
      const target2 = {
        quotedSpan: 'measurable outcomes',
        spanStart: 11,
        spanEnd: 30,
      };
      const result2 = applyCleanReplacement(text2, target2, 'measurable outcomes');
      expect(result2.success).toBe(true);
      expect(result2.newContent).not.toContain('outcomesoutcomes');
      expect(result2.newContent).not.toContain('outcomes outcomes');

      // 3. Fused duplicate word removal
      const text3 = "We deliver engineerengineered platforms with outcomesoutcomes.";
      const target3 = {
        quotedSpan: 'platforms',
        spanStart: 31,
        spanEnd: 40,
      };
      const result3 = applyCleanReplacement(text3, target3, 'systems');
      expect(result3.newContent).not.toContain('engineerengineered');
      expect(result3.newContent).toContain('engineered');
      expect(result3.newContent).not.toContain('outcomesoutcomes');
      expect(result3.newContent).toContain('outcomes');
    });

    it('handles adjacent findings in the same paragraph without offset corruption', () => {
      let draft = "Our revolutionary technology delivers unbreakable protection.";
      const findings = runDeterministicRules({
        content: draft,
        terms: SEED_TERMINOLOGY,
        clauses: SEED_CLAUSES,
      });

      expect(findings.length).toBe(2);
      const revFinding = findings.find((f) => f.quotedSpan === 'revolutionary')!;
      const unbFinding = findings.find((f) => f.quotedSpan === 'unbreakable')!;

      // Apply first replacement
      const step1 = applyCleanReplacement(draft, revFinding, revFinding.suggestedRewrite!);
      expect(step1.success).toBe(true);
      draft = step1.newContent!;
      expect(draft).toContain('next-generation technology');

      // Re-run rules on updated draft
      const recheckedFindings = runDeterministicRules({
        content: draft,
        terms: SEED_TERMINOLOGY,
        clauses: SEED_CLAUSES,
      });
      const remainingUnbreakable = recheckedFindings.find((f) => f.quotedSpan === 'unbreakable')!;
      expect(remainingUnbreakable).toBeDefined();

      // Apply second replacement
      const step2 = applyCleanReplacement(draft, remainingUnbreakable, remainingUnbreakable.suggestedRewrite!);
      expect(step2.success).toBe(true);
      expect(step2.newContent).toBe("Our next-generation technology delivers highly resilient protection.");
    });
  });

  describe('End-to-End Workflow: Accept Suggestion & Re-Review Pipeline', () => {
    const fullDraft =
      "Our application is the world's fastest platform and guarantees 100% security for every user.\n\n" +
      "Our revolutionary technology delivers unbreakable protection and the best-in-class performance available in the market.\n\n" +
      "We promise guaranteed results to every customer.";

    it('processes multiple findings sequentially, creates valid versions, re-reviews draft, and gates resolution', async () => {
      // 1. Create initial submission (Version 1)
      const createReq = new NextRequest('http://localhost:3000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Accept Suggestion Test',
          content: fullDraft,
          channel: 'blog',
          audience: 'developers',
        }),
      });

      const createRes = await createSubmissionHandler(createReq);
      expect(createRes.status).toBe(200);
      const { submissionId } = await createRes.json();

      // 2. Fetch V1 detail
      const v1Res = await getSubmissionDetailHandler(new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`), {
        params: { id: submissionId },
      });
      const v1Data = await v1Res.json();
      expect(v1Data.versions).toHaveLength(1);
      const v1Findings: Finding[] = v1Data.versions[0].findings;

      // Must find violations
      expect(v1Findings.length).toBeGreaterThanOrEqual(5);
      const openV1 = v1Findings.filter((f) => f.status === 'open');
      const resolvedV1 = v1Findings.filter((f) => f.status !== 'open');
      expect(openV1.length).toBe(v1Findings.length);
      expect(resolvedV1.length).toBe(0);

      // Verify no two findings in V1 overlap in character offsets
      for (let i = 0; i < v1Findings.length; i++) {
        for (let j = i + 1; j < v1Findings.length; j++) {
          const a = v1Findings[i];
          const b = v1Findings[j];
          if (a.spanStart !== undefined && a.spanEnd !== undefined && b.spanStart !== undefined && b.spanEnd !== undefined) {
            const overlap = Math.max(a.spanStart, b.spanStart) < Math.min(a.spanEnd, b.spanEnd);
            expect(overlap).toBe(false);
          }
        }
      }

      // 3. Accept First Suggestion ("fastest" -> "ultra-low latency")
      const fastestFinding = v1Findings.find((f) => f.quotedSpan.toLowerCase() === 'fastest')!;
      expect(fastestFinding).toBeDefined();

      const accept1Req = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId: fastestFinding.id,
          action: 'accept',
        }),
      });
      const accept1Res = await handleAction(accept1Req, { params: { id: submissionId } });
      expect(accept1Res.status).toBe(200);

      // 4. Inspect Version 2
      const v2Res = await getSubmissionDetailHandler(new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`), {
        params: { id: submissionId },
      });
      const v2Data = await v2Res.json();
      expect(v2Data.versions).toHaveLength(2);
      const v2 = v2Data.versions[1];
      expect(v2.versionNumber).toBe(2);
      expect(v2.content).toContain('ultra-low latency');
      expect(v2.content).not.toContain('fastest');

      // Check V2 findings: only the genuinely fixed finding should be resolved
      const v2Findings: Finding[] = v2.findings;
      const v2Resolved = v2Findings.filter((f) => f.status !== 'open');
      const v2Open = v2Findings.filter((f) => f.status === 'open');

      expect(v2Resolved).toHaveLength(1);
      expect(v2Resolved[0].id).toBe(fastestFinding.id);
      expect(v2Resolved[0].status).toBe('accepted');
      expect(v2Open.length).toBe(v1Findings.length - 1);

      // Unrelated findings (like 100% security, unbreakable) MUST remain OPEN
      const secFindingInV2 = v2Open.find((f) => f.quotedSpan.toLowerCase().includes('100% security'));
      expect(secFindingInV2).toBeDefined();
      expect(secFindingInV2?.status).toBe('open');

      // 5. Accept Second Suggestion ("100% security" -> "defense-in-depth security")
      const accept2Req = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId: secFindingInV2!.id,
          action: 'accept',
        }),
      });
      const accept2Res = await handleAction(accept2Req, { params: { id: submissionId } });
      expect(accept2Res.status).toBe(200);

      // 6. Inspect Version 3
      const v3Res = await getSubmissionDetailHandler(new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`), {
        params: { id: submissionId },
      });
      const v3Data = await v3Res.json();
      expect(v3Data.versions).toHaveLength(3);
      const v3 = v3Data.versions[2];
      expect(v3.versionNumber).toBe(3);
      expect(v3.content).toContain('defense-in-depth security');
      expect(v3.content).not.toContain('100% security');

      // Verify V3 has 2 resolved findings and remaining open
      const v3Findings: Finding[] = v3.findings;
      const v3Resolved = v3Findings.filter((f) => f.status !== 'open');
      expect(v3Resolved).toHaveLength(2);
      expect(v3Resolved.some((f) => f.id === fastestFinding.id)).toBe(true);
      expect(v3Resolved.some((f) => f.id === secFindingInV2!.id)).toBe(true);

      // Verify sentence 1 is now completely clean and grammatically sound
      expect(v3.content).toContain(
        "Our application is the world's ultra-low latency platform and guarantees defense-in-depth security for every user."
      );
    });

    it('rejects accept action when no safe suggestion exists and requests human edit', async () => {
      // Create submission
      const createReq = new NextRequest('http://localhost:3000/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'No Suggestion Test',
          content: 'Our application is the fastest in the cloud.',
          channel: 'blog',
          audience: 'developers',
        }),
      });
      const createRes = await createSubmissionHandler(createReq);
      const { submissionId } = await createRes.json();

      // Intentionally clear suggestedRewrite on a finding in mockStore
      const versions = mockStore.getVersionsBySubmissionId(submissionId);
      expect(versions[0].findings.length).toBeGreaterThanOrEqual(1);
      const finding = versions[0].findings[0];
      mockStore.updateFinding(finding.id, { suggestedRewrite: undefined }, creatorUser.id, versions[0].id);

      // Attempt to Accept without a valid suggestion
      const acceptReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId: finding.id,
          action: 'accept',
        }),
      });
      const acceptRes = await handleAction(acceptReq, { params: { id: submissionId } });
      expect(acceptRes.status).toBe(400);

      const data = await acceptRes.json();
      expect(data.error).toContain('safe automatic replacement is not available');
    });
  });
});
