# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Income flies in from the tiles** — at the income stage each yielding tile sends its resource to the bar. Doc-impact: none.
- **What a river gives** — the design page decides what a tile a river runs along yields, the rules yield it at income and the yield overlay and infopanel show it. Doc-impact: `docs/DESIGN.md`.