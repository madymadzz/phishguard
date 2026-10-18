"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Logo } from "@/components/ui/logo";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  const errorParam = searchParams.get("error");
  const messageParam = searchParams.get("message");

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(
    errorParam === "suspended"
      ? "Your account has been suspended by an administrator."
      : errorParam === "auth_callback_failed"
      ? "Authentication verification failed. Please try logging in again."
      : null
  );
  const [authSuccess] = useState<string | null>(
    messageParam === "password_reset"
      ? "Password updated successfully. Please log in with your new password."
      : null
  );
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setAuthError(null);
      const supabase = createClient();

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setAuthError("Incorrect email or password. Please verify and try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setAuthError("Please check your email and click the confirmation link before logging in.");
        } else {
          setAuthError(error.message);
        }
        return;
      }

      // Check if user is suspended
      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile?.status === "suspended") {
          await supabase.auth.signOut();
          setAuthError("Your account has been suspended by an administrator.");
          return;
        }
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 px-6 py-8 flex flex-col justify-between">
      <div className="w-full">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <Logo size="md" showWordmark={true} showTagline={false} className="mb-4" />
          <h1 className="text-2xl font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log in to protect your links and view scan history
          </p>
        </div>

        {/* Status Alerts */}
        {authError && (
          <div className="mb-5 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[#FDECEC] dark:bg-[#3A1012]/60 flex items-start gap-2.5 text-xs text-[#B91C1C] dark:text-[#FCA5A5]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="mb-5 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-[#E6F6EC] dark:bg-[#0E2E1C]/60 flex items-start gap-2.5 text-xs text-[#13733A] dark:text-[#4ADE80]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{authSuccess}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#0B5FFF] hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
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
            {errors.password && (
              <p className="text-[11px] font-medium text-rose-500 mt-1">
                {errors.password.message}
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
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer Link */}
      <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-bold text-[#0B5FFF] hover:underline ml-1"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </AppShell>
  );
}
