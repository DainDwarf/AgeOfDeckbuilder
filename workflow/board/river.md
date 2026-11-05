# The river

**Line:** **The river** — every run of river along the tiles the map draws is his painted river: one of his pieces on each corner it passes, turned onto the corner lattice and meeting the next halfway along the edge, his straight river pressed into his river mouth where it reaches the water, the stroked line gone. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md` _The map_. The river paragraph is replaced whole, written out here:

"**The river** is his painted river set corner by corner along the edges it runs. His rivers are painted crossing a tile between the middles of its edges; set on a corner instead, their legs run the corner's edges, so every corner a river passes wears the one of his pieces whose arms are the river's edges there, each leg reaching the edge's middle where the next corner's piece meets it as his pieces join: a stub at its source, a bend, his fork where two rivers meet. Where a river reaches the water its last half edge is his straight river pressed to that length, running into his river mouth, which washes from the corner into the water over the beaches. A piece with several paintings is picked by the corner's place on the disc, as a face is. The river is drawn over the ground, the art risen above a tile's hexagon included. 🔧 Its weight at the far view is the map rung's."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the paragraph above.

**Scope:**

In:

- The files, 29, from the rivers pack: his corner pieces, `Rivers/hexRiver<mask>-<nn>.png` for the fourteen masks whose edges lie two apart on the hex, with every painting he made of each: `000001`, `000010`, `000100`, `001000`, `010000`, `100000`, `010100`, `101000`, `010001`, `100010`, `010101`, `101010` one painting each (`-00`), `000101` and `001010` two (`-00`, `-01`); his straight river `Rivers/hexRiver001001-00.png`; his six river mouths, `River Mouths/hexRiverMouth<mask>-<nn>.png`, the six single-edge masks, two paintings each. The mask's characters, left to right, are the edges north-west, north-east, east, south-east, south-west, west, as the coasts' are. All 256 × 384, the hexagon's middle at 256 of 384, as a face. They are drawn into a sheet of their own, 2048 a side, 29 of its 40 cells, through the sheet machinery with the side made a parameter; the faces' sheet keeps its 4096 and its six free cells.
- A corner's piece. The rules' six arm offsets, in the order the rules list them, are the six mask positions in the mask's order: under the quarter turn below his north-west edge lands on the first arm, his north-east on the second, his east on the third, and so on. A corner's mask has a `1` at every arm along which an edge of a drawn run of river leaves the corner. The arms of one corner lie within one of the two triples, so every corner's mask is one of the fourteen, with one, two or three arms; a mask with no piece is refused, never skipped.
- The quarter turn and the lattice swap: a piece is an image from the river sheet held about the hexagon's middle as a face is, origin (0.5, 256/384), turned a quarter turn clockwise, scaled by `k × SQUASH` along its own width and `k / SQUASH` along its own height, where `k` is the tile's size over the file's width, 24/256: his leg, the apothem, 128 px, becomes half an edge, and his six edges land exactly on the six directions a corner's edges take on the squashed lattice. Verified on the mockup: every piece meets the next at the edge's middle.
- The pieces are drawn in the rivers layer, over all the ground and under the features, as the stroked line was; their order among themselves does not matter. They are pooled, hidden and reused, one pool for the images and one for the containers below, and painted on every render from the runs along the tiles the map draws, as the stroke was.
- The painting a corner wears, where the mask has two, and the mouth's, is picked through the one hash the faces and beaches are picked by, given the corner's two numbers.
- The source: a river's first corner carries one arm and wears his stub, the rounded end on the corner. A corner where two rivers' arms meet wears the bend or the fork its arms name; a corner that another river later ends on is read the same way.
- The mouth, at a river's last corner, when the run drawn reaches that corner and the face the map draws of the tile straight ahead of the arrived edge is water. That tile is the corner less the arrived arm's offset, and a corner that touches water carries one arm only, since a river ends at the first such corner and every edge's two banks are land. Two pieces stand there instead of the stub:
  - His straight river, pressed: in a container at the corner scaled 1 by `SQUASH`, the image with its origin at his east edge's middle, (1, 256/384), scaled `k / 2` along its width and `k / SQUASH` along its height, rotated so his east axis points along the arrived edge away from the previous corner, measured on the regular lattice: the arms' directions there are, in the rules' order, −30°, 30°, 90°, 150°, 210°, 270°, and the image's rotation is the direction opposite the arrived arm. Its west end then meets the bend's leg at the edge's middle, its east end the mouth at the corner, both with the cut his pieces join by. Verified on the mockup: the cuts of his straight river's two ends and of his mouths all span rows 236 to 276 of his file.
  - His mouth of the mask whose one `1` is at the arrived arm's position, held with the quarter turn and the lattice swap as a corner piece is, its origin at that edge's middle in his file: the edges' middles are, in the mask's order, (−64, −96), (64, −96), (128, 0), (64, 96), (−64, 96), (−128, 0) about the hexagon's middle. Its cut lies at the corner and its wash spreads into the water tile, over the beach, the rivers layer standing over the ground.
  - Where the tile ahead is not drawn, or drawn as land, the corner wears the stub as a source does.
- The motion: a tile charted or retiled carries the pieces at its six corners. Each corner whose piece changes, by its arms, its painting or its kind, fades its new piece in from the pool and its kept one out, both over the duration the tile's own fade takes, through the door the beaches beside a changed tile fade through; the render at the settle paints every piece as it stands. A mouth comes with the charting of the water tile ahead, and goes with a terraform that makes that tile land.
- The specs: each corner piece and each pressed straight is named `river`, each mouth `river-mouth`. The helper the two specs count rivers by answers one `river` per distinct corner of the runs along the charted tiles; the mouths are counted in the proof spec alone.
- The stroked line goes with its two widths, the outline surface and the water pool; the river's colour entry stays, the infopanel's river mark reads it.

Out:

- The far view: the pieces at the far zoom are the far view line's, as the faces are.
- The infopanel's river mark, the placeholder polygon on the terrain card's river row: the glyph rung's.
- The fog's wash on a river piece and the uncharted's edge: the fog-and-uncharted line's. A river leaving the drawn tiles ends in his stub at the last drawn corner, as the stroked line ended.
- His pieces whose water wanders from the hexagon's middle, the bend serving a corner with both legs pointing down most of all: accepted as painted, the user's call on the mockup. A mirrored or turned set was tried and rejected.
- The art risen above a tile's hexagon drawn over the river, and the river drawn in row order: both tried on the mockup and rejected; the river draws over all the ground.

Corner cases decided:

- Both veils off draw every tile, so every corner of every river and every mouth is drawn.
- A corner at the edge of the drawn tiles wears the arms of the drawn edges alone: a river continuing into the uncharted ends in a stub there.
- A group of several charted stages plays each tile's own change in turn; each carries the pieces at its corners, and the render at the settle paints them all.
- A tile charted as its snapshot is read as the map draws it: the water ahead of a mouth is the drawn face's.

Reconcile: the painting pick goes through the faces' hash, given the corner's two numbers; the fade goes through the beaches' motion door; the files go through the sheet machinery into a sheet of their own, the side made a parameter; a piece is an image held as a face is, the turn and the swap added, the mouth's straight in a container; the specs' river count is the one helper rewritten, the two specs unchanged.

**Traps:**

- `asPainted` (`src/ui/pool.ts`) resets scale to one and nothing else: a piece's non-uniform scale and its rotation are set after the paint takes it; a pooled image keeps its last rotation and origin, so every property the piece reads is written on every take.
- Phaser applies an object's scale before its rotation, and a container's transform after its children's: the pressed straight's exactness rests on that order, container scale (1, `SQUASH`) over image rotation over image scale (`k / 2`, `k / SQUASH`).
- `drawSheet` (`src/ui/sheet.ts`) throws when a sheet has no room left and `SHEET_SIDE` is a module constant; Phaser makes mipmaps only of a power-of-two sheet (`docs/PHASER.md`).
- The boot pins the batch to one texture unit (`src/main.ts`): a second sheet is one flush between the ground and the rivers layer, which the rim's graphics already force, and none within a layer.
- The crossfade pool hands out faces made by `tileFace` on the face sheet: the river pieces take pools of their own on the river sheet.
- `paintingOn` (`src/ui/marks.ts`) takes a `TileCoords`; a corner is a `Corner` of `x` and `y` (`src/rules/map.ts`), keyed by `cornerKey`.
- `riversAlong` (`src/rules/map.ts`) answers the runs along the drawn tiles, each a list of corners one edge apart; the rules' arm offsets and their order, `cornersBeside` and `tilesAtCorner` are there too, and the water predicate reads a terrain through the catalogue.
- `riverRuns` in `e2e/chronicle-screen.ts` is read by `e2e/rivers.spec.ts` and `e2e/fog.spec.ts`; `readings` reads an image's frame by name; the uncharted veil is switched off through the console as `e2e/camps.spec.ts` does.
- `docs/PHASER.md` is cited, not restated, for the render facts a spec meets: a spec rests before it reads what a motion changed.

**Plan:**

1. The sheet: the 29 river files listed and drawn at boot into a sheet of their own, 2048 a side, the side a parameter of the sheet machinery. Leaves standing: a game that boots with two sheets and draws the stroked line still.
2. The pieces: a corner's arms read off the drawn runs, its mask and painting, the quarter turn and the lattice swap, pooled images in the rivers layer painted on every render in place of the stroke; the stroke and its constants gone; the spec helper and the two specs following. Leaves standing: his river on the map, snapping to shape at a change's settle, every spec green.
3. The mouth: the pressed straight in its container and the mouth image at a river's last corner with water drawn ahead. Leaves standing: the line's design, snapping.
4. The motion: the pieces at a changed tile's corners fading through the beaches' door. Leaves standing: the line's design.
5. `docs/LOOK.md`'s paragraph, the proof spec, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/rivers.spec.ts`, its one test rewritten and one added: the first seed whose bare turn 1 charts a river counts one `river` per distinct corner of the runs along the charted tiles, an ended turn leaves them; and with the uncharted veil off through the console, one `river` per distinct corner of every river of the chronicle and one `river-mouth` per river whose last corner has a water tile straight ahead of its arrived edge, both read off the rules; run `npx playwright test e2e/rivers.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `fog`, `irrigation`, `inspect`, `map`, `console`, `settle`, `camps`, `city-mode`, `boot`, `failed-boot`, and the rest of the suite.
