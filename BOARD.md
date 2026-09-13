# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
traps, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **A worker attacks nothing because it is a worker** — whether a unit is a worker is written on
  the unit itself and alone decides what its action buys: the player's attack, the enemy's attack
  and the cards played through a worker all read it, and no stat does; a worker with range one still
  attacks nothing and lights nothing, a fighter with action left is refused every card played
  through a worker; the design and the glossary say so. Doc-impact: `docs/DESIGN.md`,
  `docs/GLOSSARY.md`. [board/worker-by-kind.md](board/worker-by-kind.md)
