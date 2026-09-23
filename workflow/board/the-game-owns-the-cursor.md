# The game owns the cursor

**Line:** **The game owns the cursor** — one reading per frame of what stands topmost under the pointer across the stack of scenes gives every hover its enter and leave and the canvas its cursor, in place of Phaser's over, out and cursor writes and every patch on them: no object carries Phaser's `cursor`, nothing reads or writes Phaser's over list, `onHover` keeps no end, resume, covered, withheld or off-canvas path, the small card's cut hit-tests nothing, `docs/INTERFACE.md` states where the hand shows and that a scrim falling hovers at once, and `e2e/hover.spec.ts` proves the end-turn button reads End turn the moment the menu falls under a pointer resting on it. Doc-impact: `docs/INTERFACE.md`, `docs/PHASER.md`.

**Spec:** `docs/INTERFACE.md` _The presses_ and _What stands over what_; `docs/PHASER.md` _The pointer's readings_.

The rule the code implements, in one sentence: at every frame the pointer is on the one thing that stands topmost under it across the running scenes, walked from the top, the first scene with an interactive object under the pointer deciding and the topmost of its hits by Phaser's own sort, in the render list's order; off the canvas it is on nothing. A hover is entered when that thing becomes its object and left when it stops being, whether the pointer moved or the thing rose, fell, was covered or came live under a pointer holding still. The cursor is the hand when that thing is marked as answering a press and the arrow otherwise, on nothing and off the canvas included.

`docs/INTERFACE.md`, _The presses_, a new paragraph after the first:

> **The pointer is a hand over a button, a card in the hand, the cards a window lays out, a small card and a name**, and an arrow over everything else, the map, a card shown large and a scrim among it. It reads the one thing the pointer is on, as every hover does, so it is right the moment that thing rises, falls or comes live under a pointer that holds still.

`docs/INTERFACE.md`, _What stands over what_, the tooltip paragraph's second sentence, today "A scrim rising is, to whatever stands under it, the pointer leaving the game: every hover there ends, a standing tooltip among them, and the first move after the scrim falls finds what the pointer is on, as a pointer coming back to the game does.", becomes:

> The pointer is on the one thing that stands topmost under it, across every surface, at every moment: a thing rising, falling or coming live under a pointer that holds still is hovered or left as one the pointer moved onto or off. A scrim rising is, to whatever stands under it, the pointer leaving the game: every hover there ends, a standing tooltip among them, and once the scrim falls the pointer is on whatever stands under it again, before it moves.

The rest of that paragraph, the press let go of as a scrim rises, stands. The small card paragraph stands: a scrim rising takes the small card down at once.

`docs/PHASER.md`, _The pointer's readings_, appended to the entry that begins "The cursor is one style on the canvas":

> An object with no `cursor` gets no write at all, at its edges or at its destroy: `setCursor` and `resetCursor` write only for an interactive object whose `cursor` is set (`src/input/InputManager.js:438-464`).

`docs/PHASER.md`, _The pointer's readings_, two new entries after that one:

> - **A hit test answers the manager's one shared array, and a plugin's dispatch walks that array.** `hitTest` empties and refills `_tempHitTest` (`src/input/InputManager.js:888-897`), `hitTestPointer` hands it back (`src/input/InputPlugin.js:975`), `update` keeps it as `_temp` (`:727`), emits the scene's `pointermove` with it as the second argument (`:1591`) and reads it again for the over and out pass (`:1843`), so a hit test from inside any input handler refills the list the dispatch is walking and pushes the drop zones a second time (`:981-990`). A hit test of the game's own runs from the game loop, outside the dispatch, where the array is idle; it writes `pointer.camera`, `worldX` and `worldY` as Phaser's own does, and every dispatch rewrites them before reading them.
> - **A hit test skips an object whose input is disabled, one that would not render for the camera, and one under a parent that would not** (`src/input/InputManager.js:842-865`); `isOver` starts true and the mouse pointer stands at 0,0 with `moveTime` 0 until the first move (`InputManager.js:114`, `src/input/Pointer.js:297`, `:710`).

**Doc-impact:** `docs/INTERFACE.md` (the two paragraphs above), `docs/PHASER.md` (the three additions above).

**Scope:**

In:

- One reading per frame, from the game loop after the scenes' updates and outside Phaser's input dispatch: the thing under the pointer, as the rule above defines it, and from it the cursor and every hover's state. Nothing before the pointer's first move, since `isOver` starts true at 0,0. The cursor is written on a change only, never every frame.
- No object carries Phaser's `cursor`: every `useHandCursor` and `cursor: 'pointer'` goes, and the same objects carry the game's own mark saying they answer a press. The set is today's, unchanged: the end-turn button, the Menu button and the menu's entries, the launch page's rows and its Launch button, the piles' presses, the mode chip while it can be left, the hand's cards, the frame a window lays its cards in, the small card, and the name zones on a card face. Not the map, a card shown large, a scrim, the resource bar's readings or the infopanel's rows.
- `onHover` becomes enter and leave off the frame reading: the `hovered` getter stays; `end` and `resume` go, and so do its listeners on `pointerover`, `pointerout`, `gameout`, `gameover`, `COVERED`, `UNCOVERED`, `WITHHELD` and `pointermove`, its `returning`, `offCanvas`, `covered` and `withheld` flags, and its write into Phaser's `_over` list. The end-turn button goes live and dead by `setInteractive` and `disableInteractive` alone: a disabled object is no hit, so its hover leaves at the next frame.
- The small card's cut hit-tests nothing and writes no cursor; it keeps its `COVERED` listener, since the design takes the small card down at once when a scrim rises, not a hand-over later. `COVERED` stays for that and for the chronicle screen letting go of the press. `WITHHELD` goes with its emission in `stopsThePointer`; `UNCOVERED` goes if nothing listens once the hovers stop.
- During a drag the reading is geometric like any other: the carried card is the thing under the pointer while it is topmost, and the Menu button is when the pointer crosses it, the hand card's hover leaving then; the hand's enter and leave already ignore a hover while a drag stands, so nothing changes on screen.
- Off the canvas the pointer is on nothing: every hover leaves, the cursor is the arrow. Back on the canvas, the pointer is on whatever stands under it at its first move; the browser dispatches the canvas's `mouseover` and the move in one task, so no frame reads the coordinates the pointer left at.
- Under a scrim the scrim is the thing: every hover beneath leaves, the cursor is the arrow. The scrim falling makes whatever stands under the pointer the thing at the next frame, with no move.
- `e2e/hover.spec.ts` gains one test: the pointer resting on the end-turn button, the back key raises the menu and the button reads the turn; the back key closes it and the button reads End turn again with no move, and the cursor is the hand. `e2e/reference.spec.ts` gains one step after its first small card stands: one jump onto the Menu button, and past the hand-over the small card is down and the cursor is the hand. The spec's existing cursor assertions stay as they are.

Out:

- A second cursor: the mark says the hand and nothing else. The state cursors and the cursor images are the v0.0.6 idea and get their axis then.
- The map's own tile hover, which reads the pointer geometrically on its catcher and never went through `onHover`.
- The tooltip's rest and hand-over timers, the small card's rest and hand-over, `onClick`: all unchanged.
- The hand set: no object gains or loses the hand.

**Traps:**

- `docs/PHASER.md` _The pointer's readings_, all of it, and _Input across scenes_ for what a scene's stop is: the reading does not consult stops, it is geometric, and it agrees with a press because every scene stops a press at any interactive object.
- Never hit-test from inside a Phaser input handler: the shared array (the new PHASER.md entry). The frame reading is the one hit test the game makes; `hitTestPointer` is fine there, the array being idle. Phaser's own over list, `_over`, is still maintained by Phaser and read by nothing: leave it alone.
- Phaser's `cursor` writes happen only for an object whose `cursor` is set: one `useHandCursor` left behind and Phaser writes again at that object's edges and destroy, racing the reading. The e2e helper `cursorOverCanvas` reads the canvas's style, so the hand stays `pointer` and the arrow is the style unset, as Phaser's reset left it.
- `isOver` starts true with the pointer at 0,0: a reading before the first move hovers the top-left corner of the launch page.
- The sort that picks the topmost of a scene's hits is the render list of the last frame, and an object not yet rendered sorts to the bottom (PHASER.md _Input across scenes_); a zone inside a container is over the container, which is how a name zone wins over its card, and how the small card's own hover leaves when the pointer is on one of its names, as today.
- Every frame reading costs 8.5 µs at 121 interactive objects across the five running scenes, measured; a style write every frame is not free, so the cursor is written on a change.
- `chronicle-scene.ts`'s `covering` lets the press go after the pointer event that raised the scrim: that microtask stays; only the hover half of `COVERED` goes.
- The hover comment rule: a comment block longer than three lines is flagged; the traps above go to `docs/PHASER.md`, not into comments.

**Plan:**

1. `docs/PHASER.md`: the three additions, so the facts stand before the code relies on them.
2. `src/ui/design-space.ts` and `src/main.ts`: the frame reading and the cursor write, hooked once from the game loop; `onHover` rewritten on it; `stopsThePointer` without the withhold; `COVERED` kept, `WITHHELD` gone, `UNCOVERED` gone if unread. Leaves: every hover entering and leaving at the frame, the cursor written by the game alone, `npm run check` green.
3. The hand sites, `src/ui/card-face.ts`, `chronicle-scene.ts`, `hand.ts`, `launch-page.ts`, `menu.ts`, `overlay.ts`, `piles.ts`, `small-card.ts`, `standing.ts`: Phaser's cursor off, the mark on. `chronicle-scene.ts`'s end-turn without `end` and `resume`; `small-card.ts`'s cut without its hit test. Leaves: no `useHandCursor` and no `cursor:` under `src/`.
4. `docs/INTERFACE.md`: the two paragraphs.
5. `e2e/hover.spec.ts`: the new test; `e2e/reference.spec.ts`: the new step.
6. The board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/hover.spec.ts`.
- CI's on the push: `e2e/reference.spec.ts`, `e2e/map.spec.ts`, `e2e/play-out.spec.ts`, `e2e/settle.spec.ts`, `e2e/press.spec.ts`.
