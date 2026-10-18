import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, logAdminAction } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id: articleId } = await params;

  try {
    const body = await request.json();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.slug !== undefined) updatePayload.slug = body.slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (body.summary !== undefined) updatePayload.summary = body.summary;
    if (body.body_md !== undefined) updatePayload.body_md = body.body_md;
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.read_minutes !== undefined) updatePayload.read_minutes = Number(body.read_minutes);
    if (body.published !== undefined) updatePayload.published = Boolean(body.published);
    if (body.sort_order !== undefined) updatePayload.sort_order = Number(body.sort_order);

    const { data: updatedArticle, error: updateErr } = await supabaseAdmin
      .from("learn_articles")
      .update(updatePayload)
      .eq("id", articleId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log admin action
    await logAdminAction({
      actorId: authCheck.user.id,
      action: "learn_article_updated",
      targetType: "learn_article",
      targetId: articleId,
      metadata: { updates: updatePayload },
    });

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id: articleId } = await params;

  try {
    const { data: article, error: getErr } = await supabaseAdmin
      .from("learn_articles")
      .select("id, title, slug")
      .eq("id", articleId)
      .maybeSingle();

    if (getErr || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const { error: delErr } = await supabaseAdmin
      .from("learn_articles")
      .delete()
      .eq("id", articleId);

    if (delErr) throw delErr;

    // Log admin action
    await logAdminAction({
      actorId: authCheck.user.id,
      action: "learn_article_deleted",
      targetType: "learn_article",
      targetId: articleId,
      metadata: { deletedTitle: article.title, deletedSlug: article.slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
