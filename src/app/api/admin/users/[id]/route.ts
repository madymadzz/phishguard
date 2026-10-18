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

  const { id: targetId } = await params;
  const currentAdminId = authCheck.user.id;

  try {
    const body = await request.json();
    const { role, status } = body;

    if (!role && !status) {
      return NextResponse.json(
        { error: "Provide at least 'role' or 'status' to update" },
        { status: 400 }
      );
    }

    // Fetch existing target user profile
    const { data: targetProfile, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Self-action safeguards
    if (targetId === currentAdminId) {
      if (role && role !== "admin") {
        return NextResponse.json(
          { error: "Safety violation: You cannot demote your own administrator account." },
          { status: 400 }
        );
      }
      if (status && status === "suspended") {
        return NextResponse.json(
          { error: "Safety violation: You cannot suspend your own administrator account." },
          { status: 400 }
        );
      }
    }

    // Last admin safeguard: check if target is an admin and is being demoted or suspended
    const isDemotingAdmin = targetProfile.role === "admin" && role === "user";
    const isSuspendingAdmin = targetProfile.role === "admin" && status === "suspended";

    if (isDemotingAdmin || isSuspendingAdmin) {
      const { count: activeAdmins, error: adminCountErr } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("status", "active");

      if (adminCountErr) throw adminCountErr;

      if ((activeAdmins || 0) <= 1) {
        return NextResponse.json(
          { error: "Safety violation: Cannot remove or suspend the system's only active administrator." },
          { status: 400 }
        );
      }
    }

    // Perform update
    const updatePayload: Record<string, string> = {};
    if (role && (role === "user" || role === "admin")) updatePayload.role = role;
    if (status && (status === "active" || status === "suspended")) updatePayload.status = status;

    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", targetId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Record audit log entry
    await logAdminAction({
      actorId: currentAdminId,
      action: "user_profile_updated",
      targetType: "profile",
      targetId,
      metadata: {
        previous: { role: targetProfile.role, status: targetProfile.status },
        updated: updatePayload,
        targetEmail: targetProfile.email,
      },
    });

    return NextResponse.json({ user: updatedProfile });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authCheck = await requireAdminApi();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id: targetId } = await params;
  const currentAdminId = authCheck.user.id;

  try {
    // Self-delete safeguard
    if (targetId === currentAdminId) {
      return NextResponse.json(
        { error: "Safety violation: You cannot delete your own administrator account." },
        { status: 400 }
      );
    }

    // Fetch target user profile
    const { data: targetProfile, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Last admin safeguard
    if (targetProfile.role === "admin") {
      const { count: activeAdmins, error: adminCountErr } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("status", "active");

      if (adminCountErr) throw adminCountErr;

      if ((activeAdmins || 0) <= 1) {
        return NextResponse.json(
          { error: "Safety violation: Cannot delete the system's only active administrator." },
          { status: 400 }
        );
      }
    }

    // Delete user from Supabase Auth (cascades to public.profiles)
    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
    if (authDeleteErr) {
      console.warn("Auth deletion failed, falling back to profiles deletion:", authDeleteErr);
      await supabaseAdmin.from("profiles").delete().eq("id", targetId);
    }

    // Record audit log entry
    await logAdminAction({
      actorId: currentAdminId,
      action: "user_account_deleted",
      targetType: "profile",
      targetId,
      metadata: {
        deletedEmail: targetProfile.email,
        deletedRole: targetProfile.role,
      },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user account" },
      { status: 500 }
    );
  }
}
