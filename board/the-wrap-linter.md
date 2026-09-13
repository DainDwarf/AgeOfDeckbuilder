# The wrap linter

**Line:** The wrap linter — every markdown file in the repo is one line per paragraph, `npm run lint` fails on a hand-wrapped paragraph in any of them, and `npm run fmt` unwraps it. Doc-impact: DOGMAS.md, CLAUDE.md.

**Spec:** the decision is that prose is never hard-wrapped: a paragraph, a list item, a blockquote line is one line of the file, whatever its length, and a tool keeps it so. The tool is Prettier, pinned exactly at `3.9.6` as a devDependency, configured in one `.prettierrc` holding only `proseWrap: never` and `embeddedLanguageFormatting: off`, and invoked only on markdown. It runs inside the one gate every path already goes through: `npm run lint` checks code with Biome then markdown with Prettier, and `npm run fmt` fixes both in that order. Code keeps Biome and its width of 100; nothing on the code side changes.

`docs/DOGMAS.md` → _Docs_, a new line at the end of the section:

> - **A paragraph is one line.** No markdown file is hard-wrapped; Prettier keeps it so (`npm run fmt`) and `npm run lint` refuses a wrapped one. Why: a phrase broken across a line break is invisible to a search, and an edit mid-paragraph no longer reflows what follows.

`docs/DOGMAS.md` → _Stack_, the lint row becomes:

> | Lint and format | Biome for code, one `biome.json`; Prettier for markdown, one `.prettierrc` |

`CLAUDE.md` → _Commands_, the lint row becomes and a fmt row follows it:

```markdown
| `npm run lint` | Biome on the code, Prettier on the markdown: lint and format check. |
| `npm run fmt` | Fixes what `npm run lint` checks: Biome writes the code, Prettier unwraps the markdown. |
```

`.claude/skills/ship/SKILL.md`: in step 2 the brief's verification bullet reads "what to run to verify (`npm run fmt`, then typecheck, tests, the relevant command);" and in step 5 the commit step runs `npm run fmt` after the staleness fixes and before the message is written, so nothing wrapped reaches a commit.

**Doc-impact:** `docs/DOGMAS.md` (Docs section, Stack table), `CLAUDE.md` (Commands table). The ship skill is harness, not docs, and changes as above.

**Scope:** in — the Prettier dependency and its config; the `lint` script gaining `prettier --check "**/*.md"` after Biome and a new `fmt` script running `biome check --write .` then `prettier --write "**/*.md"`; the one-time unwrapping of every tracked markdown file; the three doc and harness edits above. Out — the CI workflow, which already runs `npm run lint` and so gains the check for free; any hook, which was weighed and rejected because a reformat under an edit forces a re-read before the next one; any change to Biome or to the code width; the memory directory, which lives outside the repo. Corner cases decided here: Prettier's other rewrites are accepted as they come — italics move from asterisks to underscores, tables are padded so their columns align, trailing blank lines collapse to one; none of them changes what renders. YAML frontmatter is left as it is by Prettier, and code fences are left as they are by `embeddedLanguageFormatting: off` — without it Prettier rewrites the JavaScript in `.claude/agents/ui-check.md` — so a skill's long single-line description and a long line inside a fence stay legal. Windows Notepad's formatted view compacts a table on save; `npm run fmt` restores the padded form, verified byte-for-byte equal on the glossary, so a Notepad edit needs the format run and nothing more.

**Traps:**

- `.claude/hooks/glossary-lint.cjs` parses the glossary's table rows with a regex that trims cell whitespace; the padded rows still parse, and the separator row still matches its dash test. Do not touch the hook; do check the lint still fires after the reformat by editing `src/ui/text.ts` with a forbidden word in a scratch edit and reverting.
- Prettier 3 reads `.gitignore` by default, so `dist/`, which carries a `LICENSES.md` copy, and `node_modules/` are skipped. The `--check` run's file list must show nothing under `dist/`; if it does, a `.prettierignore` holding `dist/` is the fix, not a narrower glob.
- The npm scripts are run by cmd.exe on Windows and by sh in CI; the glob is Prettier's to expand and is written quoted in `package.json` so sh never expands it.
- The `&&` between the two checks means Prettier does not run when Biome fails; a red `lint` is fixed with `fmt`, then rerun, so both are seen.
- The reformat touches `docs/DESIGN.md` throughout. That is the Prep commit's doing, not the Ship commit's; the ship session's "DESIGN.md untouched" check applies to the Ship diff.
- Prettier's exact version is pinned with `--save-exact`; the lockfile changes and is committed.
- A quote that holds markdown breaks under Prettier: a quoted line starting with a literal `>` gains a `>` on every run, and consecutive quoted table rows are joined into one line. Such a quote is written as a `markdown` fence instead.
- The `named-spec.cjs` hook gates shell commands that name Playwright; the new scripts do not, so no hook edit.

**Plan:**

1. The ship session, before spawning the implementer: run `npx prettier@3.9.6 --prose-wrap never --embedded-language-formatting off --write "**/*.md"` at the root, confirm `git status` lists only markdown files and none under `dist/`, and commit that alone as `Prep: the docs unwrapped`. The reviewer then reads a mechanism diff, not two thousand lines of joined paragraphs.
2. The implementer: install Prettier exact; write `.prettierrc`; rewrite the `lint` script and add `fmt` in `package.json`; make the DOGMAS, CLAUDE and ship-skill edits from Spec; run `npm run fmt` so its own edits are unwrapped; delete the board line and this file.
3. The done-condition, checked by the implementer: hand-wrap one paragraph of `IDEAS.md` across two lines, run `npm run lint` and see it fail naming the file, run `npm run fmt` and see the paragraph rejoined, `git status --porcelain IDEAS.md` printing nothing.

**Verify:** `npm run lint` passes on the finished tree; `npm run fmt` followed by `git status --porcelain` prints nothing, so the format is idempotent; `npm run check` and `npm test` unchanged; the negative check of plan step 3 with its output in the report. No Playwright spec: nothing on screen changes.
