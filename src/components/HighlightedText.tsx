'use client';

import React from 'react';
import { Finding, Severity } from '@/lib/types';

interface HighlightedTextProps {
  content: string;
  findings: Finding[];
  selectedFindingId?: string;
  onSelectFinding: (findingId: string) => void;
}

interface TextSegment {
  text: string;
  finding?: Finding;
  isHighlight: boolean;
}

export function HighlightedText({
  content,
  findings,
  selectedFindingId,
  onSelectFinding,
}: HighlightedTextProps) {
  // Filter for open findings that have valid character positions
  const openFindings = findings
    .filter((f) => f.status === 'open' && f.spanStart !== undefined && f.spanEnd !== undefined)
    .sort((a, b) => (a.spanStart || 0) - (b.spanStart || 0));

  if (openFindings.length === 0) {
    return (
      <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-800 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
        {content}
      </div>
    );
  }

  // Build contiguous text segments
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const finding of openFindings) {
    const start = finding.spanStart!;
    const end = finding.spanEnd!;

    // Guard against out-of-order or overlapping spans
    if (start < currentIndex) continue;

    // Normal text before this finding
    if (start > currentIndex) {
      segments.push({
        text: content.substring(currentIndex, start),
        isHighlight: false,
      });
    }

    // Highlighted text
    segments.push({
      text: content.substring(start, end),
      finding,
      isHighlight: true,
    });

    currentIndex = end;
  }

  // Remaining tail text
  if (currentIndex < content.length) {
    segments.push({
      text: content.substring(currentIndex),
      isHighlight: false,
    });
  }

  const getHighlightClass = (sev: Severity, isSelected: boolean) => {
    const base = 'px-1 py-0.5 rounded transition-all cursor-pointer inline font-medium';
    const ring = isSelected ? 'ring-2 ring-cranberry-700 ring-offset-1 font-bold' : '';

    switch (sev) {
      case 'critical':
        return `${base} bg-rose-100 text-rose-950 border-b-2 border-rose-500 hover:bg-rose-200 ${ring}`;
      case 'warning':
        return `${base} bg-amber-100 text-amber-950 border-b-2 border-amber-500 hover:bg-amber-200 ${ring}`;
      case 'info':
        return `${base} bg-blue-100 text-blue-950 border-b-2 border-blue-500 hover:bg-blue-200 ${ring}`;
    }
  };

  return (
    <div className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-slate-800 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
      {segments.map((seg, i) => {
        if (!seg.isHighlight || !seg.finding) {
          return <span key={i}>{seg.text}</span>;
        }

        const isSelected = seg.finding.id === selectedFindingId;
        return (
          <span
            key={i}
            onClick={() => onSelectFinding(seg.finding!.id)}
            className={getHighlightClass(seg.finding.severity, isSelected)}
            title={`Issue: ${seg.finding.reason} (${seg.finding.sourceId})`}
          >
            {seg.text}
          </span>
        );
      })}
    </div>
  );
}

