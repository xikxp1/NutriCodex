# Plan: Implement Main Web Page View with App Shell Layout

## Subtask Breakdown

| # | ID | Title | Complexity | Dependencies | Description |
|---|-----|-------|------------|--------------|-------------|
| 1 | beads-20260206-203-sub-01 | Install dependencies and add foundational ShadCN UI components | medium | none | Add `lucide-react` and `@base-ui/react` to `apps/web`. Create the `useIsMobile` hook at `apps/web/src/hooks/use-mobile.ts`. Add the foundational ShadCN UI components that have no inter-dependencies: `skeleton.tsx`, `separator.tsx`, `tooltip.tsx`. Modify `button.tsx` to add the `icon-sm` size variant. These components are prerequisites for the more complex ShadCN components in sub-02. |
| 2 | beads-20260206-203-sub-02 | Add complex ShadCN UI components (Sheet, DropdownMenu, Avatar, Sidebar) | large | sub-01 | Create the remaining ShadCN UI components that depend on sub-01's components: `sheet.tsx` (depends on nothing new but is complex), `dropdown-menu.tsx` (Base UI menus), `avatar.tsx` (Base UI), and `sidebar.tsx` (depends on Button, Input, Separator, Sheet, Skeleton, Tooltip, and useIsMobile). The sidebar component is the largest single file with 22+ exported sub-components. |
| 3 | beads-20260206-203-sub-03 | Create layout route and migrate auth check | medium | sub-02 | Create the `_authenticated.tsx` layout route at `apps/web/src/routes/_authenticated.tsx` with the `beforeLoad` auth check (migrated from `index.tsx`). Wire up `SidebarProvider`, placeholder `Sidebar`, `SidebarInset`, and `<Outlet />`. Create the `_authenticated/` directory. Move and simplify `index.tsx` to `_authenticated/index.tsx` (remove auth check and sign-out button, keep as dashboard placeholder). Delete the old `routes/index.tsx`. Modify `__root.tsx` to add `TooltipProvider` wrapper. Update `globals.css` to add sidebar theme CSS custom properties. |
| 4 | beads-20260206-203-sub-04 | Build AppSidebar component with navigation and user footer | medium | sub-03 | Create `apps/web/src/components/layout/app-sidebar.tsx` composing ShadCN Sidebar sub-components: SidebarHeader with app logo/name, SidebarContent with placeholder navigation menu items (Dashboard, Food Log, Settings) using icons and tooltip support, SidebarFooter with user info display using Avatar and DropdownMenu for sign-out. Uses `authClient.useSession()` for user data. Wire `AppSidebar` into `_authenticated.tsx` replacing any placeholder sidebar. |
| 5 | beads-20260206-203-sub-05 | Build TopBar and UserMenu components | medium | sub-03 | Create `apps/web/src/components/layout/top-bar.tsx` with sticky positioning, SidebarTrigger on the left, a vertical Separator, and the UserMenu on the right. Create `apps/web/src/components/layout/user-menu.tsx` with avatar display showing user name/email from `authClient.useSession()`, and a DropdownMenu with sign-out action that calls `authClient.signOut()` and navigates to `/login`. Wire `TopBar` into `_authenticated.tsx` inside `SidebarInset`. |
| 6 | beads-20260206-203-sub-06 | Integration testing and polish | small | sub-04, sub-05 | Verify the complete app shell renders correctly: sidebar collapse/expand works with animation, cookie persistence functions, top bar stays sticky during scroll, user menu dropdown opens and sign-out works, auth redirect flows are preserved, SSR renders without errors. Run `bun run lint`, `bun run type-check`, and `bun run build` to ensure no regressions. Fix any styling inconsistencies or integration issues between the components. |

## Dependency Graph

```
sub-01 (Dependencies + Foundational UI)
  |
  v
sub-02 (Complex UI: Sheet, DropdownMenu, Avatar, Sidebar)
  |
  v
sub-03 (Layout Route + Auth Migration + CSS vars)
  |
  +--------+--------+
  |                 |
  v                 v
sub-04            sub-05
(AppSidebar)      (TopBar + UserMenu)
  |                 |
  +--------+--------+
           |
           v
         sub-06
     (Integration + Polish)
```

## Implementation Order

1. **sub-01**: Start with dependency installation and foundational ShadCN components. These are pure additions with no existing code changes, making them safe to land first. The `useIsMobile` hook and basic UI primitives (Skeleton, Separator, Tooltip) are required by everything else.

2. **sub-02**: Add the complex ShadCN components that build on the foundations. The sidebar component is the largest and depends on nearly every component from sub-01. Sheet, DropdownMenu, and Avatar are also needed by the layout components later.

3. **sub-03**: Create the routing structure. This is the most architecturally significant change -- introducing the `_authenticated` layout route, moving the existing `index.tsx`, and modifying `__root.tsx`. Must be done before the layout components because they need the layout route to be wired into.

4. **sub-04 and sub-05**: These two subtasks are independent of each other and can be developed in parallel. sub-04 builds the sidebar content (navigation items, user footer) while sub-05 builds the top bar and user menu. Both plug into the layout route created in sub-03.

5. **sub-06**: Final integration pass to ensure everything works together. Verify lint, type-check, and build all pass. Fix any styling or behavior issues discovered during integration.

## Branch
- Name: `beads/beads-20260206-203/app-shell-layout`
- Created from: `main`
