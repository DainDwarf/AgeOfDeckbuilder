# The collection scrolls

**Line:** The collection scrolls — `e2e/collection.spec.ts` proves, on a campaign holding the Stone Age's technologies, that the collection panel opens at its top holding more than its room and moves under the wheel, a held press and the pan keys, over itself alone, stopping at its first line and its last. Doc-impact: `docs/PHASER.md`.

**Spec:** `docs/META-SCREENS.md` → _The collection screen_, the paragraph "A panel holding more than its room shows scrolls…", which stands unchanged: the wheel scrolls the panel under the pointer, so do the two keys that pan up and down while held, a tap moving it one frame, the two that pan left and right do nothing, a press held on the panel drags it, the release lets it run on, a panel stops at its first line and at its last, one the room holds whole does not move, each panel scrolls on its own, and the screen opens with every panel at its top. `DOGMAS.md` → _Testing_: a spec opens on the save it wrote, rests before it presses, reads what stands together in one question.

Two entries are added to `docs/PHASER.md`, written out:

- Under _The pointer's readings_: **A scene's clock ticks once a frame, and a pointer's `time` is its event's.** `scene.time.now` is set from the step's time at each update (`src/time/Clock.js:370`), so every pointer event of one frame reads the same time there, while `pointer.time` reads the DOM event's `timeStamp` (`src/input/Pointer.js:1320`), which the mouse manager dispatches at once from the DOM handler (`src/input/InputManager.js:759`). The scroll's fling (`src/ui/scroll.ts`) reads the scene's clock, so a release runs a panel on only where two frames fall inside its window of 80 ms: never under 12.5 frames a second, which CI's runner is under.
- Under _Under a Playwright spec_: **A mouse step costs 115 to 230 ms under SwiftShader.** A drag of twelve steps takes 1.4 to 2.8 s and its moves land frames apart, so a spec's drag sets no panel running, and no spec asserts a fling.

No player-facing sentence is added.

**Doc-impact:** `docs/PHASER.md`, the two entries above. `docs/META-SCREENS.md` stands as it is.

**Scope:**

In: one test added to `e2e/collection.spec.ts`; the spec helpers it shares with the browse's spec, reshaped as the reconcile chose; the two `docs/PHASER.md` entries; the board line deleted.

Out: the fling. The scroll keeps reading the scene's clock, which is the user's call: the fling is to work on an ordinary machine, and it does at 60 frames a second. The spec asserts nothing about a release running on. The browse's spec's inline drag stays as it is.

The campaign the spec opens on: a fresh campaign with every technology the Stone Age's achievements earn learned, each with its needs, through `tools/learned-with-needs.ts` as `e2e/archipelago.spec.ts` does. The Stone Age is the second age the catalogue lists; its technologies are the ones its achievements name, which the forge's `--list` already reads (`tools/forge-save-body.ts`). Measured: the collection then holds 24 stacks, four lines of six, and overflows the collection mode's panel by 245 units; a fresh campaign holds 8 stacks and overflows nothing, and the panel overflows from the thirteenth stack. The civilizations panel holds one pile and overflows nothing.

What the test asserts, in order, each gesture from the panel's top, the collection panel read off its root's `overflow` data and its `y` as the browse is:

1. The screen opened, the collection panel stands at offset 0 with an overflow above 0, and the civilizations panel at 0 with no overflow.
2. The wheel over the collection frame's middle by one notch moves it above 0 and short of the overflow; a wheel far down stands it at the overflow; a wheel far up stands it at 0. The wheel over the civilizations frame by a notch moves the collection panel nothing: each panel scrolls on its own.
3. A press held on the collection frame's middle and carried 120 units up through the standing drag helper moves it at least 120 units and no further than the overflow. Then a wheel far up stands it at 0 again, which also stops any run-on.
4. With the pointer resting on the collection frame: the pan-down key held stands it at the overflow and holds it there while the key stays down 200 ms more of the game's clock; the pan-up key held stands it at 0; a tap of pan-down moves it above 0 and less than a 200 ms hold does. With the pointer resting on the civilizations frame, a 200 ms hold of pan-down moves the collection panel nothing. The pan-left and pan-right keys held 200 ms each move it nothing.

The drag's assertion admits a release that runs on and one that does not: at least the travel, at most the overflow. The right-panel wheel and key assertions read the collection panel's offset unchanged, not the civilizations panel's, which cannot move.

Reconcile:

- The scroll readers `scrolled` and `offsetOf` in `e2e/chronicle-screen.ts` name the browse. They take the panel's name as a parameter, the browse the default; their uses in `e2e/browse.spec.ts`, `e2e/controls.spec.ts` and `e2e/press.spec.ts` stand unchanged.
- The `wheel` helper there wheels over the browse's frame. It takes the frame's name as a parameter, the browse's frame the default.
- The key hold `heldFor`, local to `e2e/browse.spec.ts`'s pan-key test, moves beside the other helpers, taking the panel's name as the readers do, and both specs use it.
- The drag goes through `dragBetween` as it stands, from the frame's middle to a point 120 units up on the page, the unit read off the frame's screen reading.

**Traps:**

- The pan keys move the panel under the pointer, which `src/ui/collection-screen.ts` reads through the panel's `pointed`, a hit test from the game loop: the pointer must have been moved onto the frame by a Playwright move and a rest before the key goes down, and a move to the coordinates the pointer already rests on is no move Phaser sees (`docs/PHASER.md` → _Under a Playwright spec_). The browse's pan-key test moves the pointer beside the cards for the same reason.
- In the collection mode nothing carries: a press held anywhere on the collection frame, on a stack's face included, drags the panel (`src/ui/collection-screen.ts`, the collection mode hands no moves). A drag's travel is measured in device pixels against the drag slack (`docs/PHASER.md` → _The pointer's readings_); 120 units is past it, as the browse's drag is.
- The scroll's fling reads the scene's clock: a release may run the panel on where two frames fall inside 80 ms, locally at times, on CI never. The drag's assertion admits both, and the wheel after it stops a run-on before the keys are read.
- A key held moves the panel at the pan speed, 1200 units a second of the game's clock, and Phaser caps a frame's delta at a sixtieth of a second for its first 120 frames: at CI's frame rate the 245 units take a second or two of wall clock, inside a poll. The pan-key assertions poll, as the browse's do, and hold the key down until the poll answers.
- Specs on a screen whose panels overflow have flaked red on CI from frame starvation before, when padding cards filled every panel. This test is the first real overflow since. A red run of it on CI with the frame rate as the only cause is reported as that known flake, not loosened.
- A full collection draws a frame in about 32 ms locally under SwiftShader; a question to the page waits out a frame, so what stands together is read in one `readings` call.
- `window.named` reaches a panel's root by name under the collection scene; the collection panel's root is `collection-panel`, its frame zone `collection-panel-frame`, the right panel's `civilizations-panel` and `civilizations-panel-frame`. A read of the root's `y` negated reads −0 at the top; the standing reader adds 0 for that.
- The pan keys' codes are read from the controls' `DEFAULTS` as the browse's test reads them; the test skips none of the four.
- `e2e/collection.spec.ts` imports `freshCampaign`, `CATALOGUE` and `plantCampaign` already; `openCollection` reads the names, loads the bare address and opens the collection from the campaign screen.

**Plan:**

1. `e2e/chronicle-screen.ts`: the scroll readers and the wheel helper take a name with the browse as the default; the key hold comes in from the browse's spec, taking a name the same way. Every standing spec passes as before.
2. `e2e/browse.spec.ts`: the pan-key test uses the shared key hold; nothing else changes.
3. `e2e/collection.spec.ts`: the test, on the campaign with the Stone Age's technologies learned, asserting the four points above in order; where the Stone Age's technologies are listed from the catalogue is the implementer's, the forge's reading being the precedent.
4. `docs/PHASER.md`: the two entries, under the sections named.
5. `workflow/BOARD.md`: the line deleted.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- The proof: `npx playwright test e2e/collection.spec.ts`.
- CI's on the push, not run locally: `e2e/browse.spec.ts`, `e2e/controls.spec.ts`, `e2e/press.spec.ts` for the reshaped helpers; `e2e/deck-editing.spec.ts`, `e2e/civilization-mode.spec.ts` for the collection screen.
