# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
traps, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **A worker acts once** — a worker holds one action; a card played through a worker (building,
  improvement, terraform) spends one of it and is refused, with its own reason, on a worker that has
  none left; the design and the glossary say so. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
  [board/worker-acts-once.md](board/worker-acts-once.md)