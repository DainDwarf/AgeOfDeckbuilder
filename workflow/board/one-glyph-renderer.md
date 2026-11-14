# One glyph renderer

**Line:** **One glyph renderer** — nothing under `src/ui/` draws a turned square: every symbol the screens draw, on the map, the cards, the infopanel, the bars, the deck panel, the plates, the tree, the collection and the ending, is its cast glyph through one renderer, its square the diamond's corner to corner, in the colours picked on the cast's page over a dark outline half a unit wide; the heart, the skull and a badge's glyph are drawn through it too; a cost the city cannot pay is marked by its red number alone; and the design pages that said diamond say the symbol's glyph.

**Spec:** `docs/LOOK.md`, _Two families_ and _The cast_, which name the symbols and their signs; the mockup the user picked on, every site today beside its glyph at the game's numbers, <https://claude.ai/artifact/Ube3uC1NTF6XjNNLEEBZM9>, opened on the recommended state, the user's picks being the four lines under _Scope_. The sentences to add or change, written out:

`docs/LOOK.md`, _The cast_, a paragraph added after its first:

> A glyph stands in a square and is as large as that square's side. It is drawn in its colour over a dark outline grown out of its shape, half a unit wide at every size it is drawn at and on every ground, so a pale glyph holds on pale paper and any glyph on any terrain. A glyph standing on a disc that has a rim of its own wears no outline.

`docs/LOOK.md`, _A unit's health bar_: "At the bar's foot stands a heart, red, 6 units across, its middle 1.5 units under the track's end, drawn over the bar with a dark edge 0.5 wide round it." becomes

> At the bar's foot stands a heart, red, 6 units across, its middle 1.5 units under the track's end, drawn over the bar in its outline.

and "a skull stands in the heart's place, white, 8 units across, with the heart's dark edge" becomes

> a skull stands in the heart's place, white, 8 units across, in its outline

`docs/INTERFACE.md`, _A card's names and its label_: "a diamond in the influence's colour and the number at the foot's right" becomes "influence's glyph and the number at the foot's right".

`docs/META-SCREENS.md`: "a diamond in the influence's colour, the word, the number" becomes "influence's glyph, the word, the number"; "the influence the achievement pays, a diamond and the number" becomes "the influence the achievement pays, its glyph and the number"; "a diamond in the influence's colour and the number in ink" becomes "influence's glyph and the number in ink"; "its diamond and its number in the greyed ink" becomes "its glyph and its number in the greyed ink".

`docs/CHRONICLE-SCREEN.md`, the ending's ledger: "the influence it paid, a diamond and the number" becomes "the influence it paid, influence's glyph and the number"; "the influence paid in all, a diamond, the word and the number" becomes "the influence paid in all, influence's glyph, the word and the number".

`docs/PHASER.md` is not changed: its entry on a stroked Polygon is Phaser's fact, and the card's aim point is still a stroked polygon.

No player-facing sentence is added or changed.

**Doc-impact:** `docs/LOOK.md`, `docs/INTERFACE.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:** The user's picks, pasted from the mockup: the outline half a unit round every glyph, over my starred share of the glyph's size; the glyph's square the diamond's corner to corner; the colours of the cast's page; a cost the city cannot pay told by its red number alone.

In, every turned square the screens draw, each becoming its symbol's glyph at the same middle:

| Where | Today | The glyph's square |
| --- | --- | --- |
| The map: a point of yield | 6 units corner to corner | 6 |
| The map: the culture threshold's plate, the plate of the yield an aimed card would give | 8 corner to corner | 8 |
| The map: a worked tile in city mode | 12 corner to corner, population's | 12 |
| A card: a cost at its head | a square of 0.8 em turned | 0.8 em × √2, 19.1 units at a card 130 wide |
| A card: a mark in its text | two thirds of the text's size corner to corner | the same, the room the text keeps unchanged |
| A card: the influence at its foot | a square of 0.55 em turned | 0.55 em × √2 |
| The infopanel: what a row gives and what an upkeep takes | a square of 0.5 em turned | 0.5 em × √2 |
| The resource bar, the meta screens' bar, the collection's price, the ending's rows | a square of 10 turned | 10 × √2 |
| The deck panel's costs | a square of 7.8 turned | 7.8 × √2 |
| A plate: a mark in its text | two thirds of the text's size corner to corner | the same |
| The tree: the influence a plate pays | a square of 8 turned | 8 × √2 |

- The symbols drawn are the six resources, population and influence, and the four that stand: health's heart, the skull, and the flame and the flag of a badge. The cast's other eight glyphs are drawn by nothing until their own lines, and nothing here names them.
- The colours: food `0x9ac464`, production `0xd37b09`, money `0xefd039`, science `0x5093d8`, population `0xf092b5`, the heart `0xef4739`; military, culture, influence and the skull keep theirs. A colour stays the one entry of its meaning, so everything reading a resource's colour follows: the city's food bar takes food's new green.
- The outline is half a unit whatever the glyph's size and whatever the card's width: the map's unit on the map, the design's on every other surface, and on a card shown large it does not grow with the face. Its colour is an entry of its own, the glyph's outline, at `0x0d1014`, the value the user picked it in.
- The map's diamonds lose their dark line 1 unit wide; the outline is what they wear.
- A badge's glyph wears no outline. The collection's greyed price draws its glyph in the greyed ink, outlined as any; the ending's crossed-out row keeps its glyph gold.
- A card's every colour goes through its tone, the glyphs' and the outline's among them. A card the city cannot pay for keeps its glyphs' colours; the red ring round the cost it is short of goes, with what drew it, and the cost's number stays red.
- What the fog and a unit's dim darken today, they darken still, the outline with the glyph: the heart and the skull, a badge's glyph. What they do not darken today, they do not darken.
- Every name a mark answers to today stays on the object that takes its place.

Out, each a later line's or a later rung's: every word, size and place; the yield overlay's sizes and dim; the worked tile's mark and place; the bar and the infopanel without their words; what a text may mark; the piles, the buttons and a technology's sign.

The reconcile, each chosen by the user as recommended:

1. The heart and the skull at a health bar's foot become one with the renderer: it draws them, and the painter that edged them goes.
2. A badge's glyph goes through the renderer, with its outline or without being what the renderer is asked.
3. A card face and a plate draw the marks of their text through the renderer; how a text keeps room for a mark stays as it is.
4. The bar's diamond and its loans to the meta bar, the collection and the ending, the deck panel's, the tree's and the infopanel's all go through the renderer, at the sizes above.
5. The outline's colour is an entry of its own.
6. His resource icons on the discs and in the infopanel's rows are pictures, and stay apart.

**Traps:**

- A Shape carries no tint and an Image does (`docs/PHASER.md`, _Shapes and Graphics_): what a turned square took as a fill colour, a glyph takes as a tint, and what the fog multiplies into a colour today (`multiplied` in `src/ui/look.ts`) it multiplies into that tint.
- An SVG is rasterised once, at the size its loader is handed (`src/ui/sheet.ts`), and a frame scales whole. The health bar's glyphs are edged today by a frame painted for one size with the colour painted in; an outline half a unit wide at every size, tinted by code, cannot be that one frame scaled.
- A sheet is minified through mipmaps only at a power-of-two side, and a canvas texture's `refresh` uploads the whole of it (`docs/PHASER.md`, _Textures_). The health bar's heart is drawn today 6 units across off 128 pixels.
- A texture is the game's, not the scene's (`docs/PHASER.md`, _Across a restart_), and the boot scene in `src/main.ts` draws every sheet: the glyphs are drawn on the chronicle screen, the tree, the collection and the ending alike.
- A Material Design file is drawn in a box of 24 with margin and a game-icons file in one of 512 with little: the glyph's square is the file's box, never its ink.
- Phaser's Text draws strings and nothing else, one style to the object (`node_modules/phaser/src/gameobjects/text/Text.js:1443-1477`): a mark in a text is an object laid over the room the run keeps for it (`src/ui/text-run.ts`), whose metrics `src/ui/text-run.test.ts` and `src/content/catalogue.test.ts` hand in.
- The specs read the marks as they are drawn: `e2e/aimed-yield.spec.ts` reads a plate's glyphs as visible Rectangles by their fill colour; `e2e/chronicle-screen.ts` strips `#edged` off the frame at a health bar's foot, gathers the infopanel's parts named `panel-yield-…` and `panel-upkeep-…`, and counts the objects named `yield-<resource>` and `assigned`; `e2e/attack.spec.ts` and `e2e/pillage.spec.ts` each hold the glyph files in a table. A reading the specs cannot make is a helper in `e2e/`, never an object shaped for it (`DOGMAS.md`, _Testing_).
- The worked tile's mark is handed out as a Rectangle to the map's grab (`src/ui/map-grab.ts`).
- `LOOK.terrain.plain` holds food's old green by coincidence; it is the plain's and does not move.
- `GLYPHS` in `src/ui/bindings.ts` is the keyboard's and no symbol.
- The comments over the map's diamond and in the infopanel point at the stroked-polygon trap; they go with the squares they guard.

**Plan:**

1. The look: the six colours and the outline's entry; standing: today's marks in the new colours.
2. The renderer, in one module of `src/ui/`, and the glyphs it draws loaded at boot; the heart, the skull and a badge's glyph drawn through it, the edging painter gone from `src/ui/marks.ts`; standing: a unit's marks as the map draws them today, by one door.
3. The map: the yields, the two plates and the worked tile; standing: no turned square on the map.
4. The card face, its ring gone, then the plate, the infopanel, the resource bar with its loans to the navbar, the collection and the ending, the deck panel and the tree; standing: no turned square under `src/ui/`.
5. The specs and their helpers follow what the screen draws.
6. The pages, as written out above; in `workflow/LOOK.md`, the mentions of a diamond that still describe the game follow; the board line and this dossier deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; no `setAngle(45)` under `src/ui/`, and "diamond" under `src/` and `docs/` in `docs/PHASER.md` alone. The proof spec is `npx playwright test e2e/aimed-yield.spec.ts`, the plate of an aimed card reading its glyphs by resource. CI proves on the push: `e2e/yields.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/map.spec.ts`, `e2e/attack.spec.ts`, `e2e/pillage.spec.ts`, `e2e/fishery.spec.ts`, `e2e/tree.spec.ts`, `e2e/campaign.spec.ts`, and the rest of the suite.
