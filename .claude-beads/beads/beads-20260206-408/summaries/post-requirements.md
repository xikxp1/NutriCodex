# Summary: Requirements

## Key Decisions

- **Household model**: All authenticated users must belong to exactly one household before accessing the app. Households are self-hosted (no invitations needed); users browse and join existing households directly.
- **Mandatory onboarding**: Users without a household are redirected to `/onboarding` before accessing any authenticated route. Onboarding shows two options: create a new household or join an existing one.
- **Auto-deletion**: Households are automatically deleted when the last member leaves. No manual deletion action.
- **Equal members**: All household members have equal permissions (no roles or admin distinction).
- **Web-only scope**: Only the web app is modified; mobile and meal planning are out of scope.

## Technical Details

### Data Model
- **household** table: `name` (string, required)
- **householdMember** table: joins users to households with enforced one-household-per-user constraint (unique index on userId)

### Convex Functions (11 total)
1. **createHousehold({ name })**: Creates household, adds calling user as member
2. **joinHousehold({ householdId })**: Adds user to household; errors if user already in one
3. **leaveHousehold()**: Removes user; auto-deletes household if empty
4. **getMyHousehold()**: Returns current user's household or null
5. **getHouseholdMembers(householdId)**: Returns array of members (name, email, avatar)
6. **listHouseholds()**: Returns all households (ID, name)
7. **updateHousehold({ name })**: Renames household (members-only)

### Web Routes & UI
- **/onboarding**: Authenticated-only, no app shell. Two tabs: "Create Household" (form with name input) and "Join Household" (list of all households with join buttons).
- **Household Details Page**: Shows household name (editable inline), member list with avatars, current user indicated.
- **User Menu Addition**: "Change Household" option opens confirmation dialog warning of household deletion (if user is last member), then redirects to onboarding.
- **Auth Guard Extension**: `_authenticated.tsx` `beforeLoad` performs two checks: (1) authenticated?, (2) has household? Redirects accordingly.

### Validation
- Household name: non-empty, max 100 characters
- Error messages shown inline for invalid input

### Non-Functional
- All mutations validate authentication server-side
- updateHousehold verifies caller is household member
- Real-time reactivity via Convex subscriptions
- Compose UI from existing ShadCN components (Button, Card, Input, Label, Avatar, DropdownMenu, Sheet, Sidebar)
- Responsive (mobile viewport widths)
- Loading states (skeletons/spinners) and error states (inline messages)

## Open Items

None. All clarifying questions resolved.
