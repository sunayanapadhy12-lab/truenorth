'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Lock,
  Search,
  BookOpen,
  UserCheck,
  UserCog,
} from 'lucide-react';

export default function HomePage() {
  const switchRoleAndGo = async (role: string, targetPath: string) => {
    try {
      await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      window.location.href = targetPath;
    } catch {
      window.location.href = targetPath;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cranberry-50 border border-cranberry-200 text-cranberry-800 text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cranberry-600" />
            <span>Inkloom AI Hackathon (Round 2: The Build)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.15]">
            Pre-publication brand governance,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cranberry-600 to-cranberry-900">
              grounded in verified truth.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Content goes in. It is checked against approved guidelines, terminology, and facts.
            Every issue is proven with an exact cited source. A human makes the final decision.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/submit"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-cranberry-700 hover:bg-cranberry-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Try the Demo (No Signup Required)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/knowledge"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm shadow-xs transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Explore Brand Knowledge (25 Clauses)</span>
            </Link>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            Pre-seeded with fictional org <strong className="text-slate-700">Cranberry Labs Inc.</strong> — ready for instant judge evaluation.
          </p>
        </div>
      </section>

      {/* 60-Second Judge Guide */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-cranberry-700 bg-cranberry-50 px-2.5 py-1 rounded-full border border-cranberry-200">
            60-Second Walkthrough
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            How TrueNorth Enforces Brand Truth
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            No empty dashboards. Run the complete pipeline end-to-end in five clicks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs mb-3">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Brand Knowledge</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                25 guideline clauses, 15+ banned/preferred terms, 12 approved facts (with expired items), and color palette.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-purple-700 font-medium">
              <Layers className="w-3.5 h-3.5" />
              <span>Admin Hub</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs mb-3">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Submit & Sample</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Paste draft or click <em>Load Sample Draft</em> (3 realistic drafts with banned claims, expired prices & bad casing).
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>Creator Action</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Hybrid Engine</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deterministic rules check superlatives & terms. Retrieval finds relevant clauses. Gemini judges. Verifier discards hallucinated findings.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-blue-700 font-medium">
              <Search className="w-3.5 h-3.5" />
              <span>Strict Citation</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs mb-3">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Review & Resolve</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inline text highlights mapped to exact findings. Accept, edit, or dismiss with reason. Every edit creates an immutable version.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diff & Versions</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-xs mb-3">
                5
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Human Approval</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review diffs and open issues. Manager approves standard content. Legal Reviewer role required for claim/fact approval. Version locked!
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-rose-700 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Role-Gated RBAC</span>
            </div>
          </div>
        </div>
      </section>

      {/* 1-Click Role Switcher Demo Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900">1-Click Persona Simulator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Click any persona below to switch identities instantly. Server-side permissions adapt immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Creator */}
          <button
            onClick={() => switchRoleAndGo('creator', '/submit')}
            className="group text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <UserCheck className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Creator
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                Alex Rivera
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Content Strategist. Submits copy, tests sample drafts, reviews highlighted findings, and accepts suggested rewrites.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Start as Creator</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Manager */}
          <button
            onClick={() => switchRoleAndGo('manager', '/approvals')}
            className="group text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Manager
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                Marcus Vance
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Head of Communications. Inspects version diffs, writes threaded comments, requests changes, and approves standard content.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>Inspect Approvals</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Reviewer */}
          <button
            onClick={() => switchRoleAndGo('reviewer', '/approvals')}
            className="group text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Reviewer (Legal)
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-rose-700 transition-colors">
                Dr. Elena Rostova
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Legal & Compliance Officer. Exclusive authority to sign off on claim-sensitive and fact-sensitive copy before locking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-700">
              <span>Review Legal Approvals</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Admin */}
          <button
            onClick={() => switchRoleAndGo('admin', '/admin/knowledge')}
            className="group text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                  <UserCog className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Admin
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                Sarah Chen
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Brand Guardian. Manages guidelines, clause records, terminology dictionaries, facts, color palettes, and resets demo data.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700">
              <span>Manage Brand Knowledge</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* Safety & Fallback Callout */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-cranberry-300 border border-slate-700 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-cranberry-400" />
              <span>Resilient Architecture</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Deterministic Fallback & Hallucination Elimination
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If the Gemini API key is missing or encounters a timeout, the review engine seamlessly falls back to deterministic rule matching. Furthermore, our strict verifier rejects any finding without an exact verbatim draft quote and valid knowledge base citation ID.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/submit"
              className="px-5 py-3 rounded-xl bg-cranberry-600 hover:bg-cranberry-700 text-white font-semibold text-xs text-center transition-colors"
            >
              Test Review Pipeline
            </Link>
            <Link
              href="/ai-disclosure"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs text-center transition-colors"
            >
              AI Disclosure & Privacy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
