import { runBody } from './vite-boot.ts';

await runBody<typeof import('./sim-body')>('/tools/sim-body.ts', ({ sim }) => {
  sim(process.argv.slice(2));
});
