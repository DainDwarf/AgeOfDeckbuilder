# A dead card of the hand stops a press

**Line:** **A dead card of the hand stops a press** — while a play-out runs, a card resting in the hand stops a press as it does live, answering none: no tile under its top is reached and no press lands beside the things through it; `e2e/press.spec.ts` is green. Doc-impact: none — `docs/INTERFACE.md` says it.

**Spec:** `docs/INTERFACE.md` _The presses_: "Whatever stands over the map stops a press, whether or not it answers one, a dead button as a live one, so a tile is reached only where nothing stands over it." The hand is dead for the whole play-out, a card played or hovered under it being animated, reverted, and killing the tweens the stages wait on: the code's own constraint, stated where the play-out runs in `src/ui/chronicle-scene.ts`, and kept. No sentence is added or changed, and no player-facing entry.

**Doc-impact:** none — the page says it.

**Scope:**

In:

- A card resting in the hand stays interactive while the hand is dead, as the end-turn button does since this branch: a press on it during a play-out stops there, and the door reads it as a thing.
- While dead it answers nothing: no hover lifts it, no left or right click selects, plays or inspects it, no drag takes it, no name on it raises a small card on a rest and no kind label its bubble, and the pointer over it is the arrow.
- Once the play-out ends, the hand answers as it does today.

Out: a card in flight, which is the play-out's own motion and stands for a moment wherever it travels; the piles, which stay live through a play-out as they are; the aim window and every scrim.

Corner cases, decided:

- A press landed on a dead card and let go after the play-out has ended, on the same card, is a click on a thing: the door lets an aim go, and there is none, so nothing changes; the card itself answers no click that began while it was dead.
- A card the pointer rests on when the play-out ends is hovered from then on, as a thing coming live under a still pointer is, without a move.

Reconcile: the hand goes dead the way the end-turn button does — interactive always, answering only while live — and no second way of being dead stays in the hand.

**Traps:**

- Phaser's hit test skips an object whose input is disabled (`docs/PHASER.md`, _The pointer's readings_): that is how a dead card is see-through today, the click reaching the tile under the card's top, which stands 24 units into the map's frame (`CLEARED`, `src/ui/band.ts`), or the band under its rest.
- The hand's cards are its `slots` (`src/ui/hand.ts`), rebuilt on every render; `live` is called by the scene at the play-out's start and end, and `render` ends by calling it with the state the hand is in.
- A card's hover lifts it, its drag starts on Phaser's `dragstart`, its clicks are `onClick`, and its names and kind label read the scene's moves over it: each is gated, or a card hovered or played mid play-out kills the tweens the stages wait on, which is why the hand is dead.
- `answersPress` takes a predicate, read each frame for the cursor (`src/ui/design-space.ts`); the end-turn button's is the precedent.
- The hover's enter and leave come from the game's own reading of what the pointer is on, once a frame (`followPointer`), not from Phaser's over and out.
- Comments are for traps only; the pages hold the why.

**Plan:**

1. `src/ui/hand.ts`: the hand's dead state keeps its cards interactive and answering nothing. Leaves the hand live exactly as today.
2. `e2e/press.spec.ts`, beside "the end-turn button clicked while a card is aimed at a tile…": with nothing selected, the turn ended, a click on the top of a card of the hand while the end of turn is still playing out, at a point inside the map's frame where the map draws a tile under the card; once the play-out ends, no tile is ringed. The click is proven to have landed during the play-out by `playing` read in the same question as the click, or the spec says why it cannot be.
3. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/press.spec.ts`.
- CI's, on the push: `e2e/hand-aim.spec.ts`, `e2e/refuse.spec.ts`, `e2e/hover.spec.ts`, `e2e/reference.spec.ts`, `e2e/landing.spec.ts`, `e2e/broken-motion.spec.ts`, `e2e/map.spec.ts`, `e2e/deal.spec.ts`.
