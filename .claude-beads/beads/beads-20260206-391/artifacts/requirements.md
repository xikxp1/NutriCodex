# Requirements: Set up Turborepo monorepo with TanStack Start, Expo, and Convex packages

## Overview

Scaffold a greenfield Turborepo monorepo for NutriCodex, a nutrition/food tracking application. The monorepo hosts a TanStack Start web app, an Expo mobile app, and a shared Convex backend package. The scaffold must produce a fully buildable, lintable, and type-checkable project with bare-minimum routing skeletons (no example pages or sample data). Authentication scaffolding uses Better Auth integrated with Convex. Bun is the sole package manager and runtime. Biome replaces ESLint and Prettier as the unified linter and formatter.

---

## Functional Requirements

### FR-1: Root Monorepo Configuration (Must-Have)

Initialize the repository root with Turborepo, Bun workspaces, and shared tooling configuration.

- **FR-1.1**: A root `package.json` with `"workspaces": ["apps/*", "packages/*"]`, `"private": true`, and Bun as the package manager.
  - Acceptance: `bun install` at the root resolves all workspace dependencies without errors.

- **FR-1.2**: A root `turbo.json` defining the following tasks:
  - `build` -- depends on `^build`, outputs cached build artifacts.
  - `dev` -- persistent, no caching, runs each app's dev server.
  - `lint` -- runs Biome check across all packages.
  - `type-check` -- runs TypeScript `tsc --noEmit` across all packages.
  - `format` -- runs Biome format across all packages.
  - Acceptance: `bunx turbo run build`, `bunx turbo run lint`, `bunx turbo run type-check` all execute across the workspace graph in correct dependency order.

- **FR-1.3**: A root `biome.json` with:
  - Formatter enabled (indentation: 2 spaces, line width: 100, double quotes for consistency with React conventions -- or single quotes if preferred, but must be consistent).
  - Linter enabled with recommended rules.
  - Organizer for imports enabled.
  - Acceptance: `bunx biome check .` runs without configuration errors and reports on all `.ts`, `.tsx`, `.json` files in the repo.

- **FR-1.4**: A root `tsconfig.json` (base config) that is extended by each app and package. Must set: `strict: true`, `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "Bundler"`, `jsx: "react-jsx"`, `skipLibCheck: true`.
  - Acceptance: Each app/package `tsconfig.json` extends the root config without duplication.

- **FR-1.5**: A root `.gitignore` covering: `node_modules/`, `.turbo/`, `dist/`, `.convex/`, `.expo/`, `.env`, `.env.local`, build output directories.
  - Acceptance: Running `git status` after a full install and build shows no tracked generated files.

- **FR-1.6**: A root `.env.example` documenting all required environment variables with placeholder values:
  - `CONVEX_URL` -- Convex deployment URL
  - `CONVEX_SITE_URL` -- Convex HTTP actions URL
  - `BETTER_AUTH_SECRET` -- Auth secret key (with comment: generate via `openssl rand -base64 32`)
  - `SITE_URL` -- Web app URL (default `http://localhost:3000`)
  - Acceptance: File exists and documents every env var needed to run the project locally.

---

### FR-2: TanStack Start Web App -- `apps/web` (Must-Have)

Set up a bare TanStack Start application with React, SSR, and file-based routing.

- **FR-2.1**: The app lives at `apps/web/` with its own `package.json` (name: `@nutricodex/web`).
  - Acceptance: `cd apps/web && bun run dev` starts the TanStack Start dev server.

- **FR-2.2**: Configuration files:
  - `app.config.ts` -- TanStack Start configuration using `defineConfig` from `@tanstack/react-start/config`. Server adapter set to Node.js (self-hosted).
  - `tsconfig.json` -- extends the root base config, adds path aliases (`@/*` mapping to `./src/*`).
  - Acceptance: Build produces a Node.js-compatible server bundle.

- **FR-2.3**: Minimum file-based routing skeleton:
  - `src/routes/__root.tsx` -- root layout component (renders `<Outlet />`). Wraps children with Convex and auth providers (placeholder structure).
  - `src/routes/index.tsx` -- bare index route (renders a minimal placeholder, e.g., `<h1>NutriCodex</h1>`).
  - Acceptance: Navigating to `http://localhost:3000/` renders the index route inside the root layout.

- **FR-2.4**: Tailwind CSS v4 configured via Vite plugin (or PostCSS, whichever TanStack Start's Vite config supports). A `src/styles/globals.css` with Tailwind directives.
  - Acceptance: Tailwind utility classes (e.g., `className="text-red-500"`) render correctly in the browser.

- **FR-2.5**: ShadCN UI initialized with the project. A `components.json` file at the `apps/web/` root configured for the project's alias paths. No components need to be installed yet -- just the configuration.
  - Acceptance: Running `bunx shadcn@latest add button` (or equivalent) would succeed and place the component in the correct directory.

- **FR-2.6**: The web app depends on `@nutricodex/backend` (the Convex shared package).
  - Acceptance: Importing from `@nutricodex/backend` resolves correctly in the web app source.

- **FR-2.7**: Better Auth client-side setup files scaffolded:
  - `src/lib/auth-client.ts` -- creates the auth client with `createAuthClient` and Convex plugin.
  - `src/lib/auth-server.ts` -- server-side auth helpers using `convexBetterAuthReactStart()`.
  - `src/routes/api/auth/$.ts` -- API route handler proxying auth requests to Convex.
  - Acceptance: Files exist, import correct packages, and type-check without errors (actual auth flow is not functional until Convex is deployed).

- **FR-2.8**: Vite SSR configuration includes `ssr.noExternal: ['@convex-dev/better-auth']` to avoid module resolution issues during SSR.
  - Acceptance: Build does not fail with module resolution errors for Better Auth.

---

### FR-3: Expo Mobile App -- `apps/mobile` (Must-Have)

Set up a bare Expo application targeting iOS and Android, compatible with Expo Go.

- **FR-3.1**: The app lives at `apps/mobile/` with its own `package.json` (name: `@nutricodex/mobile`).
  - Acceptance: `cd apps/mobile && bun run start` launches the Expo dev server (Metro bundler).

- **FR-3.2**: Created using Expo SDK (latest stable). Must use the Expo Router for file-based routing.
  - Acceptance: The app runs in Expo Go on both iOS simulator and Android emulator.

- **FR-3.3**: Minimum routing skeleton:
  - `app/_layout.tsx` -- root layout with Convex provider wrapper (placeholder structure).
  - `app/index.tsx` -- bare home screen (renders a minimal placeholder, e.g., `<Text>NutriCodex</Text>`).
  - Acceptance: App launches and displays the index screen inside the root layout.

- **FR-3.4**: Uniwind configured for Tailwind-style utility classes in React Native.
  - Acceptance: Uniwind utility classes apply styles correctly to React Native components.

- **FR-3.5**: React Native Reusables initialized with Uniwind as the styling engine. Configuration only -- no components installed yet.
  - Acceptance: The project is configured so that adding React Native Reusables components would work.

- **FR-3.6**: The mobile app depends on `@nutricodex/backend` (the Convex shared package).
  - Acceptance: Importing from `@nutricodex/backend` resolves correctly in the mobile app source.

- **FR-3.7**: `tsconfig.json` extends the root base config with adjustments needed for React Native / Expo (e.g., `jsx: "react-jsx"`, module resolution compatible with Metro).
  - Acceptance: `tsc --noEmit` passes without errors.

- **FR-3.8**: `app.json` / `app.config.ts` configured with:
  - App name: "NutriCodex"
  - Slug: "nutricodex"
  - Platforms: `["ios", "android"]`
  - Acceptance: Expo config is valid and the app can be started for both platforms.

---

### FR-4: Convex Backend Package -- `packages/backend` (Must-Have)

Set up the Convex backend as a shared workspace package consumable by both apps.

- **FR-4.1**: The package lives at `packages/backend/` with its own `package.json` (name: `@nutricodex/backend`).
  - Acceptance: Both `apps/web` and `apps/mobile` can declare `@nutricodex/backend` as a workspace dependency.

- **FR-4.2**: Convex project structure:
  - `convex/` directory at the package root.
  - `convex/convex.config.ts` -- registers the Better Auth component using `app.use(betterAuth)`.
  - `convex/schema.ts` -- empty schema file (placeholder, imports Better Auth schema tables).
  - `convex/auth.config.ts` -- configures Better Auth as an auth provider using `getAuthConfigProvider()`.
  - `convex/auth.ts` -- Better Auth instance with Convex adapter and plugin.
  - `convex/http.ts` -- HTTP route handler mounting Better Auth routes.
  - Acceptance: `bunx convex dev` (from the package directory or with `--root` flag) initializes without schema errors.

- **FR-4.3**: Package exports:
  - Re-exports Convex client utilities (`ConvexProvider`, `ConvexReactClient`, etc.) so apps import from `@nutricodex/backend` rather than directly from `convex/react`.
  - Exports typed API references generated by Convex (`_generated/api`, `_generated/dataModel`).
  - Acceptance: Both apps can import Convex utilities and typed API from `@nutricodex/backend`.

- **FR-4.4**: `tsconfig.json` extends the root base config.
  - Acceptance: `tsc --noEmit` passes without errors.

- **FR-4.5**: `.env.example` in the package documents Convex-specific variables (or these are in the root `.env.example` -- see FR-1.6).

---

### FR-5: Shared TypeScript Configuration Package -- `packages/typescript-config` (Must-Have)

- **FR-5.1**: A `packages/typescript-config/` package containing base `tsconfig.json` files that other packages extend.
  - At minimum: `base.json` (shared compiler options), `react.json` (extends base, adds JSX settings for web), `react-native.json` (extends base, adjustments for Metro/RN).
  - Acceptance: Each app and package extends the appropriate shared tsconfig without duplicating compiler options.

---

### FR-6: Development Workflow Scripts (Must-Have)

Root `package.json` scripts for common development tasks.

- **FR-6.1**: `bun run dev` -- starts all dev servers in parallel (TanStack Start web, Expo mobile, Convex backend).
  - Acceptance: A single command starts the full development environment.

- **FR-6.2**: `bun run dev:web` -- starts only the web app dev server.
  - Acceptance: Runs TanStack Start dev server on `localhost:3000`.

- **FR-6.3**: `bun run dev:mobile` -- starts only the Expo dev server.
  - Acceptance: Runs Expo/Metro dev server.

- **FR-6.4**: `bun run dev:backend` -- starts the Convex dev server (`convex dev`).
  - Acceptance: Convex dev server connects and watches for schema/function changes.

- **FR-6.5**: `bun run build` -- builds all packages and apps via Turborepo.
  - Acceptance: Produces build artifacts for the web app (Node.js server bundle).

- **FR-6.6**: `bun run lint` -- runs Biome check across the entire monorepo.
  - Acceptance: Reports linting and formatting issues for all workspaces.

- **FR-6.7**: `bun run type-check` -- runs TypeScript type checking across all workspaces.
  - Acceptance: Reports type errors from all workspaces without emitting files.

- **FR-6.8**: `bun run format` -- runs Biome format with `--write` flag to auto-fix formatting.
  - Acceptance: Formats all files in-place.

---

### FR-7: GitHub Actions CI Workflow (Nice-to-Have)

- **FR-7.1**: A `.github/workflows/ci.yml` file that runs on push and pull request events.
  - Steps: checkout, install Bun, `bun install`, `bun run lint`, `bun run type-check`, `bun run build`.
  - Acceptance: The workflow file is valid YAML and would execute successfully in a GitHub Actions environment with the correct Bun version.

- **FR-7.2**: The workflow uses Turborepo's remote caching or local caching for faster CI runs.
  - Acceptance: turbo.json outputs are configured so Turborepo can cache build results.

---

## Non-Functional Requirements

### NFR-1: Build Performance
- Turborepo task caching must be configured so that unchanged packages are not rebuilt. The `outputs` field in `turbo.json` must be set for the `build` task.
- Acceptance: Running `bun run build` twice in succession completes the second run in under 2 seconds (cache hit).

### NFR-2: TypeScript Strictness
- `strict: true` must be enabled in the base TypeScript configuration. All code must pass `tsc --noEmit` with zero errors.
- Acceptance: `bun run type-check` exits with code 0.

### NFR-3: Dependency Isolation
- Each workspace package must declare its own dependencies explicitly. No implicit reliance on hoisted packages.
- Acceptance: Each `package.json` lists all direct dependencies used in that package's source code.

### NFR-4: Expo Go Compatibility
- The mobile app must not use any native modules that require a custom dev client. It must run in Expo Go for rapid development.
- Acceptance: `npx expo start` or `bun run start` in `apps/mobile` generates a QR code scannable by Expo Go.

### NFR-5: Node.js Self-Hosted Deployment Target
- The TanStack Start web app must produce a standalone Node.js server bundle (not tied to Vercel, Netlify, or Cloudflare adapters).
- Acceptance: The build output can be started with `node` and serves the application on the configured port.

### NFR-6: Code Quality Consistency
- Biome configuration is shared from the root. Packages may extend it with `"extends": ["//"]` syntax if package-specific overrides are needed, but defaults come from the root `biome.json`.
- Acceptance: `bunx biome check .` produces consistent results regardless of which directory it is run from.

---

## Scope Boundaries

The following items are explicitly **out of scope** for this scaffolding task:

1. **Application features** -- No screens, pages, components, or business logic beyond bare placeholders.
2. **Database schema design** -- The Convex schema file is empty (aside from Better Auth tables). No application tables.
3. **UI component installation** -- ShadCN UI and React Native Reusables are configured but no individual components are installed.
4. **Testing setup** -- No test runner (Vitest, Jest) or test files. This is a separate task.
5. **Deployment infrastructure** -- No Docker, Terraform, or production deployment scripts. Only the CI workflow.
6. **Monitoring and logging** -- No Sentry, analytics, or logging infrastructure.
7. **Auth flow implementation** -- Better Auth config files are scaffolded, but sign-in/sign-up UI and flows are not implemented. Auth is not functional until Convex is deployed and env vars are set.
8. **Shared UI package** -- No `packages/ui` for cross-platform shared components. This may be added later.
9. **State management** -- No Zustand, Jotai, or other state management beyond what Convex/TanStack provide.
10. **Internationalization (i18n)** -- Not included.

---

## Assumptions

1. **Bun is installed** on the developer's machine at a version supporting workspaces (Bun >= 1.0).
2. **Node.js >= 18** is available (required by some tooling even when Bun is the primary runtime).
3. **Convex CLI** will be installed as a dev dependency; developers will run `bunx convex dev` to initialize their Convex project and link it to a Convex deployment.
4. **Expo Go** is installed on the developer's mobile device or simulator for testing.
5. **The repository** will be hosted on GitHub (for the CI workflow to be relevant).
6. **Better Auth version** is pinned to `1.4.9` as required by the Convex Better Auth component (`@convex-dev/better-auth`).
7. **Convex version** must be `>= 1.25.0` for Better Auth compatibility.
8. **TanStack Start** is used with React (not Solid or other frameworks it may support).
9. **Tailwind CSS v4** is used for the web app (latest at time of setup, uses Vite plugin rather than PostCSS).
10. **Expo SDK** uses the latest stable version at time of implementation.

---

## Open Questions

_All clarifying questions have been resolved. No open questions remain._
