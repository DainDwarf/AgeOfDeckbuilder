// PostToolUse lint on Edit/Write under src/ and e2e/: parse the file and flag each comment block,
// a run of own-line `//` or one own-line `/* */`, that overlaps the text written and holds more
// than three lines, delimiter-only lines not counted. Advisory, never a deny.

const fs = require('node:fs');
const path = require('node:path');

function regions(input, text) {
  const ti = input.tool_input;
  if (input.tool_name === 'Write') return [[0, text.length]];
  if (typeof ti.new_string !== 'string' || ti.new_string === '') return [];
  const found = [];
  for (const needle of [ti.new_string, ti.new_string.replace(/\r?\n/g, '\r\n')]) {
    for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length)) {
      found.push([at, at + needle.length]);
    }
    if (found.length) break;
  }
  return found;
}

function blocks(text, comments) {
  const lineOf = (offset) => text.slice(0, offset).split('\n').length;
  const found = [];
  let run = null;
  for (const c of comments) {
    const lineStart = text.lastIndexOf('\n', c.start - 1) + 1;
    const ownLine = text.slice(lineStart, c.start).trim() === '';
    const line = lineOf(c.start);
    if (!ownLine) {
      run = null;
      continue;
    }
    const lines = text.slice(c.start, c.end).split('\n');
    if (c.type === 'Line' && run && run.last === line - 1) {
      run.end = c.end;
      run.last = line;
      run.lines.push(lines[0]);
      continue;
    }
    const block = { start: c.start, end: c.end, last: line + lines.length - 1, lines };
    found.push(block);
    run = c.type === 'Line' ? block : null;
  }
  return found;
}

function prose(lines) {
  return lines.map((l) => l.trim()).filter((t) => !/^(\/\*\*?|\*?\s*\*\/)$/.test(t));
}

function firstWords(lines) {
  const words = lines
    .map((t) =>
      t
        .replace(/^\/\/+/, '')
        .replace(/^\/\*\*?/, '')
        .replace(/\*\/.*$/, '')
        .replace(/^\*/, ''),
    )
    .join(' ')
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 8).join(' ');
}

async function lint(raw) {
  const input = JSON.parse(raw);
  const target = String(input.tool_input?.file_path ?? '');
  if (!target || !/\.[cm]?[jt]sx?$/.test(target)) return;
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const rel = path.relative(root, path.resolve(target)).replace(/\\/g, '/');
  if (!rel.startsWith('src/') && !rel.startsWith('e2e/')) return;

  const text = fs.readFileSync(target, 'utf8');
  const edited = regions(input, text);
  if (!edited.length) return;

  const { parseSync } = await import('oxc-parser');
  const { comments } = parseSync(target, text);

  const hits = blocks(text, comments)
    .filter((b) => edited.some(([from, to]) => b.start < to && b.end > from))
    .map((b) => prose(b.lines))
    .filter((lines) => lines.length > 3)
    .map((lines) => `a comment block of ${lines.length} lines starting "${firstWords(lines)}"`);
  if (!hits.length) return;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          `Long-comment lint on ${rel}: ${hits.join('; ')}. Comments are for traps only; a block ` +
          'this long is usually paraphrase, history or rationale. Cut it to the trap, or state in your report why it stays.',
      },
    }),
  );
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  lint(raw)
    .catch(() => {})
    .finally(() => process.exit(0));
});
