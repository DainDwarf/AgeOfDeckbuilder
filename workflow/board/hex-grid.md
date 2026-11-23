# A hex grid on the map, as a test

**Line:** **A hex grid on the map, as a test** — the Hex grid button stands left of the Faction signs button and shows or hides a line along every edge of every tile of the map, under the rivers and the borders, every chronicle screen opening with it hidden; `e2e/hex-grid.spec.ts` proves it, and keeping it or taking it out is the user's word after play.

**Spec:**

`docs/MAP-SCREEN.md`, a new section after _The Faction signs button_:

> ## The Hex grid button ✅
>
> The **Hex grid** button shows or hides the hex grid, a line along every edge of every tile of the map ([`LOOK.md`](LOOK.md)). It stands left of the Faction signs button, level with it and as far from it as that one stands from the Icons button, drawn as the Faction signs button is, a square wearing its sign, three outlined hexagons, and no word, and sunk in a well while the hex grid is shown. A press on it switches the hex grid at once, and no key does. It is a display and not a mode, as the Faction signs button's is: the back key leaves it standing, city mode and the settle phase stand with it, and every chronicle screen opens with the hex grid hidden. It changes what the map draws and nothing that reads the map: the yield overlay, the infopanel's readings, the selection and an aim read on as they did, and a tile on the infopanel or in a card's window wears none. The pointer resting on it raises a tooltip under it reading `Hex grid`.

`docs/LOOK.md`:

- The glyph table, a row after the Faction signs button's: `| The Hex grid button | three outlined hexagons | Material Design Icons, `hexagon-multiple-outline` |`.
- A new paragraph after **The fog and the uncharted**:

  > **The hex grid.** While the **Hex grid** button has it shown ([`MAP-SCREEN.md`](MAP-SCREEN.md)), every edge of every tile of the map wears a line, the edges of the uncharted tiles and the rim of the disc among them; hidden, which is how every chronicle screen opens, none does. The line runs on the edge itself, straight from corner to corner, in the selection's white over the same line wider in the map's dark outline, both fainter than the selection's own marks, and the lines that meet at a corner close on it, with no gap and nothing stronger there than along an edge. It is the same line on every edge, whatever the two tiles are and whoever holds them. It is drawn over the ground, the art risen above a tile's hexagon included, and under the rivers, the ditches, what lies on the land, the claim marks and the borders, so a river covers it along the edges it runs. An edge with a tile in sight on either side wears the white at its full light; an edge whose tiles are in fog or uncharted wears it darkened by the fog's one tint. City mode's dark leaves it as it is.

- **The map's order**, the first clause of the order: "the land with its rivers, its ditches and what lies on it, the claim marks and the borders;" becomes "the land, the hex grid, the rivers, the ditches and what lies on the land, the claim marks and the borders;".
- _The chrome_, **A button**: "its bright silver for the Menu button, the Icons button and the Faction signs button" becomes "its bright silver for the Menu button, the Icons button, the Faction signs button and the Hex grid button"; "End turn, the Menu button, the Icons button and the Faction signs button are squares" becomes "End turn, the Menu button, the Icons button, the Faction signs button and the Hex grid button are squares".
- _The chrome_, **A well**: "the latched Icons button and the latched Faction signs button sit in one" becomes "the latched Icons button, the latched Faction signs button and the latched Hex grid button sit in one".

`docs/INTERFACE.md`:

- _The window_: "the Menu button, the Icons button and the Faction signs button to its top right corner" becomes "the Menu button, the Icons button, the Faction signs button and the Hex grid button to its top right corner".
- _What stands over what_: "the pinned achievements, the Icons button and the Faction signs button over that" becomes "the pinned achievements, the Icons button, the Faction signs button and the Hex grid button over that".
- _The presses_ is the spec for a press on the button while a card is aimed, unchanged: the press lets the aimed thing go and lands, as it does on the two buttons beside it.

Player-facing text: one text-table entry, the tooltip, reading `Hex grid`.

`public/assets/LICENSES.md`, _Material Design Icons_: "twenty glyphs" becomes "twenty-one glyphs"; "`star-four-points` by Michael Irigoyen" becomes "`star-four-points` and `hexagon-multiple-outline` by Michael Irigoyen"; "none of the twenty" becomes "none of the twenty-one"; and the list of readings gains ", and `hexagon-multiple-outline`, read on 2026-11-23 in the set's `meta.json` (in Nature)".

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/LOOK.md`, `docs/INTERFACE.md`.

**Scope:**

In:

- The button, a third of the kind the Icons button and the Faction signs button are: same face, same size, same well and pale sign while the hex grid is shown, same tooltip under it, left of the Faction signs button with the gap the others keep. Its sign is Material Design Icons' `hexagon-multiple-outline`.
- The hex grid, in the map's units so it thins and thickens with the zoom as every mark does: the selection's white 1.5 wide at strength 0.7, over the map's dark outline 3 wide at strength 0.7. The white is the one that wears the fog's tint; the dark reads the same either way.
- Hidden as every chronicle screen opens, a chronicle opened by Continue among them. Nothing is kept in the browser.

Out: a key (the jot in `workflow/IDEAS.md` holds it); a faction's colour on the tiles a city holds, a strength of their own for them, marks at the corners, a soft shade in place of the line, a gap where a river runs, all tried on the mockup and turned down; a place for the toggles on a minimap, which is its own line.

Corner cases, decided:

- An edge of the disc's rim, with one tile alone along it, is drawn, by that tile's light.
- An edge between a tile in sight and a tile in fog or uncharted is drawn at full light.
- "In sight", "in fog" and "uncharted" are what the map draws the tile as, so the debug console's veils move the hex grid's light with the tiles'.
- A tile's light changing changes its edges at once, with no fade.
- The hex grid shown changes nothing of the yield overlay, city mode, the selection, the reach, the path or an aim, each drawn over it as the map's order has it.
- The settle phase wears it by the same rule as any turn.
- The terrain shown on the infopanel, on a card or in a card's window wears none: the map alone does.

Reconcile:

- The button goes through the door the Icons button and the Faction signs button go through, as it is.
- The line stays apart from the stroke of the path's chevrons, on the user's word: the two have the same two widths today and mean different things, so each keeps its own measures and neither is drawn through the other.
- The darkening is the fog's one tint, the one a border's line and a river's piece in fog already wear, with nothing new.

**Traps:**

- `docs/PHASER.md`: a Graphics joins the segments of a stroke only above a width of 2, and at 2 or under each segment is a quad of its own with no cap. Three edges meet at every corner, and at strength 0.7 two strokes that overlap read stronger than one, so edges stroked one by one leave notches and brighter knots at the corners. The mockup stroked each tone once, round at its ends. `src/ui/map-path.ts` paints its round-ended strokes on a canvas for this reason; `src/ui/map-border.ts` paints its bands on a canvas at a pixel to the unit, which is soft enough for a band and too soft for a line 1.5 wide at the nearest zoom.
- The zoom runs from 0.75 to 3.5 (`src/ui/map-camera.ts`). At a 1920 by 1080 window a unit is 1 pixel as the map opens, so the white line is about 1.1 pixels at the farthest zoom and over 5 at the nearest. How the renderer draws it at the farthest zoom was not seen at intake: the mockup drew it smoothed.
- The mockup's map held 469 tiles and 1482 edges, most of them uncharted. The border is drawn again only where what it is drawn from changed; the hex grid drawn again on every render of the map would be paid on every frame of a motion.
- The hex grid stands over the whole of the land, the art a row's paintings raise over the row behind included: it is a group of its own between the land's and the rivers', never something drawn row by row with the terrain.
- `e2e/map-order.spec.ts` holds the map's groups as one ordered list and fails on a group it does not name.
- `e2e/window.spec.ts` names the corner's buttons, and `src/ui/corner-layout.ts` with its test holds three places.
- The button's signs are a closed set in `src/ui/cast.ts`, switched on in `src/ui/glyphs.ts` at two places.
- The `@mdi/svg` package is not installed. The glyph's file is the package's `svg/hexagon-multiple-outline.svg` at version 7.4.47, changed as the others in `public/assets/material-design-icons/` are: its path filled white, a comment in the file saying so. Its record in the set's `meta.json`: by Michael Irigoyen, tagged Nature.
- `docs/GLOSSARY.md` forbids "grid" for the map and "hex" for a tile. `Hex grid` is the button's name and "the hex grid" the name of the lines it shows, confirmed by the user on 2026-11-22; neither word stands for the map or a tile anywhere in the pages or the text table.
- City mode's dark and the fog's are in the paintings themselves (`docs/LOOK.md`, **The map's order**): the hex grid takes the fog's tint by its own reading of its tiles and takes nothing from city mode.

**Plan:**

1. `public/assets/material-design-icons/hexagon-multiple-outline.svg`, `public/assets/LICENSES.md`, `src/ui/cast.ts`, `src/ui/glyphs.ts`: the sign stands in the cast and is recorded.
2. `src/ui/corner-layout.ts` and `src/ui/corner-layout.test.ts`: the corner holds a fourth place, left of the Faction signs button's.
3. `src/ui/look.ts`, `src/ui/map.ts` and a file of the map's own for the lines if the implementer wants one: the map holds the hex grid in a group between the land's and the rivers', hidden, drawn by the rule above, and shows or hides it on demand.
4. `src/ui/text.ts`, `src/ui/chronicle-scene.ts`: the button stands on the chronicle screen, switches the hex grid and sinks while it is shown.
5. `e2e/hex-grid.spec.ts`, new, and `e2e/map-order.spec.ts`, `e2e/window.spec.ts`: the proof and the two lists that name what the line adds.
6. `docs/MAP-SCREEN.md`, `docs/LOOK.md`, `docs/INTERFACE.md`: the sentences above; the board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/hex-grid.spec.ts`. A chronicle screen opens with the hex grid hidden and the button standing left of the Faction signs button, level with it, naming itself on the rest under it; a press sinks it and shows the hex grid, standing between the land and the rivers and wearing the fog's tint on an edge no tile in sight touches and the full white on one a tile in sight does; a second press hides it and stands the button again; a press while a card is aimed lets the card go; and opened again by Continue with it shown, the chronicle screen shows none.
- In the implementer's Verification section: the hex grid shot on a map with fog and uncharted tiles at the farthest zoom, as the map opens and at the nearest, each looked at for a corner that gaps or reads stronger than its edges.
- CI proves on the push: `e2e/map-order.spec.ts`, `e2e/window.spec.ts`, `e2e/buttons.spec.ts`, `e2e/icons.spec.ts`, `e2e/faction-signs.spec.ts`.
