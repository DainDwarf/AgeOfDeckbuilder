# A resumed chronicle's openings, proven

**Line:** A resumed chronicle's openings, proven — a spec for a resumed chronicle that has ended, which opens on its ending screen, and one for a resumed chronicle waiting on a deal, whose deal's window rises once the capstone's window closes: a save and a reload must never dodge an event. Done when `e2e/resume.spec.ts` holds two more tests, each opening the bare address on a save it planted, and passes: an ended chronicle's save opens on its ending screen with no capstone's window, and a save waiting on a deal opens on the capstone's window with no deal's window, the deal's window rising once the capstone's closes.

**Spec:** `docs/CHRONICLE-SCREEN.md`, the capstone paragraph — the window rises "when the chronicle screen opens, on a chronicle begun and on one resumed alike, an ended one excepted, whose screen opens on its ending screen instead", and "the opening's window closes onto the screen as the chronicle stands, a deal's window rising where a deal waits" — and the ending-screen paragraph. `docs/META.md` _The save_: a reload of a chronicle in progress resumes it where it stood. No sentence changes; no player-facing sentence.

**Doc-impact:** none — the behaviour shipped with its design sentences in "The game boots on the save"; this line adds its proof.

**Scope:**

- In: the planting. Each test builds its chronicle headlessly through the rules, as the seed searches of `e2e/chronicle-screen.ts` do (`launch`, `endedTurn`, `apply`/`outcome`), writes it through `writeSave` of `src/rules/save.ts` on the stand-in with `STAND_IN_REGION` and deck `PH_Deck`, plants the text under `SAVE_ENTRY` of `src/ui/save-entry.ts` before the page loads, and opens the bare address `/`. No turn is played on the screen.
- In: the ended test. The chronicle is seed 1 on `PH_ShortSchedule` with three whole turns ended past the settle: a victory on turn 4 (measured at intake). The spec asserts the chronicle it read before planting has that ending, so a retune of the stand-in fails loudly here rather than planting a running chronicle. Once the ui scene runs and has rested: the victory screen stands at full alpha, as `e2e/victory.spec.ts` reads it; the capstone's window does not stand; the chronicle read through the screen equals the one planted; the run's problems are empty.
- In: the deal test. The chronicle is `dealRun()`'s seed run up to the end of turn that deals its first deal and stopped there, the deal waiting and untaken (seed 1, due turn 5, at intake). Once the ui scene runs and has rested: the capstone's window stands and the deal's does not; the capstone's card is clicked; the capstone's window goes and the deal's window stands, its title the dealt event's name (`eventName`), as `e2e/deal.spec.ts` reads it; the chronicle read through the screen equals the one planted; the run's problems are empty.
- Out: taking the deal, playing on, a defeat's ending screen (the screen draws both outcomes through one path), a reload mid-play-out, the save's write path (the first test of the spec proves it), and any other spec moved onto planted saves — that is the rung "Specs open on a fabricated save".
- Corner decided: both tests run on Playwright's default timeout, as the spec's unreadable-save test does; they play no turn, so `budget` does not apply.

**Traps:**

- `page.addInitScript` runs before every page the test loads from then on; each test loads one page, so a planting script there plants once. `readNames` is itself an init script and must be added before the `goto`, as `openOnCapstone` and the unreadable-save test do.
- `src/main.ts` boots on the save only when the address names none of content, region, schedule, deck, seed; the suite's door (`open`, `openOnCapstone`) names a deck and would ignore the plant. Open `/` bare, then wait for the ui scene as the first test of `e2e/resume.spec.ts` does.
- The capstone's window is closed by a click on its card, never the back key, which specs rebind (`e2e/chronicle-screen.ts` `open`). A spec rests before it presses what just rose (`DOGMAS.md` _Testing_, `docs/PHASER.md` _Under a Playwright spec_).
- In `src/ui/overlay.ts` the ended chronicle's first render stands the ending screen through `showEnding`, at full alpha and with no rise, under a container named for the outcome; the deal's window rises only through the capstone's close (`closeCapstone` → `standAs`). Closing the window issues no command, so nothing rewrites the save during either test.
- `writeSave` reads its own text back and throws on anything the reading would refuse; a throw at planting is a fixture defect, never a reason to hand-write save text (`DOGMAS.md` _Testing_, a fixture goes through the transform production uses).
- `victoryShown` lives in `e2e/victory.spec.ts` alone today; a second user moves it to `e2e/chronicle-screen.ts` or the spec reads the named container itself — the implementer's call.

**Plan:**

1. `e2e/` helpers as the implementer sees fit: a way to plant a chronicle's save before the page loads, and the chronicle waiting on the deal `dealRun` finds. Leaves standing: `npm run check` green, no spec changed in behaviour.
2. `e2e/resume.spec.ts`: the two tests. Leaves standing: the proof passing.
3. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/resume.spec.ts` as the proof. CI's on the push, never run locally for the hand-back: `e2e/victory.spec.ts` and `e2e/deal.spec.ts` if a helper moves out of them or `e2e/chronicle-screen.ts` changes, and the whole suite behind them.
