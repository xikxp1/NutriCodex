# Summary: Product Database Management with Nutrition Tracking

## Key Decisions

- **Global, not household-scoped products**: All authenticated users share a single product database. No per-household filtering or access control.
- **Integer macronutrient storage**: Values (calories, protein, carbs, fat) stored per 100g as non-negative integers; OpenFoodFacts values rounded on import.
- **Cursor-based server-side pagination**: Convex `paginationOptsValidator` with `getProducts(nameFilter)` query; `usePaginatedQuery` hook on client.
- **Virtualized infinite-scroll list**: TanStack Virtual + `usePaginatedQuery` renders only visible rows; auto-loads 20 items at bottom scroll.
- **Search-a-licious OpenFoodFacts API**: `GET https://search.openfoodfacts.org/search?q=&page=&page_size=&fields=product_name,nutriments,image_url,code,brands`.
- **Debounce all text inputs**: 300ms via `@tanstack/pacer` (product name filter, OpenFoodFacts search).
- **TanStack Form + Zod**: All forms (manual create, edit) use TanStack Form with Zod validation, ShadCN Field components.
- **Sonner toast notifications**: All success/error feedback top-right positioned below sticky top bar.
- **Dual image sources**: Manually uploaded images stored in Convex `_storage` (ID in `imageId`); OpenFoodFacts images stored as external URLs (`externalImageUrl`).

## Technical Details

### Data Model
- **Reusable macronutrient validator**: `{ calories, protein, carbs, fat: v.number() }` (non-negative integers)
- **Product table fields**: `name`, `macronutrients` (object), `imageId`, `externalImageUrl`, `barcode`, `source: "manual"|"openfoodfacts"`
- **Index**: `by_name` on product name for efficient filtering

### API (Convex, packages/backend/convex/products.ts)

**Queries:**
- `getProducts({ nameFilter }, paginationOpts)` → `{ page, isDone, continueCursor }` (products with resolved `imageUrl`)
- `getProduct(productId)` → product with resolved `imageUrl`

**Mutations:**
- `createProduct({ name, macronutrients, imageId?, externalImageUrl?, barcode?, source })` → `Id<"product">`
- `updateProduct(id, { name?, macronutrients?, imageId?, externalImageUrl?, barcode? })` → `void`
- `deleteProduct(id)` → `void` (deletes image from storage if exists)
- `generateUploadUrl()` → upload URL (1-hour TTL)
- `importProduct({ name, macronutrients, imageUrl?, barcode })` → `Id<"product">`

**Actions:**
- `searchOpenFoodFacts({ query, page, pageSize })` → `{ products, totalCount, pageCount, page }`

### UI Components (Web)
- New route: `/_authenticated/products` (protected by existing auth layout)
- Sidebar nav: "Products" link (Lucide `Package` or `ShoppingBasket` icon)
- Product list: virtualized infinite-scroll (useVirtualizer + usePaginatedQuery)
- Search input: ShadCN Input, debounced name filter
- "Add Product" button: opens Dialog/Sheet with two tabs
  - Manual: TanStack Form (name, calories, protein, carbs, fat, image file)
  - Import: Search input (debounced) → paginated results list → "Import" button per result
- Product detail: Dialog/Sheet showing all fields, image (thumbnail), nutrition (integers), source, barcode
- Edit mode: TanStack Form with same Zod schema; image replace/remove
- Delete: AlertDialog confirmation

### Dependencies (New)
- `@tanstack/react-form`, `@tanstack/react-virtual`, `@tanstack/pacer`, `zod` → `apps/web`
- ShadCN components to add: `Dialog`, `Field`/`FieldLabel`/`FieldError`, `Sonner`/`Toaster`

## Open Items

- None — all ambiguities resolved.
- **Note**: ShadCN Dialog, Field components, and Sonner package not yet installed; must be added during architecture phase.
