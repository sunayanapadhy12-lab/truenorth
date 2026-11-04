import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { ColorPaletteItem } from '@/lib/types';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('color_palettes')
        .select('*')
        .eq('organization_id', CRANBERRY_ORG.id)
        .order('name', { ascending: true });

      if (error) throw error;
      const mapped: ColorPaletteItem[] = data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        name: d.name,
        hex: d.hex,
        role: d.role,
        minContrastRatio: d.min_contrast_ratio,
        createdAt: d.created_at,
      }));
      return NextResponse.json({ palette: mapped });
    }

    const palette = mockStore.getPalette();
    return NextResponse.json({ palette });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch palette';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAuth(['admin']);
    const body = await req.json();

    if (!body.name || !body.hex || !body.role) {
      return NextResponse.json({ error: 'Name, hex, and role are required' }, { status: 400 });
    }

    const newItem: ColorPaletteItem = {
      id: body.id || `pal-${Date.now()}`,
      organizationId: CRANBERRY_ORG.id,
      name: body.name.trim(),
      hex: body.hex.trim(),
      role: body.role,
      minContrastRatio: body.minContrastRatio || 4.5,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('color_palettes').insert([{
        id: newItem.id,
        organization_id: newItem.organizationId,
        name: newItem.name,
        hex: newItem.hex,
        role: newItem.role,
        min_contrast_ratio: newItem.minContrastRatio,
      }]);
    }

    mockStore.addPaletteItem(newItem);
    mockStore.logEvent('knowledge.palette_item_created', 'color_palette', newItem.id, adminUser.id, {
      name: newItem.name,
      hex: newItem.hex,
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

