# Robust browse specs on CI

**Line:** **Robust browse specs on CI** — the game's clock is the wall clock from its first frame, Phaser's delta smoothing turned off in the game config and `docs/PHASER.md` saying so, and the browse spec's pan test is two tests, every assertion kept. Doc-impact: `docs/PHASER.md`.

**Spec:** `docs/PHASER.md`, section _Scenes and stacking_, one entry added after the two time-scale entries, written out:

> - **Phaser holds each frame's delta to a sixtieth of a second for its first 120 frames and while the window is blurred, and smooths it over the last ten** (`src/core/TimeStep.js:570-604`), so under 60 frames a second a scene's timers, its tweens and a held key run slow until the frames are counted out, 6× slow on a browse drawn at 10. The game turns `fps.smoothStep` off in its config (`src/core/Config.js:343`, `TimeStep.js:731-737`), so the delta is the frame's own length and a span in the game is a span of the wall clock at any frame rate, a frame after a long block included: what moves on the delta clamps to its reach, and a tween past its duration ends.

No player-facing sentence: the line changes no text.

**Doc-impact:** `docs/PHASER.md`.

**Scope:**

- In: the game config gains `fps: { smoothStep: false }`; the PHASER.md entry above; the browse spec's pan test (`e2e/browse.spec.ts:167`) split in two at its seam, both opening on `overflowingPiles()` as it does: one test for the two keys scrolling the browse to its last line and its first wherever the pointer stands and a tap moving it less than a hold, the other for a card shown large holding the browse still under the keys and the wheel, over the frame and off it, and the sideways keys moving nothing; the second test taps the key once itself for its baseline instead of reading the first test's. Every assertion of the standing test lands in one of the two.
- In, as a tidy the line makes true: the `waitGameClock` comment in `e2e/chronicle-screen.ts` stops citing the 120-frame cap, and says only that it waits on the clock a scene's timers run on; the helper itself stays, since a wait on the timer's own clock is the exact wait. The reference spec's `waitGameClock(page, REST)` before its first small-card poll (`e2e/reference.spec.ts:75`) and its `REST` constant go: they guarded the cap and guard nothing now, the poll alone reads the rise.
- Out: the small-card test (`browse.spec.ts:292`) and every other poll on a rest or a hand-over stay as written — with the cap gone a rest is its own span on the wall and a 5 s poll holds it. No poll budget and no test timeout is widened. The browse's draw cost under SwiftShader (10 fps locally against 22 for the chronicle screen) is not this line.
- Reconcile: the reference spec's pre-poll wait was the standing patch for this disease; the projected design makes it redundant, so the two become one by removing the patch. The precedent for the split is the reference spec's two tests opening on one deal (commit 7a1d071).

**Traps:**

- `smoothStep` off removes three things at once: the 120-frame cap, the cap while the window is blurred, and the 200 ms clamp on a long frame (`TimeStep.js:583-592`). A frame after a long main-thread block, a save written or a spec's heavy question, hands its whole length: `scroll.pan`, the fling's `step` and the map camera's pan clamp to their reach (`src/ui/scroll.ts`, `src/ui/map-camera.ts`), tweens complete, timers fire. Nothing reads `delta` expecting a ceiling; `delta` is read in `src/ui/keys.ts`, `scroll.ts`, `panel.ts`, `tree.ts`, `map-camera.ts`, `overlay-scene.ts`, `collection-screen.ts`, `browse.ts` alone.
- The config key is `fps.smoothStep` (`node_modules/phaser/skills/game-setup-and-config/SKILL.md:350`); the Game config in `src/main.ts:108` has no `fps` block yet.
- Measured on the standing code, headless Chromium, locally: the browse draws at 9.8 fps, one page question costs 105 ms there, `rested` 206 ms, a five-step mouse move 500 ms; the 120 frames ran out 12 s into the spec. CI is about 2× slower on every browse test. So the split halves each spend ~3 s of CI on their open; a half at over 20 s on CI is a finding, not a budget to raise.
- The pan test's `heldFor` reads the offset after a wall-clock hold of 200 ms now; a tap through `page.keyboard.press` moves the browse by one frame's pan, which is `PAN_SPEED × delta / 1000` of that frame, so a tap's offset is small and varies by frame length; the standing assertions compare a tap against a hold and against zero, never against a literal, and that holds.
- `docs/PHASER.md` cites files and lines under `node_modules/phaser/`; the entry's citations are read before they are written.

**Plan:**

1. `src/main.ts`: the Game config gains the `fps` block. `docs/PHASER.md` gains the entry. Leaves the game's clock on the wall and the page saying so.
2. `e2e/chronicle-screen.ts`: the `waitGameClock` comment reshaved. `e2e/reference.spec.ts`: the pre-poll REST wait and its constant removed. Leaves no citation of the cap in the tree but PHASER.md's.
3. `e2e/browse.spec.ts`: the pan test split in two as Scope says. Leaves the browse spec at seven tests.
4. `workflow/BOARD.md`: the line deleted; this file deleted.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/browse.spec.ts` green, the two halves each well under their 30 s. CI proves on the push: `reference.spec.ts`, `hover.spec.ts`, `tree.spec.ts`, `launch.spec.ts`, `controls.spec.ts`, `campaign.spec.ts`, `map.spec.ts` (the other specs polling on a rest), and the whole suite, since the clock change reaches every spec.
