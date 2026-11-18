# The Stone cards' paintings

**Line:** The Stone cards' paintings — every card of the catalogue wears David Baumgart's painting in its art box, the Stone Age's forty cast as the dossier lists them: an improvement card holds its improvement as the map lays it, the one the map tells by ditches a river and its ditches, a card may hold a ground alone, and a building or an improvement in the oval window is centred on what is painted, 8 units above the window's middle; the Nomadic Cave paintings holds its twin's red ochre; Baumgart's crafting and foraging icons stand in the store with their licence entry; the catalogue's test finds every card's painting; `docs/LOOK.md` says so; `e2e/card-reads.spec.ts` passes. Doc-impact: `docs/LOOK.md`.

Every sentence below was written by Claude at intake. The cast, the swap of Cave paintings and Old stories, and the pack are the user's picks on the mockup, https://claude.ai/artifact/4dxaGTmZgSJXUfCXsvAyre, which opens on them and is the look to match; the centring rule and the six reconcile points are Claude's, taken by the user as served.

**Spec:**

`docs/LOOK.md`, _The cards_, **The art box**, the whole paragraph replaced by:

"**The art box** is the frame's window, of one size on each front. What it holds fills it to the rim's inner edge, the oval's rise above the card's top edge included, and the glass and the shadow at its rim lie over that at 80% of the strength the pack paints them, on every card. It holds one picture made of Baumgart's paintings, the same on every copy of a card and wherever its face is drawn. A card that places a unit, a building or an improvement holds that thing as the map paints it, on a tile of a ground it goes on with the same ground round it: a tile nine tenths of the window's wider measure across, the ground at 40% of its light, the thing at its own. A unit stands on the window's middle in the halo of the civilization's colour. A building is centred across the window on what is painted of it, the middle of that 8 units above the window's middle, so the row at the window's foot leaves it clear. An improvement is its painting as the map lays it alone on a tile, centred as a building is. An improvement the map tells by ditches holds a river along its tile's two upper edges and the ditches run from it, river and ditches at their own light, the tile's middle 16 units under the window's so the river crosses the window. The city's card holds the building of the city section it is drawn under. A card that places nothing holds one of three. A place, a site, a camp or a city, painted as a building is and centred in the window on what is painted: a trophy holds the place it was won. One of his icons, three quarters of the window's smaller measure across, on a ground dimmed as any other: an action card the object of the action, a hazard its cause. Or a ground alone, dimmed. A window holding no painting shows its kind's colour, pale, filling the box as a painting does."

`docs/LOOK.md`, _Two families_, the pictures' sentence: "his painted resource icons, his painted arms and armour icons" becomes "his painted resource icons, his painted arms and armour icons, his painted crafting and foraging icons".

`docs/LOOK.md`, _The packs_, David Baumgart's entry: "his resource icons and his arms and armour icons, and the ancient objects he sent by mail" becomes "his resource icons, his arms and armour icons and his crafting and foraging icons, and the ancient objects he sent by mail".

`public/assets/LICENSES.md`, a section after _Icons: Medieval Arms & Armor_:

"## Icons: Crafting, Tools, Foraging, Herbalism

- **What:** David Baumgart's painted icons of crafting tools, crafted goods and what is foraged, 118 icons of 128 px, in `store/icons-crafting-tools-foraging-herbalism/`, his description beside them.
- **From:** David Baumgart, <https://dgbaumgart.itch.io/>, bought on 2026-11-18, version 1.2.1 of 28 April 2024, the files as released.
- **Licence:** his own terms, as his email of 2026-11-02 confirmed them for his packs: a free or commercial game may use them, modified and remixed at will; no training of an image model on them; never repackaged, sold or given away on their own. Credit to "David Baumgart" is asked, a link to <https://dgbaumgart.com> welcome. The files sit in the store, never in this repository."

No player-facing entry: the line adds no text.

**Doc-impact:** `docs/LOOK.md`; `public/assets/LICENSES.md` beside it.

**Scope:**

In, the cast, a card by its name and its id. "Placed" is the thing the card's play places. The packs: goods is `store/icons-strategic-resources-and-goods/Icons/`, arms `store/icons-medieval-arms-and-armor/icons/`, crafting `store/icons-crafting-tools-foraging-herbalism/icons/`.

| Card | Its art box holds | Ground |
| --- | --- | --- |
| Farm, `farm` | placed | plain |
| Tannery, `tannery` | placed | forest |
| Fishery, `fishery` | placed | coast |
| Megalith, `megalith` | placed | plain |
| Foundations, `foundations` | placed | plain |
| Great stones, `great-stones` | placed | plain |
| Ornaments, `ornaments` | placed, the monument | plain |
| Archer, `archer` | placed | plain |
| Raft, `raft` | placed | coast |
| Trapping, `trapping` | placed | forest |
| Irrigation, `irrigation` | placed: the river and its ditches | plain |
| Pasture, `pasture` | placed | plain |
| Clay pit, `clay-pit` | placed | hills |
| Calendar, `calendar` | his obelisk, `store/hex-medieval-fantasy-locations/Decor/obelisk00.png` | plain |
| Bread, `bread` | goods, `bread.png` | plain |
| Fire, `fire` | crafting, `bonfire.png` | forest |
| Heal, `heal` | crafting, `medicines.png` | plain |
| Food trade, `food-trade` | crafting, `kola_nuts.png` | plain |
| Goods trade, `goods-trade` | goods, `pottery.png` | plain |
| Old stories, `old-stories` | the painted cave, the building `stone-painted-cave` | hills |
| Bone tools, `bone-tools` | crafting, `horn.png` | plain |
| Cave paintings, `stone-cave-paintings` and the Nomadic `cave-paintings` | crafting, `red_ocher_pigment.png` | hills |
| Honour the dead, `stone-honour-the-dead` | the old cairn, the building `stone-old-cairn` | plain |
| Bone carvings, `stone-bone-carvings` | the beast bones, the building `stone-beast-bones` | plain |
| Pillage, `stone-stores` | goods, `foods.png` | plain |
| Capture, `stone-band-joins` | the Stone camp, the building `stone-camp` | plain |
| Dig the graves, `dig-the-graves` | crafting, `jewelry.png` | hills |
| Their land, `their-land` | the neutral's village, the building `neutral-village` | plain |
| Their stores, `their-stores` | goods, `barrel.png` | plain |
| Floodplain, `floodplain` | goods, `water.png` | plain |
| Sickness, `sickness` | crafting, `manure.png` | plain |
| Misunderstandings, `misunderstandings` | arms, `wooden_club.png` | plain |
| Wolves, `wolves` | crafting, `bones.png` | forest |
| Rain dance, `rain-dance` | nothing: the ground alone | desert |
| Embers, `embers` | crafting, `campfire.png` | forest |
| Tribute, `tribute` | goods, `foods.png` | plain |
| Cold night, `cold-night` | goods, `ice_and_snow.png` | forest |
| Unrest, `unrest` | arms, `pitchfork.png` | hills |
| Thieves, `thieves` | arms, `plain_dagger.png` | plain |
| Weary builders, `weary-builders` | crafting, `blunt_tool_pieces.png` | plain |

In, the picture, every length in units of a card 124 wide; what the Nomadic cards settled stands wherever this does not change it:

- **A building in the oval window** is centred on what is painted of it, its patch counted where it lies on one, as the arched window centres a place; the middle of what is painted stands on the window's middle across and 8 above it. The ground goes with it: the middle tile's middle is wherever that puts it. The rule of a tile's middle raised 5 leaves. This moves two Nomadic pictures: the Shelter comes down about 3, the village on Settlement about 3, the hearth not at all.
- **An improvement** is its painting as the map lays it alone on a tile, at that size, centred as a building is, 8 above the window's middle. Its tile wears what the map gives a tile carrying it: his clearing where the improvement opens one. No disc, no feature's herd, no feature's tint.
- **An improvement the map tells by ditches** holds no painting of its own: a river runs the upper edges of the ground's middle row from one side of the ground to the other, so along the middle tile's two upper edges, his pieces picked as the map picks them at the map's centre, and the ditches run from those two edges into the middle tile as the map lays them there. The middle tile's middle stands 16 under the window's middle. The land is dimmed as any ground; the river and the ditches are drawn over the dim, at their own light.
- **A ground alone** is the ground dimmed with nothing on it, the middle tile's middle on the window's middle.
- **A lone icon** from the crafting pack is drawn as any lone icon; so is his obelisk, by its file, 85 by 111 of his pixels.
- **A forest under an icon or a unit** is his forest as painted; under a building or an improvement that opens it, his clearing, as on the map.

Out:

- A shore: the Fishery and the Raft stand on water all round. A shore was shot and does not show inside the window.
- Every other Nomadic card: the user kept the Nomadic cast as it stands but Cave paintings.
- The infopanel's cards, the card back, the launch pile's ring.

Corner cases decided here:

- Several cards hold one painting, and that is meant: Pillage, its Nomadic twin and Tribute his foods, the two Cave paintings his red ochre, Old stories the painted cave the Nomadic line gave Cave paintings. The user: "The card colour and type is already differentiating them".
- Ornaments holds the monument, the building its play places, on plain though it is built over the great stones.
- Their land holds the neutral's village and not the player's: the place it was won.
- A Stone trophy that is a Nomadic trophy's twin is cast on its own entry: Capture holds the Stone camp where its twin holds the Nomadic one.
- The great stones, the monument, the Stone camp and the village are painted a tile wide and pass the oval's and the arched window's sides: the art box cuts them, as it cuts the village today.

What the reconcile chose, each taken by the user as recommended:

1. The oval window's centring and the arched window's become one, centred on what is painted, the oval's raised 8; the raise of the tile leaves.
2. An improvement goes through the map's own painting of it and the map's own clearing.
3. The river and the ditches go through the map's own river pieces and ditches; what differs is meant: on the card the water is not dimmed with the land.
4. A ground alone is one more thing a picture holds, beside a unit, a building, an improvement and an icon.
5. A twin is cast on its own entry.
6. The catalogue's test says every card of the catalogue holds a painting.

**Traps:**

- The pack is not in the store. Its files are at `C:\Users\daind\OneDrive\Bureau\Bought Assets\Icons Crafting Tools Foraging Herbalism 1.2.1`, a folder `icons` of 118 files and a `description.txt`. The store is a private repository mounted at `public/assets/store/`: the pack is committed and pushed there before the pointer moves on `main` (`DOGMAS.md`, _Stack_), or CI is red.
- The art sheet (`src/ui/art-sheet.ts`) is 2048 a side and a sheet with no room left is refused as it is drawn (`src/ui/sheet.ts`), at boot and in no Vitest test. An arched picture is 423 by 324 of the pack's pixels and an oval one 340 by 447; after this line the sheet holds about 33 arched and 19 oval pictures and some twenty icon files, about 7.7 million pixels against the 4.2 million a 2048 sheet has. `docs/PHASER.md`, _Textures_: mipmaps come only on a power-of-two sheet, and a small card minifies its picture about three times. How the room is found is the implementer's; the report states what the boot gains in time.
- A sheet reads paintings of sheets drawn before it. An improvement's painting stands in the features sheet, the deer in the net a frame made there (`src/ui/marks.ts`), and the river's pieces and the ditch's file in the river sheet.
- The map lays a river's piece and a ditch on Phaser images (`src/ui/map-rivers.ts`, `ditchesOf` in `src/ui/map-marks.ts`): a piece turned a quarter turn and squashed onto the corner lattice, a ditch turned and mirrored by its tile's place. The art sheet paints on a canvas. The Nomadic line shared a building's laying between the two (`pieceLaying`, `latticeAt` in `src/ui/marks.ts`); the facts of a river's and a ditch's laying are shared the same way, never copied.
- The mockup's river: the corners of the rules' lattice at x from -7 to 7, y -2 where x is even and -1 where it is odd, the ditches those of the tile at the map's centre.
- `placedThingOf` (`src/ui/face.ts`) refuses a card that places an improvement, and `paintGround` (`src/ui/art-sheet.ts`) hands the middle tile no improvement: the clearing under Trapping comes from the tile carrying it.
- A frame's name is read back by `e2e/card-reads.spec.ts` (`artFrameOf`): two pictures that differ wear two names.
- Measured on the mockup, what is painted of a building stands above its tile's middle, in units at the oval window's scale: the megalith 7, the great stones and the monument 12, the farm 8, the Shelter 6, the hearth 3. That and the raise of 5 are what the centring removes.
- `src/ui/` reads `src/content/` in a scene alone (`DOGMAS.md`, _Stack_).

**Plan:**

1. The store: the pack stands in `public/assets/store/icons-crafting-tools-foraging-herbalism/` as released, pushed. `public/assets/LICENSES.md` holds its entry.
2. `src/ui/art-sheet.ts` and what it leans on: a building in the oval window is centred on what is painted, 8 above the window's middle. An inert step for the Stone cards; the Shelter and the city's card move.
3. `src/ui/art-box.ts`, `src/ui/face.ts`, `src/ui/face.test.ts`: a picture holds an improvement, and a ground alone; a card that places an improvement holds it: one test on the fixture.
4. `src/ui/art-sheet.ts`, `src/ui/marks.ts` and the map's river and ditch laying: an improvement is painted as the Scope lays it, the one told by ditches with its river.
5. `src/ui/art-box.ts`: the cast as the Scope's table, the Nomadic Cave paintings with it; the art sheet has room for it.
6. `src/content/catalogue.test.ts`: every card of the catalogue holds a painting under each city's building, each naming what the screen draws.
7. `e2e/card-reads.spec.ts`: one test more, a hand of a Stone deck, a card that places an improvement in it, each card wearing the picture the cast names.
8. `docs/LOOK.md` as the Spec writes it; the line leaves `workflow/BOARD.md`, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/card-reads.spec.ts`. The look is the visual check's, against the mockup: a Stone hand, the collection's Stone cards, Irrigation and Ornaments shown large, a trophy at a site's capture, and the Nomadic Shelter and Settlement after the centring. CI proves on the push: `hover`, `browse`, `launch`, `collection`, `deck-editing`, `civilization-mode`, `settle`, `reference`, `deal`, `capstone`, `camps`, `sites`, `tree`, `trapping`, and the rest of the suite.
