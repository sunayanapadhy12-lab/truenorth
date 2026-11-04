'use client';

import React from 'react';
import { diffWordsWithSpace } from 'diff';

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldVersionNum: number;
  newVersionNum: number;
}

export function DiffViewer({
  oldContent,
  newContent,
  oldVersionNum,
  newVersionNum,
}: DiffViewerProps) {
  const diffParts = diffWordsWithSpace(oldContent, newContent);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <span>Comparing Changes:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            Version {oldVersionNum}
          </span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200">
            Version {newVersionNum}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-rose-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>Removed</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Added</span>
          </span>
        </div>
      </div>

      <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
        {diffParts.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-emerald-100 text-emerald-950 px-1 py-0.5 rounded font-semibold border-b border-emerald-500"
              >
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span
                key={index}
                className="bg-rose-100 text-rose-950 px-1 py-0.5 rounded line-through text-opacity-80"
              >
                {part.value}
              </span>
            );
          }
          return <span key={index}>{part.value}</span>;
        })}
      </div>
    </div>
  );
}

