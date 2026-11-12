# A unit's ring

**Line:** A unit's ring — the unit standing on the selected tile, whoever's it is, and each unit a card aimed at a unit admits wear one ring on the ground under the unit in the selection's white, the tile under a ringed unit wears no rim, and a ringed unit stands over every dim the map lays; `e2e/unit-ring.spec.ts` passes. Doc-impact: `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** The mockup the user picked on, the ring starred and its numbers on dials, is https://claude.ai/artifact/WfYMKquX8xCMk8M9VpypAR; it opens at 13 units, 60% over 3, and the picks below are what stands. The sentences, written by Claude and taken by the user through the picks and the reconcile:

- `docs/LOOK.md`, _The map_, **The selection**: after "the two never stand together on the map." add: "A selected tile a unit stands on in sight wears no rim, and a card aimed at a unit lights no tile: the unit wears its ring."
- `docs/LOOK.md`, _The pieces on the map_, a new paragraph after **A unit**: "**A unit's ring.** The unit standing on the selected tile, and each unit a card aimed at a unit admits, wears a ring on the ground under it in the selection's white, the same for both since the two never stand together: an ellipse about the painting's middle, 15 units to either side and squashed as the map's rows are, a line 1 unit wide at 90% along it on its inner side, and inside the line a band of that white, 80% at the line and fading bell-shaped over 5 units as the selection's rim fades. It lies over the building and under every unit, the city's badge over it, and passes a little over the tile's two lower edges. A unit of any faction wears it, embarked or not, and one whose turn is done wears it undarkened. It is never darkened by the fog, being the screen's answer as the selection is, and a unit wearing it is drawn over every dim the map lays, with its ring. It stays on the ground at the unit's tile while the unit is dragged. A unit a tile in fog keeps as last seen wears none, and neither does a unit on the infopanel."
- `docs/CHRONICLE-SCREEN.md`, _The hand and the aim_, first paragraph: "the map is already there, and lights the tiles its aim admits." becomes "the map is already there, and lights the tiles its aim admits, or rings the units it admits where it aims at a unit."
- `docs/CHRONICLE-SCREEN.md`, _The hand and the aim_, the played-through paragraph: "the map lights those units' tiles beside the tile clicked, and a click on one of them plays the card through it at that tile." becomes "the map rings those units, the tile clicked keeping its rim, and a click on one of them plays the card through it at that tile."
- `docs/CHRONICLE-SCREEN.md`, _The map's presses_, the opening: "Out of city mode a left click on a tile selects it: the map rings it and, when a unit of the player's stands there, lights every tile its move points reach" becomes "Out of city mode a left click on a tile selects it: the map rings it, or rings the unit standing on it in sight in the tile's place, whoever's it is, and, when that unit is the player's, lights every tile its move points reach".
- `docs/CHRONICLE-SCREEN.md`, _City mode_, the opening: "In **city mode** a left click on a tile selects it as anywhere else, and lights no unit:" becomes "In **city mode** a left click on a tile selects it as anywhere else, the tile wearing the selection whoever stands on it, and lights no unit:".
- `docs/CHRONICLE-SCREEN.md`, _The yield overlay_: "and the tiles a card is aimed at." becomes "the tiles a card is aimed at, and a unit wearing its ring."

No player-facing text entry is added or changed.

**Doc-impact:** `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In: the ring as the paragraph above states it; worn by the unit on the selected tile out of city mode, and by each unit admitted while a card that aims at a unit is being aimed or while a card played through a unit beside its tile asks which unit; the rim off the tile under a ringed unit; a ringed unit and its ring drawn over the yield overlay's dim and over city mode's dim and marks.

Out, each its own board line: successive clicks switching between the unit and its tile, and where an inspection starts; the attack's mark, which keeps today's hexagon exactly as it is drawn; a unit that has prepared, which keeps its hexagon; any motion of the ring, Motion's.

Corner cases decided here:

- A card that aims at a tile lights tiles as today, whoever stands on them; only a card that aims at a unit, and the pick among units a card is played through, ring units. In that pick the tile clicked keeps the tile's rim even where a unit stands on it.
- The ring is the same size round an embarked unit, about the painting's middle and not the canoe's, so his canoe passes it on both sides.
- Who wears the ring is read where the reach is read, on the chronicle the map stands on: a unit that comes to stand on the selected tile takes the ring and the rim goes, a unit that leaves it gives the tile its rim back, and while a change plays the map stands as it stood.
- A ringed unit drawn over the yield overlay's dim stands over its city's badge, and one drawn over city mode's dim stands over the worked mark too: accepted by the user.
- With the fog veil off every unit is drawn live and is ringed as any.
- The Declare War warning leaves the unit selected and ringed as it was.

What the reconcile chose:

- The ring and the reach's region share the fade's formula and its painter and nothing else.
- The ring and the selected tile's rim are one strength, the user's call ("every selection has the same strength"): the ring's band and line read the selection's own look entries, the rim's 80% and the line's 90%, and its colour the selection's; no entry of the reach's and no new strength entry.

**Traps:**

- A drag carries the unit's marker container itself (`src/ui/map-grab.ts` sets the position of what `markerOf` hands it), and every motion and `stopMotion` works on that container: a ring inside it would travel with the unit, and the ring stays on the ground.
- The specs read the selection off the `selected` layer's `tile` datum (`ringedTile` and `marked` in `e2e/chronicle-screen.ts`, 23 specs): it names the selected tile whether the rim or the ring is what is drawn.
- The precedent for standing over the yield dim is `liftOverDim` in `src/ui/map.ts`, which moves one layer between two strata; a unit lifted leaves the `units` layer, where its marker's depth keeps it over the fog's units and under the `badges` layer.
- Today's aim rims are made per aim and destroyed with their group (`openAim`, `aimTile`), a standing review advisory against the make-once dogma (`DOGMAS.md` _Stack_): the rings are not made per aim.
- `aimTile` is handed tiles for every aimed card alike, and the scene calls it for the first aim and again for the pick among units (`throughOne` in `src/ui/chronicle-scene.ts`): what tells a unit aim from a tile aim is not in what the map is handed today.
- The band is a canvas texture as the selection's rim is (`selectionRims`, `paintFaded` in `src/ui/map-fade.ts`): a Graphics stroke of 2 units or less has no joins and a Shape carries no tint (`docs/PHASER.md`, _Rendering under WebGL_).
- The painting's middle is the unit's standing point, 8 units under the tile's (`unitStandsAt` in `src/ui/map-marks.ts`); the ellipse is 15 by 15 times the map's squash.
- A unit the fog keeps is drawn from its own pool (`fogUnitPool`) and is never ringed.

**Plan:** `src/ui/map-fade.ts` or `src/ui/map-marks.ts`, `src/ui/map.ts`, `src/ui/chronicle-scene.ts`, `src/ui/hand.ts` where the aim's kind has to reach the map, `e2e/chronicle-screen.ts`, `e2e/unit-ring.spec.ts`, the two pages.

1. The ring as a mark of the map, painted once, reading the selection's entries: standing, nothing wears it yet.
2. The selection: out of city mode the unit on the selected tile wears it and the tile's rim is down; in city mode the rim as today. The ring holds the ground under a drag.
3. The aim: a card aimed at a unit rings the units admitted and lights no tile; the pick among units rings them and keeps the clicked tile's rim.
4. The dims: a ringed unit with its ring over the yield overlay's dim and over city mode's.
5. The spec, then the two pages' sentences as written above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `e2e/unit-ring.spec.ts`, added by this line: a tile with a unit of the player's selected shows the ring on that unit and no rim, an enemy's the same, a bare tile the rim and no ring; a card that aims at a unit shows a ring on each unit the rules admit and no rim; in city mode the selected tile under a unit shows the rim. CI proves on the push, never run locally: `press.spec.ts`, `embark.spec.ts`, `heal.spec.ts`, `settle.spec.ts`, `move.spec.ts`, `path.spec.ts`, `attack.spec.ts`, `archer.spec.ts`, `inspect.spec.ts`, `city-mode.spec.ts`, `fog.spec.ts`, `map.spec.ts`, `neutral.spec.ts`, `worker-instants.spec.ts`.
