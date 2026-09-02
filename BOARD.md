# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Every hover ends at the canvas edge** — one hover helper, beside the click one, that every
  hover source on the table goes through (resource readings, infopanel rows, the end-turn button,
  hand cards); it ends the hover when the pointer leaves the canvas, so the tooltip module's own
  leave listener goes; a pointer that leaves the canvas over the end-turn button reverts its label
  and over a lifted card settles it, both covered by e2e. Doc-impact: none.
- **The turn staged** — every step after the turn ends plays in visible sequence instead of
  resolving at once: discard, combat, income, enemy move and intent, draw, shuffle.
- **Unplayable reasons on screen** — a card in hand that cannot be played shows why when zoomed:
  the unaffordable resources it already marks, joined by the blocked reasons (no free tile, no
  population, no valid target). Doc-impact: none.
- **The menu** — a menu opens over the table and closes back to it, drawn in Phaser like
  everything else; its first page lists every bound key, each rebound by pressing the new key,
  and the bindings survive a reload; the standing e2e passes. Doc-impact: `docs/DESIGN.md`.
- **Closes v0.0.1** — Only when the board is empty. Version bump and release note. Doc-impact: `docs/ROADMAP.md`, `CHANGELOG.md`.