# Summary: Architecture — Household Management

## Key Decisions

1. **Mandatory household onboarding**: All authenticated users must belong to exactly one household before accessing the main app. Two-step server-side guard: (1) auth check, (2) household check with redirect to `/onboarding`.

2. **Better Auth integration for user lookups**: Use `authComponent.getAuthUser(ctx)` for current user and `authComponent.getAnyUserById(ctx, userId)` for member details. User IDs stored as `v.string()` because Better Auth tables are component-managed, not in app schema.

3. **Server-side household check via `fetchAuthQuery`**: `_authenticated.tsx` `beforeLoad` calls new `getHouseholdStatus()` server function using `fetchAuthQuery(api.households.getMyHousehold, {})` from `auth-server.ts`.

4. **Household access via user menu**: Add "My Household" link to existing user dropdown menu. Do NOT modify sidebar. Household details page has "Change Household" action in AlertDialog.

5. **AlertDialog ShadCN component**: Add exact official copy to `apps/web/src/components/ui/alert-dialog.tsx`. No new npm dependencies (uses `radix-ui ^1.4.3` already installed).

## Technical Details

### Schema (packages/backend/convex/schema.ts)
```typescript
household: {
  _id: Id<"household">
  _creationTime: number
  name: v.string()  // 1-100 chars validated in mutations
}

householdMember: {
  _id: Id<"householdMember">
  _creationTime: number
  userId: v.string()  // Better Auth user._id
  householdId: v.id("household")
  Indexes: by_userId (unique), by_householdId
}
```

### API Endpoints (packages/backend/convex/households.ts)

**Queries**:
- `getMyHousehold()` → `{_id, name} | null` — Requires auth
- `getHouseholdMembers(householdId)` → `Array<{_id, userId, name, email, image}>` — Requires auth
- `listHouseholds()` → `Array<{_id, name, memberCount}>` — Requires auth

**Mutations**:
- `createHousehold({name})` → `Id<"household">` — Must NOT have household
- `joinHousehold({householdId})` → `void` — Must NOT have household
- `leaveHousehold()` → `void` — Deletes household if empty
- `updateHousehold({name})` → `void` — Must have household

All throw `ConvexError` with descriptive messages. All use `authComponent.getAuthUser(ctx)` (throws if unauthenticated, satisfying NFR-01).

### Routes & Components

**New files**:
- `packages/backend/convex/households.ts` — All household queries/mutations
- `apps/web/src/routes/onboarding.tsx` — Standalone (no app shell): Create/join household UI with toggle tabs, Skeleton loading, inline validation
- `apps/web/src/routes/_authenticated/household.tsx` — Shows current household name (editable), member list with avatars, "Change Household" button opening AlertDialog
- `apps/web/src/components/ui/alert-dialog.tsx` — Official ShadCN AlertDialog exact copy

**Modified files**:
- `packages/backend/convex/schema.ts` — Add household + householdMember tables
- `apps/web/src/routes/_authenticated.tsx` — Extend `beforeLoad` with household check after auth check; redirect to `/onboarding` if no household
- `apps/web/src/components/layout/user-menu.tsx` — Add "My Household" link to dropdown menu (icon + text)
- `apps/web/src/routes/__root.tsx` or `_authenticated.tsx` — Add `getHouseholdStatus` server function

### UI Patterns

- **Onboarding layout**: Centered, matching login/signup style. Two sections with toggle buttons (`variant="outline"` / `variant="default"`). Lists existing households with join buttons; shows member count per household.
- **Household page**: Editable household name (click to edit). Member rows: Avatar + name/email + "(You)" indicator. Separator. "Change Household" button.
- **AlertDialog flow**: "Leave Household?" title. Dynamic description: "You will leave [Name]." + conditional "Since you are the last member, the household will be deleted." Buttons: "Cancel" / "Leave & Continue". On confirm: `leaveHousehold()` mutation → navigate to `/onboarding`.
- **Error handling**: ConvexError messages displayed inline (existing login/signup pattern).

## Open Items

- **Race condition**: User leaves household while on authenticated page. Mitigation: client watches `useQuery(api.households.getMyHousehold)` for `null` and redirects to onboarding.
- **Performance**: `beforeLoad` adds server-side Convex round-trip. Mitigation: `getMyHousehold` is O(1) index lookup; cost comparable to existing `getAuth()`.
- **Better Auth version pin**: `@convex-dev/better-auth` pinned to `^0.10.10`. API surface (getAnyUserById) should be stable but verify on future updates.
