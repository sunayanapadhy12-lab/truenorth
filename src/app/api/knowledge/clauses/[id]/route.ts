import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAuth(['admin']);
    const clauseId = params.id;

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('guideline_clauses').delete().eq('id', clauseId);
    }

    mockStore.deleteClause(clauseId);
    mockStore.logEvent('knowledge.clause_deleted', 'guideline_clause', clauseId, adminUser.id);

    return NextResponse.json({ success: true, message: `Clause ${clauseId} deleted.` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
