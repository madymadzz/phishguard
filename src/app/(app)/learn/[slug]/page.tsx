import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import type { LearnArticle } from "@/types/database.types";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Search,
  BookOpen,
  ChevronRight,
} from "lucide-react";

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
    .eq("published", true)
    .maybeSingle();

  if (!article) {
    notFound();
  }

  const art = article as LearnArticle;

  // Fetch next article for recommendation
  const { data: nextArticle } = await supabase
    .from("learn_articles")
    .select("slug, title, category, read_minutes")
    .eq("published", true)
    .neq("slug", slug)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <Link
            href="/learn"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Back to Learn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {art.category}
          </span>
          <div className="w-8" />
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Article Header Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] font-bold text-[10px] uppercase">
              {art.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{art.read_minutes} min read</span>
            </span>
          </div>

          <h1 className="text-xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] leading-tight tracking-tight">
            {art.title}
          </h1>

          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-[#0B5FFF] pl-3 py-0.5">
            {art.summary}
          </p>
        </div>

        {/* Article Body Rendered via Markdown */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 shadow-sm">
          <MarkdownRenderer content={art.body_md} />
        </div>

        {/* Action Callout: Verify Link Now */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-[#0B5FFF] text-[10px] font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Put Theory to Practice</span>
            </div>
            <p className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Inspect a suspicious link right now
            </p>
          </div>
          <Link
            href="/scan/url"
            className="py-2 px-3.5 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold shadow-md shadow-[#0B5FFF]/20 shrink-0 flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Scan</span>
          </Link>
        </div>

        {/* Next Recommended Guide */}
        {nextArticle && (
          <div className="space-y-2 pt-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Next Recommended Guide
            </h3>
            <Link
              href={`/learn/${nextArticle.slug}`}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1F2F3D] dark:text-[#F1F5F9] group-hover:text-[#0B5FFF] transition-colors">
                    {nextArticle.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {nextArticle.category} • {nextArticle.read_minutes} min read
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
