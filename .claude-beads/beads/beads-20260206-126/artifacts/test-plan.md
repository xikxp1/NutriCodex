# Test Plan: Product Database Management with Nutrition Tracking and OpenFoodFacts Import

## Test Strategy

- **Framework**: Vitest (already configured in `apps/web/vitest.config.ts`) with jsdom environment, Testing Library React, and `@testing-library/jest-dom/vitest` matchers
- **Test types**: Unit tests (Vitest) + manual integration test scenarios
- **Static verification**: `bun run lint` (Biome), `bun run type-check` (TypeScript), `bun run build` (Vite)
- **Run command (unit tests)**: `cd apps/web && bun run test` or `cd apps/web && bun vitest run`
- **Run command (static checks)**: `bun run lint && bun run type-check && bun run build` (from repo root)

### Test Approach

This project has an established Vitest test suite in `apps/web/src/__tests__/` with existing patterns for:
- **Export specification tests**: Verify that new ShadCN components export all required sub-components (see `alert-dialog-exports.test.tsx` pattern)
- **Component render tests**: Verify components render correctly with mocked dependencies (see `app-sidebar.test.tsx` pattern)
- **Integration tests**: Verify component interactions with mocked Convex hooks and router (see `user-menu-household.test.tsx` pattern)

The backend (`packages/backend`) uses Convex and has no unit test framework. Backend correctness is verified through TypeScript type-checking, lint, build, and manual integration testing.

## Test Matrix

| Requirement | Subtask | Test File | Test Description |
|-------------|---------|-----------|-----------------|
| FR-1 | sub-01 | (type-check) | `macronutrientsValidator` exported from `schema.ts`, used in product table definition |
| FR-2 | sub-01 | (type-check) | `product` table in schema with all required fields, `search_by_name` search index, no `householdId` |
| FR-3 | sub-01 | (type-check + manual) | Nutrition fields use `v.number()`, integer enforcement in mutations |
| FR-4 | sub-01 | (type-check + manual) | `createProduct` mutation exists with correct args/return type |
| FR-5 | sub-01 | (type-check + manual) | `getProducts` query with `paginationOptsValidator` and optional `nameFilter` |
| FR-6 | sub-01 | (type-check + manual) | `getProduct` query with `productId` arg |
| FR-7 | sub-01 | (type-check + manual) | `updateProduct` mutation with partial update args |
| FR-8 | sub-01 | (type-check + manual) | `deleteProduct` mutation that removes product and stored image |
| FR-9 | sub-01 | (type-check + manual) | `generateUploadUrl` mutation |
| FR-10 | sub-01 | (type-check + manual) | `searchOpenFoodFacts` action with correct API call |
| FR-11 | sub-01 | (type-check + manual) | `importProduct` action that downloads image and creates product |
| FR-22 | sub-02 | `__tests__/components/ui/sonner-exports.test.tsx` | Sonner Toaster component exports and mounts in root layout |
| FR-22 | sub-02 | `__tests__/components/ui/dialog-exports.test.tsx` | Dialog component exports all required sub-components |
| FR-22 | sub-02 | `__tests__/components/ui/tabs-exports.test.tsx` | Tabs component exports all required sub-components |
| FR-22 | sub-02 | `__tests__/components/ui/field-exports.test.tsx` | Field component exports all required sub-components |
| FR-12 | sub-03 | `__tests__/components/layout/app-sidebar-products.test.tsx` | "Products" link in sidebar navigation |
| FR-13, NFR-1 | sub-03 | `__tests__/components/products/product-list.test.tsx` | ProductList component uses virtualization and pagination |
| FR-14, NFR-8 | sub-03 | `__tests__/routes/products-page.test.tsx` | Products page with debounced search input |
| FR-13 | sub-03 | `__tests__/components/products/product-row.test.tsx` | ProductRow displays image, name, and macros |
| FR-16 | sub-03 | `__tests__/components/products/product-schema.test.ts` | Shared Zod validation schema correctness |
| FR-15 | sub-04 | `__tests__/components/products/add-product-dialog.test.tsx` | AddProductDialog with Manual/Import tabs |
| FR-16, NFR-3, NFR-4 | sub-04 | `__tests__/components/products/manual-product-form.test.tsx` | Manual form validation and submission |
| FR-17, NFR-2, NFR-8 | sub-05 | `__tests__/components/products/openfoodfacts-search.test.tsx` | OpenFoodFacts search with debounce and import |
| FR-19 | sub-06 | `__tests__/components/products/product-detail-dialog.test.tsx` | Product detail view/edit/delete dialog |
| FR-20, FR-21 | sub-06 | `__tests__/components/products/product-edit-form.test.tsx` | Product edit form with image replace/remove |

## Detailed Verification by Subtask

---

### sub-01: Backend schema + product functions

**Files created**: `packages/backend/convex/products.ts`
**Files modified**: `packages/backend/convex/schema.ts`

#### Static Verification

After completing sub-01, the following commands must pass with zero errors:

```bash
bun run type-check
bun run lint
bun run build
```

#### Schema Verification (FR-1, FR-2)

1. **macronutrientsValidator export**: `packages/backend/convex/schema.ts` must export a `macronutrientsValidator` constant defined as `v.object({ calories: v.number(), protein: v.number(), carbs: v.number(), fat: v.number() })`.
2. **product table definition**: The schema must define a `product` table with fields: `name: v.string()`, `macronutrients: macronutrientsValidator`, `imageId: v.optional(v.id("_storage"))`, `barcode: v.optional(v.string())`, `source: v.union(v.literal("manual"), v.literal("openfoodfacts"))`.
3. **search_by_name index**: The `product` table must have `.searchIndex("search_by_name", { searchField: "name" })`.
4. **No householdId field**: The `product` table must NOT have a `householdId` field.
5. **No externalImageUrl field**: The `product` table must NOT have an `externalImageUrl` field.

#### Function Signature Verification (FR-4 through FR-11)

Verify the following functions exist in `packages/backend/convex/products.ts` with correct argument types (type-check will validate):

| Function | Type | Required Args |
|----------|------|---------------|
| `getProducts` | query | `paginationOpts` (paginationOptsValidator), `nameFilter` (optional string) |
| `getProduct` | query | `productId` (Id<"product">) |
| `createProduct` | mutation | `name` (string), `macronutrients` (macronutrientsValidator), `imageId` (optional Id<"_storage">) |
| `createProductInternal` | mutation/internalMutation | `name`, `macronutrients`, `imageId?`, `barcode?`, `source` |
| `updateProduct` | mutation | `productId` (Id<"product">), all other fields optional |
| `deleteProduct` | mutation | `productId` (Id<"product">) |
| `generateUploadUrl` | mutation | (none) |
| `searchOpenFoodFacts` | action | `query` (string), `page` (optional number), `pageSize` (optional number) |
| `importProduct` | action | `name`, `macronutrients`, `imageUrl?`, `barcode?` |

#### Manual Integration Tests (FR-3 through FR-11)

These scenarios should be verified with `convex dev` running:

1. **FR-4: createProduct validation**
   - Create a product with valid data: name "Test Product", calories 100, protein 20, carbs 30, fat 10. Verify it returns a product ID.
   - Attempt to create with empty name (after trim). Verify `ConvexError` is thrown.
   - Attempt to create with name longer than 200 characters. Verify `ConvexError`.
   - Attempt to create with negative calorie value. Verify `ConvexError`.
   - Attempt to create with non-integer calorie value (e.g., 10.5). Verify `ConvexError`.
   - Verify `source` is set to `"manual"` for created products.

2. **FR-5: getProducts pagination and search**
   - Create 25 products. Call `getProducts` with `initialNumItems: 20`. Verify first page returns 20 items and `isDone` is false.
   - Call with `nameFilter: "test"`. Verify results are filtered by name server-side.
   - Call with empty `nameFilter`. Verify results are ordered newest-first.
   - Verify each product in results has a resolved `imageUrl` field (null if no image).

3. **FR-6: getProduct**
   - Get a product by valid ID. Verify all fields are returned with resolved `imageUrl`.
   - Get a product by non-existent ID. Verify `ConvexError("Product not found")`.

4. **FR-7: updateProduct**
   - Update a product's name. Verify the change persists.
   - Update macronutrients only. Verify name is unchanged.
   - Upload an image, then update with a new `imageId`. Verify the old image is deleted from storage.
   - Set `removeImage: true`. Verify `imageId` becomes undefined and old image is deleted.
   - Attempt to update a non-existent product. Verify `ConvexError`.

5. **FR-8: deleteProduct**
   - Delete a product without an image. Verify it is removed.
   - Delete a product with an image. Verify both the product and the stored image are removed.
   - Attempt to delete a non-existent product. Verify `ConvexError`.

6. **FR-9: generateUploadUrl**
   - Call `generateUploadUrl`. Verify it returns a string URL.

7. **FR-10: searchOpenFoodFacts**
   - Search for "banana". Verify results contain `products` array with `name`, `calories`, `protein`, `carbs`, `fat`, `imageUrl`, `barcode`, `brand` fields.
   - Verify pagination metadata: `totalCount`, `pageCount`, `page`.
   - Search with query shorter than 2 characters. Verify error.
   - Verify `User-Agent` header is set (code review -- cannot verify externally).
   - Verify products missing a name are filtered out.
   - Verify nutrition values are rounded to integers.

8. **FR-11: importProduct**
   - Import a product with a valid `imageUrl`. Verify the product is created with `source: "openfoodfacts"`, `barcode` populated, and `imageId` set.
   - Import a product with an invalid/unreachable `imageUrl`. Verify the product is still created but without an image (graceful failure).
   - Import a product without `imageUrl`. Verify the product is created without an image.
   - Verify all macronutrient values are stored as integers.

---

### sub-02: Install dependencies + ShadCN components

**Files created**: `dialog.tsx`, `tabs.tsx`, `field.tsx`, `sonner.tsx` (all in `apps/web/src/components/ui/`)
**Files modified**: `apps/web/src/routes/__root.tsx`, `apps/web/package.json`

#### Static Verification

```bash
bun run type-check
bun run lint
bun run build
```

#### Unit Tests

**Test file**: `apps/web/src/__tests__/components/ui/dialog-exports.test.tsx`

| Test | Description |
|------|-------------|
| Dialog exports specification | Verify the module exports: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` |
| Uses radix-ui import pattern | Documents that Dialog imports from `"radix-ui"` (matching project convention) |
| Uses cn from utils | Documents the `cn()` utility usage |

**Test file**: `apps/web/src/__tests__/components/ui/tabs-exports.test.tsx`

| Test | Description |
|------|-------------|
| Tabs exports specification | Verify the module exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| Uses radix-ui import pattern | Documents Tabs imports from `"radix-ui"` |

**Test file**: `apps/web/src/__tests__/components/ui/field-exports.test.tsx`

| Test | Description |
|------|-------------|
| Field exports specification | Verify the module exports: `Field`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLabel`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldTitle` |
| FieldError accepts errors array | Documents that `FieldError` accepts a TanStack Form compatible `errors` prop |
| No radix-ui dependency | Documents that Field components are pure layout wrappers |

**Test file**: `apps/web/src/__tests__/components/ui/sonner-exports.test.tsx`

| Test | Description |
|------|-------------|
| Sonner Toaster export | Verify the module exports `Toaster` component |
| No next-themes dependency | Documents that the wrapper omits `next-themes` usage |

#### Manual Verification (FR-22)

1. Verify `<Toaster position="top-right" />` is present in `__root.tsx` after the `<TooltipProvider>` block.
2. Verify toasts appear in the top-right corner, below the sticky top bar when triggered.
3. Verify new dependencies are installed: `@tanstack/react-form`, `@tanstack/react-virtual`, `@tanstack/pacer`, `zod`, `sonner`.

---

### sub-03: Products page route + sidebar nav + product list

**Files created**: `products.tsx` (route), `product-list.tsx`, `product-row.tsx`, `product-schema.ts` (all in `apps/web/src/`)
**Files modified**: `apps/web/src/components/layout/app-sidebar.tsx`

#### Static Verification

```bash
bun run type-check
bun run lint
bun run build
```

#### Unit Tests

**Test file**: `apps/web/src/__tests__/components/products/product-schema.test.ts`

| Test | Description | Requirement |
|------|-------------|-------------|
| Valid product form data passes validation | `{ name: "Banana", calories: 89, protein: 1, carbs: 23, fat: 0 }` passes | FR-16 |
| Empty name fails validation | `{ name: "", ... }` is rejected | FR-16 |
| Name longer than 200 chars fails | 201-char name is rejected | FR-4, FR-16 |
| Name of exactly 200 chars passes | 200-char name is accepted | FR-4 |
| Negative calorie value fails | `{ calories: -1, ... }` is rejected | FR-3, FR-16 |
| Non-integer calorie value fails | `{ calories: 10.5, ... }` is rejected | FR-3, FR-16 |
| Zero values pass validation | All macros at 0 is valid | FR-16 |
| Missing name field fails | Omitting `name` is rejected | FR-16 |
| Missing macronutrient field fails | Omitting `calories` is rejected | FR-16 |
| Very large integer values pass | `{ calories: 9999, ... }` passes | FR-3 |

**Test file**: `apps/web/src/__tests__/components/layout/app-sidebar-products.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| Products link is visible in sidebar | "Products" text appears in the rendered sidebar | FR-12 |
| Products link has a Lucide icon | SVG icon exists next to the "Products" label | FR-12 |
| Products link navigates to /products | The link points to the `/products` route | FR-12 |

**Test file**: `apps/web/src/__tests__/components/products/product-row.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| Renders product name | Product name text is displayed | FR-13 |
| Renders macro summary with integer values | Shows calories, protein, carbs, fat as integers (no decimals) | FR-13, FR-3 |
| Renders image thumbnail when imageUrl provided | An `<img>` element is rendered with the image URL | FR-13, NFR-7 |
| Renders placeholder when no imageUrl | A fallback icon/placeholder is displayed | FR-13, NFR-7 |
| Calls onClick when row is clicked | The `onClick` callback fires | FR-19 |

**Test file**: `apps/web/src/__tests__/components/products/product-list.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| ProductList component exports | Module exports `ProductList` as a function component | FR-13 |
| Accepts nameFilter prop | Component interface includes `nameFilter: string` | FR-14 |
| Documents usePaginatedQuery + useVirtualizer integration | Architecture pattern documentation test | FR-13, NFR-1 |

**Test file**: `apps/web/src/__tests__/routes/products-page.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| Products route module exports Route | `~/routes/_authenticated/products` exports a `Route` object | FR-12 |
| Page contains a search input | Documents the search input requirement | FR-14 |
| Page contains an "Add Product" button | Documents the "Add Product" button requirement | FR-15 |

#### Manual Integration Tests

1. **FR-12**: Navigate to `/products`. Verify the page loads within the authenticated app shell.
2. **FR-12**: Verify "Products" appears in the sidebar navigation and clicking it navigates to `/products`.
3. **FR-13**: With products in the database, verify the list renders with image thumbnails, names, and macro summaries.
4. **FR-13**: Scroll down the product list. Verify new pages load automatically (infinite scroll). Verify only visible rows are in the DOM (check via DevTools).
5. **FR-14**: Type in the search input. Verify the query fires after a 300ms pause (not on every keystroke). Verify results are filtered server-side.
6. **FR-14**: Clear the search input. Verify all products reappear in newest-first order.
7. **NFR-1**: Load 100+ products. Verify scrolling is smooth with no jank.
8. **NFR-7**: Verify product image thumbnails are consistent size (40-48px) with `object-cover`.

---

### sub-04: Add Product Dialog -- manual creation

**Files created**: `add-product-dialog.tsx`, `manual-product-form.tsx`
**Files modified**: `apps/web/src/routes/_authenticated/products.tsx`

#### Static Verification

```bash
bun run type-check
bun run lint
bun run build
```

#### Unit Tests

**Test file**: `apps/web/src/__tests__/components/products/add-product-dialog.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| AddProductDialog exports | Module exports `AddProductDialog` as a function component | FR-15 |
| Accepts open/onOpenChange props | Component interface matches architecture | FR-15 |
| Documents Manual and Import tabs | Tab structure specification | FR-15 |

**Test file**: `apps/web/src/__tests__/components/products/manual-product-form.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| ManualProductForm exports | Module exports `ManualProductForm` as a function component | FR-16 |
| Accepts onSuccess callback prop | Component interface matches architecture | FR-16 |
| Documents required form fields | Name, calories, protein, carbs, fat inputs + optional image | FR-16 |
| Documents image file type restriction | Only image/jpeg, image/png, image/webp accepted | NFR-3 |
| Documents 5MB file size limit | Client-side validation before upload | NFR-3 |
| Documents 3-step Convex upload flow | generateUploadUrl, POST file, pass storageId | FR-16 |

#### Manual Integration Tests

1. **FR-15**: Click "Add Product". Verify a dialog opens with "Manual" and "Import from OpenFoodFacts" tabs.
2. **FR-16**: In the Manual tab, fill in all required fields (name, calories, protein, carbs, fat). Click Save. Verify the product is created and appears in the list.
3. **FR-16**: Submit with empty name. Verify an inline validation error appears via ShadCN `FieldError`.
4. **FR-16**: Enter a non-integer value for calories (e.g., "10.5"). Verify validation error.
5. **FR-16**: Enter a negative value for protein. Verify validation error.
6. **FR-16**: Upload a valid image (JPEG, < 5MB). Verify the image is stored and the product has an image thumbnail.
7. **NFR-3**: Attempt to upload a non-image file (e.g., .pdf). Verify client-side rejection.
8. **NFR-3**: Attempt to upload an image larger than 5MB. Verify client-side rejection.
9. **FR-23**: On successful creation, verify a success toast appears ("Product created" or similar).
10. **FR-23**: On server error, verify an error toast appears with a descriptive message.
11. **NFR-4**: Verify server-side validation catches invalid data even if client-side validation is bypassed.

---

### sub-05: Add Product Dialog -- OpenFoodFacts import

**Files created**: `openfoodfacts-search.tsx`
**Files modified**: `add-product-dialog.tsx`

#### Static Verification

```bash
bun run type-check
bun run lint
bun run build
```

#### Unit Tests

**Test file**: `apps/web/src/__tests__/components/products/openfoodfacts-search.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| OpenFoodFactsSearch exports | Module exports `OpenFoodFactsSearch` as a function component | FR-17 |
| Accepts onImported callback prop | Component interface matches architecture | FR-17 |
| Documents debounced search (300ms) | Specification for search input debouncing | FR-17, NFR-8 |
| Documents pagination controls | Previous/Next buttons based on pageCount/page | FR-17 |
| Documents import button per result | Each search result has an "Import" button | FR-17 |

#### Manual Integration Tests

1. **FR-17**: In the Import tab, type "banana" in the search input. Verify results appear after 300ms debounce.
2. **FR-17**: Verify each result shows: name, brand, image thumbnail, and macros (as integers).
3. **FR-17**: Verify pagination controls (Previous/Next) appear when there are multiple pages of results.
4. **FR-17**: Click "Import" on a result. Verify a loading indicator appears during import.
5. **FR-17**: After import completes, verify a success toast appears. Verify the product appears in the product list with its image (if available).
6. **FR-17**: Import a product whose image URL is broken/unreachable. Verify the product is still imported without an image. Verify a success toast still appears.
7. **FR-18**: After importing, navigate to the product detail. Verify the product is fully editable (name, macros, image).
8. **NFR-2**: Simulate a slow/unavailable OpenFoodFacts API (e.g., disconnect network). Verify an error toast appears, not a crash.
9. **NFR-8**: Type rapidly in the search input. Verify only one query fires after the 300ms debounce, not one per keystroke.
10. **FR-23**: Verify both success and error toasts appear for import operations.

---

### sub-06: Product Detail Dialog -- view/edit/delete

**Files created**: `product-detail-dialog.tsx`, `product-edit-form.tsx`
**Files modified**: `product-list.tsx`

#### Static Verification

```bash
bun run type-check
bun run lint
bun run build
```

#### Unit Tests

**Test file**: `apps/web/src/__tests__/components/products/product-detail-dialog.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| ProductDetailDialog exports | Module exports `ProductDetailDialog` as a function component | FR-19 |
| Accepts productId, open, onOpenChange props | Component interface matches architecture | FR-19 |
| Documents view mode content | Name, image, nutrition facts, source, barcode | FR-19 |
| Documents Edit button | Switches to edit mode | FR-19 |
| Documents Delete button with AlertDialog | Confirmation dialog before deletion | FR-19 |

**Test file**: `apps/web/src/__tests__/components/products/product-edit-form.test.tsx`

| Test | Description | Requirement |
|------|-------------|-------------|
| ProductEditForm exports | Module exports `ProductEditForm` as a function component | FR-20 |
| Accepts product, onSuccess, onCancel props | Component interface matches architecture | FR-20 |
| Documents pre-populated form fields | Form is pre-filled with current product values | FR-20 |
| Documents image replace capability | User can upload a new image to replace existing | FR-21 |
| Documents image remove capability | User can remove existing image entirely | FR-21 |
| Documents TanStack Form + Zod validation | Same validation schema as creation form | FR-20 |

#### Manual Integration Tests

1. **FR-19**: Click a product in the list. Verify a detail dialog opens showing: name, image (if available), nutrition facts (calories, protein, carbs, fat as integers per 100g), source indicator (manual/openfoodfacts), barcode (if imported).
2. **FR-19**: Click "Edit". Verify form fields become editable with current values pre-populated.
3. **FR-20**: Change the product name and save. Verify the change persists and a success toast appears.
4. **FR-20**: Enter invalid data (empty name, negative values). Verify inline validation errors appear.
5. **FR-21**: Upload a new image to replace the existing one. Verify the old image is replaced.
6. **FR-21**: Remove an existing image. Verify the product no longer has an image after save.
7. **FR-19**: Click "Delete". Verify an AlertDialog confirmation appears.
8. **FR-19**: Confirm deletion. Verify the product is removed from the list, its image is deleted from storage, and a success toast appears.
9. **FR-19**: Cancel deletion. Verify the product remains.
10. **FR-23**: Verify success and error toasts for update and delete operations.
11. **FR-18**: Open an OpenFoodFacts-imported product. Verify it shows the source as "openfoodfacts" and the barcode. Verify it is fully editable.

---

### sub-07: Update ARCHITECTURE.md + final polish

**Files modified**: `ARCHITECTURE.md`

#### Static Verification

```bash
bun run type-check
bun run lint
bun run build
```

#### Documentation Verification

1. **Project Structure**: Verify `ARCHITECTURE.md` includes `products/` components directory, new `ui/` components (Dialog, Field, Sonner, Tabs), the `products.tsx` route, and `products.ts` in backend.
2. **Tech Stack**: Verify new entries for TanStack Form, TanStack Virtual, TanStack Pacer, Sonner.
3. **Component Map**: Verify Products subsection under `apps/web`, Product Functions under `packages/backend`.
4. **Data Model**: Verify `product` table is documented with all fields and the `search_by_name` index.
5. **API Boundaries**: Verify Product API section with all queries, mutations, and actions.
6. **Key Design Decisions**: Verify decisions 13-20 are documented.

#### End-to-End Smoke Tests

After all subtasks are complete, verify the complete user flow:

1. Log in as an authenticated user.
2. Verify "Products" appears in the sidebar.
3. Navigate to `/products`. Verify an empty list or existing products are displayed.
4. Click "Add Product", switch to Manual tab.
5. Fill in product details and optional image. Save. Verify success toast and product appears in list.
6. Click the product to open detail dialog. Verify all data is correct.
7. Edit the product (change name, update macros). Save. Verify success toast and updated data.
8. Replace the product image. Save. Verify new image appears.
9. Remove the product image. Save. Verify placeholder appears.
10. Delete the product. Confirm. Verify success toast and product removed.
11. Click "Add Product", switch to Import tab.
12. Search for a food item (e.g., "nutella"). Verify results appear after debounce.
13. Paginate through results. Verify Previous/Next work correctly.
14. Import a product. Verify success toast and product appears in list with image.
15. Open the imported product. Verify source shows "openfoodfacts" and barcode is displayed.
16. Edit the imported product. Verify it is fully editable.
17. Use the search filter on the product list. Verify products are filtered by name.
18. Clear the filter. Verify all products reappear.
19. Scroll through a list of 50+ products. Verify infinite scroll loads more automatically.
20. Verify all toasts appear in top-right, below the top bar, and stack correctly.

## Coverage Goals

### What is covered by these tests

- **Backend schema correctness**: Type-checking validates the `product` table definition, `macronutrientsValidator`, and all function signatures.
- **ShadCN component exports**: Unit tests verify all new UI primitives (Dialog, Tabs, Field, Sonner) export required sub-components.
- **Shared validation schema**: Unit tests verify the Zod `productFormSchema` accepts valid data and rejects invalid data (name length, integer enforcement, non-negative values).
- **Sidebar navigation**: Unit tests verify "Products" link appears in the sidebar.
- **Component structure**: Unit tests verify ProductRow renders product data correctly (name, macros, image/placeholder).
- **Component exports and interfaces**: Unit tests verify all product components export correctly with documented prop interfaces.
- **Manual integration scenarios**: Comprehensive scenarios cover all 23 functional requirements and 8 non-functional requirements through manual testing.

### What is explicitly deferred and why

- **Full Convex function behavior testing**: Convex server functions cannot be unit tested with Vitest because they require the Convex runtime and database. These are verified through type-checking and manual integration testing. A future iteration could add Convex function tests using the Convex test framework if it becomes available.
- **Full React rendering tests for product pages**: Components like `ProductList` depend heavily on `usePaginatedQuery` and `useVirtualizer` which are complex to mock correctly. Export and structural tests are provided; full rendering is verified manually.
- **OpenFoodFacts API mocking**: The `searchOpenFoodFacts` action makes external HTTP calls. Mocking the fetch layer in Convex actions is not feasible with the current setup. Verified manually.
- **Mobile app testing**: Mobile product UI is explicitly out of scope per requirements.
- **Performance benchmarking**: NFR-1 (smooth scrolling at 60fps) is verified manually, not via automated performance tests.

## Running Tests

### Run all unit tests (from repo root)

```bash
cd /Users/xikxp1/Projects/NutriCodex/apps/web && bun run test
```

### Run tests for a specific subtask

```bash
# sub-02: ShadCN component exports
cd /Users/xikxp1/Projects/NutriCodex/apps/web && bun vitest run src/__tests__/components/ui/dialog-exports.test.tsx src/__tests__/components/ui/tabs-exports.test.tsx src/__tests__/components/ui/field-exports.test.tsx src/__tests__/components/ui/sonner-exports.test.tsx

# sub-03: Products page, sidebar, product list, product row, schema
cd /Users/xikxp1/Projects/NutriCodex/apps/web && bun vitest run src/__tests__/components/products/product-schema.test.ts src/__tests__/components/layout/app-sidebar-products.test.tsx src/__tests__/components/products/product-row.test.tsx src/__tests__/components/products/product-list.test.tsx src/__tests__/routes/products-page.test.tsx

# sub-04: Add product dialog + manual form
cd /Users/xikxp1/Projects/NutriCodex/apps/web && bun vitest run src/__tests__/components/products/add-product-dialog.test.tsx src/__tests__/components/products/manual-product-form.test.tsx

# sub-05: OpenFoodFacts search
cd /Users/xikxp1/Projects/NutriCodex/apps/web && bun vitest run src/__tests__/components/products/openfoodfacts-search.test.tsx

# sub-06: Product detail dialog + edit form
cd /Users/xikxp1/Projects/NutriCodex/apps/web && bun vitest run src/__tests__/components/products/product-detail-dialog.test.tsx src/__tests__/components/products/product-edit-form.test.tsx
```

### Run static verification (from repo root)

```bash
cd /Users/xikxp1/Projects/NutriCodex && bun run lint && bun run type-check && bun run build
```
