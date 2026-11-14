# The yield an aimed card would give

**Line:** **The yield an aimed card would give** — while a card is being aimed and the pointer is on a tile its aim admits, where its play would place a building or an improvement, that tile and each tile beside it the building would give to wear a plate reading a plus sign and one glyph to each point of yield given, fainter where one of the building's kind already gives, and gone when the pointer leaves the tile; the rules answer what the play would give, tile by tile, and the neutral's worker asks them the same question; `e2e/aimed-yield.spec.ts` passes. The line came to the board as "A building's reach drawn — a building that gives to the tiles beside it shows which, when its tile is selected and when its card is aimed", and the user rescoped it at intake: every card that places something, on the aim alone, and nothing on a selection.

**Spec:**

`docs/LOOK.md`, _The map_, a new paragraph between **The claim marks** and **The map's order**:

> **The yield an aimed card would give.** While a card is being aimed, the tile the pointer is on wears a plate where the card's aim admits it and its play would place a building or an improvement there, and so does each tile beside it the building placed would give to. The plate is the culture threshold's, the feature disc's dark pill with its pale rim, 16 units tall and centred on the tile's middle. On it stand a plus sign, in the plate's ink and at the size the threshold's number is set at, and after it one glyph to each point of yield the tile would be given, the resource's own glyph 8 units across as the threshold's is, in the order the resource bar reads the resources: 2 units between the sign and the first glyph, 1.5 between two glyphs, and 4 of room at each end. A tile one of the building's kind already gives to wears its plate whole at 45%, the play giving it nothing more. The plates stand with the culture threshold, over the units and a city's bars and over the tile's own yield glyphs, and are never darkened by the fog, being the screen's answer as the selection is.

`docs/LOOK.md`, **The map's order**: "the yield glyphs and the culture threshold;" becomes "the yield glyphs, and over them the culture threshold and the plates of the yield an aimed card would give;".

`docs/CHRONICLE-SCREEN.md`, _The hand and the aim_, a new paragraph after **Every card being aimed is aimed at one kind of thing.**:

> **A card being aimed reads the yield it would give.** While the pointer is on a tile the card's aim admits, and the card's play would place a building or an improvement on it, that tile wears what the thing placed would give it, and each tile beside it wears what the building placed would give it, fainter where one of its kind already gives to that tile; a tile the play would give nothing wears nothing. It is read as the play would leave the tile, whether the player's city can pay for the card or not, on the faces the map draws and under the rule the capstone lays over the yield once it has landed, as the yield overlay reads. It is the pointer's reading as any other: it stands under a pointer that never moved, goes when the pointer leaves the tile, and goes with the aim.

The text table gains one entry, the plate's sign: `+`.

**Doc-impact:** `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The rules answer one question: what a card played at a tile would give, tile by tile. It is read off the tile as the card's own play would leave it: for the building or the improvement newly on the tile, its part of that tile's yield; for a building that gives to the tiles beside it, the part its kind gives each such tile, and whether that tile holds that part already. It is answered for a card the city cannot pay for as for any other, and holds one test on the fixture.
- The neutral's worker asks that question to choose what it builds, and goes on counting its own tile alone: its choices do not move, and `docs/ages/STONE.md`'s sentence on it stays as worded.
- The plates, as the Spec's two paragraphs say, for every card whose play places a building or an improvement: a building card, an improvement's card, the settle card on the settle phase, where every tile it lights reads the city's building.

Out, each the user's call at intake:

- A selection shows nothing new, a built building that gives to the tiles beside it included: what a selected building is worth and which tiles it gives to is re-evaluated with the chrome rung's short info window.
- The upkeep is not on the plate. On the same plate it passes a tile's width, 55 to 60 units of 41.6; on a second plate under it the two cover the tile.
- No region, no rim, no chevron: the plates alone tell which tiles.
- The neutral's worker does not come to count the tiles beside.

Corner cases, decided:

- A terraform, a feature removed, a card played through a unit beside its tile: the play places nothing, so no plate.
- A building built over another: the plate reads what the new building gives, never the difference with the one it replaces.
- A thing that gives a tile nothing shows no plate there, so a building of no yield shows none at all.
- A tile carrying a building of the kind being aimed gets nothing from one beside it, as the rules have it, and wears no plate.
- A tile outside the border wears its plate as any other.
- A tile beside in fog is read as last seen; an uncharted one wears nothing.
- While a card is carried out of the hand nothing shows. A card released over the map with the pointer resting on a tile it lights shows its plates at once.
- A click the rules refuse leaves the card being aimed and the plates standing under the refusal's note.
- The glyphs grow with the amount: five points of one resource would pass a tile's width. Accepted, nothing giving more than 2 a tile.
- In city mode and with the yield overlay on, the plates lie over the tile's own glyphs and hide a row or two of them whole. Accepted as is.

The reconcile:

1. The plate goes through the culture threshold's and the move points' own plate. The readings stay apart: a cost is a number, a yield is counted in glyphs as the overlay counts it.
2. The glyph is the threshold's, 8 units across, through the one helper that draws the map's glyphs.
3. The numbers go through the reading the infopanel's rows make of a tile's yield, part by part, so they read under the capstone's rule as the rows and the overlay do.
4. The unit's path stays on the last tile the pointer was on; the plates go when the pointer leaves. Apart, meant.
5. The plates stand with the culture threshold in the map's order.
6. The faint plate's 45% is a look entry of its own, apart from the 45% a city's bar shows what ending the turn would add at: the two mean opposite things.
7. The neutral's worker trying each of its cards on a tile, and the screen asking what the card being aimed would give, become one question in the rules.

**Traps:**

- A building is built through the worker standing on the tile itself, so a building card lights its workers' own tiles and no other: the Fishery's tile is the coast tile its embarked worker stands on.
- `apply` refuses a play the city cannot pay for, and a card that cannot be paid for is still aimed, lights its tiles and shows its plates: the question cannot be the play command.
- A card declares nothing of what it places: its aim and its effect are closures (`DOGMAS.md`, _Architecture_, "Data owns its behaviour"). The answer is read off what the play leaves, never off a card's id, its kind or the `places` mark on its aim, which the catalogue's validation and `tools/builder.ts` read for their own ends.
- An effect played through a worker spends that worker's action first, and the settle's effect raises the city with its border and its population: the chronicle a trial leaves differs from the one it was tried on by more than the tile.
- The infopanel and the yield overlay hand the yield's reading the faces the map draws, a tile in fog as its snapshot keeps it (`facesIn` in `src/ui/map.ts`; `partOf` in `e2e/fishery.spec.ts` does the same). The plates read those faces too, or a tile terraformed out of sight leaks through its plate.
- A kind of building gives a tile once however many of the kind stand beside it, and never a tile carrying that kind itself (`src/rules/yields.ts`).
- The neutral's worker's choice lives in `src/content/scripts.ts` and is held by the tests beside it. Today it tries a card with the worker moved onto the tile and compares the tile's whole yield before and after, cost and income checks around it; it is content that decides (`DOGMAS.md`, _Testing_).
- The fixture holds a building that gives to the tiles beside it, the Well, and no card that builds it.
- The map never learns which card is being aimed: the hand hands it the tiles to light and what a click on one does. Only a scene imports the content, and every piece under it receives the catalogue (`DOGMAS.md`, _Stack_).
- The unit's path and its attack are read off the pointer once a frame while a unit is being aimed, because Phaser re-checks what the pointer is over only when it moves (`docs/PHASER.md`, "Phaser re-checks what the pointer is over only when the pointer moves"). The plates stand under a pointer that never moved by the same need.
- The plates come and go in numbers with the pointer: pooled, never destroyed to be drawn again (`DOGMAS.md`, _Stack_, "A game object is made once and changed in place").
- `docs/PHASER.md`, to cite and not restate: "A stroked Polygon skips a point…" (why the map's diamond is a turned square), "A Text set to the text it already holds does nothing", "A hidden object is neither drawn nor hit", "A Layer draws its children by depth first and by add order only among equal depths", "Playwright cannot see paint order", "A mouse move to the coordinates the pointer already rests on is no move Phaser sees".
- The glossary keeps "add" for a card going onto a pile and forbids "pointed at" for a card's aim: the pages and the entry say "give" and "the tile the pointer is on".
- Measured on the mockup in the shipped font: the sign is 6 units wide at bold 12, a plate of one glyph 24 units wide and of two 34, on a tile 41.6 wide.
- The look is the mockup's, https://claude.ai/artifact/SFuN3tYyc1vga4EvtFaxYP, at `format=glyphs upkeep=off lies=over over=over plateY=0 shared=faint outside=same`, a card picked under "The card being aimed" and the pointer on its rimmed tile. The page still shows plates on a selected building, which the line dropped.

**Plan:** Two commits, the first changing nothing the player sees.

1. `src/rules/` gains the question and its one test on the fixture, the fixture given what the test needs to build a building that gives beside it; `src/content/scripts.ts` asks it for the neutral's worker, the tests beside it passing unchanged. It leaves standing: the rules answering what a card played at a tile would give, and the neutral building exactly as before.
2. `src/ui/`: the chronicle screen asks the question for the card being aimed on the tile the pointer is on and the map draws the plates, through the standing plate and the standing glyph, with the text table's entry and the look's entry for the faint plate; `e2e/aimed-yield.spec.ts` and the helper in `e2e/` that reads the plates; the two pages' paragraphs and the map's order sentence; the board line and this file deleted. It leaves standing: the line's done-condition.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `npx playwright test e2e/aimed-yield.spec.ts`, the spec the line adds: a building card that gives beside it aimed, the pointer on its tile, the plates on the screen equal to what the rules answer, the faint one among them where a built one of its kind stands by, and none once the pointer has left; an improvement's card; the settle card; a card the city cannot pay for. CI proves on the push, listed for the hand-back: `hand-aim`, `fishery`, `farm`, `tannery`, `monument`, `settle`, `irrigation`, `trapping`, `embark`, `map-order`, `yields`, `city-mode`, `neutral`, `hover`, `pointer-sweep`, `refuse`.
