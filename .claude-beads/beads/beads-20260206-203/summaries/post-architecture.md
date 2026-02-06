# Summary: App Shell Layout (Sidebar + Top Bar)

## Key Decisions

- **ShadCN Sidebar as core layout**: Uses `collapsible="icon"` mode (collapses to 48px icon-only width) with built-in mobile responsiveness via Sheet drawer, cookie-based persistence (7-day `sidebar_state` cookie), keyboard shortcut (Cmd/Ctrl+B), and tooltip support for collapsed items.
- **Pathless layout route `_authenticated.tsx`**: Wraps all protected pages, performs auth check in `beforeLoad`, renders app shell around `<Outlet />`. Child routes live in `_authenticated/` directory.
- **Three-part shell composition**: SidebarProvider > (Sidebar + SidebarInset) > (TopBar + main content). Sidebar has header (logo), content (nav menu), footer (user profile dropdown). TopBar has SidebarTrigger (left) and UserMenu (right).
- **Cookie-based sidebar persistence**: SSR-safe — server renders correct state by reading `sidebar_state` cookie. Eliminates localStorage flash-of-wrong-state issue.
- **Base UI style for new ShadCN components**: Sidebar, DropdownMenu, Avatar, Separator, Tooltip, Sheet, Skeleton use newer base-nova style (named functions, `data-slot` attributes) vs. existing components (forwardRef). Cosmetic inconsistency, both patterns work with React 19.

## Technical Details

**New Files & Locations:**
- `apps/web/src/routes/_authenticated.tsx` — Layout route (auth check, SidebarProvider, renders app shell)
- `apps/web/src/routes/_authenticated/index.tsx` — Main page (moved from `routes/index.tsx`)
- `apps/web/src/components/layout/app-sidebar.tsx` — Sidebar composition (SidebarHeader, SidebarContent with nav menu, SidebarFooter with user dropdown)
- `apps/web/src/components/layout/top-bar.tsx` — Sticky top bar (SidebarTrigger, Separator, UserMenu)
- `apps/web/src/components/layout/user-menu.tsx` — User profile dropdown (authClient.useSession, authClient.signOut)
- `apps/web/src/hooks/use-mobile.ts` — useIsMobile hook (viewport <768px detection, SSR-safe with useEffect)
- **ShadCN UI components** (base-ui style): `sidebar.tsx`, `dropdown-menu.tsx`, `avatar.tsx`, `separator.tsx`, `tooltip.tsx`, `sheet.tsx`, `skeleton.tsx`

**Modifications:**
- `apps/web/src/routes/__root.tsx` — Wrap `<Outlet />` with `TooltipProvider`
- `apps/web/src/components/ui/button.tsx` — Add `"icon-sm": "size-7"` size variant (for SidebarTrigger)
- `apps/web/src/styles/globals.css` — Add sidebar theme CSS custom properties
- `apps/web/package.json` — Add `lucide-react` (icons) and `@base-ui/react` (headless primitives)

**Data Flow:**
- `__root.tsx beforeLoad` → get token, set Convex auth
- `_authenticated.tsx beforeLoad` → get token, redirect to /login if missing, set Convex auth
- AppSidebar footer & TopBar UserMenu → `authClient.useSession()` → user name/email/image
- UserMenu dropdown → `authClient.signOut()` → navigate to /login

**Sidebar Navigation Items (Placeholder):**
- Dashboard (`LayoutDashboard` icon)
- Food Log (`UtensilsCrossed` icon)
- Settings (`Settings` icon)
- All use `SidebarMenuButton` with tooltip on collapsed state

## Open Items

- **Icon substitution**: ShadCN registry `SidebarTrigger` references `IconPlaceholder` (site-specific). Must replace with `lucide-react` `PanelLeft` icon during copy.
- **Server-side cookie reading**: If reading `sidebar_state` cookie in `beforeLoad` is difficult in TanStack Start, fallback to `defaultOpen=true`. Minimal visual impact.
- **Component style migration**: Existing UI components (Button, Card, Input, Label) use forwardRef style. New components use base-nova style. Plan future migration for consistency.
- **UserMenu loading state**: `authClient.useSession()` is client-only, returns `isPending: true` during SSR. Consider skeleton/abbreviated state for UserMenu during hydration.
