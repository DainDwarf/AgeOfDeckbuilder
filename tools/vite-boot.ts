import { fileURLToPath } from 'node:url';
import { createServer, createServerModuleRunner } from 'vite';

// Plain Node runs the entries and this file and resolves no extensionless import, so everything that
// imports `src/` is loaded through Vite's module runner; this file imports `vite` and `node:*` alone.

/**
 * The tool's body, the module at that path from the repository's root, loaded through Vite's module
 * runner and handed to `run`; whatever `run` throws is printed and the exit code is 1.
 */
export async function runBody<Body>(path: string, run: (body: Body) => void): Promise<void> {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    logLevel: 'error',
  });
  const runner = createServerModuleRunner(server.environments.ssr, { hmr: false });
  try {
    run(await runner.import<Body>(path));
  } catch (error) {
    // A refusal, the rules' or the tool's, is a plain `Error`; anything else is a defect.
    console.error(error instanceof Error && error.constructor === Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await runner.close();
    await server.close();
  }
}
