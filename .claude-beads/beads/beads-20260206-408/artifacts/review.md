# Review: Household Management with Onboarding Flow and User Settings

## Status: PASS

## Summary

The implementation is well-structured, complete, and closely follows both the requirements and architecture specifications. All 7 Convex functions are correctly implemented with proper authentication checks, validation, and error handling. The frontend pages (onboarding, household details) use consistent patterns matching the existing login/signup pages, and the auth guard extension correctly performs the two-step server-side check. All 212 tests pass, lint and type-check produce no errors, and the production build succeeds.

## Code Quality Issues

| # | Severity | File | Line(s) | Description | Suggestion |
|---|----------|------|---------|-------------|------------|
| 1 | suggestion | `apps/web/src/routes/_authenticated.tsx` | 31-35 | The `as string` cast on `to: "/onboarding"` is now unnecessary. The route tree (`routeTree.gen.ts`) includes `/onboarding` as a valid route, so the type checker should accept it without the cast. The comment says it's needed "until the route file is added and route types are regenerated" -- but they have been regenerated. | Remove the `as string` cast and the associated comment. This is cosmetic only. |
| 2 | suggestion | `apps/web/src/routes/_authenticated/household.tsx` | 182-184, 248-250 | `getHouseholdMembers` is subscribed to twice on the same page -- once in `MembersSection` and once in `LeaveHouseholdSection`. While Convex deduplicates identical subscriptions, it would be cleaner to lift the query result to the parent `HouseholdPage` component and pass it down as a prop to both sections. | Lift `useQuery(api.households.getHouseholdMembers, { householdId })` to `HouseholdPage` and pass the `members` array as a prop to both `MembersSection` and `LeaveHouseholdSection`. |
| 3 | suggestion | `apps/web/src/routes/_authenticated/household.tsx` | 170-177 | The `size="icon-sm"` prop is used on the edit Button. This is a custom variant that was added to the project's Button component. This works correctly but could be confirmed against the Button component's variant definitions. | No action needed -- verified that `icon-sm` is a defined variant in the project's Button component. |
| 4 | suggestion | `apps/web/src/components/ui/alert-dialog.tsx` | 1 | The `"use client"` directive at the top of the file. This is the standard ShadCN pattern (all ShadCN components include it), and in a TanStack Start app it serves as a client boundary marker. Consistent with other UI components. | No action needed. |
| 5 | suggestion | `packages/backend/convex/households.ts` | 56-79 | The `listHouseholds` query performs a full table scan of `household` and for each household queries `householdMember` by index. This is O(H * M_avg) where H is number of households. Acceptable for a self-hosted app with small data as noted in the architecture, but could become slow at scale. | Acknowledged as acceptable per requirements (Assumption 4). If the list grows, consider adding a `memberCount` field directly to the `household` table. |
| 6 | suggestion | `apps/web/src/routes/onboarding.tsx` | 136-137 | `joiningId` is typed as `string | null` and compared against `household._id` via `as string` cast. This works correctly but the cast is somewhat unnecessary since Convex IDs serialize to strings. | Minor -- no action needed. |

## Functional Issues

| # | Severity | Requirement | Description |
|---|----------|-------------|-------------|
| (none) | -- | -- | No functional issues found. All requirements are satisfied. |

## Requirements Coverage Checklist

### Functional Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-01 | PASS | `household` table defined in `schema.ts` with `name: v.string()` |
| FR-02 | PASS | `householdMember` table with `userId` and `householdId` fields, indexes `by_userId` and `by_householdId` |
| FR-03 | PASS | One-household constraint enforced in `createHousehold` and `joinHousehold` via `by_userId` index lookup |
| FR-04 | PASS | `createHousehold` mutation creates household and inserts member record for calling user |
| FR-05 | PASS | `joinHousehold` mutation checks existing membership, verifies household exists, inserts member |
| FR-06 | PASS | `leaveHousehold` deletes membership, counts remaining members, deletes household if zero |
| FR-07 | PASS | `getMyHousehold` returns `{ _id, name }` or `null` |
| FR-08 | PASS | `getHouseholdMembers` returns array with `_id`, `userId`, `name`, `email`, `image` via `authComponent.getAnyUserById` |
| FR-09 | PASS | `listHouseholds` returns all households with `memberCount` |
| FR-10 | PASS | `updateHousehold` validates membership and patches household name |
| FR-11 | PASS | `_authenticated.tsx` `beforeLoad` redirects to `/onboarding` when no household |
| FR-12 | PASS | Onboarding page has "Create Household" and "Join Household" toggle buttons |
| FR-13 | PASS | Create form has Label + Input + Submit Button, calls `createHousehold`, navigates to `/` on success |
| FR-14 | PASS | Join section lists households with name, member count, and "Join" button. Shows "No households available" when empty |
| FR-15 | PASS | Client-side validation (non-empty, max 100 chars) plus server-side validation in mutations |
| FR-16 | PASS | Household page displays name, member list with Avatar, name/email, and "(You)" indicator |
| FR-17 | PASS | Inline name editing with Input, Save/Cancel buttons, Enter/Escape keyboard shortcuts |
| FR-18 | PASS | "My Household" link added to user menu dropdown with Home icon, navigates to `/household` |
| FR-19 | PASS | AlertDialog confirmation with "Leave Household?" title, dynamic description with last-member warning |
| FR-20 | PASS | On confirm, calls `leaveHousehold` mutation and navigates to `/onboarding` |
| FR-21 | PASS | Two-step `beforeLoad`: (1) auth check -> `/login`, (2) household check -> `/onboarding` |
| FR-22 | PASS | `/onboarding` is a top-level route (not under `_authenticated/`), no app shell, has own auth guard, redirects to `/` if user already has household |

### Non-Functional Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| NFR-01 | PASS | All 7 Convex functions call `authComponent.getAuthUser(ctx)` which throws for unauthenticated calls |
| NFR-02 | PASS | `updateHousehold` verifies the calling user has a membership before patching |
| NFR-03 | PASS | All data uses `useQuery` Convex subscriptions -- updates propagate in real-time |
| NFR-04 | PASS | UI built from existing ShadCN components (Button, Card, Input, Label, Separator, Avatar, Skeleton, DropdownMenu). AlertDialog added as a necessary new ShadCN component following identical patterns (radix-ui, cn, data-slot, buttonVariants) |
| NFR-05 | PASS | Onboarding uses `max-w-sm` centered layout; household page uses `max-w-2xl` centered layout. Both responsive |
| NFR-06 | PASS | Loading states: Skeleton components used in household list (onboarding), household page, and member list |
| NFR-07 | PASS | Error states: Inline error messages with `role="alert"`, consistent with login/signup pattern (`text-sm text-destructive`) |

## Test Coverage Assessment

- **Status**: adequate (with noted caveats)
- **Test count**: 212 tests, all passing
- **Gaps**:
  - Most backend tests are specification-style (document expected behavior, not runnable Convex function tests). This is acknowledged in the test plan -- `convex-test` is not installed.
  - The onboarding and household page tests are specification-style (document expected behavior). The test plan notes these should be upgraded to component rendering tests now that the files exist.
  - The UserMenu tests (`user-menu-household.test.tsx`) are real component rendering tests and all 5 pass.
  - The AlertDialog export tests are specification-style (verify expected exports list). The component exists and could be tested with actual import-based tests.
  - Server-side `beforeLoad` redirect logic cannot be unit tested without the full router context. Manual testing is required.

## Positive Observations

1. **Consistent patterns**: The implementation closely mirrors existing project patterns. Error handling in onboarding/household pages uses the exact same `text-sm text-destructive` + `role="alert"` pattern as login/signup. The form structure, loading states, and layout are all consistent.

2. **Thorough validation**: Name validation is enforced both client-side (immediate feedback) and server-side (Convex mutations). The `trim()` operation is applied in both places.

3. **Clean Convex function design**: All 7 functions are well-structured with clear responsibilities. The use of `authComponent.getAuthUser(ctx)` at the top of each function naturally enforces authentication. The one-household constraint is checked before any mutation.

4. **Proper race condition handling**: The `leaveHousehold` mutation correctly deletes the membership first, then checks remaining members and conditionally deletes the household. This ordering prevents issues with concurrent operations.

5. **Good UX details**: The household page includes Enter/Escape keyboard shortcuts for inline editing, the "(You)" indicator for the current user, the dynamic last-member warning in the AlertDialog, and pluralization of "member"/"members" in the onboarding list.

6. **ARCHITECTURE.md update**: Comprehensive and accurate documentation update covering all aspects of the implementation -- data model, project structure, component map, API boundaries, and key design decisions. Also corrected the existing `@base-ui/react` reference to `radix-ui`.

7. **AlertDialog component**: Exact copy of the official ShadCN AlertDialog following the same patterns as all other UI components in the project. No new dependencies introduced. The `AlertDialogAction` accepts a `variant` prop which is used to render the destructive style on the household page.

8. **Clean auth guard flow**: The two-step `beforeLoad` check in `_authenticated.tsx` is well-ordered -- auth check first, then set the token on the ConvexQueryClient, then check household status. This ensures the Convex query is properly authenticated.
