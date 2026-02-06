# Summary: Architecture - Web Auth Implementation

## Key Decisions

- **ShadCN UI components (manual copy-paste)**: Button, Card, Input, Label created directly in `apps/web/src/components/ui/` without CLI. Avoids Turborepo tooling issues and provides full control for 4 simple components.
- **Label as native HTML element**: No Radix dependency—use simple `<label>` instead of `@radix-ui/react-label` (minimal added functionality for auth forms).
- **Server-side auth checks via `beforeLoad`**: Use `createServerFn` wrapping `getToken()` to ensure auth validation works in both SSR and CSR navigation.
- **ConvexQueryClient with `expectAuth: true`**: Prevents unauthenticated Convex queries; auth token injected server-side in root layout.
- **Simple form state management**: React `useState` only—no form library. HTML5 validation (`required`, `type="email"`) sufficient for FR-17.
- **Redirect param preservation**: Public routes (login/signup) accept optional `?redirect=` search param; auth guard on index routes redirects to login with `?redirect=/` on failure.

## Technical Details

### Files to CREATE
- `apps/web/src/components/ui/button.tsx` — CVA-based variants (default, destructive, outline, secondary, ghost, link) + sizes
- `apps/web/src/components/ui/card.tsx` — Card + CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `apps/web/src/components/ui/input.tsx` — Styled input extending HTMLInputElement
- `apps/web/src/components/ui/label.tsx` — Native label with Tailwind classes, no Radix
- `apps/web/src/routes/login.tsx` — Public route with email/password form, `authClient.signIn.email()`, error display, loading state, link to signup
- `apps/web/src/routes/signup.tsx` — Public route with name/email/password form, `authClient.signUp.email()`, same patterns as login

### Files to MODIFY
- **`apps/web/src/routes/__root.tsx`**
  - Extend route context: `{ queryClient, convexQueryClient: ConvexQueryClient }`
  - Add `beforeLoad` calling server function (wrapped `getToken()`) → call `context.convexQueryClient.serverHttpClient?.setAuth(token)`
  - Wrap `<Outlet />` with `<ConvexBetterAuthProvider client={...} authClient={authClient} initialToken={token}>`

- **`apps/web/src/router.tsx`**
  - Add `{ expectAuth: true }` to `ConvexQueryClient` constructor
  - Include `convexQueryClient` in context object passed to `createTanStackRouter`

- **`apps/web/src/routes/index.tsx`**
  - Add `beforeLoad` with auth guard: call `getAuth()` → if no token, `throw redirect({ to: "/login", search: { redirect: location.href } })`
  - Component: Show "Welcome, [Name]" (from `authClient.useSession().data.user.name`)
  - Loading state: Show spinner while `isPending`
  - Logout button: `authClient.signOut()` → `onSuccess` navigates to `/login`

### Auth Flow Summary
1. **Signup**: Email/password form → `authClient.signUp.email()` → POST `/api/auth/sign-up/email` (proxy) → Convex HTTP → Better Auth creates user/session/account → Set-Cookie → redirect to search param (default `/`)
2. **Signin**: Email/password form → `authClient.signIn.email()` → POST `/api/auth/sign-in/email` (proxy) → Better Auth validates → Set-Cookie → redirect
3. **Logout**: Click button → `authClient.signOut()` → POST `/api/auth/sign-out` → Convex clears session → Clear-Cookie → navigate to `/login`
4. **Protected routes**: `beforeLoad` calls `getAuth()` (server function reading cookies) → if token, set on `convexQueryClient.serverHttpClient` for SSR queries; if null, redirect to `/login?redirect=<original_path>`

### Route Protection Pattern
- **Protected routes** (index): `beforeLoad` async → call `getAuth()` → if no token throw `redirect({ to: "/login", search: { redirect: location.href } })`
- **Public routes** (login/signup): No `beforeLoad` guard initially, but preferred approach is optional `beforeLoad` that redirects authenticated users to `/`
- **Redirect preservation**: `validateSearch: (search) => ({ redirect: (search.redirect as string) || "/" })`; on auth success, navigate to `redirect` param

### Data Model
No changes—uses existing Better Auth tables:
- `user`: `id`, `name`, `email` (display name on main screen)
- `session`: `id`, `token`, `expiresAt`, `userId`
- `account`: `userId`, `providerId`

### Better Auth Client API Used
- `authClient.signUp.email({ name, email, password })` → `{ data: { user, session } | null, error: { message } | null }`
- `authClient.signIn.email({ email, password })` → same response shape
- `authClient.signOut()` → clears session
- `authClient.useSession()` → `{ data: { user, session } | null, isPending, error, refetch }`

## Open Items & Risks

### Medium Risk
1. **SSR auth token flow**: Chain `beforeLoad` → `createServerFn` → `getToken()` → `serverHttpClient?.setAuth(token)` has multiple steps; silent failures could bypass auth. **Mitigation**: Test both SSR (full page load) and CSR (client nav) paths; `getToken()` returns `null` on failure (clear signal).

2. **Session state reactivity post-login**: After `signIn.email()` or `signUp.email()`, cookie is set but `useSession()` may not immediately refetch. **Mitigation**: Use `onSuccess` callback navigation instead of relying on hook reactivity; navigation triggers `beforeLoad` fresh validation.

3. **ConvexBetterAuthProvider placement**: Must wrap `<Outlet />` and receive `convexClient` from context correctly, or hooks fail. **Mitigation**: Follow exact Convex + Better Auth TanStack Start guide pattern.

### No New Dependencies
All required packages already present: `class-variance-authority`, `clsx`, `tailwind-merge`, `better-auth`, `@convex-dev/better-auth`, `@tanstack/react-router`, `@tanstack/react-start`. ShadCN components are source code, not npm packages.

### CSS & Theming
Existing `apps/web/src/styles/globals.css` already defines ShadCN-compatible CSS custom properties (`--color-primary`, `--color-card`, `--color-border`, etc.) in Tailwind v4 `@theme` block. No additional CSS config needed.

### Auto-Generated Files
`apps/web/src/routeTree.gen.ts` regenerates automatically when routes (login.tsx, signup.tsx) are added.
