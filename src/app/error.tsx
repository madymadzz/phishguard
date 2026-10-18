"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error to console
    console.error("App boundary error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-6 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="text-xs uppercase tracking-widest font-mono text-destructive font-semibold mb-2">
        System Error
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
        Something went wrong
      </h1>

      <p className="text-sm text-muted-foreground max-w-md mb-2">
        An unexpected application error occurred while processing your request.
      </p>

      {error.digest && (
        <p className="text-xs font-mono text-muted-foreground/70 mb-6 bg-muted px-3 py-1 rounded-md">
          Error Digest: {error.digest}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mt-4">
        <button
          onClick={() => reset()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
