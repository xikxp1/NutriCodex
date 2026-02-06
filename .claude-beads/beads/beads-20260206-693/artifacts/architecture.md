# Architecture: Implement Auth (Web) -- Login, Signup, Main Screen

## Clarification Questions

None. Requirements are fully specified.

## System Overview

This task adds web authentication UI to the existing TanStack Start application. The backend infrastructure (Better Auth server, Convex adapter, auth proxy, auth client) is already built. This task focuses on:

1. **Three route pages**: `/login`, `/signup`, `/` (main screen)
2. **Route protection**: Server-side auth checks via `beforeLoad` with redirect to login
3. **ShadCN UI components**: Button, Card, Input, Label installed into `apps/web/src/components/ui/`
4. **Router/layout modifications**: Add `ConvexBetterAuthProvider` wrapping, add `convexQueryClient` to route context, add auth token handling for SSR

```
                         Browser
                           |
                    +------v------+
                    | TanStack    |
                    | Router      |
                    +------+------+
                           |
              +------------+------------+
              |            |            |
        +-----v-----+ +---v---+ +-----v------+
        | /login     | | /     | | /signup    |
        | (public)   | |(auth) | | (public)   |
        +-----+------+ +---+---+ +-----+------+
              |             |           |
              |     +-------v--------+  |
              |     | beforeLoad:    |  |
              |     | check session  |  |
              |     | via getToken() |  |
              |     +-------+--------+  |
              |             |           |
              +------+------+-----------+
                     |
              +------v------+
              | authClient   |
              | (Better Auth |
              |  React)      |
              +------+-------+
                     |
              +------v------+
              | Auth Proxy   |
              | /api/auth/*  |
              +------+-------+
                     |
              +------v------+
              | Convex HTTP  |
              | (Better Auth |
              |  server)     |
              +--------------+
```

## Component Design

### Root Layout (`apps/web/src/routes/__root.tsx`) -- MODIFY

- **Responsibility**: Wraps the entire app with `ConvexBetterAuthProvider` for auth context. Provides `convexQueryClient` in route context for SSR auth token injection.
- **Interface**: TanStack Router root route with `createRootRouteWithContext`. Provides `{ queryClient, convexQueryClient }` context. Uses `beforeLoad` to fetch auth token via server function and inject it into `convexQueryClient.serverHttpClient`.
- **Dependencies**: `@convex-dev/better-auth/react` (`ConvexBetterAuthProvider`), `~/lib/auth-client` (`authClient`), `~/lib/auth-server` (`getToken`), `@tanstack/react-start` (`createServerFn`)
- **Location**: `apps/web/src/routes/__root.tsx`

Key changes:
- Extend route context type to include `convexQueryClient: ConvexQueryClient`
- Add `beforeLoad` that calls a server function wrapping `getToken()`, then calls `ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)` to enable SSR-authenticated Convex queries
- Wrap `<Outlet />` with `<ConvexBetterAuthProvider client={...} authClient={authClient} initialToken={token}>` in the component, passing the convex client from context and the initial token

### Router (`apps/web/src/router.tsx`) -- MODIFY

- **Responsibility**: Creates the TanStack Router with Convex integration. Must be updated to pass `convexQueryClient` in context and to set `expectAuth: true` on the `ConvexQueryClient`.
- **Interface**: Exports `getRouter()` function
- **Dependencies**: `@convex-dev/react-query` (`ConvexQueryClient`), `@tanstack/react-query` (`QueryClient`), `@tanstack/react-router`, `convex/react`
- **Location**: `apps/web/src/router.tsx`

Key changes:
- Add `{ expectAuth: true }` option to `ConvexQueryClient` constructor to prevent unauthenticated Convex function calls on the client
- Add `convexQueryClient` to the context object passed to `createTanStackRouter` so `beforeLoad` functions can access it

### Login Page (`apps/web/src/routes/login.tsx`) -- CREATE

- **Responsibility**: Displays centered login card with email/password form. Handles sign-in via `authClient.signIn.email()`. Shows error messages on failure. Redirects authenticated users away. Redirects to original page after successful login.
- **Interface**: TanStack file route at `/login`. Accepts `redirect` search parameter (string, optional). Uses `validateSearch` to extract and type the redirect parameter.
- **Dependencies**: `~/lib/auth-client` (`authClient`), ShadCN UI components (`Button`, `Card*`, `Input`, `Label`), `@tanstack/react-router` (`Link`, `useNavigate`, `useSearch`)
- **Location**: `apps/web/src/routes/login.tsx`

Route configuration:
- `validateSearch`: Extracts `redirect` from search params (defaults to `/`)
- `beforeLoad`: (optional, for redirect if already authenticated -- see route protection strategy below)
- `component`: `LoginPage`

Component behavior:
- Form with email and password fields using controlled state (`useState`)
- On submit: call `authClient.signIn.email({ email, password })` with `fetchOptions.onSuccess` callback to navigate to `redirect` search param value
- Error display: capture `error` from the response or `onError` callback, display inline above the form fields
- Loading state: `isPending` state toggled during submission, disables button and shows loading indicator
- Link to `/signup` at bottom of card (preserves redirect param)

### Signup Page (`apps/web/src/routes/signup.tsx`) -- CREATE

- **Responsibility**: Displays centered signup card with name/email/password form. Handles account creation via `authClient.signUp.email()`. Shows error messages on failure. Redirects authenticated users away. Redirects to original page after successful signup.
- **Interface**: TanStack file route at `/signup`. Accepts `redirect` search parameter (string, optional). Uses `validateSearch` to extract the redirect parameter.
- **Dependencies**: `~/lib/auth-client` (`authClient`), ShadCN UI components, `@tanstack/react-router`
- **Location**: `apps/web/src/routes/signup.tsx`

Route configuration:
- `validateSearch`: Extracts `redirect` from search params (defaults to `/`)
- `component`: `SignupPage`

Component behavior:
- Form with name, email, and password fields using controlled state
- On submit: call `authClient.signUp.email({ name, email, password })` with `fetchOptions.onSuccess` to navigate to `redirect` param value
- Error display: capture error from response/callback, show inline
- Loading state: same pattern as login
- Link to `/login` at bottom of card (preserves redirect param)

### Main/Home Page (`apps/web/src/routes/index.tsx`) -- MODIFY

- **Responsibility**: Protected main screen showing welcome message with user's name and logout button.
- **Interface**: TanStack file route at `/`. Requires authentication (enforced by `beforeLoad` -- see route protection strategy).
- **Dependencies**: `~/lib/auth-client` (`authClient`), ShadCN UI `Button`, `@tanstack/react-router`
- **Location**: `apps/web/src/routes/index.tsx`

Route configuration:
- `beforeLoad`: Auth guard that checks session via server function, redirects to `/login?redirect=/` if unauthenticated

Component behavior:
- Uses `authClient.useSession()` to get current user data (`data.user.name`)
- Shows "Welcome, [Name]" heading
- Shows loading state while session is being fetched (`isPending`)
- Logout button calls `authClient.signOut()` with `fetchOptions.onSuccess` callback that navigates to `/login`

### ShadCN UI Components (`apps/web/src/components/ui/`) -- CREATE

Four ShadCN UI components need to be added. These are copy-paste components following the standard ShadCN pattern, using `class-variance-authority` (already in dependencies), `clsx`/`tailwind-merge` via the existing `cn()` utility.

#### Button (`apps/web/src/components/ui/button.tsx`)
- **Responsibility**: Styled button component with variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon)
- **Interface**: `ButtonProps` extending `React.ButtonHTMLAttributes<HTMLButtonElement>` with `variant`, `size`, `asChild` props. Exports `Button` component and `buttonVariants` CVA function.
- **Dependencies**: `class-variance-authority`, `~/lib/utils` (`cn`)
- **No external dependencies** (pure HTML button, no Radix needed)

#### Card (`apps/web/src/components/ui/card.tsx`)
- **Responsibility**: Card container with sub-components for structured content
- **Interface**: Exports `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` -- all are simple `div`/heading wrappers with Tailwind classes
- **Dependencies**: `~/lib/utils` (`cn`)
- **No external dependencies** (pure HTML elements)

#### Input (`apps/web/src/components/ui/input.tsx`)
- **Responsibility**: Styled text input component
- **Interface**: `InputProps` extending `React.InputHTMLAttributes<HTMLInputElement>`. Exports `Input` component.
- **Dependencies**: `~/lib/utils` (`cn`)
- **No external dependencies** (pure HTML input)

#### Label (`apps/web/src/components/ui/label.tsx`)
- **Responsibility**: Styled label component for form fields
- **Interface**: `LabelProps` extending `React.LabelHTMLAttributes<HTMLLabelElement>`. Exports `Label` component.
- **Dependencies**: `~/lib/utils` (`cn`)
- **No external dependencies** -- implement as a simple styled `<label>` element rather than using `@radix-ui/react-label`. The Radix Label primitive adds very little over a native label (just `onMouseDown` prevention of text selection), and avoiding it keeps the dependency tree simpler. For basic form labels, the native element is sufficient.

## Auth Flow Design

### Sign Up Flow

```
User fills form -> Submit
  -> authClient.signUp.email({ name, email, password })
    -> POST /api/auth/sign-up/email (web app auth proxy)
      -> POST <CONVEX_SITE_URL>/api/auth/sign-up/email (Convex HTTP)
        -> Better Auth creates user + account + session
        <- Set-Cookie: better-auth.session_token=...
      <- Proxied Set-Cookie
    <- { data: { user, session }, error: null }
  -> fetchOptions.onSuccess: navigate to redirect param or "/"
```

Error path: If email already exists, Better Auth returns an error. The `authClient.signUp.email()` call resolves with `{ data: null, error: { message: "..." } }`. The component captures this and displays it inline.

### Sign In Flow

```
User fills form -> Submit
  -> authClient.signIn.email({ email, password })
    -> POST /api/auth/sign-in/email (web app auth proxy)
      -> POST <CONVEX_SITE_URL>/api/auth/sign-in/email (Convex HTTP)
        -> Better Auth validates credentials, creates session
        <- Set-Cookie: better-auth.session_token=...
      <- Proxied Set-Cookie
    <- { data: { user, session }, error: null }
  -> fetchOptions.onSuccess: navigate to redirect param or "/"
```

Error path: Invalid credentials result in `{ data: null, error: { message: "Invalid email or password" } }`.

### Logout Flow

```
User clicks Logout
  -> authClient.signOut()
    -> POST /api/auth/sign-out (web app auth proxy)
      -> POST <CONVEX_SITE_URL>/api/auth/sign-out (Convex HTTP)
        -> Better Auth invalidates session
        <- Clear-Cookie
      <- Proxied Clear-Cookie
    <- success
  -> fetchOptions.onSuccess: navigate to "/login"
```

### Session Checking Flow (SSR)

```
Browser requests page -> TanStack Start SSR
  -> Route beforeLoad fires
    -> createServerFn calls getToken() from auth-server.ts
      -> Reads session cookie from request
      -> Validates with Convex/Better Auth
      <- Returns JWT token string (or null)
    -> If token exists:
      -> convexQueryClient.serverHttpClient?.setAuth(token)
      -> Return { isAuthenticated: true, token }
    -> If null:
      -> throw redirect({ to: "/login", search: { redirect: location.href } })
```

### Session Checking Flow (Client-side)

```
Component renders
  -> authClient.useSession()
    -> Returns { data: { user, session } | null, isPending, error }
    -> Reactively updates when session changes
  -> Component renders user info or loading state
```

## Route Protection Strategy

### Approach: `beforeLoad` with Server Function

Route protection uses TanStack Router's `beforeLoad` hook combined with a TanStack Start server function. This ensures auth checks work during both SSR (server navigation) and CSR (client-side navigation).

#### Server Function for Auth Check

A shared server function wraps `getToken()` from `auth-server.ts`:

```typescript
// In __root.tsx or a shared utility
const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});
```

This function runs on the server, reads the session cookie, validates it, and returns a JWT token (or `null`).

#### Protected Route Pattern (Index Page)

```typescript
// apps/web/src/routes/index.tsx
export const Route = createFileRoute("/")({
  beforeLoad: async ({ context, location }) => {
    const token = await getAuth();
    if (!token) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    // Optionally set auth on convexQueryClient for SSR queries
    context.convexQueryClient.serverHttpClient?.setAuth(token);
  },
  component: IndexPage,
});
```

#### Public Route Pattern (Login/Signup)

Login and signup pages do NOT use `beforeLoad` for auth guards. Instead, the component itself uses `authClient.useSession()` and, if the user is already authenticated, performs a client-side redirect. This is simpler and avoids SSR complexity on public pages.

Alternatively, a `beforeLoad` on login/signup can check auth and redirect authenticated users to `/`:

```typescript
// apps/web/src/routes/login.tsx
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/",
  }),
  beforeLoad: async () => {
    const token = await getAuth();
    if (token) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});
```

This approach is preferred because it handles the redirect during SSR, preventing a flash of the login form for authenticated users.

#### Redirect Flow with Query Parameter Preservation

1. Unauthenticated user visits `/` -> `beforeLoad` throws `redirect({ to: "/login", search: { redirect: "/" } })`
2. User sees `/login?redirect=%2F` in browser
3. Login form reads `redirect` via `useSearch()` from TanStack Router
4. After successful login, `onSuccess` callback calls `navigate({ to: redirectValue })`
5. The link to signup preserves the redirect: `<Link to="/signup" search={{ redirect }}>Sign up</Link>`
6. After successful signup, same redirect logic applies

### Scaling to Future Protected Routes

When more protected routes are added, a **layout route** pattern can be used. For now, with only one protected route (`/`), the `beforeLoad` is placed directly on the index route. The architecture supports migration to a layout route later:

```
routes/
  _authenticated/          # Layout route folder (future)
    _authenticated.tsx     # beforeLoad with auth guard
    index.tsx              # /
    dashboard.tsx          # /dashboard (future)
  login.tsx                # Public
  signup.tsx               # Public
```

This migration is straightforward and does not need to happen now.

## Data Model

No new data model changes. This task uses only the existing Better Auth managed tables:

| Table        | Fields Used                          | Purpose in This Task                |
|--------------|--------------------------------------|-------------------------------------|
| user         | `id`, `name`, `email`                | Display name on main screen         |
| session      | `id`, `token`, `expiresAt`, `userId` | Session validation, cookie auth     |
| account      | `userId`, `providerId`               | Links email/password to user        |

The `user.name` field is populated during signup and displayed on the main screen as "Welcome, [Name]".

### Session Data Shape (from `useSession()`)

```typescript
{
  data: {
    session: {
      id: string;
      token: string;
      expiresAt: Date;
      userId: string;
      // ... other Better Auth session fields
    };
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
  } | null;
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

## API Design

No new API endpoints are created. All auth operations use the existing Better Auth client API, which communicates through the existing auth proxy route.

### Better Auth Client Methods Used

#### `authClient.signUp.email(options)`

```typescript
const { data, error } = await authClient.signUp.email({
  name: string,
  email: string,
  password: string,  // min 8 characters (Better Auth default)
}, {
  onSuccess: (ctx) => void,
  onError: (ctx) => void,
});
```

- **Success**: `data` contains `{ user, session }`, `error` is `null`
- **Failure**: `data` is `null`, `error` contains `{ message: string }`
- Common errors: "User already exists" (email taken)

#### `authClient.signIn.email(options)`

```typescript
const { data, error } = await authClient.signIn.email({
  email: string,
  password: string,
}, {
  onSuccess: (ctx) => void,
  onError: (ctx) => void,
});
```

- **Success**: `data` contains `{ user, session }`, `error` is `null`
- **Failure**: `data` is `null`, `error` contains `{ message: string }`
- Common errors: "Invalid email or password"

#### `authClient.signOut(options?)`

```typescript
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => void,
  },
});
```

#### `authClient.useSession()`

```typescript
const { data, isPending, error } = authClient.useSession();
// data?.user.name -> user's display name
// isPending -> true while loading
```

### Error Handling Pattern

All auth operations follow a consistent error handling pattern:

```typescript
const [error, setError] = useState<string | null>(null);
const [isPending, setIsPending] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsPending(true);

  const { error } = await authClient.signIn.email(
    { email, password },
    {
      onSuccess: () => {
        navigate({ to: redirect });
      },
      onError: (ctx) => {
        setError(ctx.error.message);
        setIsPending(false);
      },
    },
  );

  if (error) {
    setError(error.message);
  }
  setIsPending(false);
};
```

## Technology Decisions

### 1. ShadCN UI Components (Manual Copy-Paste)

**Decision**: Manually create Button, Card, Input, and Label components in `apps/web/src/components/ui/` following the standard ShadCN patterns.

**Rationale**: The ShadCN CLI (`npx shadcn@latest add`) expects a `components.json` configuration file and may not work cleanly with the Turborepo + TanStack Start setup. Manual creation is reliable, gives full control, and is well-suited for the small number of components needed (4 files). The project already has all required utility dependencies (`class-variance-authority`, `clsx`, `tailwind-merge`, `cn()` helper).

### 2. Label Without Radix UI

**Decision**: Implement the Label component as a simple styled `<label>` element instead of using `@radix-ui/react-label` or the new unified `radix-ui` package.

**Rationale**: The Radix Label primitive adds minimal functionality over a native label (just preventing text selection on double-click). For basic form labels in an auth flow, the native element is sufficient. This avoids adding a new dependency. When more complex form components are needed later (Dialog, Select, etc.), Radix can be added at that point.

### 3. `expectAuth: true` on ConvexQueryClient

**Decision**: Set `expectAuth: true` when constructing `ConvexQueryClient` in the router.

**Rationale**: As recommended by the Convex + Better Auth documentation for TanStack Start, this prevents Convex functions from running on the client before authentication is established. It ensures queries wait for the auth token before executing, avoiding unauthorized access errors.

### 4. Server Function for Auth Checks in `beforeLoad`

**Decision**: Use `createServerFn` wrapping `getToken()` for server-side auth checks in route `beforeLoad` hooks.

**Rationale**: `getToken()` (from `convexBetterAuthReactStart`) must run on the server because it reads HTTP-only cookies from the request. TanStack Start's `createServerFn` ensures the function executes server-side during both SSR and client-side navigation (via RPC). This gives consistent auth behavior regardless of navigation type.

### 5. No `@tanstack/react-form` or Form Library

**Decision**: Use simple React controlled components (`useState`) for form state management. No form library.

**Rationale**: The auth forms are simple (2-3 fields each) with no complex validation, conditional fields, or dynamic behavior. Adding a form library would be over-engineering. HTML5 `required` and `type="email"` attributes provide the basic client-side validation required by FR-17.

### 6. CSS Variables for ShadCN Theme

**Decision**: Use the existing CSS custom properties in `globals.css` (already set up with oklch colors) that match ShadCN UI's expected variable naming convention.

**Rationale**: The existing `globals.css` already defines `--color-primary`, `--color-card`, `--color-border`, etc. in the Tailwind v4 `@theme` block. ShadCN components reference these via Tailwind classes like `bg-primary`, `text-card-foreground`, `border-border`, etc. No additional CSS configuration is needed.

## File Structure

### Files to CREATE

| File | Purpose |
|------|---------|
| `apps/web/src/components/ui/button.tsx` | ShadCN Button component with CVA variants |
| `apps/web/src/components/ui/card.tsx` | ShadCN Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `apps/web/src/components/ui/input.tsx` | ShadCN Input component |
| `apps/web/src/components/ui/label.tsx` | Styled Label component (native label, no Radix) |
| `apps/web/src/routes/login.tsx` | Login page route |
| `apps/web/src/routes/signup.tsx` | Signup page route |

### Files to MODIFY

| File | Changes |
|------|---------|
| `apps/web/src/routes/__root.tsx` | Add `ConvexBetterAuthProvider` wrapping, extend context type, add `beforeLoad` with server function for auth token, pass `initialToken` to provider |
| `apps/web/src/router.tsx` | Add `{ expectAuth: true }` to `ConvexQueryClient`, add `convexQueryClient` to route context |
| `apps/web/src/routes/index.tsx` | Replace placeholder with protected main screen (auth guard in `beforeLoad`, welcome message, logout button) |

### Files NOT Modified

| File | Reason |
|------|--------|
| `apps/web/src/routes/api/auth/-$.ts` | Already working auth proxy |
| `apps/web/src/lib/auth-client.ts` | Already configured Better Auth React client |
| `apps/web/src/lib/auth-server.ts` | Already exports `handler`, `getToken`, etc. |
| `apps/web/src/lib/utils.ts` | Already has `cn()` utility |
| `apps/web/src/styles/globals.css` | Already has ShadCN-compatible CSS variables |
| `packages/backend/**` | No backend changes needed |
| `apps/mobile/**` | Out of scope |

### Files Auto-Generated

| File | Generated By |
|------|-------------|
| `apps/web/src/routeTree.gen.ts` | TanStack Router (auto-generated when routes change) |

### Dependencies to Install

No new npm dependencies need to be installed. All required packages are already in `apps/web/package.json`:

- `class-variance-authority` -- for Button variants (already present)
- `clsx` + `tailwind-merge` -- for `cn()` utility (already present)
- `better-auth` -- for `authClient` methods (already present)
- `@convex-dev/better-auth` -- for `ConvexBetterAuthProvider` (already present)
- `@tanstack/react-router` -- for routing utilities (already present)
- `@tanstack/react-start` -- for `createServerFn` (already present)

The ShadCN components (Button, Card, Input, Label) are copy-pasted source code, not npm packages. No Radix UI dependency is needed for these four components.

### File to DELETE

| File | Reason |
|------|--------|
| `apps/web/src/components/ui/.gitkeep` | No longer needed once real component files exist in the directory |

## Risk Assessment

### Low Risk

1. **ShadCN component styling mismatch**: The `globals.css` already defines the correct CSS custom properties (`--color-primary`, `--color-card`, etc.) that ShadCN components expect. The Tailwind v4 `@theme` approach maps these to utility classes automatically. Risk is low because this was set up during scaffolding specifically for ShadCN compatibility.

2. **Better Auth API stability**: The project pins `better-auth` to exact version `1.4.9` and `@convex-dev/better-auth` to `^0.10.10`. The client API (`signUp.email`, `signIn.email`, `signOut`, `useSession`) is well-documented and stable at this version.

3. **TanStack Router file-based routing**: Adding new route files (`login.tsx`, `signup.tsx`) is straightforward and will be auto-detected by the TanStack Router code generator. The `routeTree.gen.ts` will be regenerated automatically.

### Medium Risk

4. **SSR auth token flow complexity**: The `beforeLoad` -> `createServerFn` -> `getToken()` -> `convexQueryClient.serverHttpClient?.setAuth(token)` chain involves multiple layers. If any step fails silently, auth checks may not work correctly during SSR. **Mitigation**: Test both SSR (full page load) and CSR (client-side navigation) paths. The `getToken()` function returns `null` on failure, which is a clear signal for the redirect logic.

5. **Session state reactivity after login/signup**: Better Auth's `useSession()` hook may not immediately reflect the new session after `signIn.email()` or `signUp.email()` completes, because the cookie is set but the hook's internal state hasn't refetched. **Mitigation**: Use navigation (via `onSuccess` callback) rather than relying on `useSession()` reactivity after auth operations. The navigation triggers a fresh `beforeLoad` which validates the session server-side.

6. **`ConvexBetterAuthProvider` placement in root layout**: This provider must wrap the `<Outlet />` and receive the `convexClient` from the `ConvexQueryClient` instance. Getting the provider hierarchy wrong could cause hooks to fail. **Mitigation**: Follow the exact pattern from the Convex + Better Auth TanStack Start guide, where the provider is placed inside the `RootComponent` function using `useRouteContext` to access the convex client.

### Low-to-No Risk

7. **Build/lint/type-check compliance**: All new code will use Biome formatting conventions. ShadCN components are standard React/TypeScript. No exotic patterns are introduced. The `routeTree.gen.ts` is excluded from linting by the existing Biome configuration.
