import { createClient } from "./server";
import type { Profile, Scan, LearnArticle } from "@/types/database.types";

export interface UserStats {
  totalScans: number;
  scansThisWeek: number;
  threatsCaught: number;
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function getRecentScans(userId: string, limit = 3): Promise<Scan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as unknown as Scan[];
}

export async function getUserScanStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  // Calculate 7 days ago timestamp
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  // Fetch scans for this user
  const { data, error } = await supabase
    .from("scans")
    .select("risk_level, created_at")
    .eq("user_id", userId);

  if (error || !data) {
    return {
      totalScans: 0,
      scansThisWeek: 0,
      threatsCaught: 0,
    };
  }

  const totalScans = data.length;
  const scansThisWeek = data.filter((s) => s.created_at >= sevenDaysAgoIso).length;
  const threatsCaught = data.filter(
    (s) => s.risk_level === "suspicious" || s.risk_level === "dangerous"
  ).length;

  return {
    totalScans,
    scansThisWeek,
    threatsCaught,
  };
}

export async function getPublishedArticles(): Promise<LearnArticle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learn_articles")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as LearnArticle[];
}

export async function getArticleBySlug(slug: string): Promise<LearnArticle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learn_articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as LearnArticle;
}

export async function getFeaturedTip(): Promise<{ title: string; summary: string; slug: string } | null> {
  const supabase = await createClient();
  const { data: allTips, error } = await supabase
    .from("learn_articles")
    .select("slug, title, summary")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (!error && allTips && allTips.length > 0) {
    // Rotate tip daily based on current date
    const now = new Date();
    const dayIndex = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
    return allTips[dayIndex % allTips.length];
  }

  return {
    slug: "spot-a-fake-link",
    title: "How to Spot a Fake Link",
    summary: "Inspect the domain right before .com: attackers use typos like paypa1.com to trick you.",
  };
}
