# A unit's card reads its unit

**Line:** A unit's card reads its unit — a card that places a unit, the two settle cards among them, reads its unit's damage and its health on the pack's crossed swords and heart at the foot's two corners and its move, action, range and sight as glyphs and numbers in its text box, in place of a sentence naming it, each stat raising its name and its sentence under the pointer; `e2e/card-reads.spec.ts` passes.

The mockup every number below was picked on: https://claude.ai/artifact/HHqd3VzE5scWNtqvgEfNKd, under these settings: the stats on badges at the foot's corners, health on the pack's heart and damage on the pack's crossed swords with the number alone, a stat of nought read as 0, glyph then number, in columns 32 apart, no terrains row, the sentence gone, a stat under the pointer raising its name and its sentence, the heart's hue turned 15° and the swords' 260°, type 13 and glyphs 10. All lengths are units of a card 124 wide.

**Spec:**

_`docs/LOOK.md`, Two families._ Add after the sentence on a card's frame, in its paragraph:

> The heart and the crossed swords a unit's card reads its health and its damage on are pieces of that frame.

_`docs/LOOK.md`, The cards._ Add after the paragraph on a building that gives to the tiles in its range:

> **A unit's stats** stand on a card that places a unit, and the card reads no sentence. Its damage stands on the pack's crossed swords at the foot's left corner and its health on the pack's heart at the foot's right corner, where a card's influence stands, the swords across the card's middle from it: each badge is drawn at the scale the cost's disc is, the swords 32.6 units wide and the heart 28, and its colours are turned, the heart's by 15 degrees of hue to red and the swords' by 260 to blue. On each stands the stat's number alone, the badge saying which stat it is: the number a cost's disc reads, bold and in the disc's ink, in the map's dark outline reaching 1.2 units past its letters, its middle where the influence's stands, the swords centred on theirs and the heart's middle 1 unit under its own. The move and the action stand in the text's room over the range and the sight, each a glyph and its number 1.7 units after it, at 13 units of type with glyphs 10 units across in the text's ink; the two columns' left edges stand 32 units apart, and the four stand centred in the room as one block. A stat of nought reads 0, and the move reads in move points. No card wears a badge and an influence or a range.

Leave the section's last paragraph as it stands.

_`docs/INTERFACE.md`, A card's names and its label._ Add after the paragraph on a mark of what a card goes on:

> **A stat on a unit's card raises its tooltip.** The pointer resting on a stat a card reads of its unit, a badge at its foot or a glyph and its number in its text box, raises a tooltip beside it as the kind label's is raised: the stat's name on a line, in bold, over the sentence the infopanel's row of that stat raises. A stat reacts to no press of its own.

_`public/assets/LICENSES.md`, Nice Card Game Template 2._ "chicogames' card fronts, plain and decorated, card backs, name plates and discs" gains "and badges", and "The game turns the plain fronts to its families' colours as it loads them" becomes "The game turns the plain fronts to its families' colours, and the heart and the crossed swords to the colours a unit's card wears them in, as it loads them".

_The text table, every entry written out._

- `rules.worker`, `rules.warrior`, `rules.scout`, `rules.archer`, `rules.first-worker`, `rules.first-scout`: no sentence
- A stat's tooltip reads two entries that stand already, `label.<stat>` over `tooltip.<stat>`: nothing is authored.

The doc sentences above are Claude's, written at intake on the settled design.

**Doc-impact:** `docs/LOOK.md`, `docs/INTERFACE.md`.

**Scope:**

In, as two commits in this order, pushed together:

1. _The naming, inert._ A card that places a unit names its unit's kind in the content, once, as a card that builds names its building: the four unit cards and the two settle cards that enter a unit. Nothing on screen moves.
2. _The readings._ The two badges, the four stats in the text's room, the tooltips, the six sentences gone, the two `docs/` pages, the licence record, the spec: Worker, Warrior, Scout, Archer, and the settle cards Worker and Scout.

Measured on the mockup with the game's font: the block of two rows stands 30.7 tall in a room 39.0 tall and at most 50 wide in 88.4, on all six faces.

Out:

- The window's art. The mockup's units and ground were there to judge against; the art box stays as shipped, the paintings' lines'.
- A terrains row. No unit card and neither settle card reads where it goes or what its unit crosses: the user struck it, the aimed tiles' rim saying where a settle card lands.
- The infopanel's unit card and the small card a unit's name raises from a goal or an answer: they stay as shipped until the infopanel's own line.
- Bonus. No card places a unit whose kind carries one, and the face reads none.
- The kind labels and their tooltips.

Corner cases decided here:

- The Worker reads 0 on its crossed swords and 0 beside range's glyph.
- A card shown large, a small card and a card in a pile read the same face; a toned or worn face tones its badges as every part of it.
- The heart stands where the influence's disc and the range's disc stand; no card of today places a unit and wears either.
- In a hand of eight or more the next card covers the foot's right corner, so a unit's health shows once its card is lifted, as an influence does. Accepted.
- A stat's tooltip names the stat on the card alone; the infopanel's rows keep raising the sentence alone.
- The name of the unit leaves the card's text, and with it the small unit card a rest on it raised and the large one a right click showed. The user said yes to both.

What the reconcile chose:

- The badges go through the disc's place and its number as they stand: the foot's right corner is the influence's own, the left its mirror, the number the cost's, the dark outline the one difference that is meant.
- The badges' colours are turned as the fronts' are, when the game loads them, the files untouched.
- The four stats share the type and the glyph size of the row of what a building gives and takes, and no layout with it.
- The card's stats and the infopanel's unit card stay apart until the infopanel's line.
- A stat's tooltip goes through the way the labels of a card's foot raise theirs; the name's line is the difference that is meant.
- A unit card names its unit as a building card names its building.
- Move's, action's, range's and sight's glyphs wear the outline every glyph wears, in the text's ink. The mockup drew none; the difference is a hair of thickness.

**Traps:**

- A card says that its play places a unit and not which one: `placingOf` answers a bare `{ thing: 'unit' }` for a unit card, and `enters` and `entersOn` (`src/rules/cards.ts`) hold the kind inside their closures alone. The face has to learn it from the content, once, with no second naming typed into the text table or `src/ui/` and no branch on a card's id (`DOGMAS.md`, _Architecture_, data owns its behaviour; _Code_, single source of truth). The catalogue validates what a card says it places against its content: read it before widening the placing.
- The catalogue's coherence test reads every card's rules text through the screen's lookup: a card with no sentence must still answer it, as Farm's does.
- The labels of a face's foot are a closed set switched with a `never` check (`FootLabel`, `src/ui/card-face.ts`), and a face's objects are made once and shown or hidden (`DOGMAS.md`, _Stack_).
- The pack's files are `Health.png` and `Spades.png` in `store/nice-card-game-template-2/0 - Icons and stuffs/`, each 304 by 298 pixels, at the scale `Circle.png` is drawn at. Read off their alpha: the heart is painted from 36 to 266 across and 32 to 268 down, the swords from 18 to 286 and 36 to 262. The number's middle stands at pixel (151, 142) of the heart and (152, 150) of the swords. The face sheet's side is a power of two and its rows are padded: check its room before adding two frames.
- The mockup turned the hues with CSS `hue-rotate`, the matrix of SVG's `feColorMatrix` `hueRotate`, worked in sRGB. A tint multiplies and cannot turn a hue, and the sheet's `tinted` frames are washes, so the turn is baked into the frame as the sheet is drawn. A canvas context's `filter` is not in every browser: unverified here, check it before leaning on it.
- The number's outline is 2.4 units of stroke centred on the letters' edge, half of it under the fill. Read how Phaser's Text counts a stroke's thickness in the pinned package before setting it (`DOGMAS.md`, _Stack_).
- The bubble a foot's label raises was built for one sentence: read `src/ui/tooltip.ts` for whether it sets a bold line over a regular one. If it cannot without a change of its own, report it as a deviation and set the name regular.
- The move is fixed-point, in `MOVE_POINT` hundredths: the face reads it through the formatter the infopanel reads it through.
- No text is set under 11 units (`addText` throws).
- A spec may rest on the name in a unit card's text to raise a small card or show one large: search `e2e/` for readings of a unit card's names before the sentences go, `hover.spec.ts`, `reference.spec.ts` and `inspect.spec.ts` first. `docs/PHASER.md` for anything a spec presses or measures.

**Plan:**

1. The content's naming of the unit a play places, in `src/rules/` and the two age modules, with the catalogue's validation and its coherence test: leaves every card that places a unit naming its kind, the faces as shipped.
2. `src/ui/face.ts`, `src/ui/card-face.ts`, the card frames and their sheet, `src/ui/text.ts`, the two `docs/` pages, `public/assets/LICENSES.md`, `e2e/card-reads.spec.ts` and whatever spec leaned on a unit's name in a card's text: leaves the line's done-condition true.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The one proof spec is `npx playwright test e2e/card-reads.spec.ts`, which gains a test: on a save whose hand holds a unit card, its face reads on its badges and in its text box the numbers the catalogue gives its unit's kind, and a rest on one of its stats raises a tooltip reading that stat's name and its sentence; every number read from the rules. CI proves on the push, listed for the hand-back: `hover.spec.ts`, `reference.spec.ts`, `inspect.spec.ts`, `settle.spec.ts`, `archer.spec.ts`, `siege.spec.ts`, `browse.spec.ts`, `collection.spec.ts`, `deck-editing.spec.ts`, `launch.spec.ts`, `press.spec.ts`, `hand-aim.spec.ts`.
