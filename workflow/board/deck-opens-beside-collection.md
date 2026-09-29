# A civilization's deck opens beside the collection

**Line:** A civilization's deck opens beside the collection — a press on a pile of the collection screen opens the deck editing mode on its civilization, read only: the right panel grown to the civilization's panel, its settle section and its deck as rows under their counts, the city section's card at the head, the collection four stacks to a line reading the copies this deck holds, and **Collection »** the way back; a pile counts the city section's card among its settle cards, on the collection screen and on the launch screen. Proven by `e2e/deck-editing.spec.ts`.

**Spec:** [`docs/META-SCREENS.md`](../../docs/META-SCREENS.md) → _The collection screen_ and _The launch screen_; [`docs/INTERFACE.md`](../../docs/INTERFACE.md) → _The presses_ and _A card's names and its label_. The look is the deck editing mode of [collection-screen-mockup.html](collection-screen-mockup.html), which is settled for this mode: the sizes, the places and the colours are read from it, in the game's 1280×720 design space.

Sentences to change in `docs/META-SCREENS.md`:

- _The launch screen_, the sentence ending "and under the pile the count of its cards over the count of its settle cards." becomes: "and under the pile the count of its cards over the count of its settle cards, the city section's card counted among them."
- _The collection screen_, the deck editing mode's paragraph becomes: "In the **deck editing mode** the two panels stand side by side, the collection and the civilization being edited, and a button stands on each side of the line between them, at the height of the panels' words: on the collection's side the way back to the collection mode, on the civilization's side the way into the civilization mode. The collection stands four stacks to a line, and under a stack reads the copies this deck holds over the copies owned; a stack whose copies this deck all holds is dimmed. The civilization's panel stands under the civilization's name, at the panel's right end, and holds its settle section and under it its deck, each under its word and the count of its cards, the city section's card counted in the settle section; the panel scrolls as one. Each card is a row in a card's colours, reading its cost, its name, its kind and the copies the deck holds, the rows in the order of the collection, and a deck holding no card says so. The city section's card stands at the head of the settle section, a pale edge around its row, fixed there and never removed. A row answers the right click as a card does anywhere. A press on a card of the collection adds one copy of it to the deck, and a press on a card of the deck removes one; a card dragged from one panel onto the other does the same. A settle card is added to the settle section and removed from it the same way. The panel grows and shrinks at once. The back key raises the menu in every mode: the modes are ways of showing the one screen, and none stands over another."

Player-facing entries, written out:

- `pile.counts` stays `Cards: {cards}\nSettle: {settle}`; the settle value handed to it counts the city section's card.
- The stack's reading in the deck editing mode: `In deck {held}/{copies}`.
- A section's word: `Settle`, `Deck`. A section's count: `Cards: {cards}`.
- The two buttons: `Collection »`, `« Civilization`.
- The empty deck: `The deck holds no card`.
- The civilization's name is its existing entry (`civilization.<id>`); a row's name and kind are the card's existing entries.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

In:

- The press on a pile, anywhere on it, opens the deck editing mode on its civilization. The city section's card on the pile still answers the right click.
- The right panel 400 wide, the collection in the 640 left, laid four stacks to a line at the card width it has, centred.
- Both panels laid again at once on the change of mode, each at its top. No glide.
- The civilization's panel as the mockup draws it: the head line (button at the left, name at the right), then one scrolling panel holding Settle with its count, the city section's row, the settle rows, Deck with its count, the deck rows or the empty sentence.
- A row: the card face's paper, ink and edge, the card's corner roundness as a card of the collection has it, the kind in the face's faint ink. One row per card, its copies as `×n`. The city section's row reads no count and wears the pale edge.
- The count of the settle section is its settle cards plus one. The count of the deck is its cards.
- The stack's reading becomes `In deck {held}/{copies}` in the deck editing mode and is `Copies {copies}` in the collection mode. A stack whose every copy this deck holds stands at half strength.
- **Collection »** returns to the collection mode. **« Civilization** stands as a button will, the hand over it, and answers no press: the civilization mode is a later line's.
- A right click on a row shows its card large, the city section's row included.
- The pile's settle count, on both screens, through the one pile.

Out:

- Adding, removing, dragging, buying, the price: later lines. A press on a stack or on a row does nothing, and the pointer is the arrow over both.
- The hand over a name and a kind label of a stack or a pile: the add line's, as the board says.
- The civilization mode, which the mockup also shows.
- Any change to `src/rules/`.

Corner cases decided:

- The screen opens on the collection mode always, so a return to the screen from the navbar shows the collection mode.
- A card shown large over the deck editing mode is taken down by the back key before the menu rises, as today.
- The settle count counts the city section's card although the campaign holds it outside the deck's data: for the player it is a card.

**Traps:**

- The pile is one piece, `src/ui/civilization-pile.ts`, shared by the launch screen and the collection screen: the count changes once, and `e2e/collection.spec.ts` asserts it with the old value.
- The two panels of the collection screen are given their frames once, in the scene's `create`; nothing resizes a panel today. A panel owns a mask, a frame zone and a scroll (`src/ui/panel.ts`).
- `docs/PHASER.md`: the mask's source and what destroying the controller takes; "A Layer's `removeAll(true)` destroys nothing"; the cursor written only at an edge, wrong under a resting pointer when an object comes live or goes down — the mode changes under a pointer that holds still on the pile; a hit test from inside an input handler; the wheel reaching the topmost interactive object alone, so a button or a row laid over a panel's zone takes the wheel from it.
- A spec rests a drawn frame after the mode changes, before it presses or reads.
- No radius constant stands in `src/ui/look.ts`: the card's roundness is derived from its width in `src/ui/card-face.ts`.
- Every entry is keyed in `src/ui/text.ts`, one sentence one entry.

**Plan:**

1. `src/ui/text.ts`, `src/ui/civilization-pile.ts`, `e2e/collection.spec.ts`: the pile counts the city section's card; the entries above stand.
2. `src/ui/collection-layout.ts` and its test: what the deck editing mode lays out that a pure function can answer — the rows of a civilization in order with their copies, the two counts, the copies a deck holds of each stack — proven in Vitest on the fixture.
3. `src/ui/collection-screen.ts`, and a file beside it for the row if the implementer cuts one: the mode, the panels laid again on its change, the civilization's panel, the two buttons, the stack's reading and its dimming.
4. `e2e/deck-editing.spec.ts`: a press on a pile opens the mode; the name, the two counts and the rows read from the campaign through the rules; the stacks read the copies held; a stack wholly held is dimmed; a right click on a row shows its card large; **Collection »** returns; the back key raises the menu.
5. `docs/META-SCREENS.md`: the sentences above. `workflow/BOARD.md`: the line deleted, and this file with it; the mockup stays.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof: `npx playwright test e2e/deck-editing.spec.ts`. CI's on the push: `e2e/collection.spec.ts`, `e2e/launch.spec.ts`, `e2e/campaign.spec.ts`, `e2e/boot.spec.ts`, `e2e/console.spec.ts`, `e2e/manage-save.spec.ts`. After the ship, the `visual-check` skill on the deck editing mode.
