# A disc for the sites

**Line:** **A disc for the sites** — a disc, or a pointer, similar to the feature discs, but for the sites. Done when every site the map draws wears its pointer with the site's sign on it, in sight and darkened in fog, a camp wears none, the Icons button hides it with the discs, and a captured site loses it; `e2e/site-pointer.spec.ts` proves it.

**Spec:** the user picked the whole of it on the mockup, https://claude.ai/artifact/8hFgUWT6kf8GWE5LuPUx9d, which is the reference for the shape (its `discPath`) and for every number below. The sentences to land, written out:

- `docs/LOOK.md`, _Two families_: the Symbols bullet opens "**Symbols** are signs of quantities, states, factions and sites: a resource, population, influence, a unit's stat, a unit's state, a faction, a site."
- `docs/LOOK.md`, _The cast_: one row at the table's end, ``| A site | a star of four points | Material Design Icons, `star-four-points` |``.
- `docs/LOOK.md`, _The map_, **The fog and the uncharted**: the list of what the fog darkens reads "… the feature's icon and what it lays on the ground, the building, a site's pointer, the unit its snapshot keeps and the stretch of border it wore."
- `docs/LOOK.md`, **City mode's tiles**: "… by a tint of its own multiplied into its painting, its beach, what lies on its ground, its building, the discs of its row and the pointer of a site standing on it, …".
- `docs/LOOK.md`, **The map's order**: "the buildings and the discs;" becomes "the buildings, the discs and over them the sites' pointers;".
- `docs/LOOK.md`, _The pieces on the map_, **A site and a camp**: its last sentence becomes "A site wears its pointer, and a camp's tile the enemies' border; the infopanel leaves both out."
- `docs/LOOK.md`, a new paragraph after **A site and a camp**: "**A site's pointer.** Every site wears a pointer, the same for all of them, so a site is told from across the map and its painting says which it is. It is the feature's disc, its dark with its pale rim, 18 units across, drawn out under itself into a point: the rim leaves the disc 35.5 degrees either side of its lowest point and runs straight to a tip 5 units under the disc, the corners it turns rounded. Its middle stands 34 units above the tile's, above the row, so it stands on the two tiles behind its own, its tip ends 20 units above the tile's middle, just inside the tile's top corner, and the site's painting shows whole under it. On it stands the site's sign, 13 units across, in a pale of its own and with no outline, the pointer having its rim. It is drawn with the discs and over them, over the buildings and under the marks of the selection and the units, and it passes onto whatever lies behind its tile: a disc of the row there, or his void where the tile behind is uncharted or the map ends. It is darkened with its tile, by the fog as last seen and by city mode's dark, and the Icons button hides it with the discs ([`MAP-SCREEN.md`](MAP-SCREEN.md)). It leaves the map with its site. A camp wears none, its border telling it."
- `docs/MAP-SCREEN.md`, _What a tile wears_: the first paragraph ends with one sentence more, "A site's tile wears one more, the site's pointer, above the row."
- `docs/MAP-SCREEN.md`, _The Icons button_: its first sentence ends "…, the features' and the improvements', with what they wear, and the sites' pointers with them."; the second reads "Hidden, a feature and an improvement are told by what lies on the land alone, a site by its painting, and an improvement under a building that fills its tile by nothing on the map."; and "a tile in fog loses its discs with the rest" becomes "a tile in fog loses its discs and its pointer with the rest".
- `public/assets/LICENSES.md`, _Material Design Icons_: **What** counts "nineteen glyphs" and its list ends "…; `axe-battle` by Colton Wiscombe; `star-four-points` by Michael Irigoyen."; **Licence** reads "none of the nineteen is in that category, each glyph's page read on 2026-11-14 but `crown`, `scale-balance`, `axe-battle` and `star-four-points`, read on 2026-11-15 in the set's `meta.json` (`crown` in no category, `scale-balance` in Science, `axe-battle` in Gaming / RPG, `star-four-points` in Shape)."
- The glyph's file, `public/assets/material-design-icons/star-four-points.svg`, in the form its neighbours have: `<svg xmlns="http://www.w3.org/2000/svg" id="mdi-star-four-points" viewBox="0 0 24 24"><!-- Material Design Icons 7.4.47, Apache 2.0. Changed: the path is filled white. --><path fill="#fff" d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" /></svg>`, the path as `@mdi/svg` 7.4.47 ships it.

No player-facing text: the pointer raises no tooltip and names nothing.

**Doc-impact:** `docs/LOOK.md`, `docs/MAP-SCREEN.md`.

**Scope:** in: the pointer on every site the map draws, in both ages, the sites being shared; the site's sign as a symbol of the cast with its ink; the glyph's file and its licence record; the two pages; the spec.

The numbers, all picked on the page: the disc 18 units across with the feature disc's fill and rim; the outline leaving the circle 0.62 radians either side of its lowest point and running straight to a tip 5 units under the circle, 14 under the pointer's middle; the rim 1 unit wide along that whole outline, its joins round; the middle 34 units above the tile's middle and centred across on it; the sign 13 units across, bare; the sign's ink `0xece2cc` at full strength.

Out: the infopanel, where a site's row wears neither pointer nor sign; a camp and the neutral's city; the faction signs, a site still wearing none; any tooltip; anything on a meta screen.

Corner cases, decided here:

- The pointer takes no press: a press on it lands on the map as if it were not there, on whichever tile lies under the pointer's place, as every mark of the map lets a press through.
- A site's tile carrying a feature or improvements keeps its row as it is, and the pointer stands above it at the same place as on a bare tile.
- Where a tile behind carries two discs the pointer overlaps the nearer by about 4 units and is drawn over it. On the disc's top row, and behind an uncharted tile, it stands over his void. All three are accepted as they fall.
- It is read off the face the map draws, so a tile in fog keeps the pointer of the site it last showed, a site captured or removed out of sight included, until the tile is seen again; a site on a tile the map does not draw wears none; each veil taken off shows it with its tile.
- City mode: a held tile nobody is assigned to darkens its site's pointer as it darkens the discs of its row, though the pointer stands on the tiles behind; the mode changes nothing else of it.
- It goes with its site in whatever motion takes the site's building off the map, and comes with its tile in the fade a newly drawn tile comes in.
- The yield glyphs and their patches, the marks of the selection, the units and what they wear all stand over it, by the map's order.

The reconcile, each chosen by the user:

1. The pointer's fill and rim go through the feature disc's look as it is: one look, no entry of the pointer's own, the point its only difference. A later change to the feature disc's look moves both.
2. The star goes through the cast's renderer as it is, bare as every glyph on a rimmed disc is, a new symbol of the cast, at 13 units so it stands at the share of its disc the others stand at (the user: "Let it match the others").
3. Its ink is an entry of its own in the look, valued at the rim's cream the page drew, never merged with a badge's white or the plate's ink.
4. The Icons button hides it as it hides the discs, through the same switch.
5. The fog and city mode's dark darken it through the tint its tile's discs take.
6. It reads which tiles show a site the way the faction sign reads which show a camp, off the face drawn, and stays apart from the sign in place and layer: with the discs, under the units, always on.
7. Passing onto the tiles behind is accepted, as the heart, the city's badge and the faction sign pass theirs.

**Traps:**

- `docs/PHASER.md`, _Shapes and Graphics_, whole: a dark shape with a 1-unit pale rim that the fog must darken meets each of its entries (no tint on a Shape, the stroked Polygon's skipped point, a Graphics joining strokes only above a width of 2). _Layers, Containers and Groups_ for what stands over what inside a stratum.
- A tile's dark is one answer per tile in `src/ui/map.ts`, the fog or city mode's, and what the tile's paint hands back is what a newly drawn tile's fade and a change's motion carry (`src/ui/map-motion.ts`): a mark painted outside it stands at full strength while its tile fades, and is not darkened.
- A tile in fog is painted from the face its snapshot keeps, not from the chronicle's tile; the camp's sign in `src/ui/map.ts` shows the reading.
- The Icons switch hides layers and never marks, since every render and every motion writes the marks' own visibility.
- `e2e/map-order.spec.ts` reads the map's named groups in the order drawn: a group added to the map shows there, and `docs/LOOK.md`'s order above is what it then reads.
- The sites of an age are its content's, each a building of an id of its own, the Stone Age's differing from the Nomadic's; the map receives the catalogue and never imports it (`DOGMAS.md` _Stack_).
- The glyph sheet rasterises every cast file at boot; a symbol with no file, or a file with no symbol, fails there.
- `DOGMAS.md` _Stack_: a game object is made once and changed in place, pooled where it comes and goes. _Testing_: a spec opens on the save it wrote, reads what stands together in one question, and a reading it cannot make is a helper in `e2e/`, never an object shaped for it.

**Plan:**

1. `public/assets/material-design-icons/star-four-points.svg` and `public/assets/LICENSES.md`: the glyph stands in the repository with its record.
2. `src/ui/look.ts`, `src/ui/marks.ts`, `src/ui/glyphs.ts`: the cast holds the site's sign in its own ink, drawn nowhere yet.
3. `src/ui/map-marks.ts`, `src/ui/map.ts`: every site the map draws wears its pointer, darkened with its tile, over the discs, hidden by the Icons switch, gone with its site.
4. `e2e/site-pointer.spec.ts`, with its reading in `e2e/chronicle-screen.ts`, and `e2e/map-order.spec.ts` where the map's groups moved: the done-condition proven on a save holding a site in sight, a site kept in fog and a camp.
5. `docs/LOOK.md` and `docs/MAP-SCREEN.md`: the sentences above.

**Verify:** `npm run check`, `npm run lint`, `npm test`, then `npx playwright test e2e/site-pointer.spec.ts`, the proof. CI's on the push, for the hand-back: `e2e/icons.spec.ts`, `e2e/sites.spec.ts`, `e2e/map-order.spec.ts`, `e2e/fog.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/camps.spec.ts`.
