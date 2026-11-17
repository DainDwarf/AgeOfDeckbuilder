# A building's card reads its building

**Line:** A building's card reads its building — a card that places a building or an improvement, the settle card among them, reads on its face a row of marks of what it goes on at the window's foot and what its thing gives and takes as glyphs, in place of a sentence naming it; every face's text has three lines of room; the monument's three cards are building cards, each adding the next to the discard pile, and the monument takes no upkeep; `e2e/card-reads.spec.ts` passes.

The mockup every number below was picked on: https://claude.ai/artifact/3aVSH5rb1yaQLwgFBYybg6 (its "Your last paste" state, with the range at the foot's right corner and the text 3 units wider each side). All lengths are units of a card 124 wide, from the card's top-left corner unless said.

**Spec:**

_`docs/LOOK.md`, The cards._ Replace the sentence "**The text** stands centred on the paper under the plate, and the kind label at the paper's foot." with:

> **The text** stands under the plate, centred across on the card's middle on both fronts and wrapped 88.4 units wide. Its room runs from 1 unit under the plate's lower edge down to 1.5 units over the kind label, which is three lines of the text's type, and the text stands centred in it. **The kind label** stands at the paper's foot, its capitals 1.5 units above the foot, its letters set close.

Add after the paragraph on the cost and the influence:

> **What a card goes on** stands as a row of marks at the window's foot, on a card that places a building or an improvement: the building it is built over where it is built over one, else the features its thing goes on where it names any, else its terrains, in the order the content names them, and the river last where its thing asks for one. The row is centred across on the card's middle, the marks 1.5 units apart, each mark's middle 10.5 units above the plate's upper edge, drawn over the window, its glass and the frame's rim, so a row of four stands over the rim on both sides. A terrain is his painting of it, 15 units wide, over his hexagon in the feature disc's pale reaching 1.1 units past the painting's hexagon on every side, over the same hexagon in the map's dark outline at 85% reaching 0.6 further: the line is under the painting, so what he painted rising above the hexagon covers it. A feature is its icon on its disc as the map draws it, 15 units across. The river is its round cut, 11 units across, on the feature's disc. A building is its paintings fitted to 10.8 units on an improvement's pale disc. A hexagon is a terrain and a disc anything else, so the two are told apart by shape.
>
> **What the thing placed gives and takes** stands as one row over the card's sentence, at 13 units of type with glyphs 10 units across in their outline: a plus sign and one glyph to each point it gives at income, in the order the resource bar reads the resources, the glyphs touching and 2 units after the sign; then, 11.7 units on, a minus sign and one glyph to each point of its upkeep, laid the same way. A thing that gives nothing reads no plus, one with no upkeep no minus, and one with neither no row. The row and the sentence under it stand centred in the text's room as one block. Where the row and the sentence together would stand taller than the room, the numbers run in the sentence's own text ahead of it, their glyphs at the size a text marks a resource.
>
> **A building that gives to the tiles in its range** reads it as one text, what it gives, on which terrain, in range, and its upkeep after a comma, and wears its range on the disc a cost stands on, at the foot's right corner where a card's influence stands: range's glyph and the number side by side, in the disc's ink. No card wears both.

Leave the paragraph's last sentences on the unit's card and the infopanel as they stand.

_`docs/INTERFACE.md`, A card's names and its label._ Add after the second paragraph:

> **A mark of what a card goes on reacts as a name does.** The pointer resting on a terrain, a feature or a building marked at the window's foot of a card raises that thing small, and a right click on it shows it large, each as a name of that thing in the card's text would; the river's mark raises nothing, the river having no card.

_`docs/MAP-SCREEN.md`, The infopanel._ In "A name on a card that names a terrain, a feature, an improvement, a building or a unit kind shows that thing as one of these cards", make the opening "A name on a card, or a mark at the foot of a card's window, that names a terrain, …".

_`docs/CHRONICLE.md`, Cards._ Replace "A card no deck may hold carries no exhaust, so the exhaust pile holds only what a deck could have dealt." with:

> A card no deck may hold carries no exhaust as a keyword, so the exhaust pile holds what a deck could have dealt and the building cards the chronicle itself added, once played.

_`docs/ages/STONE.md`, The capstones, The monument._ The first sentence becomes:

> When it lands it adds **Foundations** to the top of the draw pile, the first of a chain of three building cards, the first two each adding the next to the discard pile once played: Foundations builds the first of the monument's buildings on plain, hills or desert inside the border for production, **Great stones** builds the second over the first for production, more of it, and **Ornaments** builds the monument over the second for money and culture; each stands in the tile's slot and gives nothing, the first two taking production as their upkeep and the monument none.

The rest of the paragraph stands. In The cards, the Fishery's entry keeps its sentences; where it says "to every coast tile beside it" nothing changes.

_`docs/GLOSSARY.md`._ The range row becomes:

> | **range** | The distance, in tiles, a unit attacks over, one for melee; for a building, the distance it gives yield over, one for the tiles beside it. | reach |

_The text table, every entry written out._ A name stands as the table writes one.

- `rules.settle`: `Settle your city`
- `rules.shelter`: `Win the Nomadic Age` (as it stands)
- `rules.farm`, `rules.tannery`, `rules.megalith`, `rules.trapping`, `rules.irrigation`, `rules.pasture`, `rules.clay-pit`: no sentence
- The Fishery's one text, as the player reads it: `+[food] on [terrain:coast] in range, −[production]`, one glyph to each point given and taken, the terrain the one its building gives to
- `rules.foundations`: `Add [card:great-stones] to the discard pile`
- `rules.great-stones`: `Add [card:ornaments] to the discard pile`
- `rules.ornaments`: `Win the Stone Age`
- `panel.beside`: `And {terrain} in range`

The doc sentences above are Claude's, written at intake on the settled design; the user picked "Settle your city" (Claude's draft), wrote the Fishery's text and chose "Add [card] to the discard pile" over the shorter "Add [card]".

**Doc-impact:** `docs/LOOK.md`, `docs/INTERFACE.md`, `docs/MAP-SCREEN.md`, `docs/CHRONICLE.md`, `docs/ages/STONE.md`, `docs/GLOSSARY.md`.

**Scope:**

In, as three commits in this order, pushed together:

1. _The monument's cards._ Foundations, Great stones and Ornaments are building cards, exhausted once played as any building card is. Foundations' play builds its building and adds Great stones to the discard pile; Great stones' builds over Foundations and adds Ornaments; neither carries becomes any more. The Monument takes no upkeep. Embark and Disembark keep becomes.
2. _The text's room, on both fronts and every card._ The kind label pressed down with its letters close, the text from 1 unit under the plate, centred on the card's middle and 88.4 wide. The user judged it on the oval front; the arched front follows the same rule unjudged, measured at an earlier intake to hold three lines.
3. _The readings._ The marks row, the numbers row, the inline rule, the range disc, the sentences above, on every card that places a building or an improvement: Settlement under each city, Shelter, Farm, Tannery, Fishery, Megalith, Foundations, Great stones, Ornaments, Trapping, Irrigation, Pasture, Clay pit.

Measured on the mockup with the game's font and wrap rule: as shipped 6 of the 12 building and improvement cards hold in their box; under this dossier all 14 faces hold, the numbers running inline on Foundations and Great stones and the Fishery reading its one text.

Out:

- The window's art. The mockup's scenes were there to judge the marks against; the art box stays as shipped, the paintings' lines'.
- A unit's card, the next line's. The settle cards that enter a unit keep their sentence.
- The infopanel's building card, its own line's, but for the one entry `panel.beside`.
- The kind labels and the kinds themselves, but for the three cards above.
- The texts that still pass three lines, and a name wider than its plate: the later line's.
- No tooltip on the numbers and none on the range disc.
- No range number in the content: the face reads 1 for a building that gives to the tiles beside it, the rule's own number.

Corner cases decided here:

- The river's mark raises no small card and reacts to no press of its own.
- A card built over a building reads that building alone as what it goes on, never its terrains.
- A thing whose kind names features reads its features, never the terrains under them.
- A card with numbers and no sentence stands its row alone, centred in the room; a card with neither (Settlement under a city whose building gives nothing) reads its sentence alone.
- The Fishery always reads its one text, never a row.
- A mark is toned, worn and scaled with its face as every part of it is, and on a card shown large or small reacts wherever a name of that face would.
- The range disc stands where the influence disc stands and is drawn as it is; a card of a kind that gains influence places no building.

What the reconcile chose:

- The numbers' form is the aimed card's plate's on the map, a sign and a glyph to each point: one form, each surface at its own size, the two not sharing code. The infopanel's "+2" and "Upkeep −1" chips stay apart until the infopanel's own line.
- The range disc goes through the cost's and the influence's disc as it stands.
- A mark goes through the names' own door: what a face hands as its names carries the marks too.
- The monument's cards add through the helper an answer's card is added by; the sentence is the answers' own.
- The infopanel's line under a building that gives to the tiles beside it becomes one wording with the card's: "in range".
- A building marked on a card stands on the pale disc, what was placed, never the dark one.

**Traps:**

- A building card played goes to the exhaust pile, read on the card it goes as (`src/rules/cards.ts`, `goesTo`, `lyingAs`): a building card that becomes another would be exhausted as that other and never come around. That is why the chain adds.
- The catalogue's validation refuses an exhaust keyword on a card no deck holds; a building card carries none, the exhausting being the kind's, so nothing there needs to give.
- A card says what kind of thing its play places and not which one: the thing's id, the building it is built over and the city section's building are known inside its closure alone (`builds`, `placesImprovement`, `settlesCity`). The face has to learn them from the content, once, with no second naming typed into the text table or `src/ui/` and no branch on a card's id (`DOGMAS.md`, _Architecture_, data owns its behaviour; _Code_, single source of truth). A settle card is drawn under a city section's building, or under none when a text names it.
- A text marks a resource alone, after a number, in every entry today. The inline numbers put a mark straight after a sign and marks side by side: read `src/ui/text-run.ts` for both before leaning on them, and its test.
- The catalogue's coherence test reads every card's rules text through the screen's lookup: a card with no sentence must still answer it.
- No text is set under 11 units (`addText` throws); the label's letters close is its letter spacing gone, never a smaller size.
- A face is one drawing at both sizes, every measure a share of its width, and a game object is made once and changed in place (`DOGMAS.md`, _Stack_): marks are pooled as a face's glyphs and cost discs are.
- The terrain's painting bare, the feature's disc, the river's round cut and a building's paintings are the infopanel's and the map's own marks (`src/ui/map-marks.ts`). Shot at four times the map's size, the desert's, the coast's and the ocean's paintings carried a stray speck at the top of their frame and the river's cut a sliver at its top: look at them at the card's two sizes.
- The mockup's marks jiggled as their width slid; that was the browser moving images onto whole pixels. Phaser draws a texture at the fraction it is placed at (`roundPixels` is off, `node_modules/phaser/src/core/Config.js:382`), so the game needs no rounding of its own.
- "reach" is forbidden for range (`docs/GLOSSARY.md`).
- `e2e/chronicle-screen.ts` walks the monument's chain through each card's becomes, and `e2e/reference.spec.ts` rests its third test on the building the settle card's text names: both paths are gone. `docs/PHASER.md` for anything a spec presses or measures.

**Plan:**

1. `src/content/stone.ts`, the two rules sentences in `src/ui/text.ts` in their old place, `docs/ages/STONE.md`, `docs/CHRONICLE.md`, and the specs and helpers that walk the chain: leaves the monument built through three building cards, the suite green, the faces as shipped but for those cards' kind label and last sentence.
2. `src/ui/card-face.ts` and whatever measures a face's text: leaves every card's text in a three-line room with its label pressed down, nothing else moved.
3. The content's naming of what a play places, `src/ui/face.ts`, `src/ui/card-face.ts`, `src/ui/text.ts`, `src/ui/small-card.ts` where a mark raises a card, the six `docs/` pages, the new spec: leaves the line's done-condition true.

An entry a later commit rewrites may stand in its old words until then.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The one proof spec is new, `npx playwright test e2e/card-reads.spec.ts`: on a save whose hand holds a card that places a building, its face's marks are the ones the catalogue names for it, its row reads the glyphs the catalogue's yield and upkeep give, and a rest on a terrain's mark raises that terrain's small card; every number read from the rules. CI proves on the push, listed for the hand-back: `monument.spec.ts`, `capstone.spec.ts`, `reference.spec.ts` (its third test rewritten on a mark of the settle card, no text naming a building any more), `fishery.spec.ts`, `settle.spec.ts`, `farm.spec.ts`, `tannery.spec.ts`, `trapping.spec.ts`, `irrigation.spec.ts`, `hover.spec.ts`, `inspect.spec.ts`, `browse.spec.ts`, `collection.spec.ts`, `deck-editing.spec.ts`, `launch.spec.ts`, `press.spec.ts`, `hand-aim.spec.ts`.
