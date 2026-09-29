# A copy is added to a deck and removed by a press

**Line:** A copy is added to a deck and removed by a press — the campaign's two moves in the rules, a copy shared by every deck it is added to, a settle card going to the settle section, and the save written at each; with it a name and a kind label on a stack and on a pile of the collection screen show the hand, as `docs/INTERFACE.md` says, where the collection mode shows the arrow until then; the hand is set from what a panel reads under the pointer, a panel answering every press through its one frame, and a panel a row leaves is laid again and stands no further than its new last line. Done when a left click on a stack of the deck editing mode adds a copy to the civilization and a left click on a row removes one, each written to the save, both panels standing where they were scrolled; the pointer is the hand over whatever answers a left click or a rest and the arrow elsewhere, in both modes. Proven by `e2e/deck-editing.spec.ts`.

**Spec:** [`docs/META.md`](../../docs/META.md) → _The collection and the deck_ (the moves: added up to the copies owned, removed, one copy standing in the deck of every civilization it is added to, the settle section holding settle cards alone; editing never changes the chronicle in progress) and _The save_ (written whenever it changes). [`docs/META-SCREENS.md`](../../docs/META-SCREENS.md) → _The collection screen_ (the deck editing mode's presses; "The panel grows and shrinks at once"). [`docs/INTERFACE.md`](../../docs/INTERFACE.md) → _The presses_ (the hand over a thing that answers a left click or a rest) and _A card's names and its label_ (a left click on a name is the card's own; the kind label answers the rest on a stack and a pile of the collection screen). [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md): **add**, **remove**. The mockup's deck editing mode, [collection-screen-mockup.html](collection-screen-mockup.html), already presses this way and is not changed.

Sentence to change in `docs/META-SCREENS.md`, _The collection screen_, second paragraph: "Each panel scrolls on its own; the screen opens with every panel at its top, and a card shown large leaves them where they stood." becomes "Each panel scrolls on its own; the screen opens with every panel at its top, and a card shown large leaves them where they stood, as a card added or removed does."

Player-facing entries: none new. The readings that change after a press are the existing `collection.in-deck`, `collection.row-copies`, `collection.cards` and `collection.empty-deck`.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

In:

- The rules: the two moves on the campaign. Adding a card to a civilization takes a copy of that card from the collection that this civilization does not hold, into the settle section for a settle card and into the deck for any other; a copy a second civilization holds is still free to add here. Removing takes one copy of that card out of the section it stands in. Adding where every copy owned is already held, and removing a card the civilization does not hold, are refused. The city section's card is in no section and neither move reaches it. Which of the free copies is added and which held copy is removed is the implementer's: the player cannot tell copies apart.
- The save written at each move, the chronicle in progress, where one stands, kept whole beside the campaign.
- The deck editing mode: a left click on a stack with a copy free adds one; a left click on a row removes one; a left click on a name of a stack is the stack's press. The stack's reading, its dimming, the row's copies, the two section counts, the empty deck's sentence all follow at once. A row whose last copy is removed goes; a card added that had no row gets one at its place in the collection's order. No glide.
- Both panels laid again after each move, each at the offset it stood at, a panel now reaching less standing no further than its last line.
- The hand: over a thing of a panel that answers a left click, and over a name or a kind label of a card face in a panel, which answer the rest; the arrow elsewhere in the panel. So: in the collection mode, a stack is the arrow but over its names and its kind label, and a pile is the hand all over (as today). In the deck editing mode, a stack with a copy free is the hand all over; a wholly held (dimmed) stack is the arrow but over its names and its kind label; a row is the hand; the city section's row is the arrow and still answers the right click.

Out:

- The drag across, the price, buying, the civilization mode: later lines. « Civilization stays as it is.
- The launch screen: unchanged; its piles read the campaign when it opens.

Corner cases decided:

- A new campaign's deck holds every copy, so the deck editing mode opens with every stack dimmed and the arrow over them: a remove is the first possible move. As designed.
- A row removed to nothing lets the next row come up under a pointer that holds still; a further click removes a copy of that card. No guard.
- Editing while a chronicle is in progress changes the next chronicle only.
- An empty deck or an empty settle section is now reachable and allowed ("no floor"); the rules draw nothing from an empty pile. Not this line's to check on the chronicle screen.

**Traps:**

- `src/rules/save.ts` (`campaignOf`) refuses at the next boot a settle card in `cards`, a non-settle card in `settle`, and one number named twice by one civilization across its two sections: the move routes by kind and picks a number the civilization does not hold in either section, in the rules, not in the screen.
- No rule yet gives a campaign a second civilization; the rules test proving a copy is shared authors its second civilization as a campaign value in the test.
- `keepSave` (`src/ui/save-entry.ts`) takes the save whole: a campaign written without the chronicle in progress drops that chronicle. `savedOpening()` holds it with its region and civilization.
- The collection screen reads `campaignHeld()` once in `create`; after a write, what it lays is read from the campaign as it now stands.
- `src/ui/panel.ts`: the hand's predicate reads `Held.press` alone today; the rest on a name or a kind label is known to the card face (`nameAt`, `kindAt`, read in `answersOf`, `src/ui/stack.ts`). A relaid panel is a new `createScroll`, standing at zero; `Scroll.stand` and `Scroll.reach` hold an offset within the reach.
- `docs/PHASER.md`: the cursor written only at an edge, wrong under a resting pointer when an object comes live or goes down — a press relays both panels under a pointer that holds still; a hit test from inside an input handler — the relay runs from a click, as the pile's press already does; the wheel reaching the topmost interactive object alone.
- A small card raised by a rest on a stack's name goes down with the relaid panel; it rises again on the next rest.
- `e2e/collection.spec.ts` asserts the arrow at a stack's centre in the collection mode; that point is not a name, and the assertion stays true.
- A spec rests a drawn frame after each press before it reads or presses again.

**Plan:**

1. `src/rules/campaign.ts` and `src/rules/campaign.test.ts`: the add and the remove, proven on the fixture — a settle card lands in the settle section and another card in the deck; a copy held by one civilization is added to a second; adding past the copies owned and removing a card not held are refused; a campaign after the moves writes and reads back through the save whole.
2. `src/ui/save-entry.ts`: the campaign kept and written, the chronicle in progress kept beside it.
3. `src/ui/panel.ts`: the hand read from what answers under the pointer, the rest included; a panel laid at an offset.
4. `src/ui/collection-screen.ts`, `src/ui/deck-panel.ts`: the presses, the move and the write, both panels relaid at their offsets.
5. `e2e/deck-editing.spec.ts`: in the collection mode the hand over a stack's bracketed name and its kind label, the arrow beside them; in the deck editing mode the hand over a row and the arrow over the city section's row and over a dimmed stack's art, the hand over that stack's name; a left click on a row removes one copy — the row's copies, the section's count, the stack's reading and its dimming read from the rules — and a left click on the stack adds it back; the same with a settle card, which stays in the settle section; the last copy removed takes the row away; after a reload the collection screen's deck editing mode reads the edit.
6. `docs/META-SCREENS.md`: the sentence above. `workflow/BOARD.md`: the line deleted, and this file with it; the mockup stays.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof: `npx playwright test e2e/deck-editing.spec.ts`. CI's on the push: `e2e/collection.spec.ts`, `e2e/launch.spec.ts`, `e2e/campaign.spec.ts`, `e2e/manage-save.spec.ts`, `e2e/refused-save.spec.ts`, `e2e/resume.spec.ts`, `e2e/boot.spec.ts`.
