---
name: intake
description: Take one BOARD.md line — the first without a dossier unless the user names one — and settle its design with the user: the forks, the contradictions with the docs, the scope. Ends with a task dossier a later ship session executes with no design question left. Use when asked to intake, design, or prepare a line.
---

# Intake

One board line per invocation: the first line with no dossier link, unless the user names
another. The output is a dossier specific enough that the ship session — another model, no memory
of this conversation — opens no design question.

## 1. Read

The line; `docs/DESIGN.md`, `docs/GLOSSARY.md` and `docs/DOGMAS.md` where they touch it; the code
it lands in, enough to know what it changes. Time and measure what a number would settle.

## 2. Challenge

Four checks, in order; stop at the first that decides the line's fate:

1. **Conflict.** Does it contradict a decision in `docs/DESIGN.md` or a rule in `docs/DOGMAS.md`?
   Surface it. Changing a decision is valid work — the done-condition is then the docs edit — but
   silently violating one is not.
2. **Completability.** Can a done-condition be written — a state of the repo someone can check?
   If not, the line is docs content (a standing fact, a domain claim) or an idea: route it there
   and delete the line.
3. **Scope.** Can one ship session hold the whole thing? Split only on a real abstraction
   boundary, never to defer the hard part; each part becomes its own line, and this pass dossiers
   the first.
4. **Doc-impact.** Name the `docs/` pages the work will change, or "none".

## 3. Discuss

Present what you found and the forks: one or two options each, with trade-offs and a
recommendation, in prose. A pick-one prompt is for a scoping fact only. A UI change is pitched as
a live mockup built from real values, the variables that change the answer as controls, one option
marked recommended; a generator change is pitched running, and its dossier says whether the
process is fixed or rolled and how wide it may vary. End the turn and wait; one fork may take
several turns. `DESIGN.md` first — much is pre-decided. A fork that is the implementer's — where a
function lives, how a module is cut — is named as such and left out.

## 4. Write the dossier

Once every fork is settled, and not before, write `board/<slug>.md`:

```
# <Title>

**Line:** the board line, verbatim, with its done-condition.
**Spec:** the `docs/` pages and section headings that are the spec, and the sentences to add or
change in them, written out.
**Doc-impact:** the pages, or "none — <why>".
**Scope:** what is in, what is out, the corner cases decided here and how.
**Traps:** the non-local facts the implementer cannot see from the files it edits.
**Plan:** the modules and functions the change touches, and the order, at the altitude of a
choke point — which function owns the invariant — never a line number; the implementer reads
the code once, at the ship.
**Verify:** the commands to run, and the spec to run by name.
```

Then rewrite the board line in its full form and link the dossier:

```
- **Title** — done-condition. Doc-impact: <pages | none>. [board/<slug>.md](board/<slug>.md)
```

Where a check ended the line instead — a docs edit made now, an idea, nothing — delete the line
and say why in one sentence.

## Report

One line: the dossier's path and what the ship session will not have to decide, or the line's
fate. Then hand the turn back; the ship is a new invocation.
