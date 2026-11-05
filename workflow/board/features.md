# The features

**Line:** **The features** — every feature the map draws is his resource icon on a dark disc in the row above its tile's middle, and its tile is dressed as the look page says: the herd on a deer's or a cattle's tile, his pond under an oasis, the fertile plain's and the flint hill's paintings tinted; the icon pack in the store with its licence entry; the five placeholder polygons and their colours gone, the infopanel's feature rows reading the bare icon. Doc-impact: `docs/LOOK.md`, `public/assets/LICENSES.md`.

**Spec:** `docs/LOOK.md`, three places, written out here.

_The map_, the Features paragraph, replaced whole:

"**Features** are his resource icons. A feature's tile wears the icon of the thing, 14 units wide on a dark disc with a pale rim, in the row above the tile's middle where the improvements stand beside it: the deer, the cow, his tobacco leaf for a fertile plain, his limestone for flint, his water for an oasis. The disc is what tells a feature from the ground at every zoom; the rest is flavour lying on the land, so the tile itself reads as the feature from across the disc. A deer's or a cattle's tile carries three small copies of its animal, 8 units wide, scattered about the tile's middle by its place on the disc, every other one turned to face the other way, under whatever stands on the tile. An oasis lies on his pond, one of his four picked by the tile's place. A fertile plain's painting is tinted greener and a flint hill's slate: the painting re-painted once at boot in its own shading, a second painting of the face the tile wears. A feature's row on the infopanel's cards reads the same icon, bare."

_Two families_, the Pictures bullet: after "his painted objects", add ", his painted resource icons".

_The packs_, the Baumgart bullet: after "and his painted objects", add ", and his resource icons".

`public/assets/LICENSES.md`, a section after _Hex Rivers, Coasts & Seas_, in the two sections' form:

"## Icons: Strategic Resources & Goods

- **What:** David Baumgart's painted resource icons, 128 px each, in `store/icons-strategic-resources-and-goods/`, his description beside them.
- **From:** David Baumgart, <https://dgbaumgart.itch.io/>, version 1.2.1 as the download names it (his description's last entry is 1.1.1, 85 icons), the files as released.
- **Licence:** his own terms, as his email of 2026-11-02 confirmed them for his packs: a free or commercial game may use them, modified and remixed at will; no training of an image model on them; never repackaged, sold or given away on their own. Credit to "David Baumgart" is asked, a link to <https://dgbaumgart.com> welcome. The files sit in the store, never in this repository."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the three places above; `public/assets/LICENSES.md`, the section above.

**Scope:**

In:

- The pack enters the store: the folder `icons-strategic-resources-and-goods/` in the store submodule, holding `Icons/` with all 85 files as released and `description.txt`, copied from `C:\Users\daind\OneDrive\Documents\Bought Assets\Icons Strategic Resource Goods 1.2.1\`; committed and pushed in the store's repository, the parent's submodule pointer moved with it.
- The icons: `fertile` wears `tobacco.png`, `deer` `deer.png`, `cattle` `cow.png`, `flint` `limestone.png`, `oasis` `water.png`; a feature with no icon is refused, as a feature with no mark is today. Each is an image from the features sheet, 14 units wide on the map, centred where the feature's polygon stood: in the row above the tile's middle, `ROW_RISE` above it, at the slot `rowOf` gives the feature, the improvements beside it unchanged. The feature's image on the map is named `feature-<key>`, as the polygon was, so every spec reading that name reads the icon.
- The disc: a circle of 9 units' radius under the icon, centred with it, filled in the map outline colour at 0.72 and rimmed 1 unit wide in a pale parchment (the mockup's `rgb(236,226,204)`) at 0.55, two entries of the look file. It is drawn by code: a disc is geometry, not a picture.
- The herd: on a `deer` or a `cattle` tile, three more images of the tile's icon, 8 units wide, at the tile's middle `x` plus a hashed offset within 16 units either side, and at the middle `y` plus a hashed offset from 5 units above to 5 below; each copy's offsets hashed from the tile's two numbers salted by the copy's index (the mockup: `hash(q * 7 + i, r * 13 + 3 * i)` for `x`, `hash(r * 11 + 5 * i, q * 3 + i)` for `y`, `hash(q + i, r - i)` parity for the turn), through the one hash the faces are picked by; every copy whose parity hash is odd mirrored horizontally. The herd lies in the features layer under the disc, so a building standing on the tile, and a unit, draw over it: accepted at intake, the disc being what tells the feature.
- The pond: on an `oasis` tile, one of his four `decorPond00`–`03` from the terrain pack's `Decor/`, picked by the tile's place through the faces' hash, drawn at the tile's own scale (his file's pixels times the tile's painted width over 256, the same scale a face is drawn at), centred on the tile's middle, in the features layer under the herd's place and the disc.
- The tints: a `fertile` tile's face wears a tinted painting of its terrain's painting, the hue `#3c9a3a` pressed in by the `overlay` composite at 40%; a `flint` tile's face a tinted painting, `#5c6370` laid by the `color` composite at 65%. Each tinted painting is made once at boot: the painting drawn onto a scratch canvas, the colour filled over it under the composite at that alpha, then the result cut to the painting's own pixels (`destination-in` with the painting), and drawn into the sheet as a frame of its own, named for the painting and the feature. Eight tinted paintings: the four plains and the four highlands. A tile wearing a feature with a tint wears the tinted frame of the painting its place picks, through `asTerrain`; the crossfade a terraform plays fades between frames as it does today.
- The sheet: a third sheet, `features`, 2048 a side, holding the five icons, the four ponds and the eight tinted paintings, through the sheet machinery with a tint step added for the tinted frames; drawn at boot beside the two sheets that stand.
- The infopanel: `featureMark` returns the feature's icon as an image at the row's size, bare, in place of the polygon; the thing cards and the small cards that read a feature go through it as today.
- Gone: `FEATURE_MARKS`, `featureMarkOf`, `featureColourOf`, `LOOK.feature`; the catalogue test "every feature of the catalogue has a name, a mark and a colour on the screen" becomes "a name and an icon".
- The motion: a feature's change on a tile, a terraform taking it, Hunt removing it, the herd event adding one, the wolves taking one, plays through the motion door that fades the row's marks today, the feature's objects fading together: the icon, its disc, its herd, its pond. The door's `make` takes a Polygon today; it widens to the marks the feature is.
- The specs: `feature-<key>` is the icon's image; the disc, the herd's copies and the pond carry names of their own (`feature-disc-<key>`, `herd-<key>-<n>`, `pond-<key>`). `marksIn(page, 'features')` in `e2e/tannery.spec.ts` counts the features layer's marks and expects one fewer after Hunt: it must go on counting one per feature tile, so either the layer counts icons alone or the helper reads `feature-` names; the implementer reads `shownIn` and keeps the count.

Out:

- The fog's wash over the icon, the disc, the herd and the pond: the fog-and-uncharted line's. Today's scrim over the tile stays as it is.
- The far view: demoted to an idea (2026-11-05); the features draw the same at every zoom.
- A unit token's disc: the pieces rung's, which takes the feature's disc door with the colour as its parameter (the reconcile, 2026-11-05).
- The improvements' marks beside the feature: the pieces rung's.
- A tuft, rocks or outcrop under the other features: tried in the mockup and struck.
- The icon's shadow, a parchment disc, the icon on the tile's middle, the small lake under the oasis: tried and struck.
- The glyph rung's one renderer: a feature's icon is a picture, not a glyph; nothing of the resource glyphs changes.

Corner cases decided:

- A feature tile with a building, a camp or a site dealt on it, a tannery built on it: the herd lies under the building's mark, the disc and icon stand in the row above, clear of it.
- A feature tile with improvements: the row holds the feature first and the improvements after, as today; the disc is 18 units wide on an 11-unit pitch, so an improvement's mark beside it overlaps the disc's rim by up to 3.5 units. Accepted at intake; the pieces rung redraws the improvements and reads the row then.
- Both veils off draw every tile: every feature's icon, disc, herd and pond is drawn.
- A tile out of sight is drawn from its snapshot's face: a feature kept in the snapshot is drawn as the map draws any feature, under the scrim.
- The archipelago region deals no oasis and no desert; nothing changes there but the icons.
- The `--off`, `--trace` and other simulator paths read no drawing: untouched.

Reconcile: the pond's and the herd's picks go through the one hash the faces are picked by; the tinted paintings go through the sheet machinery, a tint step added; the feature's fade goes through the motion door, its mark type widened; the infopanel's `featureMark` is reshaped to the icon; the disc stays apart from the unit token's, for the colour that is meant, the pieces rung taking the door; the five colour entries go.

**Traps:**

- `drawSheet` (`src/ui/sheet.ts`) draws a loaded texture's frame straight into the canvas texture and removes the source texture after it: a tinted copy is drawn before the removal, or from the face sheet's frame, and a canvas texture's `context` is where a composite operation is set; `refresh` uploads the canvas once, after every frame is drawn (`docs/PHASER.md`, the mipmap line).
- The boot pins the batch to one texture unit (`src/main.ts`, `docs/PHASER.md`): a tinted face drawn from the features sheet among faces from the face sheet is a batch flush at every change of texture within the ground layer, one per tinted tile; the UI's Texts already flush once each. Measured only if the frame feels it; the `measurements` memory holds the frame's numbers.
- `drawSheet` packs row by row by each frame's own size, so a 128-px icon, a pond and a 256 × 384 painting share a sheet; `SHEET_SIDE` is per sheet since the river line.
- `asPainted` (`src/ui/pool.ts`) resets scale to one: an image sized to 14 or 8 units, or a pond at the tile's scale, sets its scale after the paint takes it, and a pooled image keeps its last flip, so every property is written on every take.
- `paintingOn` (`src/ui/marks.ts`) takes a `TileCoords`; the herd's salted picks hash two numbers through `pickedBy`'s door.
- `compare` in `src/ui/map-motion.ts` types `make` as returning a Polygon and `come` as polygons scaled up in their slots: the feature's objects are several marks, and the scale-up plays on each.
- `TileObjects.feature` (`src/ui/map-marks.ts`) is a Polygon made at the chronicle's open, one per tile; what each tile keeps for its feature changes shape, and `paintedOnTiles` hides every kept object on each render.
- `window.shownIn` (read by `marksIn` in `e2e/chronicle-screen.ts`) counts a layer's marks; `tannery.spec.ts` reads the features layer.
- `readings` in `e2e/chronicle-screen.ts` reads an image's `frame` by name and throws for an object drawing none: the proof spec reads `feature-<key>` and `tile-<key>` frames.
- The uncharted veil is switched off through the console as `e2e/camps.spec.ts` does.
- The store is a submodule (`.gitmodules`, `https://github.com/DainDwarf/AgeOfDeckbuilder-store.git`): the pack is committed and pushed there first, with the user's credentials, then the parent's pointer; CI clones the submodule.
- `docs/PHASER.md` is cited, not restated, for the render facts a spec meets: a spec rests before it reads what a motion changed.

**Plan:**

1. The pack into the store with its licence entry. Leaves standing: the store holding the icons, `LICENSES.md` naming them, nothing drawn.
2. The features sheet: the five icons, the four ponds, the eight tinted paintings through the sheet machinery with its tint step, drawn at boot. Leaves standing: a game that boots with three sheets and draws the polygons still.
3. The icon and the disc in place of the polygon on the map and in the infopanel's rows, named as the polygon was; the polygons, their corners and their colours gone; the catalogue test rewritten; the motion door widened. Leaves standing: the icons on their discs, every spec green.
4. The herd, the pond and the tinted faces. Leaves standing: the line's design.
5. `docs/LOOK.md`'s three edits, the proof spec, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/map.spec.ts`, one test added: with the uncharted veil off through the console, for every tile of the chronicle holding a feature, `feature-<key>` stands and draws the frame of that feature's icon file; a `deer` or `cattle` tile stands three `herd-<key>-<n>`; an `oasis` tile stands a `pond-<key>` drawing one of the four ponds' frames; a `fertile` or `flint` tile's `tile-<key>` draws a frame named for its painting and the feature, and every other tile's face a frame named for its painting alone; run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `landing`, `inspect`, `predators`, `tannery`, `trapping`, `fog`, `settle`, `camps`, `boot`, `failed-boot`, `rivers`, and the rest of the suite.
