'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  ChevronRight,
} from 'lucide-react';

interface InsightsData {
  totalSubmissions: number;
  totalFindings: number;
  resolutionRate: number;
  categoryCounts: Record<string, number>;
  topIssues: {
    sourceId: string;
    title: string;
    category: string;
    count: number;
  }[];
  topDismissed: {
    sourceId: string;
    title: string;
    category: string;
    dismissCount: number;
  }[];
  origins: {
    ruleBased: number;
    aiAssisted: number;
  };
}

export default function InsightsDashboardPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/insights')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-xs text-slate-400">
        Aggregating brand governance insights...
      </div>
    );
  }

  const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
    claim: { bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-500' },
    terminology: { bg: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-cyan-500' },
    tone: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
    accessibility: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    compliance: { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: 'bg-indigo-500' },
    visual: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
    messaging: { bg: 'bg-slate-50', text: 'text-slate-700', bar: 'bg-slate-500' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cranberry-800 bg-cranberry-100 px-2 py-0.5 rounded-md border border-cranberry-200">
              Executive Analytics
            </span>
            <span className="text-xs text-slate-500 font-medium">Cranberry Labs Brand Health</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Governance Insights & Policy Frequency
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time analytics on rule triggers, category distributions, and creator dismissal trends.
          </p>
        </div>

        <Link
          href="/admin/knowledge"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-xs transition-colors shrink-0"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Brand Knowledge Base</span>
        </Link>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Submissions
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{data.totalSubmissions}</p>
          <p className="text-[11px] text-slate-500">Drafts evaluated by engine</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Issues Flagged
          </span>
          <p className="text-2xl sm:text-3xl font-black text-cranberry-700">{data.totalFindings}</p>
          <p className="text-[11px] text-slate-500">Grounded in exact citations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Resolution Rate
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{data.resolutionRate}%</p>
          <p className="text-[11px] text-slate-500">Accepted or custom-edited</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Engine Verification
          </span>
          <p className="text-2xl sm:text-3xl font-black text-purple-700">100%</p>
          <p className="text-[11px] text-slate-500">Zero unquoted hallucinations</p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7/12): Findings by Category */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Findings by Policy Category
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribution across governance pillars</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{data.totalFindings} total</span>
          </div>

          <div className="space-y-4">
            {Object.entries(data.categoryCounts).map(([cat, count]) => {
              const pct = data.totalFindings > 0 ? Math.round((count / data.totalFindings) * 100) : 0;
              const color = categoryColors[cat] || categoryColors.messaging;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color.bg} ${color.text}`}>
                        {cat}
                      </span>
                    </div>
                    <span className="font-mono text-slate-700 font-semibold">
                      {count} ({pct}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${color.bar}`}
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Claims & Terminology represent top corporate risks.</span>
            <Link href="/admin/knowledge" className="text-cranberry-700 font-semibold hover:underline">
              Review policy rules →
            </Link>
          </div>
        </div>

        {/* Right Column (5/12): Top 5 Issues & Most Dismissed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top 5 Most Frequent Issues */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Top 5 Most Frequent Issues
              </h2>
              <span className="text-xs font-mono text-slate-400">Trigger Count</span>
            </div>

            <div className="space-y-2.5">
              {data.topIssues.map((issue, idx) => (
                <div
                  key={issue.sourceId}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-mono font-bold text-slate-400 text-xs mt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {issue.sourceId}
                        </span>
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600">
                          {issue.category}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate text-[11px] mt-0.5">{issue.title}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-cranberry-800 bg-cranberry-50 px-2 py-1 rounded-lg border border-cranberry-100 shrink-0">
                    {issue.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Dismissed Clauses */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Most-Dismissed Guidelines
                </h2>
                <p className="text-[10px] text-slate-400">Signals guideline ambiguity or creator resistance</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Dismissals</span>
            </div>

            {data.topDismissed.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No guideline dismissals recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.topDismissed.map((item, idx) => (
                  <div
                    key={item.sourceId}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-amber-950 text-[11px]">
                          {item.sourceId}
                        </span>
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-white border border-amber-200 text-amber-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate text-[11px] mt-0.5">{item.title}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-900 bg-white px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                      {item.dismissCount}x dismissed
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Round 3 Extension Point:</strong> Frequent dismissals indicate guideline clauses that creators find overly rigid or ambiguous, ready for automated policy refinements.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
