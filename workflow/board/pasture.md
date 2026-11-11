# The pasture

**Line:** **The pasture** — a pasture adds no mark to its tile's row: its cattle's disc stands pale as the clay pit's under the cow, the herd gone, and his round corral with his cows lies on the plain, large alone and small beside a megalith, a shelter, a tannery or a farm, absent under any other building; every improvement's row on the infopanel reads its icon on its pale disc; the megalith's, the shelter's, the tannery's and the farm's pieces stand at their new places; the pasture's stone shape gone. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md`, _The map_, the paragraph **Improvements**, rewritten whole:

"**Improvements** are told as a feature is, by his icon on a disc in the same row: the icon 14 units wide, the disc the feature's turned pale with a dark rim, so what was placed reads apart from what the land holds, and two discs side by side stand a unit apart. An improvement placed on a feature and nowhere else adds no disc: the feature's own disc turns pale under the feature's icon, one disc telling the two. The rest is flavour lying on the land: his painting of the improvement lies on the tile's ground as a herd and a pond do, under whatever stands on the tile. It lies large about the tile's middle while the tile carries no building, small at one side beside a building that leaves it room, and not at all under a building that fills its tile, where the disc alone tells it. A megalith, a shelter, a tannery and a farm leave room; a city, the monument's three stages, a site and a camp fill their tile. A clay pit is his clay on the disc and his worked pit on the hill, 27 units wide alone and 16 beside a building. A pasture is its cattle's disc turned pale and his round corral with his cows in it on the plain, 25 units wide alone and 14 beside a building, and the herd leaves its tile, the cows being in the corral. An improvement's row on the infopanel's cards reads the same icon on the same pale disc, a pasture's its cattle's. The trapping and the irrigation 🔧 are to be told the same way; until then each is a shape in the stone of worked things."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the paragraph above. `public/assets/LICENSES.md`: none, the corral comes from a pack already in the store with its entry.

**Scope:**

In, everything as the user took it on the mockup (https://claude.ai/artifact/AAB7V8kjmTAh1xemVe7UPe, 2026-11-11), by paste: Claude's starred switches, the corral's two places the clay pit's at the user's ask, the pieces' places the user's own.

- The improved disc: the cattle's own disc painted as an improvement's disc is (`IMPROVEMENT_DISC`: `LOOK.built` at `LOOK.improvementDisc`, the rim `LOOK.mapOutline` at `LOOK.improvementDiscRim`), the feature's size and rim width, under the feature's own icon, his cow, at 14 units. No new look entry.
- The row: a pasture takes no slot. A cattle tile with a pasture is one disc on the tile's middle; with an irrigation beside it, the pale disc and the irrigation's stone shape at today's 11.
- The painting: locations `Decor/corral00_cows`, his round corral with his cows in it, 102 × 89 of his pixels. A size is against the size he painted the file at beside his 256-pixel tile; a place is the painting's middle, right of and below the tile's middle, in units.

  | The tile carries                           | Size | Place   | Width      |
  | ------------------------------------------ | ---- | ------- | ---------- |
  | no building                                | 150% | (0, 3)  | 24.8 units |
  | a megalith, a shelter, a tannery or a farm | 85%  | (10, 8) | 14.1 units |
  | any other building                         | none |         |            |

- The herd: a cattle tile carrying a pasture carries no herd, whatever stands on it. A cattle tile with no pasture keeps its three cows, under a building too.
- The tannery and the farm leave room, as the megalith and the shelter do. Every other building of both ages still does not.
- The buildings' pieces, moved by the user so one place beside a building serves all four; sizes and draw order as they stand:

  | Building | Piece              | From       | To          |
  | -------- | ------------------ | ---------- | ----------- |
  | megalith | `barrow03`         | (0, -0.8)  | (0, -3)     |
  | shelter  | `houseLonghouse00` | (0, -1.3)  | (0, -2.5)   |
  | tannery  | `foresterShed00`   | (-3.6, -6) | (0, -6)     |
  | tannery  | `furs`             | (5, 4.2)   | (-6.4, 6)   |
  | farm     | `field00`          | (-3, 4.5)  | (-5.5, 4.5) |

  The farm's granary stays. The moves carry wherever the building stands: the megalith on hills and desert, beside the clay pit's pit among them, the shelter on forest and hills, the tannery on his forest clearing, and the tannery's and the farm's row and card head on the infopanel.

- The infopanel: every improvement told by an icon reads that icon on its pale disc in its row and on the card a name shows, fitted to the row's box as any mark is, the rim keeping its weight as every outline there does. The clay pit's row changes from his clay bare to his clay on its disc; the pasture's reads his cow on the pale disc. The Cattle row stays the cow bare. The trapping's and the irrigation's rows keep their stone shapes.
- Fog: the pale disc, its icon and the corral darken as every mark does, read from the face the map draws.
- Motion, through what stands, marks gone shrinking and marks come growing:
  - A pasture placed on cattle: the dark disc with its cow and the three cows of the herd shrink away, then the pale disc with its cow and the corral grow. The dark disc and the pale disc are two marks, as the pit alone and the pit beside a building are; nothing changes colour in place.
  - A pasture gone with its cattle staying: the mirror, the pale disc and the corral shrinking, the dark disc and the herd growing.
  - A Hunt on a pasture's tile: the pale disc, its cow and the corral shrink away.
  - A building coming onto or leaving a pasture's tile: the corral's two drawings swap as the pit's do, and under a building that fills its tile the corral shrinks away and nothing grows.
- Gone: the pasture's entry among the stone shapes. The trapping and the irrigation keep theirs, with `LOOK.built`, the polygon pool and `UNREAD`.
- The declaration, sized by the user for the pasture alone: an improvement is told one of three ways, by its icon on a disc of its own with its painting, by its feature's disc turned pale with its painting, or by its stone shape. The second asks for a painting, alone and beside. The trapping's intake says what lies where he painted no trap.
- The catalogue test "every improvement of the catalogue has a name and either an icon with its painting or a stone shape on the screen, never both" becomes a name and one of the three, and an improvement told on its feature's disc is one whose kind names its features in the catalogue.
- The pool: `workflow/LOOK.md`'s bullet for the improvements was rewritten at this intake with what was settled.

Out:

- The trapping's disc, its herd and what lies on its forest: the trapping's intake. Its tannery now leaves room, which shows nothing until then.
- The irrigation's disc and painting, and its painting meeting the corral on one tile, both at the place alone: the irrigation's intake.
- Today's unit mark hides the corral under it: the units line's.
- The megalith's top stands 2.2 units further under the disc: the user's move, made with the disc drawn.
- His wide corral, his long corral, his fenced field, the corral empty, his oxen on the disc, the feature's dark disc with a solid pale rim, the herd staying: served and not taken.

Corner cases decided:

- A pasture on the city's tile, on the monument's stages, on a site or a camp: the pale disc alone, no herd, no corral.
- The neutral's worker places pastures too: the same drawing.
- Both veils off draw every tile: every pale disc and every corral.
- A tile in fog keeps what its snapshot holds: a pasture placed out of sight shows the dark disc and the herd until the tile is seen again.
- The row and the card a name shows hold no tile: the pasture's mark there is his cow, its one feature's icon, on the pale disc.
- The simulator and the rules read no drawing: untouched.

Reconcile, each taken by the user as recommended: the improved disc goes through the clay pit's disc as it is; the dark disc and the pale disc swap as two marks through today's motion; the herd leaves and returns through today's motion; the corral lies through the pit's two drawings as they are; every improvement's row on the infopanel becomes its icon on its pale disc, the clay pit's reshaped in this line; the buildings' moved pieces are folded into this line, the commit saying so; the declaration is sized for the pasture alone, a painting required.

**Traps:**

- A feature's disc and icon are one object each a tile (`TileObjects.featureDisc`, `feature`, `src/ui/map.ts`), named by `featureMarksOn`, and `between` in `src/ui/map-motion.ts` compares the feature's id before and after: a pasture placed on standing cattle moves nothing there today. `between` shrinks what goes before it grows what comes.
- `rowOf` (`src/ui/map-marks.ts`) gives every improvement of the face a slot, and `between` reads it for the face before and the face after to slide what stays.
- `lyingOf` is keyed on the feature alone and `between` compares the herd by the feature's id: the herd now reads the face's improvements too.
- The look's kinds are a closed set: every switch over an improvement's look in `src/ui/marks.ts`, `src/ui/map-marks.ts` and `src/ui/map.ts` takes the third member, and the typecheck names them.
- Which improvements are told on their feature's disc is the look's, beside each improvement's painting, never the rules'; the rules' own fact, the features an improvement's kind names, is what the catalogue test holds it coherent against.
- The pasture's icon is its feature's: one source, the feature's own entry, on the map where the tile says the feature and off it where nothing does.
- `improvementMark` returns an image or a polygon today and `markOf` in `src/ui/infopanel.ts` hands it to `fitMark`, which keeps a Shape's outline weight and fits by `paintedBounds`; a Container's own bounds count the children it hides (`docs/PHASER.md`). The card's head reads the same mark through `markOf(scene, card.rows[0])`.
- A Shape carries no tint (`docs/PHASER.md`): a disc darkens through `darkened`, an image through `asDarkened`. A pooled image keeps its last flip and `asPainted` resets scale to one (`src/ui/pool.ts`): every property is written on every take.
- A tile in fog is drawn from its snapshot: the disc, the herd and the corral read the face the map draws, never the chronicle's tile.
- The features sheet (`featureSheet` in `src/ui/marks.ts`, 2048 a side) takes the corral's 102 × 89; its room is checked.
- The front piece of a building is named for its tile and `e2e/map.spec.ts` reads `buildingPaintingsOf(building).pieces.at(-1)`: the pieces keep their order, only their places move. No test or spec holds a piece's place as a number.
- `e2e/fog.spec.ts` reads `feature-disc-<key>` against `LOOK.featureDisc.colour` on a trapping's tile, and `e2e/trapping.spec.ts` and `e2e/irrigation.spec.ts` count the improvements' layer: both hold while the trapping and the irrigation stay stone shapes. No spec places a pasture today.
- `e2e/map.spec.ts`'s clay pit test is the precedent for the proof: `clayPitsPlaced`, the veils off through the console, one `readings` question.
- `DOGMAS.md` _One choke point per invariant_: the declaration's shape above is the user's sizing; the implementer widens nothing past it.
- `docs/PHASER.md` is cited, not restated: a Shape's stroke and tint, a Container's bounds, a spec resting before it reads what a render changed.

**Plan:**

1. The buildings' pieces at their new places, the tannery and the farm leaving room. Leaves standing: the four buildings redrawn on the map and on the infopanel, nothing else moved.
2. Every improvement's row on the infopanel on its pale disc. Leaves standing: the clay pit's row and the card its name shows reading his clay on its disc.
3. The pasture told on its cattle's disc: the third way of the declaration, no slot in the row, the pale disc under the cow, the swap in motion, the fog, the infopanel's row; the pasture's stone shape gone and the catalogue test following. Leaves standing: every pasture read by its cattle's pale disc on the map and on the cards, the herd still on the tile, nothing yet on the ground.
4. The corral on the ground and the herd gone: his round corral in the sheet, lying alone, beside or not at all, darkened in fog, swapped in motion when a building comes or goes, the herd leaving with the pasture. Leaves standing: the map as designed.
5. `docs/LOOK.md`'s paragraph, the proof test, the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/map.spec.ts`, one test added: on a chronicle built headlessly with the pasture's feature placed on five tiles made its terrain, a pasture placed on four of them, one bare, one under a tannery, one under a megalith and the city's own tile, the fifth left with its cattle alone, the veils off through the console, one question reads that each pasture's tile wears its feature's disc in the look's pale fill with the feature's own icon at 14 units on the tile's middle, no mark of the pasture's in the improvements' row, and no cow of a herd; that the tile with no pasture wears the feature's dark disc and its herd; that the bare tile carries the corral's frame at the size and the place of the painting alone, the tannery's and the megalith's at those of the painting beside a building, and the city's tile no corral; every number read from the look's own tables, never a literal. Run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `map`'s other tests, the clay pit's and the buildings' among them; `fog`, `trapping`, `irrigation`, which read the features' discs and the other improvements' shapes; `tannery`, `worker-instants` and `predators`, which count the features' marks; `flood`, which reads the clay pit's mark; `inspect` and `reference` for the infopanel's rows and the card a name shows; `boot` and `failed-boot` for the sheets; and the rest of the suite.
