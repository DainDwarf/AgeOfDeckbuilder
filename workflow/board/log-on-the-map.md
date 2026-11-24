# The log's lines on the map

**Line:** **The log's lines on the map** — a line of the log that reads a tile is lighter under the pointer and rings its tiles on the map, each inside its own tile in a light tone of the colour of the faction the line names there, and a left click on it centres the map on them; a line that reads no tile reacts to nothing; and `e2e/log.spec.ts` passes.

This line rests on **The combat log**, delivered before it: the log, its lines and `e2e/log.spec.ts` are what that delivery left. The sentences below are written against the pages as that delivery leaves them, and a sentence it landed in other words is changed where it stands, its meaning kept.

The mockup the rings were settled on, the real chronicle screen with the log drawn over it: https://claude.ai/artifact/J48mDUP9CbXRx6mkWiSMHi. Rest the pointer on a line of an attack to see the two rings; the page lights no line in a faction's colour once "The line itself lit in the acting faction's colour" is unticked, which is the pick. A press there only marks where the map would centre, a still shot not panning.

**Spec:** the sentences below are added or changed as written.

`docs/CHRONICLE-SCREEN.md` _The log_, last paragraph: "A line reacts to no press and no rest, and the log stops a press as anything standing over the map does." becomes:

> The log stops a press as anything standing over the map does. A line that reads a tile, which is every line but the income's, a strike's and growth's, is lighter under the pointer, as the capstone's row of the ledger is, and while the pointer is on it the map rings its tiles ([`LOOK.md`](LOOK.md)): the tile its change happened on, and for an attack the attacker's tile and the tile of the unit attacked, each in the colour of the faction whose unit the line names there. The tile of a unit the line does not name wears none. The rings mark where it happened, wherever those units stand since. It is the pointer's reading as any other: it stands under a pointer that never moved, passes to the line a scroll or a landing brings under the pointer, and goes when the pointer leaves the line. A left click on such a line centres the map on its tiles: the map pans, its zoom as it stood, until their middle stands in the middle of the map's frame, or as near it as the map's bounds let it come. The click lets go of a card being aimed, as a left click on the ledger's tab does, and leaves the selection standing; it pans the map wherever a drag would. The right click does nothing there, and a line that reads no tile reacts to nothing.

`docs/CHRONICLE-SCREEN.md` _The deal window_, the paragraph on a minimized window: "the log folds and scrolls" becomes "the log folds, scrolls and centres the map on a line's tiles".

`docs/LOOK.md`, a new paragraph after **The attack's marks**:

> **The log's rings.** A tile a line of the log under the pointer reads wears a ring: one line round the tile, inside its edge, in a light tone of the colour of the faction the line names there, stroked over the same line wider in the map's dark outline, as the path's chevrons are, and no band inside it. The whole of it keeps inside its own tile, so two tiles side by side show both colours along the edge they share. Its dark outline and its want of a band tell it from a city's border and from a camp's. It is drawn with the selection's marks, over the buildings and the discs and under the units, and is never darkened by the fog, being the screen's reaction as the selection is.

`docs/LOOK.md` **The map's order**: "and the path with its number and the attack's arrow; the units" becomes "the path with its number and the attack's arrow, and the log's rings; the units", the "and" before "the path" dropped.

`docs/LOOK.md` _The chrome_, **The log**: add as its last sentence "A line that reads a tile is lighter under the pointer."

`docs/LOOK.md` _The chrome_, the paragraph on the inks: "Under the pointer an answer a left click would take, the capstone's panel and the capstone's row of the ledger are lighter, as a pile's round is." becomes "Under the pointer an answer a left click would take, the capstone's panel, the capstone's row of the ledger and a line of the log that reads a tile are lighter, as a pile's round is."

No player-facing sentence is new.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`.

**Scope:**

In: a line of the log lighter under the pointer; the rings on the map; the left click that centres the map; the two pages.

The mockup's measures are the instruction for the look, read where a tile's side stood 40.6 units on the screen: the ring's corners on the lines from the tile's middle to its corners, the coloured line 3 wide over a dark under-line 5.5 wide, the map's dark outline at 0.8, the joins round. The page set the ring's corners at 0.93 of the way to the tile's corners, which let the dark under-line pass the edge by 0.3. The user's instruction overrides it: **the whole stroke, its under-line included, lies inside its own tile**, so the rings of an attacker and of the unit beside it both read along the edge they share; 0.92 of the way puts the under-line's outer side on the edge. The tones on the page: `0xf0b94e` for the player's, `0xe8564a` for the enemies', `0x5b93d6` for the neutral's. The light a line wears under the pointer is the one the capstone's row of the ledger wears.

Out, each decided with the user:

- The line under the pointer lit in a faction's colour: the user did not mean it.
- A ring where the unit stands now: the ring marks where it happened.
- A press on a line that reads no tile, the right click on any line, a key.
- The map zooming for the press: the zoom stands.

Corner cases decided:

- The tile of a unit the line does not name, the fog having hidden it, is never ringed: an attack from the fog rings the tile of the unit attacked alone.
- An attack's two rings are each in the colour of the unit the line names on that tile: two units of one faction never attack each other, so the two differ.
- The left click lets go of a card being aimed and leaves the selection and the inspection standing.
- The press pans the map exactly where a drag would pan it: under a minimized deal window, in city mode and on a turn as on any other; never under a scrim.
- The pan is the hand's own, as a held key's is: it keeps its pace whatever Animation speed reads.
- The rings stand in city mode as on any turn, over its dark and under its faded units.
- A line that leaves the log, five turns on or by a scroll, takes its rings with it as the pointer is on it no more.

The reconcile, each chosen by the user:

1. The ring is not the selected tile's rim in a faction's colour, which would be a camp's border in the enemies' red and a city's in the others': it is a plain line with a dark under-line and no band, in lighter tones. The difference is meant.
2. The press does not go through the pan that brings a played change into view as it is, which moves the shortest way and not at all for tiles already in view: it centres. It keeps that pan's pace. The difference in where it ends is meant.
3. A line under the pointer is lighter through the light the capstone's row of the ledger wears, as it is, and the pointer is a hand there by the rule every pressed thing follows.
4. The rings stand with the selection's marks in the map's order, as they are ordered.

**Traps:**

- `docs/PHASER.md` for everything this does on the UI surface and on the map, and `DOGMAS.md` _Stack_: the rings come and go in numbers and are pooled, hidden and reused; a line's objects are reused as the log scrolls, so what is under the pointer is the line, not the object that drew another line a moment ago.
- A line's tiles and the faction named on each are read off the stage as it lands and kept with the line: the units have moved or been killed by the time the pointer comes. The tile of a unit the line does not name is not kept at all, so nothing can ring it.
- The camera's pan that holds a played stage's tiles answers nothing when it holds them already, and says of itself that a drag or a held key writes the same middle while it runs, the two fighting until the pan ends (`src/ui/map-camera.ts`): the press's pan meets the same, and whether the hand moves the map at all is the camera's own to say.
- The map's frame is the screen less the band the hand stands in (`src/ui/tray-layout.ts`): its middle is not the screen's.
- A colour is named for what it means: the three light tones mean the log's ring of each faction. They are new entries of `src/ui/look.ts`, never the factions' own entries lightened in place, and go in the report.
- The ring tells the factions apart by colour alone, the discs in the line carrying the signs: it is laid out so no shape is asked of it.
- `e2e/log.spec.ts` is the first line's: its tests stand, and this line adds to it.

**Plan:**

1. `src/ui/look.ts` and the map's marks: a ring of a faction can be drawn on a tile, with the selection's marks, worn by nothing yet.
2. The log's module: a line keeps the tiles it reads and the faction named on each; a line that reads a tile is lighter under the pointer, the pointer a hand over it, and the map wears its rings while the pointer is on it.
3. `src/ui/map-camera.ts` and the log's module: a left click on such a line centres the map on its tiles, and lets go of a card being aimed.
4. `e2e/log.spec.ts`, with the readings it needs in `e2e/chronicle-screen.ts`: the pointer on an attack's line stands two rings, on the attacker's tile and on the tile of the unit attacked, each in its faction's tone, and none once the pointer leaves; a left click there brings the middle of the two tiles to the middle of the map's frame, the zoom where it stood, and lets go of a card being aimed; the Income line rings nothing and pans nothing.
5. The two pages, and the board line deleted with this file.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/log.spec.ts`. CI proves on the push: `map`, `map-order`, `press`, `hover`, `held-press`, `pointer-sweep`, `minimize`, `unit-ring`, `move`, `attack`, `city-mode`, `pin`, `hand-aim`.
