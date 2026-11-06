import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAiEnabled = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your-gemini-api-key' &&
    process.env.GEMINI_API_KEY.trim() !== ''
  );

  const persistence: 'supabase' | 'mock' = isSupabaseConfigured ? 'supabase' : 'mock';
  const ai: 'enabled' | 'disabled' = isAiEnabled ? 'enabled' : 'disabled';

  return NextResponse.json({
    persistence,
    ai,
    status: isSupabaseConfigured ? 'ok' : 'degraded',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}

