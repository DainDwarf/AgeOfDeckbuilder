# A goal reads what was done

**Line:** **A goal reads what was done** — an achievement may keep a tally, named numbers the chronicle and the save carry, moved after every command from the chronicle as it stood before and what the command did, and read by its count; three rules tests on the fixture hold it — a goal reached by a deed counted over several commands, a tally kept through the save, a command the chronicle ends on moving none — and `docs/META.md` says so. Doc-impact: `docs/META.md`.

**Spec:** `docs/META.md`, _The campaign_, the paragraph that opens "An **achievement** is declared by an age's content". Its sentences stand as they are. These are added after "…the one record that follows it.", before "An achievement may pay **influence**…":

> An achievement may keep a **tally**: named numbers of its own that the chronicle carries, and so the save, none at the launch. After every command the achievement's content moves its tally by what the command did — the chronicle as it stood before the command and every change that followed — and its count reads the tally beside the chronicle, so a goal asks what was done as well as what stands. Such an achievement is recorded at the end of the command that brings its count to the need. A command the chronicle ends on moves no tally, so the victory stays the one record that follows an ending. A tally is its achievement's alone and is shown nowhere.

The line foresees no player-facing sentence: no text entry, no card, nothing on a screen.

**Doc-impact:** `docs/META.md`. No glossary row: a tally is never shown, and the word is the design page's and the code's alone.

**Scope:**

- In: an achievement's declaration taking how a command moves its tally, and its count reading the tally beside the chronicle; the chronicle's achievements row carrying each achievement's tally, empty at the launch; the tally moved at the end of every command, as a change of its own in the flow, and the `reached` it brings after that change; the save writing and reading the tally; what content needs to read one play out of a command's flow, which card and what it was aimed at; one fixture goal that counts a deed, and the three tests; the catalogue's coherence test asking a tally's movement its cheapest answer; the `docs/META.md` sentences.
- Out: every real achievement — the Stone Age's stay none, and the Nomadic victory declares no tally; any screen, the pinned achievement's ledger among them; an achievement naming what fails it; a card aimed at the hand; a Playwright spec.
- A tally holds named numbers and nothing else, and its names are open: its content writes whatever name it likes, so one tally serves a sum, a count of turns, or one name per kind met. Sized by the user against the three deeds the Stone Age's first technologies count: food gained through one card played on tiles carrying one feature, turns ended on an empty hand, the kinds of terrain one card was played on.
- An achievement that declares no tally is read as today, after every change, and nothing of it moves. One count serves both: it is handed the tally, empty where none is kept.
- The tally moves once a command, at its end, for every achievement of the chronicle not yet reached that keeps one; a reached achievement's tally moves no more. A tally left as it stood raises no change, so a refused command still resolves as its one group holding nothing.
- The check mark follows the deed's command whole: the tally's change, then the `reached`, are the last stages of that command's flow, never midway through it.
- A command the chronicle ends on, in victory or in defeat, moves no tally: a deed whose last count falls on that command is not recorded.
- Reconcile, a card's counters: kept apart, a difference that is meant. A counter's names are closed and declared, it is set once when its card is made and its face reads it; a tally's names are open, it moves, and nothing shows it. The tally shares no type and no check with the counters.
- Reconcile, the goal read on the chronicle as it stands: the two become one read, the count handed the tally.

**Traps:**

- `conditionsRead` (`src/rules/chronicle.ts`) rebuilds each stage's chronicle to carry the achievements row forward, because every stage of a command was built off the chronicle the command started on. The tally lives in that row. The same function is where a command the chronicle ends on is known: the capstone's cut and the fall both stop the walk there.
- A `played` group names neither its card nor what it was aimed at; the hand's animation finds the card through the `places` a `discarded` or a `left` change carries into the hand as it stood before. `attack` and `strike` are the groups that carry what their link needs. Content reading a deed must not re-derive a play at every goal.
- The change names are a closed set (`src/rules/stages.ts`), switched without a default in `chartedOn` (`src/rules/chronicle.ts`) and in `src/ui/hand.ts`. The new member plays nothing on the screen; that case is the line's whole reach into `src/ui/`, and no Phaser fact is involved.
- `record` already names two things on this path: the achievements row inside `conditionsRead`, and the object reader in `src/rules/save.ts`; `docs/META.md` says "recorded" of an achievement reached. Hence the tally.
- The save reads a chronicle field by field and refuses one it cannot read whole. A chronicle saved before this line holds no tally and is dropped at the boot, the campaign standing: that is `docs/META.md`'s _The save_ as written, so no default stands in for a missing tally, and the hand-back says that a chronicle in progress is dropped by this ship.
- The fixture's first age owns three achievements and its victory (`src/rules/fixtures.ts`), each earning a technology of the fixture's tree, and the catalogue refuses a technology no achievement earns and an achievement without one. A goal added there joins every fixture launch's row and the fixture's tree, and the tests that list them move (`src/rules/chronicle.test.ts`, `src/rules/campaign.test.ts`, `src/ui/tree-layout.test.ts`); a test may hand in a catalogue of its own instead.
- The fixture's deed is a card played through a worker, counted by the terrain it was played on: it reads a play out of the flow and writes open names, the two things no goal has done.
- Comments are for traps only.

**Plan:**

1. `src/rules/catalogue.ts`, `src/rules/state.ts`: an achievement declares its tally's movement, its count reads the tally, and the chronicle's achievements row carries one tally per achievement, empty at the launch. Every count standing — the Nomadic victory's, the fixture's — reads as before.
2. `src/rules/stages.ts`, `src/rules/chronicle.ts`, `src/ui/hand.ts`: the tally moves at the end of a command as a change of its own, the `reached` after it, none on a command the chronicle ends on; every switch over the change names takes the new one.
3. `src/rules/save.ts`: the tally is written and read with its achievement.
4. `src/rules/fixtures.ts`, `src/rules/chronicle.test.ts`, `src/rules/save.test.ts`: the fixture's deed goal and the three tests, one rule each — a goal counting a deed is reached at the end of the command that completes it, whatever was played between; the tally is kept through the save; a command the chronicle ends on moves none.
5. `src/content/catalogue.test.ts`, and `src/rules/catalogue.test.ts` where it walks the closures: an achievement's tally movement is asked its cheapest answer on a chronicle launched on each age.
6. `docs/META.md`: the sentences of the Spec.
7. `workflow/BOARD.md` loses the line, and this file goes with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: none, since no age's content reaches the mechanism. CI proves the whole suite on the push; the specs that walk the changed path are `e2e/resume.spec.ts`, `e2e/continue.spec.ts`, `e2e/refused-save.spec.ts` and `e2e/manage-save.spec.ts` for the save's shape, and `e2e/ending.spec.ts`, `e2e/launch.spec.ts`, `e2e/victory.spec.ts` and `e2e/capstone.spec.ts` for the achievements reached, listed at the hand-back and never run.
