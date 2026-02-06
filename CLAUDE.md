# NutriCodex

Nutrition/food tracking app — Turborepo monorepo with web, mobile, and shared backend.

Use frontend design skill when designing UI components.

Use code simplifier skill after initial implementation.

## Tech Stack

- **Monorepo**: Turborepo + Bun workspaces
- **Web**: TanStack Start (React 19, Vite, SSR) + Tailwind v4 + ShadCN UI
- **Mobile**: Expo 54 (React Native) + Uniwind + RN Reusables
- **Backend**: Convex (real-time DB + server functions)
- **Auth**: Better Auth — pinned to exact `1.4.9` (required for Convex adapter)
- **Linting/Format**: Biome v2

## Project Structure

```
apps/web/                 TanStack Start web app (@nutricodex/web)
apps/mobile/              Expo mobile app (@nutricodex/mobile)
packages/backend/         Convex + Better Auth (@nutricodex/backend)
  convex/                 Schema, functions, auth config, HTTP routes
packages/typescript-config/  Shared tsconfig presets
```

Both apps consume `@nutricodex/backend` via `workspace:*` for typed Convex API.

## Commands

Always use `bun` instead of `npm`.

Use `bun add <package>` to add dependencies — avoid editing `package.json` manually.

**From repo root:**
- `bun run dev` — Start all services
- `bun run dev:web` / `dev:mobile` / `dev:backend` — Start individually
- `bun run build` — Production build
- `bun run lint` — Biome lint
- `bun run type-check` — TypeScript check
- `bun run format` — Biome format

Always run `bun run format` after making changes. Run `bun run lint` and `bun run type-check` to validate.

## Integrity Checks

After every iteration, verify:
1. `bun run lint` — zero errors
2. `bun run type-check` — zero errors
3. `bun run build` — succeeds

## More Information

- Architecture & data model: @ARCHITECTURE.md
