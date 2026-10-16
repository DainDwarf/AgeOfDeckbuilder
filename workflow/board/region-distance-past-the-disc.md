# The region validator refuses a distance past the disc

**Line:** The region validator refuses a distance past the disc — the catalogue refuses a region whose camps, whose sites or whose neutral's city, at either end of its band, keep further from the centre than the disc's radius, with a test on the fixture proving the three refusals and the three at the radius itself passing; the launch's "dealt 10 times" stays for the shortfall a terrain causes. Doc-impact: `docs/MAP.md`.

**Spec:** `docs/MAP.md`, _The generator_, the sixth layer's paragraph. After the sentence ending "free to stand beside a camp." and the neutral's sentence that follows it, before "A map dealt fewer camps, sites or cities than the composition asks is thrown away", add:

> The catalogue refuses a region that keeps its camps, its sites or the neutral's city, at either end of its band, further from the centre than the disc's radius: no tile lies there, and every deal would be thrown away.

No player-facing sentence: the player never meets a refused catalogue. The refusals are the validator's, in the vocabulary of the two distance refusals standing beside them:

- `the region <name> keeps its camps <n> from the centre, past the disc's radius of <radius>`
- `the region <name> keeps its sites <n> from the centre, past the disc's radius of <radius>`
- `the region <name> keeps the neutral's city from <least> to <most> of the centre, past the disc's radius of <radius>`

**Doc-impact:** `docs/MAP.md`.

**Scope:**

- In: three refusals when the catalogue is built — a camp distance from the centre past the radius, a site distance past the radius, and a neutral's band whose near end or far end is past the radius. One test on the fixture catalogue.
- Equal to the radius passes: the outer ring is tiles.
- The site distance is checked whatever the region's site count, even a region dealing no site, as the camp distance is checked whatever its camp count today.
- The neutral's far end is refused although it only ceils the band: a band written past the disc is a content mistake, and one meaning "as far as the disc goes" names the radius.
- The centre part's reach gets no check: a camp distance both past the first steps' reach and within the radius already forces the reach three or more inside the disc.
- Out: the apart distances — whether so many camps or sites fit on the disc at that spacing is a question of the terrain dealt, which no cheap check answers. Out: the "dealt 10 times" throw in `generateMap`, which stays as it is, for the terrain that happens to hold no room; it gains no test, having none today.
- Reconcile: the projected refusals go through the standing door — the region loop of the age check in `src/rules/catalogue.ts`, where the catalogue already refuses camps kept within the first steps' reach and a neutral's band kept nearer than it or inside out. Same loop, same `refuse`, same sentence shape. No second validator, no helper.
- No content standing today is refused: the Stone Age's regions keep nothing further than 9 on a radius of 12, the Nomadic one 7 on 10, the fixture's at most 6 on 7 or 8.

**Traps:**

- The region loop `continue`s when the region deals no neutral, before the band checks; the camp and the site refusals must stand before that `continue`, or a region without a neutral escapes them.
- The fixture's `clearing` region deals a neutral and no site; its `disc` region deals a site and no neutral. A test needs both, one for the neutral's band and one for the camps and the site distance, or `disc` alone for camps and sites with `clearing` for the band, as the standing tests at the first steps' reach and the neutral's band do.
- The test file's `regioned` helper replaces the age's whole regions table, and a `Region` carries its schedule, so a test spreads `AGE_REGIONS[<key>]` and changes one field, as the neighbouring tests do.
- The standing neutral check refuses `most < least` by its own sentence; a band with both ends past the radius must still be refused by the radius sentence, the test asserting on the sentence, not on `/^fixture: /` alone, where the standing band test does.
- `DOGMAS.md` _Code_: comments are for traps only, and a hook flags a comment block longer than three lines touched under `src/`. None of this needs a comment.

**Plan:**

1. `src/rules/catalogue.ts` — the three refusals in the region loop beside the standing distance checks; `npm run check` green, the standing tests unmoved.
2. `src/rules/catalogue.test.ts` — one test beside the first steps' reach test: the camp distance, the site distance, the band's near end and the band's far end at radius plus one each refused by their sentence, and the same four at the radius itself building the catalogue; `npm test` green.
3. `docs/MAP.md` — the sentence above.
4. `workflow/BOARD.md` — the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Spec: none — the line never reaches the screen. CI proves the whole suite on the push; no spec walks this path.
