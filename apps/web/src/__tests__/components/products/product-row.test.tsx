import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return { ...actual, Package: (props: any) => <svg data-testid="package-icon" {...props} /> };
});

import { ProductRow, type ProductWithImageUrl } from "~/components/products/product-row";

const mockProduct: ProductWithImageUrl = {
  _id: "product-1",
  name: "Test Banana",
  macronutrients: { calories: 89, protein: 1, carbs: 23, fat: 0 },
  imageUrl: "https://example.com/banana.jpg",
  source: "manual",
};

const mockProductNoImage: ProductWithImageUrl = {
  _id: "product-2",
  name: "Mystery Food",
  macronutrients: { calories: 200, protein: 10, carbs: 30, fat: 5 },
  imageUrl: null,
  source: "openfoodfacts",
  barcode: "1234567890",
};

describe("ProductRow component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product name and macronutrient summary", () => {
    render(<ProductRow product={mockProduct} onClick={vi.fn()} />);

    expect(screen.getByText("Test Banana")).toBeInTheDocument();
    expect(screen.getByText(/89 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/1g protein/)).toBeInTheDocument();
    expect(screen.getByText(/23g carbs/)).toBeInTheDocument();
    expect(screen.getByText(/0g fat/)).toBeInTheDocument();
  });

  it("renders fallback icon when product has no imageUrl", () => {
    render(<ProductRow product={mockProductNoImage} onClick={vi.fn()} />);

    expect(screen.getByTestId("package-icon")).toBeInTheDocument();
  });

  it("calls onClick handler when row is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ProductRow product={mockProduct} onClick={handleClick} />);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as a button element", () => {
    render(<ProductRow product={mockProduct} onClick={vi.fn()} />);

    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });
});
