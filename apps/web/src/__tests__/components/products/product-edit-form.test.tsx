import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    products: {
      updateProduct: "updateProduct",
      generateUploadUrl: "generateUploadUrl",
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { type ProductDoc, ProductEditForm } from "~/components/products/product-edit-form";

const mockProduct: ProductDoc = {
  _id: "product-1",
  name: "Banana",
  macronutrients: { calories: 89, protein: 1, carbs: 23, fat: 0 },
  imageUrl: "https://example.com/banana.jpg",
  source: "manual",
};

const mockProductNoImage: ProductDoc = {
  _id: "product-2",
  name: "Apple",
  macronutrients: { calories: 52, protein: 0, carbs: 14, fat: 0 },
  imageUrl: null,
  source: "manual",
};

describe("ProductEditForm component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-populates name field with product name", () => {
    render(<ProductEditForm product={mockProduct} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Banana");
  });

  it("pre-populates macronutrient fields with product values", () => {
    render(<ProductEditForm product={mockProduct} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Calories (kcal)")).toHaveValue(89);
    expect(screen.getByLabelText("Protein (g)")).toHaveValue(1);
    expect(screen.getByLabelText("Carbs (g)")).toHaveValue(23);
    expect(screen.getByLabelText("Fat (g)")).toHaveValue(0);
  });

  it("renders Save Changes and Cancel buttons", () => {
    render(<ProductEditForm product={mockProduct} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows 'Remove Image' button when product has an image", () => {
    render(<ProductEditForm product={mockProduct} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("button", { name: /remove image/i })).toBeInTheDocument();
  });

  it("does not show 'Remove Image' button when product has no image", () => {
    render(<ProductEditForm product={mockProductNoImage} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /remove image/i })).not.toBeInTheDocument();
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ProductEditForm product={mockProduct} onSuccess={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
