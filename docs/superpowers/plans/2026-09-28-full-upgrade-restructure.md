# Full-latest Upgrade + Deep Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng toàn bộ toolchain lên latest khả thi (Node 24, pnpm 12, Nx 23.2, Vite 8, TW4, RR8, ESLint 10) + restructure sâu (workspace packages thật, store gộp, shadcn theme chuẩn, tách port).

**Architecture:** libs trở thành pnpm workspace packages, resolve qua `exports` + `customConditions: ["@my-mono-fe/source"]` (Nx recipe chính thức "switch-to-workspaces-project-references"). Bỏ alias `@my-mono-fe/*` thủ công trong Vite. Store factory `createAppStore()` trong `shared/state`; `store.ts` mỗi app còn đúng 2 dòng.

**Tech Stack:** Nx 23.2.1, Vite 8.3.1 + plugin-react 6.1.1, Vitest 4.1.11, React 19.3, React Router 8.4, Tailwind 4.3.3, TS 5.9.3, ESLint 10.11, pnpm 12.6.0, Node 24.

**Branch:** `chore/full-latest-upgrade` (đã tạo). Mỗi pha 1 commit.

## Global Constraints

Các version đã verify trên npm registry ngày 2026-09-28 — dùng verbatim:

| Package | Version đích | Ghi chú |
|---|---|---|
| Node | **24 LTS** | `.nvmrc` = `24`, `engines.node = ">=24"`, CI, Docker `node:24-alpine` |
| pnpm | **12.6.0** | `packageManager` field, single source |
| nx + mọi `@nx/*` | **23.2.1** | qua `nx migrate` |
| vite / @vitejs/plugin-react | **8.3.1 / 6.1.1** | plugin 6 dùng oxc — KHÔNG còn Babel |
| vitest + @vitest/ui + @vitest/coverage-v8 | **4.1.11** | KHÔNG lên 5: @nx/vitest 23.2.1 peer `^3||^4` |
| react-router | **^8.4.0**, xoá `react-router-dom` | `BrowserRouter` từ `react-router/dom`, còn lại từ `react-router` |
| react, react-dom, @types/react(-dom) | **^19.3.0** | |
| tailwindcss + @tailwindcss/vite | **^4.3.3** | CSS-first |
| typescript | **~5.9.2 (giữ nguyên)** | TS7 BLOCKED: typescript-eslint peer `<6.1.0`, TS7 native binary không có JS API |
| eslint / @eslint/js / typescript-eslint | **10.11.0 / 10.0.1 / 8.70.1** | flat config giữ nguyên |
| @types/node | **^24.0.0** | khớp runtime Node 24 — ngoại lệ full-latest có chủ đích |
| @reduxjs/toolkit / zod | **2.12.0 / 4.6.5** | |
| prettier / @commitlint/* / jsdom | **3.9.9 / 21.2.3 / 30.1.1** | |
| **Xoá hẳn** | `@babel/core`, `@babel/preset-react`, `postcss`, `autoprefixer`, `react-router-dom`, root + apps `tailwind.config.js`, apps `postcss.config.js` | dead deps / thay bằng native |

Resolve source libs (Pha 3): `tsconfig.base.json` giữ `customConditions: ["@my-mono-fe/source"]`, xoá path `@my-mono-fe/*` khỏi `paths` (giữ `@/components/*`, `@/lib/utils`); Vite configs thêm `resolve: { conditions: ['@my-mono-fe/source'] }` (merge với defaults, không thay thế); xoá `resolve.alias` của `@my-mono-fe/*`. `@` alias giữ cho shadcn CLI.

---

### Task 0: Baseline (không commit)

- [ ] `pnpm install`
- [ ] `pnpm nx run-many -t lint test build typecheck` — ghi kết quả vào ledger `.superpowers/sdd/progress.md` làm trạng thái đối chiếu

### Task 1: Toolchain — Node 24 + pnpm 12 (commit `chore(toolchain): node 24 + pnpm 12 via packageManager`)

**Files:** Create `.nvmrc`; Modify `package.json`, `.github/workflows/ci.yml`, `Dockerfile`

- [ ] `.nvmrc` nội dung: `24`
- [ ] `package.json` thêm 2 field (cấp root, cạnh `"license"`):
  ```json
  "packageManager": "pnpm@12.6.0",
  "engines": { "node": ">=24" }
  ```
- [ ] `.github/workflows/ci.yml`: xoá `version: 9.8.0` + `run_install: false` giữ nguyên trong step `pnpm/action-setup@v4` (chỉ bỏ dòng `version:`); `node-version: 20` → `node-version: 24`
- [ ] `Dockerfile` dòng 1: `FROM node:22-alpine AS builder` → `FROM node:24-alpine AS builder`
- [ ] Verify: `pnpm -v` in ra `12.6.0`; `pnpm nx run-many -t build typecheck` xanh
- [ ] Commit toàn bộ: `chore(toolchain): node 24 + pnpm 12 via packageManager`

### Task 2: Upgrade deps (commit `chore(deps): nx 23.2, vite 8, react-router 8, tailwind 4, eslint 10`)

**Files:** Modify `package.json`, `nx.json`, 2× `apps/*/vite.config.mts`, 2× `apps/*/src/main.tsx`, 2× `apps/*/src/app/app.tsx`, `apps/portal/src/app/app.spec.tsx`, 2× `apps/*/src/styles.css`, `libs/shared/ui/src/index.css`; Delete root + apps `tailwind.config.js`, apps `postcss.config.js`

- [ ] `pnpm dlx nx@latest migrate latest` → nếu tạo `migrations.json`: `pnpm nx migrate --run-migrations`. Nếu migrate đã tự bump package.json, đối chiếu với target bên dưới.
- [ ] Ghi đè `package.json` dependencies/devDependencies đúng target (giữ nguyên các field khác):
  - dependencies: `@radix-ui/react-slot ^1.2.4`, `@reduxjs/toolkit ^2.12.0`, `@rtk-query/codegen-openapi ^2.2.0`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `date-fns ^4.4.0`, `lucide-react ^1.48.0`, `motion ^13.4.4`, `react ^19.3.0`, `react-dom ^19.3.0`, `react-hook-form ^7.89.0`, `react-redux ^9.2.0`, `react-router ^8.4.0` (xoá `react-router-dom`), `react-use ^17.6.1`, `tailwind-merge ^3.7.0`, `zod ^4.6.5`
  - devDependencies thay đổi: `@commitlint/cli ^21.2.3`, `@commitlint/config-conventional ^21.2.3`, `@eslint/js ^10.0.1`, `@types/node ^24.0.0`, `@types/react ^19.3.0`, `@types/react-dom ^19.3.0`, `@vitejs/plugin-react ^6.1.1`, `@vitest/coverage-v8 ^4.1.11`, `@vitest/ui ^4.1.11`, `eslint ^10.11.0`, `eslint-plugin-import ^2.32.0`, `eslint-plugin-jsx-a11y ^6.10.2`, `eslint-plugin-react ^7.37.5`, `eslint-plugin-react-hooks ^7.1.1`, `jsdom ~30.1.1`, `prettier ~3.9.9`, `tailwindcss ^4.3.3`, THÊM `@tailwindcss/vite ^4.3.3`, `typescript-eslint ^8.70.1`, `vite ^8.3.1`, `vite-plugin-dts ^5.1.1`, `vitest ^4.1.11`
  - XOÁ khỏi devDependencies: `@babel/core`, `@babel/preset-react`, `autoprefixer`, `postcss`
  - Giữ nguyên: `@go-task/cli`, `@nx/*` (migrate lo), `@swc*`, `@testing-library/*`, `eslint-config-prettier`, `husky`, `jiti`, `nx`, `tslib`, `typescript ~5.9.2`
- [ ] `pnpm install` — nếu pnpm báo peer conflicts chỉ warn: chấp nhận; nếu hard-fail: điều tra trước khi chạy tiếp
- [ ] RR8 imports (5 file):
  ```tsx
  import { Routes, Route, Link } from 'react-router';
  import { BrowserRouter } from 'react-router/dom';
  ```
  Áp dụng: 2× `apps/*/src/main.tsx` (BrowserRouter), 2× `apps/*/src/app/app.tsx` + `apps/portal/src/app/app.spec.tsx` (Routes/Route/Link)
- [ ] TW4 minimal: xoá `tailwind.config.js` (root, portal, admin), xoá `apps/portal/postcss.config.js`, `apps/admin/postcss.config.js`; cả 2 `vite.config.mts` thêm:
  ```ts
  import tailwindcss from '@tailwindcss/vite';
  // plugins: [react(), tailwindcss()],
  ```
- [ ] 2× `apps/*/src/styles.css` và `libs/shared/ui/src/index.css` → chỉ còn `@import "tailwindcss";`
- [ ] `nx.json`: `generators["@nx/react"].application.babel: true` → `false`
- [ ] Verify: `pnpm nx run-many -t lint test build typecheck` xanh (Button có thể mất màu — expected, theme ở Task 3); smoke `pnpm nx dev portal` (Ctrl+C sau khi thấy ready)
- [ ] Commit mọi thay đổi kể cả `pnpm-workspace.yaml` (đã dirty sẵn: `onlyBuiltDependencies` → `allowBuilds`): `chore(deps): nx 23.2, vite 8, react-router 8, tailwind 4, eslint 10`

### Task 3: Deep restructure (commit `refactor(structure): workspace pkgs, unified store, shadcn theme, port split`)

**Files:** Create `libs/shared/{env,state,utils,constants}/package.json`, `libs/shared/state/src/{store/store.ts,ui/uiSlice.ts}`; Modify `tsconfig.base.json`, 2× `vite.config.mts`, 2× `apps/*/tsconfig.app.json`, `libs/shared/state/src/index.ts`, 2× `apps/*/src/store/store.ts`, 2× `apps/*/src/app/app.tsx`, `libs/shared/ui/src/index.ts`, `libs/shared/ui/src/index.css`, `components.json`; Delete `libs/shared/ui/src/lib/{ui.tsx,ui.module.css}`, 2× `apps/*/src/store/{hooks.ts,uiSlice.ts}`

**3a. Workspace packages:**
- [ ] Tạo `package.json` cho env/state/utils/constants — copy pattern `libs/shared/ui/package.json`, chỉ đổi `name`:
  ```json
  {
    "name": "@my-mono-fe/state",
    "version": "0.0.1",
    "type": "module",
    "exports": {
      "./package.json": "./package.json",
      ".": {
        "@my-mono-fe/source": "./src/index.ts",
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js",
        "default": "./dist/index.js"
      }
    }
  }
  ```
  (names: `@my-mono-fe/env`, `@my-mono-fe/state`, `@my-mono-fe/utils`, `@my-mono-fe/constants`)
- [ ] `tsconfig.base.json`: xoá entry `"@my-mono-fe/*"` khỏi `paths`; xoá `"ignoreDeprecations": "5.0"`; giữ `customConditions` + 2 path `@/`
- [ ] 2× `vite.config.mts`: xoá alias `@my-mono-fe/shared/state`, `@my-mono-fe/shared/env` (portal giữ alias `'@'`; admin THÊM alias `'@'` chưa có):
  ```ts
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, '../../libs/shared/ui/src') },
    conditions: ['@my-mono-fe/source'],
  },
  ```
- [ ] 2× `apps/*/tsconfig.app.json`: xoá toàn bộ include dòng `../../libs/...` (giữ `src/**` + các exclude). GIỮ `rootDir: "../../"` (app chứa source libs trong program — recipe Nx). Nếu `typecheck`/`build` lỗi vì resolution: **fallback** — restore `paths` `@my-mono-fe/*`, bỏ bước exports (báo lại controller).
- [ ] `pnpm install` (refresh workspace links) → Verify: `pnpm nx run-many -t typecheck build` xanh

**3b. Gộp store:**
- [ ] Tạo `libs/shared/state/src/ui/uiSlice.ts` — nội dung y hệt `apps/portal/src/store/uiSlice.ts` hiện tại
- [ ] Tạo `libs/shared/state/src/store/store.ts`:
  ```ts
  import { configureStore } from '@reduxjs/toolkit';
  import { setupListeners } from '@reduxjs/toolkit/query';
  import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
  import { authReducer, baseApi } from '../api/baseApi';
  import uiReducer from '../ui/uiSlice';

  export function createAppStore() {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        ui: uiReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });
    setupListeners(store.dispatch);
    return store;
  }

  export type AppStore = ReturnType<typeof createAppStore>;
  export type RootState = ReturnType<AppStore['getState']>;
  export type AppDispatch = AppStore['dispatch'];

  export const useAppDispatch: () => AppDispatch = useDispatch;
  export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
  ```
- [ ] `libs/shared/state/src/index.ts` thêm 2 dòng: `export * from './store/store';` và `export * from './ui/uiSlice';`
- [ ] 2× `apps/*/src/store/store.ts` → chỉ còn:
  ```ts
  import { createAppStore } from '@my-mono-fe/shared/state';

  export const store = createAppStore();
  ```
- [ ] Xoá 4 file `apps/*/src/store/{hooks.ts,uiSlice.ts}`; sửa 2× `app.tsx`:
  ```tsx
  import { toggleSidebar, useAppDispatch, useAppSelector } from '@my-mono-fe/shared/state';
  ```
  (`app.spec.tsx` KHÔNG đổi — vẫn import `{ store }` từ `../store/store`)
- [ ] Verify: `pnpm nx run-many -t test typecheck` xanh

**3c. shared/ui shadcn:**
- [ ] Xoá `libs/shared/ui/src/lib/ui.tsx`, `libs/shared/ui/src/lib/ui.module.css`
- [ ] `libs/shared/ui/src/index.ts`:
  ```ts
  export { Button, buttonVariants } from './components/ui/button';
  export { cn } from './lib/utils';
  ```
- [ ] `libs/shared/ui/src/index.css` — theme TW4 zinc đầy đủ (fix bug `bg-primary` không có biến):
  ```css
  @import "tailwindcss";

  @custom-variant dark (&:is(.dark *));

  :root {
    --radius: 0.625rem;
    --background: oklch(1 0 0);
    --foreground: oklch(0.141 0.005 285.823);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.141 0.005 285.823);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.141 0.005 285.823);
    --primary: oklch(0.21 0.006 285.885);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.967 0.001 286.375);
    --secondary-foreground: oklch(0.21 0.006 285.885);
    --muted: oklch(0.967 0.001 286.375);
    --muted-foreground: oklch(0.552 0.016 285.938);
    --accent: oklch(0.967 0.001 286.375);
    --accent-foreground: oklch(0.21 0.006 285.885);
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(0.92 0.004 286.32);
    --input: oklch(0.92 0.004 286.32);
    --ring: oklch(0.705 0.015 286.067);
  }

  .dark {
    --background: oklch(0.141 0.005 285.823);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.21 0.006 285.885);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.21 0.006 285.885);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.92 0.004 286.32);
    --primary-foreground: oklch(0.21 0.006 285.885);
    --secondary: oklch(0.274 0.006 286.033);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.274 0.006 286.033);
    --muted-foreground: oklch(0.705 0.015 286.067);
    --accent: oklch(0.274 0.006 286.033);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.552 0.016 285.938);
  }

  @theme inline {
    --radius-sm: calc(var(--radius) - 4px);
    --radius-md: calc(var(--radius) - 2px);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) + 4px);
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-destructive-foreground: var(--destructive-foreground);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
  }

  @layer base {
    * {
      @apply border-border outline-ring/50;
    }
    body {
      @apply bg-background text-foreground;
    }
  }
  ```
- [ ] 2× `apps/*/src/styles.css` giữ `@import "tailwindcss";` NHƯNG thêm import theme:
  ```css
  @import '../../../libs/shared/ui/src/index.css';
  ```
  (đặt DƯỚI hoặc thay thế — chỉ giữ đúng 2 dòng: `@import "tailwindcss";` nằm trong index.css nên styles.css chỉ cần import index.css:
  cuối cùng styles.css = 1 dòng `@import '../../../libs/shared/ui/src/index.css';`)
- [ ] `components.json`: trong `"tailwind"` xoá key `"config"` (TW4 không còn config file)
- [ ] Verify: `pnpm nx run-many -t build` xanh; smoke dev portal — Button có màu (zinc đen)

**3d. Ports:**
- [ ] `apps/portal/vite.config.mts`: `server.port: 4200`, `preview.port: 4201`
- [ ] `apps/admin/vite.config.mts`: `server.port: 4300`, `preview.port: 4301` (hiện preview 4300 trùng server)

**3e. Docs:** cập nhật `AGENTS.md` + `README.md` (stack versions mới, workspace-packages pattern, store factory, TW4 CSS-first, ports 4200/4201 + 4300/4301, Node 24/pnpm 12, ghi chú TS7-blocked + Vitest5-blocked)
- [ ] Verify cuối pha: `pnpm nx run-many -t lint test build typecheck` xanh; `pnpm nx dev portal` (4200) và `pnpm nx dev admin` (4300) chạy song song không xung độ
- [ ] Commit: `refactor(structure): workspace pkgs, unified store, shadcn theme, port split`

### Task 4: Docker smoke + docs finalize (commit `docs: docker node 24 smoke, finalize docs`)

- [ ] `docker build --build-arg APP_NAME=portal -t my-mono-fe-portal:smoke .` — phải pass; nếu corepack lỗi signature: thay `RUN corepack enable` bằng `RUN npm i -g pnpm@12.6.0`
- [ ] Chạy lại full checks lần cuối, nắm hết vào commit docs (nếu còn sót)
- [ ] Commit

## Risks & Fallbacks

| Rủi ro | Xử lý |
|---|---|
| TS7 / Vitest 5 | Đã loại khỏi phạm vi (chốt với user) |
| package-per-lib resolution lỗi tsc | restore `paths`, bỏ `exports` (fallback trong Task 3a) |
| TW4 content detection thiếu style | thêm `@source` tường minh vào index.css |
| eslint-plugin-react peer `<10` | pnpm warn là chấp nhận; lint lỗi thật → report controller |
| corepack node:24 | fallback `npm i -g pnpm@12.6.0` |
| nx migrate sinh migrations không apply được | report controller, không tự deviate |
