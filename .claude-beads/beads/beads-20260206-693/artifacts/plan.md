# Plan: Implement Auth (Web) -- Login, Signup, Main Screen

## Subtask Breakdown

| # | ID | Title | Complexity | Dependencies | Description |
|---|-----|-------|------------|--------------|-------------|
| 1 | beads-20260206-693-sub-01 | ShadCN UI Components | small | none | Create Button, Card, Input, and Label components in `apps/web/src/components/ui/`. These are pure presentational components with no auth logic, following standard ShadCN patterns using CVA, clsx, and tailwind-merge via the existing `cn()` utility. Remove the `.gitkeep` placeholder. |
| 2 | beads-20260206-693-sub-02 | Router and Root Layout Auth Integration | medium | sub-01 | Modify `apps/web/src/router.tsx` to add `{ expectAuth: true }` to `ConvexQueryClient` and pass `convexQueryClient` in route context. Modify `apps/web/src/routes/__root.tsx` to extend the context type, add a `beforeLoad` server function that calls `getToken()` and injects the auth token into `convexQueryClient.serverHttpClient`, and wrap `<Outlet />` with `<ConvexBetterAuthProvider>`. |
| 3 | beads-20260206-693-sub-03 | Login Page | medium | sub-01, sub-02 | Create `apps/web/src/routes/login.tsx` with a centered card containing email/password form fields, submit handler calling `authClient.signIn.email()`, inline error display, loading state on submit button, `validateSearch` for redirect param, optional `beforeLoad` to redirect authenticated users away, and a link to the signup page preserving the redirect param. |
| 4 | beads-20260206-693-sub-04 | Signup Page | medium | sub-01, sub-02 | Create `apps/web/src/routes/signup.tsx` with a centered card containing name/email/password form fields, submit handler calling `authClient.signUp.email()`, inline error display, loading state, `validateSearch` for redirect param, optional `beforeLoad` to redirect authenticated users, and a link to the login page preserving the redirect param. |
| 5 | beads-20260206-693-sub-05 | Main Screen with Auth Guard | medium | sub-02 | Modify `apps/web/src/routes/index.tsx` to add a `beforeLoad` auth guard that redirects unauthenticated users to `/login?redirect=/`. Replace the placeholder content with a welcome message displaying the user's name (via `authClient.useSession()`) and a logout button that calls `authClient.signOut()` and navigates to `/login` on success. Show loading state while session is pending. |

## Dependency Graph

```
sub-01 (ShadCN UI Components)
  |
  +---> sub-02 (Router & Root Layout Auth Integration)
  |       |
  |       +---> sub-03 (Login Page)
  |       |
  |       +---> sub-04 (Signup Page)
  |       |
  |       +---> sub-05 (Main Screen with Auth Guard)
  |
  +---> sub-03 (Login Page)
  |
  +---> sub-04 (Signup Page)
```

Simplified linear dependency chain:

```
sub-01 --> sub-02 --> sub-03
                  --> sub-04
                  --> sub-05
```

sub-03, sub-04, and sub-05 are independent of each other but all depend on sub-01 and sub-02.

## Implementation Order

1. **sub-01: ShadCN UI Components** -- Must come first. All page subtasks depend on these components for Button, Card, Input, and Label. Pure presentational code with zero auth dependencies, making it a clean starting point.

2. **sub-02: Router and Root Layout Auth Integration** -- Must come second. This sets up the auth infrastructure (`ConvexBetterAuthProvider`, `convexQueryClient` in context, `getAuth` server function) that all three page subtasks require. The root layout changes are foundational to route protection and session management.

3. **sub-03: Login Page** -- After infrastructure is in place, the login page is the natural next step. It is the entry point for unauthenticated users and the redirect target from the auth guard.

4. **sub-04: Signup Page** -- Closely mirrors the login page with minor additions (name field, different API call). Implementing it after login allows reusing the established patterns.

5. **sub-05: Main Screen with Auth Guard** -- Last because it depends on the auth infrastructure (sub-02) and is the destination after successful login/signup. It completes the full auth flow: unauthenticated user -> login -> main screen -> logout -> login.

## Branch

- Name: `beads/beads-20260206-693/auth-web`
- Created from: `main`

## Risk Notes

| Subtask | Risk Level | Notes |
|---------|------------|-------|
| sub-01 | Low | Standard ShadCN copy-paste components. Only risk is CSS variable mismatch, but `globals.css` already defines the correct variables. |
| sub-02 | Medium | Most complex subtask. The `beforeLoad` -> `createServerFn` -> `getToken()` -> `serverHttpClient?.setAuth(token)` chain has multiple integration points. `ConvexBetterAuthProvider` placement must be exactly right. Follow the Convex + Better Auth TanStack Start guide pattern closely. |
| sub-03 | Low-Medium | Auth client API is straightforward. Risk is around error handling -- Better Auth error response shape must be validated. `useSession()` reactivity after login may require navigation-based refresh rather than hook reactivity. |
| sub-04 | Low | Nearly identical to login page. Same patterns apply. |
| sub-05 | Low-Medium | Auth guard in `beforeLoad` must work for both SSR and CSR. `location.href` in the redirect search param must be correctly formatted. The `useSession()` hook must provide user data after the auth guard has already validated the session server-side. |

## Requirement Coverage

| Subtask | Requirements Covered |
|---------|---------------------|
| sub-01 | UX-2, UX-6 |
| sub-02 | FR-13, FR-14, NFR-5 |
| sub-03 | US-2, FR-2, FR-6, FR-9, FR-11, FR-12, FR-15, FR-17, FR-18, UX-1, UX-3, UX-7 |
| sub-04 | US-1, FR-1, FR-5, FR-7, FR-9, FR-11, FR-12, FR-16, FR-17, FR-18, UX-1, UX-4, UX-7 |
| sub-05 | US-3, US-4, US-5, US-6, FR-3, FR-4, FR-8, FR-10, FR-11, UX-5 |
