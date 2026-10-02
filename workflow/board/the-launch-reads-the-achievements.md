# The launch reads the achievements

**Line:** **The launch reads the achievements** — every achievement is read on the chronicle as it is launched, one met there recorded at the launch, and a command that moves several tallies raises one `tallied` per achievement whose tally moved; two rules tests on the fixture hold it — a goal met on the launched chronicle recorded at the launch, a command moving two tallies raising two `tallied` — and `docs/META.md` says so. Doc-impact: `docs/META.md`.

**Spec:** `docs/META.md`, _The campaign_, the paragraph that opens "An **achievement** is declared by an age's content". Its sentences stand as they are. This one is added after "A tally is its achievement's alone and is shown nowhere.", before "An achievement may pay **influence**…":

> Every achievement is also read on the chronicle as it is launched, and one met there is recorded at the launch.

The line foresees no player-facing sentence: no text entry, no card, nothing on a screen.

**Doc-impact:** `docs/META.md`.

**Scope:**

- In: the launch reading every achievement of the chronicle on the chronicle it begins, a tally-keeping one with its empty tally, and the chronicle opening with each one met recorded; one `tallied` change per achievement whose tally a command moved, in the order of the achievements row, every one of them before the `reached` they bring; the two tests; the `docs/META.md` sentence.
- Out: any screen; the order of the stages beyond what is said here; a test that a reached achievement's tally moves no more; any real achievement.
- A launch is no command and resolves as no stages: the chronicle opens with the record made, and no `reached` is raised for it.
- With every achievement read before each command — at the launch, then after every change or at the end of every command — a refused command can bring no count to its need, so a refusal stays its one group holding nothing. No special case is added for it.
- A `tallied` carries nothing the chronicles before and after it cannot say: which achievement's tally moved is read off them, as for `reached`. Each `tallied` moves one achievement's tally and nothing else.
- Reconcile, the read after every change: the launch goes through the same read of the achievements, called once on the begun chronicle; no second read is written.

**Traps:**

- `beginChronicle` (`src/rules/chronicle.ts`) is what `launched` calls, and `src/rules/fixtures.ts` calls it directly too: a read placed there reaches every fixture chronicle, one placed in `launched` only the launched ones. The design says "as it is launched"; where the read lives is the implementer's, and a fixture chronicle whose achievements move under it is a finding for the report.
- The read after every change and the read at a command's end both live inside `conditionsRead`, which carries the record onto every stage after it; the launch has no stages, so its record is the chronicle it answers.
- An achievement whose count reads the ending (a victory) is not met on the launched chronicle, since no ending stands there.
- Comments are for traps only.

**Plan:**

1. `src/rules/chronicle.ts`: the launch reads the achievements on the chronicle it begins and answers it with the met ones recorded; a command's end raises one `tallied` per achievement whose tally moved, every `reached` after them.
2. `src/rules/chronicle.test.ts`, with `src/rules/fixtures.ts` where it needs a helper: two tests, each on a catalogue the test hands in where the fixture's own does not serve — a goal met on the launched chronicle is recorded at the launch; a command moving two achievements' tallies raises one `tallied` for each, then the `reached` of each that is met. The `SURVEY` deed test's expectations move where they counted the stages.
3. `docs/META.md`: the sentence of the Spec.
4. `workflow/BOARD.md` loses the line, and this file goes with it.

**Verify:** `npm run fmt`, `npm run check`, `npm test`, `npm run lint`. The proof spec: none, since no age's content reaches the mechanism. CI proves the whole suite on the push; the specs that walk the changed path are `e2e/launch.spec.ts`, `e2e/ending.spec.ts`, `e2e/victory.spec.ts` and `e2e/capstone.spec.ts`, listed at the hand-back and never run.
