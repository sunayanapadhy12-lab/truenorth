import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { Comment } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(['manager', 'reviewer', 'admin']);
    const submissionId = params.id;
    const body = await req.json();

    const { decision, comment } = body as {
      decision: 'approve' | 'request_changes' | 'reject';
      comment?: string;
    };

    if (!decision || !['approve', 'request_changes', 'reject'].includes(decision)) {
      return NextResponse.json({ error: 'Valid decision (approve, request_changes, reject) is required.' }, { status: 400 });
    }

    // 1. Fetch submission & findings
    const submission = mockStore.getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.isLocked) {
      return NextResponse.json({ error: 'Submission is already approved and locked.' }, { status: 403 });
    }

    const versions = mockStore.getVersionsBySubmissionId(submissionId);
    const latestVersion = versions[versions.length - 1];
    const findings = latestVersion?.findings || [];

    // 2. Check if content is Claim or Fact sensitive
    const isClaimSensitive = findings.some(
      (f) => f.category === 'claim' || f.sourceType === 'fact'
    );

    // 3. Server-side RBAC enforcement
    if (decision === 'approve') {
      if (isClaimSensitive && !hasPermission(user.role, 'approve_claims')) {
        return NextResponse.json(
          {
            error:
              'Forbidden: This submission contains claim-sensitive or fact-sensitive content. Legal Reviewer role (Dr. Elena Rostova) is strictly required for final sign-off.',
            requiresRole: 'reviewer',
          },
          { status: 403 }
        );
      }

      if (!isClaimSensitive && !hasPermission(user.role, 'approve_standard')) {
        return NextResponse.json(
          {
            error: 'Forbidden: Standard approval requires Manager or Reviewer role.',
            requiresRole: 'manager',
          },
          { status: 403 }
        );
      }
    }

    // 4. Update status & lock state
    let newStatus: typeof submission.currentStatus = 'in_review';
    let isLocked = false;

    if (decision === 'approve') {
      newStatus = 'approved';
      isLocked = true;
    } else if (decision === 'request_changes') {
      newStatus = 'changes_requested';
      isLocked = false;
    } else if (decision === 'reject') {
      newStatus = 'rejected';
      isLocked = false;
    }

    mockStore.updateSubmissionStatus(submissionId, newStatus, isLocked);

    // 5. Add decision comment if provided
    if (comment && comment.trim()) {
      const newComment: Comment = {
        id: `comm-${Date.now()}`,
        submissionId,
        versionId: latestVersion?.id,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        body: `[Decision: ${decision.toUpperCase()}] ${comment.trim()}`,
        createdAt: new Date().toISOString(),
      };
      mockStore.addComment(newComment);
    }

    // 6. Log audit event
    mockStore.logEvent(`approval.${decision}`, 'submission', submissionId, user.id, {
      decision,
      newStatus,
      isLocked,
      isClaimSensitive,
      reviewerRole: user.role,
      versionNumber: latestVersion?.versionNumber,
      hasComment: Boolean(comment),
    });

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer
        .from('submissions')
        .update({
          current_status: newStatus,
          is_locked: isLocked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (comment && comment.trim()) {
        await supabaseServer.from('comments').insert([
          {
            submission_id: submissionId,
            version_id: latestVersion?.id,
            author_id: user.id,
            body: `[Decision: ${decision.toUpperCase()}] ${comment.trim()}`,
          },
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      decision,
      status: newStatus,
      isLocked,
      message: `Submission ${decision === 'approve' ? 'approved and locked' : decision}.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error processing approval';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

