# The parked crumbs

**Line:** **The parked crumbs** — the camps' placement and capture raise their tile change through the door `src/rules/cards.ts` holds; one fixture test proves a card aimed at a unit counts the terrain its unit stands on; `WARRIOR`, `WORKER`, `HUNT` and `paidOnDeer` are each declared once, in `e2e/chronicle-screen.ts`; the launch warning's none-reached test asserts no warning stands after the press; no test asserts `SURVEY_NEED`; Nomadic's Gather reads played through a worker; `npm test` green and `e2e/pin.spec.ts` proves it. Doc-impact: `docs/ages/NOMADIC.md`.

**Spec:** nothing changes for the player; the line is a cleanup of rules and spec code, one rule proven, and one design sentence reworded.

The rule proven, decided by the user at intake: an achievement counting the kinds of terrain a card is played on counts a card aimed at a unit by the terrain of the tile its unit stands on, read as the tile stands when the card is played. A card played through a worker and a card aimed at a unit are the same gesture to the player, so "played on" means the same for both. The code already does this (`src/rules/chronicle.ts`, the terrain read for a play); the line adds its test and changes no behaviour. No design page states it: `docs/ages/STONE.md` states Herbalism's goal on Gather, which is unchanged.

`docs/ages/NOMADIC.md`, the Gather bullet, first sentence. Replace:

> **Gather**, the age's card, costing nothing: aimed at a worker outside the border, it spends the worker's action and gains the yield of the tile the worker stands on, whatever its layers and the river give; on a tile the city holds it is refused, for the border is the population's to work.

with:

> **Gather**, the age's card, costing nothing: played through a worker standing outside the border, it spends the worker's action and gains the yield of the tile the worker stands on, whatever its layers and the river give; on a tile the city holds it is refused, for the border is the population's to work.

The rest of the bullet stands. No player-facing entry is added or changed: the line over the hand already reads Gather as played at a tile.

**Doc-impact:** `docs/ages/NOMADIC.md`, the one sentence above.

**Scope:**

- In, the six crumbs of the line as it was ordered, and the four same-shaped ones the user folded in at intake:
  1. Camp placement (`src/rules/schedule.ts`) and camp capture (`src/rules/chronicle.ts`) each write a tile map and a `retiled` change by hand; both go through the door `src/rules/cards.ts` holds for a tile's change. The stages each raises are the same as today, change for change.
  2. The unit-aim branch of the terrain read is kept and proven by one test on the fixture, beside the deed tests of `src/rules/chronicle.test.ts`.
  3. `WARRIOR`, the unit kind, is declared once in `e2e/chronicle-screen.ts` and read by `e2e/heal.spec.ts`, `e2e/camps.spec.ts` and `e2e/attack.spec.ts` (the last types the literal today).
  4. `WORKER`, the unit kind, likewise: `e2e/chronicle-screen.ts` types the literal twice and `e2e/farm.spec.ts` once.
  5. `HUNT`, the card, likewise: declared today in `e2e/pin.spec.ts`, `e2e/trapping.spec.ts` and `e2e/worker-instants.spec.ts`.
  6. `paidOnDeer` moves from `e2e/trapping.spec.ts` to `e2e/chronicle-screen.ts` and `e2e/pin.spec.ts`'s own seed search goes through it. What differs between the two users is what it takes: the era and the civilization. The `Paid` shape moves with it, and `e2e/worker-instants.spec.ts`'s identical copy of that shape reads the shared one.
  7. `e2e/launch-warning.spec.ts`, the none-reached test: an explicit assertion that no warning stands, placed after the press on Launch and before the wait for the chronicle screen.
  8. Both assertions on `SURVEY_NEED` in `src/rules/chronicle.test.ts` are cut (`toBe(2)` in the deed test, `toBeGreaterThan(1)` in the two-tallies test): the fixture asserting itself, and each test fails on its own assertions if the need moves. The user ordered the cut; no behaviour stops being promised. The constant, read by no test from then on, is no longer exported from `src/rules/fixtures.ts`.
  9. The Nomadic sentence in Spec.
- Out:
  - The generator's own camp dealing (`src/rules/map.ts`): it deals raw tiles before any chronicle exists and raises no change.
  - The fixtures' tile helpers in `src/rules/fixtures.ts` and `src/rules/schedule.test.ts`.
  - `e2e/worker-instants.spec.ts`'s `paidOn`: a different search, a worker stepped onto ground the map dealt; it stays.
  - `e2e/pin.spec.ts`'s `expect(need).toBeGreaterThan(1)`: a spec's precondition on the game's content, not a fixture asserting itself; it stays.
  - What the line over the hand reads for a card played through a worker: unchanged, "at a tile".
- Corner cases decided here:
  - A goal declared on a card aimed at nothing, at the hand or at the discard pile still counts no terrain, as today.
  - The launch warning assertion after the chronicle screen stands would prove nothing, so it does not go there: see Traps.
- Reconcile:
  - The camps' tile change goes through the standing door as it is. Whether placement goes through the door a building card builds through or both go through the bare one-tile door is the implementer's; either way no new gameplay verb is named, `docs/GLOSSARY.md` holding none for a building leaving its slot.
  - The shared constants follow the standing ones of `e2e/chronicle-screen.ts` (`TRAPPING`, `SHELTER`, `HOLDING`).
  - The unit-aim test stands on the fixture's own cards aimed at a unit and the test file's own way of overriding an achievement; nothing new is added to `src/rules/fixtures.ts` for it unless a second test file needs it.

**Traps:**

- Camp placement moves the generator in the same change as the tile: each camp placed is its own stage carrying the draw that placed it. The chronicle handed to the door carries that draw's generator, or the stage flow and the replay from a seed change. `src/rules/schedule.test.ts` and `src/rules/chronicle.test.ts` hold both flows; they pass with no test edited.
- The fixture's cards aimed at a unit each refuse a unit in its opening state: `PH_March` a unit with its move points full, `PH_Heal` one at full health. The test's unit has moved or been hurt before the play.
- The terrain read's switch covers every aim because the closed-set dogma demands it; the unit case stays where it is. The test is the change, not the switch.
- `HUNTING` in `e2e/pin.spec.ts` is the technology `'trapping'`; `TRAPPING` in `e2e/chronicle-screen.ts` is the card and the improvement of the same id. Two meanings sharing a value: they stay two names.
- `WARRIOR` and `WORKER` name unit kinds. The Nomadic cards that enter them carry the same ids; a spec that later needs the card names it apart. `'first-worker'` in `workerStepped` is a card, and stays.
- The two `paidOnDeer` users differ in more than the era: the Trapping spec launches on the first civilization with a copy of Trapping added, the pin spec on the first civilization as it is, in the campaign's second age with its technologies learned. The complaint names the age in one and not the other; one wording serves both.
- The launch warning is laid inside the press's own click handling, on the menu scene, which is always running (`src/ui/launch-screen.ts`, the Launch button's click; `src/ui/menu-scene.ts`, `warn`): were it raised, it would stand the moment the press returns. The chronicle screen that rises calls `resetMenu`, which closes whatever window of the menu stands, so an assertion made after the chronicle screen stands can never fail. `launchedFromScreen` (`e2e/chronicle-screen.ts`) presses and waits in one, and other specs use it.
- `docs/PHASER.md` _Under a Playwright spec_: a spec rests before it presses what just changed.
- Comments are for traps only: a moved helper's docblock is re-shaved to what its new home does not show, and no comment paraphrases the code under it.

**Plan:**

1. `src/rules/cards.ts`, `src/rules/schedule.ts`, `src/rules/chronicle.ts`: the camps' placement and capture through the door; no tile map written by hand in the two files; the rules tests green, none edited.
2. `src/rules/chronicle.test.ts`: the unit-aim test beside the deed tests; the two `SURVEY_NEED` assertions and the import gone. `src/rules/fixtures.ts`: the constant no longer exported.
3. `e2e/chronicle-screen.ts`: `WARRIOR`, `WORKER`, `HUNT`, `paidOnDeer` and its `Paid` shape, each declared once. `e2e/heal.spec.ts`, `e2e/camps.spec.ts`, `e2e/attack.spec.ts`, `e2e/farm.spec.ts`, `e2e/pin.spec.ts`, `e2e/trapping.spec.ts`, `e2e/worker-instants.spec.ts`: each reads the shared one; what each spec asserts is unchanged.
4. `e2e/launch-warning.spec.ts`: the none-reached test asserts no warning stands after the press, before the chronicle screen is waited for.
5. `docs/ages/NOMADIC.md`: the sentence in Spec.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- The proof: `npx playwright test e2e/pin.spec.ts`.
- CI's, listed for the hand-back, never run locally as proof: `e2e/trapping.spec.ts`, `e2e/worker-instants.spec.ts`, `e2e/heal.spec.ts`, `e2e/camps.spec.ts`, `e2e/attack.spec.ts`, `e2e/farm.spec.ts`, `e2e/launch-warning.spec.ts`, and every other spec that opens through `e2e/chronicle-screen.ts`.
