import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/components/products/manual-product-form", () => ({
  ManualProductForm: () => <div data-testid="manual-form">Manual Form</div>,
}));

vi.mock("~/components/products/openfoodfacts-search", () => ({
  OpenFoodFactsSearch: () => <div data-testid="off-search">OFF Search</div>,
}));

import { AddProductDialog } from "~/components/products/add-product-dialog";

describe("AddProductDialog component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Add Product' title when open", () => {
    render(<AddProductDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Add Product")).toBeInTheDocument();
  });

  it("shows Manual and Import tab triggers", () => {
    render(<AddProductDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("tab", { name: /manual/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /import/i })).toBeInTheDocument();
  });

  it("renders ManualProductForm in the Manual tab content", () => {
    render(<AddProductDialog open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("manual-form")).toBeInTheDocument();
  });

  it("calls onOpenChange when dialog is requested to close", () => {
    const onOpenChange = vi.fn();
    render(<AddProductDialog open={true} onOpenChange={onOpenChange} />);

    screen.getByRole("button", { name: /close/i }).click();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
