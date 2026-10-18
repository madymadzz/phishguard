import { describe, it, expect } from "vitest";

describe("Admin Access Control & Safeguard Logic", () => {
  function checkSelfActionSafeguard({
    actorId,
    targetId,
    action,
    proposedRole,
    proposedStatus,
  }: {
    actorId: string;
    targetId: string;
    action: "update" | "delete";
    proposedRole?: string;
    proposedStatus?: string;
  }): { allowed: boolean; reason?: string } {
    if (actorId === targetId) {
      if (action === "delete") {
        return { allowed: false, reason: "You cannot delete your own administrator account." };
      }
      if (proposedRole && proposedRole !== "admin") {
        return { allowed: false, reason: "You cannot demote your own administrator account." };
      }
      if (proposedStatus === "suspended") {
        return { allowed: false, reason: "You cannot suspend your own administrator account." };
      }
    }
    return { allowed: true };
  }

  function checkLastAdminSafeguard({
    targetIsAdmin,
    activeAdminCount,
    proposedRole,
    proposedStatus,
    action,
  }: {
    targetIsAdmin: boolean;
    activeAdminCount: number;
    proposedRole?: string;
    proposedStatus?: string;
    action: "update" | "delete";
  }): { allowed: boolean; reason?: string } {
    if (!targetIsAdmin) return { allowed: true };

    const willRemoveAdminPrivilege =
      action === "delete" ||
      proposedRole === "user" ||
      proposedStatus === "suspended";

    if (willRemoveAdminPrivilege && activeAdminCount <= 1) {
      return { allowed: false, reason: "Cannot modify or remove the system's only active administrator." };
    }

    return { allowed: true };
  }

  describe("Self-action safeguards", () => {
    const adminId = "admin-uuid-123";
    const otherUserId = "user-uuid-456";

    it("prevents an admin from demoting themselves", () => {
      const result = checkSelfActionSafeguard({
        actorId: adminId,
        targetId: adminId,
        action: "update",
        proposedRole: "user",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("cannot demote your own");
    });

    it("prevents an admin from suspending themselves", () => {
      const result = checkSelfActionSafeguard({
        actorId: adminId,
        targetId: adminId,
        action: "update",
        proposedStatus: "suspended",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("cannot suspend your own");
    });

    it("prevents an admin from deleting themselves", () => {
      const result = checkSelfActionSafeguard({
        actorId: adminId,
        targetId: adminId,
        action: "delete",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("cannot delete your own");
    });

    it("allows an admin to update other users", () => {
      const result = checkSelfActionSafeguard({
        actorId: adminId,
        targetId: otherUserId,
        action: "update",
        proposedRole: "admin",
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe("Last active admin protection", () => {
    it("blocks removing the only active administrator", () => {
      const result = checkLastAdminSafeguard({
        targetIsAdmin: true,
        activeAdminCount: 1,
        proposedRole: "user",
        action: "update",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("only active administrator");
    });

    it("blocks deleting the only active administrator", () => {
      const result = checkLastAdminSafeguard({
        targetIsAdmin: true,
        activeAdminCount: 1,
        action: "delete",
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("only active administrator");
    });

    it("blocks suspending the only active administrator", () => {
      const result = checkLastAdminSafeguard({
        targetIsAdmin: true,
        activeAdminCount: 1,
        proposedStatus: "suspended",
        action: "update",
      });
      expect(result.allowed).toBe(false);
    });

    it("allows modifying an admin when multiple active admins exist", () => {
      const result = checkLastAdminSafeguard({
        targetIsAdmin: true,
        activeAdminCount: 2,
        proposedRole: "user",
        action: "update",
      });
      expect(result.allowed).toBe(true);
    });

    it("allows modifying standard users without admin count restriction", () => {
      const result = checkLastAdminSafeguard({
        targetIsAdmin: false,
        activeAdminCount: 1,
        proposedStatus: "suspended",
        action: "update",
      });
      expect(result.allowed).toBe(true);
    });
  });
});
