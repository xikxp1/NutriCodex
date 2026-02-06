# Review: Implement Auth (Web) -- Login, Signup, and Main Screen

## Status: PASS

## Summary

The implementation is well-structured and faithfully follows both the requirements and architecture specifications. All five subtasks are completed. ShadCN UI components follow standard patterns, auth flows use the correct Better Auth client API with proper error handling, route protection via `beforeLoad` + `createServerFn` is correctly implemented for SSR/CSR consistency, and redirect parameter preservation works across login/signup navigation. All automated checks pass (lint, type-check, build, format). Two warnings and two suggestions are noted below, none of which are blocking.

## Automated Check Results

| Check | Result |
|-------|--------|
| `bun run lint` | PASS -- zero errors across all packages |
| `bun run type-check` | PASS -- zero errors across all packages |
| `bun run build` | PASS -- client and SSR bundles built successfully |
| `bun run format` | PASS -- no files changed (already formatted) |

## Code Quality Issues

| # | Severity | File | Line(s) | Description | Suggestion |
|---|----------|------|---------|-------------|------------|
| 1 | warning | `apps/web/src/routes/login.tsx` | 14 | **Open redirect risk**: The `redirect` search parameter is accepted as-is from user input via `(search.redirect as string) \|\| "/"`. While TanStack Router's `navigate({ to })` is designed for internal routing and would not follow external URLs or `javascript:` URIs, it is best practice to validate the redirect starts with `/` and does not contain `://` to prevent any edge-case open-redirect behavior. | Add validation: `redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : "/"` |
| 2 | warning | `apps/web/src/routes/signup.tsx` | 14 | **Same open redirect risk as login.tsx**: The `validateSearch` function has the same unchecked redirect parameter. | Apply the same validation pattern as suggested for login.tsx. |
| 3 | suggestion | `apps/web/src/routes/index.tsx` | 43 | **Unnecessary redirect param on logout**: The logout navigation passes `search: { redirect: "/" }` when navigating to `/login`. Since `/` is already the default value in `validateSearch`, this parameter is redundant. Simpler: `navigate({ to: "/login" })`. | Remove `search: { redirect: "/" }` from the logout navigation. |
| 4 | suggestion | `apps/web/src/routes/index.tsx` | 36 | **User name could be undefined during render**: If `useSession()` returns `data` but `data.user.name` is empty or null, the heading would show "Welcome, " with a trailing comma and space. This is an unlikely edge case since signup requires a name, but defensive rendering could be slightly more robust. | Consider `data?.user?.name \|\| "User"` as a fallback. |

## Functional Issues

| # | Severity | Requirement | Description |
|---|----------|-------------|-------------|
| -- | -- | -- | No functional issues found. All requirements are covered. |

## Requirements Coverage Matrix

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| FR-1 (Signup) | Covered | `apps/web/src/routes/signup.tsx` -- form with name/email/password, calls `authClient.signUp.email()`, redirects on success |
| FR-2 (Login) | Covered | `apps/web/src/routes/login.tsx` -- form with email/password, calls `authClient.signIn.email()`, redirects on success |
| FR-3 (Logout) | Covered | `apps/web/src/routes/index.tsx` -- logout button calls `authClient.signOut()`, navigates to `/login` on success |
| FR-4 (Password policy) | Covered | Delegated to Better Auth server-side (no custom client validation) |
| FR-5 (No email verification) | Covered | Backend config unchanged; signup flow navigates immediately on success |
| FR-6 (Login page at /login) | Covered | `apps/web/src/routes/login.tsx` -- centered card with all required elements |
| FR-7 (Signup page at /signup) | Covered | `apps/web/src/routes/signup.tsx` -- centered card with all required elements |
| FR-8 (Main screen at /) | Covered | `apps/web/src/routes/index.tsx` -- welcome message with user name + logout button |
| FR-9 (Auth users redirect from login/signup) | Covered | `beforeLoad` on both login and signup routes checks `getAuth()` and throws redirect to `/` if authenticated |
| FR-10 (Route protection) | Covered | `beforeLoad` on index route checks `getAuth()` and redirects to `/login` if unauthenticated |
| FR-11 (Redirect preservation) | Covered | `validateSearch` extracts `redirect` param; `onSuccess` navigates to it; Link to signup/login preserves the param via `search={{ redirect: redirectTo }}` |
| FR-12 (Public login/signup) | Covered | Login and signup routes are accessible without auth; `beforeLoad` only redirects authenticated users away |
| FR-13 (Session persistence) | Covered | Better Auth cookie-based sessions; `ConvexBetterAuthProvider` with `initialToken` for SSR hydration |
| FR-14 (useSession hook) | Covered | `authClient.useSession()` used in `IndexPage` for reactive auth state |
| FR-15 (Login error display) | Covered | `onError` callback sets error state; rendered as `<p role="alert">` above form |
| FR-16 (Signup error display) | Covered | Same pattern as login -- `onError` sets error, displayed inline |
| FR-17 (Client-side validation) | Covered | HTML5 `required` and `type="email"` attributes on form inputs |
| FR-18 (Loading/disabled state) | Covered | `isPending` state disables button and changes text ("Logging in..." / "Signing up...") |
| UX-1 (Centered card layout) | Covered | `min-h-screen items-center justify-center` flex container on all auth pages |
| UX-2 (ShadCN components) | Covered | Button, Card, Input, Label components created in `apps/web/src/components/ui/` |
| UX-3 (Login card contents) | Covered | Heading, email/password inputs with labels, submit button, signup link, error area |
| UX-4 (Signup card contents) | Covered | Heading, name/email/password inputs with labels, submit button, login link, error area |
| UX-5 (Main screen contents) | Covered | "Welcome, [Name]" heading + "Log Out" button |
| UX-6 (Tailwind CSS v4) | Covered | All styling uses Tailwind utility classes |
| UX-7 (Responsive) | Covered | `max-w-sm` card with `px-4` padding on container for small viewports |
| NFR-1 (Loading feedback) | Covered | Button loading state during auth operations |
| NFR-2 (Password security) | Covered | Better Auth handles hashing; HTTPS in production |
| NFR-3 (Integrity checks) | Covered | All checks pass (lint, type-check, build) |
| NFR-4 (Biome compliance) | Covered | Format check shows no changes needed |
| NFR-5 (SSR compatibility) | Covered | `createServerFn` for server-side auth checks; `beforeLoad` works for both SSR and CSR; `ConvexBetterAuthProvider` with `initialToken` |

## Test Coverage Assessment

- **Status**: adequate (for manual testing scope)
- **Gaps**: Automated tests are explicitly out of scope per requirements. The test plan covers all requirements through manual browser testing scenarios. Build verification tests all pass.

## Security Review

- **Password handling**: Passwords transmitted via Better Auth client API over HTTPS. No client-side storage of passwords. Password inputs use `type="password"` for masking. Proper `autoComplete` attributes (`current-password` for login, `new-password` for signup).
- **XSS protection**: React's JSX escaping prevents XSS in rendered content. Error messages from Better Auth are rendered as text nodes, not dangerouslySetInnerHTML.
- **Open redirect**: The `redirect` search parameter is not validated (see warnings #1 and #2 above). TanStack Router's `navigate()` mitigates this for external URLs since it operates on the internal route tree, but validation would be a defense-in-depth improvement.
- **CSRF**: Better Auth handles CSRF protection via its cookie-based session management.
- **Session management**: Sessions managed by Better Auth with HTTP-only cookies. No session tokens exposed in client-side JavaScript.

## Positive Observations

1. **Clean architecture adherence**: The implementation precisely follows the architecture document -- `beforeLoad` + `createServerFn` for route protection, `ConvexBetterAuthProvider` placement, `expectAuth: true` on ConvexQueryClient, and the shared `getAuth` server function exported from `__root.tsx`.

2. **Consistent patterns**: Login and signup pages follow identical structural patterns (validateSearch, beforeLoad, component layout, error handling, loading states), making the code predictable and maintainable.

3. **Good accessibility practices**: Labels are properly associated with inputs via `htmlFor`/`id`, error messages use `role="alert"`, form inputs have `autoComplete` hints, and the `biome-ignore` comment in Label component is well-justified.

4. **ShadCN components are standard**: The Button, Card, Input, and Label components match the latest ShadCN patterns, including CVA variants, forwardRef, cn() utility usage, and proper displayName assignments.

5. **ARCHITECTURE.md updated**: The root architecture document was appropriately updated to reflect the new auth routes, route protection strategy, and design decisions, keeping project documentation in sync.

6. **Redirect parameter preservation**: The redirect parameter flows correctly through the entire login/signup navigation cycle -- from the initial redirect to `/login?redirect=...`, through the Link to signup/login, and into the `onSuccess` navigation.
