import { cookies } from 'next/headers';
import { User, UserRole } from './types';
import { SEED_USERS } from './seed/cranberry-labs-data';
import { mockStore } from './supabase/mock-store';
import { supabaseServer, isSupabaseConfigured } from './supabase/server';

export const COOKIE_NAME = 'truenorth_user_id';
export const ROLE_COOKIE_NAME = 'truenorth_role';

export async function getCurrentUser(): Promise<User> {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get(COOKIE_NAME)?.value;
  const roleCookie = cookieStore.get(ROLE_COOKIE_NAME)?.value as UserRole | undefined;

  // If using Supabase in production
  if (isSupabaseConfigured && supabaseServer && userIdCookie) {
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .select('*')
        .eq('id', userIdCookie)
        .single();

      if (data && !error) {
        return {
          id: data.id,
          organizationId: data.organization_id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Local / Mock store check
  if (userIdCookie) {
    const user = mockStore.getUserById(userIdCookie);
    if (user) return user;
  }

  if (roleCookie) {
    const user = mockStore.getUserByRole(roleCookie);
    if (user) return user;
  }

  // Default demo user: Alex Rivera (Creator)
  return SEED_USERS[1];
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error(
      `Forbidden: Action requires role [${allowedRoles.join(', ')}], but current user is [${user.role}].`
    );
  }

  return user;
}

export function hasPermission(userRole: UserRole, action: 'edit_knowledge' | 'approve_claims' | 'approve_standard' | 'submit_content'): boolean {
  switch (action) {
    case 'edit_knowledge':
      return userRole === 'admin';
    case 'approve_claims':
      return userRole === 'reviewer'; // Claim/fact-sensitive requires Reviewer role!
    case 'approve_standard':
      return userRole === 'manager' || userRole === 'reviewer';
    case 'submit_content':
      return true; // All authenticated roles can test submissions
    default:
      return false;
  }
}
