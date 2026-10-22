# The road cut

**Line:** The road cut — no layer names its tile's movement cost or bridges a river edge: the two layer fields, the two map helpers that read them and the validator line on a layer's cost are gone, the fixture's three roads are gone and one plain improvement stands in their place, the tests on a layer's cost and on the bridge are gone, and the design pages describe a tile's movement cost as its terrain's. Doc-impact: `docs/MAP.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Spec:** the pages after the cut say this and no more.

- `docs/MAP.md`, _The tile_: the opening sentence ends "and its movement cost is its terrain's:" — the words "unless a layer names it outright" are gone. The **Improvement** item loses two sentences whole: "A **road** is one, and names the terrains a worker reaches; it runs under whatever building stands there." and "What names a tile's movement cost outright and what bridges a river edge are two properties a layer declares, a building's or an improvement's alike." The sentences before and after them stay as they are.
- `docs/CHRONICLE.md`, _Units and combat_, the move points item: the sentences "A **road** names its tile's cost outright, whatever lies under it; where two layers of a tile each name its cost the lower is the tile's. No layer takes a tile to nothing, for no tile is entered for nothing." are deleted whole, and so is "A river edge with a road on both banks is a **bridge**, crossed as if no river ran there." The sentence on the river edge spending every move point stays, and the enemy's walk sentence after it stays.
- `docs/CHRONICLE-SCREEN.md` changes not: "The terrain card reads the tile's movement cost" stays true, the tile's cost being its terrain's.
- `docs/GLOSSARY.md`: the rows **road** and **bridge** are deleted, their forbidden words with them; the **movement cost** row stays.
- `workflow/IDEAS.md`: the entry **Bridges are a technology** is replaced by: "**Roads, and bridges as a technology**: an improvement that names its tile's movement cost outright, under whatever stands there, placed by a worker on the terrains it reaches; and a river edge with one on both banks crossed as if no river ran there, the bridge gated behind a technology the player unlocks, so roads alone never span a river."
- `CHANGELOG.md` keeps its words.

No player-facing sentence is added or removed: no text entry names a road or a bridge, and the screen reads a movement cost on the terrain card alone, which keeps its two entries.

**Doc-impact:** `docs/MAP.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the `movementCost` and `bridge` fields of a layer's kind and their doc comment; the helper listing a tile's layers and the helper reading whether a tile bridges, both read nowhere else; the lowest-named-cost branch of the tile's movement cost, which then answers the terrain's cost for the tile's terrain; the river test of a step, which no longer asks either bank; the validator refusing a layer's cost under one and its Vitest; the fixture improvements `PH_Trail` and `PH_Rubble`; the fixture's `PH_Road` renamed `PH_Stake` and stripped to a yield-less improvement on plain, forest, hills and urban, its card with it, every test and fixture helper that names it following the rename; the six units tests on a road's cost, the bridge, the one bank, the layer that does not bridge, the two layers' lower cost and the cost above the terrain's; the comments naming a road or a bridge in `src/rules/map.ts`, `src/rules/map-kinds.ts`, `src/rules/fixtures.ts`, `src/rules/cards.test.ts` and `src/rules/enemies.test.ts`.
- Out: a terrain's movement cost and its embarked one, their validator and their tests; the river edge spending every move point and its test; the enemy's walk over the whole map and its weighing; the infopanel and its two movement entries; every e2e spec; the changelog.
- Corner cases decided here: where a test lays two improvements on one tile to prove a pillage or a removal takes them all — the enemies' farmed tile and the deluge's removals — the second one is `PH_Ditch`, set on the tile through the map, which places by no rule; the `SURVEY` achievement counts the terrains `PH_Stake` is played on and its tests move not; the chronicle test whose capstone reads an improvement on the forest reads `PH_Stake`; the simulator tests and the neutral's workers test naming `PH_Road` name `PH_Stake` and assert the same.
- Reconcile: the line projects nothing, so it has no likeness to choose; the deletion leaves the terrain as the one layer that names a cost.

**Traps:**

- No content under `src/content/` declares either field: the Stone desert names a terrain's cost, which stays. The cut is fixture-only, and the catalogue's coherence test proves nothing changed for the real content.
- Four e2e specs — `embark`, `inspect`, `move`, `neutral` — and `e2e/chronicle-screen.ts` import the tile's movement cost helper by name from `src/rules/map.ts`; whether the tile's cost and the terrain's cost stay two doors or become one is the implementer's, and a rename reaches those specs.
- The fixture's `PH_Road` is named in `src/rules/cards.test.ts` about forty times, in `src/rules/schedule.test.ts`, `src/rules/enemies.test.ts`, `src/rules/chronicle.test.ts`, `src/rules/catalogue.test.ts`, `src/content/scripts.test.ts` and `tools/sim.test.ts`; a search for the id is the list, and `npm test` covers the tools' tests too.
- The glossary lint reads the code's player-facing text; nothing of this line is player-facing.
- The comment hook flags a comment block over three lines touched under `src/`; the doc comments on the tile's movement cost and on a layer's kind are reshaved to what stays.

**Plan:**

1. `src/rules/map-kinds.ts`, `src/rules/map.ts`, `src/rules/catalogue.ts`: the two fields, the two helpers, the lowest-cost branch, the bank test of a river step and the validator line go; the typecheck then names every fixture layer that declared them. What stands: a tile's cost is its terrain's, and the rules compile but for the fixture.
2. `src/rules/fixtures.ts`: `PH_Trail` and `PH_Rubble` go; `PH_Road` becomes `PH_Stake`, yield-less, on the four terrains, its card and the `SURVEY` and `surveying` helpers following. What stands: the fixture compiles.
3. `src/rules/units.test.ts`, `src/rules/catalogue.test.ts`, then every test file naming the old id, `tools/sim.test.ts` and `src/content/scripts.test.ts` among them: the six cost tests and the zero-cost layer test go, the rename lands, the two-improvement tiles take `PH_Ditch`. What stands: `npm test` green.
4. The three `docs/` pages and `workflow/IDEAS.md` as the Spec writes them; the board line deleted. What stands: no page names a road or a bridge.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/move.spec.ts`: a unit's step spends the tile's cost read from the rules. CI proves on the push every spec that reads a movement cost or crosses a tile, `inspect.spec.ts`, `embark.spec.ts` and `neutral.spec.ts` among them.
