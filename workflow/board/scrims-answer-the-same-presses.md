# Scrims answer the same presses

**Line:** Scrims answer the same presses — a right click on a scrim does what a left click on it does, on every scrim: the menu's, the refused-save window's, the overlay's on the chronicle screen and under the campaign screen's cards shown large; `docs/INTERFACE.md` says so; `npx playwright test e2e/press.spec.ts` passes with the browse walked back by right presses alone; `npm run check`, `npm test` and `npm run lint` pass. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`, three sections. The sentences, written out:

- _The presses_ — a new paragraph after "**The right click inspects and never selects.**" and before "**The inspection key inspects the selection**":

  > **A press on a scrim is one step back, and the two clicks are one press there.** It takes down the newest card shown large, then drops a window's own selection, then closes the window, as the back key does, and never raises the menu. The deal window is closed by no press: a press on its scrim drops its selection and no more.

- _The presses_, in the right click's paragraph, the sentence "A press beside the things drops the inspection and leaves the selection standing." becomes:

  > A press beside the things, where no scrim stands, drops the inspection and leaves the selection standing.

- _The menu_, second paragraph, after "A window closes back one step, to the window it was opened from and then to the screen under it.":

  > A press on the menu's scrim closes it back one step too.

- _A refused save_: "Back, the back key or a press on the scrim takes it down and play goes on" stands as written; _The presses_ now says what a press on a scrim is.

`docs/CHRONICLE-SCREEN.md`'s ending screen, "The scrim swallows every press", stands as written. No player-facing text entry is added or changed.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In, the right click on each scrim, which today answers only while a card stands large:
  - the menu's scrim: one step back, Controls to Settings to the menu to the screen, as the left click;
  - the refused-save window's scrim: takes the window down, as the left click;
  - the overlay's scrim on the chronicle screen: over a browse it drops the ring, then closes the browse; it closes the aim window and the capstone's window; it takes down the newest card shown large, as it does today; over the deal window it drops the ring and no more.
- The user's decisions, 2026-09-28: both clicks do the same on every scrim, and the ring is no exception — a right click on the scrim drops a window's selection as the left does. This overturns the earlier call that a right press beside a browse does nothing while no card stands large; the spec holding that call is rewritten, not weakened.
- Unchanged: the campaign screen's scrim already answers both clicks alike. The ending screen's scrim swallows both. A right click on a window itself, not on its scrim, does nothing, which `e2e/controls.spec.ts` "a right click leaves a window standing" holds. A right click on the screen, where no scrim stands, inspects as before and leaves the selection standing. A press on a scrim never raises the menu, where the back key does once nothing is left to back out of.
- A slot of Controls listening when a press lands on the menu's scrim: the window steps back and the slot dies with it, the right click as the left today. Neither click binds.
- Out: any change to what the left click does on any scrim; the pointer's cursor over a scrim; the back key.

**Traps:**

- A click is `onClick`'s, never a bare `pointerup` (`docs/PHASER.md` → _The pointer's readings_, "`pointerup` reaches whatever lies under the pointer"). `onClick` keeps one press per button, so a scrim answering both clicks holds two of them, as the campaign screen's scrim does.
- Inside a scene only the topmost object under the pointer hears a press (`docs/PHASER.md` → _Input across scenes_, "One stop per scene, never per object"): a window's box takes the pointer so that a press on it is no press on the scrim behind, and that holds for the right click only if the box is interactive for it as for the left. `e2e/controls.spec.ts` "a right click leaves a window standing" is the guard.
- A scrim raised is hit-tested from the next frame (`docs/PHASER.md` → _Under a Playwright spec_): a spec rests before it presses the scrim.
- The menu's scrim covers the Menu button and the whole design space; the refused-save window's scrim stands over the menu's. A spec's point on either scrim must be clear of the window's box; `besideTheCards` and `besideTheDeal` in `e2e/chronicle-screen.ts` are the overlay's points.
- `e2e/press.spec.ts` "a right press beside the card shown large takes it down and leaves the card selected in the hand" stays true: the hand's selection is the screen's, under the scrim, and one step back takes the card down and no more.

**Plan:**

1. `src/ui/overlay.ts`: the scrim's right click answers as its left click does, on everything the scrim carries. The separate right-click answer that knew only the card shown large is gone.
2. `src/ui/menu-scene.ts`: the menu's scrim and the refused-save window's scrim answer the right click as the left.
3. `docs/INTERFACE.md`: the sentences of the Spec.
4. The specs:
   - `e2e/press.spec.ts`: "a right press beside the cards drops the card a browse shows large, and does nothing while none stands" is rewritten as the browse walked back by right presses beside the cards alone — the card shown large taken down onto the browse with its ring standing, then the ring dropped, then the browse closed — the chronicle unchanged at the end.
   - `e2e/menu.spec.ts`: one new test, a right click on the menu's scrim from Controls steps back to Settings, and a left click there steps back to the menu.
   - `e2e/refused-save.spec.ts`: one new test, the window raised at the boot under a refused storage comes down at a right click on its scrim, and the menu opens after it.
   - `e2e/deal.spec.ts`: in "the events phase deals a choice, and the turn plays on from the one taken", beside the left click that drops the ring, a card ringed again and a right click beside the deal drops the ring and leaves the window standing.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: `npx playwright test e2e/press.spec.ts`. CI proves on the push: `menu`, `refused-save`, `deal`, `browse`, `capstone`, `controls`, `reference`, `hover`, `tree`, `ending`, `inspect`.
