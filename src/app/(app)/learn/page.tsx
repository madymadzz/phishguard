import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { BookOpen, Clock, ArrowRight, Shield } from "lucide-react";
import type { LearnArticle } from "@/types/database.types";

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("learn_articles")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const articleList = (articles || []) as LearnArticle[];

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0B5FFF]" />
            <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Learn About Phishing
            </span>
          </div>
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-5 py-6 space-y-5">
        {/* Header Hero */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-[#0B5FFF] text-white space-y-1 shadow-md shadow-blue-500/10">
          <div className="flex items-center gap-1.5 text-blue-100 text-[11px] font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Cyber Education</span>
          </div>
          <h1 className="text-lg font-black tracking-tight">Stay Ahead of Scam Tactics</h1>
          <p className="text-xs text-blue-100 leading-relaxed">
            Essential guides on detecting fake URLs, preventing QR scams, and responding to cyber incidents.
          </p>
        </div>

        {/* Article Cards List */}
        <div className="space-y-3">
          {articleList.map((art) => (
            <Link
              key={art.id}
              href={`/learn/${art.slug}`}
              className="block p-4 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 hover:border-[#0B5FFF] dark:hover:border-[#0B5FFF] hover:shadow-sm transition-all active:scale-[0.99] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B5FFF] px-2 py-0.5 rounded-full bg-[#EBF2FF] dark:bg-[#1E293B]">
                  {art.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  {art.read_minutes} min read
                </span>
              </div>

              <div>
                <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] leading-snug">
                  {art.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-[#0B5FFF] pt-1">
                <span>Read guide</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
