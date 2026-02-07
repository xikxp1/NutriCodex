import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  useNavigate: () => vi.fn(),
}));

vi.mock("convex/react", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    households: {
      getMyHousehold: "getMyHousehold",
      getHouseholdMembers: "getHouseholdMembers",
      updateHousehold: "updateHousehold",
      leaveHousehold: "leaveHousehold",
    },
  },
}));

vi.mock("~/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(() => ({
      data: { user: { id: "user1", name: "Test User", email: "test@example.com", image: null } },
      isPending: false,
    })),
  },
}));

vi.mock("~/routes/_authenticated", () => ({
  resetHouseholdVerification: vi.fn(),
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return { ...actual, Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} /> };
});

import { Route } from "~/routes/_authenticated/household";

const RouteOpts = Route as unknown as { component: React.FC };

describe("Household details page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton when household is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    const HouseholdPage = RouteOpts.component;
    const { container } = render(<HouseholdPage />);

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows 'not a member' message when household is null", () => {
    mockUseQuery.mockImplementation((fnName: string) => {
      if (fnName === "getMyHousehold") return null;
      return undefined;
    });

    const HouseholdPage = RouteOpts.component;
    render(<HouseholdPage />);

    expect(screen.getByText("You are not a member of any household.")).toBeInTheDocument();
  });

  it("displays household name when loaded", () => {
    mockUseQuery.mockImplementation((fnName: string) => {
      if (fnName === "getMyHousehold") return { _id: "h1", name: "Smith Family" };
      if (fnName === "getHouseholdMembers")
        return [
          {
            _id: "m1",
            userId: "user1",
            name: "Test User",
            email: "test@example.com",
            image: null,
          },
        ];
      return undefined;
    });

    const HouseholdPage = RouteOpts.component;
    render(<HouseholdPage />);

    expect(screen.getByText("Smith Family")).toBeInTheDocument();
  });

  it("displays member names in the members section", () => {
    mockUseQuery.mockImplementation((fnName: string) => {
      if (fnName === "getMyHousehold") return { _id: "h1", name: "Smith Family" };
      if (fnName === "getHouseholdMembers")
        return [
          {
            _id: "m1",
            userId: "user1",
            name: "Test User",
            email: "test@example.com",
            image: null,
          },
          {
            _id: "m2",
            userId: "user2",
            name: "Other User",
            email: "other@example.com",
            image: null,
          },
        ];
      return undefined;
    });

    const HouseholdPage = RouteOpts.component;
    render(<HouseholdPage />);

    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText(/Other User/)).toBeInTheDocument();
  });

  it("shows '(You)' indicator next to current user", () => {
    mockUseQuery.mockImplementation((fnName: string) => {
      if (fnName === "getMyHousehold") return { _id: "h1", name: "Smith Family" };
      if (fnName === "getHouseholdMembers")
        return [
          {
            _id: "m1",
            userId: "user1",
            name: "Test User",
            email: "test@example.com",
            image: null,
          },
        ];
      return undefined;
    });

    const HouseholdPage = RouteOpts.component;
    render(<HouseholdPage />);

    expect(screen.getByText("(You)")).toBeInTheDocument();
  });

  it("has an edit button for household name", () => {
    mockUseQuery.mockImplementation((fnName: string) => {
      if (fnName === "getMyHousehold") return { _id: "h1", name: "Smith Family" };
      if (fnName === "getHouseholdMembers") return [];
      return undefined;
    });

    const HouseholdPage = RouteOpts.component;
    render(<HouseholdPage />);

    expect(screen.getByRole("button", { name: /edit household name/i })).toBeInTheDocument();
  });

  it("switches to edit mode when edit button is clicked", async () => {
    const user = userEvent.setup();

    mockUseQuery.mockImplementation((fnName: string) => {
      if (fnName === "getMyHousehold") return { _id: "h1", name: "Smith Family" };
      if (fnName === "getHouseholdMembers") return [];
      return undefined;
    });

    const HouseholdPage = RouteOpts.component;
    render(<HouseholdPage />);

    await user.click(screen.getByRole("button", { name: /edit household name/i }));

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("has a 'Leave Household' button", () => {
    mockUseQuery.mockImplementation((fnName: string) => {
      if (fnName === "getMyHousehold") return { _id: "h1", name: "Smith Family" };
      if (fnName === "getHouseholdMembers") return [];
      return undefined;
    });

    const HouseholdPage = RouteOpts.component;
    render(<HouseholdPage />);

    expect(screen.getByRole("button", { name: /leave household/i })).toBeInTheDocument();
  });
});
