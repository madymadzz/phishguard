"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push("/login?message=password_reset");
    } catch {
      setErrorMessage("Failed to reset password. Please try requesting a new link.");
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
              Set New Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Choose a strong, unique password for your account.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDECEC] dark:bg-[#3A1012]/60 flex items-start gap-2.5 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min 8 characters"
                  {...register("password")}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16222E] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={passwordValue} />
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  {...register("confirmPassword")}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16222E] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] font-medium text-rose-500 mt-1">
                  {errors.confirmPassword.message}
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
                  <span>Updating password…</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
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
