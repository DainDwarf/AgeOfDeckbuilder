# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Unit panel** — clicking a unit while no order is aimed shows a panel with its stats — health,
  damage, range, move — so a damaged unit's health is readable on screen. Doc-impact: none.
- **The enemy and the fall** — one enemy arrives on a hardcoded turn, declares its intent, moves
  and attacks through the enemy phase, occupies the tile it stands on; player units attack at
  income under the one-attack rule; capture of the city or population at zero ends the chronicle
  on a defeat screen. Doc-impact: none.
- **Browse scrolling** — a pile browse whose cards overflow the frame scrolls by wheel, bounded
  to its cards; proven with a deck larger than one screen. Doc-impact: none.
- **The turn staged** — every step after the turn ends plays in visible sequence instead of
  resolving at once: discard, draw, shuffle, income, enemy move and attack. Closes v0.0.1:
  version bump and release note. Doc-impact: `docs/ROADMAP.md`, `CHANGELOG.md`.
- **The card face** — the card's design style is settled with the user and implemented: name and
  cost both legible at hand size, art boxes equal height on every card, and the settled anatomy
  recorded. Doc-impact: `docs/DESIGN.md`.
- **Unplayable reasons on screen** — a card in hand that cannot be played shows why when zoomed:
  the unaffordable resources it already marks, joined by the blocked reasons (no free tile, no
  population, no valid target). Doc-impact: none.
- **Movable map** — the chronicle scene's camera pans by drag and zooms by wheel, bounded so the
  map cannot leave the frame entirely; text stays crisp at every zoom; the standing e2e passes.
  Doc-impact: none.
- **Order e2e** — a standing e2e arms the plain order, selects a unit, moves it, and asserts the
  unit stands on its destination. Doc-impact: none.
