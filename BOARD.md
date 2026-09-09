# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Move points count in hundredths** — every move stat, move point and movement cost in
  `src/rules/` is an integer counting hundredths of a move point, content tables included, and the
  unit card formats them as decimals with trailing zeros trimmed, so today's readings hold; the
  existing tests and specs pass with their numbers scaled. Doc-impact: `docs/DOGMAS.md`.
- **Placeholder road card** — a stand-in improvement card lays a road on plain, forest, hills or
  urban; a road's tile costs half a move point to enter whatever lies under it, a river edge with a
  road on both banks is a bridge, crossed as if no river ran there, and the map marks a road above
  its tile. Rules tests show a unit reaching further over a road than beside it and across a bridge
  undrained. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`. [board/road.md](board/road.md)
- **The terrain card reads the movement cost** — the inspected tile's terrain card carries a small
  "Mv X" in its top-right corner, X being the tile's movement cost, a road's read as 0.5; a water
  tile's reading is settled at the pitch. An e2e spec reads it off a tile.
  Doc-impact: `docs/DESIGN.md`.
- **Camps on the map** — the generator places camps, each uncharted until seen, and an event that
  spawns enemies spawns them at a camp instead of the outer ring. Rules test on a fixed seed plus
  an e2e spec. Doc-impact: `docs/DESIGN.md`.
- **Capturing a camp** — a unit standing on a camp through a full turn captures it; a captured camp
  spawns nothing again and pays a one-use stand-in card that joins the chronicle's deck and is gone
  when played. Rules tests for the capture, the silenced camp and the card's one use.
  Doc-impact: `docs/DESIGN.md`.
- **The schedule** — events become a weighted table whose weights shift with the turn, drawn from
  the chronicle's own generator: the same seed deals the same schedule, the harshest entries carry
  no weight early, and a raid drawn late is larger than one drawn early. Rules tests pin all three.
  Doc-impact: `docs/DESIGN.md`.
- **The events phase deals a choice** — the phase offers several of the schedule's events as cards
  and the player takes one, which resolves; this replaces the design's "land and resolve at once".
  An e2e spec plays a turn through the deal. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **The chronicle has a length** — the capstone's turn is fixed at the founding and read on the
  chronicle screen; the end-turn button's readout is re-judged against it.
  Doc-impact: `docs/DESIGN.md`.
- **The capstone, and victory** — `PH_Siege` lands on its fixed turn, spans its turns and ends the
  chronicle: victory while the city holds, defeat when it does not. A victory screen mirrors the
  defeat screen, and rules tests pin both endings. Doc-impact: `docs/DESIGN.md`,
  `docs/GLOSSARY.md`.