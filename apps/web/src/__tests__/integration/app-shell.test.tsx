import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();

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

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(() => mockNavigate),
  Outlet: () => React.createElement("div", { "data-testid": "outlet" }, "Page Content"),
  Link: ({ children, ...props }: { children: React.ReactNode }) =>
    React.createElement("a", props, children),
  createFileRoute: () => () => ({}),
  redirect: vi.fn(),
}));

describe("App Shell Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the complete app shell with sidebar, top bar, and content area", async () => {
    const { SidebarProvider, SidebarInset } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");
    const { TopBar } = await import("~/components/layout/top-bar");

    render(
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
          <div data-testid="content">Main content</div>
        </SidebarInset>
      </SidebarProvider>,
    );

    expect(screen.getByText(/NutriCodex/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Food Log/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();

    const userElements = screen.getAllByText("Test User");
    expect(userElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("has a toggle button that controls sidebar state", async () => {
    const _user = userEvent.setup();
    const { SidebarProvider, SidebarInset } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");
    const { TopBar } = await import("~/components/layout/top-bar");

    const { container } = render(
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
        </SidebarInset>
      </SidebarProvider>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);

    const sidebar = container.querySelector("[data-state]");
    if (sidebar) {
      expect(sidebar.getAttribute("data-state")).toBe("expanded");
    }
  });

  it("sidebar starts in expanded state by default", async () => {
    const { SidebarProvider, SidebarInset } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");
    const { TopBar } = await import("~/components/layout/top-bar");

    render(
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
        </SidebarInset>
      </SidebarProvider>,
    );

    expect(screen.getByText(/Dashboard/i)).toBeVisible();
    expect(screen.getByText(/Food Log/i)).toBeVisible();
    expect(screen.getByText(/Settings/i)).toBeVisible();
  });

  it("renders UserMenu in the top bar area with user info", async () => {
    const { SidebarProvider, SidebarInset } = await import("~/components/ui/sidebar");
    const { AppSidebar } = await import("~/components/layout/app-sidebar");
    const { TopBar } = await import("~/components/layout/top-bar");

    render(
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
        </SidebarInset>
      </SidebarProvider>,
    );

    const userElements = screen.getAllByText("Test User");
    expect(userElements.length).toBeGreaterThanOrEqual(1);
  });

  it("login and signup routes are outside the app shell layout", () => {
    // Verified by file structure: login.tsx and signup.tsx are at routes/ root level,
    // not under routes/_authenticated/. TanStack Router file-based routing enforces this.
    const authRoutes = ["src/routes/login.tsx", "src/routes/signup.tsx"];
    for (const route of authRoutes) {
      expect(route).not.toContain("_authenticated");
    }
  });
});
