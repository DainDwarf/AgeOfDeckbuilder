# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The menu** — a menu opens over the table and closes back to it, drawn in Phaser like
  everything else; its first page lists every bound key, each rebound by pressing the new key,
  and the bindings survive a reload; the standing e2e passes. Doc-impact: `docs/DESIGN.md`.
- **Closes v0.0.1** — Only when the board is empty. Version bump and release note. Doc-impact: `docs/ROADMAP.md`, `CHANGELOG.md`.
