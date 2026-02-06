# Requirements: Product Database Management with Nutrition Tracking and OpenFoodFacts Import

## Changes from Previous Version

1. **Products are now global, not household-scoped.** Removed all `householdId` references from the product table, queries, mutations, and UI descriptions. Products are a shared global database accessible by any authenticated user. (Feedback #1)
2. **Reusable macronutrient type.** Introduced a reusable `macronutrients` Convex validator (`v.object(...)`) for calories/protein/carbs/fat that can be referenced in the product schema and future tables. (Feedback #2)
3. **Integer values for macronutrients.** Changed all nutrition fields from float/number to integer (non-negative). Rounded on import. (Feedback #3)
4. **Search-a-licious API replaces v1 CGI.** OpenFoodFacts search now uses `GET https://search.openfoodfacts.org/search` with `q`, `page`, `page_size`, and `fields` parameters. Response uses `hits` array with pagination metadata (`page`, `page_size`, `page_count`, `count`). (Feedback #4)
5. **Full-text search for product name filtering.** The `getProducts` query uses a Convex full-text search index (`search_by_name`) instead of post-pagination client-side filtering. This provides server-side text matching with prefix support and relevance ranking. (Feedback #5, revised)
6. **TanStack Form for all forms.** All forms use `@tanstack/react-form` with Zod validation and ShadCN Field components (`Field`, `FieldLabel`, `FieldError` from `@/components/ui/field`). (Feedback #6)
7. **Sonner for toast notifications.** All error reporting and success feedback use the ShadCN Sonner component. Toaster positioned top-right, below the top bar. (Feedback #7)
8. **Server-side pagination for product queries.** The `getProducts` query now uses Convex cursor-based pagination (`paginationOptsValidator`, `.paginate()`). The UI uses `usePaginatedQuery` combined with TanStack Virtual for virtualized infinite-scroll rendering. (Feedback #8)
9. **TanStack Virtual for virtualized product list.** The product list uses `@tanstack/react-virtual` to lazily render only visible rows. Combined with `usePaginatedQuery`, the user sees a single scrollable list that automatically loads more data as they scroll. No manual page navigation. (Feedback #9)
10. **TanStack Pacer for debouncing.** All debounced inputs use `@tanstack/pacer` (e.g., `useDebouncer`) instead of custom debounce implementations. (Feedback #10)
11. **All product images stored in Convex file storage.** The `externalImageUrl` field has been removed. When importing from OpenFoodFacts, images are downloaded server-side and stored in Convex file storage. The `importProduct` function is now a Convex action (not mutation) to support HTTP requests. Products without a downloadable image simply have no image. (Feedback #11, revised)

## Overview

This feature adds a global product database to NutriCodex. Users can create, view, edit, and delete products that represent foods, ingredients, and prepared meals. Each product stores macronutrient data (calories, protein, carbohydrates, fat) as integers and an optional image. Products can be added manually via a TanStack Form or imported from the OpenFoodFacts public API using the search-a-licious search endpoint. The product list uses server-side Convex pagination combined with TanStack Virtual for virtualized infinite-scroll rendering. Product name search uses Convex full-text search for server-side filtering with relevance ranking. Products are global -- all authenticated users share the same product database. Error feedback is handled via Sonner toast notifications.

## Functional Requirements

### Reusable Macronutrient Type

- **FR-1**: A reusable macronutrient validator shall be defined in the backend package as a Convex `v.object(...)` that can be referenced in multiple table schemas.
  - Fields: `calories: v.number()` (kcal, integer, non-negative), `protein: v.number()` (grams, integer, non-negative), `carbs: v.number()` (grams, integer, non-negative), `fat: v.number()` (grams, integer, non-negative).
  - This validator is defined once (e.g., as `macronutrientsValidator`) and spread or referenced wherever macronutrient data is needed.
  - Acceptance criteria: The validator is defined in a shared location within `packages/backend/convex/`. The product table uses this validator for its nutrition fields. The validator can be imported and reused by future tables without duplication.

### Product Data Model

- **FR-2**: A `product` table shall be added to the Convex schema with the following fields:
  - `name: v.string()` -- product name (1-200 characters, trimmed)
  - `macronutrients` -- uses the reusable macronutrient validator (FR-1), storing values per 100g as non-negative integers
  - `imageId: v.optional(v.id("_storage"))` -- optional reference to an uploaded image in Convex file storage (used for both manually uploaded images and images downloaded from OpenFoodFacts during import)
  - `barcode: v.optional(v.string())` -- optional barcode from OpenFoodFacts (EAN-13 or similar)
  - `source: v.union(v.literal("manual"), v.literal("openfoodfacts"))` -- how the product was created
  - Acceptance criteria: Schema compiles. The table has a `search_by_name` full-text search index on the `name` field for server-side text search. No `householdId` field exists. No `externalImageUrl` field exists.

- **FR-3**: All nutrition values shall be stored per 100g as the standard unit, as non-negative integers (no decimals).
  - Acceptance criteria: All product nutrition fields represent integer values per 100g, consistent across manual entry and OpenFoodFacts import. Values from OpenFoodFacts are rounded to the nearest integer before storage.

### Product CRUD Backend

- **FR-4**: A `createProduct` mutation shall accept product fields and create a product.
  - Requires authentication.
  - Validates: name length (1-200 chars after trim), all macronutrient values are non-negative integers.
  - Acceptance criteria: Product is created. Returns the new product ID. Throws `ConvexError` for validation failures.

- **FR-5**: A `getProducts` query shall return products using Convex cursor-based pagination with full-text search.
  - Requires authentication.
  - Uses `paginationOptsValidator` from `"convex/server"` for pagination arguments.
  - Accepts an optional `nameFilter: v.optional(v.string())` argument.
  - When `nameFilter` is provided and non-empty, uses Convex full-text search via `.withSearchIndex("search_by_name", q => q.search("name", nameFilter))` to match products by name server-side. Results are ordered by relevance (BM25 ranking with prefix matching).
  - When `nameFilter` is not provided or empty, uses a regular query with `order("desc")` for newest-first ordering.
  - Calls `.paginate(paginationOpts)` on the database query.
  - Returns a `PaginationResult` containing: `page` (array of products with resolved `imageUrl`), `isDone`, and `continueCursor`.
  - Each product in the page includes a resolved `imageUrl` field (from `imageId` via `ctx.storage.getUrl()`, or `null` if no image).
  - Acceptance criteria: Returns a paginated result set. Full-text search provides server-side filtering with prefix matching. Performance does not degrade as the product count grows into the thousands.

- **FR-6**: A `getProduct` query shall return a single product by ID.
  - Requires authentication.
  - Acceptance criteria: Returns the product with resolved image URL, or throws if not found.

- **FR-7**: An `updateProduct` mutation shall update an existing product's fields.
  - Requires authentication.
  - Accepts partial updates (all fields optional except the product ID).
  - Validates field values with the same rules as `createProduct`.
  - If the image is being replaced, the old image should be deleted from storage.
  - Acceptance criteria: Product is updated. Throws `ConvexError` if product not found or validation fails.

- **FR-8**: A `deleteProduct` mutation shall delete a product by ID.
  - Requires authentication.
  - Deletes the associated image from Convex file storage if one exists.
  - Acceptance criteria: Product and its image (if any) are removed. Throws `ConvexError` if product not found.

- **FR-9**: A `generateUploadUrl` mutation shall generate a short-lived Convex file storage upload URL.
  - Requires authentication.
  - Acceptance criteria: Returns a URL string that can be used to POST a file within 1 hour.

### OpenFoodFacts Integration

- **FR-10**: A `searchOpenFoodFacts` Convex action shall search the OpenFoodFacts search-a-licious API by text query and return matching products.
  - Uses the search-a-licious endpoint: `GET https://search.openfoodfacts.org/search`
  - Query parameters:
    - `q` -- search query string (min 2 characters)
    - `page` -- page number (default 1, starts at 1)
    - `page_size` -- results per page (default 24, max 100)
    - `fields` -- `product_name,nutriments,image_url,code,brands`
  - Requires authentication.
  - Accepts: `query` (string, min 2 characters), `page` (number, default 1), `pageSize` (number, default 24, max 100).
  - Returns an object with:
    - `products`: array of simplified product objects: `{ name, calories, protein, carbs, fat, imageUrl, barcode, brand }`
    - `totalCount`: total number of matching results (from `count` field)
    - `pageCount`: total pages available (from `page_count` field)
    - `page`: current page number
  - Maps search-a-licious response fields:
    - `product_name` -> `name`
    - `nutriments.energy-kcal_100g` -> `calories` (rounded to integer)
    - `nutriments.proteins_100g` -> `protein` (rounded to integer)
    - `nutriments.carbohydrates_100g` -> `carbs` (rounded to integer)
    - `nutriments.fat_100g` -> `fat` (rounded to integer)
    - `image_url` -> `imageUrl`
    - `code` -> `barcode`
    - `brands` -> `brand` (first element if array, or string as-is)
  - Products missing a name or all nutrition data should be filtered out.
  - Must set a `User-Agent` header: `NutriCodex/1.0 (nutricodex@example.com)` (OpenFoodFacts requirement).
  - Acceptance criteria: Returns mapped product data from the search-a-licious API. Handles network errors gracefully (returns empty results or throws descriptive error). Pagination metadata is included in the response. The `imageUrl` field in the response is the raw OpenFoodFacts URL (used by the `importProduct` action to download the image).

- **FR-11**: An `importProduct` Convex **action** shall create a product from OpenFoodFacts data, downloading the image into Convex file storage.
  - Accepts: `name`, `macronutrients`, optional `imageUrl` (external OpenFoodFacts URL), optional `barcode`.
  - This must be an **action** (not a mutation) because it needs to make HTTP requests to download images.
  - If `imageUrl` is provided:
    - Downloads the image from the OpenFoodFacts URL (with a 10-second timeout).
    - Stores the image in Convex file storage via `ctx.storage.store(blob)`.
    - If the download fails (network error, timeout, non-image response), the product is created without an image. The import does not fail.
  - Creates the product by calling an internal mutation with `source: "openfoodfacts"`, the `barcode`, and the `imageId` (if image download succeeded).
  - Acceptance criteria: Product is created with `source: "openfoodfacts"`, barcode populated, and `imageId` set if the image was successfully downloaded. All macronutrient values are stored as integers. If the image download fails, the product is still created without an image.

### Product List UI (Web)

- **FR-12**: A new authenticated route shall be added at `/_authenticated/products` to display the product management page.
  - Accessible from the app sidebar navigation.
  - The sidebar shall include a "Products" navigation item (using an appropriate Lucide icon such as `Package` or `ShoppingBasket`).
  - Acceptance criteria: Route is protected by the existing `_authenticated` layout. Sidebar shows "Products" link that navigates to `/products`.

- **FR-13**: The products page shall display a virtualized, infinite-scroll list of products using Convex's `usePaginatedQuery` hook combined with TanStack Virtual (`@tanstack/react-virtual`).
  - Uses `usePaginatedQuery(api.products.getProducts, { nameFilter }, { initialNumItems: 20 })` for data fetching.
  - Uses `useVirtualizer` from `@tanstack/react-virtual` to render only visible rows in a scrollable container.
  - Each row shows: product image thumbnail (or placeholder icon if no image), product name, and macro summary (calories, protein, carbs, fat) -- all displayed as integers.
  - Rows shall have a fixed estimated height for consistent virtualization.
  - When the user scrolls near the bottom of the list and `status === "CanLoadMore"`, `loadMore(20)` is called automatically to fetch the next page (infinite scroll). No manual "Load More" button or page navigation.
  - A loading indicator shall display when `status === "LoadingFirstPage"` or when loading more items at the bottom.
  - Acceptance criteria: List renders as a single seamless scrollable list. Only visible rows are in the DOM (virtualized). New pages load automatically as the user scrolls. Performance remains consistent regardless of total product count. Scrolling is smooth at 60fps.

- **FR-14**: The products page shall include a search/filter input above the product list for filtering by product name.
  - Uses ShadCN `Input` component.
  - Input value is debounced (300ms delay) using `@tanstack/pacer` (e.g., `useDebouncedValue` hook) before updating the `nameFilter` argument passed to `usePaginatedQuery`. This prevents excessive query calls while the user is typing.
  - The `getProducts` query uses Convex full-text search (`withSearchIndex`) when a filter is active, providing server-side text matching with prefix support and relevance ranking.
  - Acceptance criteria: Typing in the search input filters products by name server-side using full-text search. The query is not re-executed on every keystroke -- only after the user pauses typing for 300ms (debounced via TanStack Pacer). Clearing the input shows all products (newest first).

- **FR-15**: The products page shall include an "Add Product" button that opens a dialog/sheet for creating a new product.
  - The dialog has two tabs/modes: "Manual" and "Import from OpenFoodFacts".
  - Uses ShadCN `Dialog` or `Sheet` component.
  - Acceptance criteria: Button is visible on the products page. Clicking it opens the creation dialog with both modes available.

### Manual Product Creation UI

- **FR-16**: The manual product creation form shall use TanStack Form (`@tanstack/react-form`) with Zod validation and ShadCN Field components.
  - Form fields:
    - Name input (required, text, ShadCN `Input` + `FieldLabel`)
    - Calories input (required, integer number, kcal per 100g)
    - Protein input (required, integer number, grams per 100g)
    - Carbs input (required, integer number, grams per 100g)
    - Fat input (required, integer number, grams per 100g)
    - Image upload (optional, file input accepting image/* types)
  - A "Save" button and a "Cancel" button.
  - Zod schema validates: name required and 1-200 chars, all nutrition fields required and non-negative integers.
  - Form uses `useForm()` from `@tanstack/react-form` with `validators: { onSubmit: schema }`.
  - Field-level errors displayed via ShadCN `FieldError` component.
  - On successful creation, a success toast is shown via Sonner.
  - On error, an error toast is shown via Sonner.
  - Acceptance criteria: Form validates inputs before submission using TanStack Form + Zod. On success, the product appears in the list and a success toast is shown. On error, an error toast is displayed. Image upload uses the Convex three-step upload flow (generate URL, POST file, save storage ID).

### OpenFoodFacts Import UI

- **FR-17**: The OpenFoodFacts import mode shall include:
  - A search input where the user types a product name or brand. The search input is debounced (300ms delay) using `@tanstack/pacer` (e.g., `useDebouncedValue` hook) before triggering the `searchOpenFoodFacts` action.
  - Search results list showing matching products with: name, brand, image thumbnail, and macros (displayed as integers).
  - Pagination controls for search results (based on `pageCount` and `page` from the response) -- "Previous" / "Next" buttons or page numbers.
  - An "Import" button on each result that imports the product via the `importProduct` action (which downloads the image into Convex storage and creates the product).
  - Loading state while searching and while importing (the import action includes image download time).
  - On successful import, a success toast is shown via Sonner.
  - On error, an error toast is shown via Sonner.
  - Acceptance criteria: User can type a query, results appear after debounce, user can paginate through results, and import a product in a single flow. After import, the dialog can remain open for importing more products or be closed. The imported product appears in the product list with its image (if the download succeeded).

- **FR-18**: After importing from OpenFoodFacts, the user shall be able to edit the imported product's details (nutrition values may need correction).
  - Acceptance criteria: Imported products are editable like any manually created product.

### Product Detail / Edit View

- **FR-19**: Clicking a product in the list shall open a product detail view (ShadCN `Dialog` or `Sheet`) showing:
  - Product name (editable inline or in edit mode)
  - Product image (if available, from Convex storage via `imageId`)
  - Nutrition facts: Calories (kcal), Protein (g), Carbs (g), Fat (g) -- all per 100g, displayed as integers
  - Source indicator (manual or OpenFoodFacts)
  - Barcode (if imported from OpenFoodFacts)
  - An "Edit" button that enables editing of all fields
  - A "Delete" button with confirmation dialog (ShadCN `AlertDialog`)
  - Acceptance criteria: All product information is displayed. Edit mode allows changing name, nutrition values, and image. Delete prompts for confirmation. Changes are persisted to the backend.

- **FR-20**: The product edit form shall use TanStack Form (`@tanstack/react-form`) with the same Zod schema as the creation form.
  - Pre-populates fields with the current product values.
  - On successful update, a success toast is shown via Sonner.
  - On error, an error toast is shown via Sonner.
  - Acceptance criteria: Edit form uses TanStack Form with Zod validation. Field errors are shown inline. Success and error feedback via Sonner toasts.

- **FR-21**: When editing a product, the image can be replaced by uploading a new one or removed entirely.
  - Acceptance criteria: User can upload a new image (replaces old one), or remove the existing image. Changes are reflected immediately after save.

### Toast Notifications

- **FR-22**: The ShadCN Sonner `Toaster` component shall be added to the app's root layout.
  - Positioned at `top-right` using the `position` prop: `<Toaster position="top-right" />`.
  - The toaster must be visually positioned below the sticky top bar (via CSS offset or the `offset` prop) so toasts do not overlap the top bar.
  - Acceptance criteria: Toaster is rendered in the root layout. Toasts appear in the top-right corner, below the top bar. Multiple toasts stack correctly.

- **FR-23**: All user-facing error and success feedback in the product management feature shall use Sonner toasts.
  - `toast.success("Product created")` for successful operations.
  - `toast.error("Failed to create product")` for errors, with the error message from `ConvexError` included when available.
  - No inline error banners or alert boxes for operation results -- toasts only.
  - Acceptance criteria: Every mutation and action (create, update, delete, import) shows a toast on success and on error. Network/server errors display descriptive messages via toast.

## Non-Functional Requirements

- **NFR-1**: The product list shall render smoothly with hundreds of loaded products without perceptible lag or jank. TanStack Virtual must be used for virtualization so only visible rows are in the DOM. Server-side pagination ensures data fetching performance does not degrade as the total product count grows into the thousands.

- **NFR-2**: OpenFoodFacts API calls shall time out after 10 seconds. Network failures shall show a user-friendly error toast via Sonner, not crash the UI.

- **NFR-3**: Image uploads shall be limited to common image formats (JPEG, PNG, WebP) and a reasonable file size (max 5MB enforced on the client side before upload).

- **NFR-4**: All product mutations shall validate inputs server-side (in Convex mutations), not just client-side. Client-side validation (via TanStack Form + Zod) is for UX; server-side validation is for security.

- **NFR-5**: The product UI shall follow the existing ShadCN-first design system. All interactive components (buttons, inputs, dialogs, dropdowns) shall use ShadCN UI components. Forms use TanStack Form with ShadCN Field components. No custom low-level UI elements.

- **NFR-6**: The products page shall be responsive on desktop and tablet-sized viewports. Mobile-optimized layout is out of scope (handled by the mobile app in a future iteration).

- **NFR-7**: Product image thumbnails in the list shall be displayed at a consistent size (e.g., 40x40px or 48x48px) with `object-cover` to prevent layout shifts.

- **NFR-8**: All text search inputs (product name filter, OpenFoodFacts search) shall be debounced with a 300ms delay using `@tanstack/pacer` to prevent excessive API/query calls.

## Scope Boundaries

The following items are explicitly **NOT included** in this iteration:

1. **Mobile app (Expo) product UI** -- This iteration covers web only. The backend (Convex functions) will be shared and ready for mobile consumption, but no Expo screens are built.
2. **Barcode scanning** -- No camera/barcode scanner integration. OpenFoodFacts import is text-search only.
3. **Product categories or tags** -- No categorization system. Products are a flat list.
4. **Serving sizes and per-serving nutrition** -- All values are per 100g only. Per-serving calculations are a future feature.
5. **Micronutrients** -- Only macronutrients (calories, protein, carbs, fat). Vitamins, minerals, fiber, sugar, sodium, etc. are not tracked.
6. **Food/meal logging** -- This is the product database only. Logging what a user ate (food diary) is a separate future feature.
7. **Offline support** -- The app requires an active connection. Offline caching of products is not implemented.
8. **Bulk import/export** -- No CSV import, bulk operations, or data export.
9. **Product duplication detection** -- No deduplication logic when importing from OpenFoodFacts (user may import the same product twice).
10. **Manual page navigation** -- The product list uses infinite scroll with TanStack Virtual, not manual page buttons or "Load More" buttons.
11. **Household-scoped products** -- Products are global. There is no per-household product ownership or filtering.
12. **Product access control** -- Any authenticated user can create, edit, or delete any product. No ownership or permissions model.

## Assumptions

1. **Household context is always available** for authenticated users (enforced by the existing `_authenticated` route guard), but products are not scoped to households.
2. **The product database will grow over time.** Server-side pagination ensures the system scales. The initial page size of 20 is a reasonable default.
3. **OpenFoodFacts search-a-licious API is freely available** at `https://search.openfoodfacts.org/search` and does not require an API key. Only a proper `User-Agent` header is needed.
4. **OpenFoodFacts API responses may have missing or inconsistent nutrition data.** The import flow shall handle missing values by defaulting to 0 and allowing the user to correct them. All float values are rounded to the nearest integer.
5. **Convex file storage is suitable for product images.** Images are expected to be small (under 5MB each). The three-step upload flow (generate URL, POST, save ID) is the standard pattern for manual uploads. The `importProduct` action uses `ctx.storage.store(blob)` for server-side image storage.
6. **The ShadCN `Dialog` component is not yet installed** in the project (not listed in existing UI components). It will need to be added as a new ShadCN component (base-nova style, using `radix-ui` Dialog primitive).
7. **The ShadCN `Field` components (`Field`, `FieldLabel`, `FieldError`, `FieldDescription`) are not yet installed.** They will need to be added for TanStack Form integration.
8. **The ShadCN Sonner component is not yet installed.** The `sonner` package and the ShadCN `Toaster` wrapper will need to be added.
9. **`@tanstack/react-form`, `@tanstack/react-virtual`, `@tanstack/pacer`, and `zod` are not yet installed** in the project. They will need to be added as dependencies to `apps/web`.
10. **All nutrition values from OpenFoodFacts use the `_100g` suffix** for per-100g values (e.g., `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `energy-kcal_100g`).
11. **OpenFoodFacts image URLs may be temporarily or permanently unavailable.** The `importProduct` action downloads images during import with graceful failure handling. Products whose image download fails are created without an image.
12. **The sidebar navigation already has placeholder items** that can be replaced with real navigation items including the new "Products" link.
13. **The macronutrient validator will be reused in future features** (e.g., meal logging, daily targets), so it must be defined as an independent, importable constant.
14. **Convex actions can use `ctx.storage.store(blob)`** to store downloaded files directly in Convex file storage without going through the three-step upload flow.

## Open Questions

None -- all ambiguities have been resolved with documented decisions above. Key decisions made:

- **Global products**: Products are not household-scoped. Any authenticated user can CRUD any product. This is appropriate for a self-hosted application.
- **Integer precision**: Macronutrient values are stored as non-negative integers. This provides sufficient precision for nutrition tracking.
- **Search-a-licious API**: Uses `GET https://search.openfoodfacts.org/search?q={query}&page={page}&page_size={pageSize}&fields=product_name,nutriments,image_url,code,brands`. Response contains `hits` array and pagination fields (`count`, `page_count`, `page`, `page_size`).
- **Image storage approach**: All product images are stored in Convex file storage. Manually uploaded images use the three-step upload flow. OpenFoodFacts images are downloaded server-side by the `importProduct` action and stored via `ctx.storage.store()`. If the download fails, the product is created without an image.
- **Full-text search**: The `product` table uses a Convex `searchIndex("search_by_name", { searchField: "name" })` for server-side text matching. This provides prefix matching, BM25 relevance ranking, and pagination support.
- **Nutrition value defaults**: Imported products with missing nutrition values default to 0, with the expectation that users will correct them.
- **Pagination + Virtualization**: Server-side Convex cursor-based pagination with `usePaginatedQuery` hook combined with TanStack Virtual for virtualized infinite-scroll rendering. Initial page size of 20, more loaded automatically as the user scrolls. No manual page navigation.
- **Form management**: TanStack Form with Zod validation for all product forms (create and edit).
- **Error/success feedback**: Sonner toasts for all operation results, positioned top-right below the top bar.
- **Debounce**: 300ms debounce on all text search inputs via `@tanstack/pacer`.
