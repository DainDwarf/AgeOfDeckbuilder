# The window spec's claim wait times out on CI

**Line:** The window spec's claim wait times out on CI — the Playwright config retains a trace and a screenshot on every failed test, which CI's artifact step uploads, and the settle helpers rest after an aim rises before they press the tile. Doc-impact: none.

**Spec:** `DOGMAS.md` → _Testing_, "A spec rests before it reads a position", and "The Playwright suite is CI's". No `docs/` page changes; no player-facing sentence.

**Doc-impact:** none — the Playwright config and the spec helpers are code, and the rest rule already stands in the dogmas.

**Scope:**

- In: `playwright.config.ts` retains a trace and takes a screenshot on a failed test (`trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'` in `use`). The CI workflow already uploads `test-results/` when a shard fails, so nothing in `.github/workflows/ci.yml` changes.
- In: `settle` and `claimFree` in `e2e/chronicle-screen.ts` rest (`rested`) after `aimed` resolves and before the press on the tile — the one press in the open path that lands on an object no frame has drawn yet.
- Out: the cause of the hang. Intake could not reproduce it: locally at 640 by 360 the spec is green eight times of eight in about 6 s, and under 6x and 10x CPU throttling the open completes in 24 s and 30 s. The line ships an honest done-condition; a recurrence hands over its trace and becomes a new line with its cause attached, through `/todo`.
- Out: the window spec's timeout. Its default of 30 s already exceeds the 20 s `budget(0)` would give it, and a hang is not fixed by time.
- Out: any change to how an aim is raised or hit-tested in `src/ui/`. Reading found no defect there, and this line has no design latitude in the game.

**Traps:**

- The suspicion the line was filed with is false: the settle moves no camera. The frame already holds the centre tile and its ring, so the pan that brings a stage into the frame answers nothing, and the aim's tile press hands its command to the play-out synchronously. The rest is the dogma's rule of thumb, not a proven fix; the report says so and claims no more.
- Both CI attempts on `a883fdf` failed at the same wait, the held count after a free claim, with the runner at normal speed for the specs around it; the artifact held only Playwright's source excerpt, which is why the trace is the deliverable.
- `aimed` resolves the instant the catcher object exists, from Playwright's first evaluation, before any frame draws it; `rested` waits two animation frames and is the helper every other rest in the file uses.
- A local run under four workers from a cold dev server times out at 30 s, evenly and late: that is contention, not the CI hang, and no budget is re-cut for it.
- `test-results/` is git-ignored; a trace lands as `test-results/<test>/trace.zip`, and the CI upload step ignores a missing folder. Trace retention writes during every test and discards on a pass: a few percent on green runs, nothing on the artifact.
- The hook refuses a suite run; one spec at a time.

**Plan:**

1. `playwright.config.ts`: the two `use` entries. Leaves CI keeping a trace and a screenshot for a failed test.
2. `e2e/chronicle-screen.ts`: the rest after `aimed` in `settle` and in `claimFree`. Leaves the open path resting before its one press on a freshly created catcher.
3. `workflow/BOARD.md`: the line deleted; `workflow/board/window-spec-claim-wait-times-out-on-ci.md` deleted.

**Verify:**

- `npm run check`, `npm run lint`.
- The one spec that proves the line: `npx playwright test e2e/window.spec.ts` — the spec named by the line, green, at the 640 by 360 window.
- CI proves on the push: every spec, since every one opens a chronicle through the changed helpers; the window spec on shard 4 is the one to watch, and a red run now carries `test-results-<shard>` with a trace to read.
