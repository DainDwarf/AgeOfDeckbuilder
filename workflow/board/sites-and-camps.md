# The sites and the camps

**Line:** **The sites and the camps** — both ages' camps and the three sites of both ages are drawn as the paintings of the cast below on the map and on the infopanel, a forest tile under one wearing his clearing; every tile the map draws carrying the age's camp wears the enemies' border, a city's line and band run straight along the tile's six edges in the enemies' colour, over a city's border; the last building marks, their colours and the tile's polygon gone. Doc-impact: `docs/LOOK.md`.

**Spec:** `docs/LOOK.md`, two places, written out here.

_The map_, a paragraph added after **The borders.**:

"**A camp's border.** A camp's tile wears the enemies' border: a city's line, 1.5 units wide, in the enemies' colour, run straight from corner to corner along the tile's six edges and on the edge itself, and a city's band inside it, 60% at the line and fading bell-shaped over 7 units. It is drawn over a city's border where the two meet and under the pieces, the yield overlay's dim covers it as it covers a city's, and a camp's tile in fog keeps it as last seen, darkened by the fog."

_The pieces on the map_, the paragraph "**Sites and camps** 🔧 are to be his painted locations as the buildings are; until then each is a shape in its own colour." replaced by:

"**A site and a camp** are his paintings as a building is, in everything the paragraph above says of one: one painting or a few about the tile's middle, his clearing under one on a forest tile, the feature's disc and the improvements over it, the same paintings on the infopanel. A camp's painting is its age's. A site wears nothing more, a painting on ground nobody holds being what tells it, and a camp's tile wears the enemies' border, which the infopanel leaves out."

No player-facing text: the line adds no word.

**Doc-impact:** `docs/LOOK.md`, the two places above. `public/assets/LICENSES.md`: none, every file of the cast comes from a pack already in the store with its entry.

**Scope:**

In:

- The cast, as the user took it on the mockup (https://claude.ai/artifact/WaQMwmjyRF3evPSX7u4Ckd, 2026-11-10): Claude's starred casts, the tusks' size the user's. A place is the piece's middle, right of and below the tile's middle, in units; a size is against the size he painted the file at beside his 256-pixel tile, as the buildings' are. Pieces are drawn in the order listed, the first at the back.

  | Building | Piece | File | Size | Place |
  | --- | --- | --- | --- | --- |
  | `camp` | bandit camp | locations `Decor/banditCamp00` | 115% | (0, −1.9) |
  | `stone-camp` | thatched fort | locations `Decor/strongholdThatched00` | whole tile | the tile |
  | `painted-cave`, `stone-painted-cave` | cave mouth | locations `Decor/undergroundPassage00` | 90% | (0, −2.3) |
  | `old-cairn`, `stone-old-cairn` | tall barrow | locations `Decor/barrow00` | 150% | (6.5, −4.9) |
  |  | low barrow | locations `Decor/barrow01` | 170% | (−4.5, 2.9) |
  | `beast-bones`, `stone-beast-bones` | tusks | icons `Icons/ivory` | 90% | (0, −1) |

- None of them lies on the monument's patch. The whole-tile fort is drawn as the village and the stone circle are, at the standing scale of a painting at his tile's scale; the mockup drew it 4% smaller.
- The paint, for the infopanel's fit, measured in his pixels from each file's top-left corner: `banditCamp00` x 0, y 0, 170 × 176; `strongholdThatched00` x 10, y 120, 235 × 233; `undergroundPassage00` x 0, y 1, 226 × 175; `barrow00` x 0, y 0, 78 × 77; `barrow01` x 0, y 3, 94 × 58; `ivory` x 2, y 1, 122 × 126.
- Everything a painted building has, the camp and the sites have through the same doors: the pick by the tile's place, his clearing under one on a forest tile with its crossfade when the building comes and goes, the fog's tint, the pieces scaling up and shrinking together, the feature's disc and the improvements over them, the infopanel's row and card head fitted by the paint.
- The camp's border. Every tile the map draws whose face carries the building the rules name as the age's camp wears it, however the camp came to stand: dealt, placed by an answer, left where the neutral's city fell. The line is a city's, 1.5 units wide at full strength, in the enemies' colour, straight from corner to corner along the six edges and centred on the edge, so half its width lies on the tile beside; the band is a city's, 60% at the line and 7 units deep through the border's own fade, inside the tile's hexagon alone. A tile in fog is read from its snapshot, so it wears the border if it carried the camp when last seen, the line and the band darkened by the fog's tint as a city's are. It comes and goes with the render and plays no motion of its own, as a city's border does at a claim.
- The order: the camp's border is drawn over both cities' borders, the user's call against Claude's recommendation, and over the claim marks; under the reach, the glows and the pieces, where the border stands today.
- The colour: the border reads the look's entry for the enemies, the faction being its meaning; no new entry.
- Gone: `BUILDING_MARKS` with its four shapes, `LOOK.building` and its roles, `LOOK.site`, the colour lookup they fed, the mark member of a building's look and every branch on it, and the polygon each tile keeps for a building. Every building then stands as its pieces under one name scheme.
- The catalogue test "every building of the catalogue has a name on the screen, and either paintings or a mark with its colour, never both" becomes a name and paintings.
- The pool: `workflow/LOOK.md` lost its bullet for this line at intake, and its bullet for the two unit-state lines gained the meeting below.

Out:

- The red hexagon an attackable enemy's tile and a prepared enemy's tile wear (2 units inside the edge, a flat 40% face, a 2-unit line at 90%, the same red) is drawn over a camp's border when the camp's guard is the target: two red hexagons 2 units apart, accepted by the user until "A unit's own states" and "The screen's answers on a unit" move those marks onto the unit.
- Today's unit mark hides most of a camp's painting under its guard: the units line's.
- A tell for a site: none, the user's call. The dark earth under the cairn on hills: none.
- The rounded border, red earth and a red disc were served and not taken.
- A building shown as a card, a card's art box: the cards rung's.

Corner cases decided:

- Two camps on tiles side by side wear one border round both, the shared edge bare: the edge walk's own answer, as the reach's region.
- A camp's tile is never claimable and an answer never places a camp on a held tile (`claimable` in `src/rules/city.ts`, `campTiles` in `src/rules/schedule.ts`), so a camp's border never shares a tile with a city's; beside a held tile the two lines overlap by up to 0.75 units along the shared edge, the camp's on top.
- The neutral's city falling to the enemies: its village goes and the age's camp comes on the same tile, the city's border going with the render that brings the camp's.
- A captured camp out of the player's sight keeps its painting and its border in fog until the tile is seen again.
- Both veils off draw every tile: every camp wears its border.
- The selection's rim and the aim's rims are drawn over it, as over everything.
- The fort rises above its hexagon and covers most of the band; the line along the edges is what shows, as on the mockup.
- The simulator and the rules read no drawing: untouched.

Reconcile, each taken by the user as recommended: the paintings go through the buildings' cast as it is; the camp's border and a city's become one, the camp painted by the border's own painter with the shape as its parameter, so the fog, the dim and the absence of motion are inherited; the straight shape goes through the reach's edge walk as it is, the reach's own numbers staying apart; the red hexagons on a unit's tile stay apart, accepted as above.

**Traps:**

- The border's painter (`src/ui/map-border.ts`) is keyed on the rules' `CityFaction` and `CITY_COLOURS`; the enemies are no city faction. Its memo of what it last drew from (`drawnFrom`) holds the two cities' tiles alone: a camp coming or going must move it, or the border is not painted again. One canvas holds every band, wiped on each paint.
- `stroked` there already draws a straight stretch on its edge and a curved one moved onto its tile's side; `edgeLoops` (`src/ui/border-loops.ts`) is the straight walk the reach uses, `borderLoops` its curved form. `paintBand` clips each share to its tiles' hexagons by fog, and `paintFaded` (`src/ui/map-fade.ts`) keeps the fade inside the path.
- `paintLine` sets one line style per stretch because `borderDrawn` in `e2e/chronicle-screen.ts` counts them: it reads every Graphics of the `border` layer and tallies line styles by colour. `e2e/neutral.spec.ts` compares that whole tally to `borderStretches`, which knows the two cities alone, once with the fog's veil off, where every camp is drawn; `e2e/settle.spec.ts` asks that the `border` layer shows nothing before the settle. A camp's line in that layer moves both.
- The strata (`src/ui/map.ts`): the `border` group closes the terrain stratum, under the lit stratum's reach and glows and under the buildings.
- A tile in fog is drawn from its snapshot (`drawnOf`, and `charted` for its holder in `paintBorder`): the camp's border reads the face the map draws, never the chronicle's tile.
- The age's camp is named by the rules (`ageOf(catalogue, chronicle.age).camp.building`, as `claimable` reads it); the scene reads the catalogue and hands it down (`DOGMAS.md` _Stack_).
- `TileObjects.building` (`src/ui/map-marks.ts`) is listed among what each tile keeps painted (`paintedOnTiles` in `src/ui/map.ts`); `buildingStandsAs` names a marked building `building-<key>` and a painted one `building-pieces-<key>`, the front piece being `building-<key>` either way, and `src/ui/map-motion.ts` walks buildings by that name.
- `UNREAD` stays: the improvements' and the units' polygons read it.
- `LOOK.enemy` stays: the units' colour and the target glow read it.
- The buildings sheet (`BUILDING_SHEET`, 2048 a side) packs row by row and ends near y 768 with the six new files: room. `ivory` is in the icons pack beside `furs`, which the tannery already reads into that sheet.
- A pooled image keeps its last flip and `asPainted` resets scale to one (`src/ui/pool.ts`): every property is written on every take, as the buildings' pieces do.
- `e2e/fog.spec.ts` reads the fogged camp's `building-<key>` by its `fill` against `buildingColourOf`, imported from `src/ui/marks`; an image answers `tint`, as the city's reading a few lines under it. `e2e/map.spec.ts` holds a `painted` helper and a test that asks the camps and the sites to stand as their marks. `e2e/camps.spec.ts`, `e2e/sites.spec.ts` and `e2e/neutral.spec.ts` ask whether `building-<key>` stands.
- `src/content/catalogue.test.ts` holds the building test by its title.
- `docs/PHASER.md` is cited, not restated: a canvas texture's refresh, a Shape carrying no tint, a spec resting before it reads what a render changed.

**Plan:**

1. The six files in the buildings sheet with their paint, and the cast's eight buildings as paintings; the marks, their colours, the mark member of a building's look and the tile's polygon gone; the catalogue test and the specs that read a camp's fill following. Leaves standing: every building painted, the clearing under the camps and the sites, the infopanel reading them, no border round a camp.
2. The camp's border through the border's painter, straight, in the enemies' colour, over the cities', darkened in fog, repainted when a camp comes or goes; the border specs' helpers counting it. Leaves standing: the map as designed.
3. `docs/LOOK.md`'s two edits, the proof test, the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec, `e2e/map.spec.ts`, its test of the painted buildings rewritten: with the uncharted veil and the fog's off through the console, every tile of the chronicle holding a building stands as `building-<key>` drawing a frame of one of that building's files, every forest tile among them draws a clearing's frame as its `tile-<key>` and every other forest tile a forest's, and the border's lines hold, in the enemies' colour read from the look, the six edges of every camp's tile, corner to corner by the rules' geometry, and no other stroke in that colour; run `npx playwright test e2e/map.spec.ts`. CI proves on the push, listed for the hand-back, never run locally: `fog`, `neutral`, `settle`, `camps`, `sites`, `pillage`, which read a building's mark or the border's lines, `inspect` for the infopanel, `boot` and `failed-boot` for the sheets, and the rest of the suite.
