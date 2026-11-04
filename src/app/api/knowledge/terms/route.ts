import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { TerminologyItem } from '@/lib/types';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('terminology')
        .select('*')
        .eq('organization_id', CRANBERRY_ORG.id)
        .order('term', { ascending: true });

      if (error) throw error;
      const mapped: TerminologyItem[] = data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        term: d.term,
        preferredTerm: d.preferred_term,
        isBanned: d.is_banned,
        caseSensitive: d.case_sensitive,
        reason: d.reason,
        clauseId: d.clause_id,
        createdAt: d.created_at,
      }));
      return NextResponse.json({ terminology: mapped });
    }

    const terminology = mockStore.getTerminology();
    return NextResponse.json({ terminology });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch terminology';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAuth(['admin']);
    const body = await req.json();

    if (!body.term || !body.reason) {
      return NextResponse.json({ error: 'Term and reason are required' }, { status: 400 });
    }

    const newItem: TerminologyItem = {
      id: body.id || `term-${Date.now()}`,
      organizationId: CRANBERRY_ORG.id,
      term: body.term.trim(),
      preferredTerm: body.preferredTerm?.trim() || undefined,
      isBanned: body.isBanned ?? true,
      caseSensitive: body.caseSensitive ?? false,
      reason: body.reason.trim(),
      clauseId: body.clauseId || undefined,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('terminology').insert([{
        id: newItem.id,
        organization_id: newItem.organizationId,
        term: newItem.term,
        preferred_term: newItem.preferredTerm,
        is_banned: newItem.isBanned,
        case_sensitive: newItem.caseSensitive,
        reason: newItem.reason,
        clause_id: newItem.clauseId,
      }]);
    }

    mockStore.addTerminology(newItem);
    mockStore.logEvent('knowledge.term_created', 'terminology', newItem.id, adminUser.id, {
      term: newItem.term,
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

