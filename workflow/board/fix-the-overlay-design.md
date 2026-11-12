# Fix the overlay design

**Line:** Fix the overlay design — what the map draws stands in one order whatever is switched on, from the ground up the land and its borders, the buildings and discs with a city's badge, city mode's marks and dim, the yield overlay's dim, the marks of the selection and the aim, the units, the yield glyphs, and nothing changes place when a dim comes on; `e2e/map-order.spec.ts` passes. Doc-impact: `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** The order is the user's own, written by them as a list and settled over the mockup https://claude.ai/artifact/UEf3G3p5DXUByA1SDXNBmH, which opens on it ("Your order", all units over the selection layer). From the ground up:

1. The land: the terrain, the rivers, the ditches, what lies on the ground, the claim marks, the borders.
2. The buildings, the features' and the improvements' discs, then a city's badge over them.
3. City mode's marks on the assigned tiles and its dim on the held tiles nobody works.
4. The yield overlay's dim.
5. The marks of the selection and the aim, in this order among themselves: a prepared tile's colour, the reach and the glow on the units a unit can attack, a unit's ring, then the selected tile's rim, an aimed card's rims and the path.
6. The units, every one of them, a unit being dragged over the others.
7. The yield glyphs and the culture threshold.
8. The infopanel, a refusal's note, the tooltip.

The sentences, written by Claude on that order:

- `docs/LOOK.md`, _The map_, a new paragraph after **The claim marks**: "**The map's order.** What the map draws stands in one order, the same whatever is switched on. From the ground up: the land with its rivers, its ditches and what lies on it, the claim marks and the borders; the buildings, the discs and a city's badge; city mode's marks and its dim; the yield overlay's dim; the marks of the selection and the aim, which are a prepared tile's colour, the reach and the glow on what a unit can attack, a unit's ring, the selected tile's rim, an aimed card's rims and the path; the units; the yield glyphs and the culture threshold; and the infopanel, a refusal's note and the tooltip. A dim is a sheet with its own place in that order: it darkens what lies under it and nothing over it, so no dim darkens a mark of the selection or a unit, and nothing changes place when one comes on. A unit being dragged is drawn over the other units."
- `docs/LOOK.md`, **The reach**: "It is drawn over the ground and the border and under the pieces, and is never darkened by the fog, being the screen's answer as the selection is; under the yield overlay the dim spares it." becomes "It is drawn over the buildings and the discs and under the units, and is never darkened by the fog, being the screen's answer as the selection is."
- `docs/LOOK.md`, **The path**: "The path and its number are drawn over everything on the map, the selection and a unit being dragged included, and are never darkened by the fog, being the screen's answer as the selection is; under the yield overlay the dim spares them." becomes "The path and its number are drawn over the selection's other marks and under the units, a unit being dragged among them, and are never darkened by the fog, being the screen's answer as the selection is."
- `docs/LOOK.md`, **A unit's ring**: "It lies over the building and under every unit, the city's badge over it, and passes a little over the tile's two lower edges." becomes "It lies over the building and the city's badge and under every unit, and passes a little over the tile's two lower edges."
- `docs/LOOK.md`, **A unit's ring**: "It is never darkened by the fog, being the screen's answer as the selection is, and a unit wearing it is drawn over every dim the map lays, with its ring." becomes "It is never darkened by the fog, being the screen's answer as the selection is."
- `docs/CHRONICLE-SCREEN.md`, _The pointer and the tile's marks_: "the mark of an assigned tile stands below the middle." becomes "the mark of an assigned tile stands below the middle, under the unit standing there."
- `docs/CHRONICLE-SCREEN.md`, _The pointer and the tile's marks_: "A city's own tile wears a badge at its lower-right corner, over the unit standing there:" becomes "A city's own tile wears a badge at its lower-right corner, under the unit standing there:".
- `docs/CHRONICLE-SCREEN.md`, _City mode_: "In city mode the map marks the assigned tiles and dims the held ones that are not." becomes "In city mode the map marks the assigned tiles and dims the held ones that are not; a unit stands over the mark and over the dim, darkened by neither."
- `docs/CHRONICLE-SCREEN.md`, _The yield overlay_: "The dim spares the ring, the culture threshold the selected tile wears, the reach's region, the path of a unit being aimed, the infopanel of the tile being inspected, the tiles a card is aimed at, and a unit wearing its ring." becomes "The dim darkens the land and what is built on it, city mode's marks among it, and nothing else: the marks of the selection and the aim, every unit, the culture threshold the selected tile wears and the infopanel stand over it."

Sentences that stay as they are and stay true: **The selection** ("drawn over every dim the map lays"), **A camp's border** and **The claim marks** ("under the pieces", "the yield overlay's dim covers it"), the done unit's sentence in _The map's presses_, and _City mode_'s "with no dim over the map: that dim is the overlay's alone".

No player-facing text entry is added or changed.

**Doc-impact:** `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In: the one order above, standing in every state of the chronicle screen; nothing lifted over a dim and nothing put back after one; every unit in one place of the order, the ringed one among the others; the ring a mark of the selection as the tile's rim is; the city badge moved under the units.

Out:

- The yield overlay's look. With the order fixed for the plain draw the overlay shows every unit and every mark of the selection bright over a dimmed land, glyphs over them: taken as it comes by the user, who reworks the overlay with the glyphs. Whether the overlay's dim should lie over the selection's marks is that rework's.
- Any change to what a dim looks like, to the done unit's darkening or to the fog. The look entry `mapDim` keeps its three meanings: no look of any of them is touched here.
- The yield glyphs standing over the path and over the units, the glyphs' rung to settle.
- The attack's mark and the prepared mark moving onto the unit, each its own line on the board.

Corner cases decided here, all the user's calls:

- The reach and the attack glow lie over the buildings and the discs, so a building on a tile an enemy can be attacked on stands under the glow. Taken.
- A prepared tile's colour lies in the selection's layer, over the building of its tile and under the unit: "logically, it should be part of the aim and selection layer", the next lines moving it onto the unit.
- A city's badge lies with the buildings, so the unit standing on the city's tile covers part of it: taken, the badge's own line settling its place.
- City mode's mark on an assigned tile lies under the unit standing there, which covers it, and no unit is dimmed on a held tile nobody works: taken, the user meaning to make units far less visible in city mode at its rework.
- The path stays in the selection's layer, under the units. Claude raised that a unit being dragged would cover the number at the path's end; the user's answer stands: the dragged unit follows the pointer and does not snap to its place on the tile, so the number stays readable.

What the reconcile chose, served numbered and taken with none struck:

- The selected tile's rim and an aimed card's rims already live on a layer over the dim; the reach, the attack glow, the prepared colour and the ring go through that same layer, under the rims and the path. The rims come to lie under the units, which changes nothing seen: a rim fades 5 units in from the tile's edge and a unit stands in the middle.
- A unit being dragged is drawn over the units it passes.
- A unit the fog keeps as last seen goes up with the units and keeps the fog's darkening, which is on the unit itself; a unit whose turn is done keeps its own, the one thing that still darkens a unit.
- The ring, the reach and the attack glow are drawn over the city badge and over city mode's marks and dim.

**Traps:**

- `liftOverDim` in `src/ui/map.ts` is the whole of what moves today, called from the yields' repaint: the `lit` group between the `lit` and `dim` strata, the `ringed` group between the `units` and `dim` strata. `paintRings` also moves each unit's marker between the `ringed` and `units` groups on every repaint. Both moves are what this line takes away.
- A Layer's `add` and `addAt` leave a child it already holds where it stands, and a Layer draws by depth first and by add order only among equal depths (`docs/PHASER.md`, _Scenes and stacking_). A live unit's marker is at depth 1 so that it stands over a unit the fog keeps, which comes from its own pool on the same layer at depth 0.
- A drag carries the unit's marker container itself (`src/ui/map-grab.ts` sets the position of what `markerOf` hands it), and a marker that comes home is slid back by the same file: what puts the dragged unit over the others has to be undone on every way a grab ends.
- An aim's rims are a group made per aim and added to the selection's stratum when the aim opens (`openAim`), so it lands over whatever that stratum already holds, the path's group included. The path and an aim's rims are never shown together.
- The specs' helpers in `e2e/chronicle-screen.ts` find things by group name: `unitMarkOn` reads the `units` and the `ringed` groups, `ringedTile` the `rings` group, `litKeys` the `lit` group, and `marksIn(page, 'units')` counts the `units` group in `archer.spec.ts` and `console.spec.ts`, where a ringed unit is counted from now on. Forty reads across eleven files go through those names.
- The map's strata are declared in order in `src/ui/map-scene.ts` and each is bound to the map's one camera; the dim's rectangle is handed to the map's camera code, which sizes it.
- A prepared tile's colour is a mark kept per unit and stopped and moved with the unit's marker by every motion (`stopMotion` takes both).
- `workflow/LOOK.md` holds three notes that describe today's order: city mode's diamond covering a unit's lower 7 units, the path "drawn over everything on the map", and the glyphs standing a stratum above the path's.

**Plan:** `src/ui/map-scene.ts`, `src/ui/map.ts`, `src/ui/map-grab.ts` where the dragged unit's place is kept, `e2e/chronicle-screen.ts`, `e2e/map-order.spec.ts`, the two pages, `workflow/LOOK.md`.

1. The strata in the settled order, the units over the selection's and under the yields', with nothing moved yet: standing, the lifts still run.
2. The reach, the attack glow, the prepared colour and the ring on the selection's layer under the rims and the path; the badge with the buildings; every unit's marker in the one units group; nothing lifted and nothing put back. Standing: the order holds in every state.
3. A unit being dragged over the other units, and back among them however the grab ends.
4. The helpers reading the groups that remain, then the spec.
5. The two pages' sentences as written above, and the pool's three notes brought to the order.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `e2e/map-order.spec.ts`, added by this line: on one save, with a unit of the player's selected, then with the yield overlay on, then in city mode, then in city mode with the overlay on and a card aimed at units, the map's named groups stand in the settled order and each under the same parent as in the state before; the ringed unit's marker is in the units group in every one of them; and a unit being dragged is drawn over another unit's marker. CI proves on the push, never run locally: `unit-ring.spec.ts`, `path.spec.ts`, `yields.spec.ts`, `city-mode.spec.ts`, `attack.spec.ts`, `archer.spec.ts`, `console.spec.ts`, `move.spec.ts`, `heal.spec.ts`, `hand-aim.spec.ts`, `press.spec.ts`, `embark.spec.ts`, `fog.spec.ts`, `map.spec.ts`, `population-badge.spec.ts`, `pillage.spec.ts`, `camps.spec.ts`, `neutral.spec.ts`, `settle.spec.ts`, `farm.spec.ts`, `fishery.spec.ts`, `tannery.spec.ts`, `inspect.spec.ts`.
