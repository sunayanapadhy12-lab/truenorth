import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { extractTextFromFile, FileValidationError } from '@/lib/parser/file-extractor';
import { splitTextIntoClauses } from '@/lib/parser/clause-splitter';
import { CRANBERRY_ORG } from '@/lib/seed/cranberry-labs-data';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['admin']);

    const contentType = req.headers.get('content-type') || '';

    let extractedText = '';
    let fileName = 'pasted-text.md';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const textParam = formData.get('text') as string | null;

      if (file && file.size > 0) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await extractTextFromFile(buffer, file.name, file.type);
        extractedText = result.text;
      } else if (textParam) {
        extractedText = textParam.trim();
      } else {
        return NextResponse.json(
          { error: 'Please upload a valid document or paste guideline text.' },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      extractedText = body.text || '';
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Extracted text is empty or too short to contain guideline rules.' },
        { status: 400 }
      );
    }

    // Split into clauses
    const clauses = splitTextIntoClauses(extractedText, CRANBERRY_ORG.id, 'CL-IMP');

    return NextResponse.json({
      success: true,
      fileName,
      totalLength: extractedText.length,
      clausesCount: clauses.length,
      clauses,
      previewText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
    });
  } catch (error: unknown) {
    if (error instanceof FileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'Failed to parse document';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

