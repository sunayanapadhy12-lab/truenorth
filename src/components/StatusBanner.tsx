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
      <div className="bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-blue-900">Running in Local Mock Mode:</span>
            <span className="text-blue-800 hidden md:inline">
              Supabase credentials not detected in env vars. State persists in memory for rapid local testing. Connect Supabase before deploying to Vercel serverless.
            </span>
            <span className="text-blue-800 md:hidden">
              Local in-memory mock active.
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-500 hover:text-blue-800 p-0.5 rounded transition-colors"
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
