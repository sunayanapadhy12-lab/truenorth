import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import {
  CRANBERRY_ORG,
  SEED_USERS,
  SEED_CLAUSES,
  SEED_TERMINOLOGY,
  SEED_FACTS,
  SEED_PALETTE,
} from '@/lib/seed/cranberry-labs-data';

export async function POST() {
  try {
    const adminUser = await requireAuth(['admin']);

    // 1. Reset Mock Store
    mockStore.resetToSeed();

    // 2. If Supabase is configured, repopulate database tables
    if (isSupabaseConfigured && supabaseServer) {
      // Clear in reverse order of foreign keys
      await supabaseServer.from('findings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('submission_versions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('color_palettes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('approved_facts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('terminology').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('guideline_clauses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseServer.from('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert Org & Users
      await supabaseServer.from('organizations').insert([CRANBERRY_ORG]);
      await supabaseServer.from('users').insert(
        SEED_USERS.map((u) => ({
          id: u.id,
          organization_id: u.organizationId,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar_url: u.avatarUrl,
        }))
      );

      // Insert Clauses
      await supabaseServer.from('guideline_clauses').insert(
        SEED_CLAUSES.map((c) => ({
          id: c.id,
          organization_id: c.organizationId,
          category: c.category,
          title: c.title,
          summary: c.summary,
          full_text: c.fullText,
          severity: c.severity,
        }))
      );

      // Insert Terminology
      await supabaseServer.from('terminology').insert(
        SEED_TERMINOLOGY.map((t) => ({
          id: t.id,
          organization_id: t.organizationId,
          term: t.term,
          preferred_term: t.preferredTerm,
          is_banned: t.isBanned,
          case_sensitive: t.caseSensitive,
          reason: t.reason,
          clause_id: t.clauseId,
        }))
      );

      // Insert Facts
      await supabaseServer.from('approved_facts').insert(
        SEED_FACTS.map((f) => ({
          id: f.id,
          organization_id: f.organizationId,
          statement: f.statement,
          fact_value: f.factValue,
          effective_date: f.effectiveDate,
          expiry_date: f.expiryDate || null,
          source_doc: f.sourceDoc,
        }))
      );

      // Insert Palette
      await supabaseServer.from('color_palettes').insert(
        SEED_PALETTE.map((p) => ({
          id: p.id,
          organization_id: p.organizationId,
          name: p.name,
          hex: p.hex,
          role: p.role,
          min_contrast_ratio: p.minContrastRatio,
        }))
      );
    }

    mockStore.logEvent(
      'admin.reset_demo_data',
      'organization',
      CRANBERRY_ORG.id,
      adminUser.id,
      { message: 'Demo data restored to initial Cranberry Labs seed' }
    );

    return NextResponse.json({
      success: true,
      message: 'Demo dataset restored to initial Cranberry Labs state (25 clauses, 15 terms, 12 facts, 6 palette tokens).',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset demo data';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
