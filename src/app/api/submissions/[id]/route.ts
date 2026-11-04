import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const submissionId = params.id;

    if (isSupabaseConfigured && supabaseServer) {
      const [subRes, verRes, commRes] = await Promise.all([
        supabaseServer.from('submissions').select('*, users:creator_id (name)').eq('id', submissionId).single(),
        supabaseServer.from('submission_versions').select('*, findings (*)').eq('submission_id', submissionId).order('version_number', { ascending: true }),
        supabaseServer.from('comments').select('*, users:author_id (name, role)').eq('submission_id', submissionId).order('created_at', { ascending: true }),
      ]);

      if (subRes.error || !subRes.data) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      const submission = {
        id: subRes.data.id,
        organizationId: subRes.data.organization_id,
        creatorId: subRes.data.creator_id,
        creatorName: subRes.data.users?.name || 'Creator',
        title: subRes.data.title,
        channel: subRes.data.channel,
        audience: subRes.data.audience,
        currentStatus: subRes.data.current_status,
        isLocked: subRes.data.is_locked,
        createdAt: subRes.data.created_at,
        updatedAt: subRes.data.updated_at,
      };

      const versions = (verRes.data || []).map((v) => ({
        id: v.id,
        submissionId: v.submission_id,
        versionNumber: v.version_number,
        content: v.content,
        createdBy: v.created_by,
        createdAt: v.created_at,
        findings: (v.findings || []).map((f: {
          id: string;
          version_id: string;
          quoted_span: string;
          span_start?: number;
          span_end?: number;
          category: string;
          source_id: string;
          source_type: string;
          reason: string;
          severity: string;
          suggested_rewrite?: string;
          origin: string;
          confidence: number;
          status: string;
          dismiss_reason?: string;
          actioned_by?: string;
          actioned_at?: string;
        }) => ({
          id: f.id,
          versionId: f.version_id,
          quotedSpan: f.quoted_span,
          spanStart: f.span_start,
          spanEnd: f.span_end,
          category: f.category,
          sourceId: f.source_id,
          sourceType: f.source_type,
          reason: f.reason,
          severity: f.severity,
          suggestedRewrite: f.suggested_rewrite,
          origin: f.origin,
          confidence: f.confidence,
          status: f.status,
          dismissReason: f.dismiss_reason,
          actionedBy: f.actioned_by,
          actionedAt: f.actioned_at,
        })),
      }));

      const comments = (commRes.data || []).map((c) => ({
        id: c.id,
        submissionId: c.submission_id,
        versionId: c.version_id,
        authorId: c.author_id,
        authorName: c.users?.name || 'User',
        authorRole: c.users?.role || 'creator',
        body: c.body,
        createdAt: c.created_at,
      }));

      return NextResponse.json({ submission, versions, comments });
    }

    // Mock store
    const submission = mockStore.getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const versions = mockStore.getVersionsBySubmissionId(submissionId);
    const comments = mockStore.getComments(submissionId);

    return NextResponse.json({ submission, versions, comments });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching submission';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
