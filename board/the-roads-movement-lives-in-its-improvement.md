# The road's movement lives in its improvement

**Line:** `src/rules/map.ts` stops naming `PH_Road`: the movement cost a layer names outright and the bridge become two properties a layer declares in the catalogue, read off the building and the improvements of a tile alike, the road the one layer of both catalogues carrying either; the validator refuses a layer naming a cost of zero or less; and no `PH_` id is written in `src/rules/` outside its tests and fixtures.

**Spec:** `docs/CHRONICLE.md` → _The map_ (the layers list, and the paragraph over it saying a tile's movement cost is the sum of its layers unless a layer names it outright) and _Units and combat_ (the first bullet, the road and the bridge sentences); `docs/GLOSSARY.md` rows **movement cost**, **road**, **bridge**.

The two properties, as the spec now reads them:

- A layer — a building or an improvement — may **name its tile's movement cost outright**, over the sum the layers make. Where two layers of one tile each name it, the lower is the tile's. A named cost is never zero or less: the catalogue is refused whole where a layer names one, as "no tile is entered for nothing" made a check.
- A layer may **bridge**: a river edge with a bridging layer on each bank is a bridge, crossed as if no river ran there. The layers need not be the same kind, and a layer that names a cost does not bridge for that alone; the two properties are independent.

The road, in both catalogues, names half a move point and bridges. That half is the stand-in's number, and the docs say so.

Sentences to change in `docs/CHRONICLE.md`:

- _The map_, the improvement bullet, after "A **road** is one, and names the terrains a worker reaches; it runs under whatever building stands there." add: "What names a tile's movement cost outright and what bridges a river edge are two properties a layer declares, a building's or an improvement's alike; the road is the one layer that carries either."
- _Units and combat_, the first bullet, replace "A **road** names its tile's cost outright over the sum its layers make: half a move point to enter, whatever lies under it. No layer takes a tile lower, for no tile is entered for nothing." with "A **road** names its tile's cost outright over the sum its layers make, 🔧 half a move point to enter, whatever lies under it; where two layers of a tile each name its cost the lower is the tile's. No layer takes a tile to nothing, for no tile is entered for nothing." The bridge sentence two sentences on stays as it is.

Rows to change in `docs/GLOSSARY.md`:

- **road** → "An improvement that names its tile's movement cost outright, whatever lies under it, and makes a bridge of a river edge it stands on both banks of." Forbidden words unchanged.
- **movement cost** and **bridge** stay as they are.

No player-facing text changes: the road card's text, its name and its mark are the screen's tables and read the id as before.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the two optional properties on the shared layer declaration; the cost function reading the terrain, then the building and every improvement, the lowest named cost winning over the terrain's; the bridge test in the path walk reading the same layers for the flag; the validator's refusal; both catalogues' road declaring `movementCost: MOVE_POINT / 2` and the bridge flag; the docs edits above; the tests below.
- Out: a terrain naming a cost of zero — the validator checks layers alone, the terrain table is not this line's; a layer that _adds_ to the sum rather than naming it outright — no content asks, and the sum sentence stands as the design's door; the screen's tables (`src/ui/text.ts`, `src/ui/marks.ts`) which key on the id by design, a card name being content.
- Corner cases decided here: two layers each naming a cost, the lower wins, order-free; a bridge is any bridging layer on each bank, not the same kind on both; a layer naming no cost and not bridging changes nothing, which is what every layer but the road does today; the whole-map walk the enemy scripts and the camp placing read reads the same cost function and the same bridge, so nothing changes for them beyond where the numbers come from.

**Traps:**

- `TerrainKind.movementCost` absent means the terrain is crossed by nothing; the layer property absent means the layer names nothing. Same name, opposite absence: the type comment on the layer property has to say so, and the cost function must return `undefined` for an uncrossable terrain before it looks at any layer — a road on water is not a thing, but the code must not make it one.
- `MapContent` is read by `src/rules/map.ts` and `src/rules/units.ts` instead of `Catalogue` because of an import cycle the lint refuses; the properties go on `LayerKind` in `src/rules/map-kinds.ts`, nowhere else.
- `pathCosts` computes the near bank's bridging once per front tile and the far bank's per neighbour; keep that shape, only what it reads changes.
- `src/rules/fixtures.ts` is the tests' catalogue and `src/content/stand-in.ts` the game's; both declare `PH_Road` and both change. The fixture's `PH_` ids are the fixture's own, not the stand-in's.
- `src/content/stand-in.test.ts` reads every improvement's name and mark; a fixture-only improvement lives in `fixtures.ts` and never in the stand-in, so that test does not see it.
- A dogma refuses `Math.min` over nothing reading as a fallback: the lowest-named-cost read is a fold over the layers that name one, the terrain's cost the start, and no `default`-shaped otherwise-branch.
- `MOVE_POINT / 2` leaves `map.ts` with the id: the constant `MOVE_POINT` stays, the halving is content.

**Plan:**

1. `src/rules/map-kinds.ts`: `LayerKind` gains `movementCost?: number` and `bridge?: boolean`, the type comment carrying the absence trap above.
2. `src/rules/map.ts`: `movementCost(catalogue, tile)` owns the cost invariant — terrain first, `undefined` where it names none, else the lowest of the terrain's and every named layer cost; `roaded` becomes a `bridges(catalogue, tile)` reading the flag off the building and the improvements; `pathCosts` calls it. No id literal remains.
3. `src/rules/catalogue.ts`: `catalogued` refuses a building or an improvement whose named movement cost is below one hundredth, in the refusal vocabulary the rest uses; the function comment lists the check.
4. `src/content/stand-in.ts` and `src/rules/fixtures.ts`: `PH_Road` declares the half and the flag. The fixture gains one improvement of its own that names a cost and does not bridge, on the same terrains as the road, for the tests below.
5. Tests, all on the fixture catalogue: `src/rules/units.test.ts` — the three road tests stand unchanged and pass through the declaration; one new test that an improvement naming a cost on both banks and not bridging leaves the crossing draining every move point; one new test that a tile carrying the road and that improvement costs the lower. `src/rules/catalogue.test.ts` — a catalogue whose layer names a movement cost of zero is refused. No test for the building read: no building names a cost, and the fold is one over both tables.
6. `docs/CHRONICLE.md` and `docs/GLOSSARY.md` as written under _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`; no e2e spec is touched or named — the screen reads the cost through the same function and no path a spec walks changes. `Grep` for `PH_` under `src/rules/` outside `*.test.ts` and `fixtures.ts` must find nothing.
