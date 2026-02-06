# Architecture: Household Management with Onboarding Flow and User Settings

## Clarification Questions

None. Requirements are clear and all open questions have been resolved.

## System Overview

This task adds household management to NutriCodex. Every authenticated user must belong to exactly one household before accessing the main app. The feature spans three layers: Convex backend (schema + functions), route protection (auth guard extension), and web UI (onboarding, household details, change household).

```
                     +-------------------+
                     |   Convex Backend  |
                     | (packages/backend)|
                     +-------------------+
                     | household table   |
                     | householdMember   |
                     | table             |
                     |-------------------|
                     | households.ts     |
                     |  - queries        |
                     |  - mutations      |
                     +--------+----------+
                              |
              +---------------+---------------+
              |                               |
    +---------v----------+         +----------v-----------+
    | Server-side check  |         | Client-side queries  |
    | (beforeLoad in     |         | (useQuery from       |
    | _authenticated.tsx)|         |  convex/react via    |
    | via fetchAuthQuery |         |  @nutricodex/backend)|
    +--------------------+         +----------------------+
              |                               |
    +---------v----------+         +----------v-----------+
    | Route Layer        |         | UI Components        |
    | /onboarding        |         | Onboarding page      |
    | /_authenticated/   |         | Household page       |
    |   household        |         | UserMenu (extended)  |
    +--------------------+         | AlertDialog (new UI) |
                                   +----------------------+
```

## Component Design

### 1. Convex Schema Additions

- **Responsibility**: Define `household` and `householdMember` tables with indexes
- **Location**: `packages/backend/convex/schema.ts`
- **Details**: See [Data Model](#data-model) section below

### 2. Convex Household Functions

- **Responsibility**: All backend logic for household CRUD and membership management
- **Interface**: Exported queries and mutations accessible via `api.households.*`
- **Dependencies**: `authComponent` from `./auth.ts` for user identity, Convex `db` for data access
- **Location**: `packages/backend/convex/households.ts` (new file)

**Queries:**

| Function | Args | Returns | Auth | Description |
|---|---|---|---|---|
| `getMyHousehold` | `{}` | `{ _id, name } \| null` | Required | Returns calling user's household or null |
| `getHouseholdMembers` | `{ householdId: Id<"household"> }` | `Array<{ _id, userId, name, email, image }>` | Required | Returns member list with user info for a household |
| `listHouseholds` | `{}` | `Array<{ _id, name, memberCount: number }>` | Required | Returns all households with member counts |

**Mutations:**

| Function | Args | Returns | Auth | Description |
|---|---|---|---|---|
| `createHousehold` | `{ name: string }` | `Id<"household">` | Required; must not be in a household | Creates household + adds user as member |
| `joinHousehold` | `{ householdId: Id<"household"> }` | `void` | Required; must not be in a household | Adds user to existing household |
| `leaveHousehold` | `{}` | `void` | Required; must be in a household | Removes user; deletes household if empty |
| `updateHousehold` | `{ name: string }` | `void` | Required; must be member of target household | Renames the user's current household |

**Implementation details:**

- All functions use `authComponent.getAuthUser(ctx)` to get the authenticated user's `_id`. This throws if unauthenticated, satisfying NFR-01.
- `getMyHousehold`: Queries `householdMember` by `userId` index, then fetches the linked household.
- `getHouseholdMembers`: Queries `householdMember` by `householdId` index, then for each member fetches the Better Auth user document via `authComponent.getAnyUserById(ctx, member.userId)` to get `name`, `email`, `image`. Note: The `userId` in `householdMember` stores the Better Auth user's `_id` as a string, and `getAnyUserById` looks up by that ID.
- `listHouseholds`: Collects all households, counts members per household. Since the number of households is small (self-hosted), a full scan is acceptable.
- `createHousehold`: Validates name (non-empty, max 100 chars), checks user has no existing membership, inserts household, inserts householdMember.
- `joinHousehold`: Checks user has no existing membership, verifies household exists, inserts householdMember.
- `leaveHousehold`: Finds user's membership, deletes it. Counts remaining members; if zero, deletes the household.
- `updateHousehold`: Finds user's membership, verifies they belong to a household, patches the household name (NFR-02).

### 3. Auth Guard Extension (`_authenticated.tsx`)

- **Responsibility**: Two-step server-side check: (1) authenticated? (2) has household?
- **Interface**: Modified `beforeLoad` hook
- **Dependencies**: `getAuth` server function (existing), new `getHouseholdStatus` server function
- **Location**: `apps/web/src/routes/_authenticated.tsx` (modified)

**Design:**

The `beforeLoad` hook currently calls `getAuth()` to check authentication. It will be extended to also call a new server function `getHouseholdStatus` that uses `fetchAuthQuery` to call `api.households.getMyHousehold` server-side.

```
beforeLoad:
  1. const token = await getAuth()
  2. if (!token) -> redirect to /login
  3. context.convexQueryClient.serverHttpClient?.setAuth(token)
  4. const household = await getHouseholdStatus()
  5. if (!household) -> redirect to /onboarding
```

A new `createServerFn` named `getHouseholdStatus` will be added to either `_authenticated.tsx` or `__root.tsx`. This function calls `fetchAuthQuery(api.households.getMyHousehold, {})` using the `fetchAuthQuery` helper from `~/lib/auth-server.ts`.

**Important**: `fetchAuthQuery` is already exported from `auth-server.ts` and handles authenticated server-side Convex queries. It uses the current request's auth token to authenticate with Convex.

### 4. Onboarding Route (`/onboarding`)

- **Responsibility**: Standalone page for users to create or join a household
- **Interface**: Route with `beforeLoad` auth check (must be authenticated, must NOT have household)
- **Dependencies**: Convex queries/mutations, existing ShadCN components
- **Location**: `apps/web/src/routes/onboarding.tsx` (new file)

**Design:**

This is a top-level route (not under `_authenticated/`) so it does NOT render the app shell. It has its own `beforeLoad`:
1. Check authentication via `getAuth()`. If not authenticated, redirect to `/login`.
2. Check household via `getHouseholdStatus()`. If user already has a household, redirect to `/`.

The page renders a centered layout (matching login/signup visual style) with two sections:
- **Create Household**: A `Card` with a form containing `Label` + `Input` for household name, `Button` to submit. Uses `useMutation(api.households.createHousehold)`.
- **Join Household**: A `Card` with a list of existing households (from `useQuery(api.households.listHouseholds)`). Each household row shows the name, member count, and a "Join" `Button`. Uses `useMutation(api.households.joinHousehold)`. When no households exist, displays a message.

The two sections are presented as a toggle/tab UI using just `Button` components with `variant="outline"` / `variant="default"` for the active state. This avoids introducing a new Tabs ShadCN component.

After successful create or join, `navigate({ to: "/" })`.

Validation: Household name must be non-empty and max 100 characters. Error shown inline (same pattern as login/signup).

Loading states: `Skeleton` components for the household list while loading.

### 5. Household Details Route (`/_authenticated/household`)

- **Responsibility**: Display and manage the current household, including "Change Household" flow
- **Interface**: Authenticated route with household page
- **Dependencies**: Convex queries/mutations, existing ShadCN components, AlertDialog (new ShadCN component)
- **Location**: `apps/web/src/routes/_authenticated/household.tsx` (new file)

**Design:**

This route is inside `_authenticated/`, so it renders within the app shell (sidebar + top bar) and is automatically protected by the auth + household guard.

The page displays:

- **Household Name**: Shown as an editable heading. Click to edit inline: replaces the heading with an `Input` + save/cancel `Button`. Uses `useMutation(api.households.updateHousehold)`. Validation: non-empty, max 100 chars.
- **Members List**: Uses `useQuery(api.households.getHouseholdMembers, { householdId })`. Each member row shows:
  - `Avatar` with `AvatarImage` (if `image` exists) and `AvatarFallback` (initials or first char of email)
  - Name (or email if no name)
  - A "(You)" badge/indicator for the current user
- **Separator** between sections
- **Change Household Button**: A `Button` at the bottom of the page (e.g., `variant="outline"` with a destructive style or `variant="destructive"`) labeled "Change Household" or "Leave Household". Clicking this button opens the `AlertDialog` confirmation flow.

**AlertDialog flow (on this page):**
1. User clicks "Change Household" button
2. AlertDialog opens with title "Leave Household?" and a description warning
3. The description dynamically states: "You will leave [Household Name]." If the user is the last member, add: "Since you are the last member, the household will be deleted."
4. Two buttons: "Cancel" and "Leave & Continue"
5. On confirm: call `leaveHousehold` mutation, then `navigate({ to: "/onboarding" })`

**Determining "last member"**: The page already queries `getHouseholdMembers` for the member list, so it can simply check `members.length === 1` to determine if the current user is the last member.

All data is reactive via Convex subscriptions (NFR-03).

### 6. User Menu Extension (Household Link)

- **Responsibility**: Add "My Household" navigation link to user dropdown
- **Interface**: New menu item in the existing `DropdownMenu`
- **Dependencies**: `DropdownMenu` (existing), TanStack Router `Link`
- **Location**: `apps/web/src/components/layout/user-menu.tsx` (modified)

**Design:**

The user menu dropdown will be extended with one new item between the user info label and the "Sign Out" item:

- **"My Household" link**: A `DropdownMenuItem` with a Lucide icon (e.g., `Home` or `Users`) that navigates to `/_authenticated/household`. This serves as the entry point to the household details page. Uses TanStack Router's `Link` for client-side navigation.

The menu structure becomes:
```
[User Info Label]
---separator---
My Household       (link -> /household)
---separator---
Sign Out
```

The "Change Household" action (leave + redirect to onboarding) lives exclusively on the household details page (Section 5), not in the user menu dropdown. This keeps the user menu simple and avoids the complexity of AlertDialog + DropdownMenu focus management.

### 7. AlertDialog ShadCN Component (New UI Primitive)

- **Responsibility**: Accessible confirmation dialog with overlay
- **Interface**: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`
- **Dependencies**: `radix-ui` (already installed at `^1.4.3`), `cn` utility, `buttonVariants` from Button component
- **Location**: `apps/web/src/components/ui/alert-dialog.tsx` (new file)

**Installation approach**: This component must be an exact copy of the official ShadCN AlertDialog source code. The existing ShadCN components in the project (e.g., `dropdown-menu.tsx`, `sheet.tsx`, `avatar.tsx`) all follow the official ShadCN code exactly -- they import from `radix-ui` (the consolidated Radix UI package), use `cn` from `@/lib/utils`, apply `data-slot` attributes, and follow the standard ShadCN naming/export conventions. The AlertDialog must follow the same pattern.

The standard ShadCN AlertDialog component:
- Imports `{ AlertDialog as AlertDialogPrimitive } from "radix-ui"` (matching the project's `radix-ui ^1.4.3` dependency)
- Wraps Radix primitives with Tailwind CSS styling
- Includes overlay with fade/zoom animations
- Provides `AlertDialogAction` and `AlertDialogCancel` using `buttonVariants` from the existing Button component
- Exports all sub-components as named exports

No new npm dependencies are required. The `radix-ui` package already includes the `AlertDialog` primitive.

**Rationale for new component**: NFR-04 says to avoid new ShadCN component installations "unless strictly necessary." A confirmation dialog is strictly necessary for FR-19 (confirm before leaving household). The Sheet component is not semantically appropriate for a confirmation dialog. AlertDialog is a standard ShadCN component built on the same `radix-ui` library already in use.

## Data Model

### New Tables

```
household
  _id: Id<"household">         (auto-generated)
  _creationTime: number         (auto-generated)
  name: v.string()              (required, 1-100 chars enforced in mutations)

householdMember
  _id: Id<"householdMember">   (auto-generated)
  _creationTime: number         (auto-generated)
  userId: v.string()            (Better Auth user _id, stored as string)
  householdId: v.id("household")

  Indexes:
    by_userId: ["userId"]             -- unique lookup: user -> membership (FR-03)
    by_householdId: ["householdId"]   -- list members of a household (FR-08)
```

### Entity Relationships

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
```

### Why `userId` is `v.string()` not `v.id("user")`

Better Auth tables are managed by the `@convex-dev/better-auth` Convex component. They live in a separate namespace and are not defined in the app's `schema.ts`. The component's user `_id` is a string, but it is not a Convex `Id` from the app's data model (it is an `Id` from the component's data model). Therefore, `householdMember.userId` must be stored as `v.string()`.

The `authComponent.getAuthUser(ctx)` method returns a user document whose `_id` is a string. We use this as the `userId` value in `householdMember` records. To look up user details later, we use `authComponent.getAnyUserById(ctx, userId)`.

### Schema Definition

```typescript
// packages/backend/convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
});

export default schema;
```

## API Design

### Convex Query/Mutation Signatures

```typescript
// packages/backend/convex/households.ts

// --- Queries ---

// getMyHousehold: returns the calling user's household or null
export const getMyHousehold = query({
  args: {},
  handler: async (ctx) => {
    // Returns: { _id: Id<"household">, name: string } | null
  },
});

// getHouseholdMembers: returns members of a specific household
export const getHouseholdMembers = query({
  args: { householdId: v.id("household") },
  handler: async (ctx, { householdId }) => {
    // Returns: Array<{
    //   _id: Id<"householdMember">,
    //   userId: string,
    //   name: string,
    //   email: string,
    //   image: string | null
    // }>
  },
});

// listHouseholds: returns all households for browse-and-join
export const listHouseholds = query({
  args: {},
  handler: async (ctx) => {
    // Returns: Array<{
    //   _id: Id<"household">,
    //   name: string,
    //   memberCount: number
    // }>
  },
});

// --- Mutations ---

// createHousehold: creates household and adds user as member
export const createHousehold = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    // Validates: name non-empty, <= 100 chars
    // Validates: user has no existing membership
    // Returns: Id<"household">
  },
});

// joinHousehold: adds user to an existing household
export const joinHousehold = mutation({
  args: { householdId: v.id("household") },
  handler: async (ctx, { householdId }) => {
    // Validates: user has no existing membership
    // Validates: household exists
    // Returns: void
  },
});

// leaveHousehold: removes user from their current household
export const leaveHousehold = mutation({
  args: {},
  handler: async (ctx) => {
    // Validates: user has a membership
    // Deletes membership; if household now empty, deletes household
    // Returns: void
  },
});

// updateHousehold: renames the user's current household
export const updateHousehold = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    // Validates: name non-empty, <= 100 chars
    // Validates: user is a member of a household
    // Returns: void
  },
});
```

### Error Handling

All mutations throw `ConvexError` with descriptive messages:
- `"Not authenticated"` -- when `getAuthUser` throws (automatic)
- `"You already belong to a household"` -- when trying to create/join while in a household
- `"You don't belong to any household"` -- when trying to leave/update without membership
- `"Household not found"` -- when the target household does not exist
- `"Household name must be between 1 and 100 characters"` -- validation failure

On the client side, mutation errors are caught and displayed as inline error messages (same pattern as login/signup pages).

### Server-Side Queries (TanStack Start)

```typescript
// Used in _authenticated.tsx and onboarding.tsx beforeLoad hooks
const getHouseholdStatus = createServerFn({ method: "GET" }).handler(async () => {
  const household = await fetchAuthQuery(api.households.getMyHousehold, {});
  return household;
});
```

## Technology Decisions

### 1. AlertDialog ShadCN Component (Proper Installation)

**Decision**: Add `apps/web/src/components/ui/alert-dialog.tsx` as an exact copy of the official ShadCN AlertDialog component.

**Rationale**: The confirmation dialog for "Change Household" (FR-19) requires a modal dialog with semantic alert semantics. All existing ShadCN components in the project (`dropdown-menu.tsx`, `sheet.tsx`, `avatar.tsx`, `tooltip.tsx`, `separator.tsx`, etc.) are exact copies of the official ShadCN source code. They share a consistent pattern: import from `radix-ui`, use `cn` from `@/lib/utils`, apply `data-slot` attributes, and use standard Tailwind classes. The AlertDialog must follow the same approach -- it should be an exact copy of the official ShadCN AlertDialog, not a custom implementation. The `radix-ui` package (already installed at `^1.4.3`) includes the `AlertDialog` primitive, so no new npm dependencies are needed.

### 2. `authComponent` API for User Lookups

**Decision**: Use `authComponent.getAuthUser(ctx)` for current user identity and `authComponent.getAnyUserById(ctx, id)` for member info lookups in `getHouseholdMembers`.

**Rationale**: Better Auth user data lives in component-managed tables. The `authComponent` provides type-safe methods to access this data. `getAuthUser` throws on unauthenticated access (handles NFR-01 naturally). `getAnyUserById` looks up any user by their Better Auth `_id`.

### 3. Server-Side Household Check via `fetchAuthQuery`

**Decision**: Use `fetchAuthQuery` in a `createServerFn` to check household membership during SSR `beforeLoad`.

**Rationale**: The existing `getAuth()` pattern uses `createServerFn` for server-side auth checks. `fetchAuthQuery` (exported from `auth-server.ts`) performs authenticated Convex queries server-side using the request's auth token. This maintains the SSR-first approach established in the project.

### 4. No React Context for Household State

**Decision**: Do NOT create a React context for household state. Use Convex `useQuery` directly in components that need household data.

**Rationale**: Convex queries are real-time subscriptions. Components that call `useQuery(api.households.getMyHousehold)` will automatically receive updates. Adding a React context would be redundant and create an extra abstraction layer. The household data will be fetched in:
- `UserMenu`: not needed (only has a navigation link, no data display)
- `_authenticated/household.tsx`: to display household details and support change household
- `_authenticated.tsx` `beforeLoad`: for server-side guard (via `fetchAuthQuery`)

### 5. Household Access via User Menu (Not Sidebar)

**Decision**: Access the household page via the user menu dropdown in the top bar. Do NOT modify the sidebar navigation.

**Rationale**: The sidebar currently contains placeholder navigation items for future features (Dashboard, Food Log, Settings). Modifying the sidebar to add a Household link or converting placeholder items to real links is out of scope for this task. Instead, the user menu dropdown (already functional in the top bar) is the natural location for user-scoped actions like household management. This keeps the sidebar unchanged and provides a clean separation: sidebar = app navigation, user menu = user/account actions.

## File Structure

### New Files

```
packages/backend/convex/households.ts           -- Convex queries & mutations for household management
apps/web/src/routes/onboarding.tsx              -- Onboarding page (standalone, no app shell)
apps/web/src/routes/_authenticated/household.tsx -- Household details page with change-household flow
apps/web/src/components/ui/alert-dialog.tsx     -- ShadCN AlertDialog component (exact official copy)
```

### Modified Files

```
packages/backend/convex/schema.ts               -- Add household + householdMember tables
apps/web/src/routes/_authenticated.tsx           -- Add household check in beforeLoad
apps/web/src/routes/__root.tsx                   -- Add getHouseholdStatus server function (or put in _authenticated.tsx)
apps/web/src/components/layout/user-menu.tsx     -- Add "My Household" link to dropdown menu
```

### Unchanged Files

All other files remain unchanged. Notably:
- `apps/web/src/components/layout/app-sidebar.tsx` -- **NOT modified**. Sidebar navigation is unchanged.
- `packages/backend/src/index.ts` -- No changes needed. The `api` re-export automatically picks up new Convex functions when the generated types are regenerated by `convex dev`.

## Risk Assessment

### 1. Server-Side Household Query in `beforeLoad` -- Performance

**Risk**: Adding a Convex query in `beforeLoad` adds a server-side round-trip on every authenticated page load.

**Mitigation**: The `getMyHousehold` query is a simple index lookup (by_userId), which is O(1) in Convex. The query result is also small (just `_id` and `name`). The cost is comparable to the existing `getAuth()` call. Both happen in `beforeLoad` sequentially -- `getAuth` first (needed for the token), then `getHouseholdStatus`.

### 2. Race Condition: User Leaves Household While on an Authenticated Page

**Risk**: If a user is on an authenticated page and their household is deleted (e.g., by the last other member leaving), the UI could show stale data.

**Mitigation**: Convex's real-time subscriptions will update `useQuery` results immediately. The `getMyHousehold` query will return `null`, and the UI should handle this gracefully (e.g., show a message and redirect to onboarding). However, the server-side guard only runs on navigation. For real-time enforcement, the client should watch for `getMyHousehold` returning `null` and redirect. This can be handled in the `AuthenticatedLayout` component by watching the query result.

### 3. Better Auth User Lookup Across Component Boundaries

**Risk**: `authComponent.getAnyUserById` queries the Better Auth component's internal tables. If the API changes in a future `@convex-dev/better-auth` update, this could break.

**Mitigation**: The project pins `@convex-dev/better-auth` to `^0.10.10`. The `getAnyUserById` method is documented in the component's type definitions. Updating the dependency should be tested.

### 4. New ShadCN Component (AlertDialog)

**Risk**: NFR-04 says to minimize new components. Adding AlertDialog introduces a new file.

**Mitigation**: AlertDialog is strictly necessary for the confirmation dialog (FR-19). It is installed as an exact copy of the official ShadCN source code, following the same pattern as all other UI components in the project. It uses `radix-ui` which is already installed. No new npm dependencies are introduced.

### 5. `userId` as String vs Typed ID

**Risk**: Storing Better Auth user `_id` as `v.string()` loses type safety compared to `v.id("user")`.

**Mitigation**: Better Auth tables are component-managed and not part of the app schema. Using `v.id("user")` would fail since "user" is not a table in the app's `defineSchema`. The string approach is the documented pattern for referencing component-managed documents. Consistent use of `authComponent.getAuthUser(ctx)._id` ensures correctness.

### 6. AlertDialog Only on Household Page

**Risk**: Users might want a quick way to change household without navigating to the details page first.

**Mitigation**: The user menu provides a "My Household" link for quick navigation to the household page where the "Change Household" action lives. This is one extra click but avoids the complexity of AlertDialog + DropdownMenu focus management and keeps the user menu simple.

---

## Changes to Project Root ARCHITECTURE.md

The following sections should be updated in `/Users/xikxp1/Projects/NutriCodex/ARCHITECTURE.md` after implementation:

1. **Data Model section**: Add `household` and `householdMember` tables to the table list. Update the note about "Application tables will be added in future tasks" to reflect that household tables now exist.

2. **Project Structure section**: Add new files:
   - `packages/backend/convex/households.ts` under the backend convex directory
   - `apps/web/src/routes/onboarding.tsx` under web routes
   - `apps/web/src/routes/_authenticated/household.tsx` under authenticated routes
   - `apps/web/src/components/ui/alert-dialog.tsx` under UI components

3. **Component Map > apps/web section**:
   - Update Route Protection description to mention the two-step guard (auth + household)
   - Add onboarding route description
   - Add household details route description (accessible via user menu)
   - Add AlertDialog to the ShadCN UI components list
   - Update UserMenu description to mention "My Household" link

4. **Component Map > packages/backend section**:
   - Add "Household Functions" entry describing `households.ts` queries and mutations

5. **API Boundaries section**:
   - Add a "Household API" subsection listing the queries and mutations

6. **Key Design Decisions section**:
   - Add a decision about mandatory household onboarding and two-step auth guard
   - Add a decision about storing Better Auth user IDs as strings in application tables

7. **Tech Stack table**:
   - Correct "@base-ui/react" to "radix-ui" (the project actually uses `radix-ui ^1.4.3`, not `@base-ui/react`)
