# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
traps, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The siege lands** — the schedule names the capstone, `PH_Siege`, and its window of turns 🔧
  27–33; the founding rolls the capstone's turn from it and the chronicle carries it. On that turn
  the events phase deals the capstone alone, whatever turn the next event was due, and its take
  rolls the next due turn as any landing does. Taken, the siege draws 🔧 five camps on tiles three
  to five from the city that a camp may fill, not held, no unit on them, keeping the generator's
  spacing from every camp standing, fewer when the tiles run out, and enters a warrior on each. The
  deal window's title reads for the capstone. Rules tests pin the roll, the lone deal, the reroll,
  the placement and the warriors. Doc-impact: `docs/DESIGN.md`.
- **The siege spans six turns, and victory** — on each of the 🔧 five turns after the landing the
  events phase enters a warrior on every camp whose tile is free, before any deal due that turn; at
  the tick ending the sixth turn with the city standing the chronicle ends in victory, carried like
  a defeat, every command refused after. A victory screen mirrors the defeat screen. Rules tests
  pin the spawning and both endings; an e2e spec reaches the victory screen.
  Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **The capstone is announced at the founding** — the chronicle screen opens on a window over the
  scrim showing the capstone's card and a title saying it comes on a turn unknown; a left click on
  the card or the back key closes it, once, and the right click shows the card large over the
  window as the deal window does. The e2e boot helper closes it for every spec.
  Doc-impact: `docs/DESIGN.md`.