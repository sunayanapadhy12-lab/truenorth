import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '../lib/supabase/mock-store';
import { hasPermission } from '../lib/auth';

describe('Phase 1: Seed Store & RBAC Permissions', () => {
  beforeEach(() => {
    mockStore.resetToSeed();
  });

  it('initializes Cranberry Labs with all required seed records', () => {
    const org = mockStore.getOrganization();
    expect(org.name).toBe('Cranberry Labs');

    const users = mockStore.getUsers();
    expect(users).toHaveLength(4);
    expect(users.map((u) => u.role)).toEqual(
      expect.arrayContaining(['admin', 'creator', 'manager', 'reviewer'])
    );

    const clauses = mockStore.getClauses();
    expect(clauses.length).toBeGreaterThanOrEqual(25);

    const terms = mockStore.getTerminology();
    expect(terms.length).toBeGreaterThanOrEqual(15);

    const facts = mockStore.getFacts();
    expect(facts.length).toBeGreaterThanOrEqual(12);

    const expiredFacts = facts.filter((f) => f.expiryDate !== null && f.expiryDate !== undefined);
    expect(expiredFacts.length).toBeGreaterThanOrEqual(2);

    const palette = mockStore.getPalette();
    expect(palette.length).toBeGreaterThanOrEqual(6);
  });

  it('enforces RBAC permissions accurately', () => {
    // Only Admin can edit knowledge
    expect(hasPermission('admin', 'edit_knowledge')).toBe(true);
    expect(hasPermission('creator', 'edit_knowledge')).toBe(false);
    expect(hasPermission('manager', 'edit_knowledge')).toBe(false);
    expect(hasPermission('reviewer', 'edit_knowledge')).toBe(false);

    // Only Reviewer (Legal) can approve claim-sensitive content
    expect(hasPermission('reviewer', 'approve_claims')).toBe(true);
    expect(hasPermission('manager', 'approve_claims')).toBe(false);
    expect(hasPermission('creator', 'approve_claims')).toBe(false);
    expect(hasPermission('admin', 'approve_claims')).toBe(false);

    // Manager and Reviewer can approve standard content
    expect(hasPermission('manager', 'approve_standard')).toBe(true);
    expect(hasPermission('reviewer', 'approve_standard')).toBe(true);
    expect(hasPermission('creator', 'approve_standard')).toBe(false);
  });

  it('enforces daily AI cap and session rate limits', () => {
    const session = 'test-session-1';
    // Test 5 allowed calls
    for (let i = 0; i < 5; i++) {
      const res = mockStore.checkAndIncrementAiCall(session, 10, 5);
      expect(res.allowed).toBe(true);
    }

    // 6th call hits session rate limit of 5 calls/min
    const blockedRes = mockStore.checkAndIncrementAiCall(session, 10, 5);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.reason).toContain('Session rate limit exceeded');
  });
});
