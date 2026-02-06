import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable macronutrient validator for nutrition data (calories, protein, carbs, fat).
// Values represent per-100g amounts as non-negative integers.
export const macronutrientsValidator = v.object({
  calories: v.number(),
  protein: v.number(),
  carbs: v.number(),
  fat: v.number(),
});

// Better Auth tables (user, session, account, verification) are managed
// by the Better Auth component and do not need to be defined here.
const schema = defineSchema({
  household: defineTable({
    name: v.string(),
  }),
  householdMember: defineTable({
    userId: v.string(),
    householdId: v.id("household"),
  })
    .index("by_userId", ["userId"])
    .index("by_householdId", ["householdId"]),
  product: defineTable({
    name: v.string(),
    macronutrients: macronutrientsValidator,
    imageId: v.optional(v.id("_storage")),
    barcode: v.optional(v.string()),
    source: v.union(v.literal("manual"), v.literal("openfoodfacts")),
  }).searchIndex("search_by_name", {
    searchField: "name",
  }),
});

export default schema;
