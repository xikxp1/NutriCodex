# Summary: Architecture

## Key Decisions

- **Monorepo orchestration**: Turborepo + Bun workspaces with 3 apps (`@nutricodex/web`, `@nutricodex/mobile`) and 2 packages (`@nutricodex/backend`, `@nutricodex/typescript-config`)
- **Web**: TanStack Start (SSR Vite) on port 3000; Tailwind CSS v4 via `@tailwindcss/vite`; ShadCN UI configured
- **Mobile**: Expo SDK 54 + Expo Router; Uniwind for Tailwind v4 React Native bindings
- **Backend**: Convex as shared workspace package; Better Auth v1.4.9 integrated via `@convex-dev/better-auth` component
- **Auth flow**: Better Auth mounted on Convex HTTP routes; web proxies auth via `apps/web/src/routes/api/auth/$.ts`; mobile uses Better Auth Expo plugin
- **Linting/Formatting**: Biome v2.3.14 at root (2-space indent, 100-char lines, double quotes, trailing commas)
- **Development**: All three servers run in parallel via `bun run dev` with Turborepo TUI

## Complete File List (Dependencies Order)

**Order 1 — Root & Shared Configs** (must exist first):
1. `/` → `package.json` (workspaces)
2. `/` → `turbo.json`
3. `/` → `biome.json`
4. `/` → `tsconfig.json` (extends `packages/typescript-config/base.json`)
5. `/` → `.env.example`
6. `/` → `.gitignore`
7. `packages/typescript-config/` → `package.json`, `base.json`, `react.json`, `react-native.json`

**Order 2 — Backend Package** (no external deps, typed API re-export):
8. `packages/backend/` → `package.json`
9. `packages/backend/` → `tsconfig.json`
10. `packages/backend/convex/` → `convex.config.ts`, `auth.config.ts`, `auth.ts`, `schema.ts`, `http.ts`
11. `packages/backend/src/` → `index.ts` (re-exports Convex client, typed API, Better Auth)

**Order 3 — Web App** (depends on backend package):
12. `apps/web/` → `package.json`, `tsconfig.json`, `vite.config.ts`, `components.json`
13. `apps/web/src/` → `router.tsx` (ConvexQueryClient + TanStack Router setup)
14. `apps/web/src/routes/` → `__root.tsx`, `index.tsx`, `api/auth/$.ts` (auth proxy)
15. `apps/web/src/lib/` → `auth-client.ts`, `auth-server.ts`, `utils.ts`
16. `apps/web/src/styles/` → `globals.css` (Tailwind v4 with `@theme` directives)
17. `apps/web/src/components/ui/` → (empty directory, populated later by ShadCN)

**Order 4 — Mobile App** (depends on backend package):
18. `apps/mobile/` → `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`, `metro.config.js`
19. `apps/mobile/app/` → `_layout.tsx`, `index.tsx`
20. `apps/mobile/src/` → `global.css`, `lib/auth-client.ts`

**Order 5 — CI/Infrastructure**:
21. `.github/workflows/` → `ci.yml`

## Technical Details & Dependency Versions

**Root devDependencies**:
- `turbo@^2.8.3`
- `@biomejs/biome@^2.3.14`
- `typescript@^5.7.0`
- `bun@1.2.4` (packageManager)

**Backend dependencies**:
- `convex@^1.31.5`
- `@convex-dev/better-auth@^0.10.10`
- `better-auth@1.4.9` (PINNED, cannot upgrade)

**Web dependencies**:
- `@tanstack/react-start@^1.149.4`
- `@tanstack/react-router@^1.151.6`
- `@tanstack/react-query@^5.66.0`
- `@convex-dev/react-query@^0.0.14`
- `@tailwindcss/vite@^4.1.18`
- `tailwindcss@^4.1.18`
- `react@^19.0.0`, `react-dom@^19.0.0`
- `convex@^1.31.5`, `better-auth@1.4.9`, `@convex-dev/better-auth@^0.10.10`

**Mobile dependencies**:
- `expo@~54.0.0`
- `expo-router@~4.0.0`
- `expo-secure-store@~14.0.0`
- `react-native@~0.77.0`
- `@better-auth/expo@1.4.9` (matches better-auth pin)
- `react-native-reanimated@~3.17.0`
- `react-native-safe-area-context@~5.4.0`
- `uniwind@^1.2.2`

**Path Aliases**:
- Web: `@/*` → `./src/*`, `~/*` → `./src/*`
- Mobile: `@/*` → `./*`

**Environment Variables** (in `.env`):
- `CONVEX_DEPLOYMENT=dev:your-deployment-name` (server-only)
- `VITE_CONVEX_URL=https://...convex.cloud` (web client)
- `VITE_CONVEX_SITE_URL=https://...convex.site` (web client)
- `EXPO_PUBLIC_CONVEX_URL=https://...convex.cloud` (mobile client)
- `EXPO_PUBLIC_CONVEX_SITE_URL=https://...convex.site` (mobile client)
- `BETTER_AUTH_SECRET=` (Convex/auth server-only; generate via `openssl rand -base64 32`)
- `SITE_URL=http://localhost:3000` (web server)

## Dependency Order (Implementation Sequence)

1. **Root + TypeScript config**: All subsequent packages depend on `@nutricodex/typescript-config`
2. **Backend package**: No app-level dependencies; Convex schema/auth infra
3. **Web app**: Imports `@nutricodex/backend` for typed API, auth client, ConvexQueryClient
4. **Mobile app**: Imports `@nutricodex/backend` for typed API, auth client, Convex provider

All three can be tested independently after step 2; all must exist before root `bun run dev` works.

## Risk Areas Requiring Special Attention

1. **Bun + Expo Metro** (HIGH): Metro bundler may not resolve deps correctly from Bun's `node_modules/.bun/` layout. Mitigation: Test early; fallback to `npx expo start` if needed.

2. **Better Auth Pinned to 1.4.9** (HIGH): Cannot upgrade without `@convex-dev/better-auth` update. Monitor the Convex repo for version bumps.

3. **Convex Type Generation in CI** (MEDIUM): `convex/_generated/` doesn't exist until first `convex dev` run. CI must run `convex codegen` before type-check, or exclude generated imports in CI.

4. **TanStack Start Maturity** (MEDIUM): Framework is <2 years old; API surface may shift. Pin to specific minor versions; monitor changelog.

5. **Uniwind Ecosystem** (MEDIUM): Stable only since v1.0 (Dec 2024). React Native Reusables added official support Dec 2025. Test component rendering early.

6. **Tailwind v4 CSS-Only Config** (LOW): No `tailwind.config.js`; configuration via `@theme` in CSS. Set `tailwind.config: ""` in `components.json`.

## Definition of Done

**Per-Package**:
- All files created in correct locations (file list above)
- Dependencies installed (`bun install`)
- TypeScript compilation passes (`bun run type-check`)
- Biome linting + formatting passes (`bun run lint`, `bun run format`)
- Dev server starts without errors (`bun run dev:web`, `bun run dev:mobile`, `bun run dev:backend`)

**Integration**:
- Full `bun run dev` starts all three servers in parallel via Turborepo TUI
- Web app accessible on http://localhost:3000 (shows "NutriCodex" headline)
- Mobile app accessible via Expo Go (shows "NutriCodex" on home screen)
- Backend `convex dev` connects to Convex cloud (not local)
- Auth routes mounted on Convex HTTP (accessible at `/api/auth/*` path)
- All workspace imports resolve correctly (`@nutricodex/backend`, `@nutricodex/web`, etc.)
- CI workflow passes lint + type-check + build

**Pre-Deployment Validation**:
- `.env` populated with actual Convex deployment URL and Better Auth secret
- `convex codegen` run to generate `_generated/` directory
- `bun install --frozen-lockfile` succeeds (lockfile committed or `bun.lock` in `.gitignore`)
