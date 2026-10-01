# A region keeps a biome away from the kinds it names

**Line:** A region keeps a biome away from the kinds it names — a region may name, beside a biome's share, the kinds that biome keeps away from, and the generator starts each biome of that share from the scattered origin furthest from theirs, drawing nothing, so a region naming none deals the maps it deals today; one test on the fixture holds the rule, the catalogue refuses a kind it does not hold and a biome kept away from its own kind, and `docs/MAP.md` says so. Doc-impact: `docs/MAP.md`.

**Spec:** [`docs/MAP.md`](../../docs/MAP.md), two edits, both written out.

In _The generator_, in the first paragraph, straight after the sentence ending "the centre's biome is dealt the kind the region names, and its origin is the disc's centre tile.":

> A region may keep a biome it deals away from the kinds it names: of the origins scattered, that biome takes the one furthest from every origin of those kinds, the centre's among them, and the biome that held it takes the other in exchange. Nothing is drawn for it, and every biome spreads from its origin as before, so a biome kept away seldom reaches what it keeps away from, rather than never. A distance it must keep was rejected: origins scattered again until they hold it are maps thrown away.

In _The region_, the composition's list reads "how many biomes it is cut into and which kinds are dealt in what shares, the centre's among them, and which of them it keeps away from which, the share of each feature" in place of "how many biomes it is cut into and which kinds are dealt in what shares, the centre's among them, the share of each feature".

No player-facing sentence is added.

**Doc-impact:** `docs/MAP.md`.

**Scope:**

- In: the word a region's share of a biome may carry, the kinds that biome keeps away from; the generator's exchange of origins; the catalogue's two refusals; the test; the two `docs/MAP.md` edits.
- Out: any region using it. No region of the catalogue names a keep-away in this line, the Stone Age's included: the desert, the line after this one, is the first. The desert itself, its terrain and its oasis are that line's.
- The process is fixed, not rolled: the exchange draws nothing from the seeded generator. The origins are scattered as today, and the exchange happens after the scatter and before any biome takes a tile.
- The keep-away is the region's, named beside the biome's share, never the biome kind's: the biome table is shared by every region of every age, and a later region deals the same kind with no keep-away.
- Furthest is measured to origins, in straight tile distance: for each origin a biome may take, the distance to the nearest origin of the kinds named; it takes the origin where that distance is greatest. A tie goes to the origin first in the scatter's order.
- The origins a kept biome may take are the scattered ones: the centre's origin never moves, and it counts as an origin of its kind, so the centre's kind may be named as one to keep away from.
- Where a share deals several biomes, each takes its pick in turn, in the order dealt, and never the origin a kept biome before it took.
- A biome the centre's kind is dealt over the shares, to fill what they leave, is dealt by no share and keeps away from nothing.
- A named kind the region deals no biome of, the centre's not being of it either, leaves nothing to keep away from: the biome is dealt like any other, and nothing is refused.
- The catalogue refuses a region whose share names a kind to keep away from that the catalogue does not hold, and one whose share keeps a biome away from its own kind.
- Measured on a port of this rule, on a Stone Age disc dealing one biome kept away from the seas, over 200 seeds: that biome's terrain lies beside water on 29% of the maps against 63% with no keep-away. The port dealt the Nomadic region's maps tile for tile on the test seeds with no keep-away named.
- Reconcile, the camps' distance: the two stay apart. A camp keeps a minimum the catalogue enforces, drawn among the tiles that qualify, the map dealt again when it falls short; a biome kept away has no number, draws nothing and never fails. The difference is meant: one is a promise, the other a lean.
- Reconcile, the test: it goes the way the map tests that vary one biome on the fixture already go, a fixture region changed in the test and the dealt map read over the test seeds.

**Traps:**

- The maps every region deals today must come out the same, tile for tile: the e2e specs search their seeds on the Nomadic region's maps, and no test compares a map with what it was before. So nothing is drawn for the exchange, and no draw moves: the scatter, the growth, the rim, the terrain, the features, the rivers and the camps take the generator in the order they do now.
- A map hands out its tiles, its rivers and its centre part, never which biome a tile fell in. A test sees a biome only through terrain: an origin tile is its kind's origin terrain outright, and a biome dealt to a size is that many tiles around it.
- `src/rules/map.ts` reads the catalogue through the shapes of `src/rules/map-kinds.ts` and never imports `src/rules/catalogue.ts`: the lint refuses the cycle. The refusals belong with the region's other ones, where an age is checked as the catalogue is built.
- A region's shares are read in four places besides the generator: the catalogue's validation, the launch screen's ring of hexagons in `src/ui/launch-layout.ts`, the content and the fixture's regions, and the tests that write shares inline. The new word is optional, so none of them changes; the launch screen's ring reads the kind and the share alone.
- The list of kinds a map is dealt carries the kinds and not the shares they came from, and the centre's kind fills what the shares leave over: which biome a keep-away applies to is read off the share that dealt it.
- The mechanism is inert in this line: the coherence test and every spec run on regions naming no keep-away.

**Plan:**

1. `src/rules/map-kinds.ts` and `src/rules/map.ts`: a region's share may name the kinds its biome keeps away from, and the generator exchanges origins by the rule above. Leaves every region of the catalogue and the fixture dealing the maps it dealt before.
2. `src/rules/catalogue.ts`: the two refusals, in the vocabulary the region's other refusals speak. Leaves a catalogue naming a kind it does not hold, or a biome kept away from its own kind, refused when it is built.
3. `src/rules/map.test.ts` and `src/rules/catalogue.test.ts`: one test on the fixture holding the rule a player could state — a biome a region keeps away from a kind starts further from that kind than the same biome on the same seeds with no keep-away — and the refusals tested beside the ones that stand. Leaves the rule proven on synthetic content.
4. `docs/MAP.md`: the two edits above.
5. The board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No proof spec: the line never reaches the screen, no region naming a keep-away. CI proves every spec on the push, none of them changed: they pass on the same maps as before.
