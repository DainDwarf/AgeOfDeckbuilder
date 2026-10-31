/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

// The base is set on `build` only: Pages serves the bundle under the repository name, while the dev
// server, the e2e specs and the ui-check agent all reach the app at `/`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/AgeOfDeckbuilder/' : '/',
  server: { port: 5173, strictPort: true },
  build: { license: { fileName: 'LICENSE-DEPENDENCIES.md' } },
  plugins: [gameLicence()],
  test: { include: ['src/**/*.test.ts', 'tools/**/*.test.ts'] },
}));

/** The game's own licence, copied into the build beside its dependencies' notices. */
function gameLicence(): Plugin {
  return {
    name: 'game-licence',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'LICENSE',
        source: readFileSync('LICENSE', 'utf-8'),
      });
    },
  };
}
