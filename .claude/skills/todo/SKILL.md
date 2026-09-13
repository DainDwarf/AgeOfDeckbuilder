---
name: todo
description: On the user's order, put a line on BOARD.md — a title and one sentence saying what it is about, placed in order — or a jot in IDEAS.md. Triggers are the user's words only, "todo:", "jot:", "note that down", "add a line for …"; never a discovery of Claude's own.
---

# Todo

One thing in, one line out. Input: a request, bug or discovery, in the user's words. Output: a
line on `BOARD.md`, a line in `IDEAS.md`, or a merge into a line already there. The skill runs on
the user's order and never on Claude's initiative: a discovery Claude made stays in its report,
and the user decides what becomes a line.

## Where it goes

- **A feature that may or may not happen** goes to `IDEAS.md`, one line under the right heading —
  the jot. "jot: …" says so outright; when the user says "todo" of something with no
  done-condition in sight, ask in one line which of the two they mean.
- **Anything else** — a defect, a decision to make, a piece of work — goes to `BOARD.md`. A bug
  is never an idea.
- **A duplicate** of a line already on the board merges into it: the existing line gains the
  sentence the new one adds, and nothing else moves.

## The line

```
- **Title** — one sentence saying what it is about, in the user's words where they gave them.
```

No done-condition, no doc-impact, no dossier: those are `/intake`'s, and a line without a dossier
link is by that a line waiting for intake. Do not challenge the line against the docs, do not
design it, do not split it.

## The place

Insert the line at its priority position. The user names it ("after the wrap linter", "first",
"last"); when they do not, place it where the lines around it are of its kind — a defect above the
features it would confuse, a line another line needs above that one — and say where it went and
why.

## Report

One line: the line as written and its place. Then hand the turn back.
