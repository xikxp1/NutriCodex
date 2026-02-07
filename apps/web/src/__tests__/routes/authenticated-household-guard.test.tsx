import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (fn: any) => fn,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  Outlet: () => null,
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
  AppSidebar: () => null,
}));

vi.mock("~/components/layout/top-bar", () => ({
  TopBar: () => null,
}));

vi.mock("~/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: any) => children,
  SidebarInset: ({ children }: any) => children,
}));

import { getHouseholdStatus, Route, resetHouseholdVerification } from "~/routes/_authenticated";

describe("_authenticated layout route", () => {
  it("exports a Route object", () => {
    expect(Route).toBeDefined();
  });

  it("exports getHouseholdStatus as a function", () => {
    expect(typeof getHouseholdStatus).toBe("function");
  });

  it("exports resetHouseholdVerification as a function", () => {
    expect(typeof resetHouseholdVerification).toBe("function");
  });

  it("Route has a beforeLoad hook", () => {
    const opts = Route as unknown as { beforeLoad?: Function };
    expect(typeof opts.beforeLoad).toBe("function");
  });

  it("Route has a component", () => {
    const opts = Route as unknown as { component?: Function };
    expect(typeof opts.component).toBe("function");
  });
});
