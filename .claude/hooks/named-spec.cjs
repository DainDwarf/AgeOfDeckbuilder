// PreToolUse lint on the shell tools: a local Playwright run names the spec it covers. The whole
// suite is CI's, so a run that names no spec is denied.

// Matched at a command boundary, never anywhere in the string: a command that merely quotes the
// phrase (a heredoc, git log --grep) runs no test, and denying it is nonsense the session cannot
// diagnose. A word before playwright must be an unquoted plain token, which is what npx is.
const SEGMENTS = /[;&|\n()]+/;
const PLAYWRIGHT = /^\s*(?:[\w./\\@:~+-]+\s+)*[\w./\\@:~+-]*playwright[\w./\\@:~+-]*\s+test\b/;
const NPM_E2E = /^\s*npm\s+run\s+e2e\b/;

const REASON =
  "A local Playwright run names the spec it covers — the whole suite is CI's, so run one spec " +
  '(npx playwright test e2e/<spec>.spec.ts).';

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
  const segments = command.split(SEGMENTS);
  const denied = segments.some(
    (segment) =>
      NPM_E2E.test(segment) || (PLAYWRIGHT.test(segment) && !segment.split(/\s+/).some(namesSpec)),
  );
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

// Playwright takes file.spec.ts:12 to mean one test in that file.
function namesSpec(token) {
  return /\.spec\.ts(:\d+)*["']?$/.test(token);
}
