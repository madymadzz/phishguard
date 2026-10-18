"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setAuthError(null);
      const supabase = createClient();

      // Check if registration is open
      const { data: regSetting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "registration_open")
        .maybeSingle();

      if (regSetting?.value === false) {
        setAuthError("Registration is currently closed by the platform administrators.");
        return;
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      // If user is returned without identities, email already taken
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        setAuthError("An account with this email address already exists. Please log in.");
        return;
      }

      // If session exists immediately (email confirmation disabled), redirect to /home
      if (authData.session) {
        router.push("/home");
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch {
      setAuthError("An unexpected error occurred during signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 px-6 py-8 flex flex-col justify-between">
        <div className="w-full">
          {/* Top Header */}
          <div className="flex flex-col items-center text-center mt-2 mb-6">
            <Logo size="md" showWordmark={true} showTagline={false} className="mb-3" />
            <h1 className="text-2xl font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Create Account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Join PhishGuard to stay protected from deceptive links
            </p>
          </div>

          {/* Status Alerts */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDECEC] dark:bg-[#3A1012]/60 flex items-start gap-2.5 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{authError}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name or Nickname
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Juan Dela Cruz"
                {...register("displayName")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#16222E] text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF] focus:border-transparent transition-all"
              />
              {errors.displayName && (
                <p className="text-[11px] font-medium text-rose-500 mt-1">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
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
              className="w-full mt-3 py-3.5 px-4 bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-5 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#0B5FFF] hover:underline ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
