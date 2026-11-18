# A small card's tooltip closes on the way

**Line:** A small card's tooltip closes on the way — moving the pointer from a name to the small card it raised, the pointer crosses another name and that name's small card replaces it. Done when a small card catches the pointer across the clear water between it and the name that raised it, the card's body wide, above the name or under it; `docs/INTERFACE.md` says so; `e2e/small-card-bridge.spec.ts` passes.

**Spec:** `docs/INTERFACE.md` → _The presses_, the paragraph **A card is everything its face draws.** It ends "Where what stands under the card shows through, the pointer is on what stands under." Append, as the paragraph's new last sentences — the user asked for both cases on the page, the hand's being shipped behaviour the pages never stated:

> Two cards reach past what they draw, toward where the pointer comes from, though nothing is drawn there. A card of the hand lifted by the pointer on it reaches down as far as it rose, so a pointer resting where it lay keeps it lifted. A small card reaches across the clear water to the name that raised it, as wide as its body, so the pointer goes from the name onto the card over nothing else.

The paragraph **A thing named in a card's text stands in brackets** under _A card's names and its label_ stays as it is. No player-facing text is foreseen.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- Cause, read off the code: a small card stands `STANDOFF` (8 units) above the top of its name's line (`src/ui/small-card.ts`), and the rules' lines are drawn closer than their boxes, so that gap lies inside the line above. Everything above the gap is under the card. The pointer going straight up from the name crosses the line above in the gap, and a name there takes the handover at once (`settle`: a card standing, another name hovered, `raise` without a rest), replacing the card. The same holds for a card standing under its name (no room above) and for a deeper card raised from a name on a small card.
- In: the **bridge**. Every small card of the chain takes the pointer, press, hover and rest, on a strip between its body and the name that raised it, as wide as the body, the whole gap: down to the name's top when the card stands above, up to the name's bottom when it stands under. The bridge is the card for every purpose: the pointer on it is on the card (it keeps the chain standing, the rest on a name of the line above raises nothing there), a right click on it inspects the named thing as a right click on the card does, the cursor reads it as the card.
- Settled with the user: the bridge, over "another name hands over only after a rest while a small card stands" (which slowed every scrub along a line). The instant handover between names stays as it is: moving sideways along a line hands over at once, as today.
- Out: the gap's size, the card's place, its look; nothing new is drawn. The leave delay (`HANDOVER_MS`) and the rest (`REST_MS`) unchanged. Tooltips (bubbles) stay see-through and get no bridge.
- Corner cases decided:
  - What the bridge takes away: while a small card stands, the strip of the line just above its name that lay in the gap (just under it, for a card standing under its name) can no longer be reached through the gap. The pointer leaves sideways, the card goes down after the leave delay, and that line is reachable again. Accepted with the bridge.
  - A card pushed sideways to stay inside the frame (the `MARGIN` clamp) keeps its body over the name's middle, so the body-wide bridge still meets the name.
  - The bridge follows the card as it is carried (`follow`): the strip is part of the card's own space, never a second object.
- Reconcile, taken with the user:
  - **The hand's lifted card** already catches the pointer past what it draws: its body reaches down the lift's height while hovered, through the `reach` of `pressedOnFace` (`src/ui/card-face.ts`) into `cardDrawsAt` (`src/ui/card-shape.ts`). **Become one**: the bridge goes through that same reach, its length (the gap, at the small card's size) the parameter. The reach only extends downward today; the shared check is widened so a reach can also extend upward, for the card standing under its name. How that is expressed is the implementer's.

**Traps:**

- `setInteractive` on an object that already carries an input ignores the hit area it is handed (`docs/PHASER.md`, the entry committed in 668dc0e): the bridge's direction and length are read by the hit-area callback at each test, as the hand's `reach()` is, never set by a second `setInteractive`.
- The reach is in the face's own space and `cardDrawsAt` divides it by `downOf(width)` into the picture's pixels; an upward reach grows the box at its top, not its foot. The body is a rounded box (`BODY_RADIUS`): today a downward reach moves the rounded foot corners to the reach's end, an upward one moves the top corners. Either is fine; the name sits under the card's middle.
- The card stands above its name unless `above - CARD_HEIGHT < MARGIN` (`raise` in `small-card.ts`); that test decides the bridge's direction, and the gap is the distance between the card's edge and the name's spot as raised (`off`), which `follow` keeps.
- A small card is a face of 124 units' width; the `STANDOFF` is in design units on the surface the card stands on, which is the card's own scale (small cards are not scaled), so the reach is the standoff itself.

**Plan:**

1. `src/ui/card-shape.ts` and its caller: the face's check takes a reach upward as well as downward. `src/ui/card-shape.test.ts` gains: a point a few units above the body's top, beside the oval rim, lands with an upward reach and not without; the downward case as the hand already relies on. Leaves the hand unchanged and the upward reach used by nothing.
2. `src/ui/small-card.ts`: each small card's catch reaches across its gap toward its name, down when it stands above, up when it stands under. Leaves the bridge standing on every small card.
3. `docs/INTERFACE.md`: the sentences above, both cases.
4. `e2e/small-card-bridge.spec.ts`: a name in a card's text with a name on the line above it (any card of the fixture's or the content's whose rules hold two names on consecutive lines, found by the implementer); raise the lower name's small card at a rest; move the pointer from the name straight up in small steps through the gap onto the card, waiting past the leave delay at a point in the gap over the upper name: the same small card stands throughout, no other is raised. Then a right click in the gap shows the named thing large. A point in the gap beyond the body's width: the card goes down after the leave delay.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/small-card-bridge.spec.ts`; `e2e/reference.spec.ts` and `e2e/frame-press.spec.ts` answer questions about the small cards and the shared check if any arises. CI proves the whole suite on the push, `reference.spec.ts`, `frame-press.spec.ts`, `hover.spec.ts`, `inspect.spec.ts`, `browse.spec.ts`, `card-reads.spec.ts` and `launch.spec.ts` among them, to be named in the hand-back.
