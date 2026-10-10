# An enemy enters on no city

**Line:** An enemy enters on no city — a raid's and a camp's roll's enemies enter on neither city's tile, the neutral's as the player's, proven by one rules test on the fixture that stands the neutral beside the player's city, and `docs/CHRONICLE.md` says so.

**Spec:** `docs/CHRONICLE.md`, _Enemies and camps_, two sentences change and nothing else:

- The raid's paragraph (the one opening **An event's enemies enter together**): `…ring by ring around the door, seeded among tiles equally near, and never on the player's city's tile; a tile the player's city holds is entered like any other, and the enemy on it occupies it.` becomes `…ring by ring around the door, seeded among tiles equally near, and never on a city's tile, the neutral's as the player's; a tile a city holds is entered like any other, and the enemy on it occupies it.`
- The camp's roll paragraph (the one opening **A camp enters on its own too**): `…ring by ring around the camp, seeded among tiles equally near, never on the player's city's tile, and nowhere where none is free; the odds are content.` becomes `…ring by ring around the camp, seeded among tiles equally near, never on a city's tile, and nowhere where none is free; the odds are content.`

No player-facing text: nothing of this line reaches the screen.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the tiles an entry spills onto around its door — a raid's around the door it drew, a camp's roll's around the camp — exclude the neutral's city's tile where the chronicle holds a neutral, as they exclude the player's.
- In: as a consequence of the same walk, a neutral's city standing on the disc's outer ring is no raid's door. No region today deals the neutral that far out; this is the reading of the line and needs no test of its own.
- Out: the tiles the neutral holds inside its border. They are entered like any other, as the player's held tiles are, and the enemy on one occupies it — decided at intake, written into the raid's sentence above. Nothing in the code changes for them.
- Out: the camp's own-tile entry — the opening and a roll landing on the camp's tile. A camp never stands on a city's tile, so that path needs nothing.
- Out: an enemy that walks onto the neutral's city's tile and what it does there; today's rules stand.
- Out: a chronicle whose region deals no neutral: nothing is excluded, nothing changes.
- Reconcile: the projected goes through the standing door as it is — the one walk in `src/rules/enemies.ts` that lists the tiles an entrant stands on around a door and drops the player's city's tile today drops the neutral's too. No second filter anywhere.

**Traps:**

- The walk that lists the spill tiles is also the walk the raid reads its outer-ring doors from; the exclusion lands in both readings by design, see Scope.
- The player's city standing nowhere at an entry is a refusal today and stays one; the neutral is optional on the chronicle (`chronicle.neutral` is absent where the region deals none), so its city's tile is excluded only where it stands. No guard beyond that optional read.
- The shared fixture in `src/rules/fixtures.ts` stands the neutral's city beside the player's: `besideTheNeutral` deals plains out to three with the neutral's city on `NEUTRAL_TILE`, `{ q: 1, r: 0 }`, and the player's city on the centre. The test fixture shaping an entry so the spill must reach a city's tile is the existing raid test in `src/rules/enemies.test.ts` titled `a raid never enters on the city's tile…`: a disc cut down with `only` to the door, the forbidden tile and one tile beyond, so the entrant has nowhere else.
- The camp's roll at odds of one is the simplest door: the existing roll tests build their catalogue through `camping({ odds: 1 })` from the fixtures. The raid shares the same walk and needs no second test.

**Plan:**

1. `src/rules/enemies.ts` — the walk around a door drops the neutral's city's tile as it drops the player's. Leaves standing: every entry spills onto neither city's tile; the ring doors omit a neutral's city on the edge.
2. `src/rules/enemies.test.ts` — one test: a camp standing beside the neutral's city on a disc cut down so the neutral's city's tile is the nearest free tile around the camp, the roll at odds of one entering its guard on the tile beyond it, never on the neutral's; and, on the same fixture with the camp's tile and the neutral's tile the only tiles left, the roll entering nothing. Leaves standing: the rule proven on the fixture's numbers.
3. `docs/CHRONICLE.md` — the two sentences under Spec. Leaves standing: the design saying what the code does.
4. `workflow/BOARD.md` — the line deleted; this file deleted with it.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof spec: none — the line never reaches the screen.
- CI proves on the push: `e2e/camps.spec.ts`, `e2e/neutral.spec.ts`, `e2e/archipelago.spec.ts`, `e2e/pillage.spec.ts`, listed for the hand-back and never run.
