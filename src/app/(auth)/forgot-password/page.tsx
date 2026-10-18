"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Prevent user enumeration by not revealing if user exists, unless rate-limited
        if (error.message.toLowerCase().includes("rate limit")) {
          setErrorMessage("Too many requests. Please wait a few minutes before trying again.");
          return;
        }
      }

      setSubmitted(true);
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 px-6 py-8 flex flex-col justify-between">
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col items-center text-center mt-4 mb-6">
            <Logo size="md" showWordmark={true} showTagline={false} className="mb-4" />
            <h1 className="text-2xl font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Forgot Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDECEC] dark:bg-[#3A1012]/60 flex items-start gap-2.5 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {submitted ? (
            <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-[#E6F6EC] dark:bg-[#0E2E1C]/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/80 flex items-center justify-center text-[#22A559] mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-[#13733A] dark:text-[#4ADE80]">
                Reset Link Dispatched
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                If an account exists with that email address, you will receive password reset instructions shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="student@tip.edu.ph"
                  {...register("email")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16222E] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF] focus:border-transparent transition-all"
                />
                {errors.email && (
                  <p className="text-[11px] font-medium text-rose-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending reset link…</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to Login */}
        <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
