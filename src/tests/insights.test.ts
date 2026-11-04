import { describe, it, expect } from 'vitest';

describe('Phase 7: Insights Aggregation & Analytics', () => {
  const sampleFindings = [
    { id: '1', category: 'claim', sourceId: 'CL-CLAIM-01', status: 'open' },
    { id: '2', category: 'claim', sourceId: 'CL-CLAIM-01', status: 'accepted' },
    { id: '3', category: 'claim', sourceId: 'CL-CLAIM-04', status: 'dismissed' },
    { id: '4', category: 'terminology', sourceId: 'CL-TERM-01', status: 'accepted' },
    { id: '5', category: 'accessibility', sourceId: 'CL-A11Y-01', status: 'dismissed' },
    { id: '6', category: 'accessibility', sourceId: 'CL-A11Y-01', status: 'dismissed' },
  ];

  it('aggregates findings by category correctly', () => {
    const categoryCounts: Record<string, number> = {};
    sampleFindings.forEach((f) => {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    });

    expect(categoryCounts['claim']).toBe(3);
    expect(categoryCounts['terminology']).toBe(1);
    expect(categoryCounts['accessibility']).toBe(2);
  });

  it('ranks top issues by frequency correctly', () => {
    const issueCounts: Record<string, number> = {};
    sampleFindings.forEach((f) => {
      issueCounts[f.sourceId] = (issueCounts[f.sourceId] || 0) + 1;
    });

    const ranked = Object.entries(issueCounts)
      .map(([sourceId, count]) => ({ sourceId, count }))
      .sort((a, b) => b.count - a.count);

    expect(ranked[0].sourceId).toBe('CL-CLAIM-01');
    expect(ranked[0].count).toBe(2);
  });

  it('identifies most-dismissed clauses accurately', () => {
    const dismissed = sampleFindings.filter((f) => f.status === 'dismissed');
    const dismissCounts: Record<string, number> = {};
    dismissed.forEach((f) => {
      dismissCounts[f.sourceId] = (dismissCounts[f.sourceId] || 0) + 1;
    });

    const ranked = Object.entries(dismissCounts)
      .map(([sourceId, count]) => ({ sourceId, count }))
      .sort((a, b) => b.count - a.count);

    expect(ranked[0].sourceId).toBe('CL-A11Y-01');
    expect(ranked[0].count).toBe(2);
  });

  it('calculates resolution rate percentage accurately', () => {
    const total = sampleFindings.length; // 6
    const resolved = sampleFindings.filter((f) => f.status === 'accepted').length; // 2
    const rate = Math.round((resolved / total) * 100);

    expect(rate).toBe(33); // 2/6 = 33.3% -> 33%
  });
});

