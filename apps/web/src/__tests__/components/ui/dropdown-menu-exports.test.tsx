/**
 * Tests for ShadCN DropdownMenu component exports (sub-02)
 *
 * Requirements covered:
 * - FR-9: User profile area includes dropdown menu with "Sign Out" action
 * - NFR-6: Dropdown must be keyboard-navigable and accessible
 * - Architecture: DropdownMenu used in UserMenu and sidebar footer
 */
import { describe, expect, it } from "vitest";

describe("DropdownMenu component exports", () => {
  it("exports DropdownMenu root component", async () => {
    const mod = await import("~/components/ui/dropdown-menu");
    expect(mod.DropdownMenu).toBeDefined();
  });

  it("exports DropdownMenuTrigger", async () => {
    const mod = await import("~/components/ui/dropdown-menu");
    expect(mod.DropdownMenuTrigger).toBeDefined();
  });

  it("exports DropdownMenuContent", async () => {
    const mod = await import("~/components/ui/dropdown-menu");
    expect(mod.DropdownMenuContent).toBeDefined();
  });

  it("exports DropdownMenuItem for action items like Sign Out", async () => {
    const mod = await import("~/components/ui/dropdown-menu");
    expect(mod.DropdownMenuItem).toBeDefined();
  });

  it("exports DropdownMenuLabel for section labels", async () => {
    const mod = await import("~/components/ui/dropdown-menu");
    expect(mod.DropdownMenuLabel).toBeDefined();
  });

  it("exports DropdownMenuSeparator", async () => {
    const mod = await import("~/components/ui/dropdown-menu");
    expect(mod.DropdownMenuSeparator).toBeDefined();
  });

  it("exports DropdownMenuGroup for grouping items", async () => {
    const mod = await import("~/components/ui/dropdown-menu");
    expect(mod.DropdownMenuGroup).toBeDefined();
  });
});
