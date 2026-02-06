# Plan: Set up Turborepo monorepo with TanStack Start, Expo, and Convex packages

## Subtask Breakdown

| # | ID | Title | Complexity | Dependencies | Description |
|---|-----|-------|------------|--------------|-------------|
| 1 | beads-20260206-391-sub-01 | Root monorepo configuration | medium | none | Create root package.json with Bun workspaces, turbo.json with task pipeline, biome.json for linting/formatting, root tsconfig.json, .gitignore, and .env.example. Install root devDependencies (turbo, biome, typescript). This is the foundation that all other subtasks build upon. |
| 2 | beads-20260206-391-sub-02 | TypeScript configuration package | small | sub-01 | Create packages/typescript-config with base.json, react.json, and react-native.json shared compiler configurations plus its package.json. All other workspaces extend these configs. |
| 3 | beads-20260206-391-sub-03 | Convex backend package | medium | sub-02 | Create packages/backend with package.json, tsconfig.json, Convex directory structure (convex.config.ts, schema.ts, auth.config.ts, auth.ts, http.ts), and the src/index.ts entry point that re-exports Convex client utilities and typed API. |
| 4 | beads-20260206-391-sub-04 | TanStack Start web app | large | sub-02, sub-03 | Create apps/web with package.json, tsconfig.json, vite.config.ts, app.config.ts, Tailwind CSS v4 setup (globals.css with theme vars), ShadCN UI components.json, file-based routing skeleton (__root.tsx, index.tsx), router.tsx with ConvexQueryClient, and the cn() utility. |
| 5 | beads-20260206-391-sub-05 | Web app auth scaffolding | small | sub-04 | Create the Better Auth client-side and server-side files for the web app: src/lib/auth-client.ts, src/lib/auth-server.ts, and the API route handler at src/routes/api/auth/$.ts. Configure SSR noExternal for @convex-dev/better-auth in vite.config.ts. |
| 6 | beads-20260206-391-sub-06 | Expo mobile app | large | sub-02, sub-03 | Create apps/mobile with package.json, app.json, tsconfig.json, metro.config.js, babel.config.js, Uniwind CSS setup (src/global.css), Expo Router file-based routing skeleton (app/_layout.tsx with ConvexProvider, app/index.tsx), and the auth-client.ts placeholder. |
| 7 | beads-20260206-391-sub-07 | CI workflow and verification | small | sub-04, sub-06 | Create .github/workflows/ci.yml with lint, type-check, and build steps. Add all root package.json scripts (dev, dev:web, dev:mobile, dev:backend, build, lint, type-check, format). Run bun install and verify that lint, type-check, and build pass across all workspaces. |

## Dependency Graph

```
sub-01 (Root config)
  |
  v
sub-02 (TypeScript config)
  |
  +----------+
  |          |
  v          v
sub-03     sub-04 -----> sub-05 (Web auth)
(Backend)    |   (Web app)
  |          |
  +--+-------+
     |       |
     v       v
  sub-06   sub-07 (CI + verification)
 (Mobile)    ^
     |       |
     +-------+
```

More precisely:

```
sub-01
  |
  v
sub-02
  |
  +-----------+-----------+
  |           |           |
  v           v           |
sub-03      sub-04        |
  |           |           |
  |     +-----+-----+    |
  |     |           |    |
  |     v           |    |
  |   sub-05        |    |
  |     |           |    |
  +-----+-----------+----+
        |           |
        v           v
      sub-07      sub-06
        ^           |
        |           |
        +-----------+
```

## Implementation Order

1. **sub-01: Root monorepo configuration** -- Must come first. Establishes the workspace structure, task pipeline, and shared tooling that everything else depends on.

2. **sub-02: TypeScript configuration package** -- Second because every other workspace extends these tsconfig presets. Without this package, no other workspace can define its own tsconfig.json.

3. **sub-03: Convex backend package** -- Third because both apps depend on @nutricodex/backend as a workspace dependency. The typed API exports and Convex utilities must be importable before apps can reference them.

4. **sub-04: TanStack Start web app** -- Fourth. The web app is the more complex of the two frontend apps (SSR, Vite plugin chain, ShadCN config, ConvexQueryClient integration). Building it before the mobile app lets us validate the Convex workspace dependency pattern first.

5. **sub-05: Web app auth scaffolding** -- Fifth. Separated from sub-04 to keep the web app subtask focused on routing and styling. Auth files are isolated and depend on the web app structure existing.

6. **sub-06: Expo mobile app** -- Sixth. The mobile app follows the same workspace dependency pattern validated by the web app. Includes Uniwind, Expo Router, and the auth client placeholder.

7. **sub-07: CI workflow and verification** -- Last. Can only be written once all workspaces exist. The verification step (bun install, lint, type-check, build) confirms the entire scaffold works end-to-end.

## Branch

- Name: `beads/beads-20260206-391/monorepo-scaffold`
- Created from: `main` (initial branch of new git repository)
