import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-cranberry-50 border border-cranberry-200 text-cranberry-700 flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">404 - Page Not Found</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested page could not be located. You can navigate back to the home dashboard or submit a draft for brand review.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cranberry-700 text-white font-semibold text-xs hover:bg-cranberry-800 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to TrueNorth Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

