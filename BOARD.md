# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The map holds the action** — before a stage plays on tiles the frame does not show, the map
  pans to hold them and only then the motion starts; a stage on tiles already in the frame pans
  nothing. The standing e2e passes. Doc-impact: none.
- **Unplayable reasons on screen** — a card in hand that cannot be played shows why when zoomed:
  the unaffordable resources it already marks, joined by the blocked reasons (no free tile, no
  population, no valid target). Doc-impact: none.
- **The menu** — a menu opens over the table and closes back to it, drawn in Phaser like
  everything else; its first page lists every bound key, each rebound by pressing the new key,
  and the bindings survive a reload; the standing e2e passes. Doc-impact: `docs/DESIGN.md`.
- **Closes v0.0.1** — Only when the board is empty. Version bump and release note. Doc-impact: `docs/ROADMAP.md`, `CHANGELOG.md`.