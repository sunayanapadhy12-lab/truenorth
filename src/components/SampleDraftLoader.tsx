'use client';

import React from 'react';
import { SEED_SAMPLE_DRAFTS, SampleDraft } from '@/lib/seed/cranberry-labs-data';
import { Sparkles, FileText, ChevronRight, AlertCircle } from 'lucide-react';

interface SampleDraftLoaderProps {
  onSelect: (draft: SampleDraft) => void;
}

export function SampleDraftLoader({ onSelect }: SampleDraftLoaderProps) {
  return (
    <div className="bg-gradient-to-r from-cranberry-50 via-rose-50/50 to-amber-50/30 border border-cranberry-200 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cranberry-700 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Zero-Friction Judge Testing: Load Sample Drafts
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any realistic pre-seeded draft below to populate the form instantly with authentic brand violations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SEED_SAMPLE_DRAFTS.map((draft, idx) => (
          <button
            key={draft.id}
            type="button"
            onClick={() => onSelect(draft)}
            className="group text-left p-3.5 rounded-xl bg-white border border-cranberry-100/80 hover:border-cranberry-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cranberry-50 text-cranberry-800 border border-cranberry-200">
                  Sample {idx + 1}: {draft.channel}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{draft.audience}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-cranberry-700 transition-colors line-clamp-1">
                {draft.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {draft.description}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-cranberry-700">
              <span>Load this draft</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
