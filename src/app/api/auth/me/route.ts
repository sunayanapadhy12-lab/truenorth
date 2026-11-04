import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isUsingMockStore } from '@/lib/supabase/server';
import { SEED_USERS } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      user,
      allUsers: SEED_USERS,
      isMockMode: isUsingMockStore,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

