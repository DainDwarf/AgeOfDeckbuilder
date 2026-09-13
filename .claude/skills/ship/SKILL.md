---
name: ship
description: Execute one dossiered BOARD.md line end to end — implement through the implementer agent, land code + docs + line deletion as one change, get the egress-reviewer's verdict, commit, stop. Use when asked to ship, implement, do, or take the next line.
---

# Ship

One board line per invocation: the top line with a dossier link, unless the user names another.
A line without a dossier is not shipped — say so and stop; `/intake` comes first.

## 1. Load the line

Read the line, its dossier, the `docs/` sections the dossier names, and `docs/DOGMAS.md`. If the
dossier leaves a design question open, or the line contradicts the docs it names, stop: it goes
back through `/intake`. Nothing is pitched here; the design was settled at intake.

## 2. Implement

Spawn the `implementer` agent with a brief containing:

- the board line and its done-condition, verbatim;
- the dossier's path;
- the `docs/` pages that are the spec for this change, by path and section heading — the
  implementer reads the sections named, not the whole page;
- the doc-impact list;
- what to run to verify (typecheck, tests, the relevant command);
- the standing instruction: *the design is the spec; a gap is a Deviation in your report, not a
  change to the design; anything the dossier did not foresee goes in the report*;
- the standing instruction: *after spawning any child or background task, finish finite work and
  end your turn*.

Then end the turn. The agent's completion resumes you. Never implement the line inline while an
agent is running it, and never sleep, poll, or read to wait.

## 3. Land the trinity

On the agent's report, check that the unit of work is whole:

- code changed and verification passed (the report says which commands ran and their result);
- every doc-impact `docs/` page updated, or "none" justified in one line;
- `DESIGN.md` untouched except where the line's done-condition is a design change;
- the board line deleted and its dossier removed;
- the board is no longer than you found it minus this line — a discovery is in the report, never
  on the board;
- the report's *Deviations* section is present, and every item in it is relayed to the user.

Fix omissions yourself if they are mechanical (a missed doc line, a leftover dossier); anything
that touches the design goes back to the user.

## 4. Review

Spawn the `egress-reviewer` with: the diff (`git diff` plus the list of untracked files), the
`docs/` page paths in the doc-impact, the board line text, and nothing about the implementation
conversation. End the turn; its verdict resumes you.

- **Blocking findings** go back to the implementer agent that did the work, continued with
  SendMessage so it keeps its context, with the finding quoted. A fresh implementer is spawned
  only when that agent is gone. After two rejection rounds, stop and hand the disagreement to
  the user compressed to its inflexion point.
- **Advisory findings** are relayed in one line each, not acted on unless the user says so.

## 5. Commit

Once the review is LOOKS GOOD (or its blocking findings are fixed): check `CLAUDE.md` and the
touched `docs/` pages for staleness, fix in the same commit, write the message to a scratchpad
file, `git commit -F`. One commit per line. Do not push.

## 6. Hand back

Report to the user: what shipped, the commit, the deviations, the review verdict with its
advisories one line each, the implementer's discoveries one line each, what to inspect and how,
and what the next line would do. Then stop — the user reads the report and orders what becomes a
shave or a `/todo`; the next line is a new invocation.

What the user leaves unordered — an advisory, a discovery, a question they did not answer — is
parked in the project memory's `project-status.md`, one line under its heading, for `/upkeep`'s
triage. When parking takes that file past 100 lines, the hand-back proposes an `/upkeep` now.

## Notifications

Send a PushNotification at exactly the turns that block on the user: the hand-back awaiting the
feel check, and a mid-run stop that needs their decision. One line naming what is waiting. No
other turn notifies.
