# Summary: Requirements

## Key Decisions

- **Monorepo structure**: Turborepo with Bun workspaces at root; `apps/web`, `apps/mobile`, `packages/backend`, `packages/typescript-config`.
- **Toolchain**: Bun (package manager + runtime), Biome (linter + formatter), Turborepo (orchestration).
- **Web app**: TanStack Start with React, SSR, Node.js adapter for self-hosted deployment. Tailwind CSS v4 + ShadCN UI (configured but no components installed).
- **Mobile app**: Expo (latest stable) with Expo Router file-based routing, Uniwind + React Native Reusables (configured only).
- **Backend**: Convex with Better Auth (v1.4.9) as auth provider; shared as `@nutricodex/backend` workspace package.
- **Authentication**: Better Auth integrated with Convex; client-side setup files scaffolded in web app; no functional auth until Convex deployed.
- **Shared TypeScript config**: `packages/typescript-config` with `base.json`, `react.json`, `react-native.json` to be extended by each workspace.
- **CI**: GitHub Actions workflow (nice-to-have) running lint, type-check, and build on push/PR.

## Technical Details

**Root Configuration**:
- `package.json`: `workspaces: ["apps/*", "packages/*"]`, `private: true`
- `turbo.json`: Tasks = `build`, `dev`, `lint`, `type-check`, `format`. Build outputs cached; dev non-cached.
- `tsconfig.json`: `strict: true`, `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `jsx: "react-jsx"`, `skipLibCheck: true`
- `biome.json`: Formatter (2-space indent, 100-char line width), linter (recommended rules), import organizer enabled.
- `.env.example`: `CONVEX_URL`, `CONVEX_SITE_URL`, `BETTER_AUTH_SECRET`, `SITE_URL` (localhost:3000 default)

**Web App** (`apps/web`, name: `@nutricodex/web`):
- `app.config.ts` with Node.js server adapter
- Routes: `src/routes/__root.tsx` (root layout with Convex/auth providers), `src/routes/index.tsx` (minimal index)
- `src/lib/auth-client.ts`, `src/lib/auth-server.ts`, `src/routes/api/auth/$.ts` (auth scaffolding)
- Vite SSR config: `ssr.noExternal: ['@convex-dev/better-auth']`
- Path alias: `@/*` → `./src/*`
- Depends on `@nutricodex/backend`

**Mobile App** (`apps/mobile`, name: `@nutricodex/mobile`):
- Expo SDK + Expo Router
- Routes: `app/_layout.tsx` (root layout), `app/index.tsx` (home screen)
- Uniwind configured for Tailwind-style utilities
- Must run in Expo Go (no native modules)
- Depends on `@nutricodex/backend`

**Backend Package** (`packages/backend`, name: `@nutricodex/backend`):
- `convex/` directory with:
  - `convex.config.ts`: registers Better Auth component
  - `schema.ts`: empty (imports Better Auth schema tables)
  - `auth.config.ts`: Better Auth provider configuration
  - `auth.ts`: Better Auth instance + Convex adapter
  - `http.ts`: HTTP route handler for Better Auth
- Re-exports: `ConvexProvider`, `ConvexReactClient`, typed API from `_generated/`

**Development Scripts** (root `package.json`):
- `bun run dev`: all servers in parallel
- `bun run dev:web`, `dev:mobile`, `dev:backend`: individual servers
- `bun run build`, `lint`, `type-check`, `format`: Turborepo-orchestrated tasks

## Open Items

- Convex version pinned to `>= 1.25.0` but final build against specific point release TBD
- Better Auth integration functional only after Convex deployment and env var configuration
- ShadCN UI and React Native Reusables component installation deferred to later phase
