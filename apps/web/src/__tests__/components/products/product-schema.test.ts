import { describe, expect, it } from "vitest";

import { type ProductFormValues, productFormSchema } from "@/components/products/product-schema";

const validProduct = { name: "Banana", calories: 89, protein: 1, carbs: 23, fat: 0 };

describe("Product form schema", () => {
  it("accepts valid product data", () => {
    const result = productFormSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = productFormSchema.safeParse({ ...validProduct, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 200 characters", () => {
    const result = productFormSchema.safeParse({ ...validProduct, name: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts name of exactly 200 characters", () => {
    const result = productFormSchema.safeParse({ ...validProduct, name: "a".repeat(200) });
    expect(result.success).toBe(true);
  });

  it("rejects negative calorie value", () => {
    const result = productFormSchema.safeParse({ ...validProduct, calories: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer calorie value", () => {
    const result = productFormSchema.safeParse({ ...validProduct, calories: 10.5 });
    expect(result.success).toBe(false);
  });

  it("rejects negative protein value", () => {
    const result = productFormSchema.safeParse({ ...validProduct, protein: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer protein value", () => {
    const result = productFormSchema.safeParse({ ...validProduct, protein: 2.7 });
    expect(result.success).toBe(false);
  });

  it("rejects negative carbs value", () => {
    const result = productFormSchema.safeParse({ ...validProduct, carbs: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative fat value", () => {
    const result = productFormSchema.safeParse({ ...validProduct, fat: -3 });
    expect(result.success).toBe(false);
  });

  it("accepts zero values for all macronutrients", () => {
    const result = productFormSchema.safeParse({
      name: "Water",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts large integer values", () => {
    const result = productFormSchema.safeParse({
      name: "High Calorie Food",
      calories: 9999,
      protein: 500,
      carbs: 9999,
      fat: 9999,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name field", () => {
    const result = productFormSchema.safeParse({ calories: 100, protein: 10, carbs: 20, fat: 5 });
    expect(result.success).toBe(false);
  });

  it("rejects missing calories field", () => {
    const result = productFormSchema.safeParse({ name: "Test", protein: 10, carbs: 20, fat: 5 });
    expect(result.success).toBe(false);
  });

  it("exports ProductFormValues type", () => {
    const value: ProductFormValues = validProduct;
    expect(value.name).toBe("Banana");
  });
});
