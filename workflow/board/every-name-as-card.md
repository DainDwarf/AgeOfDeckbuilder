# Every name in a text as a card

**Line:** Every name in a text as a card — a terrain or a feature named in a text, or marked at a card's window foot, shows as a card face of its own, and an improvement named shows the face of the card that places it, so every name raises a card and the grey paper is shown for nothing named. Done when: a terrain or a feature named or marked raises its own face (small at a rest, large at a right click), an improvement named raises the face of the card placing it, `createThingCard` and the grey paper's feature and improvement drawings are gone, the infopanel's own terrain card still stands on grey paper, `e2e/reference.spec.ts` proves it, and the pages below say so.

**Spec:** the mockup the user picked from, shot in the game from a throwaway copy: https://claude.ai/artifact/E9hYG7AQDsnMmWojBrr4N1 (round two is the picked state: loam, tile lit, the white move glyph on the disc, herds centred at 1.5×, the oasis's pond 01; the user's last pick, no foot mark on a feature, holds although round two's page does not show round one's switches).

- `docs/MAP-SCREEN.md`, the paragraph opening "A name on a card, or a mark at the foot of a card's window, that names a terrain, a feature or an improvement…": its first four sentences (up to "Its rows raise no tooltip.") become:

  > A name on a card, or a mark at the foot of a card's window, that names a terrain or a feature shows that thing as a face of its own, small at a rest and large at a right click. A terrain's face reads what a bare tile of it gives at income, and on its disc what entering it costs in move points — the cost a unit pays, or, where none does, the cost an embarked unit pays, and a dash where nothing crosses it; a terrain nothing crosses, ashore or embarked, reads Impassable as its text. A feature's face reads what it gives at income. One that names an improvement shows the face of the card whose play places it, as its content makes it, small at a rest and large at a right click.

  The sentences on a building and a unit kind stay as they are.

- `docs/INTERFACE.md`, _A card's names and its label_, first paragraph: "a card as its face, anything else as the card the infopanel reads it by;" becomes "a card as its face, and anything else as the face it wears ([`MAP-SCREEN.md`](MAP-SCREEN.md));". The paragraph opening "**A stat on a unit's card raises its tooltip.**" gains a last sentence: "The movement cost on a terrain's disc raises its tooltip the same way, and reacts to no press of its own."
- `docs/LOOK.md`, _The cards_:
  - _The frame_: after "…a card whose play places a unit, a building or an improvement wears the oval window, …, and every other card the arched one." add "A terrain's face wears the oval window too." The colour list "…, maroon for a challenge and ochre for a trophy." becomes "…, maroon for a challenge, ochre for a trophy, and loam brown for a terrain's face." The paragraph's last sentence "No other card wears a decorated front." becomes "A feature's face wears the decorated front too, its body, its flames and its outer rim turned to the terrain's loam brown, as light as its paper stands, the gold left as painted. No other card wears a decorated front."
  - _The art box_: before "A card that places nothing holds one of three." add: "A terrain's face and a feature's hold their tile lit: a tile of the terrain at its own light, the ring round it dimmed as any card's ground. A feature's tile wears what the map lays for it, its tint, its herd or its pond, with its disc and its icon in the row as the map draws them; a herd or a pond is centred across the window on what is painted, at one and a half times the size the map lays it, and an oasis holds his long pond."
  - _A building that gives to the tiles in its range_: add a last sentence before "No card wears both.": "A terrain's face wears what entering it costs on the same disc at the same corner, the move's glyph and the number side by side in the disc's ink, and a dash where nothing crosses it."
  - _What the thing placed gives and takes_: the paragraph's last sentence "The face a building no card places wears reads its building's yield in the same row." becomes "The face a building no card places wears reads its building's yield in the same row, and a terrain's face and a feature's read theirs there too."
  - The section's last paragraph "…; a building and a unit read on the infopanel wear their card's face." becomes "…; a building and a unit read on the infopanel wear their card's face, and a terrain, a feature or an improvement named in a text wears a face."
- `docs/GLOSSARY.md`, the **movement cost** row: "impassable" leaves its forbidden list ("move cost, terrain cost, travel cost, difficulty"). No row is added for it.
- Player-facing text, new `src/ui/text.ts` entries:
  - `kind.terrain`: `Terrain` · `kind.feature`: `Feature`
  - `kind-tooltip.terrain`: `Every tile has one: what it yields and what entering it costs`
  - `kind-tooltip.feature`: `An extra on a tile, its yield added to the terrain's`
  - the movement cost's tooltip, name over sentence as a stat's: `Movement cost` over `The move points a unit spends to enter this tile`
  - `Impassable`, the text of a terrain's face where nothing crosses it (ocean and mountain today)

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: a terrain's face and a feature's face, raised by a name in any text (a card's, an answer's, the capstone's, a plate's) and by a terrain or feature mark at a card's window foot, small and large (the stack); an improvement named resolves to the face of the card placing it; the grey paper's feature and improvement drawings and the thing card go.
- Out: the infopanel's own terrain card, which stays grey paper until the next line, **The terrain on the infopanel as a card**; its design takes another route, so nothing here is shaped for it.
- The faces, as picked: the terrain on the plain oval front in loam brown (hue 24, saturation 0.40, darkness 0.42, as a `KindColour`); the feature on the decorated front, its body turned to the same brown the way the city card's is turned to the settle grey; name on the plate; the kind label TERRAIN or FEATURE; no cost, no influence; text: the gives row (one glyph a point, the terrain's or the feature's own yields), nothing else, but Impassable on a terrain nothing crosses.
- Movement cost on the disc where a building's range stands: the move glyph and the reading in move points, the glyph in the disc's ink (white) and not the text ink the move glyph wears elsewhere. Coast reads 1, its embarked cost, as today's paper does. Ocean and mountain read "—" on the disc and Impassable as their text. Desert reads 1 and an empty text box (no yield, no row). No terrain is named by a card that places it; no feature mark at the foot of a feature's face.
- The window: a tile of the terrain, its middle tile at its own light, the two rings round it dimmed by the art box's ground tint; for a feature, the middle tile carries the feature, so a tinting feature (fertile, flint) shows its tinted painting there; a herd (deer, cattle) is the map's three copies as `lyingOf` lays them on the centre tile, centred on their painted box and scaled 1.5× about it (positions and sizes); the oasis is his pond `store/hex-basic-terrain-set/Decor/decorPond01.png`, centred on its ink and at 1.5× the map's pond scale; the feature's disc and icon stand in the row as the map draws them (15 units above the tile's middle, the map's disc radius, rim and icon width), at their map size, over the decor.
- A terrain's face and a feature's are faces of their own, built as a site's or the leader's own face is; the kind, the front and the picture are the differences.
- Corner cases decided: an improvement placed by no card, or by two, is refused as a building is, and the catalogue test holds every improvement to exactly one card placing it; the named improvement's face is the card as its content makes it, at its start, under no city section; a terrain or a feature named on a small card raises its own small card down the chain as any face's names do; the infopanel's grey paper keeps raising nothing from its rows.
- Reconcile, chosen at intake (all as recommended):
  1. A named improvement goes through the building's door: the face of the card whose play places it, one rule for both.
  2. A terrain's and a feature's face go through the own-face door a site and the leader use; kind, front and picture are the parameters.
  3. The movement cost uses the range's disc at the same corner, the symbol and the reading its parameters; the glyph on that disc reads in the disc's ink.
  4. The yield reads in the gives row improvement and building faces use; a terrain giving nothing has no row.
  5. The feature's window paints the decor and the disc through the map's own painters, as an improvement card paints its improvement as the map lays it; centring and the 1.5× size are the meant differences.
  6. The feature's decorated front is turned brown by the same turn that turns the city card's front grey, the colour its parameter.
  7. The movement cost's tooltip goes through the stat tooltip's door, with entries of its own; the grey paper stops being drawn for any name, the infopanel's terrain card keeping it.

**Traps:**

- `e2e/chronicle-screen.ts`'s `cardOnFace` reads a face's `id` as a card id and `referenceOnFace` reads a thing's reference off its data; `e2e/reference.spec.ts:207` expects no card on a terrain's small card. A terrain's or a feature's face is no card: how such a face carries what it stands is the implementer's, and the specs reading it follow.
- Fronts are turned at boot in `src/ui/card-frames.ts` (`frontsMade`) over `CARD_KINDS`, and the decorated front is made once, in the settle grey (`colourOf`); a terrain is no card kind, and the feature's decorated front is a second frame in brown beside the city's grey one.
- The move glyph's colour defaults to the text ink (`colourOf` in `src/ui/glyphs.ts`); the range glyph's is the disc ink. `showDisc` in `src/ui/card-face.ts` draws the glyph in its symbol's colour.
- Every art box picture is painted at boot into the art sheet from the list `artSheet` (`src/ui/art-sheet.ts`) enumerates; a picture not listed is not drawn. The mockup overflowed the sheet's 4096 side only because it listed dozens of variants; the line adds twelve pictures (seven terrains, five features).
- `facePaintingOn` (`src/ui/marks.ts`) returns the tinted painting where the tile carries a tinting feature: hand the middle tile its feature. The lit tile's hexagon is the squashed lattice hexagon, `cornersOf(CENTRE)` through `cornerOnLattice`; dimming everything but it leaves the art rising above the hexagon dimmed with the ring, which is what the user saw and picked.
- A herd's copies come from `lyingOf` (`src/ui/map-marks.ts`) by `pickOf` on the tile's place, each 8 units wide, flipped by a pick; on the map one copy can lie under the disc. The pond the map would pick for the art box's centre tile is pond 02, not 01.
- The glossary lint reads `src/ui/text.ts`: "Impassable" passes only once the glossary's movement cost row lets it go, in the same commit.
- `src/ui/stack.ts` shows a thing large through `createThingCard`; it goes to the face path too.
- A terrain's face reads its yield from the terrain's kind (`terrainKind`), not from a tile: no feature, improvement or river adds to it.

**Plan:**

1. The faces: a terrain's face and a feature's face in `src/ui/face.ts`, an improvement's facing through the card that places it as a building's is; the catalogue test holds every improvement to one card; `src/ui/face.test.ts` reads the terrain faces (gives, the disc's reading, Impassable on ocean and mountain, the empty desert) and a feature's. Leaves the faces readable, nothing drawn yet.
2. The look: the loam brown and the brown decorated front in `src/ui/look.ts` and `src/ui/card-frames.ts`; the move disc and its tooltip in `src/ui/card-face.ts`; the lit tile, the feature's decor, the centred herd and pond and the row disc in `src/ui/art-box.ts` and `src/ui/art-sheet.ts`; the text entries in `src/ui/text.ts`. Leaves every face drawable.
3. The names: `src/ui/small-card.ts` and `src/ui/stack.ts` draw every name as a face; `createThingCard`, the feature and improvement drawings and the `Thing` they served leave `src/ui/infopanel.ts`, whose terrain card stays. Leaves no name raising grey paper.
4. The specs: `e2e/reference.spec.ts` proves a terrain mark raising the terrain's face small and large, a feature named raising the feature's face, and an improvement named (Tanning's goal) raising its card's face; the other specs that read a named thing follow.
5. The pages and the glossary as the Spec says.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/reference.spec.ts`. CI proves on the push the whole suite, among it `e2e/card-reads.spec.ts`, `e2e/inspect.spec.ts`, `e2e/tree.spec.ts`, `e2e/press.spec.ts` and `e2e/browse.spec.ts`, which read names and marks. The look goes through the `visual-check` skill after the ship.
