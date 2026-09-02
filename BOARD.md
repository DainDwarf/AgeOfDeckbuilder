# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The turn staged** — every step after the turn ends plays in visible sequence instead of
  resolving at once: discard, combat, income, enemy move and intent, draw, shuffle.
- **Unplayable reasons on screen** — a card in hand that cannot be played shows why when zoomed:
  the unaffordable resources it already marks, joined by the blocked reasons (no free tile, no
  population, no valid target). Doc-impact: none.
- **Movable map** — the chronicle scene's camera pans by drag and zooms by wheel, bounded so the
  map cannot leave the frame entirely; text stays crisp at every zoom; the standing e2e passes.
  Stays a camera concern: the tile's drawn size is the map layer's fact alone, never a number the
  rest of the UI leans on — the art pack dictates it later (`docs/ASSET-SOURCES.md`).
  Doc-impact: none.
- **Closes v0.0.1** — Only when the board is empty. Version bump and release note. Doc-impact: `docs/ROADMAP.md`, `CHANGELOG.md`.