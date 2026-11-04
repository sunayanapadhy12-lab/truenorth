import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { Comment } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const submissionId = params.id;

    if (isSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('comments')
        .select('*, users:author_id (name, role)')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const comments: Comment[] = data.map((d) => ({
        id: d.id,
        submissionId: d.submission_id,
        versionId: d.version_id,
        authorId: d.author_id,
        authorName: d.users?.name || 'User',
        authorRole: d.users?.role || 'creator',
        body: d.body,
        createdAt: d.created_at,
      }));
      return NextResponse.json({ comments });
    }

    const comments = mockStore.getComments(submissionId);
    return NextResponse.json({ comments });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error fetching comments';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const submissionId = params.id;
    const body = await req.json();

    if (!body.body || !body.body.trim()) {
      return NextResponse.json({ error: 'Comment body cannot be empty.' }, { status: 400 });
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      submissionId,
      versionId: body.versionId || undefined,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      body: body.body.trim(),
      createdAt: new Date().toISOString(),
    };

    mockStore.addComment(newComment);
    mockStore.logEvent('comment.created', 'submission', submissionId, user.id, {
      commentId: newComment.id,
      versionId: newComment.versionId,
      authorRole: user.role,
    });

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('comments').insert([
        {
          id: newComment.id,
          submission_id: submissionId,
          version_id: newComment.versionId,
          author_id: user.id,
          body: newComment.body,
        },
      ]);
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error adding comment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
