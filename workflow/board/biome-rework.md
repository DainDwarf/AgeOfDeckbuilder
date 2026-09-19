# The biome rework

**Line:** **The biome rework** — the spread draws a biome by its kind's growth weight and grows it by its kind's compactness, a kind dealt to a size is filled first and grows no further, the floor under the biome count is gone, and the nomadic region deals a centre biome of its own kind on a disc of radius 10. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/NOMADIC.md`.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) § The map, the seven-layer paragraph and the two paragraphs after it; [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md), the **biome** row; [`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) § The settle. The mechanism is rolled, not fixed: every biome's shape rolls per seed, and the sized centre biome rolls its shape too; how wide it varies is measured under _Scope_.

The first-layer sentence of the seven-layer paragraph is replaced. Today it reads:

> First the **biomes**: origin tiles scattered over the disc spread outward until every tile belongs to one biome — land, sea, mountain, and whatever the list comes to hold. Their kinds are **dealt** as quotas rather than diced one by one, because independent dice can deal a map with no sea at all; the centre's biome is dealt the kind the region names, and its origin is the disc's centre tile.

It becomes, verbatim:

> First the **biomes**: origin tiles scattered over the disc spread outward until every tile belongs to one biome — land, sea, mountain, and whatever the list comes to hold. Their kinds are **dealt** as quotas rather than diced one by one, because independent dice can deal a map with no sea at all; the centre's biome is dealt the kind the region names, and its origin is the disc's centre tile. A biome kind either spreads by a **growth weight** or is dealt to a **size**. A biome dealt to a size is filled first, before any other grows, to exactly that many tiles, and grows no further; a tile no biome reaches because a sized biome closed a ring around it belongs to that biome. Then each step of the spread draws one of the biomes still growing, weighted by its kind's growth weight, and that biome takes one open tile beside it, so a biome's size follows its kind's weight and not the length of its edge — a spread drawing a growing tile at large was rejected: the biome that got ahead early snowballed, and a range came out as large as a sea. Which open tile a biome takes is drawn by its kind's **compactness**: every open tile beside the biome is weighted by how many of its neighbours the biome already holds, raised to the compactness, so at zero any open tile is drawn alike and the higher it is the rounder the biome grows.

The rest of that paragraph — the rim, the scatter, the features — stands as it is. The rim sentence already covers the centre biome: it is a kind of its own, so a sea or a range touching it rims itself with coast or hills as between any two kinds, and its own rim table equals its interior.

The "Biomes are content" paragraph, today:

> Biomes are content, like the terrain and feature lists: they grow without a design decision, and what each one holds — its origin terrain, its interior and rim tables, its rim widths — is tuning.

becomes:

> Biomes are content, like the terrain and feature lists: they grow without a design decision, and what each one holds — its origin terrain, its interior and rim tables, its rim widths, its growth weight or its size, its compactness — is tuning.

The region paragraph stands as written: it already says how many biomes the disc is cut into and which kind the centre's is. Nothing on the page named the floor, so nothing is removed.

The glossary's **biome** row, today "A stretch of map the generator spreads as one kind — land, sea, … — weighting the terrain of each tile in it.", becomes "A stretch of map the generator spreads or deals as one kind — land, sea, … — weighting the terrain of each tile in it." Its forbidden synonyms stand. Growth weight, size and compactness are generator properties like the rim width, named on the design page and on no card or screen: no glossary row.

[`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) § The settle gains one sentence, after "The settle lands on plain, forest or hills; water and mountain refuse it.":

> The ground around the disc's centre is a biome of its own, plain, forest and hills and nothing else, rolled compact, so the settle chooses among sites that feed and build and the water and the mountain lie beyond the first steps.

No number stands on that page; the twelve tiles, the compactness and the table stand in the content.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/NOMADIC.md`.

**Scope:**

In:

- The mechanism, in the map generator's first layer: sized biomes filled first, the weighted draw of a biome, the compactness draw of a tile, the hole rule. The floor under the biome count goes: the count is the disc's tiles divided by the tiles per biome, rounded, and nothing else.
- A biome kind carries either a growth weight or a size — one or the other, never both, the type says so — and a compactness. A region loses its floor and keeps everything else.
- Coherence, in the catalogue: a growth weight is refused at zero or below; a compactness is refused below zero; a size is refused at zero, and a region is refused whose centre kind's size is not smaller than its disc's tile count, since a biome filling the disc leaves the dealt quotas nothing to grow on; a region is refused whose share of a kind rounds to no biome, since the quotas exist to deal at least one of each kind named and the tests promise every map its sea and its range.
- The nomadic content: a centre kind of its own — an id that is no terrain's and no other kind's — with the table plain 0.6, forest 0.3, hills 0.1 as its interior and its rim alike, rim widths [1], origin plain, size 12, compactness 1.5; the region names it as its centre biome. Sea weight 1.2, land weight 1, mountain weight 0.4, compactness 0 on all three. The region: radius 10, tiles per biome 30, sea share 0.2, mountain share 0.1, camps 4, at least 7 from the centre, at least 4 apart. The centre part's reach, the features' shares and the river layer stay as they are.
- The stand-in catalogue and the fixture catalogue take the new properties with values that keep their maps' character: weights 1, compactness 0, the floor removed. The fixture catalogue additionally gets what the mechanism's tests need — a sized kind, and a region whose centre is it — as fixtures of its own, on numbers of its own.
- The e2e specs the stand-in's new maps break, re-found on the stand-in.

Out:

- The interior and rim tables of land and mountain, and their rim widths, which stay as they are; their revision is an idea, not this line.
- Rivers, features, the centre part's reach, the settle rule, sight, and any camp rule beyond the three numbers.
- The balance of anything: every number here is provisional, and the balance pass is the next line.

Corner cases decided here:

- A sized biome may close a ring; the hole is its. At compactness 1.5 and size 12 it closes one in a few maps of a hundred, which is why the measured size runs 12 to 13.
- A scattered origin may lie beside the centre tile; the sized biome grows around it and that is accepted, as it is on the page.
- A sized kind may be dealt by share too, not only as the centre's kind: every sized biome is filled first, in the order the origins were dealt. No content does this today; the rule is stated so the helper is sane for it.
- Compactness zero draws every open tile alike, which is not today's growth exactly — today draws a growing tile at large, then one of its open neighbours — and the difference on a sea's coastline is a tuning matter, not a design one.
- Rounding: the biome count and the quotas round as today.

Measured on the page, over 150 seeds at the numbers above: plain 43%, forest 18%, hills 16%, coast 14%, deep water 8%, mountain 2% of tiles; a sea runs 4 to 79 tiles, median 36, a land biome 1 to 76, median 33, a range 1 to 32, median 13, the centre biome 12 to 13; water lies within one tile of the centre in 19% of maps, within three in 71%, mountain within three in 15%; the first ring is 55% plain, 28% forest, 12% hills; 1% of deals fall short of four camps and are redealt; the nearest camp lies 7 to 9 from the centre, mean 7.4. Today's generator, same measure: water within one tile of the centre in 30% of maps, within three in 75%, mountain within three in 38%.

**Traps:**

- The RNG draw order of the first layer changes, so every map of every seed changes, on every catalogue. The e2e suite plays the stand-in, and most specs find their seed by search and follow; four pin a seed or a tile: `e2e/camps.spec.ts` (seed 1), `e2e/city-mode.spec.ts` (seed 1 and five named tiles around the centre), `e2e/console.spec.ts` and `e2e/controls.spec.ts` (the tile at 0,−3). Run the four; where one fails on its pinned seed or tile, re-find the seed or the tile on the new stand-in and say so in the report. Nothing in them is weakened.
- `src/rules/` never imports `src/content/`: the mechanism's tests run on the fixture catalogue in `src/rules/fixtures.ts`, which needs a sized kind of its own. The nomadic centre kind is content and gets the coherence test alone.
- The catalogue already refuses a region whose camps keep no further from the centre than the centre part's reach plus the city's sight: at 7 against 3 + 2 the nomadic region passes; the stand-in and the fixture keep 6 against 5.
- `dealtBiomes` is exported and read by the river tests in `src/rules/map.test.ts` to count the ranges dealt; whatever shape replaces it, those tests keep counting ranges.
- The disc grows from 217 to 331 tiles. End of turn was measured at 19.4 ms per `apply` with 20 units at radius 8, and the standing call is to optimise nothing until the headless simulator exists; the report states the new figure and does not act on it.
- A tile's open neighbours off the disc do not exist: the compactness count reads neighbours on the map only, as the rim does.
- The hole rule needs the spread to end with tiles unassigned only where a sized biome enclosed them; a weighted biome never leaves a hole, since it grows until nothing is open beside it. If any other tile is ever unassigned at the end, that is a defect, not a hole.
- Prettier keeps every paragraph one line; the design-page edits are long single lines.

**Plan:**

1. `src/rules/map-kinds.ts` and `src/rules/catalogue.ts`: the biome kind's shape and the region's, and the refusals under _Scope_; `src/rules/fixtures.ts`, `src/content/stand-in.ts`, `src/content/nomadic.ts` take the properties with the neutral values so the typecheck stands. Leaves: a catalogue that refuses the new incoherences, maps unchanged.
2. `src/rules/map.ts`: the first layer rewritten as the spec says; the floor gone from the count. `src/rules/map.test.ts`: the mechanism held on the fixture — a sized biome holds exactly its size, filled before the others, its hole included; at a very high compactness a sized biome is the centre and the ring around it; every map still holds deep water and mountain; the existing tests hold. Leaves: the generator dealing by weight and compactness on every catalogue, the mechanism's inert commit.
3. `src/content/nomadic.ts`: the centre kind and the region's numbers under _Scope_; the coherence test passes as it stands. Leaves: the nomadic map the page showed.
4. `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/NOMADIC.md`: the sentences under _Spec_, verbatim.
5. The four e2e specs under _Traps_, run; pinned seeds and tiles re-found where they fail.
6. `workflow/BOARD.md`: the line deleted; this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/camps.spec.ts`, `npx playwright test e2e/city-mode.spec.ts`, `npx playwright test e2e/console.spec.ts`, `npx playwright test e2e/controls.spec.ts`, each named in the report with its result.
