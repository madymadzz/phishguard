"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { LearnArticle } from "@/types/database.types";
import {
  BookOpen,
  Clock,
  ChevronRight,
  Shield,
  Search,
  X,
  GraduationCap,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Basics",
  "Detection",
  "Mobile Security",
  "Threats",
  "Incident Response",
  "Best Practices",
];

export default function LearnPage() {
  const [articles, setArticles] = useState<LearnArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function fetchArticles() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("learn_articles")
          .select("*")
          .eq("published", true)
          .order("sort_order", { ascending: true });

        if (!cancelled && !error && data) {
          setArticles(data as LearnArticle[]);
        }
      } catch (err) {
        console.error("Failed to load articles:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory =
        selectedCategory === "All" ||
        art.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <AppShell
      showHeader={true}
      headerContent={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0B5FFF]" />
            <span className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              Cyber Education
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredArticles.length} {filteredArticles.length === 1 ? "guide" : "guides"}
          </span>
        </div>
      }
      footerContent={<BottomNav />}
    >
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Education Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0B5FFF] to-[#1E40AF] text-white space-y-1.5 shadow-md shadow-[#0B5FFF]/15 relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-blue-100 text-[10px] font-extrabold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Anti-Phishing Academy</span>
          </div>
          <h1 className="text-base font-black tracking-tight">Stay Alert. Spot the Scam.</h1>
          <p className="text-xs text-blue-100/90 leading-relaxed max-w-xs">
            Learn how to recognize deceptive URLs, detect quishing in public QR codes, and protect your accounts.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides, topics, or attack types…"
            className="w-full text-xs py-2.5 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16222E] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full transition-colors shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#0B5FFF] text-white shadow-2xs"
                  : "bg-white dark:bg-[#16222E] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2.5">
            <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
              No articles found
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              No security articles match &quot;{searchQuery}&quot; in the selected category.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {filteredArticles.map((art) => (
              <Link
                key={art.id}
                href={`/learn/${art.slug}`}
                className="block p-4 rounded-3xl bg-white dark:bg-[#16222E] border border-slate-100 dark:border-slate-800 hover:border-[#0B5FFF]/50 dark:hover:border-[#0B5FFF]/50 hover:shadow-xs transition-all active:scale-[0.99] space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B5FFF] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40">
                    {art.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{art.read_minutes} min read</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-[#1F2F3D] dark:text-[#F1F5F9] group-hover:text-[#0B5FFF] transition-colors leading-snug">
                    {art.title}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-[#0B5FFF]">
                  <span>Read Guide</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
