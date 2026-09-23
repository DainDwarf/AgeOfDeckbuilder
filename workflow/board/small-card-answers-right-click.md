# A small card answers the right click

**Line:** **A small card answers the right click** — a right click on a small card shows the card it stands large, as a right click on the name that raised it does, the hand cursor stands over it, and `docs/INTERFACE.md` says so in place of "a small card answers no press". Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`, _The presses_, the paragraph "A card named in a card's text stands in brackets". Its last sentence, "A left click on a name is the card's own, and a small card answers no press." becomes: "A left click on a name is the card's own, and a small card answers the right click as the name that raised it does, and no other press." Nothing else on the page changes: the sentence on what stands over what already places the small card, and the pages say nothing of cursors. No player-facing text is foreseen: the line adds no entry.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: a right click anywhere on a small card's body — any link of a chain, raised in the hand or on the overlay — shows the card that small card stands large, through the very path a right click on a name drawn on a small card takes today, the `inspect` callback the small cards are created with. What that path does is the caller's and is not this line's: today the card alone over whatever window stands, and once **Inspections pile up** has shipped a copy on top of the stack while a card stands large. The chain goes down as it does for a name: the overlay's wipe takes it, the scrim rising takes it in the hand.
- In: the small card shows the hand cursor while the pointer is on its body, as everything that answers a press does — a card in the hand, a browse's cards, a name in brackets. A name drawn on a small card already shows it.
- In: the cursor stays right after a link goes down under a resting pointer; see Traps.
- Out: the left click on a small card. It lands on the small card and reaches nothing beneath, as today, and the page says "no other press". Nothing in the hand or on the window under it answers.
- Out: what a card shown large does or where it stands: the pile-up line's.
- Corner cases decided: a right click on a small card raised over a selected or aimed card of the hand inspects like a right click on the name would, the scrim rising and the selection dropped as the page says of any scrim; a right click on a small card with the left button held on it is a click of its own, answered at its release, since nothing holds a left press on a small card; a right click on a deeper small card of a chain inspects the card that link stands, not the one the chain began on.

**Traps:**

- `docs/PHASER.md`, _Input across scenes_, the entry on the topmost hit being the latest in the render list: a name drawn on a small card is a zone inside the card's container and stands over it, so a right click on a name goes to the zone and one off a name to the container's own rectangle. Both reach the same callback, so which one takes the press does not matter; what matters is that the container's own right click is answered through `onClick` on the root, the way its names' zones already are.
- Phaser resets the canvas cursor when an interactive object that carries one is destroyed, whether or not the pointer is on it: `clear` (`node_modules/phaser/src/input/InputPlugin.js:809-821`) calls the manager's `resetCursor` with the object's input, which resets on `cursor` alone (`src/input/InputManager.js:458-464`). A link cut under a resting pointer — the deeper small card going down after the hand-over while the pointer rests on the body of the shallower one, or the whole chain going down while the pointer rests on the hand card beneath — therefore leaves the default cursor over a thing that shows the hand, and no move puts it back: the object is still on Phaser's per-pointer over list (`docs/PHASER.md`, _The pointer's readings_), so no `pointerover` comes. Today the root carries no cursor and the stand-in's Hunger draws no name, so nothing shows; once the root carries the hand, and once the pile-up line gives Hunger a name of its own, it does. After a cut, whatever the pointer rests on that carries a cursor has to be told again: `input.setCursor(target.input)` is what puts it back, and the `Hover` that `onHover` in `src/ui/design-space.ts` returns already holds `resume()` for the case of an object coming live under a resting pointer.
- The specs read a small card by name, `small-card-0`, `small-card-1`, … from the surface out, and its card off its `card` data (`e2e/chronicle-screen.ts`, `cardOnFace`). `onScreen` gives the centre of an object's bounds: for a small card that is its art, clear of the rules text where a name lies, so a press there lands on the body. `cursorOverCanvas` reads the canvas's cursor; `'pointer'` is the hand.
- The reference spec is the one the pile-up line extends too; this line lands after it and builds on the spec as it then stands.
- The hand's `hold` lifts the slot while a small card raised off it stands; the cut at the scrim's rise lets it settle, unchanged.

**Plan:**

1. `src/ui/small-card.ts`: the small card's root answers the right click with the card the link stands, through the callback its names' right click takes, and carries the hand cursor; after a cut, the cursor is put back on whatever of the chain or the surface the pointer rests on. Leaves the app typechecking and a right click on a small card showing its card large in the hand and on the overlay alike.
2. `docs/INTERFACE.md`: the one sentence. Leaves the design page saying what the code does.
3. `e2e/reference.spec.ts`: the one test extended where it already rests the pointer on the small card — the cursor over its body is the hand; a right click there stands the card it stands large, `inspection` then standing `PH_Hunger` and `small-card-0` gone; the back key brings the deal back. And the cursor after a cut: with a name on the small card raising a deeper one, the pointer moved back onto the shallower card's body and the hand-over waited out, the cursor still the hand. Leaves the proof spec green.
4. `workflow/BOARD.md`: the line deleted, and this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof is `npx playwright test e2e/reference.spec.ts`. CI proves on the push: `hover.spec.ts`, `press.spec.ts`, `browse.spec.ts`, `deal.spec.ts`, `capstone.spec.ts`, `recall.spec.ts`.
