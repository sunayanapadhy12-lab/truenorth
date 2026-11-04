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
    const termId = params.id;

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('terminology').delete().eq('id', termId);
    }

    mockStore.deleteTerminology(termId);
    mockStore.logEvent('knowledge.term_deleted', 'terminology', termId, adminUser.id);

    return NextResponse.json({ success: true, message: `Term ${termId} deleted.` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
