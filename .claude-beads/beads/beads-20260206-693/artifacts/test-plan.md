# Test Plan: Implement Auth (Web) -- Login, Signup, Main Screen

## Test Strategy

- **Type**: Manual testing in browser
- **Framework**: None (automated tests are explicitly out of scope for this bead)
- **Environment**: Local development with Convex backend running
- **Browser**: Any modern browser (Chrome, Firefox, Safari)

## Prerequisites

Before running any tests, ensure the following are running and accessible:

1. **Convex backend**: `bun run dev:backend` is running and Convex dashboard is accessible
2. **Web dev server**: `bun run dev:web` is running and the app is accessible at `http://localhost:3000` (or whichever port TanStack Start uses)
3. **Environment variables**: `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, and `SITE_URL` are configured in the web app
4. **Clean state**: No pre-existing test user accounts (or use unique emails for each test run)
5. **Browser DevTools**: Have DevTools open to the Network and Console tabs to observe requests and errors

## Build Verification

These checks must pass before and after all implementation work. Run from the repository root.

| # | Command | Expected Result |
|---|---------|-----------------|
| BV-1 | `bun run lint` | Zero errors, zero warnings |
| BV-2 | `bun run type-check` | Zero errors |
| BV-3 | `bun run build` | Succeeds without errors |
| BV-4 | `bun run format` | No files changed (code is already formatted) |

## Test Cases by Subtask

### sub-01: ShadCN UI Components

These are presentational components. Verification is primarily through build checks and visual inspection when used by later subtasks.

| # | Test Step | Expected Result | Req |
|---|-----------|-----------------|-----|
| T-01-1 | Verify `apps/web/src/components/ui/button.tsx` exists | File exists and exports `Button` component and `buttonVariants` | UX-2 |
| T-01-2 | Verify `apps/web/src/components/ui/card.tsx` exists | File exists and exports `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | UX-2 |
| T-01-3 | Verify `apps/web/src/components/ui/input.tsx` exists | File exists and exports `Input` component | UX-2 |
| T-01-4 | Verify `apps/web/src/components/ui/label.tsx` exists | File exists and exports `Label` component | UX-2 |
| T-01-5 | Verify `.gitkeep` removed | `apps/web/src/components/ui/.gitkeep` no longer exists | -- |
| T-01-6 | Run `bun run type-check` | Passes with zero errors | NFR-3 |
| T-01-7 | Run `bun run lint` | Passes with zero errors | NFR-4 |

### sub-02: Router and Root Layout Auth Integration

| # | Test Step | Expected Result | Req |
|---|-----------|-----------------|-----|
| T-02-1 | Open `apps/web/src/router.tsx` and verify `ConvexQueryClient` is constructed with `{ expectAuth: true }` | Option is present | NFR-5 |
| T-02-2 | Open `apps/web/src/router.tsx` and verify `convexQueryClient` is passed in route context | Context includes `convexQueryClient` | NFR-5 |
| T-02-3 | Open `apps/web/src/routes/__root.tsx` and verify `beforeLoad` calls a server function that invokes `getToken()` | Server function is defined and called | FR-13, NFR-5 |
| T-02-4 | Open `apps/web/src/routes/__root.tsx` and verify `ConvexBetterAuthProvider` wraps `<Outlet />` | Provider is present with `client`, `authClient`, and `initialToken` props | FR-14 |
| T-02-5 | Start the dev server (`bun run dev:web`). Navigate to the app URL. | App loads without console errors related to Convex or auth provider | NFR-5 |
| T-02-6 | Run `bun run type-check` | Passes with zero errors | NFR-3 |
| T-02-7 | Run `bun run build` | Succeeds | NFR-3 |

### sub-03: Login Page

| # | Test Step | Expected Result | Req |
|---|-----------|-----------------|-----|
| T-03-1 | Navigate to `/login` in the browser | A centered card is displayed with a heading, email field, password field, "Log In" button, and a link to sign up | FR-6, UX-1, UX-3 |
| T-03-2 | Inspect the card visually | Card is centered both vertically and horizontally on a clean background | UX-1 |
| T-03-3 | Verify the heading text | Contains text like "Log in to NutriCodex" or similar | UX-3 |
| T-03-4 | Verify email input has a label | Label text like "Email" is visible and associated with the input | UX-3 |
| T-03-5 | Verify password input has a label | Label text like "Password" is visible and associated with the input | UX-3 |
| T-03-6 | Verify the submit button text | Button reads "Log In" or equivalent | UX-3 |
| T-03-7 | Click the "Sign up" link at the bottom | Navigates to `/signup` | UX-3 |
| T-03-8 | Try submitting the form with empty fields | Browser shows HTML5 validation errors (required fields). Form is NOT submitted. | FR-17 |
| T-03-9 | Enter an invalid email format (e.g., "notanemail") and submit | Browser shows HTML5 email validation error | FR-17 |
| T-03-10 | Enter a valid email and wrong password, click "Log In" | Button shows loading/disabled state during submission. After failure, an inline error message appears (e.g., "Invalid email or password"). Form fields are NOT cleared. | FR-2, FR-15, FR-18 |
| T-03-11 | Enter valid credentials for an existing account, click "Log In" | Button shows loading state. After success, user is redirected to `/` (main screen). | FR-2 |
| T-03-12 | Navigate to `/login?redirect=%2Fsomepage` | The login page loads normally. After logging in, user is redirected to the value of the redirect param. | FR-11 |
| T-03-13 | While already logged in, navigate to `/login` | User is redirected to `/` (main screen). The login form is NOT shown. | FR-9 |
| T-03-14 | Click the signup link when a redirect param is present (`/login?redirect=%2Ffoo`) | Navigation goes to `/signup?redirect=%2Ffoo` (redirect param is preserved) | FR-11 |
| T-03-15 | Resize the browser to a narrow width (mobile viewport) | Login card remains usable and well-formatted | UX-7 |

### sub-04: Signup Page

| # | Test Step | Expected Result | Req |
|---|-----------|-----------------|-----|
| T-04-1 | Navigate to `/signup` in the browser | A centered card is displayed with a heading, name field, email field, password field, "Sign Up" button, and a link to log in | FR-7, UX-1, UX-4 |
| T-04-2 | Inspect the card visually | Card is centered both vertically and horizontally on a clean background | UX-1 |
| T-04-3 | Verify the heading text | Contains text like "Create your account" or similar | UX-4 |
| T-04-4 | Verify name input has a label | Label text like "Name" is visible and associated with the input | UX-4 |
| T-04-5 | Verify email input has a label | Label text like "Email" is visible and associated with the input | UX-4 |
| T-04-6 | Verify password input has a label | Label text like "Password" is visible and associated with the input | UX-4 |
| T-04-7 | Verify the submit button text | Button reads "Sign Up" or equivalent | UX-4 |
| T-04-8 | Click the "Log in" link at the bottom | Navigates to `/login` | UX-4 |
| T-04-9 | Try submitting the form with empty fields | Browser shows HTML5 validation errors (required fields). Form is NOT submitted. | FR-17 |
| T-04-10 | Enter an invalid email format and submit | Browser shows HTML5 email validation error | FR-17 |
| T-04-11 | Fill in all fields with a new unique email, click "Sign Up" | Button shows loading/disabled state during submission. After success, user is redirected to `/` (main screen). | FR-1, FR-5, FR-18 |
| T-04-12 | Try signing up with an email that is already registered | Button shows loading state. After failure, an inline error message appears (e.g., "An account with this email already exists" or "User already exists"). Form fields are NOT cleared. | FR-16, FR-18 |
| T-04-13 | Navigate to `/signup?redirect=%2Fsomepage` | The signup page loads normally. After successful signup, user is redirected to the value of the redirect param. | FR-11 |
| T-04-14 | While already logged in, navigate to `/signup` | User is redirected to `/` (main screen). The signup form is NOT shown. | FR-9 |
| T-04-15 | Click the login link when a redirect param is present (`/signup?redirect=%2Ffoo`) | Navigation goes to `/login?redirect=%2Ffoo` (redirect param is preserved) | FR-11 |
| T-04-16 | Try signing up with a password shorter than 8 characters | Better Auth rejects the request. An error message is shown. | FR-4 |
| T-04-17 | Resize the browser to a narrow width (mobile viewport) | Signup card remains usable and well-formatted | UX-7 |

### sub-05: Main Screen with Auth Guard

| # | Test Step | Expected Result | Req |
|---|-----------|-----------------|-----|
| T-05-1 | While logged in, navigate to `/` | The main screen is displayed with a "Welcome, [Name]" message (using the name from signup) and a logout button | FR-8, UX-5 |
| T-05-2 | Verify the welcome message includes the user's actual name | The message shows the name provided during account creation | FR-8, UX-5 |
| T-05-3 | Verify a logout button is visible | A button labeled "Log Out" or "Logout" is present | UX-5 |
| T-05-4 | Click the logout button | The session is terminated and the user is redirected to `/login` | FR-3 |
| T-05-5 | After logout, try navigating to `/` via the browser URL bar | User is redirected to `/login` (they are no longer authenticated) | FR-10 |
| T-05-6 | While not logged in, navigate directly to `/` | User is redirected to `/login`. The URL should include a redirect parameter (e.g., `/login?redirect=%2F`). | FR-10, FR-11 |
| T-05-7 | After redirect from T-05-6, log in with valid credentials | After login, user is redirected back to `/` (the originally requested page) | FR-11, US-6 |
| T-05-8 | While logged in, refresh the page (F5 / Cmd+R) | The main screen reloads and the user remains authenticated. The welcome message is shown without requiring re-login. | FR-13 |
| T-05-9 | While the session is loading (briefly, on slow connections), observe the UI | A loading indicator or state is shown (not a blank or broken page) | FR-14 |

## Test Cases by Requirement

### Authentication Requirements

| Req | Test Cases | Description |
|-----|-----------|-------------|
| FR-1 | T-04-11 | Successful account creation with name, email, password |
| FR-2 | T-03-10, T-03-11 | Login with valid and invalid credentials |
| FR-3 | T-05-4, T-05-5 | Logout terminates session and redirects to login |
| FR-4 | T-04-16 | Better Auth default password policy is enforced |
| FR-5 | T-04-11 | User can use app immediately after signup without email verification |

### Route Requirements

| Req | Test Cases | Description |
|-----|-----------|-------------|
| FR-6 | T-03-1, T-03-2 | Login page exists at /login with correct layout |
| FR-7 | T-04-1, T-04-2 | Signup page exists at /signup with correct layout |
| FR-8 | T-05-1, T-05-2 | Main screen at / shows welcome message with user name |
| FR-9 | T-03-13, T-04-14 | Authenticated users are redirected away from login/signup |
| FR-10 | T-05-5, T-05-6 | Unauthenticated users are redirected to login from / |
| FR-11 | T-03-12, T-04-13, T-05-6, T-05-7, T-03-14, T-04-15 | Redirect URL is preserved and used after login/signup |
| FR-12 | T-03-1, T-04-1 | Login and signup are publicly accessible |

### Session Management Requirements

| Req | Test Cases | Description |
|-----|-----------|-------------|
| FR-13 | T-05-8 | Session persists across page reload |
| FR-14 | T-05-9 | useSession hook provides reactive auth state |

### Error Handling Requirements

| Req | Test Cases | Description |
|-----|-----------|-------------|
| FR-15 | T-03-10 | Login page shows error on invalid credentials |
| FR-16 | T-04-12 | Signup page shows error on duplicate email |
| FR-17 | T-03-8, T-03-9, T-04-9, T-04-10 | Client-side validation for empty/malformed fields |
| FR-18 | T-03-10, T-03-11, T-04-11, T-04-12 | Submit button shows loading/disabled state during submission |

### Non-Functional Requirements

| Req | Test Cases | Description |
|-----|-----------|-------------|
| NFR-1 | T-03-10, T-03-11, T-04-11 | UI shows loading state during auth operations |
| NFR-3 | BV-1, BV-2, BV-3 | lint, type-check, and build all pass |
| NFR-4 | BV-1, BV-4 | Code follows Biome formatting and linting rules |
| NFR-5 | T-02-5, T-05-8 | Auth works with SSR; route protection on server and client |

## Integration Test Scenarios

These end-to-end flows test the full auth lifecycle. Perform them in order.

### Scenario 1: Full Signup-to-Logout Flow

1. Open the app at `/` in a fresh browser (or incognito window)
2. **Verify**: You are redirected to `/login` (because you are not authenticated)
3. Click the "Sign up" link
4. **Verify**: You are on `/signup`
5. Fill in: Name = "Test User", Email = "test@example.com", Password = "password123"
6. Click "Sign Up"
7. **Verify**: Button shows loading state during submission
8. **Verify**: After success, you are redirected to `/`
9. **Verify**: Main screen shows "Welcome, Test User" and a logout button
10. Click the logout button
11. **Verify**: You are redirected to `/login`
12. **Verify**: Navigating to `/` redirects back to `/login`

### Scenario 2: Login with Existing Account

1. Open the app at `/login`
2. Enter email = "test@example.com", password = "password123" (from Scenario 1)
3. Click "Log In"
4. **Verify**: Redirected to `/` showing "Welcome, Test User"

### Scenario 3: Redirect Preservation

1. Clear cookies / open incognito window
2. Navigate directly to `/` (a protected route)
3. **Verify**: Redirected to `/login?redirect=%2F` (or similar encoding)
4. Log in with valid credentials
5. **Verify**: After login, returned to `/`

### Scenario 4: Redirect Preservation Across Signup Link

1. Navigate to `/login?redirect=%2Fsome-future-page`
2. Click the "Sign up" link
3. **Verify**: The URL is `/signup?redirect=%2Fsome-future-page`
4. Click the "Log in" link
5. **Verify**: The URL is `/login?redirect=%2Fsome-future-page`

### Scenario 5: Error Handling on Login

1. Navigate to `/login`
2. Enter email = "nonexistent@example.com", password = "wrongpassword"
3. Click "Log In"
4. **Verify**: An inline error message appears (e.g., "Invalid email or password")
5. **Verify**: The email and password fields still contain the entered values (form is not cleared)
6. **Verify**: The button is no longer in loading state after the error

### Scenario 6: Error Handling on Signup

1. Navigate to `/signup`
2. Enter name = "Duplicate", email = "test@example.com" (already registered), password = "password123"
3. Click "Sign Up"
4. **Verify**: An inline error message appears (e.g., "User already exists")
5. **Verify**: The form fields still contain the entered values

### Scenario 7: Session Persistence

1. Log in successfully
2. **Verify**: Main screen is shown
3. Press F5 / Cmd+R to reload the page
4. **Verify**: Still on main screen, still shows welcome message (session persists)
5. Close the browser tab
6. Open a new tab and navigate to the app
7. **Verify**: Still authenticated (session cookie persists)

### Scenario 8: Authenticated User Visiting Auth Pages

1. While logged in, navigate to `/login`
2. **Verify**: Immediately redirected to `/` (no login form flash)
3. While logged in, navigate to `/signup`
4. **Verify**: Immediately redirected to `/` (no signup form flash)

## Edge Cases

| # | Edge Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| E-1 | Empty password (if HTML5 validation is bypassed) | Use DevTools to remove `required` attribute, submit with empty password | Server returns an error, not a crash |
| E-2 | Very long name/email/password | Enter extremely long values (500+ chars) | Server handles gracefully; no UI breakage |
| E-3 | Special characters in name | Sign up with name containing special chars (e.g., "O'Brien", unicode) | Name is stored and displayed correctly |
| E-4 | Double-click submit button | Rapidly click the submit button twice | Only one request is sent (button disables on first click) |
| E-5 | Browser back button after login | Log in, then press browser back | Should not show login form (or should redirect back to /) |
| E-6 | Direct URL entry to / with expired session | Wait for session to expire (or manually clear cookies), then navigate to / | Redirected to /login |
| E-7 | XSS in redirect parameter | Navigate to `/login?redirect=javascript:alert(1)` | The redirect is NOT executed as JavaScript. User is sent to / or the redirect is rejected. |
| E-8 | Password field type | Inspect the password input element | `type="password"` is set (characters are masked) |

## Coverage Goals

### What is covered

- All 18 functional requirements (FR-1 through FR-18)
- All 6 user stories (US-1 through US-6)
- All UX requirements (UX-1 through UX-7)
- All non-functional requirements (NFR-1 through NFR-5)
- End-to-end auth lifecycle (signup, login, session persistence, logout)
- Error handling for invalid credentials and duplicate emails
- Client-side validation for required fields and email format
- Route protection for authenticated and unauthenticated paths
- Redirect parameter preservation across login/signup navigation
- Build integrity (lint, type-check, build)

### What is explicitly deferred

- **Automated unit/integration/e2e tests**: Out of scope per requirements ("Automated tests: No unit, integration, or end-to-end tests for auth flows in this bead")
- **Mobile app testing**: Out of scope (web only)
- **Social auth providers**: Not implemented
- **Password reset flow**: Not implemented
- **Email verification flow**: Disabled
- **Load/performance testing**: Not required
- **Accessibility testing (a11y)**: Not explicitly required, but basic label associations are covered by UX requirements
- **Cross-browser testing**: Not explicitly required beyond "modern browser"

## Running Tests

Since all tests are manual, there is no automated test command. Use the following workflow:

```bash
# 1. Start the backend
bun run dev:backend

# 2. Start the web dev server
bun run dev:web

# 3. Open the app in your browser at the URL shown by the dev server

# 4. Follow the test scenarios above in order

# 5. After all manual tests pass, verify build integrity:
bun run lint
bun run type-check
bun run build
```
