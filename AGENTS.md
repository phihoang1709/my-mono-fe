# AGENTS.md — AI Agent Instructions

> Read this file before making any changes. It captures the conventions of this
> codebase so you don't need to rediscover them each session.

---

## 1. Project Overview

| Item | Detail |
|---|---|
| **Repo type** | Nx monorepo (Nx 23, inferred targets — no `project.json`) |
| **Language** | TypeScript strict (TS 6.0.x — see §7 for why not 7) |
| **Bundler / test runner** | Vite 8 + Vitest 4 (`@nx/vitest` peer caps Vitest at 4.x) |
| **Toolchain** | Node 24 (`.nvmrc`, `engines`), pnpm 12 via `packageManager` — CI reads it automatically |
| **Apps** | `apps/portal` (serve 4200 / preview 4201), `apps/admin` (serve 4300 / preview 4301) |
| **Shared libs** | `libs/shared/{env,state,ui,constants,utils}` — real pnpm workspace packages |

Apps are React SPAs. Shared libs are consumed **as workspace packages by their
npm name** — never by relative cross-lib imports.

---

## 2. Architecture & Library Conventions

### Workspace packages (not path aliases)

Every lib is a proper workspace package:

```
libs/shared/<name>/
  package.json         # name: "@my-mono-fe/<name>", exports map (below)
  tsconfig.json        # references tsconfig.lib.json; no include/files
  tsconfig.lib.json    # real compiler options: rootDir, include, outDir …
  src/
    index.ts           # public API — only export from here
```

**`package.json` (copy the shape from `libs/shared/env`):**

```json
{
  "name": "@my-mono-fe/<name>",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "@my-mono-fe/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

**Resolution model (how imports find lib source):**

- Names are strictly two-segment (`@my-mono-fe/env`) — pnpm 12/npm reject
  three-segment scoped names like `@my-mono-fe/shared/env`.
- `tsconfig.base.json` sets `customConditions: ["@my-mono-fe/source"]`, and app
  `vite.config.mts` sets `resolve.conditions: [...defaultClientConditions,
  '@my-mono-fe/source']`. Together these make TS and Vite resolve
  `@my-mono-fe/*` to the lib's **TS source** through its `exports` map.
- Consumers declare the dependency with `"workspace:*"` (apps depend on
  `env`/`state`/`ui`; `state` depends on `env`).
- TS uses the **project-reference model**: apps include only their own `src/`,
  `rootDir: "src"`, and `nx sync` maintains the references to lib
  `tsconfig.lib.json`. Run `pnpm exec nx sync` after adding cross-project
  imports; `nx typecheck` warns when the workspace is out of sync.
- The **only** remaining aliases are the shadcn ones (TS `paths` in
  `tsconfig.base.json` + a matching `'@'` Vite alias, because Vite does not
  read tsconfig paths): `@/components/*`, `@/lib/utils` →
  `libs/shared/ui/src/…`. The shadcn CLI needs them.

### What lives where

| Concern | Location | Import specifier |
|---|---|---|
| Env/config validation (Zod) | `shared/env` | `@my-mono-fe/env` |
| Redux store factory, slices, RTK Query APIs, typed hooks | `shared/state` | `@my-mono-fe/state` |
| UI components, shadcn theme, Tailwind utils (`cn`) | `shared/ui` | `@my-mono-fe/ui`, `@my-mono-fe/ui/theme.css`, or `@/components/*` + `@/lib/utils` |
| Cross-app constants (keys, names) | `shared/constants` | `@my-mono-fe/constants` |
| Pure logic utilities (no DOM/React) | `shared/utils` | `@my-mono-fe/utils` |
| Domain-specific types/constants | The domain lib itself | — |

---

## 3. Adding a New Shared Library — Checklist

1. **Create the folder:** `libs/shared/<name>/src/`
2. **`package.json`** — copy from `libs/shared/env/package.json`, change `name`.
3. **`libs/shared/<name>/tsconfig.json`** — copy the shape from an existing lib
   (empty `files`/`include`, one reference to `./tsconfig.lib.json`).
4. **`libs/shared/<name>/tsconfig.lib.json`** — copy from `libs/shared/env`;
   adjust `types` if the lib needs `vite/client` or React typings.
5. **Declare the dep where it is used** — apps: `"@my-mono-fe/<name>":
   "workspace:*"` in the app's `package.json`; other libs: same in the lib.
6. **`libs/shared/<name>/src/index.ts`** — export the public API.
7. Run `pnpm install` (links the package) and `pnpm exec nx sync` (maintains TS
   project references).
8. **Validate:**
   ```bash
   pnpm exec tsc -p libs/shared/<name>/tsconfig.lib.json --noEmit
   ```

---

## 4. Common Anti-Patterns to Avoid

- ❌ **Re-adding `@my-mono-fe/*` to `paths` or Vite `alias`.** Workspace
  packages + the `@my-mono-fe/source` condition replace all of that. Only `@`
  (shadcn) is aliased.
- ❌ **Importing across libs with relative paths:**
  ```ts
  import { env } from '../../env/src/index'; // ← never do this
  import { env } from '@my-mono-fe/env';     // ✅
  ```
- ❌ **Widening `rootDir`** (e.g., `"rootDir": "../../"`) to silence a "file not
  under rootDir" error. With the reference model every project includes only
  its own `src/`; if something else lands in the program, fix the import, not
  the rootDir.
- ❌ **Putting domain-specific types/constants in a shared lib.** If a type is
  only used by one feature (e.g., `Post`), keep it in that feature's code.
- ❌ **Exporting non-public internals from `src/index.ts`.** Only export what
  consumers should depend on.
- ❌ **Creating a second Redux store / `createApi`.** Apps get the store from
  the factory; RTK Query endpoints extend `baseApi`.

---

## 5. Tooling & Commands

```bash
# Dev servers (host: localhost)
pnpm nx dev portal        # http://localhost:4200  (preview: 4201)
pnpm nx dev admin         # http://localhost:4300  (preview: 4301)

# Typecheck a single lib
pnpm exec tsc -p libs/shared/<name>/tsconfig.lib.json --noEmit

# Typecheck / build via Nx
pnpm nx typecheck portal
pnpm nx run-many -t lint test build typecheck

# Full affected checks
pnpm nx affected -t typecheck
pnpm nx affected -t build

# After adding/moving cross-project imports
pnpm exec nx sync
```

CI (`.github/workflows/ci.yml`) pins nothing by hand: `setup-node` uses Node
24 and `pnpm/action-setup` reads `packageManager` from `package.json`.

---

## 6. Code Style & Patterns

- **TypeScript**: `strict: true`, `isolatedModules: true` — no implicit any, no
  non-null assertion abuse.
- **Env validation**: Zod in `shared/env`. Never access `import.meta.env`
  directly in app code; import `env` from `@my-mono-fe/env`. (Tests: provide
  `VITE_*` values via the `test.env` block in the app's `vite.config.mts`.)
- **Redux**: `createAppStore()` from `@my-mono-fe/state` assembles auth + ui +
  `baseApi` and is the only place a store is configured. App `store.ts` is two
  lines. Typed hooks: `useAppDispatch` / `useAppSelector` from the same lib.
  RTK Query: `injectEndpoints` on `baseApi` — never a second `createApi`.
- **UI utilities**: `cn()` from `@/lib/utils` (clsx + tailwind-merge).
- **Tailwind v4 (CSS-first)**: there is **no `tailwind.config.js`**. Design
  tokens live in `libs/shared/ui/src/index.css` (zinc oklch vars, `@theme
  inline`, dark variant) and every app's `styles.css` is:
  ```css
  @import 'tailwindcss';
  @import '@my-mono-fe/ui/theme.css';
  ```
  shadcn components are added to `libs/shared/ui/src/components/ui/` via the
  CLI (`components.json`); import them with `@/components/ui/<component>`.
- **No barrel re-exports of types only** — prefer explicit named exports so
  tree-shaking works correctly with `isolatedModules`.

---

## 7. Version pins you must not "fix" blindly

| Package | Pinned | Reason |
|---|---|---|
| `typescript` ~6.0 | TS 7 (native) has **no typescript-eslint support** (peer `<6.1.0`); TS 6.0.3 is the newest compatible stable. Revisit when typescript-eslint ships TS 7 support. |
| `vitest` ~4.1 | `@nx/vitest@23.2` peer range is `^3 \|\| ^4`. Going to Vitest 5 means dropping the Nx plugin and hand-configuring test targets. |
| `@types/node` ^24 | Must match the Node 24 runtime — do not blindly bump to `latest` (currently 26). |
