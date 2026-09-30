# The civilization stands alone

**Line:** **The civilization stands alone** — in the deck editing mode « Civilization opens the civilization mode, read only: the civilization's panel over the whole room under "<name> Civilization", centred, its settle section and its deck as stacks of card faces seven to a line, each section's count beside its word, the city section's card at the head of the settle section, no copy added, removed or bought there, and Collection » at the head's left end returns to the deck editing mode on the same civilization; `e2e/civilization-mode.spec.ts` walks in, reads the mode from the rules and walks out.

**Spec:**

- The look is the mockup's, [collection-screen-mockup.html](collection-screen-mockup.html), with Mode on Civilization and "Shown as it stands after" on "The first line: read only"; where the mockup and this dossier disagree, the dossier holds.
- `docs/META-SCREENS.md`, _The collection screen_, the civilization mode's paragraph becomes, whole: "In the **civilization mode** the civilization's panel takes the whole room and the collection is not shown. The civilization's name and the word Civilization stand over the room, centred, and at the head's left end a button is the way back to the deck editing mode, reading as the way back to the collection mode does there. The panel holds the settle section and under it the deck, each under its word with the count of its cards beside the word, the city section's card counted in the settle section, and scrolls as one. Each card the civilization holds stands once in its section, as a stack of the copies the deck holds, seven stacks to a line, the lines centred in the room, in the order of the collection, and under a stack reads the copies the deck holds over the copies owned; a deck holding no card says so. The city section's card stands at the head of the settle section as a card face, a pale edge around it, nothing under it. A card there answers the right click and the rest as a card does anywhere. A copy is added and removed from there. A card added takes a copy owned that the deck does not hold, where there is one; where there is none, the one press buys a copy and adds it." The last two sentences stand as they are today: they are the next line's, and this line leaves them unanswered by the code.
- In the same section, the scrolling paragraph's "the screen opens with every panel at its top" becomes "the screen opens with every panel at its top, and so does a mode".
- Nothing else on the page moves. The deck editing mode's paragraph keeps the civilization's name alone at the panel's right end, and its two buttons as they read.
- Player-facing text, one new entry: `'collection.civilization-title': '{civilization} Civilization'`, the civilization handed its name as `civilizationName` reads it. Every other sentence is an existing entry: the way back reads `collection.to-collection` ("Collection »"), the section words `collection.settle` and `collection.deck`, a section's count `collection.cards`, the reading under a stack `collection.in-deck`, the empty deck `collection.empty-deck`.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

- In: the third mode of the collection screen; the press on « Civilization opening it on the civilization being edited; its head, its one panel, its way back.
- The head: the title centred on the room's middle at the height and in the style of the panels' words; the way back a mode button as the two of the deck editing mode are, its left end a margin in from the room's left edge, at the title's height. No line is drawn between panels: there is one panel. The word Collection does not stand.
- The panel: one block of seven stacks' width at the collection's card width and spacing, centred in the room; the section words start at the block's left edge, in the deck editing mode's section style, and the count follows its word on the same line, a small gap after it, in that mode's count style. The gaps around the section words are the deck editing mode's.
- The city section's card is the first cell of the settle section's first line, a card face alone, the pale edge of its row in the deck editing mode around it, no card under it and no reading under it. The settle cards follow it on the same line and wrap as the deck's do.
- A stack stands as a stack of the collection does, a card under its face for each copy the deck holds past the first, three at most; under it, at its left, the reading alone — no price, no button. A card the deck holds no copy of does not stand. No stack is dimmed.
- A deck holding no card: the dashed box and its sentence, as in the deck editing mode, the block's width.
- Every card face, the city section's among them, answers the right click and the rest as a stack of the collection mode does; none answers a left click and none is carried, so a press held anywhere drags the panel. The pointer is the hand over the way back and over what a card's rest answers, the arrow elsewhere.
- The panel scrolls as any panel of the screen does. The mode opens at its top, and the deck editing mode it returns to opens with both panels at their tops.
- Collection » returns to the deck editing mode on the same civilization. The way back to the collection mode is that mode's own Collection », two presses from here; the navbar's Collection stays sunk and answers nothing.
- The back key raises the menu, as in every mode; with a card shown large it takes the card down first.
- The count beside the word is the civilization mode's alone: the deck editing mode's counts stay at the panel's right edge.
- Out: adding, removing and buying in this mode, the − and + and price buttons, a card at no copy standing dimmed — all the next line's, and the mockup's other setting shows them. The mockup stays; the next line's ship deletes it.
- `e2e/deck-editing.spec.ts`, the test of the two mode buttons: its clause "a press on it leaving the mode as it stands" is no longer promised and goes, the user having agreed by this line; the rest of the test stands, the press on « Civilization moved out of it or followed by the way back.

**Traps:**

- `lay` in `src/ui/collection-screen.ts` draws the word Collection and the dividing line before it switches on the mode, and `edit` hands the panels' offsets back by their order: the civilization mode has one panel, no word Collection and no line.
- The mode is a closed union switched with a `never` check after it (`DOGMAS.md` _Code_); `shapeOf` switches on it too.
- `stackOf` draws the price button with every stack and `collectionOf` reads the campaign's whole collection; the civilization mode's stacks count the copies the deck holds, from `deckRowsOf`, and carry no button. What is shared and what is repeated is the implementer's, under _Single source of truth for facts; repetition for shape_.
- A piece the scene builds receives the catalogue as an argument (`DOGMAS.md` _Stack_).
- A text's width and height include its padding; what is placed beside a text is placed from `ownBoxOf`, as the price is beside its diamond. The count after the section word is such a placement.
- The pale edge around the city section's card is `LOOK.cityRowEdge`, at the card face's roundness grown by the edge's offset, as `src/ui/deck-panel.ts` draws it around the row.
- A panel's `Held` with no `press` carries nothing whatever it declares, and the panel reads the hand from a press being there or a rest answering (`src/ui/panel.ts`).
- The spec rests a drawn frame after the mode is laid before it presses or measures (`DOGMAS.md` _Testing_, `docs/PHASER.md`). It opens as `e2e/deck-editing.spec.ts` does and reads every count, order and reading from the rules and `src/ui/collection-layout.ts`, never a literal. A helper two spec files use moves to `e2e/chronicle-screen.ts`.
- A new campaign's deck holds every copy owned, so every stack reads its copies over the same number; the spec may plant a campaign a `removedFrom` has moved, through the game's own save writer, to read a stack holding fewer than owned and a card not standing.

**Plan:**

1. `src/ui/text.ts`, `src/ui/collection-screen.ts`, and a module beside it if the panel wants one: the third mode, laid and left; leaves « Civilization opening the civilization mode and Collection » returning from it.
2. `e2e/civilization-mode.spec.ts`: the mode opened from the deck editing mode — the title, the collection and the rows not standing, each section's count, the city section's card at the head of the settle section, each card held a stack reading its copies held over owned in the collection's order, seven to a line, no button under any; a right click on a stack and on the city section's card shows it large, the back key takes it down and then raises the menu, the mode standing; the pointer the hand over the way back and the arrow over a stack's art; a left click on a stack changes nothing of the save; Collection » returns to the deck editing mode on the same civilization. `e2e/deck-editing.spec.ts`: the one clause above.
3. `docs/META-SCREENS.md`: the sentences above; the board line and this dossier deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/civilization-mode.spec.ts`. CI's on the push: `e2e/deck-editing.spec.ts`, whose button test changes, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/menu.spec.ts`, `e2e/console.spec.ts`, `e2e/reference.spec.ts`, and the rest of the suite. Then the `visual-check` skill on the civilization mode: the title clear of the way back, the counts beside their words, the city section's edge clear of its neighbour and of the section word, the last stack's reading clear of the room's bottom when scrolled to the foot.
