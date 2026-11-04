import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { recomputeFindingOffsets } from '@/lib/engine/rules-engine';
import { Finding } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const submissionId = params.id;
    const body = await req.json();

    const {
      findingId,
      action,
      dismissReason,
      customEdit,
    } = body as {
      findingId: string;
      action: 'accept' | 'edit' | 'dismiss';
      dismissReason?: string;
      customEdit?: string;
    };

    if (!findingId || !action) {
      return NextResponse.json({ error: 'findingId and action are required.' }, { status: 400 });
    }

    // 1. Fetch submission & latest version
    const submission = mockStore.getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.isLocked) {
      return NextResponse.json(
        { error: 'Cannot modify a locked or approved submission.' },
        { status: 403 }
      );
    }

    const versions = mockStore.getVersionsBySubmissionId(submissionId);
    const currentVersion = versions[versions.length - 1];
    if (!currentVersion) {
      return NextResponse.json({ error: 'No version exists for submission' }, { status: 400 });
    }

    const currentFindings = currentVersion.findings || [];
    const targetFinding = currentFindings.find((f) => f.id === findingId);
    if (!targetFinding) {
      return NextResponse.json({ error: `Finding ${findingId} not found` }, { status: 404 });
    }

    // 2. Handle Dismiss
    if (action === 'dismiss') {
      if (!dismissReason || !dismissReason.trim()) {
        return NextResponse.json(
          { error: 'Dismissing an issue requires providing a reason (for governance audit trails).' },
          { status: 400 }
        );
      }

      mockStore.updateFinding(
        findingId,
        {
          status: 'dismissed',
          dismissReason: dismissReason.trim(),
        },
        user.id
      );

      mockStore.logEvent('finding.dismissed', 'finding', findingId, user.id, {
        submissionId,
        versionId: currentVersion.id,
        dismissReason: dismissReason.trim(),
        sourceId: targetFinding.sourceId,
      });

      if (isSupabaseConfigured && supabaseServer) {
        await supabaseServer
          .from('findings')
          .update({
            status: 'dismissed',
            dismiss_reason: dismissReason.trim(),
            actioned_by: user.id,
            actioned_at: new Date().toISOString(),
          })
          .eq('id', findingId);
      }

      return NextResponse.json({
        success: true,
        action: 'dismiss',
        findingId,
        message: 'Finding dismissed with documented reason.',
      });
    }

    // 3. Handle Accept or Edit -> Modifies content and creates Version N+1
    const replacementText =
      action === 'accept'
        ? targetFinding.suggestedRewrite || targetFinding.quotedSpan
        : customEdit || '';

    if (action === 'edit' && !replacementText.trim()) {
      return NextResponse.json({ error: 'Custom replacement cannot be empty.' }, { status: 400 });
    }

    // Compute new content by replacing the exact target span
    const originalContent = currentVersion.content;
    const startIndex = targetFinding.spanStart ?? originalContent.indexOf(targetFinding.quotedSpan);
    const endIndex = targetFinding.spanEnd ?? startIndex + targetFinding.quotedSpan.length;

    if (startIndex === -1) {
      return NextResponse.json({ error: 'Could not locate quoted span in document text.' }, { status: 400 });
    }

    const updatedContent =
      originalContent.substring(0, startIndex) +
      replacementText +
      originalContent.substring(endIndex);

    // Create Version N+1
    const newVersion = mockStore.createNewVersion(submissionId, updatedContent, user.id);

    // Recompute offsets for remaining findings
    const updatedFindings: Finding[] = recomputeFindingOffsets(
      currentFindings,
      findingId,
      targetFinding.quotedSpan,
      replacementText,
      updatedContent
    ).map((f) => {
      if (f.id === findingId) {
        return {
          ...f,
          versionId: newVersion.id,
          status: action === 'accept' ? 'accepted' : 'edited',
          suggestedRewrite: replacementText,
          actionedBy: user.id,
          actionedAt: new Date().toISOString(),
        };
      }
      return {
        ...f,
        versionId: newVersion.id,
      };
    });

    mockStore.setFindingsForVersion(newVersion.id, updatedFindings);

    mockStore.logEvent(`finding.${action}ed`, 'finding', findingId, user.id, {
      submissionId,
      oldVersionId: currentVersion.id,
      newVersionId: newVersion.id,
      versionNumber: newVersion.versionNumber,
      sourceId: targetFinding.sourceId,
      oldSpan: targetFinding.quotedSpan,
      newSpan: replacementText,
    });

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('submission_versions').insert([
        {
          id: newVersion.id,
          submission_id: submissionId,
          version_number: newVersion.versionNumber,
          content: updatedContent,
          created_by: user.id,
        },
      ]);

      await supabaseServer.from('findings').insert(
        updatedFindings.map((f) => ({
          id: `f-${newVersion.id}-${f.id}`,
          version_id: newVersion.id,
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
          dismiss_reason: f.dismissReason,
          actioned_by: f.actionedBy,
          actioned_at: f.actionedAt,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      action,
      newVersionNumber: newVersion.versionNumber,
      newVersionId: newVersion.id,
      message: `Created Version ${newVersion.versionNumber}. Highlight offsets updated.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error actioning finding';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

