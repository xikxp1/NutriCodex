import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useAction: () =>
    vi.fn().mockResolvedValue({ products: [], totalCount: 0, pageCount: 0, page: 1 }),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    products: {
      searchOpenFoodFacts: "searchOpenFoodFacts",
      importProduct: "importProduct",
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@tanstack/react-pacer", () => ({
  useDebouncedValue: (value: string) => [value],
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Search: (props: any) => <svg data-testid="search-icon" {...props} />,
    Package: (props: any) => <svg data-testid="package-icon" {...props} />,
  };
});

import { OpenFoodFactsSearch } from "~/components/products/openfoodfacts-search";

describe("OpenFoodFactsSearch component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input with correct placeholder", () => {
    render(<OpenFoodFactsSearch onImported={vi.fn()} />);

    expect(screen.getByPlaceholderText("Search OpenFoodFacts...")).toBeInTheDocument();
  });

  it("shows min characters message when input has 1 character", async () => {
    const user = userEvent.setup();
    render(<OpenFoodFactsSearch onImported={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Search OpenFoodFacts..."), "a");

    expect(screen.getByText("Enter at least 2 characters to search.")).toBeInTheDocument();
  });

  it("does not show min characters message when input is empty", () => {
    render(<OpenFoodFactsSearch onImported={vi.fn()} />);

    expect(screen.queryByText("Enter at least 2 characters to search.")).not.toBeInTheDocument();
  });

  it("updates input value when typing", async () => {
    const user = userEvent.setup();
    render(<OpenFoodFactsSearch onImported={vi.fn()} />);

    const input = screen.getByPlaceholderText("Search OpenFoodFacts...");
    await user.type(input, "banana");

    expect(input).toHaveValue("banana");
  });
});
