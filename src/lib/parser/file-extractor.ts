import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ExtractedDocument {
  text: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  pageCount?: number;
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Validates and extracts plain text from uploaded PDF, DOCX, MD, and TXT files.
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ExtractedDocument> {
  const size = fileBuffer.length;

  // 1. File Size Check (5 MB limit)
  if (size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (size / (1024 * 1024)).toFixed(1);
    throw new FileValidationError(
      `File size (${sizeMb} MB) exceeds the maximum allowed limit of 5.0 MB. Please upload a smaller document.`
    );
  }

  // Detect extension
  const extension = fileName.split('.').pop()?.toLowerCase();

  // 2. MIME & Extension validation
  const allowedExtensions = ['pdf', 'docx', 'md', 'markdown', 'txt'];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new FileValidationError(
      `Unsupported file type ".${extension || 'unknown'}". Allowed formats: PDF (.pdf), Word (.docx), Markdown (.md), and Plain Text (.txt).`
    );
  }

  let text = '';
  let pageCount: number | undefined;

  try {
    switch (extension) {
      case 'pdf': {
        const parsed = await pdfParse(fileBuffer);
        text = parsed.text || '';
        pageCount = parsed.numpages;
        break;
      }
      case 'docx': {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value || '';
        break;
      }
      case 'md':
      case 'markdown':
      case 'txt': {
        text = fileBuffer.toString('utf-8');
        break;
      }
      default:
        throw new FileValidationError(`Unsupported file type: .${extension}`);
    }
  } catch (err: unknown) {
    if (err instanceof FileValidationError) throw err;
    const msg = err instanceof Error ? err.message : 'Unknown parser error';
    throw new Error(`Failed to extract text from ${fileName}: ${msg}`);
  }

  // Clean excessive blank lines while preserving structural spacing
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleanedText) {
    throw new FileValidationError(
      `The document "${fileName}" appears to be empty or contains only non-extractable elements.`
    );
  }

  return {
    text: cleanedText,
    fileName,
    fileSizeBytes: size,
    mimeType: mimeType || `application/${extension}`,
    pageCount,
  };
}

