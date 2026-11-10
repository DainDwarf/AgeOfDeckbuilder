# The buildings

**Line:** **The buildings** — every building the cast below holds, both cities' own and the monument's three stages, is drawn as its paintings on the map and on the infopanel, a forest tile carrying one wearing his clearing, the feature's disc and the improvements drawn over it; his locations pack and his ancient icons in the store with their licence entries; those eleven buildings' polygons and colours gone, the camps' and the sites' standing. Doc-impact: `docs/LOOK.md`, `public/assets/LICENSES.md`.

**Spec:** `docs/LOOK.md`, three places, written out here.

_The pieces on the map_, the first paragraph, replaced by these two:

"**A building and a city's own building** are his painted locations and his painted objects, standing on their tile over the terrain, the terrain showing around them. A building is one painting or a few, each at a size and a place of its own about the tile's middle and drawn back to front, a painting of his made for a whole tile drawn at the terrain's own scale. A city from the Stone Age on is his thatched village, one of his four picked by the tile's place, the player's and the neutral's alike, so the border and the badge are what tell whose it is; the hearth is three of his yurts. The shelter is his longhouse, the farm his granary behind his field, the tannery his open shed and his furs, the megalith his carved stone, the fishery his dock and his fishing net. The monument's three stages lie on one patch of dark earth, 42 units wide and 30 tall, soft at its edge, drawn by code and the same under all three, so the stones read on the plain, the hills and the desert alike: his rocks, then his stone circle, then the circle with his carved pillar standing in it. A forest tile carrying one of them wears his clearing in place of its forest, one of his two picked by the tile's place, so the building stands in a gap and not on the treetops. The feature's disc and the improvements beside it are drawn over a building, and the herd and the pond lie under it. On the infopanel a building's row and its card's head read the same paintings, the patch among them, fitted to their box by what is painted. A building his sets lack is composed from his pieces by code.

**Sites and camps** 🔧 are to be his painted locations as the buildings are; until then each is a shape in its own colour."

_Two families_, the Pictures bullet: unchanged.

_The packs_, the Baumgart bullet: after "his painted objects and his resource icons", add ", and the ancient objects he sent by mail".

`public/assets/LICENSES.md`, two sections after _Icons: Strategic Resources & Goods_, in that section's form:

"## Hex Medieval-Fantasy Locations

- **What:** David Baumgart's set, in `store/hex-medieval-fantasy-locations/`, his readme beside it.
- **From:** David Baumgart, <https://dgbaumgart.itch.io/>, version 1.3.4 of February 2024, the files as released.
- **Licence:** his own terms, as his email of 2026-11-02 confirmed them: a free or commercial game may use them, modified and remixed at will; no training of an image model on them; never repackaged, sold or given away on their own. Credit to "David Baumgart" is asked, a link to <https://dgbaumgart.com> welcome. The files sit in the store, never in this repository.

## Ancient Icons

- **What:** David Baumgart's painted ancient objects, nine icons of 128 px, and his wild plants, eleven decor sprites, in `store/ancient-icons/`.
- **From:** David Baumgart, by email on 2026-11-03; not on sale, the files as he sent them.
- **Licence:** he named none for these files, and they are taken under his own terms, as his email of 2026-11-02 confirmed them for his packs: a free or commercial game may use them, modified and remixed at will; no training of an image model on them; never repackaged, sold or given away on their own. Credit to "David Baumgart" is asked, a link to <https://dgbaumgart.com> welcome. The files sit in the store, never in this repository."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the places above; `public/assets/LICENSES.md`, the two sections above.

**Scope:**

In:

- The packs enter the store. `hex-medieval-fantasy-locations/`, the whole of `C:\Users\daind\OneDrive\Bureau\Bought Assets\Hex Medieval Fantasy Locations 1.3.4\` as released, its five folders and `readme.txt` (564 files, 34 MB); `ancient-icons/`, the whole of `C:\Users\daind\OneDrive\Bureau\Bought Assets\Ancient Icons\`, nine files and `decor/` (20 files). Committed and pushed in the store's repository, the parent's pointer moved after.
- The cast, as the user set it on the mockups. A place is the piece's middle, right of and below the tile's middle, in units; a size is against the size he painted the file at beside his 256-pixel tile, so a file `w` pixels wide stands `w × size × 41.57 / 256` units wide. Pieces are drawn in the order listed, the first at the back.

  | Building | Piece | File | Size | Place |
  | --- | --- | --- | --- | --- |
  | `hearth` | yurt, back | locations `Decor/houseYurt00` | 105% | (0.5, −6.7) |
  |  | yurt, left | the same file | 95% | (−8.3, 3.2) |
  |  | yurt, right | the same file | 100% | (8.3, 4.4) |
  | `village`, `neutral-village` | thatched village | locations `Decor/villageThatched00`–`03`, one picked by the tile's place | whole tile | the tile |
  | `shelter` | longhouse | locations `Decor/houseLonghouse00` | 145% | (0, −1.3) |
  | `farm` | granary | locations `Decor/granaryThatched00` | 200% | (3, −9.5) |
  |  | field | locations `Decor/field00` | 120% | (−3, 4.5) |
  | `tannery` | shed | locations `Decor/foresterShed00` | 140% | (−3.6, −6) |
  |  | furs | icons `Icons/furs` | 65% | (5, 4.2) |
  | `megalith` | carved stone | locations `Decor/barrow03` | 220% | (0, −0.8) |
  | `fishery` | dock | rivers `Decor/dockE00` | 160% | (−0.5, −3) |
  |  | net | ancient icons `fishing_net` | 70% | (−1, 2) |
  | `foundations` | the patch |  |  |  |
  |  | rocks, back | terrain `Decor/rocks00` | 180% | (5.5, −8.5) |
  |  | rocks, left | terrain `Decor/rocks01` | 180% | (−8, 0.5) |
  |  | rocks, front | terrain `Decor/rocks03` | 180% | (6.5, 5.5) |
  | `great-stones` | the patch |  |  |  |
  |  | stone circle | locations `Decor/standingStones` | whole tile | the tile |
  | `monument` | the patch |  |  |  |
  |  | stone circle | locations `Decor/standingStones` | whole tile | the tile |
  |  | carved pillar | locations `Decor/obelisk00` | 153% | (0.3, −14.7) |

- A whole-tile painting, his 256 × 384 file with the ground cut away, is drawn as a face is: at the scale every painting at his tile's scale is drawn at, the seam overlap in it, his hexagon's middle on the tile's middle, as his pond is. The mockups drew it 4% smaller; the standing scale was taken at intake.
- The patch: an ellipse of dark earth about the tile's middle, 42 units wide and 30 tall, `rgb(48, 36, 24)` at 0.9 from its middle out to six tenths of its radius, then falling evenly to nothing at its rim. It is a picture made once by code, an image as the paintings are, so the fog darkens it as it darkens them. The same patch lies under the three stages.
- The village: `village` and `neutral-village` alike wear one of the four `villageThatched` paintings, picked by the tile's place through the one hash the faces are picked by. Two cities may pick the same painting.
- The clearing: a forest tile carrying a building of the cast wears `Tiles/hexForestBroadleafClearing00` or `01` of the locations pack as its face, picked by the tile's place through the same hash, in place of the forest painting its place picks. The face changes as a terraform's does: it crossfades when the building comes and when it goes, the forest back where the forest stands. A tile in fog is drawn from its snapshot, so it wears the clearing if it was built when last seen. A forest tile under a camp or a site keeps its forest: the next line's.
- Over and under: the feature's disc with its icon and the improvements are drawn over a building's paintings, every other mark keeping today's place and today's order. The herd and the pond lie under the building, so a tannery's shed hides some of its herd: accepted at intake.
- The motion: a building's pieces scale up together when it comes and shrink together when it goes, as its polygon does today. From one stage of the monument to the next the stones go and come and the patch stays as it is.
- The fog: each painting and the patch take the fog's tint as a feature's icon does.
- The infopanel: a building's row and its card's head show the building's pieces in their arrangement, the patch among them, fitted to the box the polygon is fitted to today, by the painted pixels and not by the file: a whole-tile file is mostly empty. Measured in his pixels, the paint lies at `villageThatched00` x 2–251, y 130–352; `01` x 4–246, y 121–351; `02` x 4–242, y 120–368; `03` x 3–242, y 131–354; `standingStones` x 8–251, y 91–352. Every other file of the cast is cut to its paint. Off the map a village is drawn as the first of the four.
- The names: the piece in front of each building is named `building-<key>`, as the polygon is, so a spec asking whether a building stands still reads one; the pieces behind it and the patch carry names of their own.
- Gone: the eleven buildings' entries of `BUILDING_MARKS` and of `LOOK.building`, the `WALL` staying for the camps. The catalogue test "every building of the catalogue has a name, a mark and a colour on the screen" becomes a name and either paintings or a mark with its colour, no building holding both.
- The board: the units line loses "his ancient icons entering the store", done at intake.

Out:

- The camps and the sites: their polygons, their colours and their forest stay, the next line's.
- Every other mark's place and look: the unit's mark, the improvements' marks, the worked mark, the badge. The user kept today's places (2026-11-10), each being reworked by a line below. Today's unit mark, 22 to 28 units across, stands on the tile's middle and hides most of a single-object building under it; accepted until the units line.
- A building shown as a card, with a larger picture: the cards rung's.
- A card's art box: the cards rung's.
- The three pieces past 175%, the megalith's stone, the granary and the foundations' rocks, are stretched past his pixels at the closest zoom: kept as the user set them.
- A toggle for the feature discs: an idea, in `workflow/IDEAS.md`.

Corner cases decided:

- A building on a feature tile with improvements: the row stands where it does today and overlaps the building's top; the row is on top.
- A tannery on a cattle plain: no clearing, the plain as it is. A fishery stands on coast, his water under it unchanged.
- Wildfire's Embers burning a built forest tile into plain: the building goes with the forest and the face crossfades to the plain, as today.
- A flood or a pillage removing a building from a forest tile: the clearing crossfades back to the forest painting the tile's place picks.
- A forest's feature is the deer, which tints nothing: no tinted clearing is needed.
- Both veils off draw every tile: every building of the cast is drawn.
- The yield overlay's dim and city mode's dim cover a building as they cover its polygon today.
- The simulator and the rules read no drawing: untouched.

Reconcile: the village's and the clearing's picks go through the one hash the faces are picked by; a whole-tile painting goes through the scale his pond is drawn at; the clearing goes through the face door, a second painting of the face the tile wears as a tinted painting is, and through the terraform's crossfade, widened to a face that changes on a terrain that stays; the pieces go through the sheet machinery and the pool as a feature's icons do, the patch a frame made by code beside the tinted ones; the pieces' coming and going go through the motion door the polygon walks, widened to several marks; the fog goes through the tint a feature's icon takes; the infopanel's building mark is reshaped to the pieces. The polygons of the camps and the sites stay apart until their line.

**Traps:**

- The layers (`src/ui/map.ts`, where the map groups its strata): the features layer, which holds the disc, the icon, the herd and the pond, is in the terrain stratum, under the border; the improvements layer is under the buildings layer in the buildings stratum. Today a building therefore draws over the disc and the improvements, which never showed because the polygon stood clear of the row. The line needs the disc, the icon and the improvements over the buildings and the herd and the pond under them.
- `between` in `src/ui/map-motion.ts` crossfades only when `from.terrain !== to.terrain`: a building coming onto a forest tile changes the face and not the terrain.
- The same function's building `compare` names one mark, `building-<key>`, and its `make` returns one polygon taken from `TileObjects.building`; a stage of the monument becoming the next is a building id going and another coming, which would shrink the patch and scale it up again.
- `TileObjects.building` (`src/ui/map-marks.ts`) is one Polygon a tile, made at the chronicle's open; the camps and the sites still need it, and a building of the cast is up to four images. What comes and goes in numbers is pooled (`DOGMAS.md` _Stack_); `asPainted` (`src/ui/pool.ts`) resets scale to one and a pooled image keeps its last flip, so every property is written on every take.
- The face sheet (`FACE_SHEET`, `src/ui/marks.ts`) is 4096 a side and holds 158 paintings of 256 × 384, sixteen across and ten rows down: room for 160. The two clearings fill it exactly if they go there; `asTerrain` already reads a face from either of two sheets.
- `drawSheet` (`src/ui/sheet.ts`) draws files and tinted copies; a frame drawn by code alone is new to it. A canvas texture's `refresh` uploads once, after every frame is drawn (`docs/PHASER.md`).
- A Shape carries no tint and an Image does (`docs/PHASER.md`): the patch is darkened with the paintings only as an image.
- The boot pins the batch to one texture unit (`src/main.ts`, `docs/PHASER.md`): each change of sheet within a layer is a flush.
- `fitMark` (`src/ui/infopanel.ts`) fits by `getBounds`, which reads a frame's whole size, and thins a Shape's stroke; a container of images goes through it as a unit's mark does.
- `FACE_SCALE` (`src/ui/map-marks.ts`) carries the 4% seam overlap; the single objects' sizes are against the plain 41.57 / 256.
- `e2e/fog.spec.ts` reads the city's `building-<key>` by its `fill` against `buildingColourOf`, in sight and in fog; an image answers `tint`, and `readings`' `fill` answers nothing for one. `e2e/neutral.spec.ts` and `e2e/pillage.spec.ts` ask whether `building-<key>` stands; `e2e/camps.spec.ts` and `e2e/sites.spec.ts` read polygons that stay.
- `src/content/catalogue.test.ts` holds the building test by name.
- The store is a submodule (`.gitmodules`, `https://github.com/DainDwarf/AgeOfDeckbuilder-store.git`): the packs are committed and pushed there first, with the user's credentials, then the parent's pointer moves; CI clones the submodule at the commit the pointer names.
- The locations pack holds the same sprite under two names in places (`forester_hut00` and `foresterHut00`); the cast names the files it reads.
- `docs/PHASER.md` is cited, not restated, for the render facts a spec meets: a spec rests before it reads what a motion changed.

**Plan:**

1. The two packs into the store with their licence entries. Leaves standing: the store holding them, `LICENSES.md` naming them, nothing drawn.
2. The paintings in the sheets: every file of the cast, the two clearings, the patch made by code. Leaves standing: a game that boots with them and draws the polygons still.
3. The cast in place of the eleven polygons on the map, named as the polygon was, with the fog's tint, the motion door widened and the patch staying between stages; the row drawn over the buildings; the eleven marks and colours gone; the catalogue test rewritten; the specs that read a city's fill reading its tint. Leaves standing: the buildings painted, the camps and the sites as they were.
4. The clearing under a built forest tile, with its crossfade. Leaves standing: the map as designed.
5. The infopanel's row and head. Leaves standing: the line's design.
6. `docs/LOOK.md`'s edits, the proof spec, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/map.spec.ts`, one test added: with the uncharted veil off through the console, for every tile of the chronicle holding a building of the cast, `building-<key>` stands and draws a frame of one of that building's files, a village's one of the four; every forest tile among them draws a clearing's frame as its `tile-<key>` and every other forest tile a forest's; every camp's and every site's `building-<key>` stands still; run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `fog`, `neutral`, `pillage`, `camps`, `sites`, `inspect`, `monument`, `fishery`, `tannery`, `landing`, `settle`, `boot`, `failed-boot`, and the rest of the suite.
