# A long-comment lint

**Line:** A long-comment lint — a hook on every Edit or Write under `src/` and `e2e/` flags a comment block longer than three lines of prose, advisory like the glossary lint, and `DOGMAS.md` → _Code_ says so.

**Spec:** `DOGMAS.md` → _Code_, the **Comments are for traps only** line, which gains this sentence at its end: "A hook flags a comment block longer than three lines, its delimiters not counted, on every edit under `src/` and `e2e/`; it is advisory: the comment is cut to its trap, or the report says why it stays." The hook's message, the one sentence the line foresees, is: `Long-comment lint on <path>: a comment block of <n> lines starting "<its first eight words>"[; …one per block]. Comments are for traps only; a block this long is usually paraphrase, history or rationale. Cut it to the trap, or state in your report why it stays.`

**Doc-impact:** `DOGMAS.md`.

**Scope:**

- In: one `PostToolUse` hook on `Edit` and `Write`, `.claude/hooks/long-comment-lint.cjs`, wired in `.claude/settings.json` beside the glossary lint, with the same timeout; the dogma sentence.
- Files: any file whose path, relative to the project, is under `src/` or `e2e/`. Nothing else, `.claude/hooks/` included: the hooks are the harness, and their header is the only place they explain themselves.
- What it reads: the text the tool writes, `content` for a Write and `new_string` for an Edit, never the file. An Edit that carries a long block through unchanged from `old_string` fires all the same: the dogma says a comment is re-shaved when editing near it.
- A block is either a run of consecutive lines that are whole-line `//` comments, or one `/* … */` or `/** … */` span. A comment trailing code on its line belongs to no block.
- Prose lines: every line of a block except a delimiter line standing alone, that is a line holding only `/**`, `/*` or `*/` with its indentation and leading `*`. An opening or closing line that also carries words is prose. A blank ` *` line between paragraphs is prose: a two-paragraph comment is long by construction. A run of `//` lines has no delimiters, so every line counts.
- Threshold: more than three prose lines fires. A block the edit cuts mid-way, starting or ending outside `new_string`, is counted on the lines visible.
- One message per tool call naming every block over the threshold, each by its length and its first eight words; the sentence stays the one the Spec writes out.
- Advisory: `additionalContext`, never a deny. No exception marker; a long comment that stays is a sentence in the implementer's report.
- Fail open: unparseable stdin, a missing path, a non-string text each exit 0 with no output, as the other hooks do.
- Out: the backlog. Today 83 blocks in `src/` and 7 in `e2e/` are over the threshold; none is touched by this line. A single-line comment of any width; a lint on `docs/`.

**Traps:**

- The path filter follows `glossary-lint.cjs`: resolve against `CLAUDE_PROJECT_DIR` with a `process.cwd()` fallback, and normalise backslashes before testing the prefix, or the hook is silent on Windows.
- `settings.json` matches the tool name with a regex, `^(Edit|Write)$`; the new hook goes as a second entry in the existing `PostToolUse` matcher's `hooks` array, not a new matcher.
- The hook's own header comment is bound by the rule it enforces: three prose lines at most, saying what it counts and that it is advisory.
- Biome checks `.claude/hooks/` (`npm run lint` covers the new file); it runs on Node with `require`, `.cjs`, single quotes, like its siblings.
- `todo-lint.cjs` runs on `PreToolUse` and denies; this one is `PostToolUse` and advises. Its output shape is the glossary lint's, `hookSpecificOutput.hookEventName: 'PostToolUse'` with `additionalContext`.

**Plan:**

1. `.claude/hooks/long-comment-lint.cjs`: the lint stands and, fed a crafted input from the scratchpad, answers the message on a four-prose-line block under `src/` and nothing on a three-line one.
2. `.claude/settings.json`: the hook is wired beside the glossary lint; the next Edit under `src/` in the session runs it.
3. `DOGMAS.md`: the Comments line carries the sentence.
4. `workflow/BOARD.md` and this file: the line and the dossier are gone.

**Verify:**

- `npm run lint`.
- The hook by hand, each input a JSON file in the scratchpad piped in with `Get-Content <file> | node .claude/hooks/long-comment-lint.cjs`, `CLAUDE_PROJECT_DIR` set to the project: a Write to `src/x.ts` whose content holds a `/** */` block of four prose lines prints the message; the same with three prose lines (five raw) prints nothing; a run of four `//` lines under `e2e/` prints the message; the four-line block in a Write to `docs/x.md` prints nothing; an empty stdin exits 0 printing nothing. Each outcome reported with its output.
- No Playwright spec: nothing on screen changes.
