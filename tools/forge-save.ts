import { fileURLToPath } from 'node:url';
import { createServer, createServerModuleRunner } from 'vite';

// Plain Node resolves no extensionless import, so everything that imports `src/` is loaded through
// Vite's module runner; this file imports `vite` and `node:*` alone.
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true, hmr: false, watch: null },
  logLevel: 'error',
});
const runner = createServerModuleRunner(server.environments.ssr, { hmr: false });
try {
  const { forgeSave } = await runner.import<typeof import('./forge-save-body')>(
    '/tools/forge-save-body.ts',
  );
  forgeSave(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await runner.close();
  await server.close();
}
