# Test Plan: Set up Turborepo monorepo with TanStack Start, Expo, and Convex packages

## Test Strategy

- **Framework**: Shell-based verification script (bash). This is a scaffolding task, not application code, so the tests verify file existence, configuration validity, and toolchain execution rather than unit/integration behavior.
- **Test types**: Structural verification (file existence, JSON validity, config correctness), integration (workspace dependency resolution, toolchain execution -- lint/type-check/build)
- **Run command**: `./tests/verify-scaffold-test.sh` from the project root (or `bash tests/verify-scaffold-test.sh`)
- **Prerequisites**: `bun` must be installed on the machine (>= 1.0)

## Test Matrix

| Requirement | Subtask | Test File | Test Description |
|-------------|---------|-----------|-----------------|
| FR-1.1 | sub-01 | tests/verify-scaffold-test.sh | Root package.json: private, workspaces, packageManager (bun) |
| FR-1.2 | sub-01 | tests/verify-scaffold-test.sh | turbo.json: build/dev/lint/type-check/format tasks, dependsOn, outputs, persistent, cache settings |
| FR-1.3 | sub-01 | tests/verify-scaffold-test.sh | biome.json: formatter (space, 2, 100), linter (recommended), assist, file ignores |
| FR-1.4 | sub-01 | tests/verify-scaffold-test.sh | Root tsconfig.json: extends typescript-config/base.json |
| FR-1.5 | sub-01 | tests/verify-scaffold-test.sh | .gitignore: covers node_modules, .turbo, dist, .convex, .expo, .env |
| FR-1.6 | sub-01 | tests/verify-scaffold-test.sh | .env.example: documents CONVEX, BETTER_AUTH_SECRET, SITE_URL, VITE_CONVEX_URL, EXPO_PUBLIC_CONVEX_URL |
| FR-5.1 | sub-02 | tests/verify-scaffold-test.sh | typescript-config: package.json (name, private), base.json (strict, ES2022, ESNext, Bundler, react-jsx, skipLibCheck), react.json (extends base, DOM lib), react-native.json (extends base, noEmit) |
| FR-4.1 | sub-03 | tests/verify-scaffold-test.sh | backend package.json: name, type module, exports |
| FR-4.2 | sub-03 | tests/verify-scaffold-test.sh | Convex files: convex.config.ts (betterAuth), schema.ts (defineSchema), auth.config.ts (getAuthConfigProvider), auth.ts (betterAuth), http.ts (httpRouter) |
| FR-4.3 | sub-03 | tests/verify-scaffold-test.sh | backend src/index.ts: re-exports ConvexProvider, ConvexReactClient |
| FR-4.4 | sub-03 | tests/verify-scaffold-test.sh | backend tsconfig.json: extends typescript-config |
| FR-2.1 | sub-04 | tests/verify-scaffold-test.sh | web package.json: name, type, scripts, dependencies (@tanstack/*, react, convex, @nutricodex/backend workspace:*) |
| FR-2.2 | sub-04 | tests/verify-scaffold-test.sh | web tsconfig.json: extends react config, path aliases @/* |
| FR-2.3 | sub-04 | tests/verify-scaffold-test.sh | Routing skeleton: __root.tsx (Outlet), index.tsx (NutriCodex placeholder) |
| FR-2.4 | sub-04 | tests/verify-scaffold-test.sh | Tailwind CSS v4: globals.css (tailwindcss import), vite.config.ts (tailwind plugin) |
| FR-2.5 | sub-04 | tests/verify-scaffold-test.sh | ShadCN: components.json (aliases), utils.ts (clsx, twMerge), components/ui directory |
| FR-2.6 | sub-04 | tests/verify-scaffold-test.sh | Workspace dependency: @nutricodex/backend uses workspace: protocol |
| FR-2.7 | sub-05 | tests/verify-scaffold-test.sh | Auth scaffolding: auth-client.ts (createAuthClient, convexClient), auth-server.ts (convexBetterAuthReactStart, handler, getToken), $.ts (createAPIFileRoute, handler) |
| FR-2.8 | sub-04 | tests/verify-scaffold-test.sh | vite.config.ts: ssr.noExternal configured |
| FR-3.1 | sub-06 | tests/verify-scaffold-test.sh | mobile package.json: name, main (expo-router/entry), scripts |
| FR-3.2 | sub-06 | tests/verify-scaffold-test.sh | mobile dependencies: expo, expo-router, react-native |
| FR-3.3 | sub-06 | tests/verify-scaffold-test.sh | Routing skeleton: _layout.tsx (ConvexProvider), index.tsx (NutriCodex) |
| FR-3.4 | sub-06 | tests/verify-scaffold-test.sh | Uniwind: metro.config.js (getDefaultConfig, withUniwindConfig), global.css (tailwindcss, uniwind) |
| FR-3.5 | sub-06 | tests/verify-scaffold-test.sh | RN Reusables: @rn-primitives/portal dependency, PortalHost in _layout.tsx |
| FR-3.6 | sub-06 | tests/verify-scaffold-test.sh | Workspace dependency: @nutricodex/backend uses workspace: protocol |
| FR-3.7 | sub-06 | tests/verify-scaffold-test.sh | mobile tsconfig.json: extends react-native config |
| FR-3.8 | sub-06 | tests/verify-scaffold-test.sh | app.json: name NutriCodex, slug nutricodex, platforms [ios, android], scheme |
| FR-6.1-6.8 | sub-01 | tests/verify-scaffold-test.sh | Root scripts: dev, dev:web, dev:mobile, dev:backend, build, lint, type-check, format |
| FR-7.1 | sub-07 | tests/verify-scaffold-test.sh | CI workflow: triggers (push, pull_request), steps (checkout, setup-bun, install, lint, type-check, build) |
| NFR-1 | sub-07 | tests/verify-scaffold-test.sh | Turborepo cache: second build completes quickly with cache hit |
| NFR-2 | sub-07 | tests/verify-scaffold-test.sh | TypeScript strictness: bun run type-check exits 0 |
| NFR-5 | sub-07 | tests/verify-scaffold-test.sh | Build: bun run build succeeds |
| NFR-6 | sub-07 | tests/verify-scaffold-test.sh | Biome: bun run lint passes |

## Coverage Goals

### What is covered by these tests

- **File existence**: Every file specified in the architecture's directory structure is verified to exist.
- **JSON validity**: All JSON configuration files (package.json, tsconfig.json, biome.json, turbo.json, components.json, app.json) are parsed and validated.
- **Configuration correctness**: Key fields in all configuration files are verified against the architecture specification (package names, dependency versions, compiler options, task definitions, etc.).
- **Source file contents**: Key imports and exports in TypeScript/JavaScript source files are verified via string matching (Convex provider re-exports, auth helpers, routing components, etc.).
- **Workspace dependency resolution**: Both apps declare @nutricodex/backend with workspace: protocol; bun install succeeds.
- **Toolchain execution**: bun install, bun run lint, bun run type-check, and bun run build are all executed and their exit codes are verified.
- **Turborepo caching**: A second build is run to verify cache hits (NFR-1).
- **Task graph validity**: Turborepo dry-run is used to validate the task dependency graph.

### What is explicitly deferred and why

- **Dev server startup tests** (FR-2.1, FR-3.1, FR-6.1-6.4): Starting dev servers (Vite, Expo Metro, Convex) requires network access, running processes, and environment variables. These are interactive and cannot be reliably tested in a CI-like verification script.
- **Browser/simulator rendering** (FR-2.3, FR-2.4, FR-3.2, FR-3.3, FR-3.4, NFR-4): Verifying that routes render correctly in a browser or that Expo Go displays the app requires e2e testing infrastructure not in scope.
- **ShadCN component installation** (FR-2.5): Verifying that `bunx shadcn@latest add button` works requires running the ShadCN CLI, which modifies the project. Deferred to manual verification.
- **Convex dev initialization** (FR-4.2): Requires a Convex deployment and environment variables. Cannot be tested offline.
- **Auth flow functionality** (FR-2.7): Auth files are scaffolded but not functional until Convex is deployed. Only structural checks are performed.
- **Expo Go compatibility** (NFR-4): Requires a physical device or simulator. Cannot be automated in this script.
- **Node.js deployment** (NFR-5): Building produces artifacts; verifying they start with `node` requires running the server.

## Running Tests

### Run all verification tests

```bash
# From the project root
chmod +x tests/verify-scaffold-test.sh
./tests/verify-scaffold-test.sh
```

### Run only the static checks (no toolchain execution)

The script does not currently support partial execution modes. To skip toolchain execution, you can comment out the relevant sections at the bottom of the script (sections titled "Toolchain Execution" and "Turborepo Cache Verification").

### Understanding the output

- **PASS**: The check succeeded. The file/config/value matches expectations.
- **FAIL**: The check failed. The expected condition was not met.
- **WARN**: A non-critical issue was detected (e.g., could not confirm Turborepo cache hit text).
- **SKIP**: The check was skipped due to a prerequisite failure (e.g., build failed, so cache test was skipped).

The script exits with code 0 if all checks pass, and code 1 if any check fails.
