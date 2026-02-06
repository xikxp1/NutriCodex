# Architecture

## Overview

NutriCodex is a nutrition/food tracking application delivered as a Turborepo monorepo. It consists of a web application (TanStack Start with SSR), a mobile application (Expo with Expo Router), and a shared backend (Convex with Better Auth). Both client apps consume a shared backend package for typed API access and real-time data synchronization.

```
+------------------------------------------------------------------+
|                        Turborepo Root                            |
|  (Bun workspaces, Biome linting/formatting, shared tsconfig)    |
+------------------------------------------------------------------+
        |                    |                    |
+-------v------+    +-------v--------+   +-------v-----------+
|  apps/web    |    |  apps/mobile   |   | packages/backend  |
|  TanStack    |    |  Expo + Expo   |   | Convex +          |
|  Start       |    |  Router        |   | Better Auth       |
|  Tailwind v4 |    |  Uniwind       |   | (shared)          |
|  ShadCN UI   |    |  RN Reusables  |   +-------+-----------+
+------+-------+    +-------+--------+           ^
       |                    |                     |
       +----------+---------+---------------------+
                  |
        +---------v-----------+
        | packages/           |
        | typescript-config   |
        +---------------------+
```

## Tech Stack

| Layer           | Technology                          | Purpose                                    |
|-----------------|-------------------------------------|--------------------------------------------|
| Monorepo        | Turborepo + Bun workspaces          | Task orchestration, dependency management  |
| Web App         | TanStack Start (React, Vite, SSR)   | Server-rendered web application            |
| Mobile App      | Expo (React Native, Expo Router)    | iOS/Android mobile application             |
| Backend         | Convex                              | Real-time database, server functions       |
| Auth            | Better Auth + Convex adapter        | Authentication (email/password, sessions)  |
| Web Styling     | Tailwind CSS v4 + ShadCN UI         | Utility-first CSS, component library       |
| Mobile Styling  | Uniwind + React Native Reusables    | Tailwind bindings for React Native         |
| Linting/Format  | Biome v2                            | Unified linter, formatter, import sorter   |
| Type Checking   | TypeScript (strict mode)            | Static type safety across all packages     |
| CI              | GitHub Actions                      | Automated lint, type-check, build          |

## Project Structure

```
NutriCodex/
|-- .github/workflows/       # CI pipeline (GitHub Actions)
|-- apps/
|   |-- mobile/               # Expo mobile app (@nutricodex/mobile)
|   |   |-- app/              # Expo Router file-based routes
|   |   `-- src/              # Source code, global styles, libs
|   `-- web/                  # TanStack Start web app (@nutricodex/web)
|       `-- src/
|           |-- components/   # UI components (ShadCN UI target)
|           |-- lib/          # Utilities, auth client/server
|           |-- routes/       # TanStack file-based routes
|           `-- styles/       # Global CSS (Tailwind v4)
|-- packages/
|   |-- backend/              # Shared Convex backend (@nutricodex/backend)
|   |   |-- convex/           # Convex schema, functions, auth config
|   |   `-- src/              # Package exports (typed API, providers)
|   `-- typescript-config/    # Shared tsconfig presets (@nutricodex/typescript-config)
|-- biome.json                # Root Biome configuration
|-- turbo.json                # Turborepo task definitions
`-- package.json              # Root workspace configuration
```

## Component Map

### apps/web (TanStack Start)
- **Purpose**: SSR web application with file-based routing
- **Entry**: `vite.config.ts` (TanStack Start plugin + Tailwind v4 plugin)
- **Routing**: `src/routes/` directory (TanStack Router file-based routing)
- **Auth**: Client-side auth via `src/lib/auth-client.ts`, server helpers via `src/lib/auth-server.ts`, proxy route at `src/routes/api/auth/$.ts`
- **Styling**: Tailwind CSS v4 via Vite plugin, ShadCN UI for components
- **Data**: ConvexQueryClient bridges Convex real-time with TanStack Query for SSR
- **Consumes**: `@nutricodex/backend` for typed Convex API

### apps/mobile (Expo)
- **Purpose**: Cross-platform mobile app (iOS/Android) running in Expo Go
- **Entry**: `app/_layout.tsx` (Expo Router root layout)
- **Routing**: `app/` directory (Expo Router file-based routing)
- **Styling**: Uniwind (Tailwind v4 bindings for React Native), React Native Reusables for components
- **Data**: ConvexReactClient for real-time data
- **Consumes**: `@nutricodex/backend` for typed Convex API

### packages/backend (Convex)
- **Purpose**: Shared backend consumed by both apps
- **Schema**: `convex/schema.ts` (Better Auth tables managed by component)
- **Auth**: Better Auth component registered in `convex/convex.config.ts`, auth instance in `convex/auth.ts`, HTTP routes in `convex/http.ts`
- **Exports**: Typed Convex API (`api`), data model types (`DataModel`, `Doc`, `Id`), client utilities (`ConvexProvider`, `ConvexReactClient`), `ConvexBetterAuthProvider`

### packages/typescript-config
- **Purpose**: Shared TypeScript compiler configurations
- **Presets**: `base.json` (strict, ES2022, Bundler), `react.json` (DOM libs, JSX), `react-native.json` (RN types)

## Data Model

Currently empty (scaffolding phase). Only Better Auth managed tables exist:

| Table          | Managed By      | Purpose                  |
|----------------|-----------------|--------------------------|
| user           | Better Auth     | User accounts            |
| session        | Better Auth     | Active sessions          |
| account        | Better Auth     | Auth provider accounts   |
| verification   | Better Auth     | Email verification tokens|

Application tables will be added to `packages/backend/convex/schema.ts` in future tasks.

## API Boundaries

### Convex Functions (packages/backend/convex/)
- Server-side queries, mutations, and actions defined in the `convex/` directory
- Typed API generated at `convex/_generated/api.ts` by `convex dev`
- Both apps access via: `import { api } from "@nutricodex/backend"`

### Convex HTTP Routes (packages/backend/convex/http.ts)
- Better Auth endpoints mounted on Convex HTTP router
- Handles sign-up, sign-in, sign-out, session management
- Accessible at the Convex site URL (`*.convex.site`)

### Web Auth Proxy (apps/web/src/routes/api/auth/$.ts)
- Catch-all API route in TanStack Start
- Proxies auth requests from the web client to Convex HTTP routes
- Enables cookie-based auth flow for SSR

## Key Design Decisions

1. **Convex as shared workspace package**: Single source of truth for schema and typed API, consumed by both apps via `@nutricodex/backend`.

2. **Biome over ESLint/Prettier**: Single Rust-based tool for linting, formatting, and import organization. Eliminates configuration conflicts and runs faster.

3. **Tailwind CSS v4 via Vite plugin**: Direct Vite integration, no PostCSS config needed. Configuration in CSS (`@theme`) rather than JavaScript config files.

4. **Uniwind for mobile styling**: Tailwind v4 bindings for React Native with 2.5x performance improvement over NativeWind. Official React Native Reusables support.

5. **Better Auth with Convex adapter**: Auth handled at the Convex layer, shared across both apps. Web uses server-side proxy; mobile uses Expo secure storage.

6. **ConvexQueryClient for SSR**: Bridges Convex real-time subscriptions with TanStack Query for server-side rendering in TanStack Start.
