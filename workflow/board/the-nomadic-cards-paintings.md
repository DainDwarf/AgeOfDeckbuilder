# The Nomadic cards' paintings

**Line:** The Nomadic cards' paintings — every card the Nomadic Age brings wears David Baumgart's painting in its art box, filling the box to its rim under a glass at 80% of its painted strength: a card that places a unit or a building holds that thing on a tile of its ground, the city's card the building of its city section, a trophy the place it was won or one of his icons, every other card one of his icons on its ground; the catalogue's test finds each card's painting; `docs/LOOK.md` says so; `e2e/card-reads.spec.ts` passes. Doc-impact: `docs/LOOK.md`.

Every sentence below was written by Claude at intake. The cast, the numbers and the glass are the user's picks on the mockup, https://claude.ai/artifact/KoMKQnKDBoaSEAoQp9oyaR, which opens on them and is the look to match.

**Spec:**

`docs/LOOK.md`, _The cards_, **The art box**, the whole paragraph replaced by:

"**The art box** is the frame's window, of one size on each front. What it holds fills it to the rim's inner edge, the oval's rise above the card's top edge included, and the glass and the shadow at its rim lie over that at 80% of the strength the pack paints them, on every card. It holds one picture made of Baumgart's paintings, the same on every copy of a card and wherever its face is drawn. A card that places a unit or a building holds that thing as the map paints it, on a tile of a ground it goes on with the same ground round it: a tile nine tenths of the window's wider measure across, the ground at 40% of its light, the thing at its own. A unit stands on the window's middle in the halo of the civilization's colour. A building stands where it stands on its tile, the tile's middle 5 units above the window's, so the row at the window's foot leaves it clear. The city's card holds the building of the city section it is drawn under. A trophy holds the place it was won, a site or a camp, painted as a building is and centred in the window on what is painted, or one of his icons. Every other card that places nothing holds one of his icons, three quarters of the window's smaller measure across, on a ground dimmed as any other: an action card the object of the action, a hazard its cause. A window holding no painting shows its kind's colour, pale, filling the box as a painting does."

`docs/LOOK.md`, _The packs_, Nice Card Game Template 2: "a front turned to a kind's colour among them" becomes "a front turned to a kind's colour and its glass thinned among them".

`public/assets/LICENSES.md`, Nice Card Game Template 2, the licence line: "to its kinds' colours, and the heart" becomes "to its kinds' colours, thins the glass of every front's window, and turns the heart"; the sentence's "as it loads them" stands.

No player-facing entry: the line adds no text.

**Doc-impact:** `docs/LOOK.md`; `public/assets/LICENSES.md` beside it.

**Scope:**

In, the cast, a card by its name and its id:

| Card | Its art box holds | Ground |
| --- | --- | --- |
| Settlement, `settle` | the building of the city section it is drawn under | plain |
| Worker, `first-worker` and `worker` | the unit it places | plain |
| Scout, `first-scout` and `scout` | the unit it places | forest |
| Warrior, `warrior` | the unit it places | hills |
| Shelter, `shelter` | the building it places | plain |
| Gather, `gather` | his apples, `store/icons-strategic-resources-and-goods/Icons/apples.png` | plain |
| Hunt, `hunt` | his venison, `venison.png` of the same pack | forest |
| March, `march` | his sandals, `store/icons-medieval-arms-and-armor/icons/sandals.png` | hills |
| Hunger, `hunger` | his bone club, `bone_club.png` of the same pack | plain |
| Pillage, `stores` | his foods, `foods.png` of the goods pack | plain |
| Capture, `band-joins` | the camp, the building `camp` | plain |
| Cave paintings, `cave-paintings` | the painted cave, `painted-cave` | hills |
| Honour the dead, `honour-the-dead` | the old cairn, `old-cairn` | plain |
| Bone carvings, `bone-carvings` | the beast bones, `beast-bones` | plain |

In, the picture, every length in units of a card 124 wide:

- **The ground.** One terrain on the middle tile and on the two rings round it, laid on the map's lattice at the map's proportions, each tile wearing the one of his paintings its place picks as if the middle tile were the map's centre; under a building, a terrain he painted a clearing of wears it on the middle tile, as on the map. Every tile is at 40% of its light, the way the fog darkens a tile, by a value of its own. No dark at the rim.
- **The scale.** A tile is nine tenths of the window's wider measure across: 85.5 in the oval window, 83.5 in the arched one. The thing and an icon's ground are at that same scale.
- **A unit** is its kind's painting with its dark line and its halo in the civilization's colour, the painting's middle on the window's middle, no canoe, no badge, no bar, no sign.
- **A building in the oval window** is its pieces at their places about the tile's middle, as the map draws them, his village the one the map's centre would wear; the tile's middle stands 5 above the window's middle.
- **A place in the arched window** is the building's pieces centred on what is painted, as the infopanel centres a building, the ground's middle tile under it where the building stands on it.
- **A lone icon** is his file, its longer side 0.75 of the window's smaller measure, 51.6 in the arched window, its middle on the window's middle, bare: no disc, no halo, no line. The middle tile's middle is the window's middle.
- **The glass.** Every front's glass, the plain ones and the decorated one, is drawn at 80% of the strength the pack paints it, on every card of the game, a card with a pale window included.
- **The pale** of a window holding no painting fills the art box's whole shape as a painting does.
- **A face's tone** darkens the painting as it darkens every part of the card: a worn card, a dimmed pile.

Out:

- The Stone Age's cards: each keeps the pale window until its own line, the Stone twins of the three site trophies and of the two camp trophies among them. A card with no painting named shows the pale.
- A dark at the rim: served, and dropped by the user as redundant with the dim and the glass.
- The infopanel's grey cards, the card back, the launch pile's ring.
- Any pack not in the store. The user took what the store holds for Gather, Hunger and Capture.

Corner cases decided here:

- Under no city section the city's card holds no painting and shows the pale, as its row at the window's foot reads nothing there.
- The city's card under a city section whose building is the village holds the village: the user's answer, "the city's card change for the village once it is unlocked".
- The settle section's Worker and Scout hold what the deck's hold; the frame's grey tells them apart.
- A card holds one picture at every counter it carries and at both sizes a face is drawn at.
- The mockup lowers a place by 4 in the arched window; the rule above, centred on what is painted, is what the user took at the reconcile and lands within 2 units of that for the four places.

What the reconcile chose, each taken by the user as recommended:

1. A place in the arched window is centred as the infopanel centres a building, on what is painted, with no number; the oval keeps the tile's middle raised 5.
2. The ground's dim goes the way the fog's does, at a value of its own.
3. The fall to dark at the rim left with the dark: nothing to make.
4. The ground's paintings are picked as the map picks them, fixed as if the thing stood at the map's centre.
5. A lone icon and a feature's disc stay apart: the same pack, bare and large on the card, no disc; no halo, a halo saying unit.
6. The board's two infopanel lines show a thing as its card's face and inherit the window; nothing of theirs is done here.

**Traps:**

- The window draws nothing today: a rectangle in the kind's pale under the front (`src/ui/card-face.ts`). Its box is the front's `window` in `src/ui/card-frames.ts`, and the glass is larger than that box: 11 of the pack's pixels, 2.4 units, taller at the arched window's top, and the oval's glass rises above the card's top edge with its rim. A rectangle grown to cover it would show past the rim's curve. The art box is a shape, not a box.
- The art box's shape, as the mockup found it: on a front's file, a walk from the window's middle through every pixel that is not fully solid, stopping at solid paint. It reaches 125,133 pixels on the arched front and 121,581 on the oval, never the file's edge, and the decorated front's is the oval's. Those pixels are the glass. A cut at any lower strength is wrong: the pack paints the glass nearly solid against the rim, about 6,300 pixels a front between 240 and 254 of 255, and the mockup's first cut at 240 left them as a grey band at the border that no dial touched.
- Every placement is about the middle of the front's `window` box, not of the art box's own bounds.
- A live scene is nineteen tile faces and the thing's pieces to each face, and a hand, a browse and the collection draw dozens of faces; a mask is a filter that draws its source to a texture of its own every frame (`docs/PHASER.md`, _Filters and masks_). The game's own way for a picture made by code is a frame painted once into a sheet at boot (`src/ui/sheet.ts`), which reads paintings of sheets drawn before it. At the pack's own pixels an art box is about 340 by 430, fifteen pictures about 2.2 million pixels; a sheet's room is checked, not assumed, and so is what the boot gains in time, which the report states. Whether the pictures are made that way or another that draws the same is the implementer's; a face is made once and reads another card in place (`DOGMAS.md`, _Stack_).
- `docs/PHASER.md`, _Textures_: mipmaps come only on a power-of-two sheet, a small card minifies its picture about three times, and a frame the manager does not hold draws Phaser's missing texture and throws nothing.
- A unit's halo is one white frame tinted to a faction's colour as it is drawn, and its painting a frame with its dark line (`src/ui/marks.ts`); the fog's value is `0x4d4d4d`, 30%. The mockup laid the ground at 40% over a near-black, which reads within 3 of 255 of a plain 40%.
- Five of his icons enter no sheet today: the apples, the venison and the foods of the goods pack, the sandals and the bone club of the arms pack. The files are in the store already, under his packs' standing licence entries: no pack enters.
- The fronts are turned to their kinds' colours as the cards sheet is drawn (`src/ui/card-frames.ts`); the glass thinned is one more change to the same files, under the pack's CC BY-SA 3.0, which the licence line above covers. The card's shadow is made off the pack's file and is not the glass.
- `src/ui/` reads `src/content/` in a scene alone (`DOGMAS.md`, _Stack_): what a card's art box holds is read off the catalogue handed in, as a face's row at the window's foot is, with the city section's building beside it.
- The mockup was shot from the tree before the card types' line shipped and drew the settle frames itself; that line has shipped since, and the pages' sentences above were read against the tree after it.

**Plan:**

1. `src/ui/card-frames.ts` and what it leans on: every front's glass stands at 80%, and the art box's shape is known for each window. Nothing else moves: an inert step, the windows still pale, the pale now filling the art box's shape.
2. `src/ui/marks.ts` or a module beside it, `src/ui/face.ts`, `src/ui/face.test.ts`: the cast stands as data, a card to what its art box holds and its ground, and a face reads it under its city section: one test on the fixture for the city's card, holding its city section's building and nothing under none.
3. The pictures and `src/ui/card-face.ts`: each picture of the cast is drawn as the Scope lays it, and a face wears its card's picture under its front on every surface a face is drawn on, in its tone, changing in place when the face reads another card.
4. `src/content/catalogue.test.ts`: every card the Nomadic Age brings has a painting on the screen, and every painting names a ground, a building or a file the screen draws.
5. `e2e/card-reads.spec.ts`: one test more, a Nomadic hand's cards each wearing the picture the cast names.
6. `docs/LOOK.md` and `public/assets/LICENSES.md` as the Spec writes them; the line leaves `workflow/BOARD.md`, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/card-reads.spec.ts`. The look is the visual check's, against the mockup: the settle phase's hand, a hand of the Nomadic deck, the collection, a card shown large, a trophy at a camp's capture, and a Stone card's pale window under the thinner glass. CI proves on the push: `hover`, `browse`, `launch`, `collection`, `deck-editing`, `civilization-mode`, `settle`, `reference`, `deal`, `capstone`, `camps`, `sites`, `tree`, `trapping`, and the rest of the suite.
