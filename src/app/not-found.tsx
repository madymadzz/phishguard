import Link from "next/link";
import { ShieldAlert, ArrowLeft, Scan } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground font-semibold mb-2">
        404 — Page Not Found
      </span>

      <h1 className="text-3xl font-extrabold tracking-tight mb-3">
        Lost in Cyberspace?
      </h1>

      <p className="text-sm text-muted-foreground max-w-md mb-8">
        The destination you are trying to reach does not exist or may have been relocated. Rest assured, your security is intact.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/scan"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
        >
          <Scan className="w-4 h-4" />
          Scan URL
        </Link>
      </div>
    </div>
  );
}
