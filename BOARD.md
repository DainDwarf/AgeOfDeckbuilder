# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Deck and hand** — the hardcoded stand-in deck: draw five, pay resource costs to play, discard
  the rest at end, shuffle the discard pile into an empty draw pile; hand rendered, unaffordable
  cards unplayable. Doc-impact: none.
- **Unit and order** — the unit cards (worker and warrior) each turn one population into a unit
  on the city's tile; the plain order moves a unit and its nature acts on arrival; proven by test
  and playable on screen. Doc-impact: none.
- **Building and action** — the building card raises its building on a tile inside the border
  where a worker stands; the action card does one immediate effect; all four kinds playable end
  to end. Doc-impact: none.
- **The enemy and the fall** — one enemy arrives on a hardcoded turn, declares its intent, moves
  and attacks through the enemy phase, occupies the tile it stands on; player units attack at
  income under the one-attack rule; capture of the city or population at zero ends the chronicle
  on a defeat screen. Closes v0.0.1: version bump and release note. Doc-impact: `docs/ROADMAP.md`,
  `CHANGELOG.md`.
- **Movable map** — the chronicle scene's camera pans by drag and zooms by wheel, bounded so the
  map cannot leave the frame entirely; text stays crisp at every zoom; the standing e2e passes.
  Doc-impact: none.
