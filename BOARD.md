# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The events phase deals a choice** — the phase offers several of the schedule's events as cards
  and the player takes one, which resolves; this replaces the design's "land and resolve at once".
  An e2e spec plays a turn through the deal. Doc-impact: `docs/DESIGN.md`.
  [`board/events-deal.md`](board/events-deal.md)
- **The famine deals a card** — the stand-in famine lays a card on top of the draw pile instead of
  emptying the food stock: an instant, single use, carrying a **hazard** — the keyword for what a
  card does at the end of any turn it is still in the hand, before the hand is discarded — that
  empties the food stock; played for its cost, it leaves the chronicle. Rules tests pin both fates
  and the landing. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **The chronicle has a length** — the capstone's turn is fixed at the founding and read on the
  chronicle screen; the end-turn button's readout is re-judged against it.
  Doc-impact: `docs/DESIGN.md`.
- **The capstone, and victory** — `PH_Siege` lands on its fixed turn, spans its turns and ends the
  chronicle: victory while the city holds, defeat when it does not. Its intake decides how the
  siege enters a chronicle whose every camp is captured. A victory screen mirrors the defeat
  screen, and rules tests pin both endings. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.