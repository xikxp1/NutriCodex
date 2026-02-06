# Requirements: Implement Main Web Page View with App Shell Layout

## Overview

Replace the current minimal "Welcome" main page with a full application shell layout for the NutriCodex web app. The app shell consists of three structural elements: a collapsible navigation sidebar on the left, a persistent (scroll-sticky) top bar spanning the top of the viewport, and a main content area. The top bar includes user profile/settings management on its right side. This layout wraps all authenticated routes, providing a consistent navigation and chrome experience. Navigation items and settings page content are deferred to future tasks; this task establishes the structural skeleton with placeholder content.

## Functional Requirements

- **FR-1**: A layout route shall be created for all authenticated pages, rendering the app shell (sidebar, top bar, content area) around the route's `<Outlet />`.
  - Acceptance criteria: All authenticated routes (currently just `/`) render inside the app shell layout. Unauthenticated routes (`/login`, `/signup`) remain unchanged and do not show the app shell.

- **FR-2**: The app shell layout shall include a navigation sidebar on the left side of the viewport.
  - Acceptance criteria: A sidebar element is visible on the left side when any authenticated route is loaded.

- **FR-3**: The navigation sidebar shall be collapsible, toggling between an expanded state and a collapsed (icon-only or narrow) state.
  - Acceptance criteria: A toggle control (button/icon) is present that switches the sidebar between expanded (showing labels/text) and collapsed (narrow, approximately 48-64px wide) states. The transition between states is animated (CSS transition on width).

- **FR-4**: The sidebar collapse state shall be persisted across page navigations within the same session.
  - Acceptance criteria: If the user collapses the sidebar and navigates to another authenticated route, the sidebar remains collapsed. State may be held in React context or local state; persistence across browser sessions (e.g., localStorage) is optional but preferred.

- **FR-5**: The expanded sidebar shall display placeholder navigation items (e.g., "Dashboard", "Food Log", "Settings") as non-functional labels or disabled links.
  - Acceptance criteria: At least 3 placeholder navigation items are visible in the expanded sidebar. They do not navigate anywhere (no functional routing). In collapsed state, items show only icons (or are hidden).

- **FR-6**: The app shell layout shall include a top bar that remains fixed at the top of the viewport during vertical scrolling.
  - Acceptance criteria: When the main content area has enough content to scroll, the top bar stays visible at the top of the viewport (CSS `sticky` or `fixed` positioning). The top bar spans the full width of the content area (to the right of the sidebar).

- **FR-7**: The top bar shall display the application name or logo on the left side.
  - Acceptance criteria: The text "NutriCodex" (or a simple logo placeholder) is visible on the left portion of the top bar.

- **FR-8**: The top bar shall include a user profile/settings area on its right side, showing the current user's name or avatar.
  - Acceptance criteria: The currently authenticated user's name (from `authClient.useSession()`) is displayed on the right side of the top bar. If the user has no name, the email is shown as a fallback.

- **FR-9**: The user profile area in the top bar shall include a dropdown menu triggered by clicking on the user's name/avatar.
  - Acceptance criteria: Clicking the user profile area opens a dropdown menu. The dropdown contains at least a "Sign Out" action item. Clicking "Sign Out" calls `authClient.signOut()` and redirects to `/login`.

- **FR-10**: The main content area shall occupy the remaining viewport space (right of sidebar, below top bar) and be independently scrollable.
  - Acceptance criteria: The main content area fills the available space. When content overflows vertically, the main area scrolls independently while the sidebar and top bar remain fixed.

- **FR-11**: The existing route protection logic in `index.tsx` (the `beforeLoad` auth check with redirect to `/login`) shall be preserved and continue to function correctly.
  - Acceptance criteria: Navigating to `/` without authentication redirects to `/login?redirect=/`. After login, the user is redirected back to `/`. The `getAuth` server function and `convexQueryClient.serverHttpClient?.setAuth(token)` calls continue to work.

- **FR-12**: The sidebar shall include the collapse toggle button in a consistent, discoverable location (e.g., bottom of sidebar or next to the app name in the top bar).
  - Acceptance criteria: The toggle button is clearly visible and uses an appropriate icon (e.g., chevron or hamburger icon). Its position does not shift when the sidebar collapses.

## Non-Functional Requirements

- **NFR-1**: All new components shall use ShadCN UI patterns (manual copy-paste components with CVA variants, Tailwind styling, `cn()` utility) consistent with the existing `apps/web/src/components/ui/` components.

- **NFR-2**: Styling shall use Tailwind CSS v4 utility classes and the existing ShadCN theme variables defined in `globals.css` (e.g., `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`).

- **NFR-3**: The layout must be SSR-compatible with TanStack Start. No `window`/`document` access during server rendering. State management for sidebar collapse should use React state or context, not browser-only APIs in render paths.

- **NFR-4**: The app shell shall render without layout shift or flash of unstyled content. The initial sidebar state (expanded or collapsed) should be deterministic on first render.

- **NFR-5**: Sidebar collapse/expand animation should be smooth (CSS `transition` on width/transform), completing within 200-300ms.

- **NFR-6**: The dropdown menu for user settings shall be accessible: keyboard-navigable, properly using ARIA attributes, and closable via Escape key.

- **NFR-7**: No new external dependencies should be added beyond what is necessary. Prefer native HTML elements and Tailwind styling. If a ShadCN component (e.g., DropdownMenu) requires Radix UI, that dependency may be added as it follows the established ShadCN pattern.

- **NFR-8**: The layout must not break or interfere with the existing `ConvexBetterAuthProvider` wrapping in `__root.tsx`.

## Scope Boundaries

The following items are explicitly **out of scope** for this task:

- **Navigation routing**: Sidebar items are placeholder labels only. No actual route navigation is implemented (routes for "Dashboard", "Food Log", etc. do not exist yet).
- **User settings page**: The dropdown may list "Settings" as a placeholder, but no settings page or form is created.
- **Mobile/tablet responsive design**: Focus is on desktop layout (viewport width >= 1024px). The layout does not need to adapt to narrow viewports or provide a mobile hamburger menu pattern. Basic usability at smaller sizes is acceptable but not a requirement.
- **Dark mode**: The current theme is light-only. No dark mode toggle or theme switching is included.
- **Notification system**: No notification bell or badge in the top bar.
- **Search functionality**: No search bar in the top bar.
- **Breadcrumbs**: No breadcrumb trail in the top bar or content area.
- **Backend changes**: No Convex schema, function, or HTTP route changes are needed.

## Assumptions

- The authenticated layout route will use TanStack Router's layout route mechanism (e.g., a `_authenticated.tsx` layout route or similar pattern) to wrap all routes that require the app shell.
- The `authClient.useSession()` hook provides `{ data: { user: { name, email, image } }, isPending }` and is available in any component rendered within `ConvexBetterAuthProvider`.
- Icons will use inline SVG or a lightweight icon approach (e.g., Lucide React, which is the standard ShadCN icon library). Adding `lucide-react` as a dependency is acceptable if not already present.
- The sidebar width in expanded state will be approximately 240-280px, and in collapsed state approximately 48-64px. Exact values are left to the architect/implementer.
- The top bar height will be approximately 48-64px, consistent with standard app shell patterns.
- The sign-out logic currently in `index.tsx` will be moved to the user dropdown in the top bar; the `index.tsx` page itself will become a simple content page (e.g., showing a dashboard placeholder or welcome message).

## Open Questions

(None -- all requirements have been inferred from the task description and existing codebase patterns.)
