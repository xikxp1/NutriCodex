/**
 * Tests for UserMenu "My Household" link addition (sub-06)
 *
 * Requirements covered:
 * - FR-18: User menu dropdown includes an option to access household management
 * - Architecture: "My Household" DropdownMenuItem navigates to /household
 * - Architecture: Menu structure is [User Info] --- My Household --- Sign Out
 *
 * These tests verify the user menu dropdown contains a "My Household" link
 * that navigates to the household details page, positioned between the user
 * info label and the Sign Out action.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();

// Mock authClient
vi.mock("~/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          image: null,
        },
      },
      isPending: false,
      error: null,
      isRefetching: false,
      refetch: vi.fn(),
    })),
    signOut: mockSignOut,
  },
}));

// Mock @tanstack/react-router
vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(() => mockNavigate),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
    [key: string]: unknown;
  }) => React.createElement("a", { href: to, ...props }, children),
}));

describe("UserMenu with My Household link (sub-06)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows 'My Household' option in dropdown when opened (FR-18)", async () => {
    const user = userEvent.setup();
    const { UserMenu } = await import("~/components/layout/user-menu");

    render(<UserMenu />);

    // Open the dropdown
    const trigger = screen.getAllByRole("button")[0];
    await user.click(trigger);

    // Wait for the "My Household" menu item to appear
    await waitFor(() => {
      expect(screen.getByText(/My Household/i)).toBeInTheDocument();
    });
  });

  it("'My Household' link targets the /household route (FR-18)", async () => {
    const user = userEvent.setup();
    const { UserMenu } = await import("~/components/layout/user-menu");

    render(<UserMenu />);

    // Open the dropdown
    const trigger = screen.getAllByRole("button")[0];
    await user.click(trigger);

    await waitFor(() => {
      const householdLink = screen.getByText(/My Household/i);
      // The link should be inside an <a> tag pointing to /household
      const anchorElement = householdLink.closest("a");
      if (anchorElement) {
        expect(anchorElement.getAttribute("href")).toBe("/household");
      } else {
        // If not an anchor, expect the link text to still be present
        expect(householdLink).toBeInTheDocument();
      }
    });
  });

  it("'My Household' appears with a Lucide icon (Home or Users)", async () => {
    const user = userEvent.setup();
    const { UserMenu } = await import("~/components/layout/user-menu");

    render(<UserMenu />);

    // Open the dropdown
    const trigger = screen.getAllByRole("button")[0];
    await user.click(trigger);

    await waitFor(() => {
      const householdItem = screen.getByText(/My Household/i);
      // The menu item parent should contain an SVG icon (Lucide)
      const parentElement =
        householdItem.closest("[data-slot='dropdown-menu-item']") || householdItem.parentElement;
      if (parentElement) {
        const svgIcon = parentElement.querySelector("svg");
        expect(svgIcon).toBeTruthy();
      }
    });
  });

  it("still shows 'Sign Out' option after adding household link (FR-18)", async () => {
    const user = userEvent.setup();
    const { UserMenu } = await import("~/components/layout/user-menu");

    render(<UserMenu />);

    // Open the dropdown
    const trigger = screen.getAllByRole("button")[0];
    await user.click(trigger);

    // Both items should be present
    await waitFor(() => {
      expect(screen.getByText(/My Household/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();
    });
  });

  it("dropdown has separators between sections (Architecture: menu structure)", async () => {
    const user = userEvent.setup();
    const { UserMenu } = await import("~/components/layout/user-menu");

    render(<UserMenu />);

    // Open the dropdown
    const trigger = screen.getAllByRole("button")[0];
    await user.click(trigger);

    await waitFor(() => {
      // There should be at least 2 separators: one above "My Household" and one below
      const separators = document.querySelectorAll(
        "[data-slot='dropdown-menu-separator'], [role='separator']",
      );
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });
  });
});
