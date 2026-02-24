# AGENTS.md — AI Agent Instructions

> Read this file before making any changes. It captures the conventions of this
> codebase so you don't need to rediscover them each session.

---

## 1. Project Overview

| Item | Detail |
|---|---|
| **Repo type** | Nx monorepo |
| **Language** | TypeScript (strict) |
| **Bundler / test runner** | Vite + Vitest |
| **Apps** | `apps/portal`, `apps/admin` |
| **Shared libs** | `libs/shared/env`, `libs/shared/state`, `libs/shared/ui`, `libs/shared/constants`, `libs/shared/utils` |

Apps are React SPAs. Shared libs are consumed via `@my-mono-fe/*` path aliases — **never** by relative cross-lib imports.

---

## 2. Architecture & Library Conventions

### tsconfig layout

Every library has **two** tsconfig files:

```
libs/shared/<name>/
  tsconfig.json          # references tsconfig.lib.json; no include/files
  tsconfig.lib.json      # real compiler options: rootDir, include, outDir …
  src/
    index.ts             # public API — only export from here
```

**`tsconfig.json` (all libs — do not change the shape):**
```json
{
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }],
  "extends": "../../../tsconfig.base.json"
}
```

**`tsconfig.lib.json` (mirror `shared/env` as the canonical pattern):**
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "types": ["node"],
    "rootDir": "src",
    "tsBuildInfoFile": "dist/tsconfig.lib.tsbuildinfo"
  },
  "exclude": ["out-tsc", "dist", "**/*.spec.*", "**/*.test.*", "eslint.config.*"],
  "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"]
}
```

> `rootDir` **must** match the scope of `include`. If all included files are
> inside `src/`, set `rootDir: "src"`. Setting it wider (e.g., `"../../"`) to
> silence an error means the include list is wrong — fix the include, not rootDir.

### Path aliases

`tsconfig.base.json` defines:

```json
"paths": {
  "@my-mono-fe/*":    ["libs/*/src"],
  "@/components/*":  ["libs/shared/ui/src/components/*"],
  "@/lib/utils":     ["libs/shared/ui/src/lib/utils.ts"]
}
```

- `@my-mono-fe/shared/env` → `libs/shared/env/src`
- `@my-mono-fe/shared/state` → `libs/shared/state/src`
- `@my-mono-fe/shared/ui` → `libs/shared/ui/src`
- `@my-mono-fe/shared/constants` → `libs/shared/constants/src`
- `@my-mono-fe/shared/utils` → `libs/shared/utils/src`

New libs under `libs/shared/<name>/src` are automatically covered by the glob — **no change to `tsconfig.base.json` is required**.

### What lives where

| Concern | Location | Import alias |
|---|---|---|
| Env/config validation (Zod) | `shared/env` | `@my-mono-fe/shared/env` |
| Redux store, RTK Query APIs | `shared/state` | `@my-mono-fe/shared/state` |
| UI components, Tailwind utils (`cn`) | `shared/ui` | `@my-mono-fe/shared/ui` or `@/lib/utils` |
| Cross-app constants (keys, names) | `shared/constants` | `@my-mono-fe/shared/constants` |
| Pure logic utilities (no DOM/React) | `shared/utils` | `@my-mono-fe/shared/utils` |
| Domain-specific types/constants | The domain lib itself | — |

---

## 3. Adding a New Shared Library — Checklist

1. **Create the folder:**
   ```
   libs/shared/<name>/src/
   ```

2. **`libs/shared/<name>/tsconfig.json`** — copy the shape from §2 above (empty `files`/`include`, one reference).

3. **`libs/shared/<name>/tsconfig.lib.json`** — copy from `libs/shared/env/tsconfig.lib.json`; adjust `types` if the lib needs `vite/client` or React typings.

4. **`libs/shared/<name>/src/index.ts`** — export the public API.

5. **No other file needs to change** — the `@my-mono-fe/*` glob covers the new lib automatically.

6. **Validate:**
   ```bash
   pnpm exec tsc -p libs/shared/<name>/tsconfig.lib.json --noEmit
   ```

---

## 4. Common Anti-Patterns to Avoid

- ❌ **Widening `rootDir`** (e.g., `"rootDir": "../../"`) to silence a "file not under rootDir" error.
  Fix the `include` list instead — it contains files outside the intended scope.

- ❌ **Including a sibling lib's source directly:**
  ```json
  "include": ["../other-lib/src/**/*.ts"]   // ← never do this
  ```
  Import shared code via the `@my-mono-fe/*` alias instead.

- ❌ **Importing across libs with relative paths:**
  ```ts
  import { env } from '../../env/src/index'; // ← never do this
  import { env } from '@my-mono-fe/shared/env'; // ✅
  ```

- ❌ **Putting domain-specific types/constants in a shared lib.** If a type is only used by one feature (e.g., `Post`), keep it in that feature's lib.

- ❌ **Exporting non-public internals from `src/index.ts`.** Only export what consumers should depend on.

---

## 5. Tooling & Commands

```bash
# Typecheck a single lib
pnpm exec tsc -p libs/shared/<name>/tsconfig.lib.json --noEmit

# Typecheck a project via Nx
pnpm nx typecheck shared-<name>
pnpm nx typecheck portal
pnpm nx typecheck admin

# Build a project
pnpm nx build shared-<name>
pnpm nx build portal

# Run all affected checks
pnpm nx affected -t typecheck
pnpm nx affected -t build
```

---

## 6. Code Style & Patterns

- **TypeScript**: `strict: true`, `isolatedModules: true` — no implicit any, no non-null assertion abuse.
- **Env validation**: Use Zod in `shared/env`. Never access `import.meta.env` directly in app code; import `env` from `@my-mono-fe/shared/env`.
- **Data fetching**: RTK Query via `baseApi` in `shared/state`. Extend with `injectEndpoints`, never create a second `createApi` call.
- **UI utilities**: Use `cn()` from `@/lib/utils` (re-export of `clsx` + `tailwind-merge`) for conditional class names.
- **No barrel re-exports of types only** — prefer explicit named exports so tree-shaking works correctly with `isolatedModules`.