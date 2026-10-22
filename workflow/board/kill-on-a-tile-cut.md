# The kill on a tile cut

**Line:** The kill on a tile cut — no helper kills the population working one named tile: the helper is gone, the fixture's Plague answer that was its only caller is gone, and the three schedule tests on that answer are gone; the content kills population through the idle-first take alone. Doc-impact: none.

**Spec:** no `docs/` page describes a kill on a tile, so no page changes. `docs/CHRONICLE.md`, _Population_, stays as it is: a harm takes population out of the city, and which population it takes is the rules'. `docs/GLOSSARY.md` changes not: its **killed** row, "what befalls a unit or a population: the unit leaves the map, the population its city", stays true, the content killing population through the idle-first take. `CHANGELOG.md` keeps its words.

No player-facing sentence is added or removed: no text entry names the fixture's answer, and every Stone Age harm that kills population — Bury the dead, Sickness, Wolves, Cold night — already takes it through the idle-first take and keeps its text.

**Doc-impact:** none — the door was the fixture's alone, and no page ever named it.

**Scope:**

- In: `populationKilled` in `src/rules/city.ts` and its doc comment; the fixture's `PH_Plague` answer in `src/rules/fixtures.ts` and the import of the helper, which nothing else in the file reads; the three tests in `src/rules/schedule.test.ts` on the Plague taken: the population one fewer with its tile unassigned, the unworked tile killing nobody, and the city's last population ending the chronicle in defeat. The first and the third stay promised by the Leave answer's tests beside them; the second is the door's own rule and goes with it.
- Out: `populationTaken`, the idle-first take, and the `populationLeaving` it shares with nothing else once the cut lands, which stay as they are; the Leave answer's three tests; the fixture's `PH_Upheaval` with its two other answers, `PH_Ambush` and `PH_Quake`, and their tests; `UPHEAVAL` and `UPHEAVAL_DUE`, which the Ambush and Quake tests read; every Stone Age harm in `src/content/stone.ts`; the simulator and its tests; every e2e spec; the changelog; the idea pool, which takes no entry.
- Corner cases decided here: the Upheaval keeps two answers, and nothing counts how many an event offers; the test in `src/rules/catalogue.test.ts` naming `PH_Plague` as an event the schedule does not hold keeps working once the id names nothing at all, and whether it names something plainer is the implementer's.
- Reconcile: the line projects nothing, so it has no likeness to choose; the deletion leaves the idle-first take as the one door a harm takes population through.

**Traps:**

- `populationLeaving` is left with one caller after the cut; whether it folds into `populationTaken` is the implementer's, and its doc comment on `assigned` toggling is a trap that stays wherever the code goes.
- The glossary lint reads the code's player-facing text; nothing of this line is player-facing.
- The comment hook flags a comment block over three lines touched under `src/`; the doc comment on the helper goes with it, and the ones beside it are left alone.

**Plan:**

1. `src/rules/city.ts`: the helper and its doc comment go. What stands: the rules compile but for the fixture.
2. `src/rules/fixtures.ts`: the Plague answer and the import go. What stands: the fixture compiles, and the catalogue's coherence test names the Upheaval's two answers among its own.
3. `src/rules/schedule.test.ts`: the three Plague tests go. What stands: `npm test` green.
4. The board line deleted. What stands: no door kills the population working one tile.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is none: the line never reaches the screen, nothing in `e2e/` runs on the fixture, and the content's harms take population through the same door before and after. CI proves on the push every spec that walks a harm killing population, `bad-air.spec.ts`, `predators.spec.ts` and `long-winter.spec.ts` among them.
