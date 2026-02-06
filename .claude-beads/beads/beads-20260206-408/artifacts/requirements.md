# Requirements: Household Management with Onboarding Flow and User Settings

## Overview

NutriCodex is a self-hosted nutrition tracking app where users organize into households for shared meal planning. This task adds the household data model, a mandatory onboarding flow (create or join a household), household details/member views, and the ability to change households from user settings. Every authenticated user must belong to exactly one household before accessing the main app. Since the app is self-hosted, any authenticated user can browse and join any existing household without invitations.

## Functional Requirements

### Data Model

**FR-01**: A `household` table must be added to the Convex schema with at minimum: `name` (string, required).
- Acceptance criteria: The table is defined in `packages/backend/convex/schema.ts` and accessible via the generated Convex API.

**FR-02**: A `householdMember` table (or equivalent join structure) must link users to households. Each record stores a reference to the user and a reference to the household.
- Acceptance criteria: The relationship is queryable in both directions (user -> household, household -> members).

**FR-03**: A user may belong to at most one household at a time. The data model must enforce this constraint (unique index on userId, or equivalent).
- Acceptance criteria: Attempting to join a second household without leaving the first results in an error at the backend level.

### Convex Functions

**FR-04**: A mutation `createHousehold` must create a new household with the given name and automatically add the calling user as a member.
- Acceptance criteria: After calling `createHousehold({ name: "Smith Family" })`, the household exists and the user is a member.

**FR-05**: A mutation `joinHousehold` must add the calling user to an existing household by household ID.
- Acceptance criteria: After calling `joinHousehold({ householdId })`, the user is a member. If the user already belongs to a household, the mutation throws an error.

**FR-06**: A mutation `leaveHousehold` must remove the calling user from their current household. If the user is the last member, the household must be automatically deleted.
- Acceptance criteria: After leaving, the user has no household. If they were the last member, the household record no longer exists.

**FR-07**: A query `getMyHousehold` must return the current user's household (name, ID) or `null` if they have none.
- Acceptance criteria: Returns the household object when the user is a member, `null` otherwise.

**FR-08**: A query `getHouseholdMembers` must return the list of members for a given household (user name, email, avatar/image).
- Acceptance criteria: Returns an array of member info for the household. Only accessible to authenticated users.

**FR-09**: A query `listHouseholds` must return all existing households (ID and name) for the browse-and-join UI.
- Acceptance criteria: Returns all households. Accessible to any authenticated user.

**FR-10**: A mutation `updateHousehold` must allow any member of a household to rename it.
- Acceptance criteria: After calling `updateHousehold({ name: "New Name" })`, the household's name is updated. Only members of the household can call this.

### Onboarding Flow (Web)

**FR-11**: Authenticated users without a household must be redirected to an onboarding page (`/onboarding` or equivalent) before they can access any authenticated route.
- Acceptance criteria: Navigating to `/` or any `/_authenticated/` route while having no household redirects to the onboarding page. The app shell (sidebar, top bar) is NOT shown during onboarding.

**FR-12**: The onboarding page must present two options: "Create a household" and "Join an existing household".
- Acceptance criteria: Both options are clearly visible. The page has a clean, centered layout similar to the login/signup pages.

**FR-13**: The "Create a household" option must provide a form with a household name input and a submit button.
- Acceptance criteria: Submitting a valid name creates the household, adds the user as a member, and redirects to the main app (dashboard).

**FR-14**: The "Join an existing household" option must display a list of all existing households. Each household shows its name and a "Join" button.
- Acceptance criteria: Clicking "Join" adds the user to that household and redirects to the main app. If no households exist, a message like "No households available. Create one instead." is shown.

**FR-15**: Validation: household name must be non-empty and no longer than 100 characters. Appropriate error messages must be shown for invalid input.
- Acceptance criteria: Empty name submission shows an error. Names over 100 characters are rejected.

### Household Details and Member View (Web)

**FR-16**: A household details page or section must be accessible from the app (e.g., via sidebar navigation or settings). It displays the household name and a list of members.
- Acceptance criteria: The page shows the household name, and for each member: their name (or email if no name), and avatar. The current user is visually indicated.

**FR-17**: The household name must be editable inline or via an edit form on the details page. Any member can edit it.
- Acceptance criteria: Editing the name and saving updates it in real-time for all members (Convex reactivity).

### Change Household (Web)

**FR-18**: The user menu dropdown (in the top bar) must include a "Change Household" or "Leave Household" option.
- Acceptance criteria: The option is visible in the user menu dropdown.

**FR-19**: Activating "Change Household" must first confirm with the user (e.g., a confirmation dialog) that they will leave their current household.
- Acceptance criteria: A confirmation dialog warns the user. If the user is the last member, the dialog states the household will be deleted.

**FR-20**: After confirming, the user is removed from their current household and redirected to the onboarding flow to create or join a new household.
- Acceptance criteria: The user's household membership is removed, and they see the onboarding page.

### Auth Guard Integration

**FR-21**: The existing `_authenticated.tsx` layout route must be extended to check whether the user has a household. If authenticated but no household, redirect to onboarding.
- Acceptance criteria: The auth guard performs two checks: (1) is the user authenticated? If no, redirect to `/login`. (2) Does the user have a household? If no, redirect to `/onboarding`. Both checks happen server-side in `beforeLoad`.

**FR-22**: The onboarding route must be a separate route that requires authentication but does NOT require a household. It must NOT render the app shell (sidebar/top bar).
- Acceptance criteria: `/onboarding` is accessible only to authenticated users. It renders a standalone layout (no sidebar, no top bar). Users who already have a household are redirected away from onboarding to `/`.

## Non-Functional Requirements

**NFR-01**: All Convex mutations must validate that the calling user is authenticated (using Convex auth context). Unauthenticated calls must be rejected.

**NFR-02**: The `updateHousehold` mutation must verify the calling user is a member of the household being modified.

**NFR-03**: Real-time reactivity: household name changes and member list changes must update in real-time for all connected clients via Convex subscriptions.

**NFR-04**: All new UI must be built from existing ShadCN UI components already in the project (`Button`, `Card`, `Input`, `Label`, `Separator`, `Avatar`, `DropdownMenu`, `Sheet`, `Sidebar`, `Skeleton`, `Tooltip`). Avoid creating new custom components — compose from these primitives. No new UI libraries. No new ShadCN component installations unless strictly necessary.

**NFR-05**: All new pages must be responsive and functional on mobile viewport widths (the web app, not the native mobile app).

**NFR-06**: Loading states must be shown while data is being fetched (skeletons or spinners, consistent with existing patterns).

**NFR-07**: Error states must be shown when mutations fail (inline error messages, consistent with login/signup pages).

## Scope Boundaries

The following are explicitly **out of scope** for this task:

- **Mobile app (Expo)**: No changes to `apps/mobile/`. Only the web app is affected.
- **Meal planning**: Household-based meal planning features are NOT included. This task only establishes the household data model and management UI.
- **Invite codes or email invitations**: Not needed for a self-hosted app. Users browse and join directly.
- **Roles or permissions within a household**: All members are equal. No owner/admin distinction.
- **Household size limits**: No maximum member count.
- **User profile editing**: Changing user name, email, or avatar is not in scope.
- **Household deletion by action**: Households are only deleted automatically when the last member leaves. There is no explicit "delete household" action.
- **Search or filtering of households**: The `listHouseholds` query returns all households. Search/filter can be added later if the list grows.

## Assumptions

1. The Better Auth user tables (managed by the auth component) contain `name`, `email`, and `image` fields that can be read by Convex queries to display member info.
2. The Convex `getAuthUserId` (or equivalent from the Better Auth Convex integration) is available in server functions to identify the calling user.
3. The existing `_authenticated.tsx` `beforeLoad` hook can be extended to make an additional server-side check (querying Convex for household membership).
4. The number of households in a self-hosted instance will be small enough that returning all of them in `listHouseholds` is acceptable without pagination.
5. Household names do not need to be unique. Multiple households can share the same name.

## Open Questions

None. All clarifying questions have been resolved with the user.
