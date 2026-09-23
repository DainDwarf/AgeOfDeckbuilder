import { execFileSync } from 'node:child_process';
import { build } from 'vite';

const version = execFileSync('git', ['describe', '--tags', '--always', '--dirty'], {
  encoding: 'utf8',
}).trim();

await build({ base: './' });

execFileSync(
  'butler',
  ['push', 'dist', 'daindwarf/age-of-deckbuilder:html', '--userversion', version],
  { stdio: 'inherit' },
);
