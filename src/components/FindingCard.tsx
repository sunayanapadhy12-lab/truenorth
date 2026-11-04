'use client';

import React, { useState } from 'react';
import { Finding, Severity, ClauseCategory } from '@/lib/types';
import {
  Check,
  Edit2,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  isSelected: boolean;
  onSelect: () => void;
  onAccept: (findingId: string) => Promise<void>;
  onEdit: (findingId: string, customEdit: string) => Promise<void>;
  onDismiss: (findingId: string, dismissReason: string) => Promise<void>;
  isLocked?: boolean;
}

export function FindingCard({
  finding,
  isSelected,
  onSelect,
  onAccept,
  onEdit,
  onDismiss,
  isLocked = false,
}: FindingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customText, setCustomText] = useState(finding.suggestedRewrite || finding.quotedSpan);

  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleAcceptClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await onAccept(finding.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customText.trim()) return;
    setActionLoading(true);
    try {
      await onEdit(finding.id, customText.trim());
      setIsEditing(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dismissReason.trim()) return;
    setActionLoading(true);
    try {
      await onDismiss(finding.id, dismissReason.trim());
      setIsDismissing(false);
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const isOpen = finding.status === 'open';

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border p-4 transition-all cursor-pointer ${
        isSelected
          ? 'bg-white border-cranberry-500 shadow-md ring-2 ring-cranberry-500/20'
          : isOpen
          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          : 'bg-slate-50 border-slate-200/60 opacity-80'
      }`}
    >
      {/* Top Meta: Category, Severity, Origin Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getSeverityBadge(finding.severity)}`}>
            {finding.severity}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {finding.category}
          </span>
        </div>

        {/* Origin Pill (Rule-based vs AI-assisted) */}
        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
          {finding.origin === 'rule-based' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Rule-Based (100%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>AI-Assisted ({Math.round(finding.confidence * 100)}%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Quoted Text */}
      <div className="my-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 break-words">
        <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block mb-0.5">Flagged Span:</span>
        <span className="bg-rose-100 text-rose-900 px-1 py-0.2 rounded font-semibold">
          &quot;{finding.quotedSpan}&quot;
        </span>
      </div>

      {/* Reason */}
      <p className="text-xs text-slate-700 leading-relaxed mt-2">
        {finding.reason}
      </p>

      {/* Source Citation Badge */}
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Citation:</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-cranberry-50 text-cranberry-800 border border-cranberry-200">
          {finding.sourceId}
        </span>
        <span className="text-[10px] text-slate-400 capitalize">({finding.sourceType})</span>
      </div>

      {/* Suggested Rewrite with Diff Strikethrough/Green */}
      {finding.suggestedRewrite && isOpen && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
            Suggested Replacement:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="line-through text-slate-400 text-xs">{finding.quotedSpan}</span>
            <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="font-semibold text-emerald-900 bg-emerald-100 px-1 py-0.5 rounded">
              {finding.suggestedRewrite}
            </span>
          </div>
        </div>
      )}

      {/* Resolution Status for Non-Open Findings */}
      {!isOpen && (
        <div className="mt-3 p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs flex items-start gap-2">
          <Check className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-800 capitalize">Status: {finding.status}</p>
            {finding.dismissReason && (
              <p className="text-[11px] text-slate-600 mt-0.5">
                Reason: &quot;{finding.dismissReason}&quot;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions (Open Findings only) */}
      {isOpen && !isLocked && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          {!isEditing && !isDismissing && (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDismissing(true);
                }}
                disabled={actionLoading}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                Dismiss
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>

              {finding.suggestedRewrite && (
                <button
                  type="button"
                  onClick={handleAcceptClick}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Suggestion</span>
                </button>
              )}
            </div>
          )}

          {/* Inline Edit Form */}
          {isEditing && (
            <form onSubmit={handleEditSubmit} onClick={(e) => e.stopPropagation()} className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">Custom Replacement:</label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-cranberry-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-cranberry-700 text-white"
                >
                  Apply Custom Edit
                </button>
              </div>
            </form>
          )}

          {/* Dismiss Reason Form */}
          {isDismissing && (
            <form onSubmit={handleDismissSubmit} onClick={(e) => e.stopPropagation()} className="space-y-2">
              <label className="block text-[11px] font-bold text-rose-800">
                Reason for Dismissal (Required for Audit Trail):
              </label>
              <textarea
                required
                rows={2}
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g. Legal exception granted for experimental beta release..."
                className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-rose-50/30 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDismissing(false)}
                  className="px-2 py-1 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !dismissReason.trim()}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-700 text-white disabled:opacity-50"
                >
                  Confirm Dismissal
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
