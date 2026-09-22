---
name: intake
description: Take one BOARD.md line — the first without a dossier unless the user names one — and settle its design with the user: the forks, the contradictions with the docs, the scope. Ends with a task dossier a later ship session executes with no design question left. Use when asked to intake, design, or prepare a line.
---

# Intake

One board line per invocation: the first line with no dossier link, unless the user names another. The output is a dossier specific enough that the ship session — another model, no memory of this conversation — opens no design question.

## 1. Read

The line; the design pages, `docs/GLOSSARY.md` and `DOGMAS.md` where they touch it; the code it lands in, enough to know what it changes; for a line landing in `src/ui/`, `src/main.ts` or `e2e/`, `docs/PHASER.md`, which the dossier's Traps cite rather than restate. Time and measure what a number would settle.

## 2. Challenge

Five checks, in order; stop at the first that decides the line's fate:

1. **Conflict.** Does it contradict a decision in a design page or a rule in `DOGMAS.md`? Surface it. Changing a decision is valid work — the done-condition is then the docs edit — but silently violating one is not. The dossier is held to the same check as the line: its Plan and its Verify are read against `DOGMAS.md` before it is written.
2. **Completability.** Can a done-condition be written — a state of the repo someone can check? If not, the line is docs content (a standing fact, a domain claim) or an idea: route it there and delete the line. A content line's checkable state is the content standing in its catalogue, the catalogue's coherence test passing and its age page saying so — never a test on the content: its numbers are tuning and change. A mechanism the content needs is held by one test on a fixture, and is its own line where it is a real boundary.
3. **Scope.** Can one ship session hold the whole thing? Split only on a real abstraction boundary, never to defer the hard part; each part becomes its own line, and this pass dossiers the first.
4. **Novelty.** For a content line — an answer, a card, anything the rules resolve — does this content do something no content of its kind has done before? Then the mechanism is named in the dossier and gets its one test on the fixture: in this line where it is the one small helper the content needs, in a line ahead of it where it is a real boundary. A content line that reads as content alone and carries a mechanism unnamed is the shape this check catches.
5. **Doc-impact.** Name the `docs/` pages the work will change, or "none".

## 3. Discuss

Present what you found and the forks: one or two options each, with trade-offs and a recommendation, in prose. A pick-one prompt is for a scoping fact only. A UI change is pitched as a live mockup built from real values, the variables that change the answer as controls, one option marked recommended; a generator change is pitched running, and its dossier says whether the process is fixed or rolled and how wide it may vary. End the turn and wait; one fork may take several turns. The design pages first — much is pre-decided. A fork that is the implementer's — where a function lives, how a module is cut — is named as such and left out.

## 4. Write the dossier

Once every fork is settled, and not before, write `workflow/board/<slug>.md`:

```
# <Title>

**Line:** the board line, verbatim, with its done-condition.
**Spec:** the `docs/` pages and section headings that are the spec, the sentences to add or change in them, written out, and every player-facing sentence the line foresees — a text-table entry, a card's text — written out, so the hand-back's _Authored_ list holds only what intake did not foresee.
**Doc-impact:** the pages, or "none — <why>".
**Scope:** what is in, what is out, the corner cases decided here and how.
**Traps:** the non-local facts the implementer cannot see from the files it edits.
**Plan:** the files the change touches and the order the work lands in, each step by what it leaves standing. Never a function, a signature, or which function owns what: the implementer reads the code once, at the ship, and decides that.
**Verify:** the commands to run, and the spec to run by name.
```

Then rewrite the board line in its full form and link the dossier, the link relative to the board:

```
- **Title** — done-condition. Doc-impact: <pages | none>. [board/<slug>.md](board/<slug>.md)
```

Where a check ended the line instead — a docs edit made now, an idea, nothing — delete the line and say why in one sentence.

## Report

Commit the dossier and `workflow/BOARD.md` — and whatever a check moved, a docs edit or an idea — as `Intake: <title>`, staging those files alone; a dossier left uncommitted lands in the ship's commit and the history loses the intake. Then one line: the dossier's path and what the ship session will not have to decide, or the line's fate. Then hand the turn back; the ship is a new invocation.
