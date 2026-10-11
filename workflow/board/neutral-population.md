# The neutral's population

**Line:** **The neutral's population** — where the neutral acts, after its claims and before its entry, its script's choice of the tiles its population works lands as `assigned` changes, the rest idle, under one test on the fixture; the villager works the tiles that feed it first, under one test beside it; the two pages say so. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:** `docs/CHRONICLE.md` _The neutral_, the paragraph beginning "A second city stands on the map". Its sentence "Where the neutral acts its units act first, then its city claims, then it enters one unit on its tile as the player's city plays a unit card: …" becomes:

> Where the neutral acts its units act first, then its city claims, then its script assigns its population over the tiles its city holds — each population off the tile it stood on and onto the one its script names, as the player assigns, and the rest idle — and then it enters one unit on its tile as the player's city plays a unit card: its script names the card, the card's cost is paid out of the neutral's stocks, one idle population becomes the unit and never its last, and its tile must be free; a unit entered waits for the next enemy phase, as an entered enemy does.

and its sentence "What the neutral does with what it has is its script, content: which tile it claims, which unit it enters …" becomes:

> What the neutral does with what it has is its script, content: which tile it claims, which tiles its population works, which unit it enters out of its population and its stocks, and where its units go, chosen on the chronicle as it stands; it never draws a hand.

`docs/ages/STONE.md` _The neutral_. After "it claims the tile that yields most among those it may claim, the nearest to its city of equals." add, in the same paragraph:

> It works the tiles that feed it first: its population stands on the tiles its city holds, the tile giving the most food taken first and the most of everything together of equals, as many tiles as it has population; a population with no tile to work is idle, the one its next unit is made of.

No player-facing text: the neutral's worked tiles are shown nowhere.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Scope:**

- In: a third choice on the neutral's script, the tiles its population works, asked where the neutral acts after its claims and before its entry; the rules step that lands it; the villager's rule for it; the fixture's neutral script answering it; the catalogue coherence test asking it on each age naming a neutral.
- The step, decided here: the script is handed the tiles its city holds and answers the tiles its population works. A population standing on a tile the answer does not name comes off it, and an idle one goes onto a named tile nobody of the neutral's stands on, each move one `assigned` change carrying the tile, every change under one `assign` group; nothing at all, no group, where the answer is the standing assignment. The population the answer leaves no tile for is idle, and the entry that follows takes one of them as it does today. The neutral's own city tile is a tile like any other, worked only where the answer names it.
- An answer naming a tile its city does not hold, a tile twice, or more tiles than it has population is one `runtime-error`, nothing moved, and the act goes on to the entry; fewer tiles than population is a valid answer.
- A tile an enemy occupies is laid out like any other; hostile and at peace alike.
- The villager's rule: of the tiles its city holds, the most food first, then the most of every resource together, then tile order; the first as many as its population. A tile's yield is read as the claim reads it, a building beside counted.
- Out: the balance of its curve (the wave's gathered count, the village's yields, the kind ratio) — a balance-pass matter: measured at intake, the neutral reaches four or five units by turn 60 under this rule, so its six-guard wave gathers rarely; the neutral's workers, the next line; drawing the neutral's worked tiles on the screen; the growth and the claim, unchanged.
- Reconcile: the layout goes through the player's one-tile assign door, widened to the faction, one `assigned` change per population moved; the claim's worth (everything together, nearest of equals) and the layout's (food first) stay apart, the difference meant, the tile-order tie-break shared.

**Traps:**

- In `src/rules/city.ts` the one-tile assign helper reads the player's rows directly while `bordered` and `populationLeaving` go through `cityRows` and `withCityRows`: widen the one helper to the faction rather than copy it; the `assigned` change carries the tile either way.
- The entry (`enters` in `src/rules/cards.ts`) is blocked while none is idle, and `populationTaken` takes an idle one first: the layout's idle is exactly what the entry takes, so the step must land before the entry, and a layout leaving none idle leaves the neutral entering nothing — by design.
- `FIRST_OFFERED` in `src/rules/fixtures.ts` is every fixture age's neutral script and must answer the new choice: the tiles held in their order, as many as the population. That answer leaves every standing `src/rules/city.test.ts` fixture where it is (its assigned rows are already the first held tiles), so the enemy-phase order test keeps its stage list; a fixture whose assigned rows are not its first held tiles would move at the phase.
- The catalogue coherence test (`src/content/catalogue.test.ts`, `neutralAges`) asks the neutral's `claims` and `enters` on a launched chronicle; the new choice is asked there too, its answer checked to name held tiles only.
- The tie-break every script falls back on is `inTileOrder` in `src/content/scripts.ts`; the claim reads a tile's yield through `tileYield` with `tilesBeside(chronicle.tiles)`, and the layout reads it the same way.
- Every stage listener in `src/ui/` (`map.ts`, `hand.ts`, `piles.ts`) already takes `assigned` as a change it plays nothing for; the neutral's rows are drawn nowhere, so no screen changes and the chronicle screen plays the phase as before.
- The save reader (`cityRowsOf` in `src/rules/save.ts`) already reads and refuses the neutral's assigned rows; nothing to add.
- `DOGMAS.md` _Testing_: the villager's choice is content that decides, one test beside the script on the fixture's ground (`neutralAround`, the real closure); the step is a mechanism, one test on the fixture through the end of turn.

**Plan:**

1. `src/rules/catalogue.ts`: the neutral's script carries the third choice. `src/rules/fixtures.ts`: the fixture's neutral script answers it. `npm run check` names every site that builds a neutral script.
2. `src/rules/city.ts` and `src/rules/chronicle.ts`: the step, landing where the enemy phase says, after the claims and before the entry; the assign door widened to the faction. `src/rules/city.test.ts`: one test through the end of turn — a population off a tile and onto the chosen one, one `assigned` change each under one `assign` group, the idle count the entry then takes; the `runtime-error` on a bad answer, nothing moved, the entry still landing; nothing staged where the answer is the standing assignment.
3. `src/content/scripts.ts`: the villager's choice. `src/content/scripts.test.ts`: one test beside it — food first, everything together of equals, tile order of those, as many as its population, a population past the held tiles left for no tile.
4. `src/content/catalogue.test.ts`: the coherence test asks the choice on each age naming a neutral.
5. `docs/CHRONICLE.md` and `docs/ages/STONE.md`: the sentences above, verbatim. `npm run fmt`.
6. `workflow/BOARD.md`: the line deleted, this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — the line reaches no screen. CI proves on the push: `e2e/neutral.spec.ts` and the rest of the suite.
