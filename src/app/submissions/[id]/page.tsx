'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { HighlightedText } from '@/components/HighlightedText';
import { FindingCard } from '@/components/FindingCard';
import { DiffViewer } from '@/components/DiffViewer';
import {
  Submission,
  SubmissionVersion,
  Finding,
  Comment,
  User,
} from '@/lib/types';
import {
  ArrowLeft,
  Lock,
  Sparkles,
  GitCompare,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Shield,
  MessageSquare,
} from 'lucide-react';

export default function SubmissionReviewPage() {
  const params = useParams();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [versions, setVersions] = useState<SubmissionVersion[]>([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
  const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>();
  const [findingFilter, setFindingFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, [submissionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, subRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch(`/api/submissions/${submissionId}`).then((r) => r.json()),
      ]);

      if (userRes.user) setCurrentUser(userRes.user);

      if (subRes.submission) {
        setSubmission(subRes.submission);
        setVersions(subRes.versions || []);
        // Default to latest version
        setSelectedVersionIndex((subRes.versions || []).length - 1);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentVersion = versions[selectedVersionIndex];
  const previousVersion = selectedVersionIndex > 0 ? versions[selectedVersionIndex - 1] : undefined;
  const currentFindings = currentVersion?.findings || [];

  // Actions
  const handleAcceptFinding = async (findingId: string) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId,
          action: 'accept',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept finding');

      // Refresh data to reflect Version N+1
      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error accepting finding');
    }
  };

  const handleEditFinding = async (findingId: string, customEdit: string) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId,
          action: 'edit',
          customEdit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply custom edit');

      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error applying edit');
    }
  };

  const handleDismissFinding = async (findingId: string, dismissReason: string) => {
    try {
      const res = await fetch(`/api/submissions/${submissionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findingId,
          action: 'dismiss',
          dismissReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dismiss finding');

      await fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error dismissing finding');
    }
  };

  // Filter findings
  const openFindings = currentFindings.filter((f) => f.status === 'open');
  const resolvedFindings = currentFindings.filter((f) => f.status !== 'open');
  const displayedFindings =
    findingFilter === 'open'
      ? openFindings
      : findingFilter === 'resolved'
      ? resolvedFindings
      : currentFindings;

  if (loading || !submission || !currentVersion) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-slate-400">
        Loading draft review and governance findings...
      </div>
    );
  }

  const criticalCount = openFindings.filter((f) => f.severity === 'critical').length;
  const warningCount = openFindings.filter((f) => f.severity === 'warning').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Link & Header */}
      <div className="space-y-4">
        <Link
          href="/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Submissions</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cranberry-100 text-cranberry-800 border border-cranberry-200">
                {submission.channel}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                Audience: {submission.audience}
              </span>
              {submission.isLocked ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Approved & Locked</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                  {submission.currentStatus}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {submission.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/approvals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>Manager Approvals</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Version Selector Tabs & Diff Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            Versions:
          </span>
          {versions.map((ver, idx) => (
            <button
              key={ver.id}
              onClick={() => {
                setSelectedVersionIndex(idx);
                setShowDiff(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                idx === selectedVersionIndex
                  ? 'bg-white text-cranberry-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              v{ver.versionNumber}
              {idx === versions.length - 1 && (
                <span className="ml-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Latest
                </span>
              )}
            </button>
          ))}
        </div>

        {selectedVersionIndex > 0 && previousVersion && (
          <button
            type="button"
            onClick={() => setShowDiff(!showDiff)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              showDiff
                ? 'bg-cranberry-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{showDiff ? 'Exit Diff View' : `Compare with v${previousVersion.versionNumber}`}</span>
          </button>
        )}
      </div>

      {/* Split Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (60%): Document View or Diff Viewer */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {showDiff ? 'Version Difference Inspector' : 'Interactive Highlighted Copy'}
            </h2>
            <span className="text-[11px] text-slate-400">
              Created by {currentVersion.createdByName || 'Creator'} on{' '}
              {new Date(currentVersion.createdAt).toLocaleTimeString()}
            </span>
          </div>

          {showDiff && previousVersion ? (
            <DiffViewer
              oldContent={previousVersion.content}
              newContent={currentVersion.content}
              oldVersionNum={previousVersion.versionNumber}
              newVersionNum={currentVersion.versionNumber}
            />
          ) : (
            <HighlightedText
              content={currentVersion.content}
              findings={currentFindings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={(id) => {
                setSelectedFindingId(id);
                // Scroll finding card into view
                const el = document.getElementById(`finding-${id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
            />
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-200 border border-rose-500 inline-block" />
                <span>Critical Violation</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-500 inline-block" />
                <span>Warning</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-200 border border-blue-500 inline-block" />
                <span>Style Notice</span>
              </span>
            </div>
            <span>Click highlight to jump to source citation</span>
          </div>
        </div>

        {/* Right Column (40%): Findings Side Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Summary Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cranberry-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Governance Audit Panel
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-700 font-mono">
                {openFindings.length} Open Issue{openFindings.length === 1 ? '' : 's'}
              </span>
            </div>

            {openFindings.length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">{criticalCount} Critical</span> and{' '}
                  <span className="font-bold">{warningCount} Warning</span> issues must be resolved before manager sign-off.
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All brand findings resolved in Version {currentVersion.versionNumber}! Ready for approval.</span>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex border-b border-slate-100 mt-4 pt-1 space-x-4">
              <button
                type="button"
                onClick={() => setFindingFilter('open')}
                className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                  findingFilter === 'open'
                    ? 'border-cranberry-700 text-cranberry-800'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Open ({openFindings.length})
              </button>
              <button
                type="button"
                onClick={() => setFindingFilter('resolved')}
                className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                  findingFilter === 'resolved'
                    ? 'border-cranberry-700 text-cranberry-800'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Resolved ({resolvedFindings.length})
              </button>
              <button
                type="button"
                onClick={() => setFindingFilter('all')}
                className={`pb-2 text-xs font-bold border-b-2 transition-colors ${
                  findingFilter === 'all'
                    ? 'border-cranberry-700 text-cranberry-800'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                All ({currentFindings.length})
              </button>
            </div>
          </div>

          {/* Finding Cards List */}
          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {displayedFindings.map((finding) => (
              <div key={finding.id} id={`finding-${finding.id}`}>
                <FindingCard
                  finding={finding}
                  isSelected={finding.id === selectedFindingId}
                  onSelect={() => setSelectedFindingId(finding.id)}
                  onAccept={handleAcceptFinding}
                  onEdit={handleEditFinding}
                  onDismiss={handleDismissFinding}
                  isLocked={submission.isLocked}
                />
              </div>
            ))}

            {displayedFindings.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
                No issues match the &quot;{findingFilter}&quot; filter in Version {currentVersion.versionNumber}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

