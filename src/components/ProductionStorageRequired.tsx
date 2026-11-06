import React from 'react';
import { ShieldAlert, Database, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

export function ProductionStorageRequired() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-2xl w-full bg-slate-800/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Production Safety Gate
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            In-Memory Mock Blocked
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 flex items-center gap-3">
          Production Storage Required
        </h1>

        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          In production (<code className="text-amber-300 bg-slate-900/80 px-1.5 py-0.5 rounded text-xs">NODE_ENV=production</code> or Vercel),
          TrueNorth strictly disables silent fallback to the ephemeral in-memory mock store to ensure persistent audit trails, immutable versioning, and compliance sign-offs are not lost across serverless restarts.
        </p>

        {/* Error Details Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-200">Missing Required Production Environment Variables:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono">
                <li><span className="text-amber-300">NEXT_PUBLIC_SUPABASE_URL</span> (Valid Supabase project URL)</li>
                <li><span className="text-amber-300">SUPABASE_SERVICE_ROLE_KEY</span> (or <span className="text-amber-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to Resolve */}
        <div className="space-y-4 text-xs text-slate-300 border-t border-slate-700/60 pt-5 mb-6">
          <h3 className="text-sm font-semibold text-white">How to Resolve</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>
              Provision a PostgreSQL database with <code className="text-indigo-300">pgvector</code> on Supabase.
            </li>
            <li>
              Add your credentials under <strong>Vercel Project Settings &rarr; Environment Variables</strong> (or your server environment).
            </li>
            <li>
              Redeploy the application or restart your production container.
            </li>
          </ol>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-700/60">
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white transition-colors"
          >
            Check /api/health
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </a>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        TrueNorth Governance Engine &bull; Inkloom AI Hackathon
      </p>
    </div>
  );
}
