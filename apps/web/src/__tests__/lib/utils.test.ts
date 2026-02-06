/**
 * Tests for cn() utility function (existing utility, validating it still works)
 *
 * Requirements covered:
 * - NFR-1: All new components use cn() utility for class merging
 * - Validates existing infrastructure that all new components depend on
 */
import { describe, expect, it } from "vitest";
import { cn } from "~/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts via tailwind-merge", () => {
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty string", () => {
    expect(cn("")).toBe("");
  });

  it("handles no arguments", () => {
    expect(cn()).toBe("");
  });

  it("merges complex Tailwind classes correctly", () => {
    const result = cn(
      "inline-flex items-center justify-center rounded-md",
      "bg-primary text-primary-foreground",
      "hover:bg-primary/90",
    );
    expect(result).toContain("inline-flex");
    expect(result).toContain("bg-primary");
    expect(result).toContain("hover:bg-primary/90");
  });
});
