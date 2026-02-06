# Architecture: App Shell Layout (Sidebar + Top Bar)

## System Overview

This task introduces an authenticated layout route (`_authenticated.tsx`) that wraps all protected pages in an app shell. The app shell uses the **ShadCN Sidebar component** as its structural foundation, providing a collapsible sidebar, a sticky top bar (within `SidebarInset`), and a scrollable main content area.

```
+----------------------------------------------------------------+
|                         __root.tsx                              |
|  (ConvexBetterAuthProvider, HTML scaffold)                     |
+----------------------------------------------------------------+
         |                                    |
+--------v-----------+             +----------v---------+
| _authenticated.tsx |             | login.tsx,          |
| (layout route)     |             | signup.tsx          |
| [beforeLoad auth]  |             | (no app shell)      |
+--------------------+             +---------------------+
         |
+--------v------------------------------------------+
|  SidebarProvider (from ShadCN sidebar.tsx)         |
|  +----------+  +-------------------------------+  |
|  | Sidebar  |  | SidebarInset                  |  |
|  | (ShadCN) |  | +---------------------------+ |  |
|  | Header:  |  | | TopBar (sticky)           | |  |
|  |  Logo    |  | | [SidebarTrigger] [UserMenu]| |  |
|  | Content: |  | +---------------------------+ |  |
|  |  NavMenu |  | +---------------------------+ |  |
|  | Footer:  |  | | Main Content (scrollable) | |  |
|  |  User    |  | | <Outlet />                | |  |
|  +----------+  | +---------------------------+ |  |
|                 +-------------------------------+  |
+----------------------------------------------------+
         |
+--------v-----------+
| _authenticated/     |
|   index.tsx         |
|   (dashboard        |
|    placeholder)     |
+--------------------+
```

The ShadCN Sidebar component provides built-in support for:
- Collapsible states (`icon` mode collapses to icon-only width)
- Mobile responsive behavior (Sheet-based drawer on mobile via `useIsMobile` hook)
- Cookie-based state persistence (7-day expiry)
- Keyboard shortcut (Cmd/Ctrl+B) to toggle
- Tooltip display for menu items when collapsed
- Structured sub-components (SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, etc.)

## Component Design

### `_authenticated.tsx` (Layout Route)

- **Responsibility**: Pathless layout route that wraps all authenticated pages. Performs auth check in `beforeLoad` and renders the app shell layout around `<Outlet />`. The auth check currently in `index.tsx` moves here so all child routes are protected automatically.
- **Interface**: TanStack Router layout route with `beforeLoad` and `component`.
- **Dependencies**: `@tanstack/react-router` (`createFileRoute`, `Outlet`, `redirect`), `getAuth` from `__root.tsx`, `AppSidebar`, `TopBar`, ShadCN `SidebarProvider`, `SidebarInset`
- **Location**: `apps/web/src/routes/_authenticated.tsx`

### `AppSidebar` (Application Sidebar)

- **Responsibility**: Composes the ShadCN `Sidebar` component with application-specific content. Uses `collapsible="icon"` mode so the sidebar collapses to icon-only width. Contains three sections:
  - **SidebarHeader**: App logo/name ("NutriCodex") that truncates in collapsed state
  - **SidebarContent**: Navigation menu group with placeholder items (Dashboard, Food Log, Settings) using `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` with icons and tooltip support
  - **SidebarFooter**: User info with dropdown menu for sign-out (using `DropdownMenu` + `Avatar`)
- **Interface**:
  ```tsx
  function AppSidebar(props: React.ComponentProps<typeof Sidebar>): JSX.Element;
  ```
- **Dependencies**: ShadCN `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarRail`; ShadCN `DropdownMenu`; ShadCN `Avatar`; `lucide-react` icons; `authClient`
- **Location**: `apps/web/src/components/layout/app-sidebar.tsx`

### `TopBar` (Sticky Header)

- **Responsibility**: Sticky top bar rendered inside `SidebarInset`, spanning the width of the content area. Contains `SidebarTrigger` on the left (hamburger/panel icon that toggles the sidebar) and the `UserMenu` on the right.
- **Interface**:
  ```tsx
  function TopBar(): JSX.Element;
  ```
- **Dependencies**: ShadCN `SidebarTrigger`, `Separator`; `UserMenu`
- **Location**: `apps/web/src/components/layout/top-bar.tsx`

### `UserMenu` (Profile Dropdown)

- **Responsibility**: Displays the current user's name (or email fallback) with an avatar circle, and a dropdown menu with "Sign Out" action. Uses ShadCN `DropdownMenu` and `Avatar` components.
- **Interface**:
  ```tsx
  function UserMenu(): JSX.Element;
  ```
- **Dependencies**: `authClient.useSession()`, `authClient.signOut()`, `useNavigate`; ShadCN `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`; ShadCN `Avatar`, `AvatarFallback`, `AvatarImage`; `lucide-react` icons (`LogOut`, `ChevronsUpDown`)
- **Location**: `apps/web/src/components/layout/user-menu.tsx`

### ShadCN UI Components (New)

The following ShadCN components need to be added to `apps/web/src/components/ui/`:

#### `sidebar.tsx` (ShadCN Sidebar)
- **Responsibility**: The full ShadCN Sidebar component. Provides `SidebarProvider`, `Sidebar`, `SidebarTrigger`, `SidebarRail`, `SidebarInset`, `SidebarHeader`, `SidebarFooter`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarGroupAction`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`, `SidebarSeparator`, `SidebarInput`, `useSidebar`.
- **Dependencies**: `@base-ui/react` (`mergeProps`, `useRender`), `class-variance-authority`, ShadCN `Button`, `Input`, `Separator`, `Sheet`, `Skeleton`, `Tooltip`, `useIsMobile` hook
- **Location**: `apps/web/src/components/ui/sidebar.tsx`

#### `dropdown-menu.tsx` (ShadCN DropdownMenu)
- **Responsibility**: Accessible dropdown menu with keyboard navigation, ARIA attributes, and Escape-to-close. Base UI style.
- **Exports**: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuGroup`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`
- **Dependencies**: `@base-ui/react`, `cn` utility
- **Location**: `apps/web/src/components/ui/dropdown-menu.tsx`

#### `avatar.tsx` (ShadCN Avatar)
- **Responsibility**: Image element with fallback for representing the user. Used in the sidebar footer user area and the top bar user menu.
- **Exports**: `Avatar`, `AvatarImage`, `AvatarFallback`
- **Dependencies**: `@base-ui/react`, `class-variance-authority`, `cn` utility
- **Location**: `apps/web/src/components/ui/avatar.tsx`

#### `separator.tsx` (ShadCN Separator)
- **Responsibility**: Visual or semantic separator between content sections. Used by the sidebar component internally and in the top bar between the trigger and breadcrumb area.
- **Exports**: `Separator`
- **Dependencies**: `@base-ui/react`, `cn` utility
- **Location**: `apps/web/src/components/ui/separator.tsx`

#### `tooltip.tsx` (ShadCN Tooltip)
- **Responsibility**: Popup that displays information on hover/focus. Used by `SidebarMenuButton` to show nav item labels when the sidebar is in collapsed (icon) mode.
- **Exports**: `Tooltip`, `TooltipContent`, `TooltipTrigger`, `TooltipProvider`
- **Dependencies**: `@base-ui/react`, `cn` utility
- **Location**: `apps/web/src/components/ui/tooltip.tsx`
- **Note**: `TooltipProvider` must be added to the app's root layout (in `__root.tsx` or `_authenticated.tsx`)

#### `sheet.tsx` (ShadCN Sheet)
- **Responsibility**: Slide-in panel for the mobile sidebar. The ShadCN Sidebar uses Sheet internally when `isMobile` is true.
- **Exports**: `Sheet`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetTitle`, `SheetTrigger`, `SheetClose`
- **Dependencies**: `@base-ui/react`, `cn` utility
- **Location**: `apps/web/src/components/ui/sheet.tsx`

#### `skeleton.tsx` (ShadCN Skeleton)
- **Responsibility**: Placeholder loading indicator. Used by `SidebarMenuSkeleton` within the sidebar component.
- **Exports**: `Skeleton`
- **Dependencies**: `cn` utility (no external dependencies)
- **Location**: `apps/web/src/components/ui/skeleton.tsx`

### Hook: `useIsMobile`

- **Responsibility**: Detects whether the viewport is below the mobile breakpoint (768px). Used by `SidebarProvider` to switch between desktop sidebar and mobile sheet drawer.
- **Interface**: `function useIsMobile(): boolean`
- **Dependencies**: React (`useState`, `useEffect`)
- **Location**: `apps/web/src/hooks/use-mobile.ts`

### Updated `Button` Component

- **Responsibility**: The existing Button component needs an additional `icon-sm` size variant. The ShadCN `SidebarTrigger` uses `size="icon-sm"` on the Button. Add: `"icon-sm": "size-7"` to the `size` variants.
- **Location**: `apps/web/src/components/ui/button.tsx` (MODIFY existing)

### Updated `index.tsx` (Main Page)

- **Responsibility**: Simplified main page content (dashboard placeholder). The auth check `beforeLoad` is removed since `_authenticated.tsx` handles it. The sign-out button is removed since it moves to the sidebar footer / top bar `UserMenu`.
- **Interface**: Standard TanStack Router file route component.
- **Dependencies**: TanStack Router
- **Location**: `apps/web/src/routes/_authenticated/index.tsx` (moved from `apps/web/src/routes/index.tsx`)

## Data Model

No database or schema changes. This task is purely frontend structural.

## API Design

No new API endpoints. Existing auth APIs are consumed unchanged:
- `authClient.useSession()` provides `{ data: { user: { name, email, image } }, isPending }` for the `UserMenu` and sidebar footer.
- `authClient.signOut()` is called from the `UserMenu` dropdown.

## Technology Decisions

### New Dependencies

| Package | Purpose | Rationale |
|---------|---------|-----------|
| `lucide-react` | Icon library | Standard ShadCN icon library. Provides `PanelLeft` (sidebar trigger), `LayoutDashboard`, `UtensilsCrossed`, `Settings` (nav items), `LogOut`, `ChevronsUpDown` (user menu). Tree-shakeable. |
| `@base-ui/react` | Headless UI primitives | Required by all ShadCN components in the Base UI (base-nova) style: Sidebar (via `mergeProps`, `useRender`), DropdownMenu, Avatar, Separator, Tooltip, Sheet. Provides accessible primitives with keyboard navigation, focus management, and ARIA attributes. |

Both packages are added to `apps/web/package.json` only.

### ShadCN Components Added

| Component | Why Needed |
|-----------|-----------|
| `sidebar.tsx` | Core requirement -- the app shell sidebar. Provides 22+ composable sub-components. |
| `dropdown-menu.tsx` | User menu dropdown (sign-out action). Also used in sidebar header/footer patterns. |
| `avatar.tsx` | User avatar display in the sidebar footer and user menu. |
| `separator.tsx` | Required dependency of the sidebar component (`SidebarSeparator`). Also used in the top bar. |
| `tooltip.tsx` | Required dependency of the sidebar component. Shows nav item labels on hover when sidebar is collapsed. |
| `sheet.tsx` | Required dependency of the sidebar component. Mobile sidebar drawer. |
| `skeleton.tsx` | Required dependency of the sidebar component (`SidebarMenuSkeleton`). |

### Patterns

| Decision | Rationale |
|----------|-----------|
| ShadCN Sidebar component over custom sidebar | The ShadCN Sidebar provides a production-ready, composable sidebar with built-in mobile responsiveness (Sheet drawer), cookie persistence, keyboard shortcuts (Cmd/Ctrl+B), tooltip integration, and structured sub-components. Using it avoids reinventing these features and follows the project's ShadCN-first approach. |
| `collapsible="icon"` mode | Collapses the sidebar to icon-only width (3rem / 48px) rather than hiding it completely (`offcanvas`). This matches FR-3 (collapsed to narrow icon-only state) and FR-5 (collapsed items show only icons). |
| Cookie-based persistence (built into ShadCN Sidebar) | The ShadCN Sidebar persists state via a `sidebar_state` cookie with 7-day expiry. This is superior to localStorage for SSR -- the server can read the cookie and render the correct sidebar state, avoiding the flash described in NFR-4. Satisfies FR-4 (persistence across navigations and sessions). |
| `SidebarInset` for main content area | The ShadCN Sidebar pattern uses `SidebarInset` (a `<main>` element) as the content wrapper. The top bar and `<Outlet />` render inside it. This ensures proper layout coordination with the sidebar. |
| `TooltipProvider` in root or authenticated layout | Required by the ShadCN Tooltip component used inside `SidebarMenuButton`. Wraps the authenticated layout to enable tooltips on collapsed sidebar items. |
| ShadCN Avatar for user display | Provides image loading with fallback (initials), consistent styling, and size variants. Used in both the sidebar footer and the top bar user menu. |
| Pathless layout route `_authenticated` | TanStack Router convention. The underscore prefix creates a layout route with no URL segment. All child routes under `_authenticated/` are protected by its `beforeLoad` hook. |
| User info in SidebarFooter | Following the standard ShadCN sidebar pattern where the user profile/dropdown is placed in the `SidebarFooter`. The top bar also has a lightweight `UserMenu` trigger for quick access. |

## File Structure

```
apps/web/src/
|-- components/
|   |-- layout/                         # NEW directory
|   |   |-- app-sidebar.tsx             # NEW - app-specific sidebar composition
|   |   |-- top-bar.tsx                 # NEW - sticky top bar with trigger + user menu
|   |   `-- user-menu.tsx              # NEW - user profile dropdown with sign-out
|   `-- ui/
|       |-- avatar.tsx                  # NEW - ShadCN Avatar (base-ui)
|       |-- button.tsx                  # MODIFY - add icon-sm size variant
|       |-- card.tsx                    # EXISTING - unchanged
|       |-- dropdown-menu.tsx           # NEW - ShadCN DropdownMenu (base-ui)
|       |-- input.tsx                   # EXISTING - unchanged
|       |-- label.tsx                   # EXISTING - unchanged
|       |-- separator.tsx               # NEW - ShadCN Separator (base-ui)
|       |-- sheet.tsx                   # NEW - ShadCN Sheet (base-ui)
|       |-- sidebar.tsx                 # NEW - ShadCN Sidebar (base-ui)
|       |-- skeleton.tsx                # NEW - ShadCN Skeleton
|       `-- tooltip.tsx                 # NEW - ShadCN Tooltip (base-ui)
|-- hooks/
|   `-- use-mobile.ts                   # NEW - useIsMobile hook (ShadCN)
|-- routes/
|   |-- _authenticated.tsx              # NEW - layout route (auth check + app shell)
|   |-- _authenticated/
|   |   `-- index.tsx                   # NEW - moved from routes/index.tsx, simplified
|   |-- __root.tsx                      # MODIFY - add TooltipProvider wrapper
|   |-- api/
|   |   `-- auth/-$.ts                  # EXISTING - unchanged
|   |-- login.tsx                       # EXISTING - unchanged
|   `-- signup.tsx                      # EXISTING - unchanged
|-- lib/
|   |-- auth-client.ts                  # EXISTING - unchanged
|   |-- auth-server.ts                  # EXISTING - unchanged
|   `-- utils.ts                        # EXISTING - unchanged
`-- styles/
    `-- globals.css                      # MODIFY - add sidebar theme CSS variables
```

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/routes/_authenticated.tsx` | CREATE | Layout route with auth check, SidebarProvider + Sidebar + SidebarInset + TopBar |
| `apps/web/src/routes/_authenticated/index.tsx` | CREATE | Simplified main page (dashboard placeholder) |
| `apps/web/src/routes/index.tsx` | DELETE | Replaced by `_authenticated/index.tsx` |
| `apps/web/src/routes/__root.tsx` | MODIFY | Add `TooltipProvider` wrapper around `<Outlet />` |
| `apps/web/src/components/layout/app-sidebar.tsx` | CREATE | App-specific sidebar using ShadCN Sidebar sub-components |
| `apps/web/src/components/layout/top-bar.tsx` | CREATE | Sticky top bar with SidebarTrigger and UserMenu |
| `apps/web/src/components/layout/user-menu.tsx` | CREATE | User profile dropdown with sign-out |
| `apps/web/src/components/ui/sidebar.tsx` | CREATE | ShadCN Sidebar component (copy from registry) |
| `apps/web/src/components/ui/dropdown-menu.tsx` | CREATE | ShadCN DropdownMenu component (base-ui) |
| `apps/web/src/components/ui/avatar.tsx` | CREATE | ShadCN Avatar component (base-ui) |
| `apps/web/src/components/ui/separator.tsx` | CREATE | ShadCN Separator component (base-ui) |
| `apps/web/src/components/ui/tooltip.tsx` | CREATE | ShadCN Tooltip component (base-ui) |
| `apps/web/src/components/ui/sheet.tsx` | CREATE | ShadCN Sheet component (base-ui) |
| `apps/web/src/components/ui/skeleton.tsx` | CREATE | ShadCN Skeleton component |
| `apps/web/src/components/ui/button.tsx` | MODIFY | Add `"icon-sm": "size-7"` size variant |
| `apps/web/src/hooks/use-mobile.ts` | CREATE | useIsMobile hook (viewport detection) |
| `apps/web/src/styles/globals.css` | MODIFY | Add sidebar theme CSS custom properties |
| `apps/web/package.json` | MODIFY | Add `lucide-react` and `@base-ui/react` dependencies |

## Data Flow

### Auth Session Data Flow

```
__root.tsx beforeLoad
  |-- getAuth() -> token
  |-- context.convexQueryClient.serverHttpClient?.setAuth(token)
  |-- returns { token }
  v
_authenticated.tsx beforeLoad
  |-- getAuth() -> token
  |-- if (!token) -> redirect to /login
  |-- if (token) -> context.convexQueryClient.serverHttpClient?.setAuth(token)
  v
_authenticated.tsx component
  |-- SidebarProvider (ShadCN -- manages sidebar state + cookie persistence)
  |   |-- AppSidebar
  |   |   |-- SidebarHeader: App logo/name
  |   |   |-- SidebarContent: Navigation menu (placeholder items with icons + tooltips)
  |   |   |-- SidebarFooter: User info + DropdownMenu (sign-out)
  |   |   |   |-- authClient.useSession() -> { data: { user: { name, email } } }
  |   |   |   `-- authClient.signOut() -> navigate to /login
  |   |   `-- SidebarRail (visual edge toggle)
  |   |-- SidebarInset
  |   |   |-- TopBar
  |   |   |   |-- SidebarTrigger (toggle button)
  |   |   |   |-- Separator (vertical)
  |   |   |   `-- UserMenu (avatar + dropdown)
  |   |   `-- <Outlet /> -> _authenticated/index.tsx
```

### Sidebar State Flow (ShadCN Built-in)

```
SidebarProvider (ShadCN)
  |-- useState(defaultOpen=true)
  |-- useIsMobile() -> isMobile flag
  |-- Cookie read on server render (sidebar_state cookie)
  |-- Keyboard shortcut: Cmd/Ctrl+B -> toggleSidebar()
  |-- provides context: { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar }
  v
Sidebar (collapsible="icon")
  |-- Desktop: renders as fixed sidebar with data-state="expanded"/"collapsed"
  |-- Mobile: renders as Sheet (slide-in drawer)
  v
SidebarMenuButton (with tooltip prop)
  |-- When collapsed + desktop: shows Tooltip with nav item label
  |-- When expanded: shows icon + label text
  v
SidebarTrigger (in TopBar)
  |-- Calls toggleSidebar() on click
  |-- Renders PanelLeft icon
```

## SSR Considerations

1. **Cookie-based sidebar persistence**: The ShadCN Sidebar uses a `sidebar_state` cookie (7-day expiry). For full SSR support, the `defaultOpen` prop on `SidebarProvider` can be set from the server by reading the cookie in `beforeLoad`. This eliminates the flash-of-wrong-state issue that localStorage-based approaches have (NFR-4). If cookie reading on the server is deferred, the default is `open=true` which provides a deterministic initial render.

2. **`useIsMobile` hook**: This hook uses `window.matchMedia` inside a `useEffect`, so it is SSR-safe. On the server, `isMobile` defaults to `false`, meaning the desktop sidebar is rendered. No browser APIs are called during SSR.

3. **No `window`/`document` in render path**: The ShadCN Sidebar accesses `document.cookie` only inside a `useCallback` (the `setOpen` function), which is only called from event handlers, not during render. The keyboard shortcut listener is registered in a `useEffect`. This is SSR-safe.

4. **Auth check in `beforeLoad`**: The `_authenticated.tsx` layout route calls `getAuth()` (a `createServerFn`) in `beforeLoad`, which runs on the server during SSR. Same pattern as the existing `index.tsx`.

5. **`authClient.useSession()`**: This hook is client-only (relies on Better Auth's session polling). During SSR, it returns `isPending: true`. The `UserMenu` and sidebar footer should show a skeleton or abbreviated state while `isPending` is true. Since these are structural chrome, the loading state is acceptable.

6. **TooltipProvider**: Must wrap the app at a high level. Adding it in `__root.tsx` around the `<Outlet />` ensures tooltips work everywhere. `TooltipProvider` does not access browser APIs during render.

7. **`@base-ui/react` SSR**: Base UI components used in ShadCN (mergeProps, useRender) are SSR-compatible. They do not access browser globals during rendering.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ShadCN Sidebar `IconPlaceholder` reference in `SidebarTrigger` | High | Low | The registry source references `IconPlaceholder` which is a ShadCN site-specific component. When copying the sidebar component, replace the `SidebarTrigger` icon with a direct `lucide-react` import (`PanelLeft`). This is a standard adaptation when copying ShadCN components. |
| Button component needs `icon-sm` size variant | High | Low | The ShadCN `SidebarTrigger` uses `Button` with `size="icon-sm"`. The existing Button component only has `icon` (size-9). Add `"icon-sm": "size-7"` to the Button's size variants. This is a small, backwards-compatible change. |
| ShadCN component style (base-nova) may differ from existing components | Medium | Medium | Existing components (Button, Card, Input, Label) use the older ShadCN style with `forwardRef`. New components will use the base-nova style (named functions, `data-slot` attributes). This inconsistency is cosmetic -- both patterns work with React 19. The existing components can be migrated to the new style in a future task. |
| `@base-ui/react` package size | Low | Low | `@base-ui/react` is tree-shakeable. Only the primitives used by the imported ShadCN components are bundled. The package is maintained by the MUI team and designed for production use. |
| Cookie-based sidebar state may not be readable on server in TanStack Start | Medium | Low | If reading the `sidebar_state` cookie in `beforeLoad` is not straightforward in TanStack Start, the fallback is `defaultOpen=true` (same as what a localStorage approach would do). The visual impact is minimal -- a brief collapse animation if the user previously collapsed the sidebar. Can be improved later. |
| TanStack Router pathless layout route (`_authenticated.tsx`) file structure | Low | High | Verified in docs. The authenticated routes guide demonstrates this pattern. Child route at `_authenticated/index.tsx` maps to `/`. |
| Many new ShadCN components increase codebase surface area | Low | Low | All components are standard ShadCN copy-paste components. They are well-tested, follow consistent patterns, and are maintained by the ShadCN community. The sidebar alone requires Sheet, Tooltip, Separator, Skeleton as transitive dependencies -- this is expected for a production-quality sidebar. |
| Auth check duplication between `__root.tsx` and `_authenticated.tsx` | Low | Low | `__root.tsx` sets the Convex auth token for SSR data fetching. `_authenticated.tsx` specifically redirects unauthenticated users. Both serve different purposes. The `getAuth()` server function is idempotent and lightweight. |
