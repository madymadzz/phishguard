"use client";

import { AlertOctagon, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 shadow-sm">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-widest font-mono text-red-400 font-semibold mb-2">
          Critical Failure
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
          Application encountered a critical error
        </h1>

        <p className="text-sm text-slate-400 max-w-md mb-6">
          The top-level application shell failed to initialize. Please try restarting the session.
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-slate-500 mb-6 bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
            Digest: {error.digest}
          </p>
        )}

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reload Application
        </button>
      </body>
    </html>
  );
}
