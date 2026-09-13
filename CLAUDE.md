# CLAUDE.md

Guidance for Claude Code sessions in this repository.

## Project

**Age of Deckbuilder** (working name) — a card game, designed from scratch. The design is written
at design altitude in `docs/DESIGN.md`; the game is TypeScript on Phaser 4, built by Vite, played
in the browser. [`docs/DOGMAS.md`](docs/DOGMAS.md) → *Stack* holds the layout and the one
architectural rule: `src/rules/` is pure, `src/ui/` only renders.

## Three lifespans

Every file has exactly one:

- **Code** — permanent. Source of truth for *how*.
- **Docs** (`docs/`) — standing. Source of truth for *what is* and *what was decided*.
  [`docs/index.md`](docs/index.md) is the map; [`docs/DESIGN.md`](docs/DESIGN.md) the game,
  [`docs/DOGMAS.md`](docs/DOGMAS.md) the rules every session works by,
  [`docs/GLOSSARY.md`](docs/GLOSSARY.md) the closed gameplay vocabulary.
- **Task context** — ephemeral. [`BOARD.md`](BOARD.md) (ordered lines with done-conditions;
  completion is deletion), `board/<slug>.md` task files (die with their line),
  [`IDEAS.md`](IDEAS.md) (unordered pool, nothing promised), and on a branch of several lines a
  `BRANCH.md` (its design first, its lines after; deleted before the merge).

[`CHANGELOG.md`](CHANGELOG.md) is player-facing release notes, written at version bumps only.
Nothing durable cites a board line, a task file or an idea.

## The four loops

- **`/todo`** — on the user's order, a request, bug or discovery becomes a board line — a title
  and one sentence, placed in order — or an idea. Never on Claude's own initiative.
- **`/intake`** — one board line, the first without a dossier, gets its design settled with the
  user: forks, contradictions with the docs, scope. Ends in a dossier a ship session executes with
  no design question left.
- **`/ship`** — take one dossiered line, implement through the `implementer` agent, land the
  trinity (code + `docs/` pages + line deleted), get the `egress-reviewer`'s verdict, commit,
  stop.
- **`/upkeep`** — on the user's order; the ship hand-back reminds them after 20 lines, 30 days,
  or 100 lines of parked leftovers since the last one: docs lint, board eviction, the **ratchet** — recurring corrections become `DOGMAS.md`
  lines — the memory lint with the leftovers' triage, and the upstream traps.

## Roles

- **Main session** (this one): design discussion with the user, intake, orchestration. Does not
  implement a board line inline when it has design latitude — it pitches, then delegates.
- **`implementer`** (Opus): executes an agreed plan; reports deviations instead of coding them.
- **`egress-reviewer`** (Opus, fresh context): reviews diff + docs + board line, nothing else.
- **`ui-check`** (Sonnet): drives the running app with Playwright and reports what is broken on
  screen; spawned by the `visual-check` skill, never from this session.

## Non-negotiables

Full rules in [`docs/DOGMAS.md`](docs/DOGMAS.md). The ones no session may miss:

1. **Pitch before writing.** Orient freely; surface the plan before the first file changes.
2. **One line per turn.** Ship a step, commit it, stop so the user can inspect. Claude owns
   commit granularity; pushing stays on request.
3. **Design is the spec.** Code that disagrees is wrong. A gap is reported as a deviation, never
   coded in silently, and the design page is never edited down to match an implementation.
4. **Report corner cases.** Anything the agreed design did not foresee goes in the report.
5. **One verb per concept.** Gameplay terms come from `GLOSSARY.md`; no synonyms, ever.
6. **No handholding.** Players learn, misplay, and lose. No guard rails, no safety nets.
7. **Comments are for traps only.** `docs/` holds the why.

## Environment

- Windows 11. **Default to the PowerShell tool**; Bash only for genuine POSIX needs. Prefer
  Read/Grep/Glob/Edit/Write over shell commands for file work.
- In the Bash tool, never hand a `C:\...` path to `grep`/`test`/`[ -f ]` — it silently matches
  nothing. Use the Read tool or the `/c/...` form.
- Multi-line commit messages go through a scratchpad file and `git commit -F` — a PowerShell
  here-string turns `''` into two literal apostrophes.
- Long commands run with `run_in_background`; never a sleep poll. **After spawning a child agent
  or background task, finish any finite work and end the turn** — its completion resumes you.
- Node 24 and npm are on PATH. **Rust is not installed**: anything needing it — Tauri, the desktop
  build — is a board line of its own, never a step inside another one.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server. Background only; the `run` skill reads the URL from its output. |
| `npm run check` | TypeScript, no emit. |
| `npm test` | Vitest — the rules tests. |
| `npm run e2e` | The whole Playwright/Chromium suite, starting the dev server itself; this is the CI check on every push, and a hook refuses it from a session. A session runs one spec, the one its line touches or names: `npx playwright test e2e/<spec>.spec.ts`. |
| `npm run lint` | Biome, lint and format check. `npx biome check --write .` fixes. |
| `npm run build` | Vite build into `dist/`. |
