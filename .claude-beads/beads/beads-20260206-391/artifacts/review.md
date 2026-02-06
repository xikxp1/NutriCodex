# Review: Set up Turborepo monorepo with TanStack Start, Expo, and Convex packages

## Status: PASS

## Summary

The implementation is a well-structured Turborepo monorepo scaffold that faithfully implements all functional and non-functional requirements. All 237 verification tests pass, the toolchain (lint, type-check, build) completes without errors, and Turborepo caching works correctly. The developer made three justified deviations from the original architecture to accommodate Biome v2 breaking changes and TanStack Start 1.158 API changes, all of which are documented in the test plan.

## Requirements Coverage

### Functional Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-1.1: Root package.json with workspaces, private, Bun | PASS | Workspaces `["apps/*", "packages/*"]`, `private: true`, `packageManager: "bun@1.2.4"` |
| FR-1.2: turbo.json with build/dev/lint/type-check/format | PASS | All five tasks defined with correct `dependsOn`, `outputs`, `persistent`, `cache` settings |
| FR-1.3: Root biome.json (formatter, linter, import organizer) | PASS | Adapted for Biome v2 using `files.includes` with negation patterns instead of `files.ignore` |
| FR-1.4: Root tsconfig.json extending base config | PASS | Extends `./packages/typescript-config/base.json` |
| FR-1.5: Root .gitignore | PASS | Covers node_modules, .turbo, dist, .convex, .expo, .env, and more |
| FR-1.6: Root .env.example | PASS | Documents all required variables: CONVEX_DEPLOYMENT, VITE_CONVEX_URL, VITE_CONVEX_SITE_URL, EXPO_PUBLIC_*, BETTER_AUTH_SECRET, SITE_URL |
| FR-2.1: Web app at apps/web | PASS | Package `@nutricodex/web`, type module, correct scripts |
| FR-2.2: Web configuration files | PASS | `app.config.ts` with `node-server` preset, `tsconfig.json` extends react config, path aliases `@/*` and `~/*` |
| FR-2.3: Routing skeleton (__root.tsx, index.tsx) | PASS | Root layout with `<Outlet />`, `<HeadContent />`, `<Scripts />`; index route renders "NutriCodex" |
| FR-2.4: Tailwind CSS v4 via Vite plugin | PASS | `@tailwindcss/vite` in vite.config.ts, `globals.css` with `@import "tailwindcss"` and `@theme` variables |
| FR-2.5: ShadCN UI configuration | PASS | `components.json` with correct aliases, `utils.ts` with `cn()` helper, empty `components/ui/` directory |
| FR-2.6: Web app depends on @nutricodex/backend | PASS | `workspace:*` protocol used |
| FR-2.7: Better Auth client/server scaffolding | PASS | `auth-client.ts`, `auth-server.ts`, `-$.ts` auth route (adapted for TanStack Start 1.158+) |
| FR-2.8: SSR noExternal for @convex-dev/better-auth | PASS | Configured in `vite.config.ts` |
| FR-3.1: Mobile app at apps/mobile | PASS | Package `@nutricodex/mobile`, main `expo-router/entry` |
| FR-3.2: Expo SDK with Expo Router | PASS | `expo ~54.0.0`, `expo-router ~4.0.0` |
| FR-3.3: Mobile routing skeleton | PASS | `_layout.tsx` with ConvexProvider, `index.tsx` with "NutriCodex" |
| FR-3.4: Uniwind configured | PASS | Metro config with `withUniwindConfig`, `global.css` importing tailwindcss and uniwind |
| FR-3.5: React Native Reusables initialized | PASS | `@rn-primitives/portal` dependency, `<PortalHost />` in layout |
| FR-3.6: Mobile depends on @nutricodex/backend | PASS | `workspace:*` protocol used |
| FR-3.7: Mobile tsconfig extends react-native config | PASS | Extends `@nutricodex/typescript-config/react-native.json` |
| FR-3.8: app.json configured | PASS | Name "NutriCodex", slug "nutricodex", platforms `["ios", "android"]`, scheme "nutricodex" |
| FR-4.1: Backend package at packages/backend | PASS | Package `@nutricodex/backend`, type module, proper exports |
| FR-4.2: Convex project structure | PASS | All five Convex files present and correct: convex.config.ts, schema.ts, auth.config.ts, auth.ts, http.ts |
| FR-4.3: Package exports | PASS | Re-exports ConvexProvider, ConvexReactClient, useQuery, useMutation, useAction, ConvexBetterAuthProvider, api, DataModel, Doc, Id |
| FR-4.4: Backend tsconfig extends base | PASS | Extends `@nutricodex/typescript-config/base.json` |
| FR-4.5: Env vars documented | PASS | All Convex-specific vars in root `.env.example` |
| FR-5.1: Shared TypeScript config package | PASS | `base.json`, `react.json`, `react-native.json` all present with correct settings |
| FR-6.1-6.8: Root dev/build/lint scripts | PASS | All eight scripts present and functional |
| FR-7.1: GitHub Actions CI workflow | PASS | Triggers on push/PR to main, correct steps: checkout, setup-bun, install, lint, type-check, build |
| FR-7.2: Turborepo caching for CI | PASS | `outputs` configured in turbo.json build task |

### Non-Functional Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| NFR-1: Build caching | PASS | Second build completes in ~1s (cache hit verified) |
| NFR-2: TypeScript strict mode | PASS | `strict: true` in base.json, `tsc --noEmit` passes in all packages |
| NFR-3: Dependency isolation | PASS | Each workspace declares its own dependencies explicitly |
| NFR-4: Expo Go compatibility | PASS (structural) | No native modules requiring custom dev client; runtime verification deferred |
| NFR-5: Node.js self-hosted target | PASS | `app.config.ts` uses `preset: "node-server"`, build produces `dist/server/server.js` |
| NFR-6: Code quality consistency | PASS | Single root `biome.json`, lint passes across all workspaces |

## Architecture Deviations

Three deviations from the original architecture specification were made. All are justified:

### 1. Biome v2 `files.includes` instead of `files.ignore`

**Architecture spec**: Used `files.ignore` array.
**Implementation**: Uses `files.includes` with negation patterns (e.g., `!**/node_modules`).
**Justification**: Biome v2.3.14 removed the `files.ignore` field. The `files.includes` with negation patterns is the correct v2 API. This is a breaking change in Biome that the architecture spec predated.

### 2. Auth route file `-$.ts` instead of `$.ts`, direct exports instead of `createAPIFileRoute`

**Architecture spec**: `apps/web/src/routes/api/auth/$.ts` using `createAPIFileRoute`.
**Implementation**: `apps/web/src/routes/api/auth/-$.ts` with direct `GET`/`POST` exports.
**Justification**: TanStack Start 1.158.3 removed the `createAPIFileRoute` API. The `-` prefix excludes the file from TanStack Router's automatic route scanning. Direct handler exports are the new pattern for API routes.

### 3. Router function named `getRouter` instead of `createRouter`

**Architecture spec**: Exported function named `createRouter`.
**Implementation**: Exported function named `getRouter`.
**Justification**: TanStack Start's generated `routeTree.gen.ts` references `getRouter` (line 61, 66). The router function name must match what the framework's code generator expects. This is a TanStack Start convention change.

### 4. Additional biome.json entries

**Implementation additions**: `css.parser.tailwindDirectives: true` and `!**/routeTree.gen.ts` in file exclusions, `style.noNonNullAssertion: "off"` in linter rules.
**Justification**: Tailwind CSS v4 uses `@import "tailwindcss"` and `@theme` directives which need explicit Biome CSS parser support. The route tree is auto-generated and should not be linted. The `noNonNullAssertion` rule is disabled because the scaffolding uses `!` assertions for environment variables that are not set during build/type-check but will be at runtime (a common pattern documented by Convex and Better Auth).

## Code Quality Issues

| # | Severity | File | Line(s) | Description | Suggestion |
|---|----------|------|---------|-------------|------------|
| 1 | suggestion | `packages/backend/convex/_generated/api.ts` | 1-12 | Stub files in `convex/_generated/` are committed despite being in `.gitignore`. Since they are already tracked, `.gitignore` does not apply. Future `convex dev` runs will regenerate these files, creating local diffs. | Consider adding a comment in the README or CONTRIBUTING docs noting that `convex/_generated/` stubs are committed for initial type-checking and will be replaced by `convex dev`. Alternatively, add a `.gitattributes` entry marking them as generated. |
| 2 | suggestion | `apps/web/src/routes/__root.tsx` | 14 | The stylesheet link uses `/src/styles/globals.css` as an href. In development this works due to Vite's dev server serving source files, but in production the CSS is bundled by Tailwind/Vite and injected automatically. This link may result in a 404 in production. | Verify that the production build handles CSS injection correctly. TanStack Start with Tailwind CSS v4 Vite plugin typically handles this automatically. If the link causes issues in production, remove it and rely on the Vite plugin for CSS injection. |
| 3 | suggestion | `biome.json` | 31-33 | `noNonNullAssertion` is globally disabled. While justified for environment variable assertions in scaffolding code, this rule is useful for catching bugs in application code added later. | Consider re-enabling this rule and using targeted `biome-ignore` comments for the specific environment variable assertions instead of a global disable. |

## Functional Issues

No functional issues found. All requirements are met.

## Test Coverage Assessment

- **Status**: adequate
- **Gaps**:
  - Dev server startup tests are deferred (requires running processes and environment variables) -- this is reasonable for a scaffold verification.
  - Browser/simulator rendering tests are deferred -- appropriate for a CI environment.
  - ShadCN component installation test is deferred -- would modify the project.
  - Convex dev initialization requires a Convex deployment -- cannot be tested offline.

The 237 verification tests provide thorough coverage of file existence, configuration correctness, content validation, workspace dependency resolution, and toolchain execution (lint, type-check, build, caching).

## Security Assessment

- No hardcoded secrets or credentials found in any source files.
- `.env` and `.env.local` are properly gitignored.
- `.env.example` contains only placeholder values.
- Environment variables use `!` non-null assertions but no actual values are embedded.
- The `BETTER_AUTH_SECRET` is documented with a generation command (`openssl rand -base64 32`).

## Positive Observations

1. **Excellent test coverage**: 237 automated verification checks covering every requirement is thorough and well-organized.
2. **Clean architecture**: The dependency graph is clear -- both apps depend on `@nutricodex/backend`, which depends on `@nutricodex/typescript-config`. No circular dependencies.
3. **Smart stub files**: The Convex `_generated/` stub files with `biome-ignore` comments and proper `any` type annotations allow type-checking to pass without a running Convex backend. This is a practical solution to the chicken-and-egg problem of generated types.
4. **Proper version pinning**: `better-auth` is pinned to exactly `1.4.9` (not `^1.4.9`) in all three packages, as required by the Convex Better Auth component.
5. **Biome v2 adaptation**: The developer correctly adapted the Biome configuration for v2 breaking changes, including `files.includes` with negation patterns and `css.parser.tailwindDirectives`.
6. **TanStack Start 1.158 adaptation**: The auth route was correctly adapted for the removed `createAPIFileRoute` API, using the new direct export pattern with the `-` prefix naming convention.
7. **Consistent code style**: All TypeScript files pass Biome linting with no issues. Import ordering is consistent across all files.
8. **Complete workspace isolation**: Each package declares all its direct dependencies explicitly (NFR-3). No implicit reliance on hoisted packages.
9. **Turborepo caching works**: Build caching is verified -- second builds complete in ~1 second.
10. **Well-documented deviations**: The test plan documents all three contested test resolutions with clear justifications.

## Recommendations (Non-blocking)

1. **Consider committing `bun.lock`**: The `.gitignore` includes `bun.lock`, but committing it ensures reproducible installs across the team and in CI (`bun install --frozen-lockfile` requires it).
2. **Add `convex codegen` to CI**: The CI workflow currently relies on the committed stub files. When the Convex backend is deployed, adding a `convex codegen` step before type-checking would ensure the generated types are always fresh.
3. **Re-enable `noNonNullAssertion`**: As application code grows, having this rule globally disabled may mask real bugs. Targeted ignores would be more precise.
