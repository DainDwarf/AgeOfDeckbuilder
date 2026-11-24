/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { buildVersion } from './tools/version.ts';

/** The notices of the code the game bundles, which Vite's own licence step writes at build alone. */
const BUNDLED_NOTICES = 'LICENSE-DEPENDENCIES.md';

/** The licences' page, beside the game's own page wherever it is served. */
const LICENCES_PAGE = 'licences.txt';

// The base is set on `build` only: Pages serves the bundle under the repository name, while the dev
// server, the e2e specs and the ui-check agent all reach the app at `/`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/AgeOfDeckbuilder/' : '/',
  server: { port: 5173, strictPort: true },
  define: {
    'import.meta.env.BUILD_VERSION': JSON.stringify(buildVersion()),
    'import.meta.env.LICENCES_PAGE': JSON.stringify(LICENCES_PAGE),
  },
  build: { license: { fileName: BUNDLED_NOTICES } },
  plugins: [licences()],
  test: { include: ['src/**/*.test.ts', 'tools/**/*.test.ts'] },
}));

/** A licences' page: each part under its heading, a row of `=` between two. */
function licencesPage(parts: readonly (readonly [string, string])[]): string {
  return parts
    .map(([heading, part]) => `${heading}\n${part.trimEnd()}\n`)
    .join(`\n${'='.repeat(72)}\n\n`);
}

/** The licences' page's first two parts: the game's licence, and the packs' licence record. */
function ownParts(): (readonly [string, string])[] {
  return [
    ['THE GAME', readFileSync('LICENSE', 'utf-8')],
    ['THE PACKS', readFileSync('public/assets/LICENSES.md', 'utf-8')],
  ];
}

/**
 * The game's licence copied into the build beside its dependencies' notices, and the licences' page,
 * which the build writes whole and the dev server serves without the notices.
 */
function licences(): Plugin {
  return {
    name: 'licences',
    configureServer(server) {
      server.middlewares.use(`/${LICENCES_PAGE}`, (_request, response) => {
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.end(licencesPage(ownParts()));
      });
    },
    generateBundle: {
      // After Vite's own licence step, which emits the notices in this same hook.
      order: 'post',
      handler(_options, bundle) {
        const notices = bundle[BUNDLED_NOTICES];
        if (notices?.type !== 'asset') throw new Error(`the build wrote no ${BUNDLED_NOTICES}`);
        this.emitFile({
          type: 'asset',
          fileName: 'LICENSE',
          source: readFileSync('LICENSE', 'utf-8'),
        });
        this.emitFile({
          type: 'asset',
          fileName: LICENCES_PAGE,
          source: licencesPage([
            ...ownParts(),
            ['THE CODE THE GAME BUNDLES', Buffer.from(notices.source).toString('utf-8')],
          ]),
        });
      },
    },
  };
}
