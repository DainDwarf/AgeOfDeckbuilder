# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Three inspection cards** — the design page states the inspection cycle as at most three cards, the unit, the building with the tile's improvements, and the terrain with its feature and the river running along it, a card absent when nothing fills it; the infopanel steps exactly those and each card shows what its layers give. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.