// PreToolUse lint on the shell tools: a local Playwright run covers only the specs the working
// tree touches. The whole suite is CI's, so a run that names no spec, or names one the tree has
// neither modified nor added, is denied.

const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Matched at a command boundary, never anywhere in the string: a command that merely quotes the
// phrase (a heredoc, git log --grep) runs no test, and denying it is nonsense the session cannot
// diagnose. A word before playwright must be an unquoted plain token, which is what npx is.
const SEGMENTS = /[;&|\n()]+/;
const PLAYWRIGHT = /^\s*(?:[\w./\\@:~+-]+\s+)*[\w./\\@:~+-]*playwright[\w./\\@:~+-]*\s+test\b/;
const NPM_E2E = /^\s*npm\s+run\s+e2e\b/;

const REASON =
  'A local Playwright run covers only the specs this working tree has modified or added — the ' +
  "whole suite is CI's, so name a spec you touched (npx playwright test e2e/<spec>.spec.ts).";

process.on('uncaughtException', () => process.exit(0));

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // fail open, like the other hooks: a nudge, not a boundary
  }

  const command = String(input.tool_input?.command ?? '');
  const runs = command
    .split(SEGMENTS)
    .some((segment) => PLAYWRIGHT.test(segment) || NPM_E2E.test(segment));
  if (!runs) process.exit(0);

  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

  const specs = [];
  for (const token of command.split(/\s+/)) {
    // Playwright takes file.spec.ts:12 to mean one test in that file.
    const bare = token.replace(/^["']|["']$/g, '').replace(/(\.spec\.ts)(:\d+)*$/, '$1');
    if (bare.endsWith('.spec.ts')) specs.push(bare);
  }

  let denied = specs.length === 0;
  for (const spec of specs) {
    const rel = path.relative(root, path.resolve(root, spec.replace(/\\/g, '/')));
    if (rel.startsWith('..')) {
      denied = true;
      continue;
    }
    const git = spawnSync('git', ['status', '--porcelain', '--', rel.replace(/\\/g, '/')], {
      cwd: root,
      encoding: 'utf8',
    });
    if (git.error || git.status !== 0) process.exit(0);
    if (!git.stdout.trim()) denied = true;
  }
  if (!denied) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: REASON,
      },
    }),
  );
  process.exit(0);
});
