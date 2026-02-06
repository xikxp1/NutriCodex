# Plan: Household Management with Onboarding Flow and User Settings

## Subtask Breakdown

| # | ID | Title | Complexity | Dependencies | Description |
|---|-----|-------|------------|--------------|-------------|
| 1 | beads-20260206-408-sub-01 | Schema and Convex household functions | medium | none | Add `household` and `householdMember` tables to `packages/backend/convex/schema.ts` with indexes. Create `packages/backend/convex/households.ts` with all 7 Convex functions: queries (`getMyHousehold`, `getHouseholdMembers`, `listHouseholds`) and mutations (`createHousehold`, `joinHousehold`, `leaveHousehold`, `updateHousehold`). All functions must validate authentication via `authComponent.getAuthUser(ctx)`, enforce one-household-per-user constraint, validate name length (1-100 chars), and auto-delete empty households. Covers FR-01 through FR-10, NFR-01, NFR-02. |
| 2 | beads-20260206-408-sub-02 | AlertDialog ShadCN component | small | none | Add `apps/web/src/components/ui/alert-dialog.tsx` as an exact copy of the official ShadCN AlertDialog component. Must follow the same pattern as existing ShadCN components: import from `radix-ui`, use `cn` from `@/lib/utils`, apply `data-slot` attributes, export all sub-components. No new npm dependencies needed (`radix-ui ^1.4.3` already installed). Covers NFR-04 (necessary for FR-19 confirmation dialog). |
| 3 | beads-20260206-408-sub-03 | Auth guard extension for household check | small | beads-20260206-408-sub-01 | Modify `apps/web/src/routes/_authenticated.tsx` to add a two-step server-side check in `beforeLoad`: (1) authenticate via existing `getAuth()`, (2) check household membership via new `getHouseholdStatus()` server function using `fetchAuthQuery(api.households.getMyHousehold, {})`. Redirect to `/onboarding` if no household. Covers FR-11, FR-21. |
| 4 | beads-20260206-408-sub-04 | Onboarding page | medium | beads-20260206-408-sub-01, beads-20260206-408-sub-03 | Create `apps/web/src/routes/onboarding.tsx` as a standalone route (no app shell). Requires authentication but NOT a household (redirect away if user already has one). Contains two sections toggled via buttons: "Create Household" (Card with name Input + submit Button) and "Join Household" (Card with list of all households from `listHouseholds` query, each with name, member count, and Join button). Includes validation (non-empty, max 100 chars), loading states (Skeleton), error states (inline messages), and redirect to `/` on success. Covers FR-11 through FR-15, FR-22, NFR-05 through NFR-07. |
| 5 | beads-20260206-408-sub-05 | Household details page | medium | beads-20260206-408-sub-01, beads-20260206-408-sub-02, beads-20260206-408-sub-03 | Create `apps/web/src/routes/_authenticated/household.tsx` inside the app shell. Displays: editable household name (click to edit with Input + save/cancel), member list with Avatar + name/email + "(You)" indicator, Separator between sections, and a "Change Household" Button that opens an AlertDialog confirmation. AlertDialog dynamically warns if user is last member (household will be deleted). On confirm: call `leaveHousehold` mutation, navigate to `/onboarding`. All data reactive via Convex. Covers FR-16 through FR-20, NFR-03, NFR-05 through NFR-07. |
| 6 | beads-20260206-408-sub-06 | User menu household link | small | beads-20260206-408-sub-05 | Modify `apps/web/src/components/layout/user-menu.tsx` to add a "My Household" DropdownMenuItem with a Lucide icon (Home or Users) that navigates to `/household` via TanStack Router Link. Insert between user info label and Sign Out, with Separators. Covers FR-18 (entry point to household page). |
| 7 | beads-20260206-408-sub-07 | ARCHITECTURE.md update | small | beads-20260206-408-sub-01, beads-20260206-408-sub-02, beads-20260206-408-sub-03, beads-20260206-408-sub-04, beads-20260206-408-sub-05, beads-20260206-408-sub-06 | Update the project root `ARCHITECTURE.md` to reflect all changes: add household/householdMember tables to Data Model, add new files to Project Structure, update Component Map (route protection, onboarding route, household route, AlertDialog, UserMenu), add Household API to API Boundaries, add key design decisions (mandatory onboarding, userId as string), update Tech Stack if needed. |

## Dependency Graph

```
                  sub-01 (Schema + Functions)       sub-02 (AlertDialog)
                   /       |        \                      |
                  /        |         \                     |
                 v         v          v                    |
          sub-03 (Auth Guard)         |                    |
           /       \                  |                    |
          /         \                 |                    |
         v           v               v                    v
  sub-04 (Onboarding)     sub-05 (Household Details) <----+
                                  |
                                  v
                           sub-06 (User Menu Link)
                                  |
                                  v
                           sub-07 (ARCHITECTURE.md)
```

## Implementation Order

1. **sub-01 (Schema + Convex functions)** -- Foundational. All frontend work depends on these backend tables and functions being defined. Must come first.
2. **sub-02 (AlertDialog component)** -- No dependencies. Can be done in parallel with sub-01, but listed second for logical flow. Needed before the household details page.
3. **sub-03 (Auth guard extension)** -- Depends on sub-01 because it calls `api.households.getMyHousehold`. Must be done before the onboarding page to ensure proper redirect behavior.
4. **sub-04 (Onboarding page)** -- Depends on sub-01 (Convex functions) and sub-03 (auth guard redirects to this page). This is the primary user-facing entry point for the new feature.
5. **sub-05 (Household details page)** -- Depends on sub-01 (Convex functions), sub-02 (AlertDialog for confirmation), and sub-03 (auth guard ensures user has household). The main management UI.
6. **sub-06 (User menu link)** -- Depends on sub-05 (the page must exist to link to). Small change to connect the user menu to the household page.
7. **sub-07 (ARCHITECTURE.md update)** -- Depends on all other subtasks being complete. Documents the final state of the implementation.

## Branch

- Name: `beads/beads-20260206-408/household-management`
- Created from: `main`
