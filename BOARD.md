# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The right-click spec scans for its bare tile** — the right-click test in `e2e/inspect.spec.ts`
  takes its tile from a seed scan that checks the tile holds only its terrain card, as the file's
  other tests do, and no hand-picked seed or tile key remains in it. Doc-impact: none.