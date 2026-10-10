# The neutral at the camps

**Line:** The neutral at the camps — a unit of the neutral's standing on a camp or a site through the enemy phase captures it as a unit of the player's does, the building leaving the map and dealing nothing, the camp's remaining enemies no camp's from then on. Done when: the rules tests hold the neutral's capture of a camp and of a site on the fixture, with no deal and the camp's enemies no camp's; the proof spec sees a camp's mark gone after a turn ended with a unit of the neutral's on it and no deal window raised; `docs/CHRONICLE.md` says so.

**Spec:** `docs/CHRONICLE.md` _Enemies and camps_, _The neutral_ and _Sites_. The camps paragraph already says a camp is captured by a unit of the player's or of the neutral's, and _The neutral_ already says the camp then leaves the map dealing nothing: both stand as written. _Sites_ changes in two sentences:

- "A unit of the player's standing on a site through the enemy phase captures it, as a camp is captured: the site leaves the map, its slot empty, and its rewards are dealt as a camp's are, in the same window, the one chosen added to the discard pile." becomes "A unit of the player's or of the neutral's standing on a site through the enemy phase captures it, as a camp is captured: the site leaves the map, its slot empty; the player's capture deals its rewards as a camp's are dealt, in the same window, the one chosen added to the discard pile, and the neutral's deals nothing."
- "No enemy goes for a site, and a pillage leaves it standing." becomes "No enemy and no unit of the neutral's goes for a site, and a pillage leaves it standing."

No player-facing text: the neutral's capture raises no window and carries no lore.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

In:

- The capture at the end of the enemy phase reads the faction of the unit standing on a camp or a site: the player's captures and deals the rewards as today; the neutral's captures and deals nothing, no deal added, no window, the end of turn not held; an enemy captures nothing. One capture stage per tile either way, carrying the building leaving the slot and, for a camp, its enemies made no camp's; the player's alone carries the deal after it.
- Both regions of the Stone Age, no content change: the Stone wave script already walks to the nearest camp and attacks on the way, and stands where it is with no camp it can reach.

Out, decided here:

- Hostility: nothing of the player's attack on the neutral's unit standing on a camp, the stance line's.
- An enemy standing on the neutral's city's tile, the idea's.
- The neutral's growth where its city tile yields no food, the workers line's and the balance pass's.

Corner cases decided:

- A unit of the neutral's that steps onto a camp during its act captures it at the end of that same enemy phase: the enemies act after it and the camp's roll comes before the captures, so the camp's guards attack it and the roll may enter a guard beside it first. A capture waiting a full round was rejected: the unit would have to remember when it arrived.
- The camp's remaining enemies become no camp's at the capture and raid by their script, as after the player's capture. An enemy the roll enters in the same phase is no camp's with them.
- A unit of the neutral's standing on a camp or a site when the chronicle falls in the enemy phase captures nothing, as the player's does not.
- Two captures in one phase, the player's and the neutral's, resolve in tile order, the player's deal opening its window as today.
- In fog the captured camp stays drawn as last seen until the tile is in sight; nothing tells the player.
- The wave then goes for the next nearest camp by its own walk, and with none stands where it is; the captured tile is claimed like any other by either city once free.
- A save written while a player's capture waits on its take is unchanged; the neutral's capture leaves nothing to save.

Reconcile, the one likeness and what was chosen: the neutral's capture goes through the player's door as it is, the faction standing the parameter, the deal dropped where the neutral stands. A capture of the neutral's own beside the player's was rejected: two doors for one fact. The sites already go through that door and gain nothing of their own.

**Traps:**

- `captures` in `src/rules/chronicle.ts` keeps every tile whose building has rewards in the age and reads `unitAt(...)?.faction !== 'player'` to skip; `Faction` in `src/rules/units.ts` is a closed union, and `DOGMAS.md` _Code_ wants it switched with no default. The enemy arm must capture nothing: the camp's own guard stands on its camp at every opening, so a read of "any unit but the player's" would have every camp capture itself on turn one, and the standing camp tests would say so.
- `captured` there clears the camp's enemies' `camp` inside the `retiled` change, a standing call never raised (the user kept it, 2026-10-09), and appends the deal as a `dealt` change after it. The `capture` group is `{ name: 'capture', tile }` in `src/rules/stages.ts`; the listeners in `src/ui/map.ts`, `overlay.ts`, `hand.ts`, `piles.ts` and `resource-bar.ts` answer the group with nothing and play its changes: the window opens on `dealt`, the tile redraws on `retiled`. A capture group holding `retiled` alone needs no listener change, and a rules helper answers the changes it raised, one change still grouped under the name of why.
- The fixture's `standing('neutral', tile)` and `neutralStanding(tile)` in `src/rules/fixtures.ts` enter the unit under the fixture's guard script by default, and the Stone `NEUTRAL_GUARD` in `src/content/scripts.ts` walks a unit outside the neutral's border back toward its city: a test or a spec that plants a unit of the neutral's on a camp plants one whose script keeps it there, the fixture's or the Stone wave script, and the test's first assertion is that it stands there when the turn ends.
- The neutral's scripts are the Stone slice's (`src/content/stone.ts`), and a Nomadic chronicle holds no neutral and resolves no neutral script: the spec launches on the campaign `e2e/neutral.spec.ts` builds, Settlement learned, as its other tests do.
- `campBeside` in `e2e/camps.spec.ts` builds seed 1's turn 1 with one camp placed beside the city through `campsPlaced` in `src/rules/schedule.ts`, which enters no unit, and a warrior of the player's planted on it through `unitEntered`. The neutral's spec needs the same ground on the Stone campaign with a unit of the neutral's planted instead; the helper moves to `e2e/chronicle-screen.ts` and takes what differs, never a copy (the implementer charter's copied-block rule; two instances parked this version).
- The camp's roll, odds 0.08 seeded, may enter a guard beside the camp during the spec's end turn: the spec asserts the camp's mark gone, the deal window not standing, the chronicle equal to the headless outcome with no deal, and nothing of the units around.
- `e2e/sites.spec.ts` walks the player's site capture and `e2e/camps.spec.ts` the camp's; both are CI's, never run locally.
- For `e2e/`: `docs/PHASER.md`, read before any Phaser claim; a spec rests before it presses or measures, and ends the turn through `stoppedTurn` as the camps spec does.

**Plan:**

1. `src/rules/chronicle.ts`, `src/rules/enemies.test.ts`: the capture reads the faction standing, the player's dealing, the neutral's dealing nothing, an enemy capturing nothing; two tests on the fixture, a unit of the neutral's on a camp and one on a site, each asserting the stages, the empty deals, the building gone, and for the camp its enemies no camp's. Leaves standing: the rules tests green, the player's capture tests unchanged.
2. `e2e/chronicle-screen.ts`, `e2e/camps.spec.ts`, `e2e/neutral.spec.ts`: the camp-beside helper shared and taking the campaign and the unit planted; one test added to the neutral spec as _Traps_ says. Leaves standing: the proof spec green.
3. `docs/CHRONICLE.md` _Sites_ edited as _Spec_ says; the board line deleted with this file.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The one proof spec: `npx playwright test e2e/neutral.spec.ts`.
- CI proves on the push, listed for the hand-back and never run: `e2e/camps.spec.ts`, `e2e/sites.spec.ts`, `e2e/fall.spec.ts`, `e2e/pillage.spec.ts`, `e2e/resume.spec.ts`, `e2e/fog.spec.ts`, `e2e/archipelago.spec.ts`.
