# The land and mountain tables

**Line:** **The land and mountain tables** — the nomadic region deals a woodland biome beside the land, the sea's and the range's rim widths take their new odds, every feature is dealt on a tenth of its terrain, and the age page says forest gathers in woods. Doc-impact: `docs/ages/NOMADIC.md`.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) § The map, the seven-layer paragraph — the first layer's "land, sea, mountain, and whatever the list comes to hold", the rim sentence, the feature deal — and the "Biomes are content" paragraph, which stand as written and are the rules this content lays numbers over; [`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) § The land. The process is rolled, not fixed: every biome's shape and every table's scatter roll per seed; how wide it varies is measured under _Scope_.

[`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) § The land gains one sentence, after "Features are dealt rarely enough to be sought after; their shares are tuning.":

> Forest is scattered over the land and also gathers in woods, biomes of their own that are forest nearly throughout.

No number stands on that page; the shares and the tables stand in the content. Nothing on `docs/CHRONICLE.md` or `docs/GLOSSARY.md` changes: the biome list on both is open-ended, and a biome kind's id is a content id nothing player-facing names — the screen names terrains and features, never a biome.

**Doc-impact:** `docs/ages/NOMADIC.md`.

**Scope:**

In, all of it in `src/content/nomadic.ts`, every number here settled with the user on the running generator:

- A new biome kind, `woodland`: origin forest; interior forest 0.8, plain 0.2; rim the same table; rim widths `[1]`; growth by weight 1; compactness 0.
- The sea's rim widths become `[0.2, 0.6, 0.2]`; the range's become `[0.5, 0.5]`. Their tables, origins, growth and compactness stay.
- The land's and the centre biome's tables stay exactly as they are.
- The `temperate` region's biome shares become, in this order: sea 0.2, mountain 0.1, woodland 0.1, land 0.6. Its feature shares become fertile 0.1, game 0.1, flint 0.1. Everything else on the region stays: radius, centre reach, tiles per biome, centre biome, camps, rivers.
- The age page sentence under _Spec_.

Out:

- The stand-in and the fixture catalogues: untouched, so the e2e suite's maps and the rules tests' maps do not move.
- No mechanism: every value lays numbers over helpers that exist; no test names a number here. The coherence test of the nomadic catalogue is the check.
- The balance of anything: every number here is provisional, and the balance pass is the next line.

Corner cases decided here:

- The quotas: the disc is cut into 11 biomes, the centre's own aside 10; the shares round in list order to sea 2, mountain 1, woodland 1, land 6, ten exactly, so every share deals at least one and nothing is left over for the centre kind. That is why the order above is the order.
- A wood beside the land is a border between two kinds, so its tiles and the land's are on their rims; both roll a width of 0 always, so neither table changes there. Same for a wood beside the centre biome.
- A wood's origin may lie beside the centre tile and the wood grow around the centre biome; accepted, as it is for the land.
- Wildfire on a wood burns the tile and every forest around it, up to seven tiles; accepted, the balance pass measures what that costs. The fire's own numbers do not move.
- Features on the centre biome: the feature deal reads every tile of its terrain over the whole disc, the centre biome and every origin tile included; at 0.1 the centre biome's tiles carry a feature at the same rate as any other. The user asked and this is the answer.

Measured over 200 seeds on the numbers above, against today: plain 39% (42), forest 24% (18), hills 14% (16), coast 13% (15), deep water 9% (8), mountain 1.8% (1.6) of tiles; one wood a map, the largest seen 66 tiles; a forest tile has 2.1 forest neighbours on average (1.25); forest stands within three tiles of the centre on every map, hills on 98.5%, mountain within five on 42%; the first ring is 56% plain, 28% forest, 10% hills; at 0.1 a map carries about 13 fertile, 8 game and 5 flint tiles.

**Traps:**

- The nomadic map of every seed changes: a new origin is drawn and the rim rolls differ, so the generator's draw order moves from the first layer on. The e2e suite plays the stand-in, which does not change; `e2e/boot.spec.ts` launches the nomadic content but reads no tile of its map. `src/content/nomadic.test.ts` settles seed 1 on the centre tile, which is the centre biome's origin and plain outright, so the settle still lands.
- `sharedBiomes` in `src/rules/map.ts` rounds each share of the dealt count in list order and caps by what is left, and `catalogued` refuses a share that rounds to no biome; the four shares fit ten exactly, and a share reordered or nudged can change which kind loses a biome.
- A rim width table is weights by width, index 0 first: `[0.5, 0.5]` is half no rim, half one tile; `[1]` is no rim ever.
- `src/rules/` never imports `src/content/`; nothing in the rules or their fixtures names the woodland.
- Prettier keeps every paragraph one line; the age page edit is one long line.

**Plan:**

1. `src/content/nomadic.ts`: the woodland kind, the two rim width tables, the region's biome shares and feature shares, as under _Scope_. Leaves: the nomadic map the mockup showed; the coherence test passes as it stands.
2. `docs/ages/NOMADIC.md`: the sentence under _Spec_, verbatim.
3. `workflow/BOARD.md`: the line deleted; this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; no e2e spec, since the stand-in the suite plays does not change — say so in the report.
