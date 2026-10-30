# The map's tiles retained

**Line:** **The map's tiles retained** — every object the map view draws apart from the live unit markers is made once and changed in place: the ground and the fog of every tile of the disc from the chronicle's open, hidden until charted; a tile's feature, improvements, building and ring shown or hidden as the tile stands; the yield glyphs, lit tiles, prepared hues, city-mode marks, river runs and fog unit marks pooled; the selection ring, the culture threshold and the city badges written in place; a render destroys nothing, and the suite's readers count the shown. Doc-impact: none.

**Spec:** `DOGMAS.md` _Stack_, "A game object is made once and changed in place", is the rule. `docs/CHRONICLE-SCREEN.md` _The map_ states what is drawn and when — a tile in sight live, a tile charted as its snapshot has it under a scrim, an uncharted tile not at all, the marks in their four places, the badge where the tile is drawn live, the ring from the face the map draws, a change playing on the map as it stood and the map drawing what it leaves once it has played — and none of it moves. `docs/PHASER.md` _Scenes and stacking_ holds the mechanisms: a hidden object is neither drawn nor hit, a Text set to the text it holds does nothing, a Polygon's points reset in place, a Layer draws by depth then add order. No player-facing sentence: the player sees the same map.

**Doc-impact:** none — the dogma states the rule and the chronicle screen page states what is drawn, which does not change. `docs/PHASER.md` gains an entry only where the ship reads a Phaser fact the page lacks, cited by file and line in the package.

**Scope:**

In: everything `src/ui/map.ts` paints on a render except the live unit markers. By kind:

- The ground face and the fog scrim: one of each per tile of the disc, made when the map view is created, hidden; a render shows the face of every tile drawn, coloured for the terrain of the face it draws, live or snapshot, and the scrim of every drawn tile out of sight.
- The feature mark, the building mark and the border ring: one of each per tile, made once — at creation or at the tile's first drawing, the implementer's call — reshaped and recoloured for the id and the holder, shown or hidden as the tile stands.
- The improvement marks: a tile holds any number of distinct ones, so these are pooled, each re-read for its id and its slot in the row; whether the pool is per tile or one, the implementer's.
- The fog unit marks, the mark a drawn tile out of sight carries for its snapshot's unit or for the unit standing on it: pooled containers of the two polygons, the hull shown while the unit is embarked. Unnamed, as today.
- The yield glyphs, the lit tiles and the attack targets, the prepared hues, city mode's assigned marks, dims and claimable rings, the river runs: pooled. A pooled object is re-read whole at reuse — shape, colour, name, position — since the suite counts glyphs by `yield-<resource>` and city-mode marks by their names.
- The rivers: one stroke surface per run from a pool, named `river`, each cleared and restroked when the drawn set changes; the outlines surface one object made once, cleared and restroked with them.
- The selection ring: one polygon made once, moved and shown or hidden; its layer carries the `tile` data as today.
- The culture threshold: one container made once, its text set, its glyph recoloured, repositioned, shown or hidden, raised again at the zoom as today.
- The city badges: one per city faction, made once; the text set, the pill redrawn where its width changes, shown where the tile is drawn live.
- The readers in `e2e/`: `standing`, `counted` and `marksIn`, and the direct list reads in `console.spec.ts` (the fog marks), `neutral.spec.ts` (the rings by colour) and `chronicle-screen.ts` (`marked`'s lit count, `litTiles`), answer the shown: an object hidden, or under a hidden parent, is neither standing nor counted. `shows` keeps reading the object's own flag — what a mode raises stands hidden while the mode is off, and that reading is still asked. A spec that goes red because it asserted something standing under a hidden parent is reported in the hand-back, never patched.

Out: the live unit markers, their hues' shrink with them and their motions — the next line's. The aim's catcher and glow layer, made when an aim opens and destroyed when it closes — a thing with an identity, few, under the dogma. The yield dim, the rim and the catchers, already made once. The hand, the faces and the piles, the later lines'.

Corner cases decided here:

- A retained or pooled object reused after a motion comes back with its scale, alpha, position and visibility written and its tweens stopped. A render writes the end state over whatever a motion left, an interrupted one included, since today's `wipe` stopped the tweens before destroying and nothing stops them otherwise.
- The terrain crossfade keeps its 400 ms: the tile's own face holds the old terrain while a pooled crossfade face in the new terrain fades in over it; at the settle the face takes the new terrain and the crossfade face hides. Standing over a sibling in one Layer is a depth or a move to the top, never add order.
- A mark that shrinks away hides at the settle and resets at its next use; one that slides to a new slot is the tile's own object and the settle writes its final position; a tile newly drawn fades its shown objects in from alpha 0 as today.
- A veil switched is a render: shows and hides, destroys nothing.
- The scene's restart destroys everything with the scene, as today; nothing is kept across chronicles.
- Hit-testing is unchanged: `tileUnder` reads the drawn set, not objects.
- Nothing in the tree pools; the parts of the screen that stand hidden while off do so through Phaser's own visibility, and so does this line, Phaser's Group where the implementer wants its pool.

**Traps:**

- `docs/PHASER.md` _Scenes and stacking_: a Layer's `removeAll(true)` destroys nothing; a hidden object is neither drawn nor hit, and a Group pools by that; a Text set to the text it holds does nothing while a change recreates its texture; a Layer draws by depth first and add order among equal depths, so a retained object that must stand over a sibling gets a depth or is moved to the top.
- `docs/PHASER.md` _Rendering under WebGL_: `killTweensOf` destroys a tween silently and a promise waiting on it waits for ever; `stopMotion` in `src/ui/card-motion.ts` stops, which resolves.
- The `between` motion finds the marks it moves by name in the layer's list and leaves the final paint to the render that `settle` calls; retained, that render must write every object's end state, the crossfade face and the shrunken marks among them.
- `src/ui/infopanel.ts` builds its marks through the same factories the map uses; the factories stay for it, and a re-read of a retained mark goes through the tables in `src/ui/marks.ts`, never a second table of shapes or colours.
- `paintAtZoom` re-raises the threshold and the badges at the map's zoom on every zoom and resize; written in place, that is a resolution set on the texts.
- A snapshot answers for its tile whole: one taken of an empty tile hides the unit that has walked onto it since (the standing comment in `paintTile`).
- The reader's walk in `readNames` recurses through every Layer's and Container's `list`; a Layer's or a Container's own `visible` hides its children, so the shown test walks the parents, through `parentContainer` and `displayList`.
- A hook flags a comment block longer than three lines touched under `src/` or `e2e/`; advisory.
- CI's browse flake comes back when the screen's frame cost rises (`workflow/LOOK.md`); this line lowers a render's cost and should move nothing, read off the run.

**Plan:**

1. `e2e/chronicle-screen.ts`: the readers answer the shown; `e2e/console.spec.ts` and `e2e/neutral.spec.ts` read their lists through the same test. Leaves the suite reading the shown on today's map, which hides nothing it counts.
2. `src/ui/map.ts`: the ground faces and the fog scrims of the disc made at creation, hidden; the render shows, hides and colours them. Leaves the fog spec green on retained ground.
3. `src/ui/map.ts`: features, buildings and rings per tile, the improvement pool, the fog unit marks pool; the `between` motion on the retained marks with the pooled crossfade face. Leaves every tile layer retained.
4. `src/ui/map.ts`: the pools for glyphs, lit tiles and targets, hues, city-mode marks and river runs; the rivers' outline surface made once. Leaves the overlays retained.
5. `src/ui/map.ts`: the selection ring, the threshold and the badges written in place. Leaves the render destroying nothing but what the next line retains, `wipe` gone from every path but the markers'.

One commit, the line's.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/fog.spec.ts` — it walks a tile drawn live, in fog and not at all, the overlay widening with the veils, and the counts of terrain and fog. CI proves on the push every spec that opens a chronicle, the most direct among them `map`, `console`, `city-mode`, `camps`, `yields`, `rivers`, `population-badge`, `neutral`, `inspect`, `archer`, `flood`, `farm`, `fishery`, `embark`, `pointer-sweep`, `hover`, `broken-motion`, `attack`, `move`, `settle`.
