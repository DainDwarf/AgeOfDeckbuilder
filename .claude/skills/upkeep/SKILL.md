---
name: upkeep
description: The maintenance loop — docs lint, board and ideas eviction, and the harness ratchet that turns recurring corrections into DOGMAS.md lines. Run every 20 shipped board lines or monthly, whichever first, or when asked.
---

# Upkeep

A recurring pass over three surfaces. Findings become board lines through `/intake` or edits made
now; the pass itself changes nothing silently — every change is listed in the report.

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

## 2. Board and ideas eviction

Oldest first. For each `BOARD.md` line untouched for 20 cycles: still wanted, still completable,
still correctly scoped? Propose delete, demote to `IDEAS.md`, or keep with the reason. For each
`IDEAS.md` entry untouched for 20 cycles: propose delete or promote through `/intake`. A task
file in `board/` whose line is gone is deleted now.

## 3. Harness ratchet

Mine the recurring corrections:

- the project memory directory — any `feedback` memory is a candidate dogma;
- egress review findings that recurred (search the git log and recent task files for the
  reviewer's advisory wording);
- corrections the user made in recent sessions that you can see.

Three occurrences of the same class is a harness problem, not a code problem. For each, propose
the amendment — a `DOGMAS.md` line, a charter line in an agent, a lint rule in a hook, a skill
edit — as a board line through `/intake`, or make the edit now if it is a one-liner the user has
already stated twice. A feedback memory promoted to a dogma is deleted from memory in the same
pass; memory keeps only facts about the user, not rules for the repo.

## Report

One block per surface: what was checked, what was found, what was changed, what went to the
board. "Nothing found" is a valid and common result.
