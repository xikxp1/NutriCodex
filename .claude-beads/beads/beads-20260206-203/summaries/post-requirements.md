# Summary: Requirements – Main Web Page View with App Shell Layout

## Key Decisions

- **Layout route pattern**: Create TanStack Router layout route (e.g., `_authenticated.tsx`) to wrap all authenticated pages with app shell chrome.
- **Sidebar state management**: Persist collapse/expanded state across navigations within the session using React context or local state.
- **User profile dropdown**: Display current user's name (or email fallback) in top bar with dropdown menu containing "Sign Out" action.
- **Placeholder navigation**: Sidebar shows at least 3 disabled/non-functional nav items (Dashboard, Food Log, Settings) with icons in collapsed state.
- **Fixed positioning**: Top bar sticky/fixed to viewport top (48-64px height); sidebar fixed on left (expanded ~240-280px, collapsed ~48-64px); main content scrolls independently below top bar.
- **Route protection preserved**: Existing `beforeLoad` auth checks in `index.tsx` and redirect logic continue to work unchanged.

## Technical Details

- **Components**: ShadCN UI pattern with CVA variants, Tailwind v4, manual copy-paste (no CLI). Existing `globals.css` theme variables (bg-background, text-foreground, border-border, text-muted-foreground).
- **Icons**: Use Lucide React (lightweight, standard ShadCN library).
- **Sign-out flow**: Move existing sign-out logic from `index.tsx` to dropdown menu; call `authClient.signOut()` and redirect to `/login`.
- **User data**: Pull name/email from `authClient.useSession()` hook within `ConvexBetterAuthProvider` context.
- **Sidebar animation**: CSS transition on width, 200–300ms duration.
- **Accessibility**: Dropdown menu keyboard-navigable, ARIA attributes, Escape key closure.

## Out of Scope

- Actual route navigation (sidebar items non-functional).
- User settings page.
- Mobile/tablet responsive design (desktop focus).
- Dark mode, notifications, search, breadcrumbs.
- Backend changes (schema, functions, routes).

## Open Items

None identified — all requirements fully specified.
