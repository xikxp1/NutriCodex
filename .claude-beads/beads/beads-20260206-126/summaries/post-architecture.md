# Summary: Product Database Management Architecture

## Key Decisions

- **Global product database**: All authenticated users share one product database (no household scoping).
- **Integer macronutrients**: Values (calories, protein, carbs, fat) stored per 100g as non-negative integers.
- **Cursor-based pagination**: Convex `paginationOptsValidator` with `getProducts(nameFilter)`.
- **Virtualized infinite scroll**: TanStack Virtual + `usePaginatedQuery` renders only visible rows.
- **OpenFoodFacts import**: Search API, image download in `importProduct` action (graceful failure if image unavailable).
- **Debounced search**: `useDebouncedValue` from `@tanstack/pacer` (300ms delay).
- **TanStack Form + Zod**: All product forms (create/edit) use headless forms with validation.
- **Sonner toasts**: Success/error feedback positioned top-right.
- **Image storage strategy**: Convex `_storage` for all product images (uploaded or imported).

## Technical Details

**Data Model**
- `macronutrientsValidator`: Reusable `v.object({ calories, protein, carbs, fat: v.number() })`
- `product` table: `name`, `macronutrients`, `imageId` (optional `_storage` ref), `barcode`, `source: "manual"|"openfoodfacts"`
- Index: `search_by_name` (full-text search on name field)

**Backend (packages/backend/convex/products.ts)**
- Queries: `getProducts({ nameFilter }, paginationOpts)`, `getProduct(productId)`
- Mutations: `createProduct`, `updateProduct`, `deleteProduct`, `generateUploadUrl`
- Internal mutation: `createProductInternal` (called by actions only)
- Actions: `searchOpenFoodFacts({ query, page?, pageSize? })`, `importProduct({ name, macronutrients, imageUrl?, barcode? })`

**Web Components (apps/web/src/)**
- Route: `routes/_authenticated/products.tsx` (authenticated, app shell)
- ProductList: `components/products/product-list.tsx` (virtualized)
- ProductRow: `components/products/product-row.tsx` (thumbnail, name, macros)
- AddProductDialog: `components/products/add-product-dialog.tsx` (Manual/Import tabs)
- ManualProductForm: `components/products/manual-product-form.tsx` (TanStack Form + Zod)
- OpenFoodFactsSearch: `components/products/openfoodfacts-search.tsx` (debounced search + import)
- ProductDetailDialog: `components/products/product-detail-dialog.tsx` (view/edit/delete)
- ProductEditForm: `components/products/product-edit-form.tsx` (TanStack Form)
- product-schema.ts: Shared Zod validation (`productFormSchema`)

**ShadCN Components to Add**
- `ui/dialog.tsx`: Modal overlay (radix-ui Dialog primitive)
- `ui/tabs.tsx`: Tabbed content (radix-ui Tabs primitive)
- `ui/field.tsx`: Form field layout components (FieldSet, Field, FieldLabel, FieldError, etc.)
- `ui/sonner.tsx`: Toaster wrapper (without next-themes dependency)

**Dependencies to Install (apps/web)**
- `@tanstack/react-form`, `@tanstack/react-virtual`, `@tanstack/pacer`, `zod`, `sonner`

**Integration Patterns**
1. Search: input → `useDebouncedValue` → `usePaginatedQuery` → `withSearchIndex("search_by_name")`
2. Image upload: `generateUploadUrl()` → POST to URL → receive storageId → pass to mutation
3. OpenFoodFacts import: client action → download image server-side → create product

**Sidebar Update**
- Add "Products" nav item: label, icon (Package), href `/products`

**Root Layout Update**
- Add `<Toaster position="top-right" offset="3.5rem" />` to root layout

## Files to Create (13)

Backend:
- `packages/backend/convex/products.ts`

Web routes/components:
- `apps/web/src/routes/_authenticated/products.tsx`
- `apps/web/src/components/products/product-list.tsx`
- `apps/web/src/components/products/product-row.tsx`
- `apps/web/src/components/products/add-product-dialog.tsx`
- `apps/web/src/components/products/manual-product-form.tsx`
- `apps/web/src/components/products/openfoodfacts-search.tsx`
- `apps/web/src/components/products/product-detail-dialog.tsx`
- `apps/web/src/components/products/product-edit-form.tsx`
- `apps/web/src/components/products/product-schema.ts`

ShadCN UI:
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/components/ui/tabs.tsx`
- `apps/web/src/components/ui/field.tsx`
- `apps/web/src/components/ui/sonner.tsx`

## Files to Modify (4)

- `packages/backend/convex/schema.ts`: Add `macronutrientsValidator` export and `product` table
- `apps/web/src/components/layout/app-sidebar.tsx`: Add "Products" nav item
- `apps/web/src/routes/__root.tsx`: Add `<Toaster>` component
- `apps/web/package.json`: Add dependencies

## Open Items

None — all requirements clarified and design is complete.
