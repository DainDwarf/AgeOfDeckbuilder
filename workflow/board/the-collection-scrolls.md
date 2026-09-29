# The collection scrolls

**Line:** **The collection scrolls** — a panel of the collection screen holding more than its room shows is cut at its edges under its word and scrolls, by the wheel under the pointer and by a press held, and runs on at the release, as a browse does; a panel the room holds whole does not move, and a new campaign's screen stands as it did; the scroll's test in `src/ui/` passes. No spec: no collection the game's content produces fills the room.

**Spec:** `docs/META-SCREENS.md`, _The collection screen_. The paragraph to add, after the section's first paragraph:

"A panel holding more than its room shows scrolls, its word standing still over it and its cards cut at the panel's edges. The wheel scrolls the panel under the pointer, whatever the wheel is bound to; a press held on the panel drags it, and the release lets it run on until it slows to a stop. A panel stops at its first line and at its last, and one the room holds whole does not move. A card scrolled out of its panel answers nothing. Each panel scrolls on its own; the screen opens with every panel at its top, and a card shown large leaves them where they stood. No key scrolls a panel."

No player-facing text.

**Doc-impact:** `docs/META-SCREENS.md`.

**Scope:**

In:

- The scroll of a panel, one piece any panel of the collection screen is handed to, and the collection mode's two panels handed to it: the collection and the civilizations.
- The feel is the browse's, `src/ui/overlay.ts`: the wheel moving the panel by what the wheel turned, the drag moving it by what the pointer moved, the release running on at the drag's speed and slowing, a press on the panel stopping a run. Its numbers are the browse's own, read from one place and never typed again.
- In this line a drag scrolls wherever on the panel it starts, on a stack and on a pile too.
- The right click and the rest on a card go on answering on a panel that scrolls, on the card as it stands after the scroll; what a card raised follows it, and goes down once the scroll takes the card out from under a still pointer, as on a browse.
- The test, Vitest, on the scroll's pure half: a panel stops at its first and its last line; a panel the room holds whole does not move; a card scrolled out of its panel answers nothing at the place it would stand.

Out:

- A scrollbar, or any mark that a panel holds more: the line cut at the panel's foot is the mark.
- Any key.
- The deck editing mode's and the civilization mode's panels: each line hands its own panels to the scroll.
- A drag that carries a card: from **A copy is dragged across** on, a press held on a stack carries its card and the panel is dragged by its bare ground alone. That line's sentence on the board says so.
- A Playwright spec. It is owed by the Stone Age rung, whose sentence on the board says so.

Corner cases decided here:

- The pointer over the navbar, the bar or the edge between the two panels scrolls nothing.
- Under a card shown large, under the menu and under the debug console, the wheel scrolls no panel.
- A release off the canvas ends the drag and the panel does not run on, as on a browse.
- A panel whose contents shrink under it, a later line's doing, stands no further than its new last line.

**Traps:**

- This line ships after **The collection screen shows the collection**, whose scene it changes. If the board shows that line unshipped, stop and report.
- There is no geometry mask under WebGL: the cut is a Mask filter, its source rectangle off every display list, laid through the view camera, and the renderer's `maxTextures` left at Phaser's default (`docs/PHASER.md`, _Rendering under WebGL_). The browse's cut in `src/ui/overlay.ts` is the working instance.
- A cut hides and does not stop input: an object scrolled out of the frame still answers a press where it stands. The browse answers every press through its one frame and reads the card under the pointer by arithmetic; the collection screen's cards, which the line before this one made answer the right click, are brought under the same rule.
- Phaser re-checks what the pointer is over only when the pointer moves (`docs/PHASER.md`, _The pointer's readings_): a wheel scroll moves cards under a still pointer, and what the pointer is on is read again by the game, at the next frame and outside the dispatch, never from inside the wheel's handler, where a hit test refills the list being walked.
- The wheel reaches the screen twice: as Phaser's own `wheel`, which scrolls, and as a notch bound like a key through `src/ui/keys.ts`, which the screen must not answer as the key it is bound to.
- `dragDistanceThreshold` is in device pixels, and a pointer's `x` and `y` are in backing-store pixels, not design units (`docs/PHASER.md`): a drag's distance goes through the stratum's `at`.
- A drag ends at any button's release, and a release off the canvas is known by `pointer.upElement` alone (`docs/PHASER.md`); `releasedOffCanvas` is the reader the browse uses.
- A listener left on an emitter outlives the scene across a restart: the frame update subscribes through `whileUp` (`docs/PHASER.md`, _Across a restart_).
- A rotated or masked Text under SwiftShader is where the e2e suite and the ui-check agent see what no GPU shows (`docs/PHASER.md`): the visual check is run on this line, not skipped for want of overflow.

**Plan:**

1. The scroll's pure half and its test, beside the screen in `src/ui/`.
2. The panel's scroll on the screen: the cut, the wheel, the drag and the run, every press on a panel answered through the panel's frame.
3. The collection mode's two panels handed to it.
4. `docs/META-SCREENS.md`, the board line deleted, this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: none. `npx playwright test e2e/collection.spec.ts` is run once as a diagnosis, for the question "does the screen of a new campaign still stand and answer as it did".
- The `visual-check` skill, on the collection screen of a new campaign: no card cut, no card missing, the words standing.
- CI's on the push, listed for the hand-back: `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/launch.spec.ts`, `e2e/campaign.spec.ts`.
