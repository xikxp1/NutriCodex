# Architecture: Product Database Management with Nutrition Tracking and OpenFoodFacts Import

## Clarification Questions

None. All requirements are clear and consistent with the existing codebase patterns.

## System Overview

This feature adds a global product database to NutriCodex. The system spans three layers:

1. **Backend (Convex)**: New `product` table with a full-text search index, CRUD queries/mutations, a file upload helper, an OpenFoodFacts search action, and an import action that downloads images into Convex storage.
2. **Shared Validation**: A reusable `macronutrientsValidator` used in the schema and potentially future tables.
3. **Web UI**: A new `/products` route with a virtualized infinite-scroll list, full-text search filtering, add/edit/delete dialogs with TanStack Form + Zod validation, OpenFoodFacts import UI, and Sonner toast notifications.

```
+-------------------------------------------------------------------+
|                    apps/web (TanStack Start)                      |
|                                                                   |
|  /products route                                                  |
|  +-------------------------------------------------------------+ |
|  | ProductsPage                                                 | |
|  |  +-- Search Input (debounced via @tanstack/pacer)            | |
|  |  +-- Add Product Button -> AddProductDialog                  | |
|  |  |    +-- Tabs: Manual | Import                              | |
|  |  |    |   +-- ManualProductForm (TanStack Form + Zod)        | |
|  |  |    |   +-- OpenFoodFactsSearch (debounced search + list)  | |
|  |  +-- ProductList (usePaginatedQuery + useVirtualizer)        | |
|  |       +-- ProductRow (click -> ProductDetailDialog)          | |
|  |            +-- View / Edit (ProductEditForm) / Delete        | |
|  +-------------------------------------------------------------+ |
+-------------------------------------------------------------------+
         |
         | api.products.*
         v
+-------------------------------------------------------------------+
|               packages/backend/convex                             |
|                                                                   |
|  schema.ts:   product table (with macronutrientsValidator,        |
|               search_by_name search index)                        |
|  products.ts: getProducts (full-text search), getProduct,         |
|               createProduct, updateProduct, deleteProduct,        |
|               generateUploadUrl, searchOpenFoodFacts,             |
|               importProduct (action: downloads image + creates)   |
+-------------------------------------------------------------------+
```

## Component Design

### Backend Components

#### macronutrientsValidator
- **Responsibility**: Reusable Convex validator for macronutrient fields (calories, protein, carbs, fat). Defined once and referenced in the `product` table schema and future tables (e.g., meal logs, daily targets).
- **Interface**: Exported constant `macronutrientsValidator` of type `v.object(...)`.
- **Dependencies**: `convex/values` (`v`)
- **Location**: `packages/backend/convex/schema.ts` (defined above the schema as an exported constant)

#### products.ts (Convex functions)
- **Responsibility**: All product CRUD operations, file upload URL generation, OpenFoodFacts search, and product import with image download.
- **Interface**: See API Design section below.
- **Dependencies**: `convex/server` (query, mutation, action, paginationOptsValidator), `convex/values` (v, ConvexError), `./auth` (authComponent), `./schema` (macronutrientsValidator for validation reuse), `convex/_generated/api` (for internal mutation calls from actions)
- **Location**: `packages/backend/convex/products.ts`

### Web UI Components

#### ProductsPage (Route Component)
- **Responsibility**: Main layout for the products feature. Contains the search input, "Add Product" button, and the product list. Manages the debounced `nameFilter` state that drives the `usePaginatedQuery` call.
- **Interface**: Route component (no external props). Uses `useDebouncedValue` from `@tanstack/pacer` for the search input.
- **Dependencies**: `ProductList`, `AddProductDialog`, ShadCN `Input`, ShadCN `Button`, `@tanstack/pacer` (`useDebouncedValue`), Lucide icons (`Search`, `Plus`)
- **Location**: `apps/web/src/routes/_authenticated/products.tsx`

#### ProductList
- **Responsibility**: Virtualized infinite-scroll list of products. Combines `usePaginatedQuery` with `useVirtualizer` to render only visible rows. Automatically loads more items when scrolling near the bottom.
- **Interface**: `{ nameFilter: string }` -- receives the debounced name filter from the parent.
- **Dependencies**: `convex/react` (`usePaginatedQuery`), `@tanstack/react-virtual` (`useVirtualizer`), `ProductRow`, `ProductDetailDialog`, ShadCN `Skeleton`
- **Location**: `apps/web/src/components/products/product-list.tsx`

#### ProductRow
- **Responsibility**: Single row in the product list. Displays product image thumbnail (or placeholder), name, and macro summary.
- **Interface**: `{ product: ProductWithImageUrl; onClick: () => void }` where `ProductWithImageUrl` includes resolved `imageUrl`.
- **Dependencies**: ShadCN `Avatar` (for image thumbnail with fallback), Lucide `Package` (placeholder icon)
- **Location**: `apps/web/src/components/products/product-row.tsx`

#### AddProductDialog
- **Responsibility**: Dialog for creating a new product. Contains tabs for "Manual" and "Import from OpenFoodFacts" modes.
- **Interface**: `{ open: boolean; onOpenChange: (open: boolean) => void }`
- **Dependencies**: ShadCN `Dialog`, ShadCN `Tabs`, `ManualProductForm`, `OpenFoodFactsSearch`
- **Location**: `apps/web/src/components/products/add-product-dialog.tsx`

#### ManualProductForm
- **Responsibility**: TanStack Form for manually creating a product. Handles image upload via the 3-step Convex flow.
- **Interface**: `{ onSuccess: () => void }` -- callback after successful creation.
- **Dependencies**: `@tanstack/react-form` (`useForm`), `zod`, ShadCN `Field`/`FieldLabel`/`FieldError`/`FieldGroup`, ShadCN `Input`, ShadCN `Button`, `sonner` (`toast`), `convex/react` (`useMutation`), shared Zod schema
- **Location**: `apps/web/src/components/products/manual-product-form.tsx`

#### OpenFoodFactsSearch
- **Responsibility**: Search interface for finding and importing products from OpenFoodFacts. Includes debounced search input, results list with pagination, and import buttons. When a user imports a product, calls the `importProduct` action which downloads the image into Convex storage and creates the product.
- **Interface**: `{ onImported: () => void }` -- callback after successful import.
- **Dependencies**: `@tanstack/pacer` (`useDebouncedValue`), `convex/react` (`useAction`), ShadCN `Input`, ShadCN `Button`, ShadCN `Skeleton`, `sonner` (`toast`), Lucide icons
- **Location**: `apps/web/src/components/products/openfoodfacts-search.tsx`

#### ProductDetailDialog
- **Responsibility**: View/edit/delete a single product. Shows product details in view mode, switches to edit mode with `ProductEditForm`, and has a delete button with AlertDialog confirmation.
- **Interface**: `{ productId: Id<"product"> | null; open: boolean; onOpenChange: (open: boolean) => void }`
- **Dependencies**: ShadCN `Dialog`, ShadCN `AlertDialog`, ShadCN `Button`, `ProductEditForm`, `convex/react` (`useQuery`, `useMutation`), `sonner` (`toast`), Lucide icons
- **Location**: `apps/web/src/components/products/product-detail-dialog.tsx`

#### ProductEditForm
- **Responsibility**: TanStack Form for editing an existing product. Pre-populated with current values. Handles image replace/remove.
- **Interface**: `{ product: ProductDoc; onSuccess: () => void; onCancel: () => void }`
- **Dependencies**: `@tanstack/react-form` (`useForm`), `zod`, ShadCN `Field`/`FieldLabel`/`FieldError`/`FieldGroup`, ShadCN `Input`, ShadCN `Button`, `sonner` (`toast`), `convex/react` (`useMutation`), shared Zod schema
- **Location**: `apps/web/src/components/products/product-edit-form.tsx`

### New ShadCN UI Components

#### Dialog
- **Responsibility**: Modal dialog overlay component.
- **Interface**: Exports `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`.
- **Dependencies**: `radix-ui` (unified package -- `Dialog` primitive), `lucide-react` (`XIcon`), `~/lib/utils` (`cn`)
- **Location**: `apps/web/src/components/ui/dialog.tsx`
- **Notes**: Uses `import { Dialog as DialogPrimitive } from "radix-ui"` following the project's existing pattern (see `alert-dialog.tsx`, `sheet.tsx`). The radix-ui unified package is already installed. `DialogContent` includes a `showCloseButton` prop (default `true`).

#### Tabs
- **Responsibility**: Tabbed content panels.
- **Interface**: Exports `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- **Dependencies**: `radix-ui` (unified package -- `Tabs` primitive), `~/lib/utils` (`cn`)
- **Location**: `apps/web/src/components/ui/tabs.tsx`
- **Notes**: Uses `import { Tabs as TabsPrimitive } from "radix-ui"`. No new dependency needed.

#### Field
- **Responsibility**: Form field layout components for composing accessible forms with TanStack Form.
- **Interface**: Exports `Field`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLabel`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldTitle`.
- **Dependencies**: `~/lib/utils` (`cn`) -- pure layout components, no headless primitive dependency.
- **Location**: `apps/web/src/components/ui/field.tsx`
- **Notes**: These are pure styled div/label/p wrappers with no radix-ui dependency. `FieldError` accepts an `errors` array prop compatible with TanStack Form's `field.state.meta.errors` (which produces Standard Schema-compatible error objects when using Zod).

#### Sonner (Toaster wrapper)
- **Responsibility**: Wraps the `sonner` library's `Toaster` component with ShadCN styling and custom icons.
- **Interface**: Exports `Toaster` component (wraps `sonner`'s `Toaster` with theme-aware styling).
- **Dependencies**: `sonner` (npm package), `lucide-react` (icons for toast types)
- **Location**: `apps/web/src/components/ui/sonner.tsx`
- **Notes**: The official ShadCN Sonner wrapper imports from `next-themes` for theme detection. Since this project does not use Next.js or `next-themes`, the Toaster wrapper should omit the `useTheme()` call and either hardcode a theme or accept it as a prop. Alternatively, install `next-themes` as it works with any React app (it just provides a `ThemeProvider`/`useTheme` hook). The simpler approach is to omit theme integration for now and pass a static theme or `"light"`. The ShadCN Sonner wrapper also customizes CSS variables for consistent styling.

## Data Model

### macronutrientsValidator

Defined as an exported constant in `packages/backend/convex/schema.ts`:

```
export const macronutrientsValidator = v.object({
  calories: v.number(),  // kcal per 100g, non-negative integer
  protein: v.number(),   // grams per 100g, non-negative integer
  carbs: v.number(),     // grams per 100g, non-negative integer
  fat: v.number(),       // grams per 100g, non-negative integer
});
```

**Note on `v.number()`**: Convex uses `v.number()` for all numeric values (there is no `v.int()`). Integer enforcement is done at the validation layer (server-side in mutations, client-side via Zod). Values are stored as JavaScript numbers.

### product Table

Added to the schema in `packages/backend/convex/schema.ts`:

```
product: defineTable({
  name: v.string(),
  macronutrients: macronutrientsValidator,
  imageId: v.optional(v.id("_storage")),
  barcode: v.optional(v.string()),
  source: v.union(v.literal("manual"), v.literal("openfoodfacts")),
}).searchIndex("search_by_name", {
  searchField: "name",
}),
```

| Field              | Type                                                | Description                                           |
|--------------------|-----------------------------------------------------|-------------------------------------------------------|
| `name`             | `v.string()`                                        | Product name (1-200 chars, trimmed)                   |
| `macronutrients`   | `macronutrientsValidator` (v.object)                | Calories, protein, carbs, fat per 100g as integers    |
| `imageId`          | `v.optional(v.id("_storage"))`                      | Reference to uploaded image in Convex file storage    |
| `barcode`          | `v.optional(v.string())`                            | Barcode from OpenFoodFacts (EAN-13 etc.)              |
| `source`           | `v.union(v.literal("manual"), v.literal("openfoodfacts"))` | How the product was created                    |

**Indexes:**
- `search_by_name`: Full-text search index on `name` for efficient text search. Uses Convex's built-in full-text search with BM25 relevance ranking and prefix matching.

**Entity relationships:**

```
product (standalone, global)
  |
  | 0..1 : 0..1
  |
_storage (Convex file storage, optional image)
```

Products are global -- no relationship to `household` or `householdMember`. Any authenticated user can CRUD any product.

## API Design

### Convex Functions (packages/backend/convex/products.ts)

All functions require authentication via `authComponent.getAuthUser(ctx)`.

#### Queries

| Function       | Type    | Args                                                                    | Returns                                                                      | Description                                                  |
|----------------|---------|-------------------------------------------------------------------------|------------------------------------------------------------------------------|--------------------------------------------------------------|
| `getProducts`  | query   | `{ paginationOpts: paginationOptsValidator, nameFilter: v.optional(v.string()) }` | `PaginationResult<ProductWithImageUrl>`                                      | Paginated product list with optional full-text search filter |
| `getProduct`   | query   | `{ productId: v.id("product") }`                                        | `ProductWithImageUrl`                                                        | Single product by ID with resolved image URL                 |

**`getProducts` implementation details:**
- If `nameFilter` is provided and non-empty, uses Convex full-text search: `ctx.db.query("product").withSearchIndex("search_by_name", q => q.search("name", nameFilter)).paginate(paginationOpts)`. Results are ordered by relevance (BM25 ranking with prefix matching on the last term).
- If `nameFilter` is not provided or is an empty string, uses a regular query: `ctx.db.query("product").order("desc").paginate(paginationOpts)`. Results are ordered by creation time (newest first).
- For each product in the page, resolves `imageUrl`: if `imageId` is set, calls `ctx.storage.getUrl(imageId)`, otherwise `null`.
- Returns the standard Convex `PaginationResult` shape: `{ page, isDone, continueCursor }`.

**Important design note on full-text search:** Convex full-text search indexes provide built-in prefix matching (the last term in the query acts as a prefix), BM25 relevance ranking, and support for `.paginate()`. This eliminates the need for post-pagination client-side filtering. The search index has a scan limit of 1024 results per query, which is sufficient for the expected data volume. Note that when using `withSearchIndex`, results are returned in relevance order -- not alphabetical or chronological. When no filter is active, results use `order("desc")` for newest-first ordering.

**`getProduct` implementation details:**
- Calls `ctx.db.get(productId)`.
- Throws `ConvexError("Product not found")` if null.
- Resolves `imageUrl` from `imageId` via `ctx.storage.getUrl()`, or `null` if no image.

#### Mutations

| Function             | Type     | Args                                                                                       | Returns            | Description                                                   |
|----------------------|----------|--------------------------------------------------------------------------------------------|--------------------|---------------------------------------------------------------|
| `createProduct`      | mutation | `{ name: v.string(), macronutrients: macronutrientsValidator, imageId: v.optional(v.id("_storage")) }` | `Id<"product">`    | Creates a manually-entered product                            |
| `createProductInternal` | mutation | `{ name: v.string(), macronutrients: macronutrientsValidator, imageId: v.optional(v.id("_storage")), barcode: v.optional(v.string()), source: v.union(v.literal("manual"), v.literal("openfoodfacts")) }` | `Id<"product">`    | Internal mutation called by the `importProduct` action to create a product with all fields |
| `updateProduct`      | mutation | `{ productId: v.id("product"), name: v.optional(v.string()), macronutrients: v.optional(macronutrientsValidator), imageId: v.optional(v.id("_storage")), removeImage: v.optional(v.boolean()) }` | `void`             | Updates an existing product's fields                          |
| `deleteProduct`      | mutation | `{ productId: v.id("product") }`                                                          | `void`             | Deletes a product and its stored image (if any)               |
| `generateUploadUrl`  | mutation | `{}`                                                                                       | `string`           | Generates a Convex file storage upload URL                    |

**`createProduct` validation:**
- Trims `name`, validates length 1-200 chars.
- Validates all macronutrient values are non-negative integers (`Number.isInteger(val) && val >= 0`).
- Sets `source: "manual"`.
- Throws `ConvexError` for validation failures.

**`createProductInternal` validation:**
- Same name and macronutrient validation as `createProduct`.
- Accepts `source` and `barcode` as explicit arguments (used by the `importProduct` action).
- This is an internal mutation -- exposed in the API but intended to be called only from the `importProduct` action, not directly from clients.

**`updateProduct` logic:**
- Fetches existing product, throws `ConvexError("Product not found")` if missing.
- Validates provided fields with same rules as `createProduct`.
- If `imageId` is provided (replacing image) and the product had an existing `imageId`, deletes the old image from storage via `ctx.storage.delete(oldImageId)`.
- If `removeImage` is `true`, deletes existing `imageId` from storage and sets `imageId` to `undefined`.

**`deleteProduct` logic:**
- Fetches product, throws `ConvexError("Product not found")` if missing.
- If product has `imageId`, deletes the image from storage via `ctx.storage.delete(imageId)`.
- Deletes the product document.

**`generateUploadUrl` logic:**
- Calls `ctx.storage.generateUploadUrl()`.
- Returns the URL string.

#### Actions

| Function                | Type   | Args                                                              | Returns                                                                          | Description                        |
|-------------------------|--------|-------------------------------------------------------------------|----------------------------------------------------------------------------------|------------------------------------|
| `searchOpenFoodFacts`   | action | `{ query: v.string(), page: v.optional(v.number()), pageSize: v.optional(v.number()) }` | `{ products: Array<OFFProduct>, totalCount: number, pageCount: number, page: number }` | Searches OpenFoodFacts API         |
| `importProduct`         | action | `{ name: v.string(), macronutrients: macronutrientsValidator, imageUrl: v.optional(v.string()), barcode: v.optional(v.string()) }` | `Id<"product">`    | Downloads image (if provided) into Convex storage and creates product |

**`searchOpenFoodFacts` implementation details:**
- Validates `query` length >= 2.
- Defaults: `page = 1`, `pageSize = 24`.
- Clamps `pageSize` to max 100.
- Makes a GET request to `https://search.openfoodfacts.org/search` with params:
  - `q`: search query
  - `page`: page number
  - `page_size`: results per page
  - `fields`: `product_name,nutriments,image_url,code,brands`
- Sets `User-Agent: NutriCodex/1.0 (nutricodex@example.com)` header.
- Sets a 10-second timeout (`AbortController` with `setTimeout`).
- Maps response `hits` array to simplified product objects:
  - `product_name` -> `name`
  - `nutriments.energy-kcal_100g` -> `calories` (rounded via `Math.round`, default 0)
  - `nutriments.proteins_100g` -> `protein` (rounded, default 0)
  - `nutriments.carbohydrates_100g` -> `carbs` (rounded, default 0)
  - `nutriments.fat_100g` -> `fat` (rounded, default 0)
  - `image_url` -> `imageUrl`
  - `code` -> `barcode`
  - `brands` -> `brand` (string as-is, or first element if array)
- Filters out products missing a name.
- Returns `{ products, totalCount: response.count, pageCount: response.page_count, page: response.page }`.
- On network error or timeout, throws a descriptive `ConvexError`.

**`importProduct` implementation details:**
- This is a Convex **action** (not a mutation) because it needs to make HTTP requests to download images from OpenFoodFacts.
- Flow:
  1. If `imageUrl` is provided:
     a. Fetch the image from the OpenFoodFacts URL (with a 10-second timeout).
     b. Get the image as a `Blob`.
     c. Upload the blob to Convex file storage using `ctx.storage.store(blob)`.
     d. Obtain the resulting `storageId`.
  2. If the image download fails (network error, timeout, non-image response), proceed without an image (`imageId` will be undefined). Log a warning but do not fail the import.
  3. Call the `createProductInternal` mutation via `ctx.runMutation(internal.products.createProductInternal, { name, macronutrients, imageId: storageId, barcode, source: "openfoodfacts" })`.
  4. Return the product ID from the mutation.
- Note: Uses `internal.products.createProductInternal` (an internal mutation) to avoid exposing the full creation interface to clients. Alternatively, this can be an `internalMutation` if the `createProductInternal` should not be callable from clients at all.

**Error handling patterns (consistent with households.ts):**
- All validation errors use `throw new ConvexError("descriptive message")`.
- Errors propagated from server-side are caught in the UI and displayed via `toast.error()`.

## Technology Decisions

### New Dependencies for `apps/web`

| Package                   | Version  | Purpose                                                     |
|---------------------------|----------|-------------------------------------------------------------|
| `@tanstack/react-form`    | latest   | Form state management with render-prop pattern              |
| `@tanstack/react-virtual` | latest   | Virtualizer for rendering only visible rows in long lists   |
| `@tanstack/pacer`         | latest   | Debouncing utilities (`useDebouncedValue` hook)             |
| `zod`                     | latest   | Schema validation for forms (Standard Schema compatible)    |
| `sonner`                  | latest   | Toast notification library                                  |

**Rationale:**
- **@tanstack/react-form**: Chosen per requirements (FR-16, FR-20). Provides headless form management with field-level state, validation integration, and render-prop API that composes with ShadCN Field components.
- **@tanstack/react-virtual**: Chosen per requirements (FR-13, NFR-1). Provides efficient virtualization for rendering only visible rows in a scrollable container, critical for performance with hundreds of loaded products.
- **@tanstack/pacer**: Chosen per requirements (FR-14, FR-17, NFR-8). Provides `useDebouncedValue` hook that returns a debounced value suitable for passing directly to queries. Preferred over custom debounce implementations for consistency and reliability.
- **zod**: Standard Schema validation library. TanStack Form natively supports Zod schemas via its `validators` API. ShadCN Field components' `FieldError` natively supports Standard Schema error objects.
- **sonner**: Chosen per requirements (FR-22, FR-23). Lightweight toast library with the ShadCN Sonner wrapper for theme-consistent styling. The `toast.success()` and `toast.error()` API is simple and direct.

### No `next-themes` Dependency

The standard ShadCN Sonner wrapper imports `useTheme()` from `next-themes`. Since this project uses TanStack Start (not Next.js) and does not have theme switching, the Sonner wrapper should be adapted to omit the `next-themes` dependency. The simplest approach is to remove the `useTheme()` call and not pass a `theme` prop to the underlying Sonner `Toaster`, or hardcode `theme="light"`. If dark mode is added later, theme integration can be revisited.

### Debouncing Strategy: `useDebouncedValue`

The `useDebouncedValue` hook from `@tanstack/pacer` is preferred over `useDebouncer` for this use case because:
- It takes a value and returns a debounced value -- perfect for passing directly to `usePaginatedQuery`'s `nameFilter` argument.
- API: `const [debouncedValue, debouncer] = useDebouncedValue(value, { wait: 300 })`.
- The `debouncer` can be used to check `isPending` state for UI feedback (e.g., showing a spinner while debouncing).

### Convex Full-Text Search for Product Name Filtering

Instead of post-pagination client-side filtering, the product table uses Convex's built-in full-text search via a `searchIndex`. This provides:
- **Server-side text matching**: No need to filter results after fetching pages, eliminating the sparse-results problem.
- **Prefix matching**: The last term in the search query automatically matches prefixes (e.g., "ban" matches "banana").
- **BM25 relevance ranking**: Results are ordered by relevance, prioritizing exact matches and term proximity.
- **Pagination support**: `withSearchIndex` queries support `.paginate()` for seamless integration with `usePaginatedQuery`.
- **Scan limit**: 1024 results per search query, which is sufficient for the expected product database size.

**Trade-off**: When a search filter is active, results are ordered by relevance (not alphabetically or chronologically). This is acceptable because relevance ordering is the expected behavior when searching. When no filter is active, results use `order("desc")` for newest-first ordering.

### Convex Storage for All Product Images

All product images (both manually uploaded and imported from OpenFoodFacts) are stored in Convex file storage. This provides:
- **Reliability**: No dependency on external image hosting services that may change URLs or become unavailable.
- **Consistency**: A single image resolution path (`imageId` -> `ctx.storage.getUrl()`) for all products.
- **Simplicity**: No fallback logic needed in the UI for external vs. internal image sources.

The `importProduct` action downloads the image from OpenFoodFacts during import and stores it in Convex file storage. If the download fails, the product is created without an image (graceful degradation).

## File Structure

### Files to Create

| File Path                                                              | Purpose                                                          |
|------------------------------------------------------------------------|------------------------------------------------------------------|
| `packages/backend/convex/products.ts`                                  | Product queries, mutations, and actions                          |
| `apps/web/src/routes/_authenticated/products.tsx`                      | Products page route component                                    |
| `apps/web/src/components/products/product-list.tsx`                    | Virtualized infinite-scroll product list                         |
| `apps/web/src/components/products/product-row.tsx`                     | Single product row component                                     |
| `apps/web/src/components/products/add-product-dialog.tsx`              | Add product dialog with Manual/Import tabs                       |
| `apps/web/src/components/products/manual-product-form.tsx`             | TanStack Form for manual product creation                        |
| `apps/web/src/components/products/openfoodfacts-search.tsx`            | OpenFoodFacts search and import UI                               |
| `apps/web/src/components/products/product-detail-dialog.tsx`           | Product detail view/edit/delete dialog                           |
| `apps/web/src/components/products/product-edit-form.tsx`               | TanStack Form for editing a product                              |
| `apps/web/src/components/products/product-schema.ts`                   | Shared Zod validation schemas for product forms                  |
| `apps/web/src/components/ui/dialog.tsx`                                | ShadCN Dialog component (radix-ui style)                         |
| `apps/web/src/components/ui/tabs.tsx`                                  | ShadCN Tabs component (radix-ui style)                           |
| `apps/web/src/components/ui/field.tsx`                                 | ShadCN Field components (FieldSet, Field, FieldLabel, etc.)      |
| `apps/web/src/components/ui/sonner.tsx`                                | ShadCN Sonner/Toaster wrapper                                    |

### Files to Modify

| File Path                                                              | Change Description                                               |
|------------------------------------------------------------------------|------------------------------------------------------------------|
| `packages/backend/convex/schema.ts`                                    | Add `macronutrientsValidator` export and `product` table with `search_by_name` search index |
| `apps/web/src/components/layout/app-sidebar.tsx`                       | Add "Products" nav item with link to `/products`                 |
| `apps/web/src/routes/__root.tsx`                                       | Add `<Toaster>` component to root layout                        |
| `apps/web/package.json`                                                | Add new dependencies (via `bun add`)                             |

## Key Integration Patterns

### 1. usePaginatedQuery + useVirtualizer (Infinite Scroll)

The `ProductList` component combines Convex's `usePaginatedQuery` with TanStack Virtual's `useVirtualizer` for a seamless infinite-scroll experience:

```
1. usePaginatedQuery(api.products.getProducts, { nameFilter }, { initialNumItems: 20 })
   -> returns { results, status, loadMore }

2. useVirtualizer({
     count: results.length,
     getScrollElement: () => scrollContainerRef.current,
     estimateSize: () => ROW_HEIGHT,  // fixed height (e.g., 64px)
     overscan: 5,
   })
   -> returns virtualizer with getVirtualItems()

3. Infinite scroll trigger:
   - Monitor the last virtual item's index.
   - When the last visible item is within a threshold of results.length
     AND status === "CanLoadMore", call loadMore(20).

4. Render:
   - Outer div: scrollable container with ref={scrollContainerRef}
   - Inner div: total height from virtualizer.getTotalSize()
   - Virtual items: absolutely positioned rows from virtualizer.getVirtualItems()
```

### 2. Debounced Search with Full-Text Search Index

```
1. useState for raw input value (inputValue).
2. useDebouncedValue(inputValue, { wait: 300 }) -> [debouncedFilter, debouncer]
3. Pass debouncedFilter as nameFilter to usePaginatedQuery.
4. The query re-executes reactively when debouncedFilter changes.
5. Server-side: getProducts uses withSearchIndex("search_by_name", q => q.search("name", nameFilter))
   when nameFilter is non-empty, providing full-text search with prefix matching and relevance ranking.
6. When nameFilter is empty or not provided, getProducts uses a regular query with order("desc").
```

This same debouncing pattern applies to both the product list search and the OpenFoodFacts search input (though the latter triggers an action call, not a query).

### 3. TanStack Form + ShadCN Field + Zod

```
1. Define Zod schema (productSchema) in product-schema.ts.
2. useForm({
     defaultValues: { name: "", calories: 0, protein: 0, carbs: 0, fat: 0 },
     validators: { onSubmit: productSchema },
     onSubmit: async ({ value }) => { /* call mutation, show toast */ },
   })
3. For each field:
   <form.Field name="name" children={(field) => {
     const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
     return (
       <Field data-invalid={isInvalid}>
         <FieldLabel htmlFor={field.name}>Name</FieldLabel>
         <Input
           id={field.name}
           value={field.state.value}
           onBlur={field.handleBlur}
           onChange={(e) => field.handleChange(e.target.value)}
           aria-invalid={isInvalid}
         />
         {isInvalid && <FieldError errors={field.state.meta.errors} />}
       </Field>
     )
   }} />
```

### 4. Image Upload Flow (3-Step Convex Upload)

For manually created products:

```
1. Generate upload URL:
   const generateUploadUrl = useMutation(api.products.generateUploadUrl)
   const uploadUrl = await generateUploadUrl()

2. POST file to upload URL:
   const result = await fetch(uploadUrl, {
     method: "POST",
     headers: { "Content-Type": file.type },
     body: file,
   })
   const { storageId } = await result.json()

3. Save storage ID:
   - For create: pass storageId as imageId to createProduct mutation.
   - For update: pass storageId as imageId to updateProduct mutation
     (old image is cleaned up server-side).
```

Client-side validation before upload:
- File type: `image/jpeg`, `image/png`, `image/webp` (NFR-3).
- File size: max 5MB (NFR-3).
- Show `toast.error()` if validation fails.

### 5. OpenFoodFacts Image Import Flow (Server-Side Download)

For products imported from OpenFoodFacts, image download happens server-side in the `importProduct` action:

```
1. Client calls: useAction(api.products.importProduct)({
     name, macronutrients, imageUrl: offProduct.imageUrl, barcode
   })

2. Server-side (importProduct action):
   a. If imageUrl is provided:
      - Fetch image from OpenFoodFacts URL (10-second timeout)
      - Get response as Blob
      - Store blob in Convex file storage: storageId = await ctx.storage.store(blob)
   b. If download fails: storageId = undefined (proceed without image)
   c. Call createProductInternal mutation with { name, macronutrients, imageId: storageId, barcode, source: "openfoodfacts" }

3. Client receives the product ID and shows a success toast.
```

### 6. Sidebar Navigation Update

The `app-sidebar.tsx` `navItems` array currently contains placeholder items. The "Products" item should be added with:
- `label: "Products"`
- `icon: Package` (from `lucide-react`)
- `href: "/products"`

The sidebar menu buttons should be updated to use `<Link>` components from TanStack Router for client-side navigation (currently they are non-functional placeholder buttons). At minimum, the "Products" item must use a `<Link to="/products">` wrapper.

### 7. Sonner/Toaster Integration

The `<Toaster>` component is added to the root layout (`__root.tsx`) inside the `<body>` element, after the `<TooltipProvider>` wrapper:

```
<body>
  <TooltipProvider>
    <Outlet />
  </TooltipProvider>
  <Toaster position="top-right" offset="3.5rem" />
  <Scripts />
</body>
```

The `offset` prop (or a `style`/`className` approach) ensures toasts appear below the sticky top bar (which is approximately 3rem/48px tall). The exact offset value may need adjustment during implementation based on the top bar's actual height.

## Shared Validation (Zod Schemas)

Location: `apps/web/src/components/products/product-schema.ts`

```
// Shared Zod schema for product form validation
import { z } from "zod"

export const productFormSchema = z.object({
  name: z.string()
    .min(1, "Product name is required")
    .max(200, "Product name must be at most 200 characters"),
  calories: z.number()
    .int("Calories must be a whole number")
    .min(0, "Calories must be non-negative"),
  protein: z.number()
    .int("Protein must be a whole number")
    .min(0, "Protein must be non-negative"),
  carbs: z.number()
    .int("Carbs must be a whole number")
    .min(0, "Carbs must be non-negative"),
  fat: z.number()
    .int("Fat must be a whole number")
    .min(0, "Fat must be non-negative"),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
```

This schema is shared between `ManualProductForm` (create) and `ProductEditForm` (edit). The image field is handled separately since it uses a File object (not serializable in Zod), validated client-side for type and size before upload.

The TanStack Form `validators` configuration uses this schema:
```
validators: { onSubmit: productFormSchema }
```

TanStack Form supports Zod schemas natively through the Standard Schema interface, so `field.state.meta.errors` produces error objects compatible with ShadCN's `FieldError` component.

## Risk Assessment

### 1. OpenFoodFacts API Availability
- **Risk**: The search-a-licious API may be slow, rate-limited, or temporarily unavailable.
- **Mitigation**: 10-second timeout with AbortController (NFR-2). User-friendly error toast on failure. Import is optional -- products can always be created manually.

### 2. Image Download Failures During Import
- **Risk**: Downloading images from OpenFoodFacts during the `importProduct` action may fail due to network errors, timeouts, or unavailable URLs. This could slow down the import process or leave products without images.
- **Mitigation**: The `importProduct` action handles image download failures gracefully -- if the download fails, the product is created without an image (`imageId` is `null`). A 10-second timeout prevents the action from hanging. The user can later upload an image manually via the edit form.

### 3. TanStack Pacer Beta Status
- **Risk**: `@tanstack/pacer` is relatively new and its API may still evolve.
- **Mitigation**: The `useDebouncedValue` hook has a simple, stable API surface. If the API changes, the migration is localized to 2 call sites (product list search, OpenFoodFacts search). Worst case, the hook can be replaced with a simple custom `useDebouncedValue` implementation.

### 4. Sonner Without next-themes
- **Risk**: The standard ShadCN Sonner wrapper depends on `next-themes`. Adapting it for TanStack Start requires removing that dependency.
- **Mitigation**: The `next-themes` usage is minimal (just `useTheme()` to get the current theme). It can be omitted or replaced with a static value. The core `sonner` library works independently of `next-themes`.

### 5. Virtualization with Dynamic Content
- **Risk**: If product rows have varying heights (e.g., long names wrapping), the fixed `estimateSize` may cause layout shifts.
- **Mitigation**: Use a fixed row height with text truncation (`truncate` class). This ensures consistent row heights and smooth scrolling. Product names that exceed the width are ellipsized.

### 6. Form State Complexity
- **Risk**: TanStack Form is a new dependency in this project. The render-prop pattern (`form.Field children={(field) => ...}`) may be unfamiliar.
- **Mitigation**: The ShadCN documentation provides clear examples of TanStack Form + Field component integration (as documented in the forms/tanstack-form guide). The pattern is consistent across all form fields.

### 7. Search Index Scan Limit
- **Risk**: Convex full-text search queries can scan at most 1024 results. If the product database grows very large and a search term is very common, some results may not be reachable.
- **Mitigation**: For the expected data volume (hundreds to low thousands of products), 1024 results is more than sufficient. If the database grows significantly, more specific search terms will naturally narrow results. This limit applies only to filtered searches -- unfiltered listing uses regular pagination with no scan limit.

### 8. Import Action Latency
- **Risk**: The `importProduct` action involves an HTTP request to download an image, which adds latency compared to a simple mutation. The user may perceive a delay when importing products.
- **Mitigation**: The UI shows a loading state during import. Image download has a 10-second timeout. If the image is large or slow to download, the action still completes (possibly without an image). The latency is a one-time cost per import and is acceptable for the expected usage pattern.

---

## ARCHITECTURE.md Updates

The following changes should be applied to the project-root `ARCHITECTURE.md`:

### Project Structure Section

Add to the `apps/web/src/components/` section:
```
|           |   |-- products/ # Product management components (ProductList, ProductRow,
|           |                 #   AddProductDialog, ManualProductForm, OpenFoodFactsSearch,
|           |                 #   ProductDetailDialog, ProductEditForm, product-schema)
```

Update the `ui/` listing to include new components:
```
|           |   `-- ui/       # ShadCN primitives (AlertDialog, Avatar, Button, Card,
|           |                 #   Dialog, DropdownMenu, Field, Input, Label, Separator,
|           |                 #   Sheet, Sidebar, Skeleton, Sonner, Tabs, Tooltip)
```

Add to the `_authenticated/` routes section:
```
|           |   |   |-- products.tsx          # Product database management page
```

Add to the `packages/backend/convex/` section:
```
|   |   |   |-- products.ts  # Product queries, mutations, and actions
```

### Tech Stack Section

Add new rows:

| Layer           | Technology                          | Purpose                                    |
|-----------------|-------------------------------------|--------------------------------------------|
| Web Forms       | TanStack Form + Zod                | Headless form management with schema validation |
| Web Virtual     | TanStack Virtual                   | Virtualized list rendering                 |
| Web Debounce    | TanStack Pacer                     | Debouncing utilities for search inputs     |
| Web Toasts      | Sonner                             | Toast notifications                        |

### Component Map - apps/web Section

Add after the existing "App Shell" subsection:

- **Products**: The `/_authenticated/products` route (`src/routes/_authenticated/products.tsx`) is an authenticated page inside the app shell for managing the global product database. Features include:
  - **Product List** (`src/components/products/product-list.tsx`): Virtualized infinite-scroll list using `usePaginatedQuery` + `useVirtualizer`. Loads 20 items initially, auto-loads more on scroll. Each row shows image thumbnail, name, and macros.
  - **Search/Filter**: Debounced text input (300ms via `@tanstack/pacer`) that filters products by name using Convex full-text search (search index on `name` field).
  - **Add Product Dialog** (`src/components/products/add-product-dialog.tsx`): Dialog with tabs for Manual creation (TanStack Form + Zod) and OpenFoodFacts import (debounced search + paginated results). Import downloads images into Convex storage via the `importProduct` action.
  - **Product Detail Dialog** (`src/components/products/product-detail-dialog.tsx`): View/edit/delete dialog with TanStack Form for editing, AlertDialog for delete confirmation.
  - **Toast Notifications**: All operations provide feedback via Sonner toasts (success/error).

### Component Map - packages/backend Section

Add to the existing description:
- **Product Functions**: `convex/products.ts` provides queries (`getProducts` with cursor-based pagination and full-text search, `getProduct`), mutations (`createProduct`, `createProductInternal`, `updateProduct`, `deleteProduct`, `generateUploadUrl`), and actions (`searchOpenFoodFacts`, `importProduct`) for product CRUD and OpenFoodFacts integration. The `importProduct` action downloads images from OpenFoodFacts into Convex file storage before creating the product. All functions require authentication. Products are global (not household-scoped).
- **Shared Validators**: `convex/schema.ts` exports `macronutrientsValidator` -- a reusable `v.object(...)` for nutrition data (calories, protein, carbs, fat as non-negative integers per 100g).

### Data Model - Application Tables Section

Add the `product` table:

| Table            | Fields                                      | Indexes                          | Purpose                          |
|------------------|---------------------------------------------|----------------------------------|----------------------------------|
| product          | `name`, `macronutrients` (object), `imageId`, `barcode`, `source` | `search_by_name` (full-text search) | Global product database          |

Update entity relationships diagram:

```
Better Auth user (component-managed)
  |
  | 1:0..1 (a user has zero or one membership)
  |
householdMember
  |
  | N:1 (many members belong to one household)
  |
household

product (standalone, global)
  |
  | 0..1 : 0..1 (optional image)
  |
_storage (Convex file storage)
```

### API Boundaries Section

Add a new subsection:

#### Product API (packages/backend/convex/products.ts)

All functions require authentication. Accessed via `api.products.*`.

**Queries:**

| Function       | Args                                                              | Returns                                    | Description                                       |
|----------------|-------------------------------------------------------------------|--------------------------------------------|---------------------------------------------------|
| `getProducts`  | `{ paginationOpts, nameFilter?: string }`                         | `PaginationResult` with resolved `imageUrl`| Paginated product list with optional full-text search filter |
| `getProduct`   | `{ productId: Id<"product"> }`                                    | `Product` with resolved `imageUrl`         | Single product by ID                              |

**Mutations:**

| Function                | Args                                                              | Returns            | Description                                                 |
|-------------------------|-------------------------------------------------------------------|--------------------|-------------------------------------------------------------|
| `createProduct`         | `{ name, macronutrients, imageId? }`                              | `Id<"product">`    | Creates a manually-entered product                          |
| `createProductInternal` | `{ name, macronutrients, imageId?, barcode?, source }`            | `Id<"product">`    | Internal mutation for creating products from actions         |
| `updateProduct`         | `{ productId, name?, macronutrients?, imageId?, removeImage? }`   | `void`             | Updates product fields; cleans up old images                |
| `deleteProduct`         | `{ productId }`                                                   | `void`             | Deletes product and associated stored image                 |
| `generateUploadUrl`     | `{}`                                                              | `string`           | Generates a Convex file storage upload URL                  |

**Actions:**

| Function               | Args                                    | Returns                                             | Description                           |
|------------------------|-----------------------------------------|-----------------------------------------------------|---------------------------------------|
| `searchOpenFoodFacts`  | `{ query, page?, pageSize? }`           | `{ products, totalCount, pageCount, page }`         | Searches OpenFoodFacts search-a-licious API |
| `importProduct`        | `{ name, macronutrients, imageUrl?, barcode? }` | `Id<"product">`                              | Downloads image into Convex storage and creates product |

**Error handling:** Mutations throw `ConvexError` with descriptive messages. Actions throw `ConvexError` on network/timeout errors (image download failures are handled gracefully).

### Key Design Decisions Section

Add:

13. **Global product database**: Products are not scoped to households. Any authenticated user can create, view, edit, or delete any product. This is appropriate for a self-hosted application where all users share a common food database.

14. **Reusable macronutrient validator**: The `macronutrientsValidator` is defined once in `schema.ts` as an exported `v.object(...)` constant. It is referenced by the `product` table and will be reused by future tables (meal logs, daily targets). Integer enforcement is done in mutations, not at the validator level (Convex `v.number()` does not distinguish integers).

15. **Cursor-based pagination with virtualization**: The product list uses Convex cursor-based pagination (`usePaginatedQuery`) combined with TanStack Virtual (`useVirtualizer`) for a seamless infinite-scroll experience. Only visible rows are rendered in the DOM. New pages load automatically as the user scrolls near the bottom. This scales to thousands of products without UI performance degradation.

16. **TanStack Form for all product forms**: Product create and edit forms use `@tanstack/react-form` with Zod validation and ShadCN Field components. This provides headless form state management, real-time validation feedback, and accessible form markup via the `form.Field` render-prop pattern.

17. **Sonner toasts for operation feedback**: All product mutations report success/error via Sonner toast notifications (`toast.success()`, `toast.error()`). The `Toaster` component is mounted in the root layout positioned top-right below the sticky top bar.

18. **Convex file storage for all product images**: Both manually uploaded images and images imported from OpenFoodFacts are stored in Convex file storage (`imageId` referencing `_storage`). The `importProduct` action downloads external images server-side during import. This eliminates dependency on external image hosting, provides a single image resolution path, and ensures image availability regardless of external service status.

19. **TanStack Pacer for debounced search**: All text search inputs (product list filter, OpenFoodFacts search) use `useDebouncedValue` from `@tanstack/pacer` with a 300ms delay. This prevents excessive query/action calls during typing while providing responsive feedback.

20. **Convex full-text search for product name filtering**: The `product` table uses a `searchIndex("search_by_name", { searchField: "name" })` for server-side text search. When a name filter is active, the `getProducts` query uses `.withSearchIndex()` with BM25 relevance ranking and prefix matching. This replaces client-side post-pagination filtering and ensures every paginated page contains relevant results.
