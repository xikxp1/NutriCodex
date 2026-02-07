import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@nutricodex/backend", () => ({
  api: {
    products: {
      createProduct: "createProduct",
      generateUploadUrl: "generateUploadUrl",
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ManualProductForm } from "~/components/products/manual-product-form";

describe("ManualProductForm component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all field labels", () => {
    render(<ManualProductForm onSuccess={vi.fn()} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Calories (kcal)")).toBeInTheDocument();
    expect(screen.getByText("Protein (g)")).toBeInTheDocument();
    expect(screen.getByText("Carbs (g)")).toBeInTheDocument();
    expect(screen.getByText("Fat (g)")).toBeInTheDocument();
    expect(screen.getByText("Image (optional)")).toBeInTheDocument();
  });

  it("renders file input with correct accept attribute", () => {
    const { container } = render(<ManualProductForm onSuccess={vi.fn()} />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("renders 'Create Product' submit button", () => {
    render(<ManualProductForm onSuccess={vi.fn()} />);

    expect(screen.getByRole("button", { name: /create product/i })).toBeInTheDocument();
  });

  it("renders four number inputs for macronutrient fields", () => {
    const { container } = render(<ManualProductForm onSuccess={vi.fn()} />);

    const numberInputs = container.querySelectorAll('input[type="number"]');
    expect(numberInputs.length).toBe(4);
  });
});
