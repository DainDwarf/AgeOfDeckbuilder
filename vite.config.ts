/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// The base is set on `build` only: Pages serves the bundle under the repository name, while the dev
// server, the e2e specs and the ui-check agent all reach the app at `/`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/AgeOfDeckbuilder/' : '/',
  server: { port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts'] },
}));
