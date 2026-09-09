# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **Capturing a camp** — a unit of the player's still standing on a camp when the enemy phase ends
  captures it: the camp leaves its slot and the stand-in reward card is laid in the discard pile,
  an instant of no cost, single use, that gains ten of each core resource. Rules tests pin the
  capture, the silenced camp, the card's arrival and its single use. Doc-impact: none, the design
  is written. [board/camp-capture.md](board/camp-capture.md)
- **A claim refuses a camp and an occupied tile** — `claimable` turns down the tile a camp fills and
  the tile an enemy occupies, so the border grows around neither and neither takes an inhabitant;
  a camp's tile is claimed like any other once a capture empties its slot. Rules tests pin both
  refusals and the tile a capture frees. Doc-impact: `docs/DESIGN.md`.
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
  chronicle: victory while the city holds, defeat when it does not. Its intake decides how the
  siege enters a chronicle whose every camp is captured. A victory screen mirrors the defeat
  screen, and rules tests pin both endings. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.