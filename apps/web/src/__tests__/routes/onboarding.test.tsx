import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  redirect: vi.fn(),
  useNavigate: () => vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue(undefined),
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    households: {
      createHousehold: "createHousehold",
      joinHousehold: "joinHousehold",
      listHouseholds: "listHouseholds",
    },
  },
}));

vi.mock("~/routes/__root", () => ({
  getAuth: vi.fn().mockResolvedValue("token"),
}));

vi.mock("~/routes/_authenticated", () => ({
  getHouseholdStatus: vi.fn().mockResolvedValue(null),
}));

import { Route } from "~/routes/onboarding";

const RouteOpts = Route as unknown as { component: React.FC };

describe("Onboarding page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(undefined);
  });

  it("renders both 'Create Household' and 'Join Household' toggle buttons", () => {
    const OnboardingPage = RouteOpts.component;
    render(<OnboardingPage />);

    // Both toggle and submit buttons have "Create Household" text
    const createButtons = screen.getAllByRole("button", { name: /create household/i });
    expect(createButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /join household/i })).toBeInTheDocument();
  });

  it("shows create section by default", () => {
    const OnboardingPage = RouteOpts.component;
    render(<OnboardingPage />);

    expect(screen.getByText("Create a Household")).toBeInTheDocument();
  });

  it("create section has name input and submit button", () => {
    const OnboardingPage = RouteOpts.component;
    const { container } = render(<OnboardingPage />);

    expect(screen.getByLabelText("Household Name")).toBeInTheDocument();
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(submitBtn).not.toBeNull();
    expect(submitBtn?.textContent).toContain("Create Household");
  });

  it("switches to join section when 'Join Household' is clicked", async () => {
    const user = userEvent.setup();
    const OnboardingPage = RouteOpts.component;
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: /join household/i }));

    expect(screen.getByText("Join a Household")).toBeInTheDocument();
  });

  it("join section shows loading skeletons when households are undefined", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue(undefined);

    const OnboardingPage = RouteOpts.component;
    const { container } = render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: /join household/i }));

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("join section shows empty message when no households exist", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue([]);

    const OnboardingPage = RouteOpts.component;
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: /join household/i }));

    expect(screen.getByText("No households available. Create one instead.")).toBeInTheDocument();
  });

  it("join section displays household names and member counts", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue([
      { _id: "h1", name: "Smith Family", memberCount: 3 },
      { _id: "h2", name: "Solo House", memberCount: 1 },
    ]);

    const OnboardingPage = RouteOpts.component;
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: /join household/i }));

    expect(screen.getByText("Smith Family")).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("Solo House")).toBeInTheDocument();
    expect(screen.getByText("1 member")).toBeInTheDocument();
  });

  it("join section has 'Join' buttons for each household", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue([{ _id: "h1", name: "Smith Family", memberCount: 2 }]);

    const OnboardingPage = RouteOpts.component;
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: /join household/i }));

    const joinButtons = screen.getAllByRole("button", { name: /^join$/i });
    expect(joinButtons.length).toBe(1);
  });
});
