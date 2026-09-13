---
name: upkeep
description: The maintenance loop — docs lint, board and ideas eviction, the harness ratchet that turns recurring corrections into DOGMAS.md lines, the memory lint, and the upstream traps. Run every 20 shipped board lines or monthly, whichever first, when a hand-back takes the parked leftovers past 100 lines, or when asked.
---

# Upkeep

A recurring pass over five surfaces. Findings become board lines through `/todo` on the user's
word, or edits made now; the pass itself changes nothing silently — every change is listed in the report.

Count cycles from the git log: one cycle is one commit that deleted a board line. Note the
date and commit of this pass at the top of the report so the next pass knows where to count from.

## 1. Docs lint

Read every page reachable from `docs/index.md`. For each, check:

- **Contradictions** between pages, or between a page and `CLAUDE.md`.
- **Claims stale against code** — a path, command, name or number the repo no longer matches.
  Verify by reading, not by recollection.
- **Orphans** — a page `index.md` does not reach, or a page nothing links to.
- **Eviction candidates** — a page untouched and uncited for 20 cycles. Propose deletion or a
  merge into its parent summary.
- **Domain claims** have no code to lint against: check their named source still says so; flag
  an interview-sourced claim older than three months for re-interview.
- **`CLAUDE.md` length** — if it has grown past ~150 lines, propose what moves to a `docs/` page.
- **Page shape** — a page whose table of contents no longer reads at a glance, or whose level-2
  sections have grown into documents of their own: propose the split, naming the seams and the
  files. Never make it in this pass; a split of a `docs/` page is a design of its own and goes to
  the user, then through `/todo` and `/intake`.

## 2. Board and ideas eviction

Oldest first. For each `BOARD.md` line untouched for 20 cycles: still wanted, still completable,
still correctly scoped? Propose delete, demote to `IDEAS.md`, or keep with the reason. For each
`IDEAS.md` entry untouched for 20 cycles: restate it in one line so the user sees it again, and
propose promotion through `/todo` where it has become due. Age alone never evicts an idea;
`IDEAS.md` is a long-term document. A task file in `board/` whose line is gone is deleted now.

## 3. Harness ratchet

Mine the recurring corrections:

- the project memory directory — any `feedback` memory is a candidate dogma;
- egress review findings that recurred (search the git log and recent task files for the
  reviewer's advisory wording);
- corrections the user made in recent sessions that you can see.

Three occurrences of the same class is a harness problem, not a code problem. For each, propose
the amendment — a `DOGMAS.md` line, a charter line in an agent, a lint rule in a hook, a skill
edit — as a board line through `/todo`, or make the edit now if it is a one-liner the user has
already stated twice. A feedback memory promoted to a dogma is deleted from memory in the same
pass; memory keeps only facts about the user, not rules for the repo.

## 4. Memory lint

Read every file in the project memory directory. Memory holds what the repo does not: who the
user is, how they want the work done, calls and intents the docs do not carry, questions they
have not answered. For each file:

- **Repeats the repo** — a commit hash, a shipped line, a settled number, a call that became a
  `docs/` page or a board line: cut it. Git, `docs/` and `BOARD.md` hold it.
- **Journal shape** — a paragraph per pitch or per session: rewrite as facts, one line each,
  grouped by what they are (standing calls, parked intents, open questions, candidates).
- **Stale pointer** — a file, function, flag or line it names: verify against the tree, fix or
  drop.
- **Wrong or overtaken** — the user reversed it, or the code moved on: delete.
- **Index** — `MEMORY.md` has one line per file and no content; each description line still
  says what the file holds.

Every cut is listed in the report by file and gist.

Then triage the leftovers parked in `project-status.md` — open questions, parked intents, feel
checks never reported, candidates, advisories — every one of them, including those a past triage
kept. Present them in batches of about ten, grouped by kind, each with a recommendation: a board
line or an idea through `/todo`, a harness edit, keep, or drop. Act on the user's answers before the
next batch: the moves are made and committed, the drops cut from memory. What the user keeps stays
under its heading. Standing calls, measurements and ratchet counts are not leftovers and are not
triaged.

## 5. Upstream traps

A workaround for a dependency's bug carries a trap comment citing the upstream issue
(`phaserjs/phaser#7372`). Search `src/` and the config files for comments citing an issue in
another repository, and check each with `gh issue view`. An issue still open: nothing. An issue
closed with its fix in a released version: propose, through `/todo` on the user's word, a board
line to bump the dependency and disarm the trap. Closed with no fix, or fixed only on an unreleased
branch: say so and leave the trap standing.

## Report

One block per surface: what was checked, what was found, what was changed, what went to the
board. "Nothing found" is a valid and common result on the first three and the fifth; the memory lint
usually finds something.
