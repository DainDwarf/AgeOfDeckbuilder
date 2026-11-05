# The shoreline

**Line:** **The shoreline** — every water tile the map draws wears his coast painting over its face along each edge where the map draws land, the one of his two paintings picked by the tile's place on the disc, and the beach fades with a tile beside it that changes. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md` _The map_. A new paragraph goes after the terrain paragraph and before _Near and far_, written out here:

"**The shore** is his painted coast laid over a water tile along every edge where the map draws land, chosen among his paintings by which of the tile's six edges meet land, and between the two he painted of each by the tile's place on the disc. It reads the faces the map draws, so a beach comes with the charting of the land beside it and goes with the terraform that takes the land away, fading in and out with the tile that changed; the water meets the uncharted and the edge of the disc bare."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the paragraph above.

**Scope:**

In:

- The coast files are the rivers pack's `Coasts/hexCoast<mask>-00.png` and `-01.png`, the mask six characters of `0` and `1`, 63 masks (`000000` has no file), 126 files, 5.0 MB, 256 × 384 each like a face. They join the faces' file list and are drawn into the one sheet, whose side grows from 2048 to 4096: 154 cells of 256 × 384 fill ten rows of sixteen, 3840 of 4096. CI's Chromium under SwiftShader reports a texture limit of 8192 (measured 2026-11-05). The sheet stays one texture, so the ground stays one batch under the boot's one texture unit.
- The mask's characters, left to right, are the edges north-west, north-east, east, south-east, south-west, west, verified against the files: `000001` paints the west edge, `000010` the south-west, `001000` the east, `100000` the north-west, `010101` the north-east, south-east and west. The rules' neighbour order is east, north-east, north-west, west, south-west, south-east; the mapping between the two is the implementer's, stated in one trap comment at most.
- Land is a face the map draws whose terrain the rules' water predicate answers false for, read through the catalogue; a water tile is a drawn face it answers true for. A water tile wears, over its face, the painting of the mask of its edges whose neighbour the map draws as land: a neighbour in fog as its snapshot, a neighbour the map does not draw, uncharted or off the disc, as not land. The edge between two water tiles is bare, coast and ocean alike. A land tile wears no beach.
- Which of the mask's two paintings a tile wears is picked by hashing its coordinates, through the one hash the faces' paintings are picked by, reshaped to take the list it picks from.
- The beach is one painting kept per tile from the chronicle's open beside its face, feature, ring, building and scrim, hidden until painted, named `shore-<key>` as the face is `tile-<key>`. It stands in the ground layer at a depth over every face of its row and under the row in front and under its own tile's crossfade face, which stands at the row plus a half.
- It is painted with the tile's other layers, on every render and in the motion's whole-tile paint, from the faces the map draws of the six tiles beside it, read as the yield overlay reads them. A newly charted water tile fades in with its beach as one of its layers.
- A tile changing, charted or retiled, carries the beaches of the water tiles drawn beside it: each whose mask changes fades its new painting in from the crossfade pool and its kept painting out, both over the duration the tile's own fade-in takes, and the render at the settle paints every beach as it stands. The changed tile's own beach, where it becomes water, fades in with its new face; where it stops being water, fades out with the old.
- The infopanel's terrain card shows the bare face: a terrain off the map has no neighbours.
- Every spec that walks the map keeps passing: a face is still found by its name and read by its frame.

Out:

- The far view: the beach past the zoom threshold is the far view line's, as the faces are.
- The river mouths, the pack's pieces joining a river to the sea over a beach: the river line's.
- The pack's under pieces and the fog's wash on a beach: the fog-and-uncharted line's. Today the fog scrim covers the tile's hexagon and the beach lies inside it, so the scrim covers the beach as it covers the face.
- A crop of the coast files to the hexagon's rows: every coast's ink lies within rows 126 to 382 of 384, so a crop to the hexagon would halve the sheet; not taken, the memory being invisible to the player, and open to a later fold if it ever matters.
- A lazy load: every coast file loads at boot with the faces, 126 fetches more.

Corner cases decided:

- A water tile in fog beside a live land tile wears its beach under its scrim.
- Both veils off, the console's switch, draws every tile, so every beach reads the true map.
- A neighbour terraformed out of sight changes nothing of the beach until the tile is seen again: its snapshot is what the map draws.
- A beach whose mask changes to none fades out with nothing fading in; one that comes from none fades in over no kept painting.
- A group of several charted stages plays each tile's own change in turn; each carries the beaches beside its tile, and the render at the settle paints them all.

Reconcile: the painting pick goes through the faces' hash, reshaped to take the list; the files go through the sheet's queue and draw as they are, the side grown; the faces beside a tile are read as the overlay reads them; the beach is kept and painted as the tile's other layers are; the fade-in goes through the crossfade pool, with the fade-out of the kept painting added for the beach alone, a difference that is meant.

**Traps:**

- `asPainted` (`src/ui/pool.ts`) resets scale to one: a painting sized by scale is sized after a paint takes it, and `wearing` in `src/ui/map-marks.ts` sets the face's scale for a 256-wide file, which the coast files share, origin included.
- The crossfade pool hands out faces made by `tileFace`, on the one sheet: a pooled face can wear a coast frame, and its depth is set as it is taken.
- A Layer draws by depth first and add order among equal depths (`docs/PHASER.md`): a beach's depth is given once, at its making, strictly between its row and the row plus a half.
- `drawSheet` (`src/ui/sheet.ts`) throws when a sheet has no room left, and Phaser makes mipmaps only of a power-of-two sheet (`docs/PHASER.md`): the side is 4096, not a tighter fit.
- The boot pins the batch to one texture unit (`src/main.ts`): one sheet keeps the ground in one batch; a second sheet would flush it at every row.
- Phaser 4 textures are Y-up (`node_modules/phaser/skills/v3-to-v4-migration/SKILL.md`), as the terrain line met when adding frames to the canvas texture by hand.
- A spec reads an Image's frame by name through `readings` in `e2e/chronicle-screen.ts`, and `terraformed` from `src/rules/cards` makes a water tile beside the city; the centre part is charted whole at the settle, so its outer ring has uncharted neighbours.
- `docs/PHASER.md` is cited, not restated, for the input and render facts a spec meets: a spec rests before it reads what a motion changed.

**Plan:**

1. The sheet: the coast files listed beside the faces, the side grown. Leaves standing: a game that boots with 154 frames in the sheet and draws no beach.
2. The beach: the mask read from the faces beside a water tile, the painting picked through the shared hash, the kept painting per tile at its row depth, painted with the tile's layers on every render and in the motion's whole-tile paint. Leaves standing: beaches on the map, snapping to shape at a change's settle.
3. The motion: the beaches beside a changed tile fading in and out with it, the changed tile's own with its face. Leaves standing: the line's design.
4. `docs/LOOK.md`'s paragraph, the proof spec, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, in `e2e/map.spec.ts`: seed 1's bare turn 1 with a tile beside the city terraformed through the rules into the age's first water terrain, read off the catalogue, and a second tile on the charted centre part's outer ring terraformed the same way; the first wears the frame of the mask read off the drawn faces beside it, the second a mask counting its uncharted neighbours as not land, and a land tile beside the city wears no beach; run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `fog`, `rivers`, `fishery`, `flood`, `irrigation`, `predators`, `pillage`, `press`, `move`, `city-mode`, `inspect`, `embark`, `landing`, `yields`, `boot`, `failed-boot`, and the rest of the suite.
