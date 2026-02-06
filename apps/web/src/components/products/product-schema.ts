import { z } from "zod";

export const productFormSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name must be at most 200 characters"),
  calories: z
    .number()
    .int("Calories must be a whole number")
    .min(0, "Calories must be non-negative"),
  protein: z.number().int("Protein must be a whole number").min(0, "Protein must be non-negative"),
  carbs: z.number().int("Carbs must be a whole number").min(0, "Carbs must be non-negative"),
  fat: z.number().int("Fat must be a whole number").min(0, "Fat must be non-negative"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
