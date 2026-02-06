# Plan: Product Database Management with Nutrition Tracking and OpenFoodFacts Import

## Summary

This plan breaks the product database management feature into 7 subtasks, ordered by dependency. The approach is bottom-up: backend schema and functions first, then dependencies and UI primitives, then the page skeleton with list rendering, then the two creation flows (manual and import), then the detail/edit/delete dialog, and finally ARCHITECTURE.md updates with integration polish.

Each subtask produces a working, committable state. Backend work comes first so that subsequent UI subtasks can immediately consume real Convex functions. ShadCN components and dependencies are installed as a separate subtask to keep concerns clean and avoid bloating the backend subtask.

## Subtask Breakdown

| # | ID | Title | Complexity | Dependencies | Description |
|---|-----|-------|------------|--------------|-------------|
| 1 | beads-20260206-126-sub-01 | Backend schema + product functions | large | none | Add `macronutrientsValidator` and `product` table with `search_by_name` search index to `schema.ts`. Create `products.ts` with all Convex functions: queries (`getProducts` with pagination + full-text search, `getProduct`), mutations (`createProduct`, `createProductInternal`, `updateProduct`, `deleteProduct`, `generateUploadUrl`), and actions (`searchOpenFoodFacts` with search-a-licious API, `importProduct` with image download). Covers FR-1 through FR-11. |
| 2 | beads-20260206-126-sub-02 | Install dependencies + ShadCN components | small | none | Install `@tanstack/react-form`, `@tanstack/react-virtual`, `@tanstack/pacer`, `zod`, `sonner` to `apps/web`. Add ShadCN UI components: `dialog.tsx`, `tabs.tsx`, `field.tsx`, `sonner.tsx`. Mount `<Toaster position="top-right">` in root layout (`__root.tsx`). Covers FR-22, NFR-5. |
| 3 | beads-20260206-126-sub-03 | Products page route + sidebar nav + product list | large | sub-01, sub-02 | Create the `/_authenticated/products` route with debounced search input (300ms via `@tanstack/pacer`) and "Add Product" button placeholder. Implement `ProductList` with `usePaginatedQuery` + `useVirtualizer` for virtualized infinite scroll. Implement `ProductRow` with image thumbnail, name, and macro summary. Add "Products" link to sidebar navigation in `app-sidebar.tsx`. Create shared `product-schema.ts` with Zod validation. Covers FR-12, FR-13, FR-14, NFR-1, NFR-6, NFR-7, NFR-8. |
| 4 | beads-20260206-126-sub-04 | Add Product Dialog -- manual creation | medium | sub-03 | Implement `AddProductDialog` with tabs (Manual/Import). Implement `ManualProductForm` with TanStack Form + Zod validation, image upload via 3-step Convex flow, client-side file validation (type + 5MB size limit). The Import tab shows a placeholder for now. Success/error feedback via Sonner toasts. Covers FR-15, FR-16, FR-23, NFR-3, NFR-4. |
| 5 | beads-20260206-126-sub-05 | Add Product Dialog -- OpenFoodFacts import | medium | sub-04 | Implement `OpenFoodFactsSearch` component with debounced search input (300ms), paginated results display (Previous/Next), and "Import" button per result that calls the `importProduct` action. Replace the Import tab placeholder in `AddProductDialog`. Loading states for search and import. Success/error toasts. Covers FR-17, FR-18, FR-23, NFR-2, NFR-8. |
| 6 | beads-20260206-126-sub-06 | Product Detail Dialog -- view/edit/delete | large | sub-03 | Implement `ProductDetailDialog` for viewing product details (name, image, nutrition, source, barcode). Implement `ProductEditForm` with TanStack Form + Zod for editing, including image replace/remove. Add delete with `AlertDialog` confirmation. Wire clicking a `ProductRow` to open the detail dialog. Success/error toasts for all operations. Covers FR-19, FR-20, FR-21, FR-23, NFR-3. |
| 7 | beads-20260206-126-sub-07 | Update ARCHITECTURE.md + final polish | small | sub-06 | Apply all ARCHITECTURE.md updates from the architecture artifact (project structure, tech stack, component map, data model, API boundaries, key design decisions). Verify end-to-end integration. Covers documentation completeness. |

## Dependency Graph

```
sub-01 (Backend schema + products.ts)
  |                                      sub-02 (Dependencies + ShadCN components)
  |                                        |
  +------------------+---------------------+
                     |
                     v
              sub-03 (Products page + list + sidebar)
                     |
                     v
              sub-04 (Add Product Dialog -- manual)
                     |
                     v
              sub-05 (Add Product Dialog -- OpenFoodFacts import)
                     |
              sub-06 (Product Detail Dialog -- view/edit/delete)
                     |
                     v
              sub-07 (ARCHITECTURE.md + polish)
```

Note: sub-01 and sub-02 can be worked on in parallel since they have no mutual dependency. Sub-03 depends on both. Sub-04 through sub-07 are sequential.

## Implementation Order

1. **sub-01 (Backend)**: Foundational -- all UI work depends on having the Convex functions and schema in place.
2. **sub-02 (Dependencies)**: Can run in parallel with sub-01. Installs npm packages and adds ShadCN UI primitives that all subsequent UI subtasks need.
3. **sub-03 (Products page + list)**: The main page skeleton. Establishes the route, sidebar navigation, virtualized list with search, and shared Zod schema. This is the largest UI subtask and the foundation for dialogs.
4. **sub-04 (Manual creation)**: Adds the "Add Product" dialog with the manual form tab. Depends on the page existing and the shared schema.
5. **sub-05 (OpenFoodFacts import)**: Completes the "Add Product" dialog by implementing the Import tab. Depends on the dialog structure from sub-04.
6. **sub-06 (Detail/edit/delete)**: The product detail dialog with view, edit, and delete capabilities. Depends on the product list (sub-03) for row click handling.
7. **sub-07 (ARCHITECTURE.md)**: Final documentation update and integration verification. Must be last since it documents the completed feature.

## Branch
- Name: `beads/beads-20260206-126/product-database`
- Created from: `main`
