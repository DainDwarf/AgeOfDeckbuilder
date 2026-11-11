# The clay pit

**Line:** **The clay pit** — a clay pit stands in the row as his clay on a pale disc of the feature's size, a unit from a flint's disc, and his worked pit lies on its hill, large about the middle of a tile with no building, small beside a megalith or a shelter, absent under any other building; the infopanel's row reads his clay bare; the clay pit's stone shape gone. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md`, two places, written out here.

_The map_, a paragraph added after **Features**:

"**Improvements** are told as a feature is, by his icon on a disc in the same row: the icon 14 units wide, the disc the feature's turned pale with a dark rim, so what was placed reads apart from what the land holds, and two discs side by side stand a unit apart. The rest is flavour lying on the land: his painting of the improvement lies on the tile's ground as a herd and a pond do, under whatever stands on the tile. It lies large about the tile's middle while the tile carries no building, small at one side beside a building that leaves it room, and not at all under a building that fills its tile, where the disc alone tells it. A megalith and a shelter leave room; a city, the monument's three stages, a site and a camp fill their tile. A clay pit is his clay on the disc and his worked pit on the hill, 27 units wide alone and 16 beside a building. An improvement's row on the infopanel's cards reads the same icon, bare. The trapping, the irrigation and the pasture 🔧 are to be told the same way; until then each is a shape in the stone of worked things."

_The pieces on the map_, in **A building and a city's own building**, the sentence "The feature's disc and the improvements beside it are drawn over a building, and the herd and the pond lie under it." becomes:

"The feature's disc and the improvements beside it are drawn over a building, and the herd, the pond and an improvement's painting lie under it."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the two places above. `public/assets/LICENSES.md`: none, both files come from packs already in the store with their entries.

**Scope:**

In:

- The disc, as the user took it on the mockup (https://claude.ai/artifact/CUgxTrcZucAzVpvLopbJBP, 2026-11-11), Claude's starred disc and icon, the pit and its places the user's by paste. The feature's disc in everything but its two colours: 9 units of radius, the icon 14 wide, the rim 1 unit. The fill is the stone worked things wear (`LOOK.built`, 0xcfc6b4) at 94%; the rim is the map's outline colour (0x0d1014) at 90%. The mockup drew the rim 1.2 units; the user took the feature's 1 at the reconcile.
- The icon: icons `Icons/clay`.
- The row: its order and its centring stand. Two discs side by side stand 19 units centre to centre; a mark beside a stone shape keeps today's 11. A flint hill carrying a clay pit is the one row of two discs today's content reaches, the flint's first.
- The pit: locations `Decor/clayPit01`, his worked pit, 240 × 200 of his pixels. A size is against the size he painted the file at beside his 256-pixel tile, as the buildings' are; a place is the painting's middle, right of and below the tile's middle, in units.

  | The tile carries        | Size | Place   | Width      |
  | ----------------------- | ---- | ------- | ---------- |
  | no building             | 70%  | (0, 3)  | 27.3 units |
  | a megalith or a shelter | 40%  | (10, 8) | 15.6 units |
  | any other building      | none |         |            |

- The shape of the declaration, sized by the user for the three lines after this one: an improvement has two drawings, one alone on its tile and one beside a building, and a building says only whether it leaves room. The megalith and the shelter leave room. Every other building of both ages does not, the city's, the monument's three stages, the camps and the sites among them, and a building added later leaves none until its own intake says so. No place per building, no place per pair.
- The pit lies with the herd and the pond: on the ground, under the claim marks, the border, the lit stratum and whatever stands on the tile. One file, no pick by place, no flip.
- Fog: the disc, its icon and the pit darken as every mark does, read from the face the map draws.
- Motion, through what stands: the disc and its icon come, go and slide as a feature's disc and icon do. The pit comes and goes as a herd or a pond does. The pit alone and the pit beside a building are two marks: when a building that leaves room comes onto a pit's tile the large pit shrinks away and the small one grows, and the reverse when it goes; when a building that fills its tile comes, the pit shrinks away and nothing grows.
- The infopanel's row and the card a name shows read his clay bare, as a feature's row reads its icon.
- Gone: the clay pit's entry among the stone shapes. The three other improvements keep theirs, with `LOOK.built`, the polygon pool and `UNREAD`.
- The catalogue test "every improvement of the catalogue has a name and a mark on the screen" becomes a name and either an icon with its painting or a stone shape, never both.
- The pool: `workflow/LOOK.md`'s bullet for the improvements was rewritten at this intake with what was settled.

Out:

- The improved disc a pasture and a trapping change their feature's disc into: the pasture's intake. The mockup's last band showed the feature's icon on this pale disc as one way; the user did not answer it.
- Today's unit mark hides the pit under it: the units line's.
- The megalith's top stands under the disc, as every single-object building's does: the standing finding, the places kept.
- The pit on a city's tile, on the monument's patch, on a site's or a camp's tile: served on the mockup, off by Claude's recommendation, left off by the user.
- His bare pit, his bricks, his pottery, a smaller disc, the feature's own dark disc: served and not taken.
- A building shown as a card, an improvement's card: the cards rung's.

Corner cases decided:

- A clay pit on the city's tile, a hill: the disc alone.
- A site's tile carries a pit for the rest of the turn a worker places one on it, and a camp's for as long as the camp stands: the disc alone; once the capture empties the slot the pit lies alone.
- The flint removed from a pit's tile: the flint's disc goes and the clay pit's slides to the middle, as marks staying do today.
- A row of a disc beside a stone shape is reached by no content, the clay pit naming hills alone and no other improvement naming them; it takes the 11.
- The neutral's worker places clay pits too: the same drawing.
- Both veils off draw every tile: every disc and every pit.
- The monument's stages show no pit, so the pit never meets the patch.
- The simulator and the rules read no drawing: untouched.

Reconcile, each taken by the user as recommended: the clay pit's disc and the feature's become one, the two colours its parameter, the rim the feature's; the row's 19 and 11 stay apart until the last stone shape is gone; the pit lies as the pond does, with a size and a place as a building's piece has; the infopanel's row goes through the feature's bare icon as it is; a building coming or going swaps two marks through today's motion, nothing changing size in place; the fog goes through the standing tint as it is.

**Traps:**

- The improvements' pool (`src/ui/map.ts`) holds polygons, and `improvementOn` hands one out by the name `improvement-<id>-<key>`; the three shapes still need it. A feature's disc and icon are kept per tile (`TileObjects.feature`, `featureDisc`) under `feature-disc-<key>` and `feature-<key>`, and `src/ui/map-motion.ts` walks both names in one `compare`.
- `rowOf` (`src/ui/map-marks.ts`) lays every slot at one pitch, and `between` in `src/ui/map-motion.ts` reads it for the face before and the face after to slide what stays.
- `lyingOf` is keyed on a feature and `between` compares the lying marks by the feature's id; a pit lies on tiles with no feature, and its two drawings change with the building, not with the feature.
- A Shape carries no tint (`docs/PHASER.md`): the disc darkens through `darkened`, an image through `asDarkened`. A pooled image keeps its last flip and `asPainted` resets scale to one (`src/ui/pool.ts`): every property is written on every take.
- A tile in fog is drawn from its snapshot: the disc and the pit read the face the map draws, never the chronicle's tile.
- The features sheet (`featureSheet` in `src/ui/marks.ts`, 2048 a side) holds the icons, the ponds and the tinted faces of every terrain a tinting feature lies on; `clayPit01` is 240 × 200 and `clay` 128 × 128, so its room is checked before they join it, or they go to another sheet.
- Which buildings leave room is the look's, beside each building's paintings (`BUILDING_PAINTINGS`), never the rules'.
- `e2e/flood.spec.ts` places a clay pit on the city's tile and asks whether `improvement-clay-pit-<key>` stands, then that it does not. `e2e/fog.spec.ts` reads `improvement-trapping-<key>` by its `fill` against `LOOK.built`, a path this line leaves as it is.
- `markOf` in `src/ui/infopanel.ts` returns the row's mark for every kind, an improvement's a polygon today; `featureMark` is the bare icon's precedent.
- `src/content/catalogue.test.ts` holds the improvement test by its title.
- `DOGMAS.md` _One choke point per invariant_: the declaration's shape above is the user's sizing; the implementer widens nothing past it.
- `docs/PHASER.md` is cited, not restated: a Shape's stroke and tint, a spec resting before it reads what a render changed.

**Plan:**

1. The clay pit told by its disc: his clay in a sheet, the pale disc through the feature's disc with its colours, the row's 19 between two discs, the fog, the motion, the infopanel's row; the clay pit's stone shape gone, the catalogue test and `e2e/flood.spec.ts` following. Leaves standing: every clay pit read by its disc on the map and on the cards, nothing yet on the ground.
2. The pit on the ground: his worked pit in a sheet, the megalith and the shelter leaving room, the pit lying alone, beside or not at all, darkened in fog, swapped in motion when a building comes or goes. Leaves standing: the map as designed.
3. `docs/LOOK.md`'s two edits, the proof test, the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/map.spec.ts`, one test added: on a chronicle built headlessly with a clay pit placed on a bare hill, on a flint hill, on a megalith's hill and on the city's tile terraformed to hills, the veils off through the console, one question reads that every clay pit's disc stands in the look's pale fill with his clay's frame on it at 14 units; that the flint's disc and the clay pit's stand 19 units apart about the tile's middle; that the bare hill and the flint hill carry the pit's frame at the size and the place of the pit alone, the megalith's hill at those of the pit beside a building, and the city's tile no pit; every number read from the look's own tables, never a literal. Run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `flood`, which reads the clay pit's mark on the city's tile; `fog`, `trapping`, `irrigation`, `tannery`, which read the other improvements' shapes; `inspect` and `reference` for the infopanel's row and the card a name shows; `boot` and `failed-boot` for the sheets; and the rest of the suite.
