# The neutral's claims

**Line:** The neutral's claims — the neutral claims at the enemy phase through the one claim rule, as many tiles as its culture pays for, its script choosing which; a card played through a worker is refused on a tile the neutral holds; the map rings the tiles it holds in its colour, a tile in fog wearing the ring it wore when last seen. Doc-impact: `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/ages/STONE.md`.

**Spec:** `docs/CHRONICLE.md` _The city_, _Sight_ and _The neutral_; `docs/CHRONICLE-SCREEN.md` _The pointer and the tile's marks_; `docs/ages/STONE.md` _The neutral_. The sentences to change or add:

- `CHRONICLE.md` _The city_, the claim paragraph: "A tile a camp fills is not claimed, nor a tile the neutral holds, and neither is a tile an enemy occupies: the border grows around them, never onto them, and none takes one population. A camp's tile is claimed like any other once its capture empties the slot, the neutral's tiles once its fall frees them, and an occupied tile the turn the enemy walks off it." becomes "A tile a camp fills is not claimed, nor a tile the neutral holds, and neither is a tile a unit of another faction stands on: the border grows around them, never onto them, and none takes one population. A camp's tile is claimed like any other once its capture empties the slot, the neutral's tiles once its fall frees them, and a tile a unit stood on the turn it walks off."
- `CHRONICLE.md` _Sight_, the fog paragraph: "The chronicle keeps a snapshot of every tile that has ever been in sight — its terrain, its feature, its improvements, its building, and the non-player unit standing on it." becomes "The chronicle keeps a snapshot of every tile that has ever been in sight — its terrain, its feature, its improvements, its building, the city whose border it stands inside, and the non-player unit standing on it."
- `CHRONICLE.md` _The neutral_, after "It is a city in everything _The city_ says: … and a tile it holds is no claim of the player's.", add: "Where the enemy phase says the neutral acts, its city claims as many tiles as its culture pays for, each at the culture threshold as it stands, its script choosing which among the tiles its border may grow onto; it reads the whole map as the enemies do, so it claims a tile charted or not. A card played through a worker lands on no tile the neutral holds, its city's included."
- `CHRONICLE-SCREEN.md` _The pointer and the tile's marks_: "The neutral's city's mark is in the neutral's colour." becomes "The neutral's city's mark and the ring on every tile it holds are in the neutral's colour. A ring is drawn from the tile as the map draws it, so a tile in fog wears the ring it wore when last seen; the ring on either city's own tile is heavier than the rest."
- `ages/STONE.md` _The neutral_: "Its units are the age's own, and its script keeps it growing and sends its warriors at the camps." becomes "Its units are the age's own, and its script keeps it growing and sends its warriors at the camps: it claims the tile that yields most among those it may claim, the nearest to its city of equals."

No new player-facing entry: the refusal on a tile the neutral holds reads the standing `refusal.other-faction` entry, "That tile belongs to another faction".

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/ages/STONE.md`.

**Scope:**

In:

- The one claim door takes the faction, as income and growth do: the tiles a city may claim, the culture threshold (twice the tiles that city holds), the payment and the tile taken inside the border with one idle population at once. For the player the door keeps the charted condition; for the neutral there is none. For both, a tile is claimable when no city holds it, no camp fills it, no unit of another faction stands on it, and it touches a tile the city holds. A site's tile is claimed like any other, by either.
- The neutral acts in the enemy phase after the waves are sent and before the enemies act. Its city claims as many tiles as it can pay for, one after another, each at the threshold as it then stands, each through the door; with nothing to claim or nothing to pay with it claims nothing and raises no stage.
- The neutral's script is content on the age's neutral, beside the camp's scripts: it chooses the tile among those the door offers, the one that yields most in all resources together (read through the one tile-yield helper, buildings beside counted), the nearest to its city of equals, the first in tile order of those. No draw from the generator. The fixture age's neutral names a script of the fixture's own.
- A card played through a worker is refused on any tile the neutral holds, before the card's own reasons, as "no worker here" is read before them, with the `other-faction` block. The terraform's own refusal of the neutral's city tile is subsumed; its refusal of the camp's tile stays as it is.
- The snapshot keeps the city whose border the tile stands inside, the player's or the neutral's, or none. The save writes and reads it. A unit's leaving the snapshot at the turn's tick leaves the holder standing.
- The map draws a ring on every tile a city holds from the face it draws for the tile: live where the tile is live, the snapshot's holder in fog. The player's ring in the civilization's colour, the neutral's in the neutral's colour, the heavier ring on either city's own tile.

Out:

- The neutral's units, the camps, the stance and the fall: the four lines after this one. No tile the neutral holds turns anything hostile here; a unit of the player's standing on one merely blocks the claim.
- The resource bar, city mode's marks and the yield overlay read the player's city alone, as today.
- The culture refusal on the neutral's tiles in city mode: a tile the player may not claim answers nothing, as today.

Corner cases decided:

- The neutral's tiles are no claim of the player's and the player's none of the neutral's, each read live off the chronicle; the ring in fog is the one display that may lag, by design.
- The neutral's claim takes one of its idle population at once when it has one, the city rule as it stands; one it has none for stands unassigned until it grows.
- Nothing of the player's sees for the neutral: a claim of the neutral's charts nothing.
- Pre-existing saves need no care (the save's compatibility waits for the Bronze Age): a snapshot without a holder in an old save is the reader's refusal or its default, the implementer's choice, reported.

Reconcile:

- The claim: the player's door and the neutral's are one, the faction its parameter; the player's charted condition is the one difference kept. The "enemy occupies" condition widens to "a unit of another faction stands on it" for both cities; the income rule's "yields nothing while an enemy occupies it" does not change.
- The trespass: one rule at the worker's door for every tile the neutral holds; the terraform keeps its own refusal of the camp's tile.
- The ring: one drawing path for both cities' rings, reading the face the map draws, the colour by the holder.

**Traps:**

- `cultureThreshold`, `claimable`, `claim`, `bordered`, `tileCost`, `tileRefusal`, `cityCommand` and `claimWaiting` in `src/rules/city.ts` read the player's rows alone; `income` and `grow` there show the shape that serves both cities (`cityRows`, `withCityRows`, `CityFaction` in `src/rules/state.ts`). The chronicle screen's city mode calls the player's readings, so their player-facing behaviour must not change.
- `occupied` in `src/rules/units.ts` is read by the income rule too: the claim's condition widens to another faction's unit, the income's does not. Widen the claim, not `occupied`.
- The enemy phase's order lives in `enemyPhase` in `src/rules/chronicle.ts`: prepares landed, waves sent, each enemy acts in unit order, camps rolled. The neutral acts between the waves and the enemies.
- Change names and group names are closed sets in `src/rules/stages.ts`; every `switch` over them in `src/ui/map.ts`, `src/ui/hand.ts`, `src/ui/piles.ts` and `src/ui/chronicle-scene.ts` must take a member added. The neutral's claim needs no new change name: `stock`, `held` and `assigned` carry it as `stock` carries its income, the chronicles before and after saying whose row moved. A group named for the neutral's act is the implementer's call; a new group name touches every switch over `Group`.
- `records` in `src/rules/sight.ts` decides whether a snapshot is retaken by comparing its fields; a holder added is compared there or a border change is never charted. `taken` keeps no unit of the player's; it keeps the holder for both cities. `unitsGone` rebuilds snapshots without the unit and must keep the holder.
- `snapshotOf` in `src/rules/save.ts` reads a snapshot; `src/rules/fixtures.ts` builds chronicles with `snapshots: []` and the e2e helpers plant saves through the game's own writer.
- The map's `paintBorder` in `src/ui/map.ts` reads `shown.held` live and weighs the city's own tile heavier; `faceIn` answers the face a tile is drawn with, live or snapshot; the rings layer is the container named `border`, which `marksIn(page, 'border')` counts. The uncharted veil off draws a tile with no snapshot as it stands, so its ring is live.
- `throughWorker` in `src/rules/cards.ts` is the one door every card a worker's action goes to composes (Gather, Hunt, the improvements, the terraforms, the feature removed, the buildings): `worked` is read first, then the card's own refusal. The block `other-faction` and its entry `refusal.other-faction` exist; the refusal note is the one a refused card raises.
- `terraformable` in `src/rules/cards.ts` answers `other-faction` on the camp's tile and the neutral's city tile; `reaches` there keeps the city tiles' own-terrain rule, which stays.
- The age's neutral is `Age.neutral` in `src/rules/catalogue.ts`, `{ building }`, validated in `ageHeld`; the Stone content names it in `src/content/stone.ts`, its scripts live in `src/content/scripts.ts` with their tests beside them in `src/content/scripts.test.ts`, and the fixture age names its neutral in `agesOver` in `src/rules/fixtures.ts`. A script that decides gets one test on the fixture's ground, the real closure played: here, which tile it claims.
- `besideTheNeutral` and `NEUTRAL_TILE` in `src/rules/fixtures.ts` stand the neutral's city beside the player's on plains out to three.
- The village yields one culture a turn and nothing else in the age yields culture to the neutral, so on the real content its first claim lands on turn 2 and the second on turn 6: a spec that wants a claim seen waits that long or plants culture through the rules' helpers.
- For `src/ui/` and `e2e/`: `docs/PHASER.md`, read before any Phaser claim; a spec rests before it presses or measures.

**Plan:**

1. `src/rules/state.ts`, `src/rules/sight.ts`, `src/rules/save.ts`, their tests: the snapshot keeps the city whose border the tile stands inside, retaken when it changes, written and read by the save. Rules tests green.
2. `src/rules/city.ts`, `src/rules/units.ts` if needed, `src/rules/cards.ts` where the claim is read, their tests: the claim door serves both cities, the player's behaviour unchanged, the "unit of another faction" condition for both. Rules tests green.
3. `src/rules/catalogue.ts`, `src/rules/fixtures.ts`, `src/content/stone.ts`, `src/content/scripts.ts` and its test: the neutral's script on the age's neutral, its choice tested on the fixture; the catalogue refuses a neutral naming no script if the type makes it required. Catalogue tests green.
4. `src/rules/chronicle.ts` and its tests: the neutral acts in the enemy phase between the waves and the enemies, claiming through the door as many tiles as it pays for. Rules tests green.
5. `src/rules/cards.ts` and its tests: a card through a worker refused on a tile the neutral holds with `other-faction`, before the card's own reasons; the terraform's own refusal of the neutral's city tile removed as subsumed. Rules tests green.
6. `src/ui/map.ts`: the rings drawn from the face, by holder, in each city's colour, the city tile heavier. `npm run check` green.
7. `e2e/neutral.spec.ts`: one test added, the neutral's tiles ringed; `docs/` pages edited as _Spec_ says; the board line deleted with this file.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The one proof spec: `npx playwright test e2e/neutral.spec.ts`.
- CI proves on the push, listed for the hand-back: `e2e/city-mode.spec.ts`, `e2e/fog.spec.ts`, `e2e/map.spec.ts`, `e2e/worker-instants.spec.ts`, `e2e/trapping.spec.ts`, `e2e/irrigation.spec.ts`, `e2e/farm.spec.ts`, `e2e/resume.spec.ts`, `e2e/camps.spec.ts`, `e2e/sites.spec.ts`, `e2e/archipelago.spec.ts`.
