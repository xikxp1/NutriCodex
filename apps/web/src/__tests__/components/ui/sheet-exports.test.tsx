/**
 * Tests for ShadCN Sheet component exports (sub-02)
 *
 * Requirements covered:
 * - Architecture: Sheet is used by Sidebar for mobile viewport drawer
 * - Sheet provides slide-in panel behavior
 */
import { describe, expect, it } from "vitest";

describe("Sheet component exports", () => {
  it("exports Sheet root component", async () => {
    const mod = await import("~/components/ui/sheet");
    expect(mod.Sheet).toBeDefined();
  });

  it("exports SheetContent", async () => {
    const mod = await import("~/components/ui/sheet");
    expect(mod.SheetContent).toBeDefined();
  });

  it("exports SheetTrigger", async () => {
    const mod = await import("~/components/ui/sheet");
    expect(mod.SheetTrigger).toBeDefined();
  });

  it("exports SheetHeader and SheetTitle", async () => {
    const mod = await import("~/components/ui/sheet");
    expect(mod.SheetHeader).toBeDefined();
    expect(mod.SheetTitle).toBeDefined();
  });

  it("exports SheetDescription", async () => {
    const mod = await import("~/components/ui/sheet");
    expect(mod.SheetDescription).toBeDefined();
  });

  it("exports SheetClose", async () => {
    const mod = await import("~/components/ui/sheet");
    expect(mod.SheetClose).toBeDefined();
  });
});
