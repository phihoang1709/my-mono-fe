/// <reference types='vitest' />
import { defineConfig, defaultClientConditions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/admin',
  server: {
    port: 4300,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    // shadcn convention: `@` points at the ui lib source. Vite does not read
    // tsconfig paths, so this alias mirrors `@/components/*` + `@/lib/utils`.
    alias: {
      '@': path.resolve(import.meta.dirname, '../../libs/shared/ui/src'),
    },
    // Workspace libs (@my-mono-fe/*) publish their TS source under
    // this package.json export condition - see tsconfig.base customConditions.
    conditions: [...defaultClientConditions, '@my-mono-fe/source'],
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
