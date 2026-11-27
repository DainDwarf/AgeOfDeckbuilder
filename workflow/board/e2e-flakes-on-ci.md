# The e2e flakes on CI

**Line:** The e2e flakes on CI — specs fail on CI now and then across the suite, once again a lot lately: nine red runs since 2026-11-16, each on a test that passes on the next push, the last two on the reference spec's terrain marked on the settle card. Done when `e2e/reference.spec.ts:278` passes 12 of 12 under `--repeat-each=12` at four local workers, where the code before the fix fails it; CI runs the Playwright suite on eight shards; `DOGMAS.md` _Testing_ says eight runners.

**Spec:**

- `docs/INTERFACE.md`: "**A mark of what a card goes on reacts as a name does.** The pointer resting on a terrain, a feature, the river or a building marked at the window's foot of a card raises that thing small, and a right click on it shows it large, each as a name of that thing in the card's text would." and "**A right click on a name shows the named thing large** …". The spec at `e2e/reference.spec.ts:278` asserts these on the settle card; the design is right, nothing on the page changes.
- `DOGMAS.md` _Testing_, **The Playwright suite is CI's.**: "split by spec across four runners" becomes "split by spec across eight runners". Nothing else in that bullet changes; "no retries" stays, at the user's word.
- No player-facing sentence.

**Doc-impact:** none in `docs/` — the design already states what the spec asserts. `DOGMAS.md` takes the one word above. `docs/PHASER.md` takes a trap line only if the diagnosis finds the cause in a Phaser behaviour the page does not state.

**Scope:**

- In: the diagnosis and the fix of `e2e/reference.spec.ts:278` ("a terrain marked on the settle card…"). It went red on CI runs 46003842864 and 46046147020 at line 312: the right click on the name read again by `liftedName` after the card is lifted a second time shows `forest` large where `plain` is expected. A parked note says it failed 10 times in 12 locally at four workers on the code before 8abc7120, so it predates the last deliveries.
- In: the CI matrix goes from four shards to eight (`.github/workflows/ci.yml`, the matrix, the `--shard=` argument, the comment above the job). The job's 40-minute limit stays. The repository is public, so the extra runners cost no minutes. On run 46034915974 the slowest of four shards took 35.5 minutes.
- Out: the suite's slowdown on CI (the same tests about 3.5× slower than on 2026-10-30, the boot-only test 1.0 s → 3.6–5 s). It is the next line, _Quick wins on the boot and the frame_, and the Deliverable rung after it. Retries on CI are out: the dogma stands.
- Out: the other red runs since 2026-11-16. Each was folded already (c6ae590c, a4a661b5, 84aa6216, efa23a4b, f61fb419, 554af3fd, 04f7d2c7, 3cc6fe2c, 9bff09a3).
- How the fix is chosen, decided here: the diagnosis says first which side is wrong.
  - If the game shows forest large under a pointer that rests on the name or mark the design says is plain's, a player meets it, so the game is fixed and the spec stays as written.
  - If the spec presses or reads a position before the card has come to rest, against _A spec rests before it presses or measures what just changed_, the spec is fixed.
  - Never by loosening the assertion, widening a poll or dropping the second right click: _A test is never weakened to make it pass_.
  - A cause that is neither, or both, is reported as a deviation before it is coded.
- Reconcile: `liftedPart` (`e2e/chronicle-screen.ts`) is the shared door every spec uses to read a part of a lifted card of the hand. A spec-side fix lands there, not in the one test, so every spec reading a lifted part gets it. The folds a4a661b5 (the tree's small card right-clicked on its kind label) and efa23a4b (a named card's spec presses off every name) met the same shape, a press near a name or mark of a card in motion, and are worth reading before the fix.

**Traps:**

- The failure needs load. One instance alone on a quiet machine passes. `--repeat-each=12` at the default four local workers runs four at once, which is how it was reproduced. Before reading a stall as a finding, check free memory (`Win32_OperatingSystem.FreePhysicalMemory`): the user keeps a ~21 GB game running and never closes it. Run with `--reporter=line` to a file, so a stall shows which test.
- The settle card carries terrain marks at its window's foot as well as names in its text, and a mark may stand on the card's middle (the comment at `e2e/reference.spec.ts:318`). `nameOnScreen(page, 'hand-0')` reads the text's first name. Whether a mark (forest's) and that name overlap on the lifted card, or come to overlap while it moves, is among the first things to read.
- `docs/PHASER.md`: a new object takes clicks only from the next frame, and a key tap or a pointer move lands one real frame's length, which is far longer on CI's software drawing than locally.
- The hook `.claude/hooks/named-spec.cjs` accepts `e2e/reference.spec.ts:278` as a named spec.
- The run that proves the eight shards is CI's own, on the push. No local run proves it.

**Plan:**

1. Reproduce `e2e/reference.spec.ts:278` at four workers on today's code, record the count, and diagnose which side is wrong. This leaves standing a reproduction and a cause.
2. Fix the side the diagnosis names: the game under `src/ui/`, or the spec through `liftedPart` in `e2e/chronicle-screen.ts` (or `e2e/reference.spec.ts` where the cause is the test's alone). This leaves standing a test that passes 12 of 12 under the same load.
3. Change `.github/workflows/ci.yml` to eight shards and `DOGMAS.md` _Testing_ to eight runners. This leaves standing a CI that splits the suite in eight.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- The proof: `npx playwright test e2e/reference.spec.ts:278 -x --repeat-each=12`, once on the code before the fix (it fails, the count recorded) and once after (12 of 12).
- CI proves on the push: the whole suite on eight shards, each well inside the 40-minute limit. If the fix lands in `liftedPart`, every spec reading a lifted part rides on it: `e2e/reference.spec.ts`, and whatever else calls `liftedPart` and `liftedName` (the implementer lists them for the hand-back).
