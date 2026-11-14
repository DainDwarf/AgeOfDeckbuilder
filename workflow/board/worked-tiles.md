# City mode's worked and unworked tiles

**Line:** City mode's worked and unworked tiles — in city mode a tile one population is assigned to wears population's glyph on a dark disc over the unit standing there, a held tile nobody is assigned to is darkened in its painting as a tile in fog is, a tile's yield glyphs are pale wherever the tile is not giving its yield at income, every unit is faded and the player's city wears neither its bars nor its badge; `e2e/city-mode.spec.ts` reads all five on the game's content, and `docs/MAP-SCREEN.md` and `docs/LOOK.md` say so.

**Spec:** the pages and the sentences, written out. The numbers are the user's picks, pasted from the mockup https://claude.ai/artifact/FC7BDtVwsEwoZ28jY7TcyU (`way=tint fog=on bars=off worked=low lies=over disc=dark size=10 drop=16 dim=70 pale=50 seat=off units=50`).

`docs/MAP-SCREEN.md`:

- _What a tile wears_, first paragraph, last clause becomes: "the mark of an assigned tile stands below the middle, over the unit standing there."
- _What a tile wears_, second paragraph: "so the player's city wears it always and the neutral's while its tile is in sight" becomes "so the player's city wears it out of city mode and the neutral's while its tile is in sight". Add at the paragraph's end: "City mode takes the player's city's badge and its two bars off the map for as long as it is on; the neutral's city keeps its badge."
- _City mode_, third paragraph, becomes: "The map marks the tiles the player's city can claim for as long as the mode is on, and every tile inside the border shows what it yields — every resource, whatever the yield overlay is showing, the dark of a tile nobody is assigned to no exception, each on the patch the overlay lays under a tile's glyphs. In city mode the map marks the assigned tiles and darkens the held ones that are not, each as the fog darkens a tile; a held tile in fog wears the fog's dark and no more. A tile's yield glyphs stand at their full strength where the tile is giving its yield at income — one population is assigned to it and nobody occupies it — and paler on every other tile the map shows glyphs on, inside the border or outside it. Every unit on the map is faded for as long as the mode is on, whoever's it is, since no press there moves one; the mark of an assigned tile stands over the unit on its tile, and the dark of a held tile darkens no unit."
- _The yield overlay_: after "and a tile in fog is read as it was last seen." add: "How strong a tile's glyphs stand is city mode's alone: out of city mode every glyph stands at its full strength."

`docs/LOOK.md`:

- _The map_, a new paragraph after **The claim marks**: "**City mode's tiles.** In city mode a tile one population is assigned to wears population's glyph, 10 units across, on a disc 14 units across, the feature disc's dark with its pale rim, its middle 16 units below the tile's, so it passes the tile's bottom point by 2 units; the glyph wears no outline, the disc having its rim. It stands over the units, a canoe among them, and is never darkened by the fog, being the screen's answer as the selection is. A held tile nobody is assigned to is darkened as a tile in fog is, by a tint of its own multiplied into its painting, its beach, what lies on its ground, its building and the discs of its row, and that tint darkens by 70% as the fog's does; the border along it, the river's pieces and the unit on it are not darkened. A held tile in fog wears the fog's dark alone. Every unit is drawn at 50% for as long as the mode is on: its painting, its halo, its canoe, its badge and its health bar, a unit a tile in fog keeps among them, and a dimmed unit of the player's wears its dim under the fade. The player's city wears neither its bars nor its badge."
- _The map_, **The yield glyphs**: add before "A tile that shows no glyph wears no patch": "In city mode the glyphs of a tile that is not giving its yield at income are drawn at 50%, the patch under them as it is."
- _The map_, **The map's order**: the list becomes "From the ground up: the land with its rivers, its ditches and what lies on it, the claim marks and the borders; the buildings and the discs; the marks of the selection and the aim, which are the reach, a unit's ring and the attack's, the selected tile's rim, an aimed card's rims, and the path with its number and the attack's arrow; the units, each with its badge and its health bar; a city's bars and its badge; the yield glyphs on their patches, over them the marks of the assigned tiles, and over those the culture threshold and the plates of the yield an aimed card would give; and the infopanel, a refusal's note and the tooltip." The two sentences on city mode's dim become: "City mode's dark is no sheet in that order: it is in the paintings themselves, as the fog's is, so it darkens no mark of the selection and no unit, and nothing changes place when it comes on."
- _The pieces on the map_, **A city's bars and its badge**: add at the end: "City mode takes the player's city's bars and its badge off the map."

No player-facing sentence is added: no text-table entry, no tooltip.

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/LOOK.md`.

**Scope:**

- In: the mark of an assigned tile (disc, glyph, place, order); the dark of a held tile nobody is assigned to, in the paintings; the strength of the yield glyphs in city mode; the units' fade in city mode; the player's city's bars and badge hidden in city mode; the specs that read the hexagon; the look's entries.
- Out: the fog in city mode stays as it is (the user tried it lifted on the mockup: "a false good idea"). No empty seat on a tile nobody is assigned to. No motion: the fade, the dark and the hidden bars come and go with the mode at once, any easing being the Motion rung's. Where the bars' and the badge's readings go in city mode is the chrome rung's; until then city mode shows neither, which the user took knowingly. The mode's frame and chip are untouched.
- The user's rule for the glyphs, in their words: "Those are all tiles that have a yield, but is not currently giving it as an income to the city." It holds in city mode only, since out of it the map shows no assignment; that reading is mine. Outside the border the glyphs are pale whenever the overlay shows them in city mode.
- A tile one population is assigned to that an enemy occupies gives nothing at income, so by that rule its glyphs are pale while it keeps its mark and is not darkened: the mark says somebody is there, the glyphs that nothing comes in. I recommended it and the user took it: "Pale".
- A held tile in fog nobody is assigned to: the fog's dark alone, never both multiplied.
- The neutral's city keeps its badge in city mode.
- A drag in city mode carries the disc with its glyph, as it carries the glyph today.
- The selected tile's rim stays over the dark, as today; a card aimed in city mode keeps its rims and its plates.
- The reconcile, as the user took it: the dark goes through the fog's own way of darkening as it stands, told which dark it is, and leaves the unit, the border and the river alone; the disc is the feature disc's dark and rim as the culture threshold's plate wears them, at 14 across; the units' fade and the dim of a unit with nothing left to do stay apart, a dimmed unit wearing both; the 50% of a tile's glyphs and the 45% of the aimed card's plate on a tile already given to stay apart, each an entry of its own.

**Traps:**

- `docs/PHASER.md`, _Layers, Containers and Groups_ and _Filters and masks_: a Shape carries no tint, so a disc darkened with the images beside it takes a darkened fill and stroke, as the fog's path already does; a Layer takes no filter.
- The mockup faded the units as one sheet: a unit's halo does not show through its painting, nor a canoe through the unit in it. An alpha set piece by piece lets them show through each other. Read `node_modules/phaser/skills/cameras/SKILL.md` (_Force Composite_) and the game-object components page before choosing; a fade that does not look like the page is a deviation, reported with a shot, and its frame cost is measured by a throwaway spec sampling `requestAnimationFrame` deltas with the mode on and off, the numbers in the report.
- The fog's dark is asked of each painter by a flag today, and the look holds one tint for it. `DOGMAS.md` _Code_: a colour is named for what it means, so the dark of a tile nobody is assigned to is an entry of its own though its value is the fog's today, the units' strength in city mode is an entry, and so is the strength of a glyph that is no income; the entry of the hexagon's wash goes with the hexagon.
- A tile's painting passes its hexagon by a unit or two, so a darkened tile shows a dark sliver outside the border's line where the band does not cover it: the page shows it and the user saw it. It is not clipped.
- The border's stretch and the river's pieces read the fog through their own modules; neither reads the new dark.
- The rules hold "nobody occupies it" privately beside the income. The screen asks the rules whether a tile is giving its yield; it never works that out for itself, and the income goes through the same question so the two cannot disagree (`DOGMAS.md`, _One choke point per invariant_).
- The city's bars are repainted on every render and the units' markers are kept per unit: the mode coming on and going repaints both, and a unit entering while the mode is on is faded like the rest.
- `e2e/city-mode.spec.ts` counts the hexagons by name sixteen times over; `e2e/map-order.spec.ts` reads the map's groups in order; `e2e/population-badge.spec.ts` and `e2e/map.spec.ts` read the bars and the badge, out of city mode.

**Plan:**

1. `src/rules/city.ts`: the question whether a tile of a city is giving its yield at income stands exported, the income reading it; the standing income tests hold it, and one test on the fixture is added only where none already plays an occupied assigned tile.
2. `src/ui/look.ts`: the three new entries stand, the hexagon's wash is gone.
3. `src/ui/map-marks.ts`, `src/ui/map.ts`: a held tile nobody is assigned to is darkened in its paintings while the mode is on, the hexagon and its pool gone; the fog wins where both would hold.
4. Same files: the mark is the disc with the glyph, in a group over the yield glyphs and under the culture threshold; the drag still carries it.
5. Same files: the glyphs' strength in city mode; the units' fade; the player's city's bars and badge hidden.
6. `e2e/chronicle-screen.ts`, `e2e/city-mode.spec.ts`: the specs read the dark off the tiles' paintings where they counted hexagons, and read the fade, the hidden bars and the glyphs' strength coming with the mode and going with it, each oracle from the rules. `e2e/map-order.spec.ts` follows the order.
7. `docs/MAP-SCREEN.md`, `docs/LOOK.md` as written above; the board line deleted with this file.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof: `npx playwright test e2e/city-mode.spec.ts`. CI proves on the push: `map-order`, `population-badge`, `map`, `yields`, `fog`, `aimed-yield`, `end-of-turn-reading`, `pillage`, `embark`, `held-press`. After the ship, the `visual-check` skill on city mode over a town with a unit on an assigned tile, a canoe on one, and a unit outside the border.
