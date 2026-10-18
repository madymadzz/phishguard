import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from "./validators";

describe("Authentication Form Validators", () => {
  describe("loginSchema", () => {
    it("validates valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "securepassword123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("signupSchema", () => {
    it("validates correct registration data", () => {
      const result = signupSchema.safeParse({
        displayName: "Maria Santos",
        email: "maria@tip.edu.ph",
        password: "StrongPassword1!",
        confirmPassword: "StrongPassword1!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const result = signupSchema.safeParse({
        displayName: "Maria Santos",
        email: "maria@tip.edu.ph",
        password: "StrongPassword1!",
        confirmPassword: "DifferentPassword1!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates valid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "student@tip.edu.ph" });
      expect(result.success).toBe(true);
    });
  });

  describe("resetPasswordSchema", () => {
    it("validates matching new passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      });
      expect(result.success).toBe(true);
    });
  });
});
