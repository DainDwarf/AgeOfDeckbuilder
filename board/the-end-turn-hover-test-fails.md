# The end-turn hover test fails

**Line:** The end-turn hover test fails — `e2e/hover.spec.ts` passes with its four existing tests unchanged plus two new ones — the button reads `End turn` with no move after a turn ended under a resting pointer, and after the pointer leaves the canvas over the button and comes straight back onto it — and `docs/CHRONICLE.md` carries the sentence below.

**Spec:** `docs/CHRONICLE.md` → _The chronicle screen_. Add, as its own paragraph right after the **On turn 0** paragraph:

> **What the pointer rests on reads as under it, however the pointer came to be there.** The end-turn button reads `End turn` whenever the pointer stands on it while it is live: the next turn rolls in on the button during the end of turn's play-out, and the moment the play-out ends under a pointer that never moved, the button reads `End turn` again, so a turn ends where the last one did. A pointer that left the game over a thing and comes back straight onto it finds that thing as a pointer moved onto it does.

No new player-facing text: `button.end-turn` and `button.turn` already stand in `src/ui/text.ts`.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the hover coming back when its target comes back live under a resting pointer — the end-turn button is the one owner that ends a hover when its target goes dead; and every hover entering when the pointer comes back onto the canvas straight onto its target, which reaches the hand cards, the resource bar's tooltips and the infopanel's hovers through the same helper.
- Out: the hand going dead during a play-out. It ends no hover today and this line gives it no new behaviour.
- The four existing tests in `e2e/hover.spec.ts` are not edited: they fail because of the defect, not because of how they are written.
- The roll stays as it is: during the play-out the button carries the next turn's number, and `End turn` comes back only when the button is live again, after the tail's paint.
- The button dead on turn 0, or under a window's scrim, takes no hover back: the hover follows what Phaser counts as the topmost thing under the pointer, and an object that is not interactive gets none.
- The press is not in scope: clicking the resting spot already ends the turn. It was measured in this intake; only the label was wrong.

**Traps:**

- Phaser 4.2.1 keeps an object on the input plugin's per-pointer over list (the private `_over`) through `disableInteractive`, `setInteractive` and `gameout`. Measured here: the list held `end-turn` with the pointer resting on it after the settle, with the pointer off the canvas, and after the button came back live. Phaser sends `pointerover` only when an object joins that list, so neither a re-enable under a resting pointer nor a jump from off the canvas straight back onto the object fires one. Moving onto another object first (the list reads `press`) and back does.
- `hover.end()` clears the helper's own flag while Phaser's list still holds the target. The fix must bring the two back into agreement. A flag set by hand while Phaser's list lacks the target would never see its `pointerout`, and the label would stick on `End turn`.
- After `gameout` the active pointer keeps its last coordinates. A hit test on those alone would hover again a button the pointer left the game over, so being on the canvas has to be part of the check.
- Playwright's `mouse.move` to the coordinates the pointer already rests on produces no move Phaser sees, and neither does a single jump from the bare page onto an object Phaser still counts as under the pointer. The existing test's first step is exactly the first case, which is why it caught this.
- The pointer is resting on the end-turn button in every spec that uses `open`: `settle` ends turn 0 by clicking it. This line changes what every such spec sees on the button's label before its first move; any spec that reads `endTurnLabel` has to be run.

**Plan:**

1. `src/ui/design-space.ts` → `onHover` owns the invariant: while the pointer is on the canvas, `hovered` agrees with whether Phaser counts the live target as under the pointer. It gains (a) a way for the owner to resume the hover after re-enabling the target: enter if the pointer is on the canvas and the target is the topmost interactive hit; and (b) a `gameover` listener doing the same check. Both are removed on the target's `destroy`, like `gameout`. Whether to read Phaser's private list or a public hit test is the implementer's call, verified by the specs.
2. `src/ui/chronicle-scene.ts` → `addEndTurn`'s `interact()`: after `setInteractive`, resume the hover instead of only ending it; it still ends it when disabling.
3. `e2e/hover.spec.ts`: two new tests with the existing ones' shape and window.
   - After `open`, with no pointer move, the label polls to `End turn`.
   - From the button, one move to `offCanvas` (the label reads the turn), then one move straight back onto the button (the label reads `End turn`).
4. `docs/CHRONICLE.md`: the paragraph above.

**Verify:** `npm run check`, `npm run lint`, `npm test`, then `npx playwright test e2e/hover.spec.ts`, and each other spec that calls `endTurnLabel` or hovers a hand card, one at a time.
