import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges tailwind class names correctly", () => {
    const result = cn("p-4", "text-red-500", { "bg-blue-500": true, "hidden": false });
    expect(result).toBe("p-4 text-red-500 bg-blue-500");
  });
});
