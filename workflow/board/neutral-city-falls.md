# The neutral city falls as the player's does

**Line:** The neutral city falls as the player's does — the neutral's city falls on the conditions the player's falls on, its population reaching zero and its building removed among them, through the one door the captures already pass; the fall leaves its slot empty, nothing dealt, its relations standing and its units of no city acting by their scripts; the simulator's row says how and on which turn the neutral fell. Doc-impact: `docs/CHRONICLE.md`, `docs/SIMULATOR.md`.

**Spec:** `docs/CHRONICLE.md` and `docs/SIMULATOR.md`, with these edits and no other.

_The city_ section of `CHRONICLE.md`, in the first paragraph, the sentence ending "the player's city's last no exception" ends instead "a city's last no exception".

_The neutral_ section of `CHRONICLE.md`, a new paragraph after the one that opens "The enemies destroy the neutral too":

> The neutral's city falls on the player's city's other conditions too: its population reaching zero, and its building removed, whatever removes it. It falls on the spot, as when the player captures it: its building leaves the map, its slot empty, and its population, its stocks and its border go with it, its tiles nobody's from then on; nothing is dealt, its relations with the player stand as they were, and its units of no city keep acting by their scripts.

_The cell, the row, the query_ section of `SIMULATOR.md`, in the sentence listing the row's columns, "the neutral's population, and the units standing" becomes "the neutral's population, how and on which turn the neutral's city fell where it has, and the units standing".

No player-facing sentence: the chronicle screen already plays the neutral's fall, and nothing new is shown.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/SIMULATOR.md`.

**Scope:**

In:

- The neutral's city falls when its population reaches zero, however it gets there; today its upkeep is the only thing that shocks it, and every strike and answer shocks the player's city alone — the rule is written for whatever takes it.
- The neutral's city falls when the tile its building stands on comes out without that building, whatever laid the tile over; nothing today removes it but the two captures, and the rule holds for whatever does.
- One door: the neutral's fall is raised where the tile is laid over, the place that already raises the player's fall by removal, and the two captures stop raising the fall themselves and go through that door as they already pass it; the fall by population takes the building off the tile and so reaches the same door. The `neutral-fallen` change carries its cause, one of `player`, `enemies`, `population`, `removal`: who or what took it. It leaves the chronicle as the player's capture leaves it, less the deal: the slot empty, the neutral row gone, its relations as they were.
- The simulator's row gains one column, `neutral-fell`, after `neutral-population`: `<cause>:<turn>` in the listings' shape, the cause as the change carries it and the turn the chronicle stood on when it fell; blank while the neutral stands and where the cell has none. The sim's header test and `SIMULATOR.md` say so.

Out:

- Any change to what the player's capture or the enemies' capture leave: the slot empty with the rewards dealt for the one, the age's camp held by its taker for the other, as the pages say, and the change order each raises stays as its test expects it.
- The trace printing the cause; the unit entry's "never its last", which already keeps the neutral from taking its own last population; the chronicle screen, which plays the fall as it plays the captures'.
- The save reader's acceptance of a neutral at nothing population: it stays, such a save no longer being written in play.

Corner cases decided here:

- A fall by population inside the income group: the neutral's `population` change lands first, then the building off its tile, then the fall, all inside the group the shock belongs to, as the player's `ended` lands inside its group. Everything the end of turn does after it already reads a chronicle holding no neutral, since the captures leave one.
- A fall by removal where the thing laying the tile over is a capture: the cause is the capture's, `player` or `enemies`, never `removal`; the door is handed the cause by whoever lays the tile.
- With the player's city falling in the same end of turn, the player's falls first and nothing resolves after it, as today.

Reconcile: the neutral's two existing falls and the projected ones become one through the tile door, the cause the parameter; the neutral's last population taken goes through the place the player's already goes through, the faction its parameter; the simulator's `cause` column and the `neutral-fell` column stay apart, the one reading the state and the other the flow.

**Traps:**

- The player's fall by removal is read where a tile is laid over, in `src/rules/cards.ts`, the one door every change to a tile passes; the enemies' capture builds the camp through it, and the player's capture takes the building off through it, so a read of the neutral's city there subsumes the fall each capture raises today, in the same order their tests in `src/rules/enemies.test.ts` expect: the tile change, then `neutral-fallen`, then the rest. That door takes no catalogue and reads the player's building off the city section; the neutral's building is read off the age's content, so the door needs the neutral's building id handed in some way the implementer decides.
- `neutral-fallen` is a plain change today, listed among those carrying nothing but the chronicles; giving it a cause moves it to a shape of its own in `src/rules/stages.ts`, and every exhaustive switch over change names — the chronicle screen's map, hand and piles, the sim — still typechecks, since none reads the plain shape's absence.
- The neutral's change order on a fall by population is read by the upkeep test in `src/rules/city.test.ts`, which expects stock, assigned, population for a neutral that keeps one population; it stands.
- The simulator reads the flow for the killed columns by walking every landed command's stages; the new column reads the same walk. The header regex in `tools/sim.test.ts` lists the columns in order and must gain the new one; the cell line test around it reads nothing of the columns.
- The neutral at nothing population today regrows: its growth threshold is twice its own units standing, nothing with none, so the fixture that proves the fall must hold the neutral with one population and an upkeep its stocks do not cover, and read that no growth follows.

**Plan:**

1. `src/rules/stages.ts`: the `neutral-fallen` change carries its cause; the closed set of causes is declared there or in `src/rules/state.ts`, the implementer's call.
2. `src/rules/cards.ts` and `src/rules/chronicle.ts`: the tile door reads the neutral's city's tile coming out without its building and raises the fall with the cause it is handed; the two captures hand their cause and raise no fall of their own. The capture tests' expected change orders stand unchanged, which is the check that the door is one.
3. `src/rules/city.ts`: the neutral's last population taken takes its building off its tile, through the door, with the cause `population`.
4. `src/rules/city.test.ts`: one test on the fixture: the neutral holding one population, a building whose upkeep its stocks do not cover, ending the turn; the income group holds its population change then the tile change then the fall carrying `population`; the slot is empty, the neutral row gone, the relations as they were, nothing dealt, no growth and no neutral act after; and the player's own row untouched.
5. `tools/sim-body.ts`, `tools/sim.test.ts`: the `neutral-fell` column, read off the flow; the header regex gains it.
6. `docs/CHRONICLE.md`, `docs/SIMULATOR.md`: the Spec's sentences.
7. `workflow/BOARD.md`: the line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof spec: none — nothing reaches the screen that the captures do not already reach.
- CI proves on the push, listed for the hand-back: `e2e/neutral.spec.ts`, `e2e/grievance.spec.ts`, `e2e/flood.spec.ts`, `e2e/population-badge.spec.ts`.
