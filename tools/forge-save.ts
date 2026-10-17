import { runBody } from './vite-boot.ts';

await runBody<typeof import('./forge-save-body')>('/tools/forge-save-body.ts', ({ forgeSave }) => {
  forgeSave(process.argv.slice(2));
});
