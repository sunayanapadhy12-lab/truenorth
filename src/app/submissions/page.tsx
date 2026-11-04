'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Layers,
} from 'lucide-react';
import { Submission } from '@/lib/types';

export default function SubmissionsListPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) setSubmissions(data.submissions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: Submission['currentStatus'], isLocked: boolean) => {
    if (isLocked || status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Approved & Locked</span>
        </span>
      );
    }

    switch (status) {
      case 'in_review':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            In Review
          </span>
        );
      case 'changes_requested':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Changes Requested
          </span>
        );
      case 'rejected':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cranberry-800 bg-cranberry-100 px-2 py-0.5 rounded-md border border-cranberry-200">
              Content Registry
            </span>
            <span className="text-xs text-slate-500 font-medium">Cranberry Labs Inc.</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Submissions & Brand Reviews
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review draft content versions, open findings, source citations, and human approvals.
          </p>
        </div>

        <Link
          href="/submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cranberry-700 hover:bg-cranberry-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Submission</span>
        </Link>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl p-8 space-y-4 max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No Draft Submissions Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Submit your first piece of copy or load one of the 3 realistic pre-seeded sample drafts to test the hybrid governance review engine.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cranberry-700 text-white font-semibold text-xs hover:bg-cranberry-800 shadow-sm"
          >
            <span>Create Submission or Load Sample</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {submissions.map((sub) => (
            <Link
              key={sub.id}
              href={`/submissions/${sub.id}`}
              className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-cranberry-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(sub.currentStatus, sub.isLocked)}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {sub.channel}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    Audience: {sub.audience}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-cranberry-700 transition-colors truncate">
                  {sub.title}
                </h3>

                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-600">{sub.creatorName}</strong></span>
                  <span>Updated: {new Date(sub.updatedAt).toLocaleDateString()}</span>
                  <span>ID: <code className="font-mono text-[10px]">{sub.id}</code></span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-cranberry-700 group-hover:underline block">
                    Inspect Review
                  </span>
                  <span className="text-[10px] text-slate-400">View highlights & diffs</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-cranberry-700 group-hover:border-cranberry-300 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

