/**
 * Tests for ShadCN Tooltip component exports (sub-01)
 *
 * Requirements covered:
 * - Architecture: Tooltip used by SidebarMenuButton for collapsed state labels
 * - Architecture: TooltipProvider must be added to root layout
 */
import { describe, expect, it } from "vitest";

describe("Tooltip component exports", () => {
  it("exports Tooltip root component", async () => {
    const mod = await import("~/components/ui/tooltip");
    expect(mod.Tooltip).toBeDefined();
  });

  it("exports TooltipTrigger", async () => {
    const mod = await import("~/components/ui/tooltip");
    expect(mod.TooltipTrigger).toBeDefined();
  });

  it("exports TooltipContent", async () => {
    const mod = await import("~/components/ui/tooltip");
    expect(mod.TooltipContent).toBeDefined();
  });

  it("exports TooltipProvider for app-level wrapper", async () => {
    const mod = await import("~/components/ui/tooltip");
    expect(mod.TooltipProvider).toBeDefined();
  });
});
