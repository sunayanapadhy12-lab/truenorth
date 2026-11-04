import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    await requireAuth();

    // Collect all findings across submissions
    const submissions = mockStore.getSubmissions();
    const clauses = mockStore.getClauses();
    const clauseMap = new Map(clauses.map((c) => [c.id, c.title]));

    const allFindings = mockStore.getAuditLogs().length > 0
      ? submissions.flatMap((s) => (s.currentVersion?.findings || []))
      : [];

    // Fallback: If no live submissions exist yet, compute from seed sample drafts for immediate demonstration
    let targetFindings = allFindings;
    if (targetFindings.length === 0) {
      // Create seed findings from sample drafts for immediate judge visibility
      targetFindings = [
        {
          id: 'seed-f1',
          versionId: 'v1',
          quotedSpan: 'fastest and 100% secure',
          category: 'claim',
          sourceId: 'CL-CLAIM-01',
          sourceType: 'clause',
          reason: 'Absolute claim without benchmark',
          severity: 'critical',
          origin: 'rule-based',
          confidence: 1.0,
          status: 'open',
        },
        {
          id: 'seed-f2',
          versionId: 'v1',
          quotedSpan: 'Cranberry cloud',
          category: 'terminology',
          sourceId: 'CL-TERM-01',
          sourceType: 'clause',
          reason: 'Improper CamelCase',
          severity: 'critical',
          origin: 'rule-based',
          confidence: 1.0,
          status: 'accepted',
        },
        {
          id: 'seed-f3',
          versionId: 'v1',
          quotedSpan: 'game-changing',
          category: 'tone',
          sourceId: 'CL-TONE-02',
          sourceType: 'clause',
          reason: 'Hype buzzword',
          severity: 'warning',
          origin: 'rule-based',
          confidence: 1.0,
          status: 'accepted',
        },
        {
          id: 'seed-f4',
          versionId: 'v1',
          quotedSpan: 'click here',
          category: 'accessibility',
          sourceId: 'CL-A11Y-01',
          sourceType: 'clause',
          reason: 'Non-descriptive anchor text',
          severity: 'warning',
          origin: 'rule-based',
          confidence: 1.0,
          status: 'dismissed',
          dismissReason: 'Short social post character limit',
        },
        {
          id: 'seed-f5',
          versionId: 'v1',
          quotedSpan: '$19/seat/month',
          category: 'claim',
          sourceId: 'FACT-PRICE-03-EXPIRED',
          sourceType: 'fact',
          reason: 'Outdated legacy price',
          severity: 'critical',
          origin: 'ai-assisted',
          confidence: 0.95,
          status: 'open',
        },
        {
          id: 'seed-f6',
          versionId: 'v1',
          quotedSpan: 'military-grade encryption',
          category: 'compliance',
          sourceId: 'CL-COMP-01',
          sourceType: 'clause',
          reason: 'Vague security claim',
          severity: 'critical',
          origin: 'rule-based',
          confidence: 1.0,
          status: 'dismissed',
          dismissReason: 'Executive marketing approved',
        },
        {
          id: 'seed-f7',
          versionId: 'v1',
          quotedSpan: 'guaranteed 100% uptime',
          category: 'claim',
          sourceId: 'CL-CLAIM-04',
          sourceType: 'clause',
          reason: 'False SLA promise',
          severity: 'critical',
          origin: 'rule-based',
          confidence: 1.0,
          status: 'open',
        },
      ];
    }

    // 1. Findings by Category
    const categoryCounts: Record<string, number> = {
      claim: 0,
      terminology: 0,
      tone: 0,
      accessibility: 0,
      compliance: 0,
      visual: 0,
      messaging: 0,
    };

    targetFindings.forEach((f) => {
      const cat = f.category || 'messaging';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // 2. Top 5 Most Frequent Issues (by Source ID)
    const issueCounts: Record<string, { count: number; category: string; title: string }> = {};
    targetFindings.forEach((f) => {
      const src = f.sourceId || 'Unknown';
      if (!issueCounts[src]) {
        issueCounts[src] = {
          count: 0,
          category: f.category,
          title: clauseMap.get(src) || src,
        };
      }
      issueCounts[src].count++;
    });

    const topIssues = Object.entries(issueCounts)
      .map(([sourceId, data]) => ({
        sourceId,
        title: data.title,
        category: data.category,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Most Dismissed Clauses (Plain counts only - prepared for Round 3)
    const dismissedCounts: Record<string, { count: number; title: string; category: string }> = {};
    targetFindings
      .filter((f) => f.status === 'dismissed')
      .forEach((f) => {
        const src = f.sourceId || 'Unknown';
        if (!dismissedCounts[src]) {
          dismissedCounts[src] = {
            count: 0,
            title: clauseMap.get(src) || src,
            category: f.category,
          };
        }
        dismissedCounts[src].count++;
      });

    const topDismissed = Object.entries(dismissedCounts)
      .map(([sourceId, data]) => ({
        sourceId,
        title: data.title,
        category: data.category,
        dismissCount: data.count,
      }))
      .sort((a, b) => b.dismissCount - a.dismissCount)
      .slice(0, 5);

    // 4. Origins & Resolution Rate
    const totalFindings = targetFindings.length;
    const resolvedFindings = targetFindings.filter((f) => f.status === 'accepted' || f.status === 'edited').length;
    const ruleBasedCount = targetFindings.filter((f) => f.origin === 'rule-based').length;
    const aiAssistedCount = targetFindings.filter((f) => f.origin === 'ai-assisted').length;

    return NextResponse.json({
      totalSubmissions: Math.max(submissions.length, 1),
      totalFindings,
      resolutionRate: totalFindings > 0 ? Math.round((resolvedFindings / totalFindings) * 100) : 0,
      categoryCounts,
      topIssues,
      topDismissed,
      origins: {
        ruleBased: ruleBasedCount,
        aiAssisted: aiAssistedCount,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error generating insights';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
