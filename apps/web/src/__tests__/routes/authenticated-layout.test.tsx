import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (fn: any) => fn,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  Outlet: () => React.createElement("div", { "data-testid": "outlet" }, "Page Content"),
  redirect: vi.fn(),
}));

vi.mock("~/lib/auth-server", () => ({
  fetchAuthQuery: vi.fn().mockResolvedValue(null),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    households: {
      getMyHousehold: "getMyHousehold",
    },
  },
}));

vi.mock("~/components/layout/app-sidebar", () => ({
  AppSidebar: () => React.createElement("nav", { "data-testid": "sidebar" }, "Sidebar"),
}));

vi.mock("~/components/layout/top-bar", () => ({
  TopBar: () => React.createElement("header", { "data-testid": "topbar" }, "Top Bar"),
}));

vi.mock("~/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: any) =>
    React.createElement("div", { "data-testid": "sidebar-provider" }, children),
  SidebarInset: ({ children }: any) =>
    React.createElement("main", { "data-testid": "sidebar-inset" }, children),
}));

import { Route } from "~/routes/_authenticated";

const RouteOpts = Route as unknown as { component: React.FC };

describe("_authenticated layout component", () => {
  it("renders the app shell with sidebar, top bar, and outlet", () => {
    const AuthenticatedLayout = RouteOpts.component;
    render(<AuthenticatedLayout />);

    expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  it("renders outlet content inside sidebar inset", () => {
    const AuthenticatedLayout = RouteOpts.component;
    render(<AuthenticatedLayout />);

    const inset = screen.getByTestId("sidebar-inset");
    expect(inset).toContainElement(screen.getByTestId("outlet"));
  });
});
