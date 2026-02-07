import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    products: {
      getProduct: "getProduct",
      deleteProduct: "deleteProduct",
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} />,
    Trash2: (props: any) => <svg data-testid="trash-icon" {...props} />,
  };
});

vi.mock("~/components/products/product-edit-form", () => ({
  ProductEditForm: () => <div data-testid="edit-form">Edit Form</div>,
}));

import { ProductDetailDialog } from "~/components/products/product-detail-dialog";

const mockProduct = {
  _id: "product-1",
  name: "Test Banana",
  macronutrients: { calories: 89, protein: 1, carbs: 23, fat: 0 },
  imageUrl: null,
  source: "manual" as const,
};

describe("ProductDetailDialog component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeletons when product is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(<ProductDetailDialog productId="product-1" open={true} onOpenChange={vi.fn()} />);

    // Dialog content renders in a portal, so query the full document
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays product name as dialog title when loaded", () => {
    mockUseQuery.mockReturnValue(mockProduct);

    render(<ProductDetailDialog productId="product-1" open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Test Banana")).toBeInTheDocument();
  });

  it("displays macronutrient values", () => {
    mockUseQuery.mockReturnValue({
      ...mockProduct,
      macronutrients: { calories: 100, protein: 10, carbs: 20, fat: 5 },
    });

    render(<ProductDetailDialog productId="product-1" open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("10g")).toBeInTheDocument();
    expect(screen.getByText("20g")).toBeInTheDocument();
    expect(screen.getByText("5g")).toBeInTheDocument();
  });

  it("displays 'Source: Manual' for manual products", () => {
    mockUseQuery.mockReturnValue(mockProduct);

    render(<ProductDetailDialog productId="product-1" open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Source: Manual")).toBeInTheDocument();
  });

  it("displays 'Source: OpenFoodFacts' for imported products", () => {
    mockUseQuery.mockReturnValue({ ...mockProduct, source: "openfoodfacts", barcode: "123" });

    render(<ProductDetailDialog productId="product-1" open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Source: OpenFoodFacts")).toBeInTheDocument();
  });

  it("displays barcode when present", () => {
    mockUseQuery.mockReturnValue({
      ...mockProduct,
      source: "openfoodfacts",
      barcode: "1234567890",
    });

    render(<ProductDetailDialog productId="product-1" open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByText("Barcode: 1234567890")).toBeInTheDocument();
  });

  it("renders Edit and Delete buttons in view mode", () => {
    mockUseQuery.mockReturnValue(mockProduct);

    render(<ProductDetailDialog productId="product-1" open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("does not render content when dialog is closed", () => {
    mockUseQuery.mockReturnValue(mockProduct);

    render(<ProductDetailDialog productId="product-1" open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByText("Test Banana")).not.toBeInTheDocument();
  });
});
