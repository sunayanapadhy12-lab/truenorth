import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mockStore } from '../lib/supabase/mock-store';
import { hasPermission } from '../lib/auth';
import { CRANBERRY_ORG, SEED_USERS } from '../lib/seed/cranberry-labs-data';
import { Submission, Finding } from '../lib/types';
import { POST as handleApproval } from '../app/api/submissions/[id]/approval/route';
import { POST as handleAction } from '../app/api/submissions/[id]/action/route';

// In-memory cookie store for direct route handler testing
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

describe('Phase 6: Human Approval Workflow & Server RBAC', () => {
  beforeEach(() => {
    mockStore.resetToSeed();
    mockCookieMap.clear();
  });

  const creatorUser = SEED_USERS[1]; // Alex Rivera (creator)
  const managerUser = SEED_USERS[2]; // Marcus Vance (manager)
  const reviewerUser = SEED_USERS[3]; // Dr. Elena Rostova (reviewer)

  it('enforces that claim/fact-sensitive approvals require the Reviewer role', () => {
    // Manager cannot approve claims
    expect(hasPermission(managerUser.role, 'approve_claims')).toBe(false);
    expect(hasPermission(creatorUser.role, 'approve_claims')).toBe(false);

    // Reviewer CAN approve claims
    expect(hasPermission(reviewerUser.role, 'approve_claims')).toBe(true);
  });

  it('allows Manager or Reviewer to approve standard content', () => {
    expect(hasPermission(managerUser.role, 'approve_standard')).toBe(true);
    expect(hasPermission(reviewerUser.role, 'approve_standard')).toBe(true);
    expect(hasPermission(creatorUser.role, 'approve_standard')).toBe(false);
  });

  it('locks submission when approval is granted in mockStore', () => {
    const submissionId = 'sub-test-lock';
    const sub: Submission = {
      id: submissionId,
      organizationId: CRANBERRY_ORG.id,
      creatorId: creatorUser.id,
      title: 'Test Approval Submission',
      channel: 'blog',
      audience: 'developers',
      currentStatus: 'in_review',
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStore.createSubmission(sub, 'Approved copy ready for locking.');

    // Simulate approval
    const updated = mockStore.updateSubmissionStatus(submissionId, 'approved', true);
    expect(updated?.currentStatus).toBe('approved');
    expect(updated?.isLocked).toBe(true);

    // Locked check in getSubmissionById
    const fetched = mockStore.getSubmissionById(submissionId);
    expect(fetched?.isLocked).toBe(true);
  });

  it('records audit events for comments, approvals, and decisions', () => {
    const submissionId = 'sub-test-audit';
    mockStore.logEvent('approval.granted', 'submission', submissionId, reviewerUser.id, {
      decision: 'approve',
      reviewerRole: reviewerUser.role,
    });

    const logs = mockStore.getAuditLogs(10);
    const approvalLog = logs.find((l) => l.action === 'approval.granted');

    expect(approvalLog).toBeDefined();
    expect(approvalLog?.userId).toBe(reviewerUser.id);
    expect(approvalLog?.userRole).toBe('reviewer');
    expect(approvalLog?.resourceId).toBe(submissionId);
  });

  it('adds and retrieves threaded comments with author role metadata', () => {
    const submissionId = 'sub-test-comments';
    mockStore.addComment({
      id: 'comm-1',
      submissionId,
      authorId: managerUser.id,
      authorName: managerUser.name,
      authorRole: managerUser.role,
      body: 'Please substantiate the 42ms latency figure before publication.',
      createdAt: new Date().toISOString(),
    });

    const comments = mockStore.getComments(submissionId);
    expect(comments).toHaveLength(1);
    expect(comments[0].authorRole).toBe('manager');
    expect(comments[0].body).toContain('42ms latency');
  });

  // Direct Route Handler Invocations with Cookies & Request Bodies
  describe('Direct API Route Handler Security & RBAC Enforcement', () => {
    it('rejects Manager approval with HTTP 403 on a claim-flagged submission', async () => {
      const submissionId = 'sub-claim-violation-route-test';
      const claimSub: Submission = {
        id: submissionId,
        organizationId: CRANBERRY_ORG.id,
        creatorId: creatorUser.id,
        title: 'Q4 Press Release with Unverified SLA Claims',
        channel: 'press_release',
        audience: 'general_public',
        currentStatus: 'in_review',
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { version } = mockStore.createSubmission(claimSub, 'Cranberry Cloud guarantees 99.999% uptime.');
      const claimFinding: Finding = {
        id: 'finding-claim-route-1',
        versionId: version.id,
        quotedSpan: '99.999% uptime',
        spanStart: 27,
        spanEnd: 41,
        category: 'claim',
        severity: 'critical',
        sourceType: 'fact',
        sourceId: 'FACT-01',
        reason: 'FACT-01: SLA guarantee is 99.95%, not 99.999%.',
        suggestedRewrite: '99.95% uptime',
        status: 'open',
        origin: 'ai-assisted',
        confidence: 0.99,
      };
      mockStore.setFindingsForVersion(version.id, [claimFinding]);

      // Set cookie as Manager
      mockCookieMap.set('truenorth_role', 'manager');
      mockCookieMap.set('truenorth_user_id', managerUser.id);

      const managerReq = new NextRequest(
        `http://localhost:3000/api/submissions/${submissionId}/approval`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'approve' }),
        }
      );

      const response = await handleApproval(managerReq, { params: { id: submissionId } });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.requiresRole).toBe('reviewer');
      expect(body.error).toContain('Legal Reviewer role');

      // Ensure submission was NOT approved and remains unlocked in store
      const persistedSub = mockStore.getSubmissionById(submissionId);
      expect(persistedSub?.currentStatus).toBe('in_review');
      expect(persistedSub?.isLocked).toBe(false);
    });

    it('allows Reviewer approval on claim-flagged submission and locks version', async () => {
      const submissionId = 'sub-claim-reviewer-success-test';
      const claimSub: Submission = {
        id: submissionId,
        organizationId: CRANBERRY_ORG.id,
        creatorId: creatorUser.id,
        title: 'Technical Whitepaper',
        channel: 'website',
        audience: 'developers',
        currentStatus: 'in_review',
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { version } = mockStore.createSubmission(claimSub, 'Guaranteed 5ms global latency.');
      const claimFinding: Finding = {
        id: 'finding-claim-route-2',
        versionId: version.id,
        quotedSpan: '5ms global latency',
        spanStart: 11,
        spanEnd: 29,
        category: 'claim',
        severity: 'critical',
        sourceType: 'fact',
        sourceId: 'FACT-03',
        reason: 'FACT-03: Edge latency is verified under 42ms p95.',
        status: 'open',
        origin: 'rule-based',
        confidence: 0.95,
      };
      mockStore.setFindingsForVersion(version.id, [claimFinding]);

      // Set cookie as Reviewer (Dr. Elena Rostova)
      mockCookieMap.set('truenorth_role', 'reviewer');
      mockCookieMap.set('truenorth_user_id', reviewerUser.id);

      const reviewerReq = new NextRequest(
        `http://localhost:3000/api/submissions/${submissionId}/approval`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'approve',
            comment: 'Legal sign-off verified with footnote qualification.',
          }),
        }
      );

      const response = await handleApproval(reviewerReq, { params: { id: submissionId } });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.status).toBe('approved');
      expect(body.isLocked).toBe(true);

      // Store must reflect permanent lock
      const storeSub = mockStore.getSubmissionById(submissionId);
      expect(storeSub?.isLocked).toBe(true);
      expect(storeSub?.currentStatus).toBe('approved');
    });

    it('rejects edits with HTTP 403 when submission is approved and locked', async () => {
      const submissionId = 'sub-locked-edit-test';
      const sub: Submission = {
        id: submissionId,
        organizationId: CRANBERRY_ORG.id,
        creatorId: creatorUser.id,
        title: 'Published Corporate Policy',
        channel: 'blog',
        audience: 'general_public',
        currentStatus: 'approved',
        isLocked: true, // ALREADY APPROVED & LOCKED
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { version } = mockStore.createSubmission(sub, 'Approved official copy.');
      const finding: Finding = {
        id: 'finding-locked-1',
        versionId: version.id,
        quotedSpan: 'official',
        spanStart: 9,
        spanEnd: 17,
        category: 'tone',
        severity: 'info',
        sourceType: 'clause',
        sourceId: 'CL-TONE-01',
        reason: 'CL-TONE-01: Confident and direct.',
        status: 'open',
        origin: 'rule-based',
        confidence: 0.9,
      };
      mockStore.setFindingsForVersion(version.id, [finding]);

      // Set cookie as Creator (Alex Rivera)
      mockCookieMap.set('truenorth_role', 'creator');
      mockCookieMap.set('truenorth_user_id', creatorUser.id);

      // Direct action POST attempting an edit on the locked version
      const editReq = new NextRequest(
        `http://localhost:3000/api/submissions/${submissionId}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            findingId: 'finding-locked-1',
            action: 'edit',
            customEdit: 'Illicit post-approval change',
          }),
        }
      );

      const response = await handleAction(editReq, { params: { id: submissionId } });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBe('Cannot modify a locked or approved submission.');
    });

    it('rejects subsequent approvals with HTTP 403 on an already locked submission', async () => {
      const submissionId = 'sub-already-locked-approval-test';
      const sub: Submission = {
        id: submissionId,
        organizationId: CRANBERRY_ORG.id,
        creatorId: creatorUser.id,
        title: 'Already Locked Submission',
        channel: 'blog',
        audience: 'general_public',
        currentStatus: 'approved',
        isLocked: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockStore.createSubmission(sub, 'Copy already locked.');

      mockCookieMap.set('truenorth_role', 'reviewer');
      mockCookieMap.set('truenorth_user_id', reviewerUser.id);

      const reApproveReq = new NextRequest(
        `http://localhost:3000/api/submissions/${submissionId}/approval`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'approve' }),
        }
      );

      const response = await handleApproval(reApproveReq, { params: { id: submissionId } });
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBe('Submission is already approved and locked.');
    });
  });
});
