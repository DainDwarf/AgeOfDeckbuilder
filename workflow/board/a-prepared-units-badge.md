# A prepared unit's badge

**Line:** **A prepared unit's badge** — a unit that has prepared wears a badge on itself, a flame where its prepare lands as a pillage and a flag where it lands as a capture, a unit kept in fog as last seen prepared wearing it darkened, and no tile wears a hexagon for it; `e2e/pillage.spec.ts` passes reading the badge. Doc-impact: `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** the page the design was picked on is https://claude.ai/artifact/296NXYRqUAVtSudAbSsp9h, the badge as its starred switches draw it with the rim at 0.5.

- `docs/LOOK.md`, _The pieces on the map_, a new paragraph after **The attack's marks.**:

  > **A unit's badge.** A unit that has prepared wears a badge: a disc of its faction's colour, 11 units across, with the dark rim a city's badge wears, 0.5 units wide, its middle 10 units right of its tile's middle and level with it, so it stands at the painting's upper right. On it, 8 units across, a white glyph says what the prepare lands as: a flame for a pillage, a flag for a capture. The badge is part of the unit: it is drawn over the painting, goes where the unit goes, and in fog is darkened as the painting is, disc, rim and glyph alike, so a unit a tile in fog keeps as last seen prepared wears it still. A unit on the infopanel wears none, its card's state line saying the same.

- `docs/LOOK.md`, _The map_, **The map's order.**: "the marks of the selection and the aim, which are a prepared tile's colour, the reach, a unit's ring and the attack's, the selected tile's rim, an aimed card's rims, and the path with the attack's arrow and its number; the units;" becomes "the marks of the selection and the aim, which are the reach, a unit's ring and the attack's, the selected tile's rim, an aimed card's rims, and the path with the attack's arrow and its number; the units, each with its badge;".

- `docs/CHRONICLE-SCREEN.md`, _The map's presses_: the sentence "A tile a unit has prepared on wears its faction's colour, a hexagon over its face, from the enemy phase that prepared it until the next resolves it or the unit is killed; it is drawn where the unit is drawn, so a prepared tile in fog shows nothing of it." becomes "A unit that has prepared wears a badge on itself, a flame where it will pillage and a flag where it will capture, from the enemy phase that prepared it until the next resolves it or the unit is killed; a unit a tile in fog keeps as last seen prepared wears it still, darkened with the rest of it."

- `public/assets/LICENSES.md`, a new entry after Source Sans 3, the folder's name the implementer's:

  > ## game-icons.net
  >
  > - **What:** two glyphs, white on nothing, in `game-icons/`: Fire by sbed and Flying flag by Lorc.
  > - **From:** <https://game-icons.net>, `1x1/sbed/fire` and `1x1/lorc/flying-flag`, the SVG files as downloaded on the day they entered.
  > - **Licence:** CC BY 3.0, <https://creativecommons.org/licenses/by/3.0/>. Credit is required: "Fire" by sbed, <http://opengameart.org/content/95-game-icons>, and "Flying flag" by Lorc, <https://lorcblog.blogspot.com>, from game-icons.net under CC BY 3.0. The files may be modified; this record ships with the build and is their credit until the credits screen reads it.

- No player-facing sentence: the line adds no text entry.

**Doc-impact:** `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

- In: the badge on every unit `preparedAs` answers for, the enemies' and the neutral's, in sight and kept in fog; the glyph picked by what `preparedAs` answers, the reading the unit card's state line already makes, on the chronicle as it stands with the kept unit on its tile for a unit in fog; the hexagon over a prepared tile gone with its layer, its look entry and whatever only it used; the city's badge's rim narrowed from 1.5 to 0.5, the user's call, so both badges wear one rim; the two glyph files and their licence entry; one new look entry for the ink the badge's glyph reads in, at the value the selection's white has today (`0xf2f6ff`), the value the user picked on the page.
- Out: the done dim, untouched, so `mapDim` is not split here, this line touching none of its three meanings; a unit of the player's and its states, a board line of its own; a renderer for any other glyph, the glyph rung's; the credits screen, the chrome's; the infopanel, which draws a unit with no badge; a mark for a hostile unit of the neutral's.
- Corner cases decided: on a city's tile the unit's badge stands over the city's and the two touch, as the page shows; the health an attack would remove stands under the units, so the badge covers the lower-right corner of its plate and no digit; a prepared unit selected or attackable wears its ring under it, nothing else changing; the badge is the unit's, so it stands over city mode's dim and the yield overlay's as the unit does; with the fog veil off a unit is drawn live and wears the badge it has now.
- The badge comes and goes as the hexagon does today: it fades in as the unit prepares and out as the prepare lands, over the same time, and leaves with a unit killed, shrinking with it.
- The reconcile: the city's badge and this one become one in the rim, 0.5 wide in the map's outline, and stay apart in size (14 tall against 11) and in ink (a number in the city's own ink, a glyph in white on every faction); the feature's and the improvement's discs stay apart, a dark disc what the land holds, a pale one what was placed, a faction's colour whose unit it is; the hexagon's fade in, fade out and shrink are gone through as they are; the flame or the flag goes through the reading the unit card makes; a unit kept in fog goes through the painter a unit in sight does; the tree's pin mark stays apart, on the tree alone.

**Traps:**

- A Shape carries no tint (`docs/PHASER.md`): the disc and its rim are darkened in fog through their colours, the glyph through its tint.
- The glyphs to bring are the white-on-transparent files, `https://game-icons.net/icons/ffffff/transparent/1x1/sbed/fire.svg` and `https://game-icons.net/icons/ffffff/transparent/1x1/lorc/flying-flag.svg`; the `ffffff/000000` address carries a black square under the glyph. Each is one path on a 512 `viewBox` with no width and no height of its own.
- The sheets queue their files with `load.image` (`src/ui/sheet.ts`); how Phaser sizes an SVG is read in `node_modules/phaser/src/loader/filetypes/SVGFile.js` before it is relied on: `load.svg` rasterises once, at the size given when it loads. The glyph is 8 units across on the map and has to stay sharp at the closest zoom, and a sheet's side is a power of two or it gets no mipmaps (`docs/PHASER.md`).
- The glyph files are CC BY 3.0 and sit in the repository itself, under `public/assets/`, never in the store.
- A unit's mark is read by position in several places: `asUnit`, `unitFittedBy` and `unitMark` in `src/ui/map-marks.ts`, the last moving every child to centre the mark for the infopanel.
- A render paints over whatever a motion left: what `paintUnit` stops and repaints today for the marker and the hue has to hold for the badge, an interrupted fade included.
- `src/ui/map-motion.ts` reaches the hue three ways: the fade in and out on a `prepare` change, the shrink of a unit killed, and the map view's own painter of it.
- A unit kept in fog is drawn from a pool and the snapshot keeps `prepared`; `e2e/fog.spec.ts` shows how `preparedAs` is asked of a kept unit.
- In `e2e/`: `aimDrawn` (`e2e/chronicle-screen.ts`) counts the `prepared` layer among its hexagons, `e2e/map-order.spec.ts` names that layer in the map's order, and `e2e/pillage.spec.ts` reads `prepared-<key>` and its fill.
- A game object is made once and changed in place (`DOGMAS.md` _Stack_): the badge is made with its unit's mark and shown or hidden, never made on the prepare.

**Plan:**

1. `public/assets/` and `public/assets/LICENSES.md`: the two glyph files and their entry stand, nothing reading them yet.
2. `src/ui/look.ts` and the sheets in `src/ui/marks.ts`: the glyphs stand as frames a mark can wear and the badge's ink has its entry, nothing drawing them yet.
3. `src/ui/map-marks.ts` and `src/ui/map.ts`: a prepared unit wears the badge, in sight and kept in fog; the hexagon, its layer and its look entry are gone; the city's badge wears the 0.5 rim.
4. `src/ui/map-motion.ts`: the badge fades in on a prepare and out as it lands, and leaves with a unit killed.
5. `e2e/`: `pillage.spec.ts` reads the badge, a test for the unit kept in fog added to it; `aimDrawn` and `map-order.spec.ts` follow the layer's leaving.
6. `docs/LOOK.md` and `docs/CHRONICLE-SCREEN.md` as written above; the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `npx playwright test e2e/pillage.spec.ts`: a unit that prepared a pillage wears the badge in its faction's colour with the flame and its tile no hexagon, one on a city's tile the flag, the badge gone once the pillage has landed, and a unit kept in fog as last seen prepared wears it darkened. CI proves on the push: `e2e/map-order.spec.ts`, `e2e/attack.spec.ts`, `e2e/fog.spec.ts`, `e2e/population-badge.spec.ts`, `e2e/unit-ring.spec.ts`, `e2e/neutral.spec.ts`, `e2e/map.spec.ts`.
