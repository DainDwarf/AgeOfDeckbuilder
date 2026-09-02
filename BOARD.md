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
- **The card face** — the card's design style is settled with the user and implemented: name and
  cost both legible at hand size, art boxes equal height on every card, and the settled anatomy
  recorded. Doc-impact: `docs/DESIGN.md`.
- **Unplayable reasons on screen** — a card in hand that cannot be played shows why when zoomed:
  the unaffordable resources it already marks, joined by the blocked reasons (no free tile, no
  population, no valid target). Doc-impact: none.
- **A lost release ends the press** — when the window loses focus mid-press the browser delivers
  no release, and Phaser's drag stays in flight: the card follows the pointer, the next press
  starts nothing, and the release after that ends the old drag wherever it lands. On the game's
  blur, every gesture ends the way a release off the canvas does and Phaser's drag state is
  cleared, so the next press starts clean. Proven by an e2e that presses a hand card, blurs the
  window, and asserts the card is home and the next press starts a fresh gesture.
  Doc-impact: none.
- **Movable map** — the chronicle scene's camera pans by drag and zooms by wheel, bounded so the
  map cannot leave the frame entirely; text stays crisp at every zoom; the standing e2e passes.
  Stays a camera concern: the tile's drawn size is the map layer's fact alone, never a number the
  rest of the UI leans on — the art pack dictates it later (`docs/ASSET-SOURCES.md`).
  Doc-impact: none.
- **Closes v0.0.1** — Only when the board is empty. Version bump and release note. Doc-impact: `docs/ROADMAP.md`, `CHANGELOG.md`.