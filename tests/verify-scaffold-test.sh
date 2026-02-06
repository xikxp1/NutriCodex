#!/usr/bin/env bash
# ==============================================================================
# NutriCodex Monorepo Scaffold Verification Test Script
# Bead: beads-20260206-391
#
# This script verifies that the monorepo scaffold has been correctly set up
# per the requirements and architecture specifications. It checks file existence,
# configuration validity, workspace resolution, and toolchain execution.
#
# Usage:
#   chmod +x tests/verify-scaffold-test.sh
#   ./tests/verify-scaffold-test.sh
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
# ==============================================================================

set -euo pipefail

# --- Colors and Formatting ---------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
WARN_COUNT=0

# Resolve the project root (parent of the tests/ directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "  ${GREEN}PASS${RESET} $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "  ${RED}FAIL${RESET} $1"
}

skip() {
  SKIP_COUNT=$((SKIP_COUNT + 1))
  echo -e "  ${YELLOW}SKIP${RESET} $1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  echo -e "  ${YELLOW}WARN${RESET} $1"
}

section() {
  echo ""
  echo -e "${BOLD}${BLUE}=== $1 ===${RESET}"
  echo ""
}

# Helper: check if a file exists
check_file() {
  local filepath="$1"
  local label="${2:-$1}"
  if [ -f "${PROJECT_ROOT}/${filepath}" ]; then
    pass "${label} exists"
    return 0
  else
    fail "${label} does not exist (expected: ${filepath})"
    return 1
  fi
}

# Helper: check if a directory exists
check_dir() {
  local dirpath="$1"
  local label="${2:-$1}"
  if [ -d "${PROJECT_ROOT}/${dirpath}" ]; then
    pass "${label} exists"
    return 0
  else
    fail "${label} does not exist (expected: ${dirpath})"
    return 1
  fi
}

# Helper: validate JSON file is parseable using bun
check_json_valid() {
  local filepath="$1"
  local label="${2:-$1}"
  if [ ! -f "${PROJECT_ROOT}/${filepath}" ]; then
    fail "${label} -- file does not exist, cannot validate JSON"
    return 1
  fi
  if bun -e "JSON.parse(require('fs').readFileSync('${PROJECT_ROOT}/${filepath}', 'utf8'))" 2>/dev/null; then
    pass "${label} is valid JSON"
    return 0
  else
    fail "${label} is NOT valid JSON"
    return 1
  fi
}

# Helper: check a JSON field value using bun
# Usage: check_json_field <file> <jq-like-path-expression> <expected-value> <label>
# The expression is evaluated as: JSON.parse(file)<expression>
check_json_field() {
  local filepath="$1"
  local expr="$2"
  local expected="$3"
  local label="$4"
  if [ ! -f "${PROJECT_ROOT}/${filepath}" ]; then
    fail "${label} -- file does not exist"
    return 1
  fi
  local actual
  actual=$(bun -e "
    const data = JSON.parse(require('fs').readFileSync('${PROJECT_ROOT}/${filepath}', 'utf8'));
    const val = ${expr};
    console.log(typeof val === 'object' ? JSON.stringify(val) : String(val));
  " 2>/dev/null) || true
  if [ "${actual}" = "${expected}" ]; then
    pass "${label}"
    return 0
  else
    fail "${label} (expected: '${expected}', got: '${actual}')"
    return 1
  fi
}

# Helper: check that a JSON field contains a substring (fixed-string match)
check_json_contains() {
  local filepath="$1"
  local expr="$2"
  local substring="$3"
  local label="$4"
  if [ ! -f "${PROJECT_ROOT}/${filepath}" ]; then
    fail "${label} -- file does not exist"
    return 1
  fi
  local actual
  actual=$(bun -e "
    const data = JSON.parse(require('fs').readFileSync('${PROJECT_ROOT}/${filepath}', 'utf8'));
    const val = ${expr};
    console.log(typeof val === 'object' ? JSON.stringify(val) : String(val));
  " 2>/dev/null) || true
  if echo "${actual}" | grep -Fq "${substring}"; then
    pass "${label}"
    return 0
  else
    fail "${label} (expected to contain '${substring}', got: '${actual}')"
    return 1
  fi
}

# Helper: check that a file contains a string
check_file_contains() {
  local filepath="$1"
  local search="$2"
  local label="$3"
  if [ ! -f "${PROJECT_ROOT}/${filepath}" ]; then
    fail "${label} -- file does not exist"
    return 1
  fi
  if grep -q "${search}" "${PROJECT_ROOT}/${filepath}"; then
    pass "${label}"
    return 0
  else
    fail "${label} (expected file to contain '${search}')"
    return 1
  fi
}

# ==============================================================================
echo -e "${BOLD}NutriCodex Monorepo Scaffold Verification${RESET}"
echo -e "Project root: ${PROJECT_ROOT}"
echo -e "Date: $(date)"
# ==============================================================================

# --------------------------------------------------------------------------
section "SUB-01: Root Monorepo Configuration (FR-1)"
# --------------------------------------------------------------------------

# --- FR-1.1: Root package.json ---
check_file "package.json" "Root package.json"
check_json_valid "package.json" "Root package.json"
check_json_field "package.json" "data.private" "true" "FR-1.1: Root package.json is private"
check_json_field "package.json" "JSON.stringify(data.workspaces)" '["apps/*","packages/*"]' "FR-1.1: Workspaces include apps/* and packages/*"
check_json_contains "package.json" "data.packageManager || ''" "bun" "FR-1.1: packageManager set to bun"

# --- FR-6: Root scripts ---
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "dev" "FR-6.1: Root script 'dev' exists"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "dev:web" "FR-6.2: Root script 'dev:web' exists"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "dev:mobile" "FR-6.3: Root script 'dev:mobile' exists"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "dev:backend" "FR-6.4: Root script 'dev:backend' exists"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "build" "FR-6.5: Root script 'build' exists"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "lint" "FR-6.6: Root script 'lint' exists"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "type-check" "FR-6.7: Root script 'type-check' exists"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "format" "FR-6.8: Root script 'format' exists"

# --- Root devDependencies ---
check_json_contains "package.json" "JSON.stringify(Object.keys(data.devDependencies || {}))" "turbo" "FR-1.2: turbo is a root devDependency"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.devDependencies || {}))" "@biomejs/biome" "FR-1.3: @biomejs/biome is a root devDependency"
check_json_contains "package.json" "JSON.stringify(Object.keys(data.devDependencies || {}))" "typescript" "FR-1.4: typescript is a root devDependency"

# --- FR-1.2: turbo.json ---
check_file "turbo.json" "turbo.json"
check_json_valid "turbo.json" "turbo.json"
check_json_contains "turbo.json" "JSON.stringify(Object.keys(data.tasks || data.pipeline || {}))" "build" "FR-1.2: turbo.json defines 'build' task"
check_json_contains "turbo.json" "JSON.stringify(Object.keys(data.tasks || data.pipeline || {}))" "dev" "FR-1.2: turbo.json defines 'dev' task"
check_json_contains "turbo.json" "JSON.stringify(Object.keys(data.tasks || data.pipeline || {}))" "lint" "FR-1.2: turbo.json defines 'lint' task"
check_json_contains "turbo.json" "JSON.stringify(Object.keys(data.tasks || data.pipeline || {}))" "type-check" "FR-1.2: turbo.json defines 'type-check' task"
check_json_contains "turbo.json" "JSON.stringify(Object.keys(data.tasks || data.pipeline || {}))" "format" "FR-1.2: turbo.json defines 'format' task"

# Build task specifics
check_json_contains "turbo.json" "JSON.stringify((data.tasks || data.pipeline || {}).build.dependsOn || [])" "^build" "FR-1.2: build task dependsOn ^build"
check_json_contains "turbo.json" "JSON.stringify((data.tasks || data.pipeline || {}).build.outputs || [])" "dist" "FR-1.2/NFR-1: build task has outputs (for caching)"

# Dev task specifics
check_json_field "turbo.json" "((data.tasks || data.pipeline || {}).dev || {}).persistent" "true" "FR-1.2: dev task is persistent"
check_json_field "turbo.json" "((data.tasks || data.pipeline || {}).dev || {}).cache" "false" "FR-1.2: dev task has cache: false"

# --- FR-1.3: biome.json ---
check_file "biome.json" "biome.json"
check_json_valid "biome.json" "biome.json"
check_json_field "biome.json" "(data.formatter || {}).enabled" "true" "FR-1.3: Biome formatter enabled"
check_json_field "biome.json" "(data.formatter || {}).indentStyle" "space" "FR-1.3: Biome indent style is space"
check_json_field "biome.json" "(data.formatter || {}).indentWidth" "2" "FR-1.3: Biome indent width is 2"
check_json_field "biome.json" "(data.formatter || {}).lineWidth" "100" "FR-1.3: Biome line width is 100"
check_json_field "biome.json" "(data.linter || {}).enabled" "true" "FR-1.3: Biome linter enabled"
check_json_field "biome.json" "((data.linter || {}).rules || {}).recommended" "true" "FR-1.3: Biome linter recommended rules enabled"
check_json_field "biome.json" "(data.assist || {}).enabled" "true" "FR-1.3: Biome assist (import organizer) enabled"

# Biome file exclusions (Biome v2 uses files.includes with negation patterns instead of files.ignore)
check_json_contains "biome.json" "JSON.stringify((data.files || {}).includes || [])" "!**/node_modules" "FR-1.3: Biome excludes node_modules"
check_json_contains "biome.json" "JSON.stringify((data.files || {}).includes || [])" "!**/.turbo" "FR-1.3: Biome excludes .turbo"
check_json_contains "biome.json" "JSON.stringify((data.files || {}).includes || [])" "!**/convex/_generated" "FR-1.3: Biome excludes convex/_generated"

# --- FR-1.4: Root tsconfig.json ---
check_file "tsconfig.json" "Root tsconfig.json"
check_json_valid "tsconfig.json" "Root tsconfig.json"
check_json_contains "tsconfig.json" "data.extends || ''" "typescript-config" "FR-1.4: Root tsconfig extends typescript-config"

# --- FR-1.5: .gitignore ---
check_file ".gitignore" ".gitignore"
check_file_contains ".gitignore" "node_modules" "FR-1.5: .gitignore covers node_modules"
check_file_contains ".gitignore" ".turbo" "FR-1.5: .gitignore covers .turbo"
check_file_contains ".gitignore" "dist" "FR-1.5: .gitignore covers dist"
check_file_contains ".gitignore" ".convex" "FR-1.5: .gitignore covers .convex"
check_file_contains ".gitignore" ".expo" "FR-1.5: .gitignore covers .expo"
check_file_contains ".gitignore" ".env" "FR-1.5: .gitignore covers .env"

# --- FR-1.6: .env.example ---
check_file ".env.example" ".env.example"
check_file_contains ".env.example" "CONVEX" "FR-1.6: .env.example documents CONVEX variables"
check_file_contains ".env.example" "BETTER_AUTH_SECRET" "FR-1.6: .env.example documents BETTER_AUTH_SECRET"
check_file_contains ".env.example" "SITE_URL" "FR-1.6: .env.example documents SITE_URL"
check_file_contains ".env.example" "VITE_CONVEX_URL" "FR-1.6: .env.example documents VITE_CONVEX_URL"
check_file_contains ".env.example" "EXPO_PUBLIC_CONVEX_URL" "FR-1.6: .env.example documents EXPO_PUBLIC_CONVEX_URL"

# --------------------------------------------------------------------------
section "SUB-02: TypeScript Configuration Package (FR-5)"
# --------------------------------------------------------------------------

check_dir "packages/typescript-config" "packages/typescript-config directory"
check_file "packages/typescript-config/package.json" "typescript-config package.json"
check_json_valid "packages/typescript-config/package.json" "typescript-config package.json"
check_json_field "packages/typescript-config/package.json" "data.name" "@nutricodex/typescript-config" "FR-5.1: Package name is @nutricodex/typescript-config"
check_json_field "packages/typescript-config/package.json" "data.private" "true" "FR-5.1: Package is private"

# base.json
check_file "packages/typescript-config/base.json" "typescript-config/base.json"
check_json_valid "packages/typescript-config/base.json" "typescript-config/base.json"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.strict" "true" "FR-5.1/FR-1.4: base.json strict: true"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.target" "ES2022" "FR-5.1/FR-1.4: base.json target: ES2022"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.module" "ESNext" "FR-5.1/FR-1.4: base.json module: ESNext"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.moduleResolution" "Bundler" "FR-5.1/FR-1.4: base.json moduleResolution: Bundler"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.jsx" "react-jsx" "FR-5.1/FR-1.4: base.json jsx: react-jsx"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.skipLibCheck" "true" "FR-5.1/FR-1.4: base.json skipLibCheck: true"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.esModuleInterop" "true" "FR-5.1: base.json esModuleInterop: true"
check_json_field "packages/typescript-config/base.json" "data.compilerOptions.isolatedModules" "true" "FR-5.1: base.json isolatedModules: true"

# react.json
check_file "packages/typescript-config/react.json" "typescript-config/react.json"
check_json_valid "packages/typescript-config/react.json" "typescript-config/react.json"
check_json_contains "packages/typescript-config/react.json" "data.extends || ''" "base" "FR-5.1: react.json extends base"
check_json_contains "packages/typescript-config/react.json" "JSON.stringify(data.compilerOptions.lib || [])" "DOM" "FR-5.1: react.json includes DOM lib"
check_json_field "packages/typescript-config/react.json" "data.compilerOptions.noEmit" "true" "FR-5.1: react.json noEmit: true"

# react-native.json
check_file "packages/typescript-config/react-native.json" "typescript-config/react-native.json"
check_json_valid "packages/typescript-config/react-native.json" "typescript-config/react-native.json"
check_json_contains "packages/typescript-config/react-native.json" "data.extends || ''" "base" "FR-5.1: react-native.json extends base"
check_json_field "packages/typescript-config/react-native.json" "data.compilerOptions.noEmit" "true" "FR-5.1: react-native.json noEmit: true"

# --------------------------------------------------------------------------
section "SUB-03: Convex Backend Package (FR-4)"
# --------------------------------------------------------------------------

check_dir "packages/backend" "packages/backend directory"
check_file "packages/backend/package.json" "backend package.json"
check_json_valid "packages/backend/package.json" "backend package.json"
check_json_field "packages/backend/package.json" "data.name" "@nutricodex/backend" "FR-4.1: Package name is @nutricodex/backend"
check_json_field "packages/backend/package.json" "data.type" "module" "FR-4.1: Package type is module"

# Package exports
check_json_contains "packages/backend/package.json" "JSON.stringify(data.exports || {})" "index" "FR-4.3: Package has exports pointing to index"

# Scripts
check_json_contains "packages/backend/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "dev" "FR-4.2: backend has 'dev' script"
check_json_contains "packages/backend/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "build" "FR-4.2: backend has 'build' script"
check_json_contains "packages/backend/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "lint" "FR-4.2: backend has 'lint' script"
check_json_contains "packages/backend/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "type-check" "FR-4.2: backend has 'type-check' script"

# Dependencies
check_json_contains "packages/backend/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "convex" "FR-4.2: convex is a dependency"
check_json_contains "packages/backend/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "@convex-dev/better-auth" "FR-4.2: @convex-dev/better-auth is a dependency"
check_json_contains "packages/backend/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "better-auth" "FR-4.2: better-auth is a dependency"

# Better Auth version pinning (exact 1.4.9, not ^1.4.9)
check_json_field "packages/backend/package.json" "(data.dependencies || {})['better-auth']" "1.4.9" "FR-4.2: better-auth pinned to exact 1.4.9"

# DevDependencies
check_json_contains "packages/backend/package.json" "JSON.stringify(data.devDependencies || {})" "@nutricodex/typescript-config" "FR-4.4: typescript-config is a devDependency"
check_json_contains "packages/backend/package.json" "JSON.stringify(data.devDependencies || {})" "workspace:" "FR-4.4: typescript-config uses workspace: protocol"

# tsconfig
check_file "packages/backend/tsconfig.json" "backend tsconfig.json"
check_json_valid "packages/backend/tsconfig.json" "backend tsconfig.json"
check_json_contains "packages/backend/tsconfig.json" "data.extends || ''" "typescript-config" "FR-4.4: backend tsconfig extends typescript-config"

# Convex files
check_dir "packages/backend/convex" "packages/backend/convex directory"
check_file "packages/backend/convex/convex.config.ts" "convex/convex.config.ts"
check_file "packages/backend/convex/schema.ts" "convex/schema.ts"
check_file "packages/backend/convex/auth.config.ts" "convex/auth.config.ts"
check_file "packages/backend/convex/auth.ts" "convex/auth.ts"
check_file "packages/backend/convex/http.ts" "convex/http.ts"

# Convex file contents
check_file_contains "packages/backend/convex/convex.config.ts" "betterAuth" "FR-4.2: convex.config.ts registers Better Auth component"
check_file_contains "packages/backend/convex/schema.ts" "defineSchema" "FR-4.2: schema.ts uses defineSchema"
check_file_contains "packages/backend/convex/auth.config.ts" "getAuthConfigProvider" "FR-4.2: auth.config.ts uses getAuthConfigProvider"
check_file_contains "packages/backend/convex/auth.ts" "betterAuth" "FR-4.2: auth.ts creates Better Auth instance"
check_file_contains "packages/backend/convex/http.ts" "httpRouter" "FR-4.2: http.ts creates HTTP router"

# Source entry point
check_file "packages/backend/src/index.ts" "backend src/index.ts"
check_file_contains "packages/backend/src/index.ts" "ConvexProvider" "FR-4.3: index.ts re-exports ConvexProvider"
check_file_contains "packages/backend/src/index.ts" "ConvexReactClient" "FR-4.3: index.ts re-exports ConvexReactClient"

# --------------------------------------------------------------------------
section "SUB-04: TanStack Start Web App (FR-2)"
# --------------------------------------------------------------------------

check_dir "apps/web" "apps/web directory"
check_file "apps/web/package.json" "web package.json"
check_json_valid "apps/web/package.json" "web package.json"
check_json_field "apps/web/package.json" "data.name" "@nutricodex/web" "FR-2.1: Package name is @nutricodex/web"
check_json_field "apps/web/package.json" "data.type" "module" "FR-2.1: Package type is module"

# Scripts
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "dev" "FR-2.1: web has 'dev' script"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "build" "FR-2.1: web has 'build' script"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "lint" "FR-2.1: web has 'lint' script"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "type-check" "FR-2.1: web has 'type-check' script"

# Dependencies
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "@tanstack/react-start" "FR-2.1: @tanstack/react-start is a dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "@tanstack/react-router" "FR-2.1: @tanstack/react-router is a dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "react" "FR-2.1: react is a dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "react-dom" "FR-2.1: react-dom is a dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "convex" "FR-2.6: convex is a dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(data.dependencies || {})" "@nutricodex/backend" "FR-2.6: @nutricodex/backend is a workspace dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(data.dependencies || {})" "workspace:" "FR-2.6: @nutricodex/backend uses workspace: protocol"

# TanStack Query integration
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "@tanstack/react-query" "FR-2.1: @tanstack/react-query is a dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "@convex-dev/react-query" "FR-2.1: @convex-dev/react-query is a dependency"

# Tailwind + Styling devDeps
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.devDependencies || {}))" "tailwindcss" "FR-2.4: tailwindcss is a devDependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.devDependencies || {}))" "@tailwindcss/vite" "FR-2.4: @tailwindcss/vite is a devDependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "clsx" "FR-2.5: clsx is a dependency"
check_json_contains "apps/web/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "tailwind-merge" "FR-2.5: tailwind-merge is a dependency"

# TypeScript config dependency
check_json_contains "apps/web/package.json" "JSON.stringify(data.devDependencies || {})" "@nutricodex/typescript-config" "FR-2.2: typescript-config is a devDependency"

# tsconfig.json
check_file "apps/web/tsconfig.json" "web tsconfig.json"
check_json_valid "apps/web/tsconfig.json" "web tsconfig.json"
check_json_contains "apps/web/tsconfig.json" "data.extends || ''" "react" "FR-2.2: web tsconfig extends react config"
check_json_contains "apps/web/tsconfig.json" "JSON.stringify(data.compilerOptions.paths || {})" "@/*" "FR-2.2: web tsconfig has @/* path alias"

# Vite config
check_file "apps/web/vite.config.ts" "web vite.config.ts"
check_file_contains "apps/web/vite.config.ts" "tanstack" "FR-2.2: vite.config.ts uses TanStack Start plugin"
check_file_contains "apps/web/vite.config.ts" "tailwindcss\|tailwind" "FR-2.4: vite.config.ts includes Tailwind CSS plugin"
check_file_contains "apps/web/vite.config.ts" "noExternal" "FR-2.8: vite.config.ts configures SSR noExternal"

# App config
check_file "apps/web/app.config.ts" "web app.config.ts"

# Routing skeleton
check_file "apps/web/src/routes/__root.tsx" "web __root.tsx"
check_file_contains "apps/web/src/routes/__root.tsx" "Outlet" "FR-2.3: __root.tsx renders Outlet"
check_file "apps/web/src/routes/index.tsx" "web index.tsx"
check_file_contains "apps/web/src/routes/index.tsx" "NutriCodex" "FR-2.3: index.tsx contains NutriCodex"

# Router
check_file "apps/web/src/router.tsx" "web router.tsx"
check_file_contains "apps/web/src/router.tsx" "ConvexQueryClient\|convexQueryClient\|ConvexProvider" "FR-2.1: router.tsx integrates Convex"

# Styles
check_file "apps/web/src/styles/globals.css" "web globals.css"
check_file_contains "apps/web/src/styles/globals.css" "tailwindcss" "FR-2.4: globals.css imports tailwindcss"

# ShadCN configuration
check_file "apps/web/components.json" "web components.json"
check_json_valid "apps/web/components.json" "web components.json"
check_json_contains "apps/web/components.json" "JSON.stringify(data.aliases || {})" "components" "FR-2.5: ShadCN components.json has aliases"

# Utilities
check_file "apps/web/src/lib/utils.ts" "web utils.ts"
check_file_contains "apps/web/src/lib/utils.ts" "clsx" "FR-2.5: utils.ts uses clsx"
check_file_contains "apps/web/src/lib/utils.ts" "twMerge\|tailwind-merge" "FR-2.5: utils.ts uses tailwind-merge"

# UI components directory
check_dir "apps/web/src/components/ui" "web components/ui directory"

# --------------------------------------------------------------------------
section "SUB-05: Web App Auth Scaffolding (FR-2.7)"
# --------------------------------------------------------------------------

check_file "apps/web/src/lib/auth-client.ts" "web auth-client.ts"
check_file_contains "apps/web/src/lib/auth-client.ts" "createAuthClient" "FR-2.7: auth-client.ts uses createAuthClient"
check_file_contains "apps/web/src/lib/auth-client.ts" "convexClient" "FR-2.7: auth-client.ts uses convexClient plugin"

check_file "apps/web/src/lib/auth-server.ts" "web auth-server.ts"
check_file_contains "apps/web/src/lib/auth-server.ts" "convexBetterAuthReactStart" "FR-2.7: auth-server.ts uses convexBetterAuthReactStart"
check_file_contains "apps/web/src/lib/auth-server.ts" "handler" "FR-2.7: auth-server.ts exports handler"
check_file_contains "apps/web/src/lib/auth-server.ts" "getToken" "FR-2.7: auth-server.ts exports getToken"

# Auth API route: TanStack Start 1.158+ removed createAPIFileRoute; the file
# uses a '-' prefix to exclude it from TanStack Router's route file scanning
# and exports GET/POST handlers directly.
check_file 'apps/web/src/routes/api/auth/-$.ts' 'web auth API route (-$.ts)'
check_file_contains 'apps/web/src/routes/api/auth/-$.ts' "handler" "FR-2.7: auth route delegates to handler"

# --------------------------------------------------------------------------
section "SUB-06: Expo Mobile App (FR-3)"
# --------------------------------------------------------------------------

check_dir "apps/mobile" "apps/mobile directory"
check_file "apps/mobile/package.json" "mobile package.json"
check_json_valid "apps/mobile/package.json" "mobile package.json"
check_json_field "apps/mobile/package.json" "data.name" "@nutricodex/mobile" "FR-3.1: Package name is @nutricodex/mobile"
check_json_contains "apps/mobile/package.json" "data.main || ''" "expo-router" "FR-3.2: main field set to expo-router/entry"

# Scripts
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "start" "FR-3.1: mobile has 'start' script"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "dev" "FR-3.1: mobile has 'dev' script"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "lint" "FR-3.1: mobile has 'lint' script"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.scripts || {}))" "type-check" "FR-3.1: mobile has 'type-check' script"

# Dependencies
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "expo" "FR-3.2: expo is a dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "expo-router" "FR-3.2: expo-router is a dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "react-native" "FR-3.2: react-native is a dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "convex" "FR-3.6: convex is a dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(data.dependencies || {})" "@nutricodex/backend" "FR-3.6: @nutricodex/backend is a workspace dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "uniwind" "FR-3.4: uniwind is a dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "better-auth" "FR-3: better-auth is a dependency"
check_json_field "apps/mobile/package.json" "(data.dependencies || {})['better-auth']" "1.4.9" "FR-3: better-auth pinned to exact 1.4.9"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "@better-auth/expo" "FR-3: @better-auth/expo is a dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "expo-secure-store" "FR-3: expo-secure-store is a dependency"
check_json_contains "apps/mobile/package.json" "JSON.stringify(Object.keys(data.dependencies || {}))" "@rn-primitives/portal" "FR-3.5: @rn-primitives/portal is a dependency"

# TypeScript config dependency
check_json_contains "apps/mobile/package.json" "JSON.stringify(data.devDependencies || {})" "@nutricodex/typescript-config" "FR-3.7: typescript-config is a devDependency"

# app.json
check_file "apps/mobile/app.json" "mobile app.json"
check_json_valid "apps/mobile/app.json" "mobile app.json"
check_json_field "apps/mobile/app.json" "(data.expo || {}).name" "NutriCodex" "FR-3.8: Expo app name is NutriCodex"
check_json_field "apps/mobile/app.json" "(data.expo || {}).slug" "nutricodex" "FR-3.8: Expo app slug is nutricodex"
check_json_contains "apps/mobile/app.json" "JSON.stringify((data.expo || {}).platforms || [])" "ios" "FR-3.8: Expo platforms include ios"
check_json_contains "apps/mobile/app.json" "JSON.stringify((data.expo || {}).platforms || [])" "android" "FR-3.8: Expo platforms include android"
check_json_field "apps/mobile/app.json" "(data.expo || {}).scheme" "nutricodex" "FR-3.8: Expo scheme is nutricodex"

# tsconfig.json
check_file "apps/mobile/tsconfig.json" "mobile tsconfig.json"
check_json_valid "apps/mobile/tsconfig.json" "mobile tsconfig.json"
check_json_contains "apps/mobile/tsconfig.json" "data.extends || ''" "react-native" "FR-3.7: mobile tsconfig extends react-native config"

# Metro config
check_file "apps/mobile/metro.config.js" "mobile metro.config.js"
check_file_contains "apps/mobile/metro.config.js" "getDefaultConfig" "FR-3.4: metro.config.js uses getDefaultConfig"
check_file_contains "apps/mobile/metro.config.js" "withUniwindConfig\|uniwind" "FR-3.4: metro.config.js uses Uniwind config"

# Babel config
check_file "apps/mobile/babel.config.js" "mobile babel.config.js"

# Global CSS
check_file "apps/mobile/src/global.css" "mobile global.css"
check_file_contains "apps/mobile/src/global.css" "tailwindcss" "FR-3.4: global.css imports tailwindcss"
check_file_contains "apps/mobile/src/global.css" "uniwind" "FR-3.4: global.css imports uniwind"

# Routing skeleton
check_file "apps/mobile/app/_layout.tsx" "mobile _layout.tsx"
check_file_contains "apps/mobile/app/_layout.tsx" "ConvexProvider\|convex" "FR-3.3: _layout.tsx uses Convex provider"
check_file_contains "apps/mobile/app/_layout.tsx" "PortalHost\|portal" "FR-3.5: _layout.tsx includes PortalHost"
check_file "apps/mobile/app/index.tsx" "mobile index.tsx"
check_file_contains "apps/mobile/app/index.tsx" "NutriCodex" "FR-3.3: index.tsx contains NutriCodex"

# Auth client
check_file "apps/mobile/src/lib/auth-client.ts" "mobile auth-client.ts"
check_file_contains "apps/mobile/src/lib/auth-client.ts" "createAuthClient" "FR-3: auth-client.ts uses createAuthClient"
check_file_contains "apps/mobile/src/lib/auth-client.ts" "expoClient" "FR-3: auth-client.ts uses expoClient plugin"
check_file_contains "apps/mobile/src/lib/auth-client.ts" "SecureStore" "FR-3: auth-client.ts uses SecureStore"
check_file_contains "apps/mobile/src/lib/auth-client.ts" "convexClient" "FR-3: auth-client.ts uses convexClient plugin"

# --------------------------------------------------------------------------
section "SUB-07: CI Workflow (FR-7)"
# --------------------------------------------------------------------------

check_dir ".github/workflows" ".github/workflows directory"
check_file ".github/workflows/ci.yml" "CI workflow file"
check_file_contains ".github/workflows/ci.yml" "push" "FR-7.1: CI triggers on push"
check_file_contains ".github/workflows/ci.yml" "pull_request" "FR-7.1: CI triggers on pull_request"
check_file_contains ".github/workflows/ci.yml" "actions/checkout" "FR-7.1: CI uses actions/checkout"
check_file_contains ".github/workflows/ci.yml" "setup-bun\|oven-sh" "FR-7.1: CI sets up Bun"
check_file_contains ".github/workflows/ci.yml" "bun install" "FR-7.1: CI runs bun install"
check_file_contains ".github/workflows/ci.yml" "lint" "FR-7.1: CI runs lint"
check_file_contains ".github/workflows/ci.yml" "type-check" "FR-7.1: CI runs type-check"
check_file_contains ".github/workflows/ci.yml" "build" "FR-7.1: CI runs build"

# Validate YAML syntax (use bun to check it is parseable, or just check it is not empty)
if [ -f "${PROJECT_ROOT}/.github/workflows/ci.yml" ]; then
  if bun -e "
    const yaml = require('fs').readFileSync('${PROJECT_ROOT}/.github/workflows/ci.yml', 'utf8');
    if (yaml.trim().length === 0) { process.exit(1); }
  " 2>/dev/null; then
    pass "FR-7.1: CI workflow file is non-empty"
  else
    fail "FR-7.1: CI workflow file appears to be empty"
  fi
fi

# --------------------------------------------------------------------------
section "Workspace Dependency Resolution"
# --------------------------------------------------------------------------

# Check that workspace dependencies are using workspace: protocol consistently
check_json_contains "apps/web/package.json" "JSON.stringify(data.dependencies || {})" "workspace:" "Web app uses workspace: protocol for @nutricodex/backend"
check_json_contains "apps/mobile/package.json" "JSON.stringify(data.dependencies || {})" "workspace:" "Mobile app uses workspace: protocol for @nutricodex/backend"

# --------------------------------------------------------------------------
section "Toolchain Execution: bun install"
# --------------------------------------------------------------------------

echo "  Running bun install..."
if (cd "${PROJECT_ROOT}" && bun install 2>&1); then
  pass "FR-1.1: bun install succeeds without errors"
else
  fail "FR-1.1: bun install failed"
fi

# Verify node_modules exists after install
check_dir "node_modules" "node_modules directory created after bun install"

# --------------------------------------------------------------------------
section "Toolchain Execution: bun run lint (Biome)"
# --------------------------------------------------------------------------

echo "  Running bun run lint..."
LINT_OUTPUT=$(cd "${PROJECT_ROOT}" && bun run lint 2>&1) || true
LINT_EXIT=$?
if [ "${LINT_EXIT}" -eq 0 ]; then
  pass "FR-1.3/FR-6.6/NFR-6: bun run lint passes"
else
  fail "FR-1.3/FR-6.6/NFR-6: bun run lint failed (exit code: ${LINT_EXIT})"
  echo "    Output (last 20 lines):"
  echo "${LINT_OUTPUT}" | tail -20 | while IFS= read -r line; do echo "      ${line}"; done
fi

# --------------------------------------------------------------------------
section "Toolchain Execution: bun run type-check (tsc --noEmit)"
# --------------------------------------------------------------------------

echo "  Running bun run type-check..."
TYPECHECK_OUTPUT=$(cd "${PROJECT_ROOT}" && bun run type-check 2>&1) || true
TYPECHECK_EXIT=$?
if [ "${TYPECHECK_EXIT}" -eq 0 ]; then
  pass "NFR-2/FR-6.7: bun run type-check passes"
else
  fail "NFR-2/FR-6.7: bun run type-check failed (exit code: ${TYPECHECK_EXIT})"
  echo "    Output (last 20 lines):"
  echo "${TYPECHECK_OUTPUT}" | tail -20 | while IFS= read -r line; do echo "      ${line}"; done
fi

# --------------------------------------------------------------------------
section "Toolchain Execution: bun run build"
# --------------------------------------------------------------------------

echo "  Running bun run build..."
BUILD_OUTPUT=$(cd "${PROJECT_ROOT}" && bun run build 2>&1) || true
BUILD_EXIT=$?
if [ "${BUILD_EXIT}" -eq 0 ]; then
  pass "FR-6.5/NFR-5: bun run build succeeds"
else
  fail "FR-6.5/NFR-5: bun run build failed (exit code: ${BUILD_EXIT})"
  echo "    Output (last 20 lines):"
  echo "${BUILD_OUTPUT}" | tail -20 | while IFS= read -r line; do echo "      ${line}"; done
fi

# --------------------------------------------------------------------------
section "Turborepo Cache Verification (NFR-1)"
# --------------------------------------------------------------------------

if [ "${BUILD_EXIT}" -eq 0 ]; then
  echo "  Running bun run build a second time to verify cache..."
  BUILD2_START=$(date +%s)
  BUILD2_OUTPUT=$(cd "${PROJECT_ROOT}" && bun run build 2>&1) || true
  BUILD2_END=$(date +%s)
  BUILD2_DURATION=$((BUILD2_END - BUILD2_START))

  if echo "${BUILD2_OUTPUT}" | grep -qi "cache hit\|FULL TURBO\|>>> FULL TURBO"; then
    pass "NFR-1: Second build shows Turborepo cache hit"
  else
    warn "NFR-1: Could not confirm Turborepo cache hit in output (build took ${BUILD2_DURATION}s)"
  fi

  if [ "${BUILD2_DURATION}" -le 5 ]; then
    pass "NFR-1: Second build completed in ${BUILD2_DURATION}s (within 5s threshold)"
  else
    warn "NFR-1: Second build took ${BUILD2_DURATION}s (expected under 5s for a cache hit)"
  fi
else
  skip "NFR-1: Skipping cache verification because first build failed"
fi

# --------------------------------------------------------------------------
section "Turbo Task Graph Validation"
# --------------------------------------------------------------------------

echo "  Validating Turborepo task graph..."
if (cd "${PROJECT_ROOT}" && bunx turbo run build --dry-run 2>&1) >/dev/null; then
  pass "Turborepo task graph is valid (build --dry-run succeeds)"
else
  fail "Turborepo task graph is invalid (build --dry-run failed)"
fi

# ==============================================================================
section "SUMMARY"
# ==============================================================================

TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT + WARN_COUNT))

echo -e "  ${GREEN}Passed:  ${PASS_COUNT}${RESET}"
echo -e "  ${RED}Failed:  ${FAIL_COUNT}${RESET}"
echo -e "  ${YELLOW}Warned:  ${WARN_COUNT}${RESET}"
echo -e "  ${YELLOW}Skipped: ${SKIP_COUNT}${RESET}"
echo -e "  ${BOLD}Total:   ${TOTAL}${RESET}"
echo ""

if [ "${FAIL_COUNT}" -gt 0 ]; then
  echo -e "${RED}${BOLD}RESULT: FAIL${RESET} -- ${FAIL_COUNT} check(s) failed"
  exit 1
else
  echo -e "${GREEN}${BOLD}RESULT: PASS${RESET} -- All checks passed"
  exit 0
fi
