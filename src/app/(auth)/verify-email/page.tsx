"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    try {
      setResending(true);
      setResendError(null);
      setResendSuccess(false);

      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setResendError(error.message);
      } else {
        setResendSuccess(true);
      }
    } catch {
      setResendError("Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex-1 px-6 py-10 flex flex-col items-center justify-between text-center">
      <div className="w-full flex flex-col items-center mt-4">
        <Logo size="md" showWordmark={true} showTagline={false} className="mb-6" />

        {/* Mail Icon Highlight */}
        <div className="w-16 h-16 rounded-2xl bg-[#EBF2FF] dark:bg-[#1E293B] flex items-center justify-center text-[#0B5FFF] mb-4 shadow-sm">
          <Mail className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
          Check Your Email
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xs leading-relaxed">
          We sent a verification link to:
        </p>

        <p className="text-sm font-bold text-[#0B5FFF] mt-1 break-all px-2">
          {email || "your registered email"}
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 max-w-xs leading-relaxed">
          Please click the confirmation link in the email to activate your PhishGuard account.
        </p>

        {/* Resend status alerts */}
        {resendSuccess && (
          <div className="mt-4 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-[#E6F6EC] dark:bg-[#0E2E1C]/60 flex items-center gap-2 text-xs text-[#13733A] dark:text-[#4ADE80]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Verification email resent successfully!</span>
          </div>
        )}

        {resendError && (
          <div className="mt-4 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDECEC] dark:bg-[#3A1012]/60 flex items-center gap-2 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{resendError}</span>
          </div>
        )}

        {email && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="mt-6 text-xs font-semibold text-[#0B5FFF] hover:underline flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {resending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Didn&apos;t receive it? Resend email</span>
          </button>
        )}
      </div>

      <div className="w-full pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading…</div>}>
        <VerifyEmailContent />
      </Suspense>
    </AppShell>
  );
}
