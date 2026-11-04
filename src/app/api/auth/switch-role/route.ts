import { NextRequest, NextResponse } from 'next/server';
import { SEED_USERS } from '@/lib/seed/cranberry-labs-data';
import { COOKIE_NAME, ROLE_COOKIE_NAME } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetRole = body.role as UserRole;

    const matchedUser = SEED_USERS.find((u) => u.role === targetRole) || SEED_USERS[0];

    const response = NextResponse.json({
      success: true,
      user: matchedUser,
      message: `Switched demo role to ${matchedUser.name} (${matchedUser.role})`,
    });

    // Set cookies with 30-day expiration for demo persistence
    response.cookies.set(COOKIE_NAME, matchedUser.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });

    response.cookies.set(ROLE_COOKIE_NAME, matchedUser.role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });

    // Audit log
    mockStore.logEvent(
      'user.switched_role',
      'user',
      matchedUser.id,
      matchedUser.id,
      { newRole: matchedUser.role, userName: matchedUser.name }
    );

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to switch role';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

