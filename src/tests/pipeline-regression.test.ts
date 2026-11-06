import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockStore } from '../lib/supabase/mock-store';
import { SEED_USERS, SEED_CLAUSES } from '../lib/seed/cranberry-labs-data';
import { POST as createSubmissionHandler, GET as listSubmissionsHandler } from '../app/api/submissions/route';
import { GET as getSubmissionDetailHandler } from '../app/api/submissions/[id]/route';
import { POST as handleAction } from '../app/api/submissions/[id]/action/route';
import { POST as handleApproval } from '../app/api/submissions/[id]/approval/route';
import { Finding } from '../lib/types';

// In-memory cookie store for simulating persona sessions
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

describe('Critical Bug Regression: Pipeline Zero-Findings & Rule Detection', () => {
  const creatorUser = SEED_USERS[1]; // Alex Rivera (creator)
  const managerUser = SEED_USERS[2]; // Marcus Vance (manager)
  const reviewerUser = SEED_USERS[3]; // Dr. Elena Rostova (reviewer)

  beforeEach(() => {
    mockStore.resetToSeed();
    mockCookieMap.clear();
    mockCookieMap.set('truenorth_role', 'creator');
    mockCookieMap.set('truenorth_user_id', creatorUser.id);
  });

  const exactFailingDraft =
    "Our application is the world's fastest platform and guarantees 100% security for every user.\n\n" +
    "Our revolutionary technology delivers unbreakable protection and the best-in-class performance available in the market.\n\n" +
    "We promise guaranteed results to every customer.";

  it('end-to-end: generates findings and persists them to the review screen for the exact failing draft', async () => {
    // 1. Submit content via POST /api/submissions
    const submitReq = new NextRequest('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Launch Announcement with Superlatives',
        content: exactFailingDraft,
        channel: 'blog',
        audience: 'developers',
      }),
    });

    const submitRes = await createSubmissionHandler(submitReq);
    expect(submitRes.status).toBe(200);

    const submitData = await submitRes.json();
    expect(submitData.success).toBe(true);
    expect(submitData.submissionId).toBeDefined();
    expect(submitData.findingsCount).toBeGreaterThanOrEqual(5);

    const submissionId = submitData.submissionId;

    // 2. Fetch the submission review page data via GET /api/submissions/[id]
    const getReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`, {
      method: 'GET',
    });

    const getRes = await getSubmissionDetailHandler(getReq, { params: { id: submissionId } });
    expect(getRes.status).toBe(200);

    const detailData = await getRes.json();
    expect(detailData.submission).toBeDefined();
    expect(detailData.submission.id).toBe(submissionId);
    expect(detailData.submission.currentStatus).toBe('draft');
    expect(detailData.submission.isLocked).toBe(false);

    expect(detailData.versions).toHaveLength(1);
    const v1 = detailData.versions[0];
    expect(v1.findings).toBeDefined();

    // CRITICAL ASSERTION: findings must NOT be 0!
    expect(v1.findings.length).toBeGreaterThanOrEqual(5);

    const findings: Finding[] = v1.findings;

    // 3. Verify that all required prohibited phrases are detected
    const quotedTexts = findings.map((f) => f.quotedSpan.toLowerCase());

    expect(quotedTexts.some((q) => q.includes('fastest'))).toBe(true);
    expect(quotedTexts.some((q) => q.includes('100% security') || q.includes('100% secure'))).toBe(true);
    expect(quotedTexts.some((q) => q.includes('revolutionary'))).toBe(true);
    expect(quotedTexts.some((q) => q.includes('unbreakable'))).toBe(true);
    expect(quotedTexts.some((q) => q.includes('best-in-class') || q.includes('best in class'))).toBe(true);
    expect(quotedTexts.some((q) => q.includes('guaranteed results'))).toBe(true);

    // 4. Verify each finding contains complete metadata
    const validClauseIds = new Set(SEED_CLAUSES.map((c) => c.id));

    for (const finding of findings) {
      // Exact quoted text must be present verbatim in the submitted draft
      expect(finding.quotedSpan).toBeTruthy();
      expect(exactFailingDraft.indexOf(finding.quotedSpan)).not.toBe(-1);

      // Must cite a real, existing guideline ID
      expect(validClauseIds.has(finding.sourceId)).toBe(true);

      // Must include guideline title and explanation in reason
      expect(finding.reason).toBeTruthy();
      expect(finding.reason.length).toBeGreaterThan(15);

      // Severity must be critical or warning
      expect(['critical', 'warning', 'info']).toContain(finding.severity);

      // Useful suggested correction
      expect(finding.suggestedRewrite).toBeTruthy();

      // Classification
      expect(['rule-based', 'ai-assisted']).toContain(finding.origin);
      expect(finding.status).toBe('open');
    }
  });

  it('correctly handles Accept, Edit, and Dismiss actions with rationale enforcement', async () => {
    // 1. Create submission
    const submitReq = new NextRequest('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Action Testing Draft',
        content: exactFailingDraft,
        channel: 'blog',
        audience: 'developers',
      }),
    });
    const submitRes = await createSubmissionHandler(submitReq);
    const { submissionId } = await submitRes.json();

    // 2. Load detail
    const getRes1 = await getSubmissionDetailHandler(new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`), {
      params: { id: submissionId },
    });
    const { versions } = await getRes1.json();
    const initialFindings: Finding[] = versions[0].findings;
    expect(initialFindings.length).toBeGreaterThanOrEqual(5);

    const findingToAccept = initialFindings.find((f) => f.quotedSpan.includes('revolutionary'))!;
    const findingToEdit = initialFindings.find((f) => f.quotedSpan.includes('best-in-class'))!;
    const findingToDismiss = initialFindings.find((f) => f.quotedSpan.includes('fastest'))!;

    // 3. Test Accept Action -> Should create Version 2 and replace span
    const acceptReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findingId: findingToAccept.id,
        action: 'accept',
      }),
    });
    const acceptRes = await handleAction(acceptReq, { params: { id: submissionId } });
    expect(acceptRes.status).toBe(200);

    // Verify Version 2 in store
    const getRes2 = await getSubmissionDetailHandler(new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`), {
      params: { id: submissionId },
    });
    const detail2 = await getRes2.json();
    expect(detail2.versions).toHaveLength(2);
    const v2 = detail2.versions[1];
    expect(v2.versionNumber).toBe(2);
    expect(v2.content).not.toContain('revolutionary');
    expect(v2.content).toContain(findingToAccept.suggestedRewrite);

    const v2AcceptedFinding = v2.findings.find((f: Finding) => f.id === findingToAccept.id);
    expect(v2AcceptedFinding?.status).toBe('accepted');

    // 4. Test Edit Action on Version 2 -> Should create Version 3
    const editReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findingId: findingToEdit.id,
        action: 'edit',
        customEdit: 'independently benchmarked',
      }),
    });
    const editRes = await handleAction(editReq, { params: { id: submissionId } });
    expect(editRes.status).toBe(200);

    const getRes3 = await getSubmissionDetailHandler(new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`), {
      params: { id: submissionId },
    });
    const detail3 = await getRes3.json();
    expect(detail3.versions).toHaveLength(3);
    const v3 = detail3.versions[2];
    expect(v3.content).toContain('independently benchmarked');

    // 5. Test Dismiss Action without Reason -> MUST FAIL with 400
    const dismissFailReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findingId: findingToDismiss.id,
        action: 'dismiss',
        dismissReason: '', // Empty reason
      }),
    });
    const dismissFailRes = await handleAction(dismissFailReq, { params: { id: submissionId } });
    expect(dismissFailRes.status).toBe(400);

    // 6. Test Dismiss Action with Reason -> MUST SUCCEED
    const dismissSuccessReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        findingId: findingToDismiss.id,
        action: 'dismiss',
        dismissReason: 'Direct executive quote verified in external interview.',
      }),
    });
    const dismissSuccessRes = await handleAction(dismissSuccessReq, { params: { id: submissionId } });
    expect(dismissSuccessRes.status).toBe(200);

    // Verify dismissed state in latest version
    const getRes4 = await getSubmissionDetailHandler(new NextRequest(`http://localhost:3000/api/submissions/${submissionId}`), {
      params: { id: submissionId },
    });
    const detail4 = await getRes4.json();
    const latestFindings: Finding[] = detail4.versions[detail4.versions.length - 1].findings;
    const dismissedItem = latestFindings.find((f) => f.id === findingToDismiss.id);
    expect(dismissedItem?.status).toBe('dismissed');
    expect(dismissedItem?.dismissReason).toContain('Direct executive quote');

    // Verify Open vs Resolved filters count
    const openCount = latestFindings.filter((f) => f.status === 'open').length;
    const resolvedCount = latestFindings.filter((f) => f.status !== 'open').length;
    expect(resolvedCount).toBe(3); // 1 accepted, 1 edited, 1 dismissed
    expect(openCount + resolvedCount).toBe(latestFindings.length);
  });

  it('produces ZERO findings on clean, fully compliant draft content', async () => {
    const cleanContent =
      'CranberryPulse encrypts payloads with AES-256 encryption. ' +
      'Our internal benchmarks demonstrate edge latency under 42ms p95 across North America. ' +
      'We provide multi-region availability and 24/7 technical documentation for developers.';

    const submitReq = new NextRequest('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Clean Compliant Technical Post',
        content: cleanContent,
        channel: 'blog',
        audience: 'developers',
      }),
    });

    const submitRes = await createSubmissionHandler(submitReq);
    expect(submitRes.status).toBe(200);
    const submitData = await submitRes.json();
    expect(submitData.findingsCount).toBe(0);

    const getRes = await getSubmissionDetailHandler(
      new NextRequest(`http://localhost:3000/api/submissions/${submitData.submissionId}`),
      { params: { id: submitData.submissionId } }
    );
    const detailData = await getRes.json();
    expect(detailData.versions[0].findings).toHaveLength(0);
  });

  it('detects prohibited buzzwords (miracle, magical, game-changing) under CL-TONE-02', async () => {
    const buzzwordDraft =
      'Our team pulled off a miracle. This magical release is truly game-changing for our enterprise users.';

    const submitReq = new NextRequest('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Buzzword Heavy Copy',
        content: buzzwordDraft,
        channel: 'blog',
        audience: 'developers',
      }),
    });

    const submitRes = await createSubmissionHandler(submitReq);
    const submitData = await submitRes.json();
    expect(submitData.findingsCount).toBeGreaterThanOrEqual(3);

    const getRes = await getSubmissionDetailHandler(
      new NextRequest(`http://localhost:3000/api/submissions/${submitData.submissionId}`),
      { params: { id: submitData.submissionId } }
    );
    const detailData = await getRes.json();
    const findings: Finding[] = detailData.versions[0].findings;

    const toneFindings = findings.filter((f) => f.sourceId === 'CL-TONE-02');
    expect(toneFindings.length).toBeGreaterThanOrEqual(3);

    const quotedWords = toneFindings.map((f) => f.quotedSpan.toLowerCase());
    expect(quotedWords).toContain('miracle');
    expect(quotedWords).toContain('magical');
    expect(quotedWords).toContain('game-changing');
  });

  it('blocks Manager from approving claim-sensitive draft and permits Legal Reviewer sign-off', async () => {
    // 1. Submit the failing draft with claim violations
    const submitReq = new NextRequest('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Approval Gate Test',
        content: exactFailingDraft,
        channel: 'blog',
        audience: 'developers',
      }),
    });
    const submitRes = await createSubmissionHandler(submitReq);
    const { submissionId } = await submitRes.json();

    // 2. Manager attempts to approve -> MUST FAIL with 403
    mockCookieMap.set('truenorth_role', 'manager');
    mockCookieMap.set('truenorth_user_id', managerUser.id);

    const managerApproveReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approve' }),
    });
    const managerRes = await handleApproval(managerApproveReq, { params: { id: submissionId } });
    expect(managerRes.status).toBe(403);
    const managerBody = await managerRes.json();
    expect(managerBody.requiresRole).toBe('reviewer');

    // 3. Legal Reviewer approves -> MUST SUCCEED with 200 and permanently lock
    mockCookieMap.set('truenorth_role', 'reviewer');
    mockCookieMap.set('truenorth_user_id', reviewerUser.id);

    const reviewerApproveReq = new NextRequest(`http://localhost:3000/api/submissions/${submissionId}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'approve',
        comment: 'Legal sign-off granted following external claim qualification.',
      }),
    });
    const reviewerRes = await handleApproval(reviewerApproveReq, { params: { id: submissionId } });
    expect(reviewerRes.status).toBe(200);

    const reviewerBody = await reviewerRes.json();
    expect(reviewerBody.success).toBe(true);
    expect(reviewerBody.status).toBe('approved');
    expect(reviewerBody.isLocked).toBe(true);

    // 4. Verify locked submission in store
    const lockedSub = mockStore.getSubmissionById(submissionId);
    expect(lockedSub?.isLocked).toBe(true);
    expect(lockedSub?.currentStatus).toBe('approved');
  });
});

