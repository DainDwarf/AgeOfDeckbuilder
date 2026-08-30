// PreToolUse lint on Edit/Write: a TODO/FIXME/XXX marker may not enter a source file.
// Discovered work goes through /intake (a BOARD.md line or an IDEAS.md jot) or gets done now.
// Markdown is exempt — the board, the ideas file and the docs talk *about* TODOs legitimately.

const MARKER = /\b(TODO|FIXME|XXX)\b/;
const EXEMPT = /\.(md|markdown|txt)$/i;

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
    process.exit(0); // fail open: a nudge, not a boundary
  }

  const ti = input.tool_input ?? {};
  const path = String(ti.file_path ?? '');
  if (!path || EXEMPT.test(path)) process.exit(0);

  const added = input.tool_name === 'Write' ? ti.content : ti.new_string;
  if (typeof added !== 'string' || !MARKER.test(added)) process.exit(0);

  // An Edit that merely carries an existing marker through unchanged is not a new one.
  if (
    input.tool_name === 'Edit' &&
    typeof ti.old_string === 'string' &&
    MARKER.test(ti.old_string)
  ) {
    process.exit(0);
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `A TODO/FIXME/XXX marker would enter ${path}. Source files carry no deferred work: ` +
          'do it now, or route it through /intake (a BOARD.md line or an IDEAS.md jot) and ' +
          'write the edit without the marker.',
      },
    }),
  );
  process.exit(0);
});
