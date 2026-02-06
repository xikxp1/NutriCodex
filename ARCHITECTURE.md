# Architecture

## Overview

NutriCodex is a nutrition/food tracking application delivered as a Turborepo monorepo. It consists of a web application (TanStack Start with SSR), a mobile application (Expo with Expo Router), and a shared backend (Convex with Better Auth). Both client apps consume a shared backend package for typed API access and real-time data synchronization.

```
+------------------------------------------------------------------+
|                        Turborepo Root                            |
|  (Bun workspaces, Biome linting/formatting, shared tsconfig)    |
+------------------------------------------------------------------+
        |                    |                    |
+-------v------+    +-------v--------+   +-------v-----------+
|  apps/web    |    |  apps/mobile   |   | packages/backend  |
|  TanStack    |    |  Expo + Expo   |   | Convex +          |
|  Start       |    |  Router        |   | Better Auth       |
|  Tailwind v4 |    |  Uniwind       |   | (shared)          |
|  ShadCN UI   |    |  RN Reusables  |   +-------+-----------+
+------+-------+    +-------+--------+           ^
       |                    |                     |
       +----------+---------+---------------------+
                  |
        +---------v-----------+
        | packages/           |
        | typescript-config   |
        +---------------------+
```

## Tech Stack

| Layer           | Technology                          | Purpose                                    |
|-----------------|-------------------------------------|--------------------------------------------|
| Monorepo        | Turborepo + Bun workspaces          | Task orchestration, dependency management  |
| Web App         | TanStack Start (React, Vite, SSR)   | Server-rendered web application            |
| Mobile App      | Expo (React Native, Expo Router)    | iOS/Android mobile application             |
| Backend         | Convex                              | Real-time database, server functions       |
| Auth            | Better Auth + Convex adapter        | Authentication (email/password, sessions)  |
| Web Styling     | Tailwind CSS v4 + ShadCN UI         | Utility-first CSS, component library       |
| Web Icons       | Lucide React                        | SVG icon library (ShadCN standard)         |
| Web UI Prims    | radix-ui                            | Headless UI primitives for ShadCN components |
| Web Forms       | TanStack Form + Zod                 | Headless form management with schema validation |
| Web Virtual     | TanStack Virtual                    | Virtualized list rendering                 |
| Web Debounce    | TanStack Pacer                      | Debouncing utilities for search inputs     |
| Web Toasts      | Sonner                              | Toast notifications                        |
| Mobile Styling  | Uniwind + React Native Reusables    | Tailwind bindings for React Native         |
| Linting/Format  | Biome v2                            | Unified linter, formatter, import sorter   |
| Type Checking   | TypeScript (strict mode)            | Static type safety across all packages     |
| CI              | GitHub Actions                      | Automated lint, type-check, build          |

## Project Structure

```
NutriCodex/
|-- .github/workflows/       # CI pipeline (GitHub Actions)
|-- apps/
|   |-- mobile/               # Expo mobile app (@nutricodex/mobile)
|   |   |-- app/              # Expo Router file-based routes
|   |   `-- src/              # Source code, global styles, libs
|   `-- web/                  # TanStack Start web app (@nutricodex/web)
|       `-- src/
|           |-- components/   # UI components
|           |   |-- layout/   # App shell components (AppSidebar, TopBar, UserMenu)
|           |   |-- products/ # Product management components (ProductList, ProductRow,
|           |   |             #   AddProductDialog, ManualProductForm, OpenFoodFactsSearch,
|           |   |             #   ProductDetailDialog, ProductEditForm, product-schema)
|           |   `-- ui/       # ShadCN primitives (AlertDialog, Avatar, Button, Card,
|           |                 #   Dialog, DropdownMenu, Field, Input, Label, Separator,
|           |                 #   Sheet, Sidebar, Skeleton, Sonner, Tabs, Tooltip)
|           |-- hooks/        # Custom React hooks (useIsMobile)
|           |-- lib/          # Utilities, auth client/server
|           |-- routes/       # TanStack file-based routes
|           |   |-- _authenticated.tsx      # Authenticated layout route (app shell)
|           |   |-- _authenticated/         # Protected child routes
|           |   |   |-- index.tsx           # Main page (dashboard placeholder)
|           |   |   |-- household.tsx       # Household details and management
|           |   |   `-- products.tsx        # Product database management page
|           |   |-- api/                    # API routes (auth proxy)
|           |   |-- onboarding.tsx          # Household onboarding (create/join)
|           |   |-- login.tsx               # Public login page
|           |   `-- signup.tsx              # Public signup page
|           `-- styles/       # Global CSS (Tailwind v4 + ShadCN theme vars + sidebar vars)
|-- packages/
|   |-- backend/              # Shared Convex backend (@nutricodex/backend)
|   |   |-- convex/           # Convex schema, functions, auth config
|   |   |   |-- schema.ts    # Table definitions (household, householdMember, product)
|   |   |   |-- households.ts # Household queries and mutations
|   |   |   `-- products.ts  # Product queries, mutations, and actions
|   |   `-- src/              # Package exports (typed API, providers)
|   `-- typescript-config/    # Shared tsconfig presets (@nutricodex/typescript-config)
|-- biome.json                # Root Biome configuration
|-- turbo.json                # Turborepo task definitions
`-- package.json              # Root workspace configuration
```

## Component Map

### apps/web (TanStack Start)
- **Purpose**: SSR web application with file-based routing and authentication
- **Entry**: `vite.config.ts` (TanStack Start plugin + Tailwind v4 plugin)
- **Routing**: `src/routes/` directory (TanStack Router file-based routing)
- **Auth**: Client-side auth via `src/lib/auth-client.ts`, server helpers via `src/lib/auth-server.ts`, proxy route at `src/routes/api/auth/-$.ts`
- **Auth UI**: Login page (`/login`), signup page (`/signup`), protected pages under `_authenticated/`
- **Route Protection**: Pathless layout route `_authenticated.tsx` performs a two-step server-side check via `beforeLoad` + `createServerFn`:
  1. **Auth check**: Calls `getAuth()` (wraps `getToken()`). Unauthenticated users redirected to `/login` with `redirect` search parameter.
  2. **Household check**: Calls `getHouseholdStatus()` (wraps `fetchAuthQuery(api.households.getMyHousehold, {})`). Users without a household redirected to `/onboarding`.
  All child routes under `_authenticated/` are automatically protected by both checks.
- **Auth Provider**: `ConvexBetterAuthProvider` wraps the app in root layout, providing auth context to all routes. Receives `initialToken` for SSR hydration.
- **Onboarding**: The `/onboarding` route (`src/routes/onboarding.tsx`) is a standalone page (not inside the app shell) where users create a new household or browse and join an existing one. It has its own `beforeLoad` guard: must be authenticated (redirects to `/login`) and must NOT have a household (redirects to `/`). The page uses a toggle between "Create Household" (form with name input) and "Join Household" (list of existing households with member counts). After successful create/join, navigates to `/`.
- **Household Details**: The `/_authenticated/household` route (`src/routes/_authenticated/household.tsx`) is an authenticated page inside the app shell for managing the current household. Features include: editable household name (inline edit with save/cancel), member list with avatars and "(You)" indicator, and a "Leave Household" button with AlertDialog confirmation that warns about household deletion if the user is the last member. On leave, navigates to `/onboarding`.
- **Products**: The `/_authenticated/products` route (`src/routes/_authenticated/products.tsx`) is an authenticated page inside the app shell for managing the global product database. Features include:
  - **Product List** (`src/components/products/product-list.tsx`): Virtualized infinite-scroll list using `usePaginatedQuery` + `useVirtualizer`. Loads 20 items initially, auto-loads more on scroll. Each row shows image thumbnail, name, and macros.
  - **Search/Filter**: Debounced text input (300ms via `@tanstack/pacer`) that filters products by name using Convex full-text search (search index on `name` field).
  - **Add Product Dialog** (`src/components/products/add-product-dialog.tsx`): Dialog with tabs for Manual creation (TanStack Form + Zod) and OpenFoodFacts import (debounced search + paginated results). Import downloads images into Convex storage via the `importProduct` action.
  - **Product Detail Dialog** (`src/components/products/product-detail-dialog.tsx`): View/edit/delete dialog with TanStack Form for editing, AlertDialog for delete confirmation.
  - **Toast Notifications**: All operations provide feedback via Sonner toasts (success/error).
- **App Shell**: Authenticated routes render inside an app shell layout built on the **ShadCN Sidebar component**:
  - **SidebarProvider** (from `src/components/ui/sidebar.tsx`): Manages sidebar open/collapsed state with cookie persistence, keyboard shortcuts (Cmd/Ctrl+B), and mobile detection
  - **AppSidebar** (`src/components/layout/app-sidebar.tsx`): Composes ShadCN `Sidebar` with `collapsible="icon"` mode. Contains SidebarHeader (app name), SidebarContent (nav menu with placeholder items), SidebarFooter (user info + dropdown)
  - **TopBar** (`src/components/layout/top-bar.tsx`): Sticky top bar inside `SidebarInset` with `SidebarTrigger` and `UserMenu`
  - **UserMenu** (`src/components/layout/user-menu.tsx`): User profile dropdown with "My Household" navigation link (using Lucide `Home` icon) and sign-out action, using ShadCN `DropdownMenu` and `Avatar`. The "My Household" link navigates to `/household`.
- **Styling**: Tailwind CSS v4 via Vite plugin, ShadCN UI components (base-nova style with `radix-ui`), Lucide React for icons
- **Data**: ConvexQueryClient (with `expectAuth: true`) bridges Convex real-time with TanStack Query for SSR
- **Consumes**: `@nutricodex/backend` for typed Convex API

### apps/mobile (Expo)
- **Purpose**: Cross-platform mobile app (iOS/Android) running in Expo Go
- **Entry**: `app/_layout.tsx` (Expo Router root layout)
- **Routing**: `app/` directory (Expo Router file-based routing)
- **Styling**: Uniwind (Tailwind v4 bindings for React Native), React Native Reusables for components
- **Data**: ConvexReactClient for real-time data
- **Consumes**: `@nutricodex/backend` for typed Convex API

### packages/backend (Convex)
- **Purpose**: Shared backend consumed by both apps
- **Schema**: `convex/schema.ts` (Better Auth tables managed by component + application tables: `household`, `householdMember`, `product`)
- **Auth**: Better Auth component registered in `convex/convex.config.ts`, auth instance in `convex/auth.ts`, HTTP routes in `convex/http.ts`
- **Household Functions**: `convex/households.ts` provides queries (`getMyHousehold`, `getHouseholdMembers`, `listHouseholds`) and mutations (`createHousehold`, `joinHousehold`, `leaveHousehold`, `updateHousehold`) for household CRUD and membership management. All functions require authentication via `authComponent.getAuthUser(ctx)`. Member lookups use `authComponent.getAnyUserById(ctx, userId)` to resolve Better Auth user details.
- **Product Functions**: `convex/products.ts` provides queries (`getProducts` with cursor-based pagination and full-text search, `getProduct`), mutations (`createProduct`, `createProductInternal`, `updateProduct`, `deleteProduct`, `generateUploadUrl`), and actions (`searchOpenFoodFacts`, `importProduct`) for product CRUD and OpenFoodFacts integration. The `importProduct` action downloads images from OpenFoodFacts into Convex file storage before creating the product. All functions require authentication. Products are global (not household-scoped).
- **Shared Validators**: `convex/schema.ts` exports `macronutrientsValidator` -- a reusable `v.object(...)` for nutrition data (calories, protein, carbs, fat as non-negative integers per 100g).
- **Exports**: Typed Convex API (`api`), data model types (`DataModel`, `Doc`, `Id`), client utilities (`ConvexProvider`, `ConvexReactClient`), `ConvexBetterAuthProvider`

### packages/typescript-config
- **Purpose**: Shared TypeScript compiler configurations
- **Presets**: `base.json` (strict, ES2022, Bundler), `react.json` (DOM libs, JSX), `react-native.json` (RN types)

## Data Model

### Better Auth Tables (Component-Managed)

| Table          | Managed By      | Purpose                  |
|----------------|-----------------|--------------------------|
| user           | Better Auth     | User accounts (name, email, image) |
| session        | Better Auth     | Active sessions (token, expiry)    |
| account        | Better Auth     | Auth provider accounts (email/password) |
| verification   | Better Auth     | Email verification tokens (not used, verification disabled) |

### Application Tables

| Table            | Fields                                      | Indexes                          | Purpose                          |
|------------------|---------------------------------------------|----------------------------------|----------------------------------|
| household        | `name: v.string()`                          | (none)                           | Household entity                 |
| householdMember  | `userId: v.string()`, `householdId: v.id("household")` | `by_userId`, `by_householdId` | Maps users to households (1 user : 0..1 membership, N members : 1 household) |
| product          | `name`, `macronutrients` (object), `imageId`, `barcode`, `source` | `search_by_name` (full-text search) | Global product database          |

**Entity relationships:**

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

**Note on `userId` type:** The `householdMember.userId` field stores the Better Auth user `_id` as `v.string()` rather than `v.id("user")`. Better Auth tables are managed by the `@convex-dev/better-auth` Convex component in a separate namespace and are not defined in the app's `schema.ts`. The component user `_id` is not a Convex `Id` from the app's data model, so `v.string()` is the correct type. Lookups use `authComponent.getAnyUserById(ctx, userId)`.

## API Boundaries

### Convex Functions (packages/backend/convex/)
- Server-side queries, mutations, and actions defined in the `convex/` directory
- Typed API generated at `convex/_generated/api.ts` by `convex dev`
- Both apps access via: `import { api } from "@nutricodex/backend"`

### Convex HTTP Routes (packages/backend/convex/http.ts)
- Better Auth endpoints mounted on Convex HTTP router
- Handles sign-up, sign-in, sign-out, session management
- Accessible at the Convex site URL (`*.convex.site`)

### Web Auth Proxy (apps/web/src/routes/api/auth/-$.ts)
- Catch-all API route in TanStack Start
- Proxies auth requests from the web client to Convex HTTP routes
- Enables cookie-based auth flow for SSR

### Better Auth Client API (apps/web/src/lib/auth-client.ts)
- `authClient.signUp.email({ name, email, password })` -- Create account
- `authClient.signIn.email({ email, password })` -- Authenticate
- `authClient.signOut()` -- End session
- `authClient.useSession()` -- React hook returning `{ data, isPending, error }`

### Household API (packages/backend/convex/households.ts)

All functions require authentication. Accessed via `api.households.*`.

**Queries:**

| Function              | Args                                    | Returns                                                  | Description                                       |
|-----------------------|-----------------------------------------|----------------------------------------------------------|---------------------------------------------------|
| `getMyHousehold`      | `{}`                                    | `{ _id, name } \| null`                                 | Current user's household or null                  |
| `getHouseholdMembers` | `{ householdId: Id<"household"> }`      | `Array<{ _id, userId, name, email, image }>`             | Members of a household with user details          |
| `listHouseholds`      | `{}`                                    | `Array<{ _id, name, memberCount }>`                      | All households with member counts                 |

**Mutations:**

| Function              | Args                                    | Returns              | Description                                                 |
|-----------------------|-----------------------------------------|----------------------|-------------------------------------------------------------|
| `createHousehold`     | `{ name: string }`                      | `Id<"household">`    | Creates household + adds user as member (user must not be in a household) |
| `joinHousehold`       | `{ householdId: Id<"household"> }`      | `void`               | Adds user to existing household (user must not be in a household) |
| `leaveHousehold`      | `{}`                                    | `void`               | Removes user; deletes household if empty                    |
| `updateHousehold`     | `{ name: string }`                      | `void`               | Renames the user's current household                        |

**Error handling:** Mutations throw `ConvexError` with descriptive messages (e.g., "You already belong to a household", "Household not found", "Household name must be between 1 and 100 characters").

### Product API (packages/backend/convex/products.ts)

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

## Key Design Decisions

1. **Convex as shared workspace package**: Single source of truth for schema and typed API, consumed by both apps via `@nutricodex/backend`.

2. **Biome over ESLint/Prettier**: Single Rust-based tool for linting, formatting, and import organization. Eliminates configuration conflicts and runs faster.

3. **Tailwind CSS v4 via Vite plugin**: Direct Vite integration, no PostCSS config needed. Configuration in CSS (`@theme`) rather than JavaScript config files.

4. **Uniwind for mobile styling**: Tailwind v4 bindings for React Native with 2.5x performance improvement over NativeWind. Official React Native Reusables support.

5. **Better Auth with Convex adapter**: Auth handled at the Convex layer, shared across both apps. Web uses server-side proxy; mobile uses Expo secure storage.

6. **ConvexQueryClient for SSR**: Bridges Convex real-time subscriptions with TanStack Query for server-side rendering in TanStack Start. Uses `expectAuth: true` to prevent unauthenticated Convex function calls on the client.

7. **Two-step server-side route protection**: The `_authenticated.tsx` layout route's `beforeLoad` hook runs two sequential server-side checks: (1) auth via `getAuth()` + `getToken()`, and (2) household membership via `getHouseholdStatus()` + `fetchAuthQuery(api.households.getMyHousehold)`. Unauthenticated users redirect to `/login`, users without a household redirect to `/onboarding`. All child routes under `_authenticated/` are automatically protected by both checks.

8. **ShadCN UI components (copy-paste, base-nova style)**: UI primitives are manually added to `apps/web/src/components/ui/`. Components use the base-nova style with `radix-ui` as the headless primitive library. This provides accessible, production-ready components with keyboard navigation, ARIA attributes, and consistent styling via CVA variants and Tailwind.

9. **ShadCN Sidebar for app shell**: The app shell layout uses the full ShadCN Sidebar component (`sidebar.tsx`) rather than a custom implementation. The ShadCN Sidebar provides composable sub-components (SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, etc.), built-in `collapsible="icon"` mode, cookie-based state persistence, keyboard shortcuts (Cmd/Ctrl+B), mobile responsive Sheet drawer, and tooltip integration for collapsed items. This follows the project's ShadCN-first approach and avoids reinventing complex sidebar behavior.

10. **radix-ui as headless UI layer**: ShadCN components (AlertDialog, DropdownMenu, Avatar, Separator, Tooltip, Sheet, Sidebar internals) use `radix-ui` (the consolidated Radix UI package, `^1.4.3`) for accessible headless primitives. It provides component primitives (AlertDialog, Menu, Dialog, Avatar, Tooltip, Separator) with built-in accessibility, keyboard navigation, and focus management.

11. **Mandatory household onboarding**: Every authenticated user must belong to exactly one household before accessing the main app. The `/onboarding` route is a standalone page (outside the app shell) where users create or join a household. This ensures the household context is always available for food tracking features. The onboarding route has its own auth guard (redirects unauthenticated users to `/login`) and redirects users who already have a household to `/`.

12. **userId stored as string for Better Auth references**: Application tables that reference Better Auth users (e.g., `householdMember.userId`) store the user `_id` as `v.string()` rather than `v.id("user")`. Better Auth tables are managed by the `@convex-dev/better-auth` Convex component in a separate namespace and their IDs are not typed as `Id` from the app's data model. User details are resolved via `authComponent.getAnyUserById(ctx, userId)`.

13. **Global product database**: Products are not scoped to households. Any authenticated user can create, view, edit, or delete any product. This is appropriate for a self-hosted application where all users share a common food database.

14. **Reusable macronutrient validator**: The `macronutrientsValidator` is defined once in `schema.ts` as an exported `v.object(...)` constant. It is referenced by the `product` table and will be reused by future tables (meal logs, daily targets). Integer enforcement is done in mutations, not at the validator level (Convex `v.number()` does not distinguish integers).

15. **Cursor-based pagination with virtualization**: The product list uses Convex cursor-based pagination (`usePaginatedQuery`) combined with TanStack Virtual (`useVirtualizer`) for a seamless infinite-scroll experience. Only visible rows are rendered in the DOM. New pages load automatically as the user scrolls near the bottom. This scales to thousands of products without UI performance degradation.

16. **TanStack Form for all product forms**: Product create and edit forms use `@tanstack/react-form` with Zod validation and ShadCN Field components. This provides headless form state management, real-time validation feedback, and accessible form markup via the `form.Field` render-prop pattern.

17. **Sonner toasts for operation feedback**: All product mutations report success/error via Sonner toast notifications (`toast.success()`, `toast.error()`). The `Toaster` component is mounted in the root layout positioned top-right below the sticky top bar.

18. **Convex file storage for all product images**: Both manually uploaded images and images imported from OpenFoodFacts are stored in Convex file storage (`imageId` referencing `_storage`). The `importProduct` action downloads external images server-side during import. This eliminates dependency on external image hosting, provides a single image resolution path, and ensures image availability regardless of external service status.

19. **TanStack Pacer for debounced search**: All text search inputs (product list filter, OpenFoodFacts search) use `useDebouncedValue` from `@tanstack/pacer` with a 300ms delay. This prevents excessive query/action calls during typing while providing responsive feedback.

20. **Convex full-text search for product name filtering**: The `product` table uses a `searchIndex("search_by_name", { searchField: "name" })` for server-side text search. When a name filter is active, the `getProducts` query uses `.withSearchIndex()` with BM25 relevance ranking and prefix matching. This replaces client-side post-pagination filtering and ensures every paginated page contains relevant results.
