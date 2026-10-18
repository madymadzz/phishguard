import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { data: articles, error } = await supabaseAdmin
      .from("learn_articles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ articles: articles || [] });
  } catch (error) {
    console.error("Error fetching learn articles:", error);
    return NextResponse.json(
      { error: "Failed to load articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const body = await request.json();
    const { title, slug, summary, body_md, category, read_minutes, published, sort_order } = body;

    if (!title || !slug || !summary || !body_md) {
      return NextResponse.json(
        { error: "Title, slug, summary, and markdown body are required." },
        { status: 400 }
      );
    }

    const { data: createdArticle, error: insertErr } = await supabaseAdmin
      .from("learn_articles")
      .insert({
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-"),
        summary,
        body_md,
        category: category || "General",
        read_minutes: Number(read_minutes) || 3,
        published: published ?? false,
        sort_order: Number(sort_order) || 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Log admin action
    await logAdminAction({
      actorId: authCheck.user.id,
      action: "learn_article_created",
      targetType: "learn_article",
      targetId: createdArticle.id,
      metadata: { title, slug: createdArticle.slug },
    });

    return NextResponse.json({ article: createdArticle });
  } catch (error) {
    console.error("Error creating learn article:", error);
    return NextResponse.json(
      { error: "Failed to create educational article" },
      { status: 500 }
    );
  }
}
