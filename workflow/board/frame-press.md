# A press on a card's frame reaches the map

**Line:** A press on a card's frame reaches the map — a press on a card face's frame outside the card's body (the oval rim rising above its top, the front image reaching past its left edge) falls through the infopanel to the map, on the terrain, unit and building cards alike. Done when every card on screen takes the pointer — press, hover and rest — on everything its face draws and nowhere else: the infopanel's, the hand's, the discard pile's top, a small card, a card shown large, and a card on a panel (a browse, deck editing, a capture's reward window, the collection, the launch screen's piles); `docs/INTERFACE.md` says so; `e2e/frame-press.spec.ts` passes.

**Spec:** `docs/INTERFACE.md` → _The presses_. Insert this paragraph right after the one opening **A press lands on the thing the pointer is on, and on nothing under it.**:

> **A card is everything its face draws.** A press, a hover and a rest land on a card wherever it draws: its body, the rim of an oval window and a cost's disc rising above its top, a unit card's swords and heart standing past its sides, and the cards drawn under it, the infopanel's waiting cards and a stack's copies among them. Where what stands under the card shows between those, beside the rim and in the body's rounded corners, the pointer is on what stands under. It is so wherever a card stands: on the infopanel, in the hand, on a pile, as a small card, shown large, and in a window.

`docs/LOOK.md` → _The cards_ is the spec of what a face draws and where (the frame, the cost's disc, the swords and the heart); nothing in it changes. No player-facing text is foreseen.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: one check on the card face, "is this point on something the face draws", and every place a card takes the pointer asking it instead of the body's rectangle:
  - standalone cards, each carrying its own catch today: the infopanel (its card and the waiting cards drawn behind it), the hand, the piles (the discard pile's top face, and what each pile draws), a small card, a card shown large (`stack.ts`);
  - cards on a panel, found today by `Held.box` in `panel.ts`: deck editing and the browses (`deck-panel.ts`), a capture's reward window (`overlay.ts`, the single card and the stacked copies), the collection (`collection-stack.ts`, its copies under included), the launch screen's piles (through `inspectedThrough` in `stack.ts`).
- Settled with the user:
  - **Everything drawn**, never one box round it: the gaps beside the oval rim, where the map or the scrim shows, stay theirs.
  - **Hover and rest follow the press**: one shape for everything the pointer does. In the hand, the pointer on a card's rim lifts it; on a panel, a rest on the rim raises what a rest on the body raises. The cursor's hand follows with them (INTERFACE.md: the pointer reads the one thing it is on).
  - **The rounded corners follow the rule**: the body's corners are rounded (`BODY_RADIUS`, about 7 units at a card's own size), and a press in the cut-off lands on what stands under.
  - One line, not split: both doors (the standalone catches and the panel lookup) ask the same question.
- Reconcile:
  - **The hand's lifted card** reaches its catch down the lift's height while hovered (`hand.ts`, `record.hitArea.height`), so a lifted card does not drop from under a pointer resting at its old foot. Kept: it is the one meant difference, passed to the shared check as an extra reach, never a second shape.
  - **The launch screen's region hexagons** (`pressedOnShape` in `launch-screen.ts`) stay apart: exact geometry, not a drawn face.
- Out: an event's deal window (its answers are plates, not cards); the answer plates and the capstone's window; the line "A small card's tooltip closes on the way" further down the board, which is its own line, so its behaviour is left as it is unless the new shape changes it, which is then reported. The box a refusal's note stands over (`own` in `overlay.ts`, `face` in `collection-stack.ts`) stays the body: only what reacts to the pointer changes.
- Corner cases decided:
  - Overlapping cards (the hand's fan, a stack's bands, a collection stack's copies): the topmost drawn wins, as Phaser's top-only hit test already rules; a card's rim over a neighbour's body is that card's.
  - The infopanel's catch is still marked as reacting to no press (no hand cursor), as today.
  - A card shown large: a left or a right press on its rim now lands on the card (nothing happens, a name excepted), no longer on the scrim, so it no longer takes the card down.
  - Measured on the pack's images, for the proof spec's aim: the oval rim rises 8.9 units above a card's top at its own size; the first cost's disc 5.9; the unit card's swords stand 3.0 units past its left edge at the foot, the heart 0.7 past its right; the front image itself reaches only 2 of the pack's pixels (0.4 units) past the body, too thin to aim at.

**Traps:**

- The WebGL canvas never hands back its pixels (`docs/PHASER.md` → _Under a Playwright spec_): the check reads the images the face is built from (the cards sheet in `card-frames.ts`, the disc, the badges), never the screen. The front turned to a kind's colour keeps the plain front's alpha, and the decorated front shares the plain oval's outline (the `DECORATED` comment in `card-frames.ts`).
- A Container's `getBounds` counts its hidden children (`docs/PHASER.md` → _Layers, Containers and Groups_): no outline is read off a face's bounds; faces are pooled and re-read (`face.read`) with parts shown and hidden, so the shape follows what the face shows now, the badges only on a unit card, the second cost's disc only on a card of two costs.
- A face is drawn at two widths, 124 and 380 (shown large), and the hand turns and lifts its cards to 110%: the check works in the face's own space, every measure a share of the width, so a hit area in the root's local space follows the rotation and the scale.
- Phaser hit-tests an object made interactive only from the next frame (`docs/PHASER.md` → _Under a Playwright spec_); a hit area swapped on an object already interactive is live at once.
- `panel.ts` uses `Held.box` for more than the lookup: the carried copy and its landing read it too. Only the "which thing is under the pointer" question moves to the shape.
- The infopanel's `stop` zone is resized for its ghosts in `stand`; the ghosts are drawn by `drawGhost` and count as drawn.

**Plan:**

1. The card face answers whether a point in its own space lands on what it draws: the body's rounded shape, the front's opaque pixels, each disc and badge it shows; a Vitest test holds it on the oval front: on the rim above the top yes, beside the rim no, in a rounded corner's cut-off no, the swords past the left edge yes on a unit face and no on a building face. Leaves the check standing, used by nothing.
2. The standalone cards ask it: the infopanel (card and ghosts), the hand (with its lift reach), the piles, the small card, the card shown large. Leaves every standalone card taking the pointer on what it draws.
3. The panel lookup asks the thing under the pointer through the same check, and its producers hand it: deck editing and the browses, the capture's reward window (single and stacked), the collection, the launch screen's piles. Leaves every card on a panel taking the pointer on what it draws.
4. `docs/INTERFACE.md`: the paragraph above.
5. `e2e/frame-press.spec.ts`: on the infopanel showing a unit card, a left click on the rim above its top and one on its swords past its left edge select no tile; one beside the rim, where the map shows, selects the tile there. A right press on the rim of a card shown large leaves it standing. In deck editing, a left click on a card's rim above its top adds or removes it as a click on its body does. The pointer on a hand card's rim lifts it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/frame-press.spec.ts`; `e2e/press.spec.ts`, `e2e/hover.spec.ts`, `e2e/browse.spec.ts` and `e2e/deck-editing.spec.ts` answer questions about the old catches if any arises. CI proves the whole suite on the push, `press.spec.ts`, `hover.spec.ts`, `pointer-sweep.spec.ts`, `browse.spec.ts`, `deck-editing.spec.ts`, `collection.spec.ts`, `launch.spec.ts`, `sites.spec.ts`, `inspect.spec.ts` and `reference.spec.ts` among them, to be named in the hand-back.
