# Make room can deliver Fight

**Line:** **Make room can deliver Fight** — A rival band names the need of a tile near the city that takes a camp and is not dealt without one, placing a camp enters no unit, and Make room's raid enters on and around the camp it placed by the raid's own entry rule, the first on the camp; `docs/ages/NOMADIC.md` says the need, and a rules test on the fixture holds it. Doc-impact: `docs/ages/NOMADIC.md`.

**Spec:**

- `docs/CHRONICLE.md` → _Events and the capstone_, unchanged, is the rule: an event may name what it needs of the chronicle to be dealt and one whose need is not met weighs nothing, so no event is dealt that does nothing; a placed camp is a camp in everything; a raid's first enemy enters on the door's tile where it is free, and each one after on the nearest free tile ring by ring around the door.
- `docs/ages/NOMADIC.md` → _The events_, the **A rival band** entry: after "Both answers cost no stock: many now against fewer now and more later." add the sentence "A rival band needs a tile near the city that takes a camp, and is not dealt without one." The rest of the entry stands as written: "one warrior at first" is the raid's count early in the chronicle, nothing the placement does.
- Player-facing text: none new. The Make room card keeps its entry, "A camp is placed near the city, and a raid of {warriors} enters on and around it", and it is true on every take from this line on.

**Doc-impact:** `docs/ages/NOMADIC.md`.

**Scope:**

In:

- The camp placer places camps and enters nobody. What it does today beyond that — the camp's warrior entered on each camp placed — leaves it.
- A predicate paired with the placer says whether a camp can be placed in a band around the city: the need reads it, and it reads the same candidate tiles the placement draws from, as Wildfire's start and The herd's deal each pair a predicate with their draw.
- A rival band, in `src/content/nomadic.ts`, names that need on the content's band, 3 to 4 from the city. Fight is gated with it; decided here, not a deviation. Make room composes: one camp placed in that band, 3 apart from every camp standing, then its raid entering on and around the camp by the raid's entry rule, `raiders(turn)` warriors in all. Where no tile takes a camp — reachable only by a closure called outside its need — the landing is a `runtime-error`, as a raid with no door is. The widening of the band ring by ring and the fall through to a raid through a door both go.
- The fixture's `PH_Rivals` in `src/rules/fixtures.ts` names the same need, and `PH_Encampment` composes as Make room does, `ENCAMPED` warriors in all. The fixture's `PH_Siege` composes the placement of its five camps, then the camp's unit entered on each camp placed; the stand-in's siege in `src/content/stand-in.ts` composes the same, and its short siege with it.
- The band and the apartness stay the numbers they are; they are content.

Out:

- Any change to how a raid draws its door, enters ring by ring, or to the camps' own rolls at the enemy phase.
- Any change to the map generator's camps.
- The event's weight, the raid's count, the rewards.

Corner cases decided:

- The need gates the whole event, Fight included, though Fight never lacks a door: a need is the event's, as the design says. On the real content, settled at the centre, 300 seeds never lacked a tile in the band at the settle, fewest 9, median 30 of 42, so the gate stays open in practice.
- A camp is placed on a free tile of a terrain the camp's unit stands on, that the ground runs to the city from, so the raid's first warrior always lands on the camp with no special case.
- The Make room test standing in `src/rules/schedule.test.ts` — one camp in the band, `ENCAMPED` warriors, one on the camp and the rest beside it — is the rule and keeps holding; the siege tests there, a warrior on each camp placed, keep holding through the composition.

**Traps:**

- The catalogue refuses a camp on a terrain its unit cannot stand on (`src/rules/catalogue.ts`), and the placer's candidates already ask that the ground runs to the city and no unit stands there: those three together are why the raid's first warrior lands on the camp. Nothing else guarantees it, so the composition enters the raid around the placed camp and draws no door of its own.
- Three contents compose the placer — the nomadic content, the fixture and the stand-in — and the fixture and the stand-in each have a siege on it. All three change in the same unit; a test file failing on the fixture's siege is the composition missing there.
- The need and the placement must read one candidate set: a need that says yes where the placement finds nothing is a `runtime-error` dealt on a take. One choke point per invariant.
- The coherence tests in `src/content/nomadic.test.ts` and `src/content/stand-in.test.ts` call every answer's landing on seed 1, launched and settled: they exercise Make room's landing on a real map, where a tile is always there.
- `ENCAMPED` in the fixture is the raid's whole count now, not the count beyond the camp's own; the standing test already reads it that way.

**Plan:**

1. `src/rules/schedule.ts` — the placer places and enters nobody; the paired predicate for the need; the Make room composition with no widening and no fall through, a `runtime-error` where no tile takes a camp. Whether that composition stays a named rules helper or moves into the content is the implementer's call.
2. `src/rules/fixtures.ts` — `PH_Rivals` names the need; `PH_Encampment` and `PH_Siege` compose. `src/content/stand-in.ts` — the siege composes. `src/content/nomadic.ts` — `rival-band` names the need; `make-room` composes. After this step every test standing passes again.
3. `src/rules/schedule.test.ts` — one test: on a due turn where no tile near the city takes a camp, the fixture's rival event is not dealt, and its camp-placing answer landed on that chronicle is a `runtime-error`.
4. `docs/ages/NOMADIC.md` — the sentence.
5. `BOARD.md` — the line deleted; this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and `npx playwright test e2e/capstone.spec.ts` — the spec that opens on the stand-in's short siege.
