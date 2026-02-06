# Requirements: Implement Auth (Web) -- Login, Signup, and Main Screen

## Overview

Implement user authentication for the NutriCodex web application (`apps/web`). Users must be able to create accounts via email/password, log in, and access a protected main screen that displays a welcome message with their name and a logout button. Unauthenticated users are redirected to the login page. The backend auth infrastructure (Better Auth with Convex adapter, auth proxy route, auth client/server utilities) is already scaffolded and ready to use -- this bead focuses on building the UI pages, wiring up auth flows, and adding route protection.

## Platform Scope

- **In scope**: Web application (`apps/web`) only
- **Out of scope**: Mobile application (`apps/mobile`) -- deferred to a follow-up bead

## Existing Infrastructure (Already Built)

The following components exist from the scaffolding bead and do NOT need to be created:

| Component | File | What It Does |
|-----------|------|--------------|
| Better Auth server config | `packages/backend/convex/auth.ts` | Creates Better Auth instance with email/password enabled, Convex adapter, no email verification required |
| Auth config | `packages/backend/convex/auth.config.ts` | Registers Better Auth as Convex auth provider |
| HTTP routes | `packages/backend/convex/http.ts` | Registers Better Auth routes on Convex HTTP router |
| Schema | `packages/backend/convex/schema.ts` | Empty app schema; Better Auth tables (user, session, account, verification) managed by the component |
| Web auth client | `apps/web/src/lib/auth-client.ts` | Better Auth React client with `convexClient()` plugin |
| Web auth server | `apps/web/src/lib/auth-server.ts` | Server-side auth helpers: `handler`, `getToken`, `fetchAuthQuery`, `fetchAuthMutation`, `fetchAuthAction` |
| Auth proxy route | `apps/web/src/routes/api/auth/-$.ts` | Catch-all API route proxying auth requests to Convex |
| Backend exports | `packages/backend/src/index.ts` | Re-exports `ConvexBetterAuthProvider`, Convex client utilities, typed API |
| Root layout | `apps/web/src/routes/__root.tsx` | Basic HTML shell with `<Outlet />` |
| Index page | `apps/web/src/routes/index.tsx` | Placeholder page showing "NutriCodex" heading |
| ShadCN UI directory | `apps/web/src/components/ui/` | Empty directory (`.gitkeep`) ready for ShadCN components |

## User Stories

1. **US-1: Sign Up** -- As a new user, I want to create an account with my name, email, and password so that I can use the application.
2. **US-2: Log In** -- As a returning user, I want to log in with my email and password so that I can access my data.
3. **US-3: View Main Screen** -- As an authenticated user, I want to see a welcome screen with my name so that I know I am logged in.
4. **US-4: Log Out** -- As an authenticated user, I want to log out so that my session is terminated.
5. **US-5: Route Protection** -- As an unauthenticated user, if I try to access a protected page, I should be redirected to the login page so that I can authenticate first.
6. **US-6: Return After Login** -- As a user who was redirected to login, after successful authentication I should be taken back to the page I originally tried to visit.

## Functional Requirements

### Authentication

- **FR-1**: The application shall support account creation (sign up) using email, password, and user name.
  - Acceptance criteria: A user can fill in name, email, and password fields on the signup page and successfully create an account. After signup, the user is authenticated and redirected to the main screen (or their originally requested page).

- **FR-2**: The application shall support login using email and password.
  - Acceptance criteria: A user can enter email and password on the login page and successfully authenticate. After login, the user is redirected to the main screen (or their originally requested page).

- **FR-3**: The application shall support logout.
  - Acceptance criteria: An authenticated user can click a logout button. After logout, the session is terminated and the user is redirected to the login page.

- **FR-4**: Password validation shall use Better Auth's default password policy.
  - Acceptance criteria: Password requirements are enforced by Better Auth server-side. The client does not implement custom password validation beyond what Better Auth provides.

- **FR-5**: Email verification is NOT required (already configured as `requireEmailVerification: false`).
  - Acceptance criteria: Users can sign up and immediately use the application without verifying their email.

### Pages and Routes

- **FR-6**: The application shall have a login page at route `/login`.
  - Acceptance criteria: Navigating to `/login` displays a centered card with email and password fields, a "Log In" button, and a link to the signup page.

- **FR-7**: The application shall have a signup page at route `/signup`.
  - Acceptance criteria: Navigating to `/signup` displays a centered card with name, email, and password fields, a "Sign Up" button, and a link to the login page.

- **FR-8**: The application shall have a main/home page at route `/` (the index route).
  - Acceptance criteria: The index page displays a welcome message including the authenticated user's name and a logout button.

- **FR-9**: Login and signup pages shall redirect already-authenticated users to the main screen.
  - Acceptance criteria: If an authenticated user navigates to `/login` or `/signup`, they are redirected to `/`.

### Route Protection

- **FR-10**: The main screen (and any future protected routes) shall require authentication.
  - Acceptance criteria: An unauthenticated user visiting `/` is redirected to `/login`.

- **FR-11**: The redirect to login shall preserve the originally requested URL.
  - Acceptance criteria: When redirecting to `/login`, the target URL is preserved (e.g., via a `redirect` query parameter). After successful login, the user is sent to that URL instead of the default home page.

- **FR-12**: The `/login` and `/signup` routes shall be publicly accessible (no auth required).
  - Acceptance criteria: Unauthenticated users can access `/login` and `/signup` without being redirected.

### Session Management

- **FR-13**: User sessions shall persist across page reloads and browser restarts (via cookies managed by Better Auth).
  - Acceptance criteria: After logging in and closing/reopening the browser, the user remains authenticated and can access the main screen without re-entering credentials.

- **FR-14**: The application shall use Better Auth's `useSession` hook (or equivalent) to determine authentication state on the client side.
  - Acceptance criteria: The auth state is available reactively; UI updates when the user logs in or out without a full page reload.

### Error Handling

- **FR-15**: The login page shall display an error message when authentication fails (invalid credentials).
  - Acceptance criteria: If a user enters incorrect email/password, an inline error message is displayed (e.g., "Invalid email or password"). The form is not cleared.

- **FR-16**: The signup page shall display an error message when account creation fails (e.g., email already in use).
  - Acceptance criteria: If a user tries to sign up with an email that is already registered, an inline error message is displayed (e.g., "An account with this email already exists").

- **FR-17**: Form fields shall show client-side validation errors for obviously invalid input.
  - Acceptance criteria: Empty required fields and obviously malformed emails (missing @) show validation errors before submission. This is basic HTML validation or minimal client-side checks, not exhaustive.

- **FR-18**: The login and signup buttons shall show a loading/disabled state during form submission.
  - Acceptance criteria: While the auth request is in progress, the submit button is disabled and shows a loading indicator to prevent double submission.

## UI/UX Requirements

- **UX-1**: Login and signup pages shall use a **centered card** layout -- a card component centered both vertically and horizontally on a clean background.

- **UX-2**: All form components (inputs, buttons, cards, labels) shall use **ShadCN UI** components from `apps/web/src/components/ui/`.

- **UX-3**: The login card shall contain:
  - A heading (e.g., "Log in to NutriCodex" or similar)
  - Email input field with label
  - Password input field with label
  - "Log In" submit button
  - A text link at the bottom: "Don't have an account? Sign up" linking to `/signup`
  - An area for inline error messages

- **UX-4**: The signup card shall contain:
  - A heading (e.g., "Create your account" or similar)
  - Name input field with label
  - Email input field with label
  - Password input field with label
  - "Sign Up" submit button
  - A text link at the bottom: "Already have an account? Log in" linking to `/login`
  - An area for inline error messages

- **UX-5**: The main screen shall contain:
  - A welcome message that includes the user's name (e.g., "Welcome, [Name]")
  - A logout button
  - This is a minimal placeholder; full dashboard content is out of scope

- **UX-6**: Styling shall use **Tailwind CSS v4** utility classes (already configured via Vite plugin).

- **UX-7**: The UI should be responsive and look good on desktop and mobile browser viewports, but native mobile app is out of scope.

## Non-Functional Requirements

- **NFR-1**: Auth operations (login, signup, logout) shall provide feedback within a reasonable time. No specific latency SLA is required, but the UI must show loading states so the user knows the operation is in progress (see FR-18).

- **NFR-2**: Passwords must be transmitted securely. Better Auth handles password hashing server-side; the web app communicates over HTTPS in production. No additional encryption is required at the application layer.

- **NFR-3**: The implementation must pass all integrity checks: `bun run lint`, `bun run type-check`, and `bun run build` must succeed with zero errors.

- **NFR-4**: All new code must follow Biome v2 formatting and linting rules (enforced by `bun run format` and `bun run lint`).

- **NFR-5**: The auth flow must work with server-side rendering (SSR) via TanStack Start. Route protection should work on both server and client navigation.

## Scope Boundaries (Out of Scope)

The following are explicitly NOT included in this bead:

- **Mobile auth**: No changes to `apps/mobile/`. Mobile auth will be a separate bead.
- **Social auth providers**: No Google, Apple, GitHub, or other OAuth providers. Email/password only.
- **Email verification**: Already disabled in the backend config. No verification flow.
- **Password reset / Forgot password**: Not implemented in this bead.
- **User profile editing**: No ability to change name, email, or password after account creation.
- **Remember me / session duration settings**: Use Better Auth defaults for session expiry.
- **Admin roles or permissions**: No role-based access control. All authenticated users have the same access.
- **Application-specific data or features**: The main screen is a placeholder. No nutrition tracking, food logging, or dashboard features.
- **Automated tests**: No unit, integration, or end-to-end tests for auth flows in this bead.
- **Custom email templates**: No styled emails (email verification is off, password reset is out of scope).

## Assumptions

1. The Convex backend is running and reachable (via `bun run dev:backend` or deployed).
2. Environment variables (`VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, `SITE_URL`) are properly configured.
3. ShadCN UI components will be added to `apps/web/src/components/ui/` as needed (the directory exists but is empty). The implementation phase will add required components (Button, Card, Input, Label, etc.).
4. Better Auth's default password policy is acceptable (no custom minimum length or complexity requirements).
5. The existing auth proxy route (`apps/web/src/routes/api/auth/-$.ts`) correctly proxies all Better Auth API calls. No modifications to the proxy should be needed.
6. `ConvexBetterAuthProvider` from `@nutricodex/backend` should be used in the root layout to provide auth context to the entire app.

## Open Questions

None -- all questions have been resolved.
