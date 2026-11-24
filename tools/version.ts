import { execFileSync } from 'node:child_process';

/** The version the tree stands at, as git describes it; a tree git cannot describe throws. */
export function buildVersion(): string {
  return execFileSync('git', ['describe', '--tags', '--always', '--dirty'], {
    encoding: 'utf8',
  }).trim();
}
