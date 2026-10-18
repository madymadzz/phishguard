import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { ArrowLeft, Clock } from "lucide-react";
import type { LearnArticle } from "@/types/database.types";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function LearnArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("learn_articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!article) {
    notFound();
  }

  const art = article as LearnArticle;

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Link
            href="/learn"
            className="p-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to Learn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {art.category}
          </span>
          <div className="w-5" />
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-5 py-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {art.read_minutes} min read
            </span>
            <span>•</span>
            <span className="text-[#0B5FFF] font-semibold">{art.category}</span>
          </div>

          <h1 className="text-2xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] leading-tight tracking-tight">
            {art.title}
          </h1>

          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed italic border-l-2 border-[#0B5FFF] pl-3">
            {art.summary}
          </p>
        </div>

        {/* Article Body */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-4 whitespace-pre-line">
          {art.body_md}
        </div>

        {/* Back Link CTA */}
        <div className="pt-2">
          <Link
            href="/learn"
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16222E] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>More Security Guides</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
