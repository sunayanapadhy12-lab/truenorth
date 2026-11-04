'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Lock,
  ArrowRight,
  GitCompare,
  MessageSquare,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { Submission, SubmissionVersion, Finding, Comment, User } from '@/lib/types';
import { DiffViewer } from '@/components/DiffViewer';

export default function ApprovalsDashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Inspection state
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedSubDetail, setSelectedSubDetail] = useState<{
    submission: Submission;
    versions: SubmissionVersion[];
    comments: Comment[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Decision form
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, subRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/submissions').then((r) => r.json()),
      ]);

      if (userRes.user) setCurrentUser(userRes.user);
      if (subRes.submissions) setSubmissions(subRes.submissions);
    } catch (err) {
      console.error('Error fetching approvals data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openInspection = async (id: string) => {
    setSelectedSubId(id);
    setLoadingDetail(true);
    setDecisionError(null);
    setDecisionComment('');
    try {
      const res = await fetch(`/api/submissions/${id}`);
      const data = await res.json();
      if (data.submission) {
        setSelectedSubDetail(data);
      }
    } catch {
      alert('Error loading submission details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDecision = async (decision: 'approve' | 'request_changes' | 'reject') => {
    if (!selectedSubId) return;
    setDecisionError(null);
    setActionLoading(true);

    try {
      const res = await fetch(`/api/submissions/${selectedSubId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          comment: decisionComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process decision');
      }

      // Close modal and refresh list
      setSelectedSubId(null);
      setSelectedSubDetail(null);
      await fetchData();
    } catch (err: unknown) {
      setDecisionError(err instanceof Error ? err.message : 'Error processing approval');
    } finally {
      setActionLoading(false);
    }
  };

  const isReviewer = currentUser?.role === 'reviewer';
  const isManager = currentUser?.role === 'manager';
  const canDecide = isReviewer || isManager || currentUser?.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
              Human Sign-Off Gateway
            </span>
            <span className="text-xs text-slate-500 font-medium">RBAC Triage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Manager & Legal Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Human-in-the-loop governance decisions. Approved submissions are permanently locked.
          </p>
        </div>

        {/* Current Active Persona Badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
            {isReviewer ? (
              <ShieldCheck className="w-5 h-5 text-rose-600" />
            ) : isManager ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            ) : (
              <UserCheck className="w-5 h-5 text-slate-600" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.name}</p>
            <p className="text-[11px] text-slate-500">
              Role: <strong className="uppercase text-slate-700">{currentUser?.role}</strong>
              {isReviewer && ' (Authorized for Claims)'}
            </p>
          </div>
        </div>
      </div>

      {/* Role explanation alert */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>RBAC Governance Rule:</strong> Content with factual or superlative claim findings strictly requires the{' '}
            <strong className="text-rose-700">Legal Reviewer role (Dr. Elena Rostova)</strong> for final sign-off. Standard marketing copy can be approved by the{' '}
            <strong className="text-blue-700">Manager role (Marcus Vance)</strong>.
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium shrink-0">
          Enforced server-side
        </span>
      </div>

      {/* Submissions Queue */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading approvals queue...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl p-8 space-y-3 max-w-md mx-auto">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Approvals Queue is Clear</h3>
          <p className="text-xs text-slate-500">
            No submissions are currently pending review. Submit copy from the creator workspace to test.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cranberry-700 text-white font-semibold text-xs"
          >
            Go to Submit Page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((sub) => {
            const isApproved = sub.isLocked || sub.currentStatus === 'approved';
            return (
              <div
                key={sub.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Approved & Locked</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {sub.currentStatus}
                      </span>
                    )}

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {sub.channel}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      Audience: {sub.audience}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {sub.title}
                  </h3>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span>Creator: <strong>{sub.creatorName}</strong></span>
                    <span>Updated: {new Date(sub.updatedAt).toLocaleTimeString()}</span>
                    <span>ID: <code className="font-mono text-[10px]">{sub.id}</code></span>
                  </div>
                </div>

                {/* Right: Inspection & Decision Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/submissions/${sub.id}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    View Highlights
                  </Link>

                  {!isApproved && (
                    <button
                      onClick={() => openInspection(sub.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cranberry-700 hover:bg-cranberry-800 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Review & Decide</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      {selectedSubId && selectedSubDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cranberry-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Human Approval Sign-Off: {selectedSubDetail.submission.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {decisionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Approval Blocked by Server RBAC:</p>
                  <p className="mt-0.5">{decisionError}</p>
                </div>
              </div>
            )}

            {/* Version & Findings Details */}
            {(() => {
              const latestVer = selectedSubDetail.versions[selectedSubDetail.versions.length - 1];
              const prevVer = selectedSubDetail.versions.length > 1 ? selectedSubDetail.versions[selectedSubDetail.versions.length - 2] : undefined;
              const openFindings = (latestVer?.findings || []).filter((f) => f.status === 'open');
              const hasClaimViolations = (latestVer?.findings || []).some((f) => f.category === 'claim' || f.sourceType === 'fact');

              return (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Version:</span>
                      <span className="font-mono font-bold text-slate-800">Version {latestVer?.versionNumber}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Open Issues:</span>
                      <span className={`font-mono font-bold ${openFindings.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {openFindings.length} Unresolved
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs col-span-2 sm:col-span-1">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Claim / Fact Policy:</span>
                      {hasClaimViolations ? (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Reviewer Required</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Standard Sign-Off</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Preview or Diff */}
                  {prevVer ? (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Diff against Version {prevVer.versionNumber}:
                      </p>
                      <DiffViewer
                        oldContent={prevVer.content}
                        newContent={latestVer.content}
                        oldVersionNum={prevVer.versionNumber}
                        newVersionNum={latestVer.versionNumber}
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Version 1 Content:
                      </p>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {latestVer?.content}
                      </div>
                    </div>
                  )}

                  {/* Feedback / Review Comment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Decision Rationale / Comment (Optional for approve, recommended for changes):
                    </label>
                    <textarea
                      rows={3}
                      value={decisionComment}
                      onChange={(e) => setDecisionComment(e.target.value)}
                      placeholder="e.g. Approved copy complies with FTC claims standards and updated 2026 pricing schedule..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cranberry-500/20"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Signing as: <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.role})
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleDecision('reject')}
                        disabled={actionLoading}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision('request_changes')}
                        disabled={actionLoading}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        Request Changes
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision('approve')}
                        disabled={actionLoading}
                        className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors ${
                          hasClaimViolations && !isReviewer
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                        title={hasClaimViolations && !isReviewer ? 'Reviewer role required for claims' : 'Approve and lock version'}
                      >
                        Approve & Lock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
