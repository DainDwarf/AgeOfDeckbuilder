# The selection ring

**Line:** The selection ring — the selected tile is lit from its edge inward, a bell-shaped rim of the selection's white under a thin line of it, and the border's band fades the same bell-shaped way, 7 units deep; the flat ring is gone. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md`, _The map_. The borders sentence changes from "and a band of that colour inside the line, 60% at the line and gone 10 units in" to "and a band of that colour inside the line, 60% at the line and fading bell-shaped over 7 units, a blur and not a gradient, so it has no inner edge". A new paragraph after the borders:

> **The selection.** The selected tile is lit from its edge inward: a rim of the selection's white, 80% at the edge and fading bell-shaped over 5 units as the border's band fades, under a thin line of that white along the edge, 1 unit wide at 90%. It is drawn over every dim the map lays and is never darkened by the fog, since it is the screen's answer and not the tile's, and nothing drawn on the tile moves for it.

No player-facing text changes. `docs/CHRONICLE-SCREEN.md` and `docs/INTERFACE.md` go on saying the map rings the selected tile; the word stands for the rim and its line together.

**Doc-impact:** `docs/LOOK.md`.

**Scope:**

- In: the rim and its line in place of today's 4-wide white hexagon; the border's band fading bell-shaped at 60%, 7 units deep, in place of the straight fade 10 deep; one way of fading shared by both. The border's line is untouched, 1.5 units in the city's colour.
- The fade, exactly as the mockup drew it and the user picked it: the path is stroked once, twice the depth wide, in the colour at its resting strength, under a blur of half the depth, and only the inside of the path is kept. The rim's path is the tile's hexagon at `TILE_SIZE`; the band's is each holder's loops, clipped as today to the loops and to the tiles of each fog state.
- The rim's colour is the selection's (`LOOK.selected`), shared with the card's ring and the aim line as the chronicle screen page says; its strength and the line's are new look entries, strengths something rests at, as `borderBand` is. The band's depth and the rim's are constants beside their painters, not look entries.
- The line is a stroke of the tile's hexagon, 1 unit wide, inset 0.5, at 90%: the one object today's ring is, reshaped. It stays crisp at every zoom where the rim is a texture.
- The rim is one image made once, hidden while nothing is selected, moved onto the selected tile with the line; it stands on the `selected` layer of the ring stratum as the ring does, so it is spared the yield dim and the city dim and lies under the glyphs and the culture threshold. It is not darkened on a tile in fog.
- Out: the lit tiles and the glows (the reach line and the offensive glow line re-read them, opening on the rim as it stands); the claimable rings and city mode's marks (the claim marks line); a breath of the rim (the motion rung, noted in the pool); any dark edge, none was taken.
- Reconcile: the selection's line and the hexagons the map strokes for claimable and lit tiles stay apart, since those two lines settle their forms after this one; the rim and the lit tiles' fill stay apart for the same reason; the rim's fade and the border's band become one painter, the border's fade folded into this line on the user's word, likeness and fold both of 2026-11-05.
- Corner cases: a selected tile in fog wears the rim at full strength over its darkened painting; under the yield overlay the rim is spared the dim as the ring is today; the rim moves with the selection when a unit's step or attack carries the selection to where the unit stands, as the ring does.

**Traps:**

- The blur is the canvas context's own `filter`, a `blur(<px>)`, applied while the stroke is drawn and put back to `none` after; it is supported by the browsers the game runs in (Chromium, Firefox, Safari 18 and later) and by the Playwright Chromium. Phaser's Graphics has no blur and no clip (`docs/PHASER.md`, _Rendering under WebGL_): both fades live on canvas textures, as the band does today.
- The band's texture is painted at a pixel to the unit; a rim texture at that scale is magnified 3.5 times at the far zoom and blurs. Paint the rim at four pixels to the unit on a 256-square texture, a power of two so Phaser makes its mipmaps (`docs/PHASER.md`), and show it at a quarter scale. Nothing pools the rim image, so nothing resets its scale; the memory trap in `pool.ts`'s `asPainted` applies only if it is ever pooled.
- A canvas texture is the game's, not the scene's, and `createCanvas` answers `null` for a key still in use (`docs/PHASER.md`, _Across a restart_): the band removes its texture at the scene's `SHUTDOWN`, and the rim's follows the same pattern or is painted once for the game and never removed; either way one key, never two.
- A canvas texture's `clear` and `draw` read the whole canvas back; the band clears its own context and uploads once by `refresh` (`docs/PHASER.md`), and the rim is painted once, so it is refreshed once.
- The specs read the ring by the `selected` layer's `tile` data (`ringedTile`, `marked` in `e2e/chronicle-screen.ts`) and never its shape, and the neutral and settle specs read the border's line colours stretch by stretch (`borderColours`), never the band: none of them changes.
- A Graphics joins the segments of a stroke only above a width of 2 (`docs/PHASER.md`): the line is a Polygon's stroke, not a Graphics, and at width 1 either draws alike.

**Plan:**

1. `src/ui/map-border.ts`: the band's fade becomes the one blurred stroke at 60% and 7 deep, the fourteen layered strokes and their recipe gone, the line as it is. The painter that strokes a traced path under a blur and keeps the inside is written to take a path, a colour, a strength and a depth, wherever the implementer puts it. `docs/LOOK.md`'s borders sentence follows. Leaves standing: the border as the user picked it, the neutral and settle specs green.
2. The rim's texture, painted once through that painter on its own canvas texture at four pixels to the unit, and the rim image on the `selected` layer; `src/ui/map.ts`'s `markSelected` moves and shows it with the line. `src/ui/look.ts` gets the two strengths. Leaves standing: the rim on every selected tile, in fog and under the overlay alike.
3. The line: today's `selectionRing` polygon reshaped to 1 wide, inset 0.5, 90%. `docs/LOOK.md` gets the selection paragraph. Leaves standing: the whole line.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/press.spec.ts`, which selects tiles and reads the ring through every kind of press. CI proves on the push: `attack`, `archer`, `city-mode`, `console`, `controls`, `fog`, `hover`, `inspect`, `irrigation`, `long-winter`, `map`, `menu`, `move`, `neutral`, `pin`, `settle`, `trapping`.
