# The irrigation

**Line:** **The irrigation** — an irrigation stands in its tile's row on a pale disc of its own wearing a round cut of his straight river, rim to rim; one ditch of his river's source piece runs from the middle of every edge of its tile a river runs along to about the tile's middle, turned by the tile's place, over the river and under everything else on the ground and under every building; the infopanel's Irrigation row reads that river on its pale disc and its River row the same river bare; the irrigation's and the river's old polygons gone. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md`, _The map_.

The paragraph **Improvements**, rewritten whole:

"**Improvements** are told as a feature is, by his icon on a disc in the same row: the disc the feature's turned pale with a dark rim, so what was placed reads apart from what the land holds, and two discs side by side stand a unit apart. An improvement placed on a feature and nowhere else adds no disc: the feature's own disc turns pale under the feature's icon, one disc telling the two. The rest is flavour lying on the land, under whatever stands on the tile, and it is one of two. His painting of the improvement lies on the tile's ground as a herd and a pond do: large about the tile's middle while the tile carries no building, small at one side beside a building that leaves it room, and not at all under a building that fills its tile, where the disc alone tells it. A megalith, a shelter, a tannery and a farm leave room; a city, the monument's three stages, a site and a camp fill their tile. Or ditches run from the river into the tile: his river's own source piece, pressed thin, one from the middle of every edge of the tile a river runs along, reaching about to the tile's middle and turned a little by the tile's place, drawn over the river and under everything else on the ground, under every building alike. A clay pit is his clay, 14 units wide, on the disc and his worked pit on the hill, 27 units wide alone and 16 beside a building. A pasture is its cattle's disc turned pale and his round corral with his cows in it on the plain, 25 units wide alone and 14 beside a building, and the herd leaves its tile, the cows being in the corral. An irrigation is a round cut of his straight river on the disc, rim to rim and tilted, and its ditches, 18 units long and 2.5 wide, each turned by up to 25° either way. An improvement's row on the infopanel's cards reads the same icon on the same pale disc, a pasture's its cattle's. The trapping 🔧 is to be told the same way; until then it is a shape in the stone of worked things."

The paragraph **The river**, one sentence added at its end:

"A river's row on the infopanel's cards reads a round cut of his straight river, bare, the one an irrigation's disc wears."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the two edits above. `public/assets/LICENSES.md`: none, both files come from the rivers pack already in the store with its entry.

**Scope:**

In, everything as the user took it on the mockup (https://claude.ai/artifact/6Ct4B1ZwL5o7ajukEGSD5e, 2026-11-11), by paste. The river on the disc and the ditches from the river are the user's ideas, and every number below is the user's, dialled on the page. His source piece as the ditch's painting, the way a ditch points and the mirror are Claude's, taken on the page.

- The river's picture: from `hex-rivers-coasts-and-seas/Rivers/hexRiver001001-00.png`, 256 × 384 of his pixels, the round cut 104 of his pixels across about his pixel (128, 260), turned 15° anticlockwise, so his east end rises. It is one picture, read wherever the game shows it: on the irrigation's disc and bare on the River row.
- The disc: the clay pit's pale disc as it stands (`IMPROVEMENT_DISC`, the feature's size and rim), in a slot of its own in the row, the river's picture on it 17 units wide, so it runs to the inside of the rim. The clay pit's clay stays 14 wide: how wide its picture stands on the disc is what an improvement told this way declares. No new look entry.
- The row: an irrigation takes a disc's slot. Alone it is one disc on the tile's middle; beside a feature's disc, dark or turned pale by a pasture, two discs a unit apart, 37 units.
- The ditches: one for every edge of the irrigation's tile a river runs along, each edge once however many rivers run it. Each is `hex-rivers-coasts-and-seas/Rivers/hexRiver001000-00.png`, his river's source piece toward his east edge, its paint 117 of his pixels long from his pixel 139 to his east edge and 38 tall. Every distance and direction is on the map's own surface, as the map draws its lattice:

  | What | Value |
  | --- | --- |
  | Held at | his pixel (246, 256) of the file |
  | That point stands | on the straight way from the edge's middle to the tile's middle, 2.5 units in from the edge's middle |
  | Its tip points | along that way toward the tile's middle, turned by its roll |
  | The roll | even between 25° one way and 25° the other, picked by the tile's place and the edge |
  | Along its length | 0.1549 units to one of his pixels: 18.1 units of paint |
  | Across | 0.0659 units to one of his pixels: 2.5 units of paint, about 70% of the river's own width |
  | Mirrored across or not | picked by the tile's place and the edge, as a herd's cow is flipped |

  So its cut end lies about a unit inside the edge, on the river, and its tip reaches about the tile's middle.

- Where the ditches lie: over the river's pieces and under everything else on the ground, a herd, a pond and a corral among it, and under every building, one that fills its tile like any other. One drawing, whatever the tile carries.
- Fog: the disc, its picture and the ditches darken as every mark of their tile does, read from the face the map draws.
- Motion, through what stands, marks gone shrinking and marks come growing: an irrigation placed grows its disc with its picture and each ditch, the ditch from the point it is held at, so it grows out of the river; an irrigation gone shrinks them the same way. A building coming onto or leaving the tile moves nothing of the irrigation's.
- The infopanel: the Irrigation row and the card a name shows read the river's picture on its pale disc, fitted to the row's box as any mark is. The terrain card's River row reads the same picture bare, as a feature's row reads its icon bare.
- Gone: the irrigation's entry among the stone shapes, and the river's bent blue polygon with the look's entry it alone reads. The trapping keeps its stone shape, with `LOOK.built`, the polygon pool and `UNREAD`.
- The declaration, sized by the user for the irrigation alone: an improvement told by its icon on a disc of its own says how wide the icon stands, and what lies on its ground is one of two, his painting alone and beside, or ditches from the river with their numbers. Nothing wider.
- The catalogue test on every improvement's look follows: its title names the ditches beside the painting.
- The pool: `workflow/LOOK.md`'s bullet for the improvements was rewritten at this intake with what was settled.

Out:

- The trapping's disc, its herd and what lies on its forest: the trapping's intake.
- Today's unit mark hides the ditches' tips: the units line's.
- A disc standing over the start of a ditch from an upper edge: seen on the page and taken.
- Two ditches of one tile meeting near its middle: seen on the page and taken.
- His bucket of water on the disc, his fields, his wild grain and his well on the ground, two or three ditches an edge, a lean, a start moved along the edge, the ditches over what lies on the ground: served and not taken.

Corner cases decided:

- A river along three edges of a tile gives three ditches, all reaching toward the middle.
- Two irrigated tiles on either side of one edge each wear their own ditch from that edge's middle.
- An irrigation on the city's tile, on the monument's stages, on a site or a camp: the disc and the ditches, the building over them.
- An irrigation with a pasture: the cattle's pale disc and the irrigation's side by side, the corral where it shipped, over the ditches.
- An irrigation on an oasis: the pond over the ditches.
- The neutral's worker places irrigations too: the same drawing.
- Both veils off draw every tile: every disc and every ditch.
- A tile in fog keeps what its snapshot holds: an irrigation placed out of sight shows nothing until the tile is seen again.
- The simulator and the rules read no drawing: the rules gain only the answer to which edges of a tile a river runs along.

Reconcile, each taken by the user as recommended: the disc goes through the clay pit's as it is, the picture's width its parameter; the Irrigation row goes through every improvement's row as it is; the River row is folded into this line, the commit saying so; a ditch and the river's own source piece stay apart, the ditch belonging to its tile as a herd does; the ditches lie the herd's way, one drawing under every building; a ditch comes and goes through today's motion from the point it is held at; its turn and its mirror are picked by the tile's place; the declaration is sized for the irrigation alone.

**Traps:**

- Which edges of a tile a river runs along is map geometry and the rules' (`DOGMAS.md` _Stack_). `runsAlong` in `src/rules/map.ts` answers whether one does, by the test the edges' answer needs: two consecutive corners of a river that are both corners of the tile. One answer, read by both.
- An edge's middle is the middle of its two corners as `cornerAt` places them, and the tile's middle is `positionOf`: the lattice is squashed, so nothing is worked out on a regular hexagon.
- Phaser's `scale` reads the mean of `scaleX` and `scaleY` and writes both (`node_modules/phaser/src/gameobjects/components/Transform.js:125-135`). `scaleUp` in `src/ui/map-motion.ts` reads `mark.scale` and tweens it, and `shrink` does its mirror: a ditch has two scales, one of them signed, so what the motion carries must have one. `asPressedStraight` in `src/ui/map-rivers.ts` is the precedent for a river file pressed inside a container.
- A mirror by a negative scale turns about the point the image is held at; a flip turns the frame about its own middle and moves the paint.
- The ground's lying marks are pooled images of the features sheet in one layer with no order among them (`lyingPool` in `src/ui/map.ts`), and the river's pieces are pooled in the layer under it. The ditch's file is in the river sheet, and its place between the river and everything lying is made by a layer or a depth, never by the order of takes.
- `between` in `src/ui/map-motion.ts` compares marks by name on the face before and the face after, and `improvementLyingOf` gives the names of what an improvement lays; the ditches' names are steady for a tile and an edge, and a building coming or going changes none of them.
- The features sheet's tinted paintings and the buildings sheet's patch are the precedents for a frame painted at boot; `src/main.ts` draws the sheets in the order it holds them, and a frame cut from the river sheet's painting needs that sheet drawn first. The features sheet is 2048 a side: its room is checked.
- `asIcon` in `src/ui/map-marks.ts` sets every icon to `ICON_WIDTH`, and `onImprovementDisc` reads it for the infopanel: both take the width the look declares.
- The look's kinds are a closed set: every switch over an improvement's look in `src/ui/marks.ts` and `src/ui/map-marks.ts` is read again, and the typecheck names them.
- `fitMark` in `src/ui/infopanel.ts` fits a mark by `paintedBounds`, which reads `paintIn` for an image and a frame's own box where it holds none; a Container's own bounds count the children it hides (`docs/PHASER.md`).
- A Shape carries no tint (`docs/PHASER.md`): a disc darkens through `darkened`, an image through `asDarkened`. A pooled image keeps its last flip, turn and origin, and `asPainted` resets scale to one (`src/ui/pool.ts`): every property is written on every take.
- Every pick by place goes through `pickOf` in `src/ui/marks.ts`, salted apart from the picks its tile already makes, as the pond's is.
- `e2e/irrigation.spec.ts` asserts the improvements' layer holds one mark more once the irrigation is placed; a disc and its picture are two. The assertion becomes the irrigation's disc and its picture standing on the tile by their names, which is the line's change and no weakening. `e2e/trapping.spec.ts` and `e2e/fog.spec.ts` read the trapping's stone shape and hold.
- `e2e/inspect.spec.ts` and `e2e/irrigation.spec.ts` read the River row by its text through `riverRows`, never its mark.
- `LOOK.river` and `RIVER_MARK` are read by `riverMark` alone today; each goes with its last reader, checked by a search.
- `e2e/map.spec.ts`'s clay pit and pasture tests are the precedent for the proof: the improvements placed headlessly, the veils off through the console, one `readings` question, every number from the look's tables.
- `DOGMAS.md` _One choke point per invariant_: the declaration's shape above is the user's sizing; the implementer widens nothing past it.
- `docs/PHASER.md` is cited, not restated: a Shape's stroke and tint, a Container's bounds and transform over its child's, a spec resting before it reads what a render changed.

**Plan:**

1. `src/rules/map.ts` and its test: the rules answer which edges of a tile a river runs along, proven on the fixture's river, and whether one does is read off it. Leaves standing: nothing on the screen moved.
2. `src/ui/sheet.ts`, `src/ui/marks.ts`, `src/main.ts`, `src/ui/map-marks.ts`, `src/ui/infopanel.ts`, `src/ui/look.ts`: the river's round cut as one picture, and the infopanel's River row reading it bare. Leaves standing: the River row painted, the river's polygon and its look entry gone.
3. `src/ui/marks.ts`, `src/ui/map-marks.ts`, `src/ui/map.ts`, `src/content/catalogue.test.ts`, `e2e/irrigation.spec.ts`: the irrigation told by that picture on a pale disc of its own, 17 units wide, in the row, in motion, in fog and on the infopanel; its stone shape gone, the catalogue test and the irrigation spec following. Leaves standing: every irrigation read by its disc on the map and on the cards, nothing yet on the ground.
4. `src/ui/marks.ts`, `src/ui/map-marks.ts`, `src/ui/map.ts`, `src/ui/map-motion.ts`: the ditches, one for each edge the river runs along, over the river and under everything else, darkened in fog, growing out of the river and shrinking into it. Leaves standing: the map as designed.
5. `docs/LOOK.md`'s two edits, the proof test in `e2e/map.spec.ts`, the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/map.spec.ts`, one test added: on a chronicle built headlessly from a seed searched for a river, an irrigation placed on three tiles along it made its terrain, one bare, one under a megalith and one under the monument's first stage, the veils off through the console, one question reads that each tile wears the irrigation's disc in the look's pale fill with the river's picture on it at the width the look declares, no painting of the irrigation's on its ground, and one ditch for each edge the rules say a river runs along it and none for any other; that each ditch is held where the look places it, in from the middle of its edge toward the tile's middle, at the look's two scales, turned from the way to the tile's middle by no more than the look's spread; and that the ditches stand under the megalith's tile and the monument's alike; every number read from the look's own tables and the rules, never a literal. Run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `map`'s other tests, the clay pit's, the pasture's and the buildings' among them; `irrigation`, whose count becomes the disc and its picture by name; `inspect` and `reference` for the infopanel's rows, the River row among them, and the card a name shows; `fog`, `trapping`, `flood`, `tannery`, `worker-instants` and `predators`, which read the features' and the improvements' marks; `boot` and `failed-boot` for the sheets; and the rest of the suite.
