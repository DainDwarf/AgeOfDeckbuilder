# The scrim hears the wheel through one door

**Line:** The scrim hears the wheel through one door — every surface reads the wheel once, at its scene, through the one reading the map's zoom goes through, which drops a wheel turned with Ctrl, Meta or Alt as the browser's, and hands it to what scrolls: the overlay to what stands on its scrim, still under a card shown large, the collection screen to the panel under the pointer; no panel, browse or window subscribes a wheel of its own, and the debug console covering the pointer refuses no wheel. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`.

- _Controls_: after the sentence "The wheel binds nowhere, and a slot listening does not take it: it scrolls what scrolls under the pointer, and on the chronicle screen, while nothing stands on a scrim, it zooms the map one notch a notch." add: "Turned with Ctrl, Meta or Alt held, the wheel is the browser's as a key is: it scrolls nothing and zooms nothing."
- _The debug console_: the sentence "The pointer is not its: the map still pans and zooms under it." becomes "The pointer is not its: the map still pans and zooms under it, and what scrolls still scrolls."
- No player-facing text.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: one reading of the wheel event for the whole game. The chord is dropped there, the delta is handed on raw to what scrolls, so a trackpad's stream scrolls smoothly as it does today, and the map's notch counting stands on top of that reading. The next board line flips the sign there.
- In: the overlay scene hears the wheel where it hears the two keys that pan up and down, and offers both to the one widget drawn on it; the widget answers what scrolls now, the browse's panel or a window's grid, and nothing while a card stands large. The chronicle's overlay and the meta's browser subscribe no wheel.
- In: the collection screen hears the wheel at its scene and hands it to the panel under the pointer, as it hands the pan keys; a panel subscribes no wheel of its own, and the distinction between a panel wheeled under the pointer and one wheeled anywhere goes with it.
- In: the debug console covering the pointer refuses no wheel: a wheel over the console's strip scrolls what stands under it, as it zooms the map there; the console's reading of what it covers goes if nothing else reads it.
- Out: the map's zoom, the notch size, the pan keys, the inversion setting, and a wheel on the collection screen where no panel is under the pointer, which scrolls nothing as today.
- Corner: a wheel over the Menu button still zooms the map, the button stopping no wheel; a wheel over a scrim of the menu still reaches nothing beneath, the menu scene stopping it; the tree still hears no wheel. All unchanged.

**Traps:**

- The scene-level wheel is Phaser's `POINTER_WHEEL`, emitted with the interactive objects under the pointer as its second argument (`node_modules/phaser/src/input/InputPlugin.js:1655`). Which panel is under the pointer is read off that list inside the handler, never by a hit test: a hit test from inside an input handler refills the list Phaser's dispatch is walking (`docs/PHASER.md`, _The pointer's readings_), which is why `Panel.pointed` (`src/ui/panel.ts:172-177`) is read from the game loop alone.
- The map's reader (`src/ui/keys.ts:75-95`) counts notches of 100 inside a 200 ms window and drops chords through `chorded` (`:40-42`). The scrim and the panels scroll by the raw delta: `e2e/browse.spec.ts:299-333` wheels by fractions of a notch and expects motion. So the shared reading hands the delta raw, and the notch counting stays the map's.
- The overlay scene gates the pan keys on the menu's `covered()` (`src/ui/overlay-scene.ts:56-58`) because a key held reaches it whatever stands; the wheel needs no gate, the menu scene stopping a wheel over its scrim (`src/ui/menu-scene.ts:215-219`), and the menu scene reads no wheel.
- A listener on a scene's input drops at shutdown (`src/ui/design-space.ts:147-151`), and the overlay is restarted ahead of each screen, so a reader wired in its `create` re-arms per screen; the two readers today (`src/ui/browse.ts:234-239`, `src/ui/overlay.ts:818-826`) go away the same way, and both gate on `large.standing` beside the pan keys' gate (`browse.ts:231-233`, `overlay.ts:827-831`).
- The panel's wheel (`src/ui/panel.ts:273-281`) refuses the wheel under the console through `consoleCovers` (`src/ui/debug-console.ts:196-198`), the console's only reader; the grid's (`src/ui/overlay.ts:823`) does not. The console's strip is 158 design pixels tall (`debug-console.ts:34-36`) and a browse's frame begins about 127 down, under its title, so they overlap by about thirty pixels: a wheel there is the test.
- `e2e/controls.spec.ts:366-373` proves Playwright puts a held Control on a wheel, asserting the map does not zoom under one; the same shape proves a browse holds still under one.
- The `Wheeled` parameter of `createPanel` (`src/ui/panel.ts:164-167`, `:197`) and its arguments (`browse.ts:184`, `collection-screen.ts` at five calls) exist only to keep a scrim's panel from hearing a notch twice; with no panel subscribing a wheel, it has no second value.
- The specs read a browse's offset off its root's `y` and its `overflow` data (`e2e/chronicle-screen.ts:791-798`); a collection panel's root is named after the panel (`collection-panel`, `civilizations-panel`, `civilization-panel`, `civilization-mode-panel`) and carries the same data (`panel.ts:233`), so the same reading serves it under its name.
- No spec wheels a collection panel today, and the Nomadic content alone never overflows one. On the branch's padded content a new campaign's collection panel overflows in the collection mode (`workflow/BRANCH.md`, _The padding_), and the test opens there with `openCollection` (`e2e/chronicle-screen.ts:299`), asserting the panel's overflow above zero before it wheels. It holds only on the padding, so it is one test of its own, touching nothing else in the file, and the padding's leaving line removes it whole; the hand-back names it.
- `docs/PHASER.md` for anything else Phaser: read, never remembered.

**Plan:**

1. `src/ui/keys.ts`: one reading of the wheel for the game, the chord dropped, the delta raw; the map's notch counting on top of it, `src/ui/chronicle-scene.ts` behaving as before. Leaves standing: the map zooming as it did, a chorded wheel dropped in one place.
2. `src/ui/overlay-scene.ts`: the wheel heard beside the pan keys and offered to the one widget. `src/ui/overlay.ts`, `src/ui/browse.ts`: the widget answers both through the scene's door and subscribes no wheel. `src/ui/panel.ts`: the panel's own wheel, its console refusal and its wheeled parameter gone; `src/ui/debug-console.ts` loses the covering reading with its only reader. Leaves standing: a browse and a window scrolling under a wheel anywhere on the scrim, under the console too, still under a card shown large, nothing under a chord.
3. `src/ui/collection-screen.ts`: the wheel heard at the scene and handed to the panel under the pointer, read off the list Phaser hands. Leaves standing: the collection's panels scrolling under the wheel over their frame alone, as before.
4. `docs/INTERFACE.md`: the two sentences.
5. `e2e/browse.spec.ts`: on the pile browse, a wheel with Control held moves it nothing, and with the console open a wheel over the console's strip where it covers the frame moves it. `e2e/collection.spec.ts`, one test of its own: on a new campaign, the collection panel overflows, a wheel over it scrolls it, a wheel over the civilizations panel leaves it where it stood, and a wheel with Control held over it moves it nothing.
6. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof specs `npx playwright test e2e/browse.spec.ts` and `npx playwright test e2e/collection.spec.ts`, the collection's being the one that walks the panel's new door. CI's on the push: `deck-editing.spec.ts`, `civilization-mode.spec.ts`, `controls.spec.ts`, `map.spec.ts`, `press.spec.ts`, `menu.spec.ts`, `tree.spec.ts`, `console.spec.ts`, `deal.spec.ts`.
