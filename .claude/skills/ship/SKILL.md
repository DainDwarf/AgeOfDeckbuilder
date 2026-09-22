---
name: ship
description: Execute one dossiered BOARD.md line end to end — implement through the implementer agent, land code + docs + line deletion as one change, get the egress-reviewer's verdict, commit, stop. Use when asked to ship, implement, do, or take the next line.
---

# Ship

One board line per invocation: the top line with a dossier link, unless the user names another. A line without a dossier is not shipped — say so and stop; `/intake` comes first.

## 1. Load the line

Read the line, its dossier, the `docs/` sections the dossier names, and `DOGMAS.md`. If the dossier leaves a design question open, the line contradicts the docs it names, or the dossier's plan contradicts a rule in `DOGMAS.md` — a gameplay test on real content is the one that has happened — stop: it goes back through `/intake`. Nothing is pitched here; the design was settled at intake.

## 2. Implement

Spawn the `implementer` agent with a brief containing:

- the board line and its done-condition, verbatim;
- the dossier's path;
- the `docs/` pages that are the spec for this change, by path and section heading — the implementer reads the sections named, not the whole page;
- the doc-impact list;
- `docs/PHASER.md`, named as the page to read first, when the line touches `src/ui/`, `src/main.ts` or `e2e/`;
- what to run to verify (`npm run fmt`, then typecheck, tests, the relevant command);
- the standing instruction: _the design is the spec; a gap is a Deviation in your report, not a change to the design; anything the dossier did not foresee goes in the report_;
- the standing instruction: _after spawning any child or background task, finish finite work and end your turn_.

Then end the turn. The agent's completion resumes you. Never implement the line inline while an agent is running it, and never sleep, poll, or read to wait.

## 3. Land the trinity

On the agent's report, check that the unit of work is whole:

- code changed and verification passed (the report says which commands ran and their result);
- every doc-impact `docs/` page updated, or "none" justified in one line;
- the design pages untouched except where the line's done-condition is a design change;
- the board line deleted and its dossier removed;
- the board is no longer than you found it minus this line — a discovery is in the report, never on the board;
- the report's _Deviations_ section is present, and every item in it is relayed to the user;
- the report's _Authored_ section is present and complete: every entry the diff adds or changes in `src/ui/text.ts` and every sentence it adds or changes under `docs/` or in `DOGMAS.md` is either verbatim in the dossier's Spec or listed there; one that is neither is added to the list yourself before the hand-back.

Fix omissions yourself if they are mechanical (a missed doc line, a leftover dossier); anything that touches the design goes back to the user.

## 4. Review

Spawn the `egress-reviewer` with: the diff (`git diff` plus the list of untracked files), the `docs/` page paths in the doc-impact, the board line text, the implementer's Verification section as given with the instruction to run no spec and no suite it shows green, and nothing about the implementation conversation. End the turn; its verdict resumes you.

- **Blocking findings** go back to the implementer agent that did the work, continued with SendMessage so it keeps its context, with the finding quoted. A fresh implementer is spawned only when that agent is gone. After two rejection rounds, stop and hand the disagreement to the user compressed to its inflexion point.
- **Advisory findings** are relayed in one line each, not acted on unless the user says so.

## 5. Commit

Once the review is LOOKS GOOD (or its blocking findings are fixed): check `CLAUDE.md` and the touched `docs/` pages for staleness, fix in the same commit, run `npm run fmt`, write the message to a scratchpad file, `git commit -F`. One commit per line. Do not push.

## 6. Hand back

Report to the user: what shipped, the commit, the deviations, the review verdict with its advisories one line each, the implementer's discoveries one line each, the authored sentences, each quoted with its key or page and one line on where a player or reader meets it, what to inspect and how, and what the next line would do. Then stop — the user reads the report, answers the authored sentences, and orders what becomes a shave or a `/todo`; the next line is a new invocation.

What the user leaves unordered — an advisory, a discovery, a question they did not answer — is parked in the project memory's `project-status.md`, one line under its heading, for `/upkeep`'s triage.

The hand-back ends with the upkeep reminder when one is due: count the `Ship:` commits since the last `Upkeep:` commit, and the days since it. At 20 lines or more, 30 days or more, or parked leftovers past 100 lines, the report's last line says so with the numbers — _"23 lines and 34 days since the last upkeep."_ It is a reminder, never a stop: the hand-back ends as it would, the next `/ship` runs as it would, and the reminder returns at every hand-back until an upkeep lands.

## Notifications

Send a PushNotification at exactly the turns that block on the user: the hand-back awaiting the feel check, and a mid-run stop that needs their decision. One line naming what is waiting. No other turn notifies.
