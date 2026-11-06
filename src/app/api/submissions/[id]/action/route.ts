import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { applyCleanReplacement, runDeterministicRules } from '@/lib/engine/rules-engine';
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
        user.id,
        currentVersion.id
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
    let replacementText = '';
    if (action === 'accept') {
      if (!targetFinding.suggestedRewrite || !targetFinding.suggestedRewrite.trim()) {
        return NextResponse.json(
          {
            error:
              'A safe automatic replacement is not available for this finding. Please use the Edit option to provide a manual correction.',
          },
          { status: 400 }
        );
      }
      replacementText = targetFinding.suggestedRewrite.trim();
    } else if (action === 'edit') {
      if (!customEdit || !customEdit.trim()) {
        return NextResponse.json({ error: 'Custom replacement cannot be empty.' }, { status: 400 });
      }
      replacementText = customEdit.trim();
    }

    // Apply position-aware clean replacement with duplicate prevention and grammar preservation
    const replacementResult = applyCleanReplacement(
      currentVersion.content,
      targetFinding,
      replacementText
    );

    if (!replacementResult.success || !replacementResult.newContent) {
      return NextResponse.json(
        { error: replacementResult.error || 'Could not locate quoted span in document text.' },
        { status: 400 }
      );
    }

    const updatedContent = replacementResult.newContent;
    const actualAppliedReplacement = replacementResult.actualNewSpan || replacementText;

    // Create Version N+1
    const newVersion = mockStore.createNewVersion(submissionId, updatedContent, user.id);

    // Re-run the review engine on the updated draft
    const terms = mockStore.getTerminology();
    const clauses = mockStore.getClauses();
    const freshFindings = runDeterministicRules({
      content: updatedContent,
      versionId: newVersion.id,
      channel: submission.channel,
      audience: submission.audience,
      terms,
      clauses,
    });

    // Check if the custom edit still introduces a violation
    if (action === 'edit') {
      const stillViolating = freshFindings.some(
        (f) =>
          f.sourceId === targetFinding.sourceId &&
          f.quotedSpan.toLowerCase() === actualAppliedReplacement.toLowerCase()
      );
      if (stillViolating) {
        return NextResponse.json(
          { error: 'The provided custom edit still violates brand governance rules.' },
          { status: 400 }
        );
      }
    }

    // Build the resolved actioned finding
    const resolvedActionedFinding: Finding = {
      ...targetFinding,
      versionId: newVersion.id,
      status: action === 'accept' ? 'accepted' : 'edited',
      suggestedRewrite: actualAppliedReplacement,
      actionedBy: user.id,
      actionedAt: new Date().toISOString(),
    };

    // Carry forward previously resolved findings from earlier versions
    const previouslyResolved: Finding[] = currentFindings
      .filter((f) => f.id !== findingId && f.status !== 'open')
      .map((f) => ({
        ...f,
        versionId: newVersion.id,
      }));

    // For open findings in the updated draft, preserve stable IDs where possible
    const remainingOpenInCurrent = currentFindings.filter(
      (f) => f.id !== findingId && f.status === 'open'
    );

    const openFindings: Finding[] = freshFindings.map((fresh) => {
      const matched = remainingOpenInCurrent.find(
        (cur) =>
          cur.sourceId === fresh.sourceId &&
          cur.quotedSpan.toLowerCase() === fresh.quotedSpan.toLowerCase()
      );
      return {
        ...fresh,
        id: matched ? matched.id : fresh.id,
        versionId: newVersion.id,
        status: 'open',
      };
    });

    // Combine all findings for Version N+1
    const allNewFindings: Finding[] = [
      ...previouslyResolved,
      resolvedActionedFinding,
      ...openFindings,
    ];

    mockStore.setFindingsForVersion(newVersion.id, allNewFindings);

    mockStore.logEvent(`finding.${action}ed`, 'finding', findingId, user.id, {
      submissionId,
      oldVersionId: currentVersion.id,
      newVersionId: newVersion.id,
      versionNumber: newVersion.versionNumber,
      sourceId: targetFinding.sourceId,
      oldSpan: targetFinding.quotedSpan,
      newSpan: actualAppliedReplacement,
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
        allNewFindings.map((f) => ({
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
      message: `Created Version ${newVersion.versionNumber}. Findings re-evaluated on updated copy.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error actioning finding';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

