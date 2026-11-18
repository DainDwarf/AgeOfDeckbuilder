# The infopanel's pile wears the dark back

**Line:** The infopanel's pile wears the dark back — on piled infopanels, use the dark back for the pile of cards under the one shown. Done when the cards waiting under the infopanel's card are drawn as the game's card back, the grey paper gone from `src/ui/infopanel.ts`, and `docs/MAP-SCREEN.md` → _The infopanel_ states the stack.

**Spec:** `docs/MAP-SCREEN.md` → _The infopanel_ ✅, which says nothing of the stack today. Add, as the section's second sentence group, at the end of its first paragraph (after "…the cycle never falls back to the bare ring."):

> Under the card shown lie the others the tile holds, face down: one card back for each ([`LOOK.md`](LOOK.md)), each standing out from the one above it by 4 units down and to the right.

`docs/LOOK.md` → _The cards_ → **The back** is the look, unchanged: the pack's dark back with its two gold lines and the player's crown on it. No player-facing text.

**Doc-impact:** `docs/MAP-SCREEN.md`.

**Scope:**

- In: each card waiting under the infopanel's card is the standing card back, exactly as the draw pile wears it, crown included (the user's call: one back across the game; the card shown covers the crown at rest, and it may glint through for the 150 ms of a cycle's dissolve — accepted). Same count (the tile's cards less one), same offset (4 design units per place, down and right), same order (the deepest drawn first), same scale with the panel.
- In: the press stop's hit test over the waiting cards follows the back's own drawn outline (the back's own `cardAt`) in place of the grey paper's rounded box.
- Out: the dissolve's motion, the offset, the count, the panel's position; any new back without the crown; the collection's or the deck panel's grey paper (`deck-panel.ts` keeps its own).
- Reconcile: the standing card back goes through as it is; no second back.

**Traps:**

- The card back is laid out about its own bottom centre; the panel lays its cards out from their top-left corner (`faceOf` sets the face at `CARD_WIDTH / 2, CARD_HEIGHT`). A back at place _n_ stands its root at `(CARD_WIDTH / 2 + n·4, CARD_HEIGHT + n·4)`.
- Draw order inside the panel container: the backs under the press `stop` zone and under the card shown, which `show` inserts just above `stop` (`panel.getIndex(stop) + 1`). A back added after that index covers the card.
- `show` runs on every cycle step and `rescale` re-stands; backs must not leak a container per call. Whether they are pooled or rebuilt is the implementer's.
- `LOOK.affordableCard.face` and `LOOK.cardEdge` stay in use elsewhere (`deck-panel.ts`, `browse.ts`, `aim-line.ts`); only the infopanel's ghost helpers go.
- `docs/PHASER.md` for anything on Containers and Layers.

**Plan:**

1. `src/ui/infopanel.ts`: the grey ghosts become card backs at the same places; the hit test reads them; the ghost-only constants and helpers that no longer serve are removed.
2. `docs/MAP-SCREEN.md`: the sentence above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/inspect.spec.ts` (the infopanel's cycling and presses) and `npx playwright test e2e/press.spec.ts` (a click on the infopanel reaches no tile), both green. Then the `visual-check` skill on a tile of three cards and one of two: the backs' strips show dark with their gold line at the panel's right and bottom edges, nothing grey, and the cycle's dissolve reads clean. CI proves the whole suite on the push.
