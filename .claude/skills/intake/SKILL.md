---
name: intake
description: The ingress loop. Turn a request, idea, bug or discovery into a BOARD.md line, a docs edit, an IDEAS.md jot, or nothing. Use whenever new work is proposed, when the user says "jot:" / "TODO:" / "note that down", or when exploration surfaces work outside the current line.
---

# Intake

No work reaches the board unchallenged. Input: one request, idea, bug or discovery, in the
user's words or yours. Output: exactly one of the four outcomes below, stated in one line.

## The jot shortcut

"jot: …", "TODO: …", "note that down" mid-task: append one line to `IDEAS.md` under the right
heading and return to the task. No challenge, no elaboration, no reply beyond "jotted".

## The challenge

Run these four checks, in order, and stop at the first that decides the outcome:

1. **Conflict.** Does it contradict a decision in `docs/DESIGN.md` or a rule in
   `docs/DOGMAS.md`, or duplicate an existing board line? Surface it. Changing a decision is
   valid work — the line's done-condition is then the docs edit — but silently violating one is
   not. A duplicate merges into the existing line.
2. **Completability.** Does it have a done-condition — a state of the repo someone can check?
   If not, it is docs content (a standing fact, a domain claim) or an idea. Route it there. A
   line on the map generator also says whether the process is fixed or rolled, and how wide it
   may vary; ask when the request does not say.
3. **Scope.** Can one session hold the whole thing in context? Split only on a real abstraction
   boundary; never split to defer the hard part. Each part gets its own line and done-condition.
4. **Doc-impact.** Name the `docs/` pages the work will change, or "none". The reviewer checks this.

## Writing the line

Insert into `BOARD.md` at its priority position:

```
- **Title** — done-condition. Doc-impact: <pages | none>.
```

A line that needs more than a sentence of context links a task file `board/<slug>.md` holding
scope, doc-impact, hazards, and plan. Write the task file once the plan is settled with the user,
not while it is being discussed.

## Outcomes

- **Board line** — inserted, priority stated, doc-impact named.
- **Docs edit** — the page changed now, in this unit of work.
- **Idea** — one line in `IDEAS.md`.
- **Nothing** — with the one-sentence reason (already true, out of scope, contradicts a dogma the
  user just reaffirmed).

Report the outcome in one line and hand the turn back unless the user asked to proceed.
