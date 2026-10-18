"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Clock,
  Eye,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import type { LearnArticle } from "@/types/database.types";

export default function AdminLearnCMSPage() {
  const [articles, setArticles] = useState<LearnArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Editor Modal
  const [editingArticle, setEditingArticle] = useState<LearnArticle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Basics");
  const [readMinutes, setReadMinutes] = useState(3);
  const [summary, setSummary] = useState("");
  const [bodyMd, setBodyMd] = useState("");
  const [published, setPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/learn");
      if (!res.ok) throw new Error("Failed to load articles");
      const json = await res.json();
      setArticles(json.articles || []);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error loading CMS articles",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/learn");
        if (!res.ok) throw new Error("Failed to load articles");
        const json = await res.json();
        if (!cancelled) {
          setArticles(json.articles || []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "Error loading CMS articles",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openEditor = (article?: LearnArticle) => {
    if (article) {
      setEditingArticle(article);
      setIsNew(false);
      setTitle(article.title);
      setSlug(article.slug);
      setCategory(article.category);
      setReadMinutes(article.read_minutes);
      setSummary(article.summary);
      setBodyMd(article.body_md);
      setPublished(article.published);
      setSortOrder(article.sort_order);
    } else {
      setEditingArticle(null);
      setIsNew(true);
      setTitle("");
      setSlug("");
      setCategory("Basics");
      setReadMinutes(3);
      setSummary("");
      setBodyMd("## Overview\n\nExplain key threat concepts here.\n\n- Tip 1: Always inspect domain spelling\n- Tip 2: Never enter credentials on HTTP sites");
      setPublished(true);
      setSortOrder(articles.length + 1);
    }
    setEditorTab("write");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      title,
      slug,
      category,
      read_minutes: readMinutes,
      summary,
      body_md: bodyMd,
      published,
      sort_order: sortOrder,
    };

    try {
      if (isNew) {
        const res = await fetch("/api/admin/learn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create article");
        }
        setFeedback({ type: "success", message: `Article "${title}" published.` });
      } else if (editingArticle) {
        const res = await fetch(`/api/admin/learn/${editingArticle.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update article");
        }
        setFeedback({ type: "success", message: `Article "${title}" updated.` });
      }

      setEditingArticle(null);
      fetchArticles();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (article: LearnArticle) => {
    const nextState = !article.published;
    try {
      const res = await fetch(`/api/admin/learn/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: nextState }),
      });
      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, published: nextState } : a))
        );
      }
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    }
  };

  const handleDeleteArticle = async (article: LearnArticle) => {
    if (!window.confirm(`Permanently delete article "${article.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/learn/${article.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
        setFeedback({ type: "success", message: `Deleted "${article.title}".` });
      }
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1F2F3D] dark:text-[#F1F5F9] tracking-tight">
            Learn Content Management (CMS)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Author and publish educational security articles, manage reading times, and sort order.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchArticles}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16222E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0B5FFF]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => openEditor()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B5FFF] text-white text-xs font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Guide</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 rounded-md">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Articles Table */}
      <div className="rounded-3xl bg-white dark:bg-[#16222E] border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Article Title & Slug</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Reading Time</th>
                <th className="py-3.5 px-4">Published</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading && articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0B5FFF]" />
                      <span>Loading CMS articles…</span>
                    </div>
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No articles currently authored in the database.
                  </td>
                </tr>
              ) : (
                articles.map((art) => (
                  <tr
                    key={art.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-400">
                      #{art.sort_order}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1F2F3D] dark:text-[#F1F5F9]">
                        {art.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        /learn/{art.slug}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]">
                        {art.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{art.read_minutes} min</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleTogglePublish(art)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                          art.published
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-[#13733A] dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            art.published ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <span>{art.published ? "Published" : "Draft"}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditor(art)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Edit guide"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(art)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete guide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Markdown Editor Modal */}
      {(editingArticle !== null || isNew) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#16222E] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0B5FFF]" />
                <h3 className="text-base font-extrabold text-[#1F2F3D] dark:text-[#F1F5F9]">
                  {isNew ? "Create New Security Guide" : `Edit Guide: ${title}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingArticle(null);
                  setIsNew(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveArticle} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Recognizing Quishing in Fast Food QR Codes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="recognizing-quishing-qr-codes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                  >
                    <option value="Basics">Basics</option>
                    <option value="Detection">Detection</option>
                    <option value="Mobile Security">Mobile Security</option>
                    <option value="Threats">Threats</option>
                    <option value="Incident Response">Incident Response</option>
                    <option value="Best Practices">Best Practices</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Read Minutes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readMinutes}
                    onChange={(e) => setReadMinutes(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Brief Summary
                </label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="1-2 sentences summarizing key protection tips"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              {/* Markdown Editor Tabs (Write / Preview) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Article Body (Markdown)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setEditorTab("write")}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        editorTab === "write"
                          ? "bg-white dark:bg-[#16222E] text-[#0B5FFF] shadow-2xs"
                          : "text-slate-500"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                        editorTab === "preview"
                          ? "bg-white dark:bg-[#16222E] text-[#0B5FFF] shadow-2xs"
                          : "text-slate-500"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {editorTab === "write" ? (
                  <textarea
                    rows={12}
                    required
                    value={bodyMd}
                    onChange={(e) => setBodyMd(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                ) : (
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 min-h-[280px]">
                    <MarkdownRenderer content={bodyMd} />
                  </div>
                )}
              </div>

              {/* Published Toggle Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishedToggle"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <label htmlFor="publishedToggle" className="font-bold text-slate-700 dark:text-slate-300">
                  Publish article immediately (visible to all registered users)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingArticle(null);
                    setIsNew(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#0B5FFF] text-white font-bold hover:bg-[#0747C7] transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isNew ? "Create Article" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
