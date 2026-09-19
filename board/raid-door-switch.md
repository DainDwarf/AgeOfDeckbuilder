# The raid's door is a switch

**Line:** `raidEntry` in `src/rules/enemies.ts` picks the raid's door over a closed two-member set with a `switch` and no `default`, each member answering its own tiles and the other door where it holds none, and the ring-empty-to-camps direction stands in `docs/CHRONICLE.md` with one test on the fixture.

**Spec:** `docs/DOGMAS.md` → _Code_ → "A closed set is switched, never tested." `docs/CHRONICLE.md` → _Events and the capstone_ → the paragraph "**Enemies enter from camps.**" The sentence "With no camp standing the outer ring is the only door, so an event's raid always enters." becomes:

> With no camp standing the outer ring is the only door, and with no tile of the outer ring the camps are, so an event's raid always enters where either door stands; a chronicle with neither takes no raid, and the deal is a `runtime-error`.

No player-facing text: the raid's door is never shown.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:** In: the branch in `raidEntry` over the two doors becomes a `switch` over a closed union of the door's two names, no `default`, each case answering the door's tiles, and the other door's where its own are empty. The draw stays one seeded step before the switch and one after it, so every seed replays as it does today. In: the one sentence above. In: one test in `src/rules/enemies.test.ts`, on a fixture disc whose outer ring is all coast with one camp standing (`only` in `src/rules/fixtures.ts` builds it) and the raid's camp odds at zero, asserting the raid enters on the camp. Out: the generator — it promises nothing about the outer ring, and a map whose ring holds no door and whose every camp is captured takes no event raid; that is a discovery for the user, not this line. Out: occupancy of the door's tile — a door is drawn among tiles whether a unit stands on them or not, and the entering finds the nearest free tile; unchanged. Out: every other `if` or ternary in the file.

**Traps:**

- The two-door draw consumes exactly two generator steps, the side then the tile; the tests over eight seeds in `src/rules/enemies.test.ts` replay on that count. Reshaping the branch must not add or drop a step.
- The fixture catalogue's `raidCampOdds` is 1, so every existing raid test goes through the camps; the ring-empty direction is reached only by a catalogue with the odds at 0, as `raidingAt` in the test file builds.
- `ring` and `camps` are read from the whole disc, not from free tiles; the all-occupied guard above the draw is what keeps `enteredAround` from entering nothing. Keep it above the switch.
- The comment on reading the disc's edge off its tiles is a trap comment and stays; nothing else in the function earns one.

**Plan:**

1. `src/rules/enemies.ts`: the door drawn is one member of a closed two-name union, and a `switch` over it with no `default` answers the tiles the raid draws its entry from — the member's own where any stand, the other's otherwise. Leaves standing: `npm run check` and every existing test.
2. `src/rules/enemies.test.ts`: one test, "a raid drawn through an outer ring that holds no tile it stands on enters through a camp", on a disc from `only` with the city and one camp as its only land, `raidingAt(0)`, over the eight seeds; asserts one warrior entered, on the camp's tile. Leaves standing: `npm test`.
3. `docs/CHRONICLE.md`: the sentence above in place of the one it replaces. Leaves standing: `npm run lint`.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No Playwright spec: nothing on screen changes.
