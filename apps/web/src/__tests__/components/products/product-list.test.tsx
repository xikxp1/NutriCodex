import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue(undefined),
  useQuery: () => undefined,
  usePaginatedQuery: vi.fn(() => ({ results: [], status: "Exhausted", loadMore: vi.fn() })),
  useAction: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    products: {
      getProducts: "getProducts",
      getProduct: "getProduct",
      createProduct: "createProduct",
      generateUploadUrl: "generateUploadUrl",
      searchOpenFoodFacts: "searchOpenFoodFacts",
      importProduct: "importProduct",
    },
  },
}));

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
  }),
}));

vi.mock("~/components/products/product-detail-dialog", () => ({
  ProductDetailDialog: () => null,
}));

vi.mock("~/components/products/product-row", () => ({
  ProductRow: ({ product }: any) => <div data-testid="product-row">{product.name}</div>,
}));

import { usePaginatedQuery } from "convex/react";
import { ProductList } from "~/components/products/product-list";

describe("ProductList component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeletons when status is LoadingFirstPage", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      loadMore: vi.fn(),
      isLoading: true,
    } as any);

    const { container } = render(<ProductList nameFilter="" />);

    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows 'No products found.' when results are empty and status is Exhausted", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    } as any);

    render(<ProductList nameFilter="" />);

    expect(screen.getByText("No products found.")).toBeInTheDocument();
  });

  it("passes nameFilter to usePaginatedQuery", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      loadMore: vi.fn(),
      isLoading: false,
    } as any);

    render(<ProductList nameFilter="banana" />);

    expect(usePaginatedQuery).toHaveBeenCalledWith(
      "getProducts",
      { nameFilter: "banana" },
      { initialNumItems: 20 },
    );
  });
});
