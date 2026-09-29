# A copy is dragged across

**Line:** "A copy is dragged across — a card of the collection dragged onto the civilization's panel is added, and a row dragged onto the collection is removed; from then a press held on a stack carries its card, and a panel is dragged by its bare ground alone." At intake the user struck the last clause: a press held anywhere on a panel still drags it, and only a card the deck editing mode carries is taken out of that. Done-condition: in the deck editing mode, a stack with a copy free that is dragged onto the civilization's side of the room adds a copy. A row of the deck dragged onto the collection's side removes one. A card let go anywhere else slides back and changes nothing. A press held on anything else of a panel still drags the panel. `docs/META-SCREENS.md` says so, and the new test in `e2e/deck-editing.spec.ts` passes.

**Spec:** `docs/META-SCREENS.md`, _The collection screen ✅_. Two edits, written out:

- Second paragraph (the scroll): replace "a press held on the panel drags it, and the release lets it run on until it slows to a stop." with "a press held on the panel drags it, unless it lands on a card the deck editing mode carries, and the release lets it run on until it slows to a stop."
- Deck editing paragraph: replace "A press on a card of the collection adds one copy of it to the deck, and a press on a card of the deck removes one; a card dragged from one panel onto the other does the same." with "A press on a card of the collection adds one copy of it to the deck, and a press on a card of the deck removes one. A press held on either carries it instead. A stack's card is carried as a card face and a row as its row, at full strength, held where the press took it, over the panels, the navbar and the bar. While a card is carried, nothing the panels hold raises a small card or a bubble. Let go anywhere in the room on the other side of the line between the panels, the card is added or removed as a press does it, and while the carried card is over that side, a pale dashed edge stands inside it. Let go anywhere else, off the screen or under a scrim, the card slides back to where it was lifted from and nothing changes. A card that answers no press is carried by no press held: a stack whose copies the deck all holds, and the city section's row."

No player-facing text: the line adds no entry to `src/ui/text.ts`.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

- In: the deck editing mode's carry both ways, the drop edge, the slide home, and the scroll exception.
- A card carries exactly where it answers a left click in the deck editing mode: a stack with a copy free, and a row of the settle section or the deck other than the city section's row. A dimmed stack, the city section's row, every stack and pile of the collection mode, and anything else a panel holds are not carried. A press held on them drags the panel as today, and so does its bare ground. On a card that carries, a held press always carries and never scrolls, whichever way it moves.
- A press that stays within the drag slack is the click as today: it adds or removes.
- The carried card appears once the press passes the drag slack. It is a copy drawn over everything named above, and the stack or row it came from stands unchanged until the release.
  - A stack carries a card face at the collection's card width, in the stack's tone, which is never dimmed on a card that carries.
  - A row carries a row as the civilization's panel draws it, at that row's width.
  - Either one keeps the offset from the pointer that it had at the press.
- The landing side is the room's side of the dividing line the mode stands on: from the room's left edge to the divide for a row, and from the divide to the screen's right edge for a stack, from the room's top to its bottom, the panel's word, name and mode buttons included. A release over the navbar or the bar, on the card's own side, or off the canvas is let go anywhere else.
- **The drop edge:** a dashed outline, 2 units wide, drawn in the pale ink's colour (`LOOK.paleInk`, `0xd4d7db`), 6 units inside the landing side's box. It stands only while the carried card's pointer is on the landing side, and never on the card's own side.
- **Coming home:** the carried copy tweens back to where it was lifted from, in 150 ms (the hand's own slide home), then goes. On a landing it goes at once, and the screen is relaid through the same edit a press makes, the panels at their offsets.
- A right click while carrying: the hold stands through the right click (`docs/INTERFACE.md`, _The presses_). A right click that shows a card large raises a scrim, and the carried card comes home.
- The back key raising the menu mid-carry: same thing, the scrim sends the card home.
- The wheel while carrying scrolls the panel under the pointer as today. The carried copy still comes home to where it was lifted from on the screen.
- Out:
  - The civilization mode (its own line).
  - Dropping a card on a pile in the collection mode (no design says it).
  - A panel scrolling by itself when a carried card nears its edge.
  - The collection-scroll spec, which is the Stone Age rung's.

**Traps:**

- **The panel's frame zone is the only interactive object a panel has** (`src/ui/panel.ts`). Stacks and rows are boxes read through `heldAt`, and the zone's own Phaser drag is what scrolls today. A carry has to be taken from that same drag, decided at its start by what lies under the press.
- **Each panel's root is masked at its frame** (`src/ui/panel.ts`, the stencil). A carried copy put inside a panel's root is cut at that panel's edge, so it has to stand outside both panels' roots, over both of them.
- **Both panels must stop pointing while a card is carried**, the panel it crosses into as well as the one it left. Today `point` pauses only the panel whose own scroll is dragged.
- **`lay` destroys and rebuilds both panels on every edit.** The carried copy and the drop edge must be taken down before a relay, and must not live inside what the relay destroys while they are still in use.
- **A drag ends at any button's release** (`docs/PHASER.md`, _The pointer's readings_). A right click mid-carry fires the zone's `dragend` with the left button still down, so from there until the left button's own release the carry is the taker's. `src/ui/hand.ts`'s `carried` flag is the precedent.
- **A scrim rising lets go of the press through `letGoOfPress`** (`src/ui/design-space.ts`), which is a release off the canvas. `releasedOffCanvas` must send the card home and edit nothing, so the scrim and the off-screen release are one case.
- **`onClick` drops its press at `dragstart`** (`src/ui/design-space.ts`), so a carry never also clicks. The slack is `DRAG_SLACK` design units, scaled to device pixels by `followFactor`.
- **`divide` differs by mode** (`shapeOf` in `src/ui/collection-screen.ts`). The release point is read in design units through the stratum's `at`, never from `pointer.worldX`.
- **A carry must not reach the scroll's fling:** `scroll.release` runs a drag's speed on.

**Plan:** each step leaves the tree typechecking.

1. `docs/META-SCREENS.md`: the two edits above.
2. `src/ui/panel.ts`: a held thing may carry. A held press on one carries it and does not grab the scroll. While a card is carried, pointing pauses. A release reports where it landed, or that it landed nowhere (off the canvas, or under a scrim).
3. `src/ui/collection-screen.ts` and `src/ui/deck-panel.ts`: in the deck editing mode, the stacks with a copy free and the deck's rows carry, each drawing its carried copy. The screen owns the carried copy's place over both panels, the drop edge, the landing side read against `divide`, the slide home, and the edit through the path a press takes.
4. `e2e/deck-editing.spec.ts`: one new test, on a new campaign as the file's other tests open. Each step presses, moves in steps and releases with Playwright's mouse, resting before each press:
   - A stack with a copy free, held and moved onto the civilization's side, shows the carried copy and the drop edge before the release. The release makes the save hold `addedTo`, and the screen reads it (`readsAs`).
   - A deck row dragged onto the collection's side makes the save hold `removedFrom`.
   - A stack dragged and let go on the collection's own side leaves the save as it was. The carried copy is gone once the slide ends.
   - A dimmed stack, held and moved sideways, shows no carried copy.

   The names the spec reads are the implementer's to choose.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and the proof: `npx playwright test e2e/deck-editing.spec.ts`. CI proves the rest on the push: `e2e/collection.spec.ts`, which walks the collection mode's panels, and the whole suite.
