# The trapping

**Line:** **The trapping** — a trapping adds no mark to its tile's row: its deer's disc stands pale under his deer behind his net, one picture composed of his two, the herd gone; that picture lies on the forest, large alone and small beside a tannery or a shelter, absent under any other building; a trapping's forest wears his clearing; the infopanel's Trapping row reads the picture on its pale disc; the trapping's stone shape gone, and the stone shape's way of telling an improvement with it. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md`, _The map_, the paragraph **Improvements**, rewritten whole:

"**Improvements** are told as a feature is, by his icon on a disc in the same row: the disc the feature's turned pale with a dark rim, so what was placed reads apart from what the land holds, and two discs side by side stand a unit apart. An improvement placed on a feature and nowhere else adds no disc: the feature's own disc turns pale, one disc telling the two, under the feature's icon or under a picture of the improvement's own. The rest is flavour lying on the land, under whatever stands on the tile, and it is one of two. His painting of the improvement lies on the tile's ground as a herd and a pond do: large about the tile's middle while the tile carries no building, small at one side beside a building that leaves it room, and not at all under a building that fills its tile, where the disc alone tells it. A megalith, a shelter, a tannery and a farm leave room; a city, the monument's three stages, a site and a camp fill their tile. Or ditches run from the river into the tile: his river's own source piece, pressed thin, one from the middle of every edge of the tile a river runs along, reaching about to the tile's middle and turned a little by the tile's place, drawn over the river and under everything else on the ground, under every building alike. A clay pit is his clay, 14 units wide, on the disc and his worked pit on the hill, 27 units wide alone and 16 beside a building. A pasture is its cattle's disc turned pale and his round corral with his cows in it on the plain, 25 units wide alone and 14 beside a building, and the herd leaves its tile, the cows being in the corral. An irrigation is a round cut of his straight river on the disc, rim to rim and tilted, and its ditches, 18 units long and 2.5 wide, each turned by up to 25° either way. A trapping is its deer's disc turned pale under his deer behind his net, the head showing over it: one picture composed of his two, the deer 14 units wide as on its own disc. That picture lies on the forest too, the deer 16 units wide alone and 10 beside a building, the herd leaves its tile, the deer being in the net, and the forest wears his clearing as it does under a building, so the catch lies in a gap and not on the treetops. An improvement's row on the infopanel's cards reads what its disc wears on the map, on the same pale disc."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the paragraph above. `public/assets/LICENSES.md`: none, his deer and his net come from packs already in the store with their entries.

**Scope:**

In, everything as the user took it on the mockup (https://claude.ai/artifact/4saX2TKTVoiDeJ6maecqQY, 2026-11-11), by paste. The deer behind the net with the head showing, on the ground and on the disc, is the user's idea, and where the net hangs is the user's dial. The net's size, the picture's two places and sizes, the clearing and the herd leaving are Claude's starred values, taken on the page.

- The picture, one wherever the game shows it: his deer (`icons-strategic-resources-and-goods/Icons/deer.png`, 128 × 128 of his pixels) with his net (`ancient-icons/fishing_net.png`, 128 × 128) drawn over it. In the deer's own pixels:

  | What | Value |
  | --- | --- |
  | The net's width and height | 80% of the deer's: 102.4 |
  | The net's middle | 5.12 left of the deer's middle and 21.76 below it |
  | So the net hangs | 8.96 below the deer's box, and inside it on the three other sides |
  | The picture's frame | square, 146 a side, the deer's box in its middle, 9 from each side |

  The frame is square and the deer's middle is its middle, so a place given for the picture is the deer's.

- The disc: the deer's own disc painted as an improvement's disc is (`IMPROVEMENT_DISC`, the feature's size and rim), under the picture, 16 units wide, so the deer in it stands 14 as it does on its dark disc and the net ends half a unit inside the rim. No new look entry.
- The row: a trapping takes no slot, as a pasture takes none. A trapped deer tile is one disc on the tile's middle.
- On the ground: the same picture, through the pit's and the corral's two drawings as they stand. A size is against the size he painted his files at beside his 256-pixel tile; a place is the picture's middle, right of and below the tile's middle, in units.

  | The tile carries            | Size | Place   | The deer's width |
  | --------------------------- | ---- | ------- | ---------------- |
  | no building                 | 75%  | (0, 3)  | 15.6 units       |
  | a building that leaves room | 50%  | (10, 8) | 10.4 units       |
  | any other building          | none |         |                  |

  Of the buildings that leave room, a forest carries the tannery and the shelter.

- The herd: a deer tile carrying a trapping carries no herd, whatever stands on it, as a pasture's cattle carry none. A deer tile with no trapping keeps its three deer.
- The clearing: a forest tile carrying a trapping wears his clearing in place of its forest, the one of his two its place on the disc picks, as it does under a building. Which improvement clears its ground is the look's, said by the trapping alone.
- The infopanel: the Trapping row and the card a name shows read the picture on its pale disc, fitted to the row's box as any mark is. The Deer row stays the deer bare. The terrain's card reads the forest's first painting as it does today.
- Fog: the pale disc, the picture on it and the picture on the ground darken as every mark of their tile does, read from the face the map draws; a trapped tile in fog wears the clearing darkened.
- Motion, through what stands, marks gone shrinking and marks come growing, a face that changes crossfading:
  - A trapping placed on deer: the dark disc with its deer and the three deer of the herd shrink away, then the pale disc with its picture and the picture on the ground grow, and on a tile with no building the forest crossfades to his clearing.
  - A Hunt on a trapped tile: the pale disc, its picture and the picture on the ground shrink away, and on a tile with no building the clearing crossfades back to the forest.
  - A trapping gone with its deer staying: the mirror of its placing.
  - A building coming onto or leaving a trapped tile: the picture's two drawings swap as the pit's do, under a building that fills its tile it shrinks away and nothing grows, and the face does not change, the clearing standing already.
- Gone: the trapping's entry among the stone shapes, and with it the stone shape's way itself, its last user: the third member of an improvement's look, the polygon an improvement's shape was drawn on with its pool, and every branch that answered it. `LOOK.built` stays, the pale disc's fill, and `UNREAD` stays, the units' polygons reading it.
- The declaration, sized by the user for the trapping alone: an improvement told on its feature's disc says what the pale disc wears, the feature's own icon or a picture of its own with its width; an improvement's look may say its tile wears its terrain's clearing; an improvement is told one of two ways, the stone shape's gone. Nothing wider.
- The catalogue test on every improvement's look follows: its title loses the stone shape.
- The pool: `workflow/LOOK.md`'s bullet for the improvements was rewritten at this intake with what was settled.

Out:

- The fishery's net by its dock: the same painting of his, another use, untouched.
- Today's unit mark hides the picture on the ground: the units line's.
- The tannery's and the shelter's pieces: as shipped, the user moved none.
- His pen empty, his pen with a deer in it, his net bare, nothing on the ground, the deer bare on the pale disc, the forest left as it is under a trapping alone, the herd staying: served and not taken.

Corner cases decided:

- A trapping on the city's tile, under a camp or a site: the pale disc with its picture, no herd, nothing on the ground, the clearing the building already asks for.
- A trapping placed on a tile that carries a building already: the face does not change.
- A terrain he painted no clearing of: its own paintings, as under a building.
- The neutral's worker places trappings too: the same drawing.
- Both veils off draw every tile: every pale disc, every picture and every clearing.
- A tile in fog keeps what its snapshot holds: a trapping placed out of sight shows the dark disc, the herd and the forest until the tile is seen again.
- The row and the card a name shows hold no tile: the trapping's mark there is its own picture on the pale disc, no feature asked.
- The simulator and the rules read no drawing: untouched.

Reconcile, each taken by the user as recommended: the pale disc goes through the pasture's way as it is, what it wears its one parameter; the picture is composed once and read in every place, as the river's cut is; the picture on the ground goes through the pit's and the corral's two drawings as they are; the herd leaves through the pasture's way as it is; the clearing goes through the building's as it is, the same pick and the same crossfade, the trapping's look saying it clears; the Trapping row goes through every improvement's row as it is; the fishery's net and the trap's stay apart, two uses of one painting; the stone shape's way goes whole with this line.

**Traps:**

- A sheet's file is one texture, and `drawSheet` (`src/ui/sheet.ts`) lets it go once drawn: a file named by two sheets is refused at the second as not loaded. His net is in the buildings sheet today, the fishery's piece, and the boot draws the features sheet before the buildings sheet (`src/main.ts`).
- `Made` says a frame drawn by code reads a painting of a sheet drawn before its own; the deer's icon is a file of the features sheet itself. `RIVER_CUT` in `src/ui/marks.ts` is the precedent for a picture made at boot in the features sheet and read by an improvement's look; the features sheet is 2048 a side, and its room is checked.
- `asIcon` in `src/ui/map-marks.ts` sets an icon to a square of its width: the picture's frame is square for it, and the width the look declares is the frame's, not the deer's.
- `improvementMarksOn` and `improvementMark` answer the feature's own icon at `ICON_WIDTH` for an improvement told on its feature's disc, the first by the tile's feature and the second through `discFeatureOf`; each now reads what the look says the disc wears. The pasture still reads its one feature through `discFeatureOf`.
- `featureToldOn` already takes the feature's disc, icon and herd off a tile carrying an improvement told on its feature's disc: the trapping's herd leaves by its look's kind alone.
- `facePaintingOn` picks the clearing by the tile's building alone, and `between` in `src/ui/map-motion.ts` crossfades where its painting differs between the face before and the face after; it reads the face's improvements too now, on the map and in the motion alike, from the face the map draws, never the chronicle's tile.
- `facePaintingsOf` in `e2e/map.spec.ts` says which paintings a tile's face may wear by its building alone, and three tests read every tile through it.
- The look's kinds are a closed set: every switch over an improvement's look in `src/ui/marks.ts`, `src/ui/map-marks.ts` and `src/ui/map.ts` loses a member, and the typecheck names them. `improvementPool` in `src/ui/map.ts` and `asImprovementShape` go with their last reader, checked by a search.
- `improvementLyingOf` names what an improvement lays `improvement-painting-<id>-<place>-<key>`, and `between` compares those names: the picture on the ground comes and goes through them unchanged.
- `fitMark` in `src/ui/infopanel.ts` fits a mark by `paintedBounds`, which reads `paintIn` for an image and a frame's own box where it holds none; a Container's own bounds count the children it hides (`docs/PHASER.md`).
- A Shape carries no tint (`docs/PHASER.md`): a disc darkens through `darkened`, an image through `asDarkened`. A pooled image keeps its last flip and `asPainted` resets scale to one (`src/ui/pool.ts`): every property is written on every take.
- `e2e/trapping.spec.ts` counts the improvements' layer, one mark more once a trapping is placed and one fewer after a Hunt, and expects a Hunt on a trapped tile to take one feature's mark off the map; a trapped tile shows a disc and its picture, two marks, and no feature's mark. The assertions become the pale disc and its picture standing on the tile by their names, then gone, which is the line's change and no weakening.
- `e2e/fog.spec.ts` builds both its marked tiles trapped, the one in sight through `onDeer` and the one in fog by hand, and reads on each the feature's icon, the first deer of the herd, the feature's dark disc and the trapping's stone shape. A trapped tile shows none of the first three. The test keeps every reading it makes today, the feature's icon, its herd and its dark disc in fog and in sight on deer no trapping stands on, and reads the trapping's pale disc, the picture on it and the picture on the ground in fog and in sight; a reading dropped is a behaviour no longer promised and is reported, never taken.
- `e2e/tannery.spec.ts`, `e2e/worker-instants.spec.ts` and `e2e/predators.spec.ts` count the features' marks through `featuresShown`, and `e2e/refuse.spec.ts` builds through `onDeer` with no trapping: each is read for a trapped tile before the push.
- `e2e/map.spec.ts`'s pasture test with `pasturesPlaced` is the precedent for the proof: the feature placed on tiles made its terrain, the city's among them, the veils off through the console, one `readings` question, every number from the look's tables.
- `DOGMAS.md` _One choke point per invariant_: the declaration's shape above is the user's sizing; the implementer widens nothing past it. _No guard against a state no path reaches_: nothing is kept for the stone shape.
- `docs/PHASER.md` is cited, not restated: a Shape's stroke and tint, a Container's bounds, a spec resting before it reads what a render changed.

**Plan:**

1. `src/ui/marks.ts`, `src/ui/sheet.ts`, `src/main.ts`: the picture, his deer behind his net, made once at boot as a frame of the features sheet. Leaves standing: the frame in the sheet, nothing on the screen moved, the fishery drawn as it was.
2. `src/ui/marks.ts`, `src/ui/map-marks.ts`, `src/ui/map.ts`, `src/content/catalogue.test.ts`, `e2e/trapping.spec.ts`, `e2e/fog.spec.ts`: the trapping told on its deer's disc under the picture, on the map, in motion, in fog and on the infopanel; the stone shape's way gone whole; the catalogue test, the trapping spec and the fog spec following. Leaves standing: every trapping read by its pale disc on the map and on the cards, the herd gone, nothing yet on the ground, the forest as it was.
3. `src/ui/marks.ts`, `src/ui/map-marks.ts`: the picture on the ground, alone, beside or not at all. Leaves standing: the catch lying on the treetops.
4. `src/ui/marks.ts`, `src/ui/map-marks.ts`, `src/ui/map.ts`, `src/ui/map-motion.ts`, `e2e/map.spec.ts`: the clearing under a trapping, on the map, in fog and crossfading in motion, the spec's reading of a tile's face following. Leaves standing: the map as designed.
5. `docs/LOOK.md`'s paragraph, the proof test in `e2e/map.spec.ts`, the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/map.spec.ts`, one test added: on a chronicle built headlessly with the trapping's feature placed on four tiles made its terrain, a trapping placed on three of them, one bare, one under a tannery and the city's own tile, the fourth left with its deer alone, the veils off through the console, one question reads that each trapping's tile wears its feature's disc in the look's pale fill with the look's picture at the look's width on the tile's middle, no mark of the feature's in its row and no deer of a herd; that the tile with no trapping wears the feature's dark disc, its icon and its herd; that the bare trapped tile's face is one of his clearings of its terrain and the untrapped tile's one of his paintings of it; that the bare tile carries the picture at the size and the place of the painting alone, the tannery's at those of the painting beside a building, and the city's tile none; every number read from the look's own tables, never a literal. Run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `map`'s other tests, the clay pit's, the pasture's, the irrigation's and the buildings' among them; `trapping`, whose counts become the disc and its picture by name; `fog`, which reads the marks in fog and in sight; `tannery`, `worker-instants`, `predators` and `refuse`, which count the features' marks or build on deer; `inspect` and `reference` for the infopanel's rows and the card a name shows; `flood` and `irrigation`, which read the other improvements' marks; `boot` and `failed-boot` for the sheets; and the rest of the suite.
