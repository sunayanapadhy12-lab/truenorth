'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SampleDraftLoader } from '@/components/SampleDraftLoader';
import { SampleDraft } from '@/lib/seed/cranberry-labs-data';
import { SubmissionChannel, SubmissionAudience } from '@/lib/types';
import {
  FileCheck,
  Upload,
  ArrowRight,
  Sparkles,
  Loader2,
  FileCode,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function SubmitDraftPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState<SubmissionChannel>('blog');
  const [audience, setAudience] = useState<SubmissionAudience>('developers');

  const [inputMode, setInputMode] = useState<'paste' | 'file'>('paste');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load sample draft
  const handleSelectSample = (draft: SampleDraft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setChannel(draft.channel);
    setAudience(draft.audience);
    setInputMode('paste');
    setSelectedFile(null);
    setSubmitError(null);
  };

  // Handle file extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds the 5 MB limit. Please select a smaller document.');
      return;
    }

    setSelectedFile(file);
    setIsExtractingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/knowledge/parse-doc', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract file text');

      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setContent(data.previewText ? data.clauses.map((c: { fullText: string }) => c.fullText).join('\n\n') || data.previewText : '');
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : 'Error extracting text from document');
    } finally {
      setIsExtractingFile(false);
    }
  };

  // Submit Draft & Run Hybrid Pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setSubmitError('Please enter draft text or upload a document.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmissionStage('1/3 Running deterministic rules & term checks...');

    try {
      setTimeout(() => {
        setSubmissionStage('2/3 Retrieving relevant guideline clauses & approved facts...');
      }, 700);

      setTimeout(() => {
        setSubmissionStage('3/3 Running Gemini LLM Judge & Verifying citations...');
      }, 1600);

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          channel,
          audience,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process submission');

      // Navigate to review screen
      router.push(`/submissions/${data.submissionId}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit content');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
            Creator Workspace
          </span>
          <span className="text-xs text-slate-500 font-medium">Pre-Publication Review</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
          Submit Content for Brand Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Draft copy is checked in real-time against approved tone guidelines, terminology standards, and approved company facts.
        </p>
      </div>

      {/* Zero Friction Sample Draft Loader */}
      <SampleDraftLoader onSelect={handleSelectSample} />

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Publication Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as SubmissionChannel)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20"
            >
              <option value="blog">Technical Blog Post</option>
              <option value="press_release">Press Release / Financial</option>
              <option value="social">Social Media (LinkedIn / X)</option>
              <option value="website">Marketing Website / Landing Page</option>
              <option value="email">Customer Email / Newsletter</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Press releases enforce mandatory forward-looking disclaimers.
            </p>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as SubmissionAudience)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20"
            >
              <option value="developers">Software Engineers & Developers</option>
              <option value="enterprise">Enterprise Decision Makers</option>
              <option value="general_public">General Public & Consumers</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Used to tune tone and reading comprehension targets.
            </p>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Draft Title
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Architecture Announcement"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20"
            />
          </div>
        </div>

        {/* Input Switcher (Paste vs File Upload) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Draft Content
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  inputMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Direct Paste
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  inputMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Upload File (PDF/DOCX/MD $\le$ 5MB)
              </button>
            </div>
          </div>

          {inputMode === 'file' && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-cranberry-400 transition-colors mb-3">
              <FileCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : 'Select or drop a file to import'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">PDF, DOCX, Markdown (.md), or Text (.txt) up to 5 MB</p>
              <input
                type="file"
                accept=".pdf,.docx,.md,.txt"
                onChange={handleFileUpload}
                disabled={isExtractingFile}
                className="mt-3 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:text-xs file:font-semibold"
              />
              {isExtractingFile && (
                <div className="mt-2 text-xs text-cranberry-700 flex items-center justify-center gap-1.5 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting text from document...</span>
                </div>
              )}
              {fileError && <p className="text-xs text-rose-600 mt-2">{fileError}</p>}
            </div>
          )}

          <textarea
            required
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your drafted article, announcement, or social copy here for governance analysis..."
            className="w-full text-xs font-mono p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20 leading-relaxed text-slate-800"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Character count: {content.length}</span>
            <span>Word count: {content.trim().split(/\s+/).filter(Boolean).length}</span>
          </div>
        </div>

        {/* Submit Button & Progress State */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {isSubmitting ? (
              <div className="flex items-center gap-2 text-xs text-cranberry-700 font-semibold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-cranberry-600" />
                <span>{submissionStage}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Pipeline runs deterministically, verifies citations, and isolates prompt injection.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cranberry-700 hover:bg-cranberry-800 text-white font-semibold text-xs shadow-md disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Draft...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Brand Governance Review</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
