import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { executeReviewPipeline } from '@/lib/engine/pipeline';
import { Submission, SubmissionChannel, SubmissionAudience } from '@/lib/types';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('submissions')
        .select(`
          *,
          users:creator_id (name),
          submission_versions (*)
        `)
        .eq('organization_id', CRANBERRY_ORG.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const submissions = data.map((d) => {
        const versions = d.submission_versions || [];
        const currentVersion = versions.sort(
          (a: { version_number: number }, b: { version_number: number }) => b.version_number - a.version_number
        )[0];

        return {
          id: d.id,
          organizationId: d.organization_id,
          creatorId: d.creator_id,
          creatorName: (d.users as { name?: string })?.name || 'Creator',
          title: d.title,
          channel: d.channel,
          audience: d.audience,
          currentStatus: d.current_status,
          isLocked: d.is_locked,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          currentVersion: currentVersion
            ? {
                id: currentVersion.id,
                submissionId: currentVersion.submission_id,
                versionNumber: currentVersion.version_number,
                content: currentVersion.content,
                createdBy: currentVersion.created_by,
                createdAt: currentVersion.created_at,
              }
            : undefined,
        };
      });

      return NextResponse.json({ submissions });
    }

    const submissions = mockStore.getSubmissions();
    return NextResponse.json({ submissions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch submissions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(); // Any authenticated persona can submit
    const body = await req.json();

    const {
      title,
      content,
      channel = 'blog',
      audience = 'developers',
    } = body as {
      title: string;
      content: string;
      channel: SubmissionChannel;
      audience: SubmissionAudience;
    };

    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Title and draft content are required.' },
        { status: 400 }
      );
    }

    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const versionId = `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const submission: Submission = {
      id: submissionId,
      organizationId: CRANBERRY_ORG.id,
      creatorId: user.id,
      creatorName: user.name,
      title: title.trim(),
      channel,
      audience,
      currentStatus: 'draft',
      isLocked: false,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Create in store
    const { version } = mockStore.createSubmission(submission, content.trim(), versionId);
    const activeVersionId = version.id;

    mockStore.logEvent('submission.created', 'submission', submissionId, user.id, {
      title: submission.title,
      channel,
      audience,
    });

    // 2. Run Review Pipeline
    const sessionId = req.cookies.get('truenorth_user_id')?.value || user.id;
    const reviewResult = await executeReviewPipeline({
      content: content.trim(),
      versionId: activeVersionId,
      channel,
      audience,
      organizationId: CRANBERRY_ORG.id,
      sessionId,
      userId: user.id,
    });

    // 3. Store findings for Version 1
    mockStore.setFindingsForVersion(activeVersionId, reviewResult.findings);

    // 4. Save in Supabase if configured
    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('submissions').insert([
        {
          id: submission.id,
          organization_id: submission.organizationId,
          creator_id: submission.creatorId,
          title: submission.title,
          channel: submission.channel,
          audience: submission.audience,
          current_status: submission.currentStatus,
          is_locked: submission.isLocked,
        },
      ]);

      await supabaseServer.from('submission_versions').insert([
        {
          id: versionId,
          submission_id: submission.id,
          version_number: 1,
          content: content.trim(),
          created_by: user.id,
        },
      ]);

      if (reviewResult.findings.length > 0) {
        await supabaseServer.from('findings').insert(
          reviewResult.findings.map((f) => ({
            id: f.id,
            version_id: versionId,
            quoted_span: f.quotedSpan,
            span_start: f.spanStart,
            span_end: f.spanEnd,
            category: f.category,
            source_id: f.sourceId,
            source_type: f.sourceType,
            reason: f.reason,
            severity: f.severity,
            suggested_rewrite: f.suggestedRewrite,
            origin: f.origin,
            confidence: f.confidence,
            status: f.status,
          }))
        );
      }
    }

    return NextResponse.json({
      success: true,
      submissionId,
      versionId: activeVersionId,
      findingsCount: reviewResult.findings.length,
      isAiFallback: reviewResult.isAiFallback,
      fallbackReason: reviewResult.fallbackReason,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create submission';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

