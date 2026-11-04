import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { GuidelineClause } from '@/lib/types';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('guideline_clauses')
        .select('*')
        .eq('organization_id', CRANBERRY_ORG.id)
        .order('id', { ascending: true });

      if (error) throw error;
      const mapped: GuidelineClause[] = data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        category: d.category,
        title: d.title,
        summary: d.summary,
        fullText: d.full_text,
        severity: d.severity,
        createdAt: d.created_at,
      }));
      return NextResponse.json({ clauses: mapped });
    }

    const clauses = mockStore.getClauses();
    return NextResponse.json({ clauses });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch clauses';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAuth(['admin']);
    const body = await req.json();

    const clausesToInsert: GuidelineClause[] = Array.isArray(body) ? body : [body];

    if (clausesToInsert.length === 0) {
      return NextResponse.json({ error: 'No clauses provided' }, { status: 400 });
    }

    // Save in Supabase if configured
    if (isSupabaseConfigured && supabaseServer) {
      const rows = clausesToInsert.map((c) => ({
        id: c.id,
        organization_id: CRANBERRY_ORG.id,
        category: c.category,
        title: c.title,
        summary: c.summary,
        full_text: c.fullText,
        severity: c.severity,
      }));

      const { error } = await supabaseServer.from('guideline_clauses').upsert(rows);
      if (error) throw error;
    }

    // Save in MockStore
    for (const c of clausesToInsert) {
      mockStore.addClause({
        ...c,
        organizationId: CRANBERRY_ORG.id,
        createdAt: new Date().toISOString(),
      });
    }

    mockStore.logEvent(
      clausesToInsert.length > 1 ? 'knowledge.clauses_imported' : 'knowledge.clause_created',
      'guideline_clause',
      clausesToInsert[0].id,
      adminUser.id,
      { count: clausesToInsert.length }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${clausesToInsert.length} clause(s).`,
      count: clausesToInsert.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

