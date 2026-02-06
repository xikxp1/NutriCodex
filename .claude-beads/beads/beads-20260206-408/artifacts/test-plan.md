# Test Plan: Household Management with Onboarding Flow and User Settings

## Test Strategy
- **Framework**: Vitest 4.x with jsdom environment
- **UI Testing**: React Testing Library + @testing-library/user-event
- **Test types**: Unit tests (component exports, contracts), component interaction tests (UserMenu), specification tests (documenting expected behavior for not-yet-implemented modules)
- **Run command**: `cd apps/web && bun run test` or `cd apps/web && bunx vitest run`
- **Watch mode**: `cd apps/web && bun run test:watch`

## Test Architecture

### Why specification-style tests?

This project has two testing constraints:

1. **Convex backend functions** (`packages/backend/convex/households.ts`) run server-side inside the Convex runtime. The project does not have `convex-test` installed, so there is no way to run Convex function unit tests locally. Backend function contracts are documented as specification tests in `household-flow.test.tsx`.

2. **Not-yet-existing modules** (`onboarding.tsx`, `household.tsx`, `alert-dialog.tsx`) cannot be imported even inside `try/catch` because Vite's import analysis resolves modules at transform time. Tests for these modules are written as specification tests that document expected behavior. When the developer creates the files, the tests should be upgraded to render the actual components.

3. **Existing modules being modified** (`user-menu.tsx`) can be imported and tested with React Testing Library. The `user-menu-household.test.tsx` file renders the real UserMenu component and will fail until the "My Household" link is added. These are true TDD tests.

## Test Matrix

| Requirement | Subtask | Test File | Test Description | Type |
|-------------|---------|-----------|-----------------|------|
| FR-01 | sub-01 | `integration/household-flow.test.tsx` | household table has 'name' field | Specification |
| FR-02 | sub-01 | `integration/household-flow.test.tsx` | householdMember has userId and householdId | Specification |
| FR-03 | sub-01 | `integration/household-flow.test.tsx` | by_userId index for unique user lookup | Specification |
| FR-04 | sub-01 | `integration/household-flow.test.tsx` | createHousehold args, return, auto-add member | Specification |
| FR-05 | sub-01 | `integration/household-flow.test.tsx` | joinHousehold args, return, already-in-household error | Specification |
| FR-06 | sub-01 | `integration/household-flow.test.tsx` | leaveHousehold removes user, deletes empty household | Specification |
| FR-07 | sub-01 | `integration/household-flow.test.tsx` | getMyHousehold returns household or null | Specification |
| FR-08 | sub-01 | `integration/household-flow.test.tsx` | getHouseholdMembers args, return shape with user info | Specification |
| FR-09 | sub-01 | `integration/household-flow.test.tsx` | listHouseholds return shape with memberCount | Specification |
| FR-10 | sub-01 | `integration/household-flow.test.tsx` | updateHousehold renames, membership check | Specification |
| NFR-01 | sub-01 | `integration/household-flow.test.tsx` | All functions require authentication | Specification |
| NFR-02 | sub-01 | `integration/household-flow.test.tsx` | updateHousehold verifies membership | Specification |
| NFR-04 | sub-02 | `components/ui/alert-dialog-exports.test.tsx` | AlertDialog exports 11 sub-components | Specification |
| NFR-04 | sub-02 | `components/ui/alert-dialog-exports.test.tsx` | Uses radix-ui, cn, data-slot, buttonVariants | Specification |
| FR-11 | sub-03 | `routes/authenticated-household-guard.test.tsx` | Two-step auth guard (auth + household) | Specification |
| FR-21 | sub-03 | `routes/authenticated-household-guard.test.tsx` | beforeLoad checks auth then household | Specification |
| FR-22 | sub-04 | `routes/onboarding.test.tsx` | Standalone route, no app shell | Specification |
| FR-12 | sub-04 | `routes/onboarding.test.tsx` | Create and Join options visible | Specification |
| FR-13 | sub-04 | `routes/onboarding.test.tsx` | Create form with Input, submit, redirect | Specification |
| FR-14 | sub-04 | `routes/onboarding.test.tsx` | Join list with names, Join buttons, empty state | Specification |
| FR-15 | sub-04 | `routes/onboarding.test.tsx` | Name validation (empty, >100 chars) | Specification |
| NFR-06 | sub-04 | `routes/onboarding.test.tsx` | Skeleton loading state | Specification |
| NFR-07 | sub-04 | `routes/onboarding.test.tsx` | Inline error display | Specification |
| FR-16 | sub-05 | `routes/household.test.tsx` | Display name, member list, Avatar, (You) | Specification |
| FR-17 | sub-05 | `routes/household.test.tsx` | Inline name editing with validation | Specification |
| FR-19 | sub-05 | `routes/household.test.tsx` | AlertDialog confirmation, last-member warning | Specification |
| FR-20 | sub-05 | `routes/household.test.tsx` | Leave + redirect to /onboarding | Specification |
| NFR-03 | sub-05 | `routes/household.test.tsx` | Real-time reactivity via Convex subscriptions | Specification |
| FR-18 | sub-06 | `components/layout/user-menu-household.test.tsx` | "My Household" link in dropdown | Component (fails until implemented) |
| FR-18 | sub-06 | `components/layout/user-menu-household.test.tsx` | Link targets /household route | Component (fails until implemented) |
| FR-18 | sub-06 | `components/layout/user-menu-household.test.tsx` | Lucide icon present | Component (fails until implemented) |
| FR-18 | sub-06 | `components/layout/user-menu-household.test.tsx` | Sign Out still present | Component (fails until implemented) |
| FR-18 | sub-06 | `components/layout/user-menu-household.test.tsx` | Separator structure | Component (fails until implemented) |
| sub-01 | sub-01 | `integration/household-flow.test.tsx` | Error messages contract | Specification |

## Coverage Goals

### What is covered by these tests

- **Convex function API contracts** (sub-01): All 7 functions documented with expected arguments, return shapes, error messages, and authentication requirements
- **Data model schema** (sub-01): Both tables, indexes, and the userId-as-string rationale
- **AlertDialog component specification** (sub-02): All 11 required exports and implementation requirements
- **Auth guard extension** (sub-03): Two-step beforeLoad check behavior documented
- **Onboarding page behavior** (sub-04): Route structure, create/join flows, validation, loading/error states
- **Household details page behavior** (sub-05): Name display/editing, member list, change-household AlertDialog flow
- **UserMenu modification** (sub-06): Component-level tests that render the real UserMenu and verify the "My Household" link

### What is explicitly deferred and why

- **Convex function integration tests**: No `convex-test` library is installed. Testing Convex functions requires either the Convex test framework or a running Convex dev server. This is deferred until the project adds `convex-test` as a dev dependency.
- **Server-side beforeLoad tests**: TanStack Router's `beforeLoad` hooks require the full router context and cannot be unit tested in isolation. The auth guard extension (sub-03) is verified through specification tests and should be manually tested.
- **Full component rendering for onboarding/household pages**: These modules don't exist yet. Vite's import analysis prevents importing non-existent modules even in tests. Once the files are created, the developer should upgrade specification tests to component rendering tests.
- **Mobile app tests**: Out of scope per requirements (web only).
- **ARCHITECTURE.md update tests** (sub-07): Documentation-only subtask, no tests needed.

## Running Tests

### All tests
```bash
cd apps/web && bun run test
```

### Specific test file
```bash
cd apps/web && bunx vitest run src/__tests__/integration/household-flow.test.tsx
cd apps/web && bunx vitest run src/__tests__/components/ui/alert-dialog-exports.test.tsx
cd apps/web && bunx vitest run src/__tests__/routes/authenticated-household-guard.test.tsx
cd apps/web && bunx vitest run src/__tests__/routes/onboarding.test.tsx
cd apps/web && bunx vitest run src/__tests__/routes/household.test.tsx
cd apps/web && bunx vitest run src/__tests__/components/layout/user-menu-household.test.tsx
```

### Tests by subtask
```bash
# sub-01: Schema + Convex functions
cd apps/web && bunx vitest run src/__tests__/integration/household-flow.test.tsx

# sub-02: AlertDialog component
cd apps/web && bunx vitest run src/__tests__/components/ui/alert-dialog-exports.test.tsx

# sub-03: Auth guard extension
cd apps/web && bunx vitest run src/__tests__/routes/authenticated-household-guard.test.tsx

# sub-04: Onboarding page
cd apps/web && bunx vitest run src/__tests__/routes/onboarding.test.tsx

# sub-05: Household details page
cd apps/web && bunx vitest run src/__tests__/routes/household.test.tsx

# sub-06: User menu household link
cd apps/web && bunx vitest run src/__tests__/components/layout/user-menu-household.test.tsx
```

### Watch mode
```bash
cd apps/web && bun run test:watch
```

## Test File Locations

All test files are in `apps/web/src/__tests__/`:

| File | Subtask | Status |
|------|---------|--------|
| `integration/household-flow.test.tsx` | sub-01 | Passes (specification tests) |
| `components/ui/alert-dialog-exports.test.tsx` | sub-02 | Passes (specification tests) |
| `routes/authenticated-household-guard.test.tsx` | sub-03 | Passes (specification + module tests) |
| `routes/onboarding.test.tsx` | sub-04 | Passes (specification tests) |
| `routes/household.test.tsx` | sub-05 | Passes (specification tests) |
| `components/layout/user-menu-household.test.tsx` | sub-06 | **Fails** (5 tests, expected -- implementation pending) |

## Developer Instructions

When implementing each subtask, the developer should:

1. **sub-01 (Convex functions)**: The specification tests in `household-flow.test.tsx` document all API contracts. No test changes needed unless the API contract changes.

2. **sub-02 (AlertDialog)**: After creating `alert-dialog.tsx`, update `alert-dialog-exports.test.tsx` to replace the specification tests with actual import-based tests (similar to `dropdown-menu-exports.test.tsx`).

3. **sub-03 (Auth guard)**: The specification tests document the expected behavior. Manual testing is needed to verify the SSR beforeLoad redirect logic.

4. **sub-04 (Onboarding)**: After creating `onboarding.tsx`, update `onboarding.test.tsx` to import the actual component and render it with mocked Convex hooks. The specification comments describe exactly what each test should verify.

5. **sub-05 (Household details)**: After creating `household.tsx`, update `household.test.tsx` similarly to sub-04.

6. **sub-06 (User menu)**: The 5 failing tests in `user-menu-household.test.tsx` will pass once the "My Household" link is added to `user-menu.tsx`. No test modifications should be needed.
