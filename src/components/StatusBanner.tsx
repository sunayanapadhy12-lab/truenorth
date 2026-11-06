'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Database, Sparkles, X } from 'lucide-react';

interface StatusBannerProps {
  forcedAiFallbackReason?: string;
}

export function StatusBanner({ forcedAiFallbackReason }: StatusBannerProps) {
  const [isMockMode, setIsMockMode] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setIsMockMode(Boolean(data.isMockMode));
      })
      .catch(() => setIsMockMode(true));
  }, []);

  if (dismissed) return null;

  if (forcedAiFallbackReason) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-300 text-amber-900 px-4 py-2.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold text-amber-800">AI Check Fallback Active:</span>
          <span>{forcedAiFallbackReason} (Rule-based deterministic results only. App will never crash.)</span>
        </div>
      </div>
    );
  }

  if (isMockMode) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-300 text-amber-950 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold bg-amber-200 text-amber-900 border border-amber-300">
              <Database className="w-3.5 h-3.5 text-amber-800" />
              Demo data is not persisted
            </span>
            <span className="text-amber-900 hidden md:inline">
              Running in in-memory mock store. All submissions, edits, and audit logs will reset on server restart. Connect Supabase for persistent cloud storage.
            </span>
            <span className="text-amber-800 md:hidden">
              In-memory mock active (resets on restart).
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-700 hover:text-amber-950 p-0.5 rounded transition-colors"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

