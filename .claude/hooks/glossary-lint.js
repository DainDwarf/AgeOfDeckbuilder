// PostToolUse lint on Edit/Write: flag forbidden synonyms of glossary terms in what was just
// written. Reads docs/GLOSSARY.md's table — column 1 is the term, column 3 the words it forbids —
// so the vocabulary lives in one place. Advisory, never a deny: a forbidden word can be
// legitimate (a card *named* after it), and the reviewer sees the exception either way.

const fs = require('node:fs');
const path = require('node:path');

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
    process.exit(0);
  }

  const ti = input.tool_input ?? {};
  const target = String(ti.file_path ?? '');
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const glossaryPath = path.join(root, 'docs', 'GLOSSARY.md');
  if (!target || path.resolve(target) === path.resolve(glossaryPath)) process.exit(0);

  let glossary;
  try {
    glossary = fs.readFileSync(glossaryPath, 'utf8');
  } catch {
    process.exit(0);
  }

  // | term | meaning | not | — skip the header and the separator row.
  const rules = [];
  for (const line of glossary.split('\n')) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|[^|]*\|\s*([^|]+?)\s*\|/);
    if (!m) continue;
    const term = m[1];
    if (/^-+$/.test(term) || term.toLowerCase() === 'term') continue;
    const banned = m[2]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== '—' && s !== '-');
    if (banned.length) rules.push({ term, banned });
  }
  if (!rules.length) process.exit(0);

  const added = input.tool_name === 'Write' ? ti.content : ti.new_string;
  if (typeof added !== 'string') process.exit(0);

  const hits = [];
  for (const { term, banned } of rules) {
    for (const word of banned) {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(added)) hits.push(`"${word}" → use "${term}"`);
    }
  }
  if (!hits.length) process.exit(0);

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          `Glossary lint on ${target}: ${hits.join('; ')}. Gameplay terms come from ` +
          'docs/GLOSSARY.md with no synonyms; fix the wording, or state the exception in your report.',
      },
    }),
  );
  process.exit(0);
});
