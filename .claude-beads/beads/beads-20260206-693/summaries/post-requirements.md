# Summary: Requirements (Web Auth Implementation)

## Key Decisions

- **Platform**: Web only (`apps/web`); mobile auth deferred to follow-up bead
- **Auth method**: Email/password only via Better Auth; no social auth or password reset
- **Email verification**: Disabled (users can sign up and immediately access app)
- **Session persistence**: Cookie-based, managed by Better Auth; persists across page reloads
- **Route protection**: Unauthenticated users redirected to `/login`; post-login redirect preserves original URL
- **UI framework**: ShadCN UI components with Tailwind v4 styling; centered card layout for auth pages
- **SSR compatible**: Route protection works on both server and client navigation via TanStack Start

## Scope Definition

### Must Build
- `/login` page (email, password, link to signup)
- `/signup` page (name, email, password, link to login)
- `/` main page (welcome message with user's name, logout button)
- Route protection middleware (redirect unauthenticated users to `/login`)
- Form error handling (invalid credentials, email already exists, client-side validation)
- Loading states on submit buttons during auth operations

### Already Built (Don't Reimplement)
- Better Auth server (`packages/backend/convex/auth.ts`)
- Auth HTTP routes on Convex (`packages/backend/convex/http.ts`)
- Web auth client (`apps/web/src/lib/auth-client.ts`)
- Auth proxy route (`apps/web/src/routes/api/auth/-$.ts`)
- Root layout with `ConvexBetterAuthProvider`

### Out of Scope
- Mobile app, social auth, password reset, email verification, profile editing, RBAC, automated tests
- Application data features (nutrition tracking, dashboards)

## Technical Details

**Pages to Create**:
- `apps/web/src/routes/login.tsx` — Login form + link to signup
- `apps/web/src/routes/signup.tsx` — Signup form + link to login
- `apps/web/src/routes/index.tsx` — Main screen (update placeholder)

**Auth Client API** (from `apps/web/src/lib/auth-client.ts`):
- `signUp(email, password, name)` — Create account
- `signIn(email, password)` — Authenticate
- `signOut()` — End session
- `useSession()` — React hook for auth state

**ShadCN Components Needed**: Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, FormControl (or equivalents)

**Environment variables** (must be configured): `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`, `SITE_URL`

## Open Items

None — requirements fully specified. All questions resolved. Ready for architecture/design phase.
