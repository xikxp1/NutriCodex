# Test Plan: Implement Main Web Page View with App Shell Layout

## Test Strategy

- **Framework**: Vitest 4.x + React Testing Library + jsdom
- **Test types**: Unit tests (component exports, rendering), integration tests (composed layout), manual verification (auth flows, SSR, visual behavior)
- **Run command**: `cd apps/web && bun run test` (or `bunx vitest run`)
- **Watch mode**: `cd apps/web && bun run test:watch`

### Test Infrastructure Setup

The following must be added by the Developer before tests can run:

1. **Dev dependencies** (already added to `apps/web/package.json`):
   - `vitest` (^4.0.18)
   - `@testing-library/react` (^16.3.2)
   - `@testing-library/jest-dom` (^6.9.1)
   - `@testing-library/user-event` (^14.6.1)
   - `jsdom` (^28.0.0)

2. **Vitest config** at `apps/web/vitest.config.ts` -- already created by test engineer.

3. **Test setup file** at `apps/web/src/__tests__/setup.ts` -- already created.

4. **Scripts** in `apps/web/package.json`:
   - `"test": "vitest run"`
   - `"test:watch": "vitest"`

## Test Matrix

| Requirement | Subtask | Test File | Test Description |
|-------------|---------|-----------|-----------------|
| NFR-1 (cn utility) | pre-existing | `src/__tests__/lib/utils.test.ts` | Validates cn() class merging works correctly |
| Architecture (Skeleton) | sub-01 | `src/__tests__/components/ui/skeleton.test.tsx` | Skeleton renders with animate-pulse, accepts className |
| Architecture (Separator) | sub-01 | `src/__tests__/components/ui/separator.test.tsx` | Separator renders horizontal/vertical, accepts className |
| Architecture (Button icon-sm) | sub-01 | `src/__tests__/components/ui/button-icon-sm.test.tsx` | Button size="icon-sm" produces size-7 class |
| Architecture (useIsMobile) | sub-01 | `src/__tests__/hooks/use-mobile.test.ts` | Hook returns true/false based on 768px breakpoint, responds to changes |
| Architecture (Tooltip) | sub-01 | `src/__tests__/components/ui/tooltip-exports.test.tsx` | Exports Tooltip, TooltipTrigger, TooltipContent, TooltipProvider |
| Architecture (Sheet) | sub-02 | `src/__tests__/components/ui/sheet-exports.test.tsx` | Exports Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose |
| Architecture (DropdownMenu) | sub-02 | `src/__tests__/components/ui/dropdown-menu-exports.test.tsx` | Exports all DropdownMenu sub-components |
| FR-8 (Avatar) | sub-02 | `src/__tests__/components/ui/avatar.test.tsx` | Avatar renders, shows fallback initials, accepts className |
| FR-2,3,4,5 (Sidebar) | sub-02 | `src/__tests__/components/ui/sidebar-exports.test.tsx` | Exports 22+ sub-components including SidebarProvider, useSidebar |
| FR-1,11 (Layout route) | sub-03 | `src/__tests__/routes/authenticated-layout.test.tsx` | Route module exports, CSS variable documentation |
| FR-2,5,7,8,12 (AppSidebar) | sub-04 | `src/__tests__/components/layout/app-sidebar.test.tsx` | NutriCodex name, 3 nav items, user name/email fallback |
| FR-6,7,12 (TopBar) | sub-05 | `src/__tests__/components/layout/top-bar.test.tsx` | Sticky header, sidebar trigger button, separator |
| FR-8,9 (UserMenu) | sub-05 | `src/__tests__/components/layout/user-menu.test.tsx` | User name display, email fallback, dropdown with Sign Out, loading state |
| FR-1,2,3,5,7,8,10,12 (Integration) | sub-06 | `src/__tests__/integration/app-shell.test.tsx` | Full composed layout, sidebar toggle, expanded state, content area |

## Coverage Goals

### Covered by Automated Tests

- **Component exports**: Every new ShadCN component module is verified to export its required sub-components (sidebar: 15+ exports, dropdown-menu: 7 exports, avatar: 3 exports, etc.)
- **Skeleton rendering**: Animate-pulse class, rounded styling, custom className, HTML attribute forwarding
- **Separator rendering**: Horizontal/vertical orientation, custom className, border styling
- **Button icon-sm variant**: New size-7 class, backward compatibility with existing sizes
- **useIsMobile hook**: 768px breakpoint detection, viewport change response, event listener cleanup, matchMedia query format
- **cn() utility**: Class merging, Tailwind conflict resolution, conditional classes, edge cases
- **AppSidebar content**: NutriCodex branding, 3 placeholder nav items, user name display with email fallback, non-functional placeholder links
- **TopBar structure**: Sticky positioning, sidebar trigger button presence, separator element
- **UserMenu interaction**: User name display, email fallback, trigger click, dropdown Sign Out item, loading state, avatar presence
- **Full integration**: Composed layout renders sidebar + top bar + content, toggle button presence, expanded state default, user info visibility

### Covered by Manual Verification

The following items require the full application running with Convex backend, Better Auth, and browser interaction. They cannot be reliably tested in jsdom.

| Item | Requirement | How to Verify |
|------|-------------|---------------|
| Auth redirect on unauthenticated access | FR-11 | Navigate to `/` without session -> redirected to `/login?redirect=/` |
| Post-login redirect | FR-11 | Login from `/login?redirect=/` -> redirected to `/` |
| Sidebar collapse/expand animation | FR-3, NFR-5 | Click toggle -> sidebar animates between 240-280px and 48-64px in 200-300ms |
| Cookie persistence across navigations | FR-4 | Collapse sidebar -> navigate -> sidebar remains collapsed. Check `sidebar_state` cookie (7-day expiry) |
| Cookie persistence across sessions | FR-4 | Collapse sidebar -> close browser -> reopen -> sidebar remains collapsed |
| Keyboard shortcut toggle | Architecture | Press Cmd/Ctrl+B -> sidebar toggles |
| Tooltip on collapsed sidebar items | Architecture | Collapse sidebar -> hover nav icon -> tooltip shows label |
| Scrollable main content with sticky top bar | FR-6, FR-10 | Add tall content -> scroll -> top bar stays fixed, sidebar stays fixed, content scrolls independently |
| Sign Out flow | FR-9 | Click user menu -> Sign Out -> session cleared, redirected to `/login` |
| SSR rendering | NFR-3, NFR-4 | View page source -> app shell HTML present, no hydration errors in console |
| No layout shift on load | NFR-4 | Hard refresh -> sidebar renders in correct state (no flash/jump) |
| Login/signup pages unaffected | FR-1 | Navigate to `/login` and `/signup` -> no sidebar or top bar visible |
| Accessible dropdown | NFR-6 | Tab into user menu -> Enter to open -> Arrow keys navigate -> Escape closes |
| Mobile sheet drawer | Architecture | Resize to < 768px -> sidebar becomes sheet drawer triggered by hamburger |
| ConvexBetterAuthProvider integration | NFR-8 | All auth hooks continue working within the new layout |

### Explicitly Deferred

- **E2E tests**: No Playwright/Cypress setup exists. Full auth flow testing requires browser automation against a running backend. Recommended for a future task.
- **Visual regression tests**: No screenshot comparison tooling. Layout/styling correctness is verified manually.
- **Performance benchmarks**: Animation timing (NFR-5: 200-300ms) is verified by visual inspection, not automated measurement.
- **Mobile responsive behavior**: Scope boundaries explicitly exclude mobile/tablet responsive design beyond basic usability.

## Running Tests

### All tests
```bash
cd apps/web && bun run test
```

### Watch mode
```bash
cd apps/web && bun run test:watch
```

### Per-subtask filtering

```bash
# sub-01: Foundational components
cd apps/web && bunx vitest run src/__tests__/components/ui/skeleton.test.tsx src/__tests__/components/ui/separator.test.tsx src/__tests__/components/ui/button-icon-sm.test.tsx src/__tests__/components/ui/tooltip-exports.test.tsx src/__tests__/hooks/use-mobile.test.ts

# sub-02: Complex ShadCN components
cd apps/web && bunx vitest run src/__tests__/components/ui/sheet-exports.test.tsx src/__tests__/components/ui/dropdown-menu-exports.test.tsx src/__tests__/components/ui/avatar.test.tsx src/__tests__/components/ui/sidebar-exports.test.tsx

# sub-03: Layout route
cd apps/web && bunx vitest run src/__tests__/routes/

# sub-04: AppSidebar
cd apps/web && bunx vitest run src/__tests__/components/layout/app-sidebar.test.tsx

# sub-05: TopBar + UserMenu
cd apps/web && bunx vitest run src/__tests__/components/layout/top-bar.test.tsx src/__tests__/components/layout/user-menu.test.tsx

# sub-06: Integration
cd apps/web && bunx vitest run src/__tests__/integration/

# Utility baseline (can run anytime)
cd apps/web && bunx vitest run src/__tests__/lib/utils.test.ts
```

## Test File Inventory

```
apps/web/
|-- vitest.config.ts                                          # Vitest configuration
|-- src/
    |-- __tests__/
        |-- setup.ts                                          # Test setup (jest-dom matchers)
        |-- lib/
        |   `-- utils.test.ts                                 # cn() utility tests
        |-- hooks/
        |   `-- use-mobile.test.ts                            # useIsMobile hook tests
        |-- components/
        |   |-- ui/
        |   |   |-- skeleton.test.tsx                         # Skeleton component tests
        |   |   |-- separator.test.tsx                        # Separator component tests
        |   |   |-- button-icon-sm.test.tsx                   # Button icon-sm variant tests
        |   |   |-- tooltip-exports.test.tsx                  # Tooltip export verification
        |   |   |-- sheet-exports.test.tsx                    # Sheet export verification
        |   |   |-- dropdown-menu-exports.test.tsx            # DropdownMenu export verification
        |   |   |-- avatar.test.tsx                           # Avatar component tests
        |   |   `-- sidebar-exports.test.tsx                  # Sidebar export verification
        |   `-- layout/
        |       |-- app-sidebar.test.tsx                      # AppSidebar component tests
        |       |-- top-bar.test.tsx                          # TopBar component tests
        |       `-- user-menu.test.tsx                        # UserMenu component tests
        |-- routes/
        |   `-- authenticated-layout.test.tsx                 # Layout route module tests
        `-- integration/
            `-- app-shell.test.tsx                            # Full app shell integration tests
```
