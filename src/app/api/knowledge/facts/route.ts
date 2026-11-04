import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { mockStore } from '@/lib/supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase/server';
import { ApprovedFact } from '@/lib/types';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function GET() {
  try {
    if (isSupabaseConfigured && supabaseServer) {
      const { data, error } = await supabaseServer
        .from('approved_facts')
        .select('*')
        .eq('organization_id', CRANBERRY_ORG.id)
        .order('id', { ascending: true });

      if (error) throw error;
      const mapped: ApprovedFact[] = data.map((d) => ({
        id: d.id,
        organizationId: d.organization_id,
        statement: d.statement,
        factValue: d.fact_value,
        effectiveDate: d.effective_date,
        expiryDate: d.expiry_date,
        sourceDoc: d.source_doc,
        createdAt: d.created_at,
      }));
      return NextResponse.json({ facts: mapped });
    }

    const facts = mockStore.getFacts();
    return NextResponse.json({ facts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch facts';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAuth(['admin']);
    const body = await req.json();

    if (!body.id || !body.statement || !body.factValue || !body.effectiveDate || !body.sourceDoc) {
      return NextResponse.json(
        { error: 'id, statement, factValue, effectiveDate, and sourceDoc are required.' },
        { status: 400 }
      );
    }

    const newFact: ApprovedFact = {
      id: body.id.trim(),
      organizationId: CRANBERRY_ORG.id,
      statement: body.statement.trim(),
      factValue: body.factValue.trim(),
      effectiveDate: body.effectiveDate,
      expiryDate: body.expiryDate || undefined,
      sourceDoc: body.sourceDoc.trim(),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabaseServer) {
      await supabaseServer.from('approved_facts').insert([{
        id: newFact.id,
        organization_id: newFact.organizationId,
        statement: newFact.statement,
        fact_value: newFact.factValue,
        effective_date: newFact.effectiveDate,
        expiry_date: newFact.expiryDate || null,
        source_doc: newFact.sourceDoc,
      }]);
    }

    mockStore.addFact(newFact);
    mockStore.logEvent('knowledge.fact_created', 'approved_fact', newFact.id, adminUser.id, {
      statement: newFact.statement,
    });

    return NextResponse.json({ success: true, fact: newFact });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

