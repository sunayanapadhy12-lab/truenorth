import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { AuditLog } from '@/lib/types';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    await requireAuth();

    if (isSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('audit_logs')
        .select('*, users:user_id (name, role)')
        .eq('organization_id', CRANBERRY_ORG.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      const logs: AuditLog[] = data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        userId: d.user_id,
        userName: d.users?.name,
        userRole: d.users?.role,
        action: d.action,
        resourceType: d.resource_type,
        resourceId: d.resource_id,
        metadata: d.metadata || {},
        createdAt: d.created_at,
      }));
      return NextResponse.json({ logs });
    }

    const logs = mockStore.getAuditLogs(100);
    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching audit logs';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
