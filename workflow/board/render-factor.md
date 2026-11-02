# The render factor

**Line:** **The render factor** — the game follows a move to a monitor of another pixel density as it follows a resize, the backing store regrown and the screen as sharp as the new screen, and the Graphics window lists a **Fullscreen** row that puts the game over the whole screen from inside and reads what the browser did. Doc-impact: `docs/INTERFACE.md`, `docs/PHASER.md`.

**Spec:**

A window resize, the browser's zoom, a devtools dock, F11 and itch.io's fullscreen button already reach the game as a window resize, which the scale manager hears and `followWindow` follows (since 2026-09-02, `e2e/window.spec.ts`). Two things are left: a move to a monitor of another pixel density fires no resize (measured 2026-11-02: the ratio emulated to 3 under the running game, the backing store stayed at 1280 by 720, no `resize` event), and nothing puts the game fullscreen from inside. The render-scale clause of the board line was dropped at intake by the user: a browser game has no resolution to pick, the window being the resolution.

`docs/INTERFACE.md`, a new section after _The debug console_:

> ## The window ✅
>
> The screen is one design, 1280 by 720 units, laid out once and drawn at the window's own pixels: the design fills the window as far as its shape allows, the page bare around it, and every line, glyph and letter is painted at the window's pixel density, so the game is as sharp as the screen it stands on at every size. It follows every change of the window while the game runs — a resize, the browser's zoom, fullscreen entered or left, a move to a monitor of another pixel density — and nothing on the screen moves for it but its size and its sharpness.

`docs/INTERFACE.md`, _The menu_, the Graphics paragraph, rewritten whole:

> **Graphics** lists **Animation speed** and **Fullscreen**. Animation speed is a row reading how fast the chronicle screen's motions play ([`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)), ×1, ×2 or ×4 the speed they were designed at, a press moving it to the next and ×4 back to ×1; a change takes at once, a motion in the air included, and a motion of the hand's own — a scrolled panel's fling, a held key's pan — is no motion of the chronicle's and keeps its pace; the speed is kept in the browser from one launch to the next. Fullscreen is a row reading whether the game stands over the whole screen, On or Off, and a press turns it: on, the browser puts the game over the whole screen; off, it comes back into the page. The browser's own way out of fullscreen turns it off too, and the row reads what the browser did; it is not kept from one launch to the next, since a browser grants fullscreen on a press alone. **Back** closes the window as it does Controls.

`docs/PHASER.md`, _Across a restart_, a new entry after "The scale manager refits the canvas, not the backing store":

> - **The scale manager hears the window's `resize` and the document's `fullscreenchange`, and nothing of the pixel ratio** (`src/scale/ScaleManager.js:1565`, `:1583`); its poll reads the parent's bounds in CSS pixels every 500 ms (`:1706-1726`) and catches it no more. A window moved to a monitor of another density keeps its size in CSS pixels, so no resize fires and the backing store stands at the old density until `refresh` (`:1364`, `:1486`) emits RESIZE for it. The browser has no event for the ratio either: a media query on the current ratio, `(resolution: <ratio>dppx)`, changes once when the ratio leaves it, and is made again on the new one (MDN, `Window.devicePixelRatio`). `startFullscreen` is granted inside a pointer release's handler alone (`:1295-1297`), and F11 is the browser's own fullscreen, not the document's: `fullscreenElement` stays empty under it, and the scale manager hears it as a resize.

`src/ui/text.ts`, the Graphics entries:

```ts
'graphics.fullscreen': 'Fullscreen',
'graphics.on': 'On',
'graphics.off': 'Off',
```

**Doc-impact:** `docs/INTERFACE.md` (the new section, the Graphics paragraph), `docs/PHASER.md` (the scale manager entry).

**Scope:**

- In: a listener on the pixel ratio that asks the scale manager to refresh when it changes, hooked at boot beside `followWindow`, so a hop regrows the backing store, re-zooms the cameras and re-cuts the texts through the one RESIZE path that already does it; the Fullscreen row under Animation speed in the Graphics window, its button reading On or Off from the scale manager's state and following its enter and leave events while the window stands; the two spec additions; the docs.
- Out: a render scale or a resolution picker (dropped at intake by the user); storing the fullscreen state; a keyboard lock to keep Escape from leaving fullscreen; any change to how texts are re-cut or cameras re-zoomed, which already follow RESIZE; the itch.io page itself, which this line does not visit.
- The row never goes through the pure-module-and-Vitest shape the speed has: it decides nothing of its own, the browser says on or off. Reconcile: the row goes through the standing turning-row shape as it is; the hop goes through the standing RESIZE path as it is, the listener being the only new piece; the speed's pure module and the row stay apart.
- Corner cases decided here: a fullscreen request the browser refuses or does not support (an iframe without `allowfullscreen`, a browser without the API) leaves the row reading Off and says nothing — no warning, no note. The browser's Escape leaves fullscreen and the row follows; whether that Escape also reaches the game as the back key is the browser's doing and is reported in the hand-back, never built around. F11 is the browser's own fullscreen: the row reads Off under it while the game fills the screen all the same through the resize. The row is live on every screen the menu stands on, the launch screen and the ending included, since the Graphics window is one window.
- Measured, for the record: under SwiftShader at a 1280 by 720 window the frame is 22 ms at a backing of 1280×720, 38 at 1920×1080, 62 at 2560×1440, 126 at 3840×2160; 118 Text objects stand on the chronicle screen. On the user's GPU the frame holds 16.6 ms at every size (`measurements` memory, 2026-10-01).

**Traps:**

- The scale manager entry above, written by this line, is the platform fact the listener rests on: the media query fires once and must be made again on the new ratio, or the second hop goes unheard.
- `followWindow` already compares the backing store to what the window calls for and resizes only where they differ, so a refresh on a ratio change costs nothing where the backing is right already, and the listener needs no comparison of its own.
- Everything laid out on a resize reads the window and the scale manager live, never RESIZE's size arguments: the resize `followWindow` triggers emits RESIZE again, nested inside the one being handled (the comment over `onResize` in `src/ui/design-space.ts`).
- `onClick` in `src/ui/design-space.ts` runs its handler on `pointerup`, which is the gesture the Fullscreen API demands; the request is made inside that handler, with nothing deferred between the release and it.
- A listener left on the scale manager outlives the menu window: the row's reading follows the enter and leave events through `whileUp`, which drops it at the scene's shutdown (`docs/PHASER.md`, _Across a restart_).
- `rowsAbove` in `src/ui/menu.ts` counts the Graphics window's rows over its buttons; it grows by one row, and `bodyHeight` follows it.
- `e2e/window.spec.ts` carries a `measure` helper reading the backing store against the canvas's on-screen size in device pixels; the hop test reuses it. The ratio is changed under the running game through the devtools protocol, `page.context().newCDPSession(page)` then `Emulation.setDeviceMetricsOverride` with the viewport's width and height, the new `deviceScaleFactor` and `mobile: false`; measured, the override fires no `resize` event, so the test proves the listener and nothing else could pass it. The test waits for the canvas's width to change, as the standing test does, before measuring.
- Whether headless Chromium grants `requestFullscreen` is unknown at intake. The graphics spec's new test presses the row and asserts the row's reading and `document.fullscreenElement`; the implementer runs it as a diagnosis first and reports what headless did. Where headless refuses, the test asserts what the platform allows — the row reading Off after the refusal — and the hand-back says the On reading is proven only by hand. Under fullscreen headless, the viewport does not change, so the test never expects the backing store to move.
- `e2e/graphics.spec.ts` names the speed row `graphics-animation-speed` and reads its button as `${ROW}-label`; the fullscreen row follows the naming, `graphics-fullscreen`.
- The text entries carry a glossary-exception comment only where a word collides; On, Off and Fullscreen collide with nothing.

**Plan:**

1. `src/ui/design-space.ts` and `src/main.ts`: the ratio listener, hooked at boot beside `followWindow`; `e2e/window.spec.ts` gains the hop test. Leaves standing: a hop followed as a resize is.
2. `src/ui/text.ts`, `src/ui/menu.ts`: the three entries and the Fullscreen row under Animation speed, the window's body grown, the reading following the scale manager's events while the window stands; `e2e/graphics.spec.ts` gains the fullscreen row's test. Leaves standing: the row on every screen's menu.
3. `docs/INTERFACE.md`, `docs/PHASER.md`: the sentences above, verbatim. `workflow/BOARD.md`: the line deleted.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- The proof spec: `npx playwright test e2e/window.spec.ts`.
- The implementer's diagnosis: `npx playwright test e2e/graphics.spec.ts`, for the question whether headless grants fullscreen; its answer goes in the report.
- CI proves on the push: `e2e/window.spec.ts`, `e2e/graphics.spec.ts`, `e2e/menu.spec.ts`, `e2e/controls.spec.ts`.
