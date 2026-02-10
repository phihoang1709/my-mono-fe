# MyMonoFe

React monorepo using Nx, pnpm and Vite, including:

- `apps/portal`: main frontend portal
- `apps/admin`: admin application
- `libs/shared/ui`: shared UI library, built as `@my-mono-fe/ui` (shadcn + Tailwind)

The codebase is managed with a pnpm workspace and orchestrated by Nx. Common commands are grouped in `Taskfile.yml` and invoked via the `task` CLI.

---

## Tech stack

- **Nx 22** – monorepo management, build/test/lint orchestration
- **React 19**, **React Router 6**
- **Vite 7** – bundler for `portal` and `admin`
- **pnpm** – workspace package manager
- **TailwindCSS** + **shadcn/ui** (in `libs/shared/ui`)
- **TypeScript 5.9**, **ESLint**, **Prettier**
- **Husky + commitlint** – conventional commits (`"prepare": "husky"` in `package.json`)
- **go-task (`Taskfile.yml`)** – thin wrapper around common Nx/pnpm commands

---

## Installation

```sh
pnpm install
```

If Husky is not initialized yet:

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

Default dev servers:

- `portal`: http://localhost:4200/
- `admin`: http://localhost:4300/

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

Build Docker image for the app (using the root `Dockerfile`, currently building `portal`):

```sh
task docker:build          # APP=portal (default)
task docker:run            # run container locally, map HOST=8080 -> container:80
```

---

## Test, lint, typecheck

```sh
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

If you prefer using Nx directly instead of `task`:

```sh
pnpm nx g @nx/react:app demo
pnpm nx g @nx/react:lib mylib
```

---

## Project structure

- `apps/portal` – main app, uses shadcn UI from `@my-mono-fe/ui`
- `apps/admin` – admin app
- `libs/shared/ui` – shared UI library, exported as the `@my-mono-fe/ui` package
- `Taskfile.yml` – central place for dev/build/test/lint/generate commands
- `Dockerfile` + `nginx.conf` – build and serve `portal` as a static site via NGINX

---

## Additional Nx resources

- Getting started with Nx React monorepos: https://nx.dev/getting-started/tutorials/react-monorepo-tutorial
- Running tasks with Nx: https://nx.dev/features/run-tasks
- Generators & plugins: https://nx.dev/concepts/nx-plugins
