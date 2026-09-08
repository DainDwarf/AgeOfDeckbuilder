# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The selection ring stands over fog and city mode's dim** — the ring on the selected tile is
  drawn undarkened over a tile in fog and over a held tile nobody works in city mode, as it is over
  the yield overlay's dim. Checked through `visual-check`. Doc-impact: `docs/DESIGN.md`.
- **Movement costs what the tile says** — the flat one-per-tile goes; every terrain names its
  movement cost and `reachable` charges it, so the map's and the units' sections of the design
  agree on one rule. Rules tests on a fixed seed. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **What a river costs to cross** — the design settles what crossing a river edge costs, and every
  path over the map pays it. A rules test on a seed whose river cuts a unit's reach.
  Doc-impact: `docs/DESIGN.md`.
- **Placeholder road card** — a stand-in improvement card lays a road that lowers its tile's
  movement cost; a rules test shows a unit reaching further over it than beside it.
  Doc-impact: none.
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