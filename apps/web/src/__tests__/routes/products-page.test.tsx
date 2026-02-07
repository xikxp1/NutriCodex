import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
}));

vi.mock("@tanstack/react-pacer", () => ({
  useDebouncedValue: (value: string) => [value],
}));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Plus: (props: any) => <svg data-testid="plus-icon" {...props} />,
    Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  };
});

vi.mock("~/components/products/product-list", () => ({
  ProductList: ({ nameFilter }: any) => (
    <div data-testid="product-list" data-filter={nameFilter}>
      Product List
    </div>
  ),
}));

vi.mock("~/components/products/add-product-dialog", () => ({
  AddProductDialog: ({ open }: any) =>
    open ? <div data-testid="add-dialog">Add Dialog</div> : null,
}));

import { Route } from "~/routes/_authenticated/products";

const RouteOpts = Route as unknown as { component: React.FC };

describe("Products page route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a Route module", () => {
    expect(Route).toBeDefined();
  });

  it("renders search input with placeholder 'Search products...'", () => {
    const ProductsPage = RouteOpts.component;
    render(<ProductsPage />);

    expect(screen.getByPlaceholderText("Search products...")).toBeInTheDocument();
  });

  it("renders 'Add Product' button", () => {
    const ProductsPage = RouteOpts.component;
    render(<ProductsPage />);

    expect(screen.getByRole("button", { name: /add product/i })).toBeInTheDocument();
  });

  it("clicking 'Add Product' button opens the AddProductDialog", async () => {
    const user = userEvent.setup();
    const ProductsPage = RouteOpts.component;
    render(<ProductsPage />);

    expect(screen.queryByTestId("add-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add product/i }));

    expect(screen.getByTestId("add-dialog")).toBeInTheDocument();
  });
});
