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
    const factId = params.id;

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('approved_facts').delete().eq('id', factId);
    }

    mockStore.deleteFact(factId);
    mockStore.logEvent('knowledge.fact_deleted', 'approved_fact', factId, adminUser.id);

    return NextResponse.json({ success: true, message: `Fact ${factId} deleted.` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

