# Merge elevation and river lift

**Line:** **Merge elevation and river lift** — a terrain carries one height, its elevation, and the river layer reads it where it read the terrain's lift, at a relief of 1.0 in both content regions; `docs/MAP.md` and `docs/GLOSSARY.md` say so, and `npm test` is green. Doc-impact: `docs/MAP.md`, `docs/GLOSSARY.md`.

**Spec:** The decision, settled 2026-09-24 on the real generator run over 200 seeds per region: the two numbers parted on forest alone (elevation 1, lift 0), and a forest standing one step over the plain for the water as it does for sight costs about one fed forest tile in ten and nothing else, once relief is retuned from 1.5 to 1.0 so hills and mountain stand where they stood and rivers run as long as today.

`docs/MAP.md`, _The generator_, the rivers paragraph. Its first sentence today:

> Every tile takes a height — how far it lies from the nearest water, lifted where the ground is hills or mountain and roughened by a roll — and the corner where three tiles meet stands at the mean of theirs.

becomes:

> Every tile takes a height — how far it lies from the nearest water, lifted by its terrain's elevation, the one number sight reads too, and roughened by a roll — and the corner where three tiles meet stands at the mean of theirs.

The paragraph's last sentence, "How far the relief lifts the ground, …", stands as it is.

`docs/GLOSSARY.md`, the **elevation** row. Its definition today, "How high a terrain stands over the ground; what blocks sight.", becomes "How high a terrain stands over the ground; what blocks sight, and what lifts the river layer's height." The forbidden column stands.

`docs/CHRONICLE.md`'s sentence "Every terrain has an elevation, how high it stands over the ground, a number on its content" is already true of the merged number and is not edited.

No player-facing text: nothing on screen names either number.

**Doc-impact:** `docs/MAP.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: `TerrainKind` carries `elevation` alone; the river layer's height field reads it in place of `lift`. Every terrain in `src/content/stand-in.ts`, `src/content/nomadic.ts` and `src/rules/fixtures.ts` drops its `lift`; its `elevation` stays what it is (plain 0, forest 1, hills 2, mountain 3, water and urban 0, the fixture's glade 0).
- In: `relief` becomes 1.0 in the stand-in region and in nomadic's temperate region. The fixture's first region takes 1.0 too, so the tests' field is on the content's scale; its second region is at 1 already.
- In: the doc comments on `TerrainKind` and `RiverFlow` in `src/rules/map-kinds.ts` say elevation where they say lift.
- Out: any other river number. Roughness, climb, meander, curl and the rest stay; the mockup varied relief alone and that was enough.
- Out: any change to sight. It read elevation before and reads the same number after.
- Corner: rivers avoid forest a little more than today. Measured at relief 1.0 over 200 seeds: nomadic's temperate region feeds 5.8 forest tiles per map where it fed 6.6, and runs 21.7 river edges per map where it ran 23.2; the stand-in region is within noise on both. That drift is the decision, not a defect, and no number of it is asserted anywhere.

**Traps:**

- Every seed's map changes past the terrain scatter. The biomes, the rim, the terrains and the features draw exactly as before, so a seed's terrain is the same tile for tile; the rivers run differently, and since a course that dies draws again, the generator state after the rivers differs and the camps land elsewhere. Every e2e spec but one finds its seed by search through `firstSeed` in `e2e/chronicle-screen.ts` and adapts on its own.
- The one pinned seed is `e2e/camps.spec.ts`'s `SEED = 1`. The generator re-deals until the camps are placed, so seed 1 still holds them; what the spec assumes past that — the raid's warrior standing beside a camp on the turn the timeline names — is read off the launch and should hold. The spec is run to prove it, and if it fails, the seed moves, not the assertion.
- `src/rules/map.test.ts`'s test "a range dealt clear of the water runs the two rivers it is worth, whole courses both" reads seed 0. The range's placement is unchanged (it is dealt before the rivers), but whether both its courses complete under the new field is not; if the test fails, another seed whose range is clear of the water is chosen, and the assertion stays.
- `sight.test.ts` names a local `Relief` type of its own; it is the terrain layout of a test map and has nothing to do with `RiverFlow.relief`.
- The catalogue's `version` strings do not change: a save carries its map, so it replays as it was, and only a fresh launch from a seed deals differently.
- TypeScript catches every `lift:` left in a terrain literal as an excess property once the field is gone from `TerrainKind`; `npm run check` is the sweep.
- Tests never assert a real piece of content's numbers (`DOGMAS.md`, _Testing_): the measured counts above are for the implementer's judgement, never for a test.

**Plan:**

1. `src/rules/map-kinds.ts`: `lift` leaves `TerrainKind`; the two doc comments say elevation. Leaves the typecheck red wherever `lift` is read or written, which is the list of what step 2 touches.
2. `src/rules/map.ts`: the height field reads the terrain's elevation. `src/rules/fixtures.ts`, `src/content/stand-in.ts`, `src/content/nomadic.ts`: every `lift` dropped, `relief` 1.0 in the stand-in region, the temperate region and the fixture's first region. Leaves `npm run check` green.
3. `npm test`. The seed-0 river test in `src/rules/map.test.ts` is re-seeded only if it fails, as the trap says. Leaves the rules tests green.
4. `docs/MAP.md` and `docs/GLOSSARY.md`: the sentences above. `workflow/BOARD.md`: the line deleted; this file deleted.

**Verify:** `npm run check`, `npm run lint`, `npm test`; the proof spec `npx playwright test e2e/camps.spec.ts`, the one spec that pins a seed. CI proves on the push: `e2e/map.spec.ts`, `e2e/landing.spec.ts` and the rest of the suite, each finding its seed by search over the redealt maps.
