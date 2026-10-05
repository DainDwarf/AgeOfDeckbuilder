# Camps across the water

**Line:** **Camps across the water** — an age's camp may stand across the water: the generator then deals its camps on any land the centre is reached from over the ground and the tiles embarked units enter, where another age's stand on ground the centre walks to; a camp's own guard enters on its camp's tile or on the nearest free tile the ground runs to the camp from, never on the city's ground across the water; the Stone Age's camp stands across the water, in every region, and the Nomadic Age's does not; held by tests on the fixture, the catalogue's coherence test passing. Doc-impact: `docs/MAP.md`, `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:**

- `docs/MAP.md` → _The generator_, the sixth layer. After the sentence ending "the catalogue refuses a region whose camps keep no further from the centre than the centre part reaches plus two." add: "An age's camp may stand **across the water**: its camps are then drawn among the tiles the centre is reached from over the ground and the tiles embarked units enter together, so a camp stands wherever a unit comes from the centre, embarking where the ground ends, an island among it. Which it is is the age's content."
- `docs/CHRONICLE.md` → the paragraph opening "**An event's enemies enter together**". After the sentence ending "and never on the city's tile; a tile the city holds is entered like any other, and the enemy on it occupies it." add: "A door the ground does not run to the city from, a camp across the water, is entered on by none: every enemy of the raid enters on the nearest free tile that it does."
- `docs/CHRONICLE.md` → the paragraph opening "**A camp enters on its own too**". "whether an enemy enters, on the camp's tile where it is free and on the nearest free tile around it otherwise, as a raid enters around its door; the odds are content." becomes "whether an enemy enters, on the camp's tile where it is free and otherwise on the nearest free tile it stands on that the ground runs to the camp from, ring by ring around the camp, seeded among tiles equally near, never on the city's tile, and nowhere where none is free; the odds are content."
- `docs/ages/STONE.md` → _The land_, a paragraph of its own ahead of the temperate region's: "The Stone Age's camps stand across the water, in every one of its regions: a camp may stand on an island, wherever a unit comes from the centre by embarking."
- No player-facing sentence.

**Doc-impact:** `docs/MAP.md`, `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Scope:**

- In: the declaration on an age's camp; the generator's reach for such a camp; the ground a camp's own guard enters on; the Stone Age's camp saying it; the tests.
- The declaration is the age's, on its camp, the user's call: the Stone Age's enemies are to use rafts, the Nomadic Age's are not, and the Nomadic deck holds no card that embarks. It is no region's: every Stone region deals its camps so.
- **The process is rolled, and only its candidates widen.** Each camp is still drawn one at a time, uniformly, among the tiles that keep the distances, one draw a camp; a camp across the water has more tiles to be drawn among. An age whose camp does not stand across the water deals every seed as it does today, draw for draw.
- How wide, measured on the Stone Age's temperate region over 1000 seeds, the page dealing it checked equal to the game's generator first: the camps move on 80% of the seeds, the draw falling elsewhere in a longer list; 18.5% of the maps hold a camp the ground does not run to the centre from, 5.1% of all camps; 5.7% hold a camp on an island under 4 tiles; and no deal is thrown away for its camps, where 5 seeds in 1000 were.
- A camp on an islet stays as dealt, the user's call: a unit whose range is one finds no tile beside it to attack from, and a unit of a longer range does.
- A camp's own guard enters on ground that runs to its camp, so a camp across the water keeps its guards on its island. Today every such guard enters on the ground that runs to the city: across the water it would enter on the city's island, further from its camp than a guard keeps, and go for the city — about one enemy every two turns over six camps at the standing odds. For a camp the ground links to the city the two grounds are one, and nothing changes: the same tiles, the same draws, the city's tile still never entered on.
- Where no tile of the camp's ground is free, the guard enters nowhere, as the ones left of a raid do today. An embarked guard, which the user offered, is out: no enemy goes on water until the New enemies rung.
- An event's raid through a camp across the water keeps today's rule, now written on the page: it enters on the city's ground nearest that camp. The New enemies rung replaces it with rafts, and its line on the board says so.
- The reconcile's choices: the map's camps and the camp an event's answer places stay apart — that one is a band making room beside the city, placed on ground that runs to it, and stays so. The reach over ground and water together is new: the walks the rules hold are ashore or embarked, never both.
- Out: enemies embarking; a raid's doors; the camp an answer places; any region.
- Saves from before this line need no care: a chronicle in progress keeps the camps it was dealt.

**Traps:**

- `src/rules/map.ts` reads an age through `MapAge` in `src/rules/map-kinds.ts`, not through the catalogue's `Age`: the comment there says why, an import cycle the lint refuses. What the generator reads of a camp passes through that shape.
- `src/content/stone.ts` takes its `camp` from the Nomadic slice, the same object: the Stone Age's camp becomes an entry of its own.
- `campsRolled` in `src/rules/chronicle.ts` enters a camp's guard through `enteredAround` in `src/rules/enemies.ts`, whose ground is `raidGround`: the ground that runs to the city, the city's tile left out. A raid, `raided` in `src/rules/schedule.ts`, and the answer that places a camp, in `src/content/nomadic.ts`, enter through the same function; the comment in that answer leans on the ground running to the city and is re-shaved if its reason moves.
- `campsRolled` draws once a camp whatever its odds, then once more only on a tie between tiles equally near. Those draws stay as they are for a camp the ground links to the city, or every chronicle replays differently from its seed.
- The guard's script, `guarding` in `src/content/scripts.ts`, keeps the nearest camp within its radius and raids without one: that is what makes the entering ground matter.
- The fixture's `CAMP` (`src/rules/fixtures.ts`) rolls at odds of 0 and is every fixture age's; `agesOver(camp, regions)` builds ages over a camp handed in. The standing test "a camp stands where the ground runs to the centre, never across the water" (`src/rules/map.test.ts`) holds for a camp that does not stand across the water and stays.
- A fog snapshot keeps no `embarked` (`SnapshotUnit`, `src/rules/state.ts`): one more reason no guard enters embarked here.
- The Stone Age's specs search their seeds through `firstSeed` and read their oracle from the rules, so camps that move leave them standing; a search that finds no seed is a finding to report, never a predicate to loosen.

**Plan:**

1. `src/rules/map-kinds.ts`, `src/rules/catalogue.ts`, `src/rules/map.ts`, `src/rules/fixtures.ts` and `src/rules/map.test.ts`: the declaration and the generator's reach — leaves a camp that stands across the water dealt on any land the centre is reached from over the ground and the tiles embarked units enter, and every other camp dealt as today: one test on a fixture age whose camp stands across the water, that every camp keeps its distances and stands on such land, and that some seed deals one the ground does not run to the centre from.
2. `src/rules/enemies.ts`, `src/rules/chronicle.ts` and the tests beside them: the camp's own guard — leaves a camp across the water entering its guard on its own tile, or on the nearest free tile of its own ground where a unit stands on it, and never on the city's ground; one test for that, through an ended turn on a camp whose odds are certain, and one that a raid whose door is a camp across the water enters on the ground that runs to the city, nearest that camp.
3. `src/content/stone.ts`: the Stone Age's camp, an entry of its own, standing across the water — its own commit after the two above, the catalogue's coherence test passing.
4. The `docs/` edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No proof spec: a camp across the water is drawn as any camp is, and the line adds nothing to the screen. CI proves the whole suite on the push; the specs that open a Stone Age chronicle or walk the camps are `e2e/camps.spec.ts`, `e2e/map.spec.ts`, `e2e/fog.spec.ts`, `e2e/attack.spec.ts`, `e2e/archer.spec.ts`, `e2e/embark.spec.ts`, `e2e/heal.spec.ts`, `e2e/trapping.spec.ts`, `e2e/irrigation.spec.ts`, `e2e/farm.spec.ts`, `e2e/tannery.spec.ts`, `e2e/pin.spec.ts`, `e2e/press.spec.ts` and `e2e/launch-warning.spec.ts`.
