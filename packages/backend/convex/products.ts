import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { macronutrientsValidator } from "./schema";

// --- Helpers ---

function validateName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 200) {
    throw new ConvexError("Product name must be between 1 and 200 characters");
  }
  return trimmed;
}

function validateMacronutrients(macronutrients: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const fields = ["calories", "protein", "carbs", "fat"] as const;
  for (const field of fields) {
    const val = macronutrients[field];
    if (!Number.isInteger(val) || val < 0) {
      throw new ConvexError(
        `${field.charAt(0).toUpperCase() + field.slice(1)} must be a non-negative integer`,
      );
    }
  }
}

// --- Queries ---

export const getProducts = query({
  args: {
    paginationOpts: paginationOptsValidator,
    nameFilter: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, nameFilter }) => {
    await authComponent.getAuthUser(ctx);

    const results =
      nameFilter && nameFilter.trim().length > 0
        ? await ctx.db
            .query("product")
            .withSearchIndex("search_by_name", (q) => q.search("name", nameFilter))
            .paginate(paginationOpts)
        : await ctx.db.query("product").order("desc").paginate(paginationOpts);

    const page = await Promise.all(
      results.page.map(async (product) => {
        const imageUrl = product.imageId ? await ctx.storage.getUrl(product.imageId) : null;
        return { ...product, imageUrl };
      }),
    );

    return {
      ...results,
      page,
    };
  },
});

export const getProduct = query({
  args: { productId: v.id("product") },
  handler: async (ctx, { productId }) => {
    await authComponent.getAuthUser(ctx);

    const product = await ctx.db.get(productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    const imageUrl = product.imageId ? await ctx.storage.getUrl(product.imageId) : null;

    return { ...product, imageUrl };
  },
});

// --- Mutations ---

export const createProduct = mutation({
  args: {
    name: v.string(),
    macronutrients: macronutrientsValidator,
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { name, macronutrients, imageId }) => {
    await authComponent.getAuthUser(ctx);

    const trimmedName = validateName(name);
    validateMacronutrients(macronutrients);

    const productId = await ctx.db.insert("product", {
      name: trimmedName,
      macronutrients,
      imageId,
      source: "manual",
    });

    return productId;
  },
});

export const createProductInternal = internalMutation({
  args: {
    name: v.string(),
    macronutrients: macronutrientsValidator,
    imageId: v.optional(v.id("_storage")),
    barcode: v.optional(v.string()),
    source: v.union(v.literal("manual"), v.literal("openfoodfacts")),
  },
  handler: async (ctx, { name, macronutrients, imageId, barcode, source }) => {
    const trimmedName = validateName(name);
    validateMacronutrients(macronutrients);

    const productId = await ctx.db.insert("product", {
      name: trimmedName,
      macronutrients,
      imageId,
      barcode,
      source,
    });

    return productId;
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("product"),
    name: v.optional(v.string()),
    macronutrients: v.optional(macronutrientsValidator),
    imageId: v.optional(v.id("_storage")),
    removeImage: v.optional(v.boolean()),
  },
  handler: async (ctx, { productId, name, macronutrients, imageId, removeImage }) => {
    await authComponent.getAuthUser(ctx);

    const product = await ctx.db.get(productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      updates.name = validateName(name);
    }

    if (macronutrients !== undefined) {
      validateMacronutrients(macronutrients);
      updates.macronutrients = macronutrients;
    }

    if (removeImage) {
      if (product.imageId) {
        await ctx.storage.delete(product.imageId);
      }
      updates.imageId = undefined;
    } else if (imageId !== undefined) {
      if (product.imageId) {
        await ctx.storage.delete(product.imageId);
      }
      updates.imageId = imageId;
    }

    await ctx.db.patch(productId, updates);
  },
});

export const deleteProduct = mutation({
  args: { productId: v.id("product") },
  handler: async (ctx, { productId }) => {
    await authComponent.getAuthUser(ctx);

    const product = await ctx.db.get(productId);
    if (!product) {
      throw new ConvexError("Product not found");
    }

    if (product.imageId) {
      await ctx.storage.delete(product.imageId);
    }

    await ctx.db.delete(productId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await authComponent.getAuthUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// --- Actions ---

export const searchOpenFoodFacts = action({
  args: {
    query: v.string(),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, page, pageSize }) => {
    await authComponent.getAuthUser(ctx);

    if (searchQuery.length < 2) {
      throw new ConvexError("Search query must be at least 2 characters");
    }

    const currentPage = page ?? 1;
    const currentPageSize = Math.min(pageSize ?? 24, 100);

    const url = new URL("https://search.openfoodfacts.org/search");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("page", String(currentPage));
    url.searchParams.set("page_size", String(currentPageSize));
    url.searchParams.set("fields", "product_name,nutriments,image_url,code,brands");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "NutriCodex/1.0 (nutricodex@example.com)",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ConvexError(`OpenFoodFacts API returned status ${response.status}`);
      }

      const data = await response.json();

      const products = (data.hits ?? [])
        .filter(
          (hit: Record<string, unknown>) =>
            hit.product_name &&
            typeof hit.product_name === "string" &&
            hit.product_name.trim().length > 0,
        )
        .map((hit: Record<string, unknown>) => {
          const nutriments = (hit.nutriments ?? {}) as Record<string, unknown>;
          const brands = hit.brands;

          return {
            name: (hit.product_name as string).trim(),
            calories: Math.round(Number(nutriments["energy-kcal_100g"]) || 0),
            protein: Math.round(Number(nutriments.proteins_100g) || 0),
            carbs: Math.round(Number(nutriments.carbohydrates_100g) || 0),
            fat: Math.round(Number(nutriments.fat_100g) || 0),
            imageUrl: (hit.image_url as string | undefined) ?? null,
            barcode: (hit.code as string | undefined) ?? null,
            brand: Array.isArray(brands)
              ? ((brands[0] as string) ?? null)
              : ((brands as string | null) ?? null),
          };
        });

      return {
        products,
        totalCount: (data.count as number) ?? 0,
        pageCount: (data.page_count as number) ?? 0,
        page: (data.page as number) ?? currentPage,
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ConvexError("OpenFoodFacts search timed out after 10 seconds");
      }
      throw new ConvexError(
        `Failed to search OpenFoodFacts: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

export const importProduct = action({
  args: {
    name: v.string(),
    macronutrients: macronutrientsValidator,
    imageUrl: v.optional(v.string()),
    barcode: v.optional(v.string()),
  },
  handler: async (ctx, { name, macronutrients, imageUrl, barcode }): Promise<Id<"product">> => {
    await authComponent.getAuthUser(ctx);

    let imageId: Id<"_storage"> | undefined;

    if (imageUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(imageUrl, {
            headers: {
              "User-Agent": "NutriCodex/1.0 (nutricodex@example.com)",
            },
            signal: controller.signal,
          });

          if (response.ok) {
            const blob = await response.blob();
            const storageId = await ctx.storage.store(blob);
            imageId = storageId;
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch {
        // Image download failed -- proceed without image
      }
    }

    const productId: Id<"product"> = await ctx.runMutation(
      internal.products.createProductInternal,
      {
        name,
        macronutrients,
        imageId,
        barcode,
        source: "openfoodfacts" as const,
      },
    );

    return productId;
  },
});
