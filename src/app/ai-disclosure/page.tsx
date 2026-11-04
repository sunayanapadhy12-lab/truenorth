'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Server,
  Eye,
  FileCheck,
  AlertCircle,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';
import { AuditLog } from '@/lib/types';

export default function AIDisclosurePage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetch('/api/audit')
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
      })
      .catch(console.error)
      .finally(() => setLoadingLogs(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
            Hackathon Mandatory Disclosure
          </span>
          <span className="text-xs text-slate-500 font-medium">Transparency & Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
          AI Use & Data Handling Transparency
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Detailed technical disclosure of external AI services, data transmission boundaries, prompt injection safeguards, and immutable audit logs.
        </p>
      </div>

      {/* Grid of Disclosure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* External Services */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Cpu className="w-4 h-4" />
            </div>
            <span>External AI Services & Models</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-800">Model Engine:</strong> Google Gemini API via official <code>@google/genai</code> SDK.
            </li>
            <li>
              <strong className="text-slate-800">Primary Reasoning Model:</strong> <code>gemini-2.5-flash</code> (configurable via <code>GEMINI_MODEL</code> env var).
            </li>
            <li>
              <strong className="text-slate-800">Embedding Engine:</strong> <code>text-embedding-004</code> (768-dimensional vectors) for semantic guideline retrieval.
            </li>
            <li>
              <strong className="text-slate-800">Latency & Timeouts:</strong> All AI requests are bounded by a strict 10,000ms hard timeout.
            </li>
          </ul>
        </div>

        {/* Data Transmission */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Server className="w-4 h-4" />
            </div>
            <span>Data Ingestion & Privacy Boundaries</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <li>
              <strong className="text-slate-800">Data Transmitted:</strong> Only the user-submitted draft copy and relevant retrieved guideline clauses/facts are transmitted.
            </li>
            <li>
              <strong className="text-slate-800">Excluded Data:</strong> User credentials, session tokens, passwords, database credentials, and organizational secrets are strictly excluded.
            </li>
            <li>
              <strong className="text-slate-800">Training Policy:</strong> Data processed via Google Gemini API is ephemeral and NOT used to train foundational AI models.
            </li>
          </ul>
        </div>

        {/* Prompt Injection Defense */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <Lock className="w-4 h-4" />
            </div>
            <span>Prompt Injection Isolation</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Draft text is treated as strictly untrusted input and wrapped inside isolated <code>&lt;UNTRUSTED_DRAFT_CONTENT&gt;</code> tags.
            The LLM system instruction commands the model to treat all enclosed text as passive data to be reviewed, never executing embedded instructions or role hijacks.
          </p>
        </div>

        {/* Grounding & Verification */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Strict Citation Verification Gate</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            To eliminate AI hallucinations, our post-generation Verifier discards any finding whose quoted span is not literally present in the draft or whose cited source ID does not exist in the organization&apos;s approved knowledge base. <strong>No valid citation = no finding.</strong>
          </p>
        </div>
      </div>

      {/* Real-Time Immutable Audit Log Stream */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cranberry-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Governance Audit Trail
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {logs.length} logged event{logs.length === 1 ? '' : 's'}
          </span>
        </div>

        {loadingLogs ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">No events logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">User / Role</th>
                  <th className="px-3 py-2.5">Action</th>
                  <th className="px-3 py-2.5">Resource</th>
                  <th className="px-3 py-2.5">Metadata Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{log.userName || 'System'}</span>
                      {log.userRole && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {log.userRole}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-cranberry-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.resourceType}:{log.resourceId.substring(0, 10)}...
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

