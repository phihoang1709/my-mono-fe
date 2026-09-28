# MyMonoFe

React monorepo using Nx 23, pnpm 12 and Vite 8, including:

- `apps/portal`: main frontend portal
- `apps/admin`: admin application
- `libs/shared/{env,state,ui,constants,utils}`: shared workspace packages
  (`@my-mono-fe/*`), with shadcn/ui + Tailwind v4 in `libs/shared/ui`

The codebase is managed with a pnpm workspace and orchestrated by Nx. Common
commands are grouped in `Taskfile.yml` and invoked via the `task` CLI.

---

## Tech stack

- **Node 24** (`.nvmrc`, `engines`) + **pnpm 12** (`packageManager` — CI and
  corepack pick it up automatically)
- **Nx 23** – monorepo management, inferred targets (`lint/test/build/typecheck`)
- **React 19**, **React Router 8** (`react-router` package)
- **Vite 8** – bundler for `portal` and `admin`
- **Tailwind CSS v4** (CSS-first, tokens in `libs/shared/ui/src/index.css`) +
  **shadcn/ui**
- **Redux Toolkit** – single `createAppStore()` factory + RTK Query in
  `@my-mono-fe/state`
- **TypeScript 6.0**, **ESLint 10**, **Prettier**
- **Husky + commitlint** – conventional commits (`"prepare": "husky"`)
- **go-task (`Taskfile.yml`)** – thin wrapper around common Nx/pnpm commands

---

## Installation

```sh
pnpm install
```

pnpm is pinned via the `packageManager` field — any pnpm ≥ 10 switches to the
pinned version automatically. If Husky is not initialized yet:

```sh
pnpm prepare
```

---

## Development

Use `task` instead of memorizing individual Nx commands:

```sh
# Portal (default)
task dev

# Or specify the app
task dev APP=portal
task dev APP=admin
```

Dev servers (host: `localhost`):

- `portal`: http://localhost:4200/ (preview: 4201)
- `admin`: http://localhost:4300/ (preview: 4301)

---

## Build

```sh
# Build default app (portal)
task build

# Build specific app
task build APP=portal
task build APP=admin

# Build all projects
task build:all
```

Build Docker image for the app (using the root `Dockerfile`, currently building
`portal`):

```sh
task docker:build          # APP=portal (default)
task docker:run            # run container locally, map HOST=8080 -> container:80
```

---

## Test, lint, typecheck

```sh
# Everything (what CI runs)
pnpm exec nx run-many -t lint test build typecheck

# Test
task test                  # test default app
task test APP=admin
task test:all              # test all projects

# Lint
task lint                  # lint default app
task lint APP=admin
task lint:all

# Typecheck
task typecheck
```

After adding or moving cross-project imports, run `pnpm exec nx sync` so the
TypeScript project references stay in sync.

---

## Generate app/lib/component (Nx generators)

These commands wrap `nx g` for convenience:

```sh
# Create a new React app in the monorepo
task new:app NAME=my-new-app

# Create a new React library
task new:lib NAME=my-shared-lib

# Create a new React component in a project (e.g. portal)
task new:cmp NAME=Button PROJECT=portal
```

New libs under `libs/shared/<name>` need a `package.json` (see
`AGENTS.md` §3) to become a workspace package.

---

## Project structure

```
apps/portal            # portal app          (dev 4200 / preview 4201)
apps/admin             # admin app           (dev 4300 / preview 4301)
libs/shared/env        # @my-mono-fe/env        – Zod env validation
libs/shared/state      # @my-mono-fe/state      – store factory, slices, RTK Query
libs/shared/ui         # @my-mono-fe/ui         – shadcn components + Tailwind v4 theme
libs/shared/constants  # @my-mono-fe/constants  – cross-app constants
libs/shared/utils      # @my-mono-fe/utils      – pure logic helpers
Dockerfile + nginx.conf  # build and serve an app as a static site via NGINX
```

Conventions (workspace packages, store factory, Tailwind v4 theming, version
pins) are documented in [AGENTS.md](AGENTS.md).

---

## Additional Nx resources

- Getting started with Nx React monorepos: https://nx.dev/getting-started/tutorials/react-monorepo-tutorial
- Running tasks with Nx: https://nx.dev/features/run-tasks
- Generators & plugins: https://nx.dev/concepts/nx-plugins
