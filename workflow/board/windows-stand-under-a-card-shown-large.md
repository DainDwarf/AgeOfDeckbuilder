# The aim, deal and capstone windows stand under a card shown large the browse's way

**Line:** The aim, deal and capstone windows stand under a card shown large the browse's way — align them to the browse's way, the window left standing under the card instead of wiped and laid again, so the overlay's keys no longer hang off the browse's cards shown large; the design docs corrected if needed.

Done-condition: the overlay shows every card shown large one way, the way the chronicle browse already does (`standLarge` with a `Beneath`, `src/ui/stack.ts`). This covers the aim window, the deal window and the capstone's window, a card of the hand shown large over nothing, and the ending screen. The window beneath stays standing as it stood, dimmed under the card's scrim, and is never wiped or laid again. The overlay's second stack and its `Inspection` state are gone. Every card shown large is drawn plain. `e2e/deal.spec.ts` proves the deal window standing under its answer shown large, its ring kept.

**Spec:** the sentences below, written into the pages as given.

`docs/INTERFACE.md`, _What stands over what_: the last paragraph,

> The **small card** a name raises stands where a tooltip does, on the surface it was raised from, and a scrim rising takes it down as it does a tooltip. Cards shown large stand where the one does, however many stand in the stack.

becomes

> The **small card** a name raises stands where a tooltip does, on the surface it was raised from, and a scrim rising takes it down as it does a tooltip. Cards shown large stand where the one does, however many stand in the stack, on a scrim of their own: whatever they are shown over — a browse, a window, the ending screen — stands under that scrim as it stood, dimmed, its ring and its scroll kept, and they are taken down onto it where it stood. A card shown large is never drawn unaffordable: it is drawn plain, wherever it was shown large from.

`docs/CHRONICLE-SCREEN.md`, _The hand and the aim_ — the paragraph opening "A left click on one of the aim window's cards" gains, at its end:

> The right click shows a card large over the window, and a press beside it or the back key takes it down onto the window where it stood, as on the deal.

`docs/CHRONICLE-SCREEN.md`, _The windows_, the deal paragraph:

- "An answer the city cannot pay for is drawn as an unaffordable card of the hand is." becomes "An answer the city cannot pay for is drawn in the window as an unaffordable card of the hand is, and plain once shown large, as every card shown large is."
- "The right click shows a card large over the window, and a press beside it or the back key takes it down onto the window." becomes "… takes it down onto the window where it stood."

`docs/CHRONICLE-SCREEN.md`, _The windows_, the capstone paragraph: "…takes it down onto the window, as on the deal." becomes "…takes it down onto the window where it stood, as on the deal."

No player-facing text is added.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In scope:

- All of the overlay's cards shown large go through one `standLarge`: over the aim window, the deal window and the capstone's window, over the ending screen, and over nothing, for a card of the hand or a name on the hand or the discard pile.
- `Carried`'s `inspection` goes, and so do the overlay's own `createStack`, the relay that raised a window again when its last card came down, and the wipe that cleared a window for a card shown large.
- Every card shown large is drawn plain, `NO_REFUSAL`. The refusal no longer travels down to a card shown large, from the hand or from the deal.

Out of scope: the browse, which already stands this way; the civilization's browse; the campaign screen's cards shown large; the look of the double scrim, which is the browses' today.

Corner cases decided with the user:

- **A refusal note over a deal answer.** A note standing over the answer goes down as a card rises large over the window. A press already takes it down; this covers the inspection key, which shows the ringed answer large with no press.
- **The wheel.** The wheel does not scroll the aim window's grid, or any grid, while a card stands large over it. The grid also does not move under the card by any other means.
- **The ring and the scroll.** The deal's ring and the grid's scroll stay as they stood under the card and after it comes down.
- **The ending screen.** Nothing on it answers a right click, so no card rises over it in play. If one ever does, it stands over the ending screen as over any window, and the ending screen is not wiped.
- **A hand card shown large over nothing.** It looks exactly as today: one scrim over the chronicle screen, `covering` told the screen is covered while it stands.
- **A window raised while cards stand large.** A deal raised by the end-turn key while a hand card stands large still replaces what stands, the cards shown large among it, as the wipe does today. The end-turn key reaches the screen under a card shown large today, and still does.

**Traps:**

- **Strata.** The windows lay their pieces on `scene.strata.carried`: the grid, its frame, the title and the lore. `standLarge` puts its scrim on the scrim stratum at depth 1, and its cards on `carried`. Left where they are, the windows' pieces would stand over the card's scrim, undimmed, sharing a layer with the card. The browse stands under the scrim because it lays on the scrim stratum (`inspectingUnder(scene.strata.scrim, …)` in `src/ui/overlay.ts`). The windows' pieces must stand under the card's scrim as the browse's do. See `docs/PHASER.md`, _Scenes and stacking_: in a Layer, depth decides before the order added.
- **The note stratum.** The refusal note stands on the `note` stratum, over the card's scrim, and hides only on a press (`src/ui/refusal-note.ts`). Taking it down as a card rises is this line's work.
- **The wheel.** The overlay's grid scrolls on the scene-wide `wheel` event (`scene.input.on('wheel', …)` in `src/ui/overlay.ts`), which hears the notch whatever stands over the grid. The browse's panel listens on its own zone, which the card's scrim covers (`docs/PHASER.md`, _The pointer's readings_: an object's wheel reaches the topmost interactive object alone). Today the grid is simply gone under a card; after this line it is there and must not scroll.
- **The scroll offset.** `wipe` keeps the grid's scroll offset (`scroll.stand(scroll.offset)`) only so the relay lays the window again where it was. `aimDiscardPile` resets it to 0 for a fresh window.
- **Keys.** The overlay's `takes` is heard only as `browseLarge`'s `Beneath`; see the comment at its creation in `src/ui/overlay.ts`. Its `passes`, `!holds(press)`, lets the pan and zoom keys and the end-turn key reach the chronicle screen while a card stands, exactly as `Inspection` did. That key path must survive the move unchanged. With a card standing, the inspection key does nothing and the back key takes down the newest card, never raising the menu.
- **Refusal.** `standLarge`'s `show` already draws `NO_REFUSAL`. `Stack.show(face, refusal)`, `Overlay.inspect(card, refusal)`, `hand.ts`'s `inspect` press and `chronicle-scene.ts`'s inspection key carry a refusal only to draw it large.
- **Hovers.** `docs/INTERFACE.md`, _What stands over what_, requires two things of the grid's hover: when a card rises, every hover under it ends, the grid's small card and kind bubble among them; when the scrim falls, the pointer is on what stands under it again before it moves. The grid reads the pointer on its frame's `pointermove` and in the update's `moved` re-read. The browse does this through `inspectingUnder` and its panel. Check that the grid still meets both rules once it stands under a card instead of being laid again.
- **Spec names.** `e2e/` reads the card shown large by the names `inspection` and `inspection-<n>`, which `createStack` gives and `standLarge` keeps.

**Plan:**

1. `src/ui/stack.ts`. A card shown large is drawn plain. The stack no longer takes a refusal. Leaves the campaign screen and both browses as they are.
2. `src/ui/overlay.ts`. Everything the overlay shows large goes through its one `standLarge`: the windows, the ending, and over nothing. The windows' pieces stand under the card's scrim. The grid holds still under a card, whatever the wheel does. A refusal note goes down as a card rises. The second stack, the `inspection` state and the relay are removed. Leaves one way of standing a card large in the whole game.
3. `src/ui/hand.ts` and `src/ui/chronicle-scene.ts`. They stop handing a refusal to a card shown large, as far as step 1 makes them.
4. `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md`. The Spec's sentences go in.
5. `e2e/deal.spec.ts`. The existing test gains, at the right click on `deal-card-1` (around line 80), two checks on the answer shown large:
   - The deal window stands under it: `deal` and `deal-card-1` stand, and the lore still reads.
   - Ring `deal-card-0`, press the inspection key: `inspection` shows `answers[0]`, `deal` still stands, and once the back key takes the card down the ring still stands.

**Verify:**

- Commands: `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/deal.spec.ts`.
- CI proves on the push: `e2e/capstone.spec.ts`, `e2e/reference.spec.ts` (an answer shown large over the deal, names stacked on it), `e2e/hover.spec.ts`, `e2e/inspect.spec.ts`, `e2e/browse.spec.ts`, `e2e/camps.spec.ts`, `e2e/ending.spec.ts`, `e2e/menu.spec.ts`, `e2e/controls.spec.ts`, and the rest of `npm run e2e`.
- A visual-check at the hand-back, through the `visual-check` skill, with this checklist:
  - The deal window with an answer shown large: the window's title, lore and cards stand dimmed under the card's scrim, and no piece of the window stands over the card or undimmed.
  - The same on the capstone's window at the opening.
  - A card of the hand shown large alone: one scrim, as before.
  - An unaffordable card, from the hand or the deal, shown large and drawn plain, where the app offers one.
  - No console error.
