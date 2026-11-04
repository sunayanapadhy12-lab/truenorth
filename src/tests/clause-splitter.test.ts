import { describe, it, expect } from 'vitest';
import {
  splitTextIntoClauses,
  inferCategory,
  inferSeverity,
} from '../lib/parser/clause-splitter';
import {
  extractTextFromFile,
  FileValidationError,
  MAX_FILE_SIZE_BYTES,
} from '../lib/parser/file-extractor';

describe('Phase 2: Clause Splitter & File Extraction Engine', () => {
  it('correctly infers categories based on guideline keywords', () => {
    expect(inferCategory('Avoid hyperbole and emotive marketing hype.')).toBe('tone');
    expect(inferCategory('Never state that our system is 100% secure or unbreakable.')).toBe('claim');
    expect(inferCategory('Screen readers require descriptive alt text for visual diagrams.')).toBe('accessibility');
    expect(inferCategory('Use allowlist instead of whitelist across all documentation.')).toBe('terminology');
    expect(inferCategory('All text must meet the 4.5:1 color contrast ratio.')).toBe('visual');
    expect(inferCategory('Our platform holds a SOC 2 Type II attestation report.')).toBe('compliance');
  });

  it('correctly infers severity from guideline constraints', () => {
    expect(inferSeverity('It is strictly prohibited to make unverified claims.')).toBe('critical');
    expect(inferSeverity('Never publish without legal approval.')).toBe('critical');
    expect(inferSeverity('Authors should avoid passive voice where feasible.')).toBe('warning');
    expect(inferSeverity('Prefer concise sentences under 25 words.')).toBe('warning');
    expect(inferSeverity('Include a glossary at the end of technical whitepapers.')).toBe('info');
  });

  it('splits Markdown headings into distinct numbered clauses', () => {
    const markdown = `
# Global Tone Policy
Cranberry Labs communicates with direct, calm authority. Never use hyperbolic buzzwords.

## Performance Benchmark Requirements
All claims regarding speed or latency must cite a dated internal benchmark or third-party audit.

### Alt Text Standard
Every image and diagram must carry descriptive alt text for screen readers.
`;

    const clauses = splitTextIntoClauses(markdown, 'test-org-1', 'CL-TEST');
    expect(clauses.length).toBe(3);
    expect(clauses[0].id).toBe('CL-TEST-01');
    expect(clauses[0].category).toBe('tone');
    expect(clauses[0].title).toBe('Global Tone Policy');

    expect(clauses[1].id).toBe('CL-TEST-02');
    expect(clauses[1].category).toBe('claim');

    expect(clauses[2].id).toBe('CL-TEST-03');
    expect(clauses[2].category).toBe('accessibility');
  });

  it('splits numbered guidelines into clauses', () => {
    const text = `
1. Casing Standard: All product names must use CamelCase without spaces.
2. Safe Harbor Notice: Financial projections must carry the standard disclaimer.
`;

    const clauses = splitTextIntoClauses(text, 'test-org-1', 'CL-NUM');
    expect(clauses.length).toBe(2);
    expect(clauses[0].id).toBe('CL-NUM-01');
    expect(clauses[1].id).toBe('CL-NUM-02');
  });

  it('rejects files larger than 5 MB with a user-friendly error', async () => {
    const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024); // 5MB + 1KB
    await expect(
      extractTextFromFile(oversizedBuffer, 'huge-document.pdf', 'application/pdf')
    ).rejects.toThrow(FileValidationError);
  });

  it('rejects unsupported file formats', async () => {
    const buffer = Buffer.from('console.log("hello")');
    await expect(
      extractTextFromFile(buffer, 'malicious-script.exe', 'application/x-msdownload')
    ).rejects.toThrow(/Unsupported file type/);
  });

  it('successfully extracts text from markdown and txt files', async () => {
    const sample = '# Brand Rules\n\nRule 1: Always speak truth.';
    const buffer = Buffer.from(sample, 'utf-8');
    const result = await extractTextFromFile(buffer, 'brand-rules.md', 'text/markdown');

    expect(result.text).toContain('Rule 1: Always speak truth.');
    expect(result.fileSizeBytes).toBe(buffer.length);
  });
});

