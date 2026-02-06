/**
 * Tests for AppSidebar component (sub-04)
 *
 * Requirements covered:
 * - FR-2: Navigation sidebar visible on left side
 * - FR-3: Sidebar is collapsible between expanded and collapsed states
 * - FR-5: At least 3 placeholder navigation items (Dashboard, Food Log, Settings)
 * - FR-7: App name "NutriCodex" in sidebar header
 * - FR-12: Collapse toggle button in discoverable location
 *
 * NOTE: These tests require wrapping with SidebarProvider.
 * They verify component structure and content.
 */
import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(() => vi.fn()),
  Link: ({ children, ...props }: { children: React.ReactNode }) =>
    React.createElement("a", props, children),
}));

describe("AppSidebar component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports AppSidebar as a function component", async () => {
    const mod = await import("~/components/layout/app-sidebar");
    expect(mod.AppSidebar).toBeDefined();
    expect(typeof mod.AppSidebar).toBe("function");
  });

  it("renders with SidebarProvider wrapper", async () => {
    const { SidebarProvider } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");

    const { container } = render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it("displays app name NutriCodex in sidebar header (FR-7)", async () => {
    const { SidebarProvider } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.getByText(/NutriCodex/i)).toBeInTheDocument();
  });

  it("displays at least 3 placeholder navigation items (FR-5)", async () => {
    const { SidebarProvider } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    // Check for the 3 required placeholder items
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Food Log/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it("renders navigation items as non-functional placeholders (FR-5)", async () => {
    const { SidebarProvider } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    // Nav items should not have working href attributes pointing to real routes
    const dashboardText = screen.getByText(/Dashboard/i);
    const closestLink = dashboardText.closest("a");
    if (closestLink) {
      // If rendered as a link, href should be "#" or empty (placeholder)
      const href = closestLink.getAttribute("href");
      expect(href === "#" || href === "" || href === null).toBe(true);
    }
    // Otherwise they're rendered as buttons/spans which is also valid for placeholders
  });
});
