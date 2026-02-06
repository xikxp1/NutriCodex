/**
 * Tests for ShadCN Sidebar component exports (sub-02)
 *
 * Requirements covered:
 * - Architecture: sidebar.tsx exports 22+ composable sub-components
 * - FR-2: App shell includes navigation sidebar
 * - FR-3: Sidebar is collapsible (icon mode)
 * - FR-4: Sidebar state persistence via cookie
 *
 * These tests verify the sidebar module exports all required sub-components.
 * Full rendering tests are not practical without the complete provider tree.
 */
import { describe, expect, it } from "vitest";

describe("Sidebar component exports", () => {
  it("exports SidebarProvider", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarProvider).toBeDefined();
  });

  it("exports Sidebar", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.Sidebar).toBeDefined();
  });

  it("exports SidebarTrigger for toggle control (FR-3, FR-12)", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarTrigger).toBeDefined();
  });

  it("exports SidebarInset for main content area (FR-10)", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarInset).toBeDefined();
  });

  it("exports SidebarHeader for app logo section (FR-7)", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarHeader).toBeDefined();
  });

  it("exports SidebarContent for navigation area (FR-5)", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarContent).toBeDefined();
  });

  it("exports SidebarFooter for user info section (FR-8)", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarFooter).toBeDefined();
  });

  it("exports SidebarGroup and related components", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarGroup).toBeDefined();
    expect(mod.SidebarGroupLabel).toBeDefined();
    expect(mod.SidebarGroupContent).toBeDefined();
  });

  it("exports SidebarMenu and related components (FR-5)", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarMenu).toBeDefined();
    expect(mod.SidebarMenuItem).toBeDefined();
    expect(mod.SidebarMenuButton).toBeDefined();
  });

  it("exports SidebarMenuSkeleton for loading states", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarMenuSkeleton).toBeDefined();
  });

  it("exports SidebarRail for visual edge toggle", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarRail).toBeDefined();
  });

  it("exports SidebarSeparator", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.SidebarSeparator).toBeDefined();
  });

  it("exports useSidebar hook for state management (FR-3, FR-4)", async () => {
    const mod = await import("~/components/ui/sidebar");
    expect(mod.useSidebar).toBeDefined();
    expect(typeof mod.useSidebar).toBe("function");
  });
});
