import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '../lib/supabase/mock-store';
import { hasPermission } from '../lib/auth';
import { CRANBERRY_ORG, SEED_USERS } from '../lib/seed/cranberry-labs-data';
import { Submission, Finding } from '../types';

describe('Phase 6: Human Approval Workflow & Server RBAC', () => {
  beforeEach(() => {
    mockStore.resetToSeed();
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

  it('locks submission when approval is granted', () => {
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
});
