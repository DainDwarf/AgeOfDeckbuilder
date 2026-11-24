import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import { buildVersion } from './version.ts';

const version = buildVersion();

await build({ base: './' });

execFileSync(
  'butler',
  ['push', 'dist', 'daindwarf/age-of-deckbuilder:html', '--userversion', version],
  { stdio: 'inherit' },
);
