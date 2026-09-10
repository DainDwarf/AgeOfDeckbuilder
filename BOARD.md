# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The chronicle's tests split by the module they cover** — `chronicle.test.ts` (3067 lines, 179
  tests) breaks up: the schedule's tests to `schedule.test.ts`, the camp and enemy tests to
  `enemies.test.ts`, the card tests to `cards.test.ts`, and the fixtures the resulting files share
  into one module beside them. No test body changes and the same 179 tests run. `DOGMAS.md` →
  *Testing* gains the fixture module's shape, a fixture no longer being "defined in the test".
  Doc-impact: `docs/DOGMAS.md`.
- **The city's rules leave `chronicle.ts`** — `src/rules/city.ts` holds the border, the inhabitants
  and what they yield: income, growth, assign, reassign, claim, and the readers the chronicle screen
  asks (`claimable`, `cityCommand`, `cityDrag`, `tileCost`, `tileRefusal`, `growthThreshold`).
  `chronicle.ts` keeps `apply`, the turn's stages and the piles, and reaches the city through that
  one interface; `city.test.ts` takes the matching tests out of `chronicle.test.ts` unchanged. The
  plan says how `city.ts` answers without importing `Stage` and `Command` back — Biome refuses the
  cycle. Suite green, no test body changes. Doc-impact: none.
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