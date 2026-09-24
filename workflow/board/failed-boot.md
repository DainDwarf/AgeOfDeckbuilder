# A failed boot says so

**Line:** **A failed boot says so** — when the boot throws, before the first screen stands, the page shows that the game could not start and the error's own words in place of the blank page, the error still reaching the console, and `e2e/failed-boot.spec.ts` proves it in a Chromium without WebGL. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md` gets a new section between _The launch page_ and _The debug console_, written out:

> ## A failed boot ✅
>
> When the game cannot start — the browser gives no WebGL, or the address names content the game does not hold — the page says so in place of the blank screen: that the game could not start, and under it the error's own words, so a report can carry them. Nothing on that page is pressed, and the game does not go on.

The one player-facing entry, in `src/ui/text.ts`: `'boot.failed': 'The game could not start'`. The second line is the thrown error's `message`, verbatim; it is not authored text and is no entry.

The one comment the user chose over a dogma edit, on the element's construction, in these words or shorter: `// Phaser cannot draw this: the boot that failed is the one that would have drawn it (DOGMAS.md, Stack).`

**Doc-impact:** `docs/INTERFACE.md`. `DOGMAS.md` is not edited: the user decided the exception to "all UI is Phaser" is stated by the comment above, not by the dogma's words. The egress-reviewer may flag the DOM element against _Stack_; the ship session relays that as a settled call, not as a finding.

**Scope:**

- In: a boot is everything from the module's start to the first screen standing — the address read, the game constructed, and the handler on `Phaser.Core.Events.READY` that starts the scenes. A throw anywhere in that span shows the page and is thrown on, so the console keeps the error and its stack as today. Both catch sites go through one function that shows the page; there are no other sites.
- In: the page is one DOM element the boot script builds on failure and appends to the body, covering the whole viewport whether or not Phaser already appended its canvas — a READY-time failure leaves a canvas standing, and an element after it in flow would be off-screen under `overflow: hidden`. `index.html` gains nothing; it still carries no UI.
- In: the look, from the mockup the user chose. Background the page colour, `LOOK.page`. The sentence centred, `UI_FONT`, 26px bold, `LOOK.paleInk`. The error's words under it, centred, 16px, `LOOK.answerInk`, in the debug console's monospace stack, wrapping inside the page's width. Colours through `css(...)` from `LOOK`, never restated as literals. Sizes are CSS pixels: the page is DOM, not the design space.
- Out: a runtime error once a screen stands. The game is not caught after the READY handler returns; a crash page is a line of its own if the user ever wants one.
- Out: a failure before the module runs — a script that fails to load, a bundle 404. Nothing inside the page can answer that.
- Out: a written reason per known cause. The error's own words are the reason; no branch on the cause.
- Corner: the address names content the game does not hold. Today the catalogue lookup throws before the game is constructed; it stays a throw and shows the page like any other boot failure. No fallback to the defaults.
- Corner: `window.game` is never set when the construction throws; the spec reads the DOM, not the game.

**Traps:**

- Measured 2026-09-24: Chromium launched with `--disable-webgl` (or `--disable-3d-apis`) makes `new Phaser.Game` throw synchronously, `Cannot create WebGL context, aborting.`, from `node_modules/phaser/src/core/CreateRenderer.js:49`; no canvas is created, the body stays empty, and Vite's dev client shows no overlay for it. The throw is synchronous because a module script runs with the document already interactive, so Phaser's `DOMContentLoaded` calls `boot` at once (`node_modules/phaser/src/dom/DOMContentLoaded.js:30-35`).
- A throw in the READY handler is asynchronous: it unwinds through Phaser's texture-ready emit and `game.start()` never runs. Playwright's `pageerror` catches it as it catches the synchronous one; `watch` in `e2e/chronicle-screen.ts` records both.
- Playwright's `launchOptions` is a worker-scoped option: a spec sets it with `test.use({ launchOptions: { args: ['--disable-webgl'] } })` at the top level of its file, never inside a `describe`, and gets a worker and a browser of its own. The config's `devices['Desktop Chrome']` still applies.
- `src/ui/text.ts` imports types only, so `src/main.ts` may read the entry before Phaser is touched.
- `index.html`'s style reset already holds the page colour as a literal, with `src/ui/look.ts`'s comment naming it; the new element takes the colour from `LOOK`, not from the reset.
- The e2e hook refuses a Playwright run that names no spec; the proof run names `e2e/failed-boot.spec.ts`.
- `docs/PHASER.md` _Rendering under WebGL_ already states that Phaser refuses to start where WebGL is missing; the page needs no new entry there.

**Plan:**

1. `src/ui/text.ts`: the entry. Leaves the typecheck green and nothing reading it yet.
2. `src/main.ts`: the one function that builds the page from the entry and an error, and throws the error on; the synchronous boot and the READY handler routed through it; the trap comment on the element. Leaves the game booting exactly as before where nothing throws, and `e2e/boot.spec.ts` green.
3. `e2e/failed-boot.spec.ts`: WebGL off at file scope; the bare address; asserts the sentence stands in the DOM, the second line equals the message of the one page error `watch` recorded, and no canvas was created. It asserts the equality, never Phaser's wording.
4. `docs/INTERFACE.md`: the section above. `workflow/BOARD.md`: the line deleted; this file deleted.

**Verify:** `npm run check`, `npm run lint`, `npm test`; the proof spec `npx playwright test e2e/failed-boot.spec.ts`. CI proves on the push: `e2e/boot.spec.ts`, which walks the unchanged boot path, and the rest of the suite.
