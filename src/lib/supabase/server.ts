import { createClient } from '@supabase/supabase-js';
import { mockStore } from './mock-store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project')
);

export const supabaseServer = isSupabaseConfigured
  ? createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false },
    })
  : null;

export const isUsingMockStore = !isSupabaseConfigured;

export function getDataStore() {
  return {
    isMock: isUsingMockStore,
    supabase: supabaseServer,
    mock: mockStore,
  };
}
