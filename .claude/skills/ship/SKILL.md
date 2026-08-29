---
name: ship
description: Execute one BOARD.md line end to end — pitch the plan, implement through the implementer agent, land code + docs + line deletion as one change, get the egress-reviewer's verdict, commit, stop. Use when asked to ship, implement, do, or take the next line.
---

# Ship

One board line per invocation. The top line unless the user names another.

## 1. Load the line

Read the line, its task file if any, the `docs/` pages in its doc-impact, and `docs/DOGMAS.md`.
If the line has no done-condition or contradicts the docs, stop: it goes back through `/intake`.

## 2. Pitch

If the line leaves any design latitude — how to structure it, which of two shapes, what to name —
write the plan and end the turn: what you found, what you propose, the open forks with a
recommendation, the one thing you could not verify, and which `docs/` pages will change. Name any
companion edit beyond the line's deliverable in one sentence ("I'll also bring X in line").

A line whose plan is already settled in its task file skips this step.

For a UI change, the pitch is a live mockup (an Artifact) built from real values, with the
variables that change the answer as controls and one option marked recommended.

## 3. Implement

Spawn the `implementer` agent with a brief containing:

- the board line and its done-condition, verbatim;
- the agreed plan, or the task file path;
- the `docs/` pages that are the spec for this change, by path;
- the doc-impact list;
- what to run to verify (typecheck, tests, the relevant command);
- the standing instruction: *the design is the spec; a gap is a Deviation in your report, not a
  change to the design; anything the plan did not foresee goes in the report*;
- the standing instruction: *after spawning any child or background task, finish finite work and
  end your turn*.

Then end the turn. The agent's completion resumes you. Never implement the line inline while an
agent is running it, and never sleep, poll, or read to wait.

## 4. Land the trinity

On the agent's report, check that the unit of work is whole:

- code changed and verification passed (the report says which commands ran and their result);
- every doc-impact `docs/` page updated, or "none" justified in one line;
- `DESIGN.md` untouched except where the line's done-condition is a design change;
- the board line deleted and its task file removed;
- the board is no longer than you found it minus this line — discoveries went through `/intake`;
- the report's *Deviations* section is present, and every item in it is relayed to the user.

Fix omissions yourself if they are mechanical (a missed doc line, a leftover task file);
anything that touches the design goes back to the user.

## 5. Review

Spawn the `egress-reviewer` with: the diff (`git diff` plus the list of untracked files), the
`docs/` page paths in the doc-impact, the board line text, and nothing about the implementation
conversation. End the turn; its verdict resumes you.

- **Blocking findings** go back to the implementer as a new brief, with the finding quoted.
  After two rejection rounds, stop and hand the disagreement to the user compressed to its
  inflexion point.
- **Advisory findings** are relayed in one line each, not acted on unless the user says so.

## 6. Commit

Once the review is LOOKS GOOD (or its blocking findings are fixed): check `CLAUDE.md` and the
touched `docs/` pages for staleness, fix in the same commit, write the message to a scratchpad
file, `git commit -F`. One commit per line. Do not push.

## 7. Hand back

Report to the user: what shipped, the commit, the deviations, the review verdict, what to inspect
and how, and what the next line would do. Then stop — the next line is a new invocation.
