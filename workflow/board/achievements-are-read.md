# Achievements are read

**Line:** **Achievements are read** — an age declares its achievements, each a count toward a need, the technology it earns and the influence it pays, and its technologies, each with what it needs and what it unlocks, the catalogue refusing an incoherent tree; a chronicle carries the achievements it can reach, reads them after every change in the walk that reads the victory, records each the moment its count meets its need and saves them; the Nomadic Age declares The first shelter, its victory. Nothing on screen changes; `npm test` proves each rule on the fixture.

**Spec:** [`docs/META.md`](../../docs/META.md) → _The campaign_ is the spec, with these edits made in the ship:

- The first paragraph's second sentence, "Each technology is earned by one achievement and needs the technologies before it: 🔧 an achievement reached while any technology its own needs is not yet unlocked earns nothing, and stays reachable in a later chronicle." becomes: "Each technology is earned by one achievement and needs the technologies before it, and no technology needs itself through the others. A chronicle is launched with the achievements it can reach — those of its age whose technology is not yet unlocked and needs none that is not, and that the launch's choices admit — and reads those and no other, so every achievement it reaches earns; one whose technology needs more waits for a later chronicle." The rest of the paragraph stands.
- The achievement paragraph becomes: "An **achievement** is declared by an age's content: a condition read on the chronicle — its stocks, its map, its ending — after every change, as the capstone's is, as a count toward a need — one toward 1 where it is simply met or not — and recorded in the chronicle the moment the count reaches the need; one the ending reaches, an age's victory, is recorded after the ending, the one record that follows it. An achievement may pay **influence** of its own, taken with its technology, so it is paid once. 🔧 An achievement may name what fails it, after which it is not reached in this chronicle."
- The ending paragraph stands: the ending's own scaled pay is content the Stone Age brings, and nothing is built for it here.

[`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) → _The capstone_, the paragraph "A capstone names what passes it": "nothing resolves after it" becomes "nothing of play resolves after it".

[`DOGMAS.md`](../../DOGMAS.md) → _Architecture_, the rows sentence: "the deals, the ending;" becomes "the deals, the achievements, the ending;". A dogma edit: the hand-back names it.

[`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) gets a section after _The capstone_:

> ## The achievement ✅
>
> The age's one achievement is **The first shelter**, its victory, and it pays influence.

No player-facing text: the names of achievements and technologies land with the campaign screen, which shows the tree. No glossary row: the state of an achievement a chronicle can reach is named at the campaign screen's intake; until then the pages say "the achievements it can reach".

**Doc-impact:** `docs/META.md`, `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`, `DOGMAS.md`.

**Scope:**

In:

- What an age declares. An achievement: a count closure over the catalogue and the chronicle answering an integer, a need, the technology it earns by id, the influence it pays. A technology: the technologies it needs by id, and what it unlocks — cards, each with the copies that enter the collection, and at most one age. Technologies are a table every age brings to the shared tables, since a need crosses ages and `merged` already refuses an id two ages bring; achievements are owned by the age, read on its chronicles alone, and `catalogued` refuses an achievement id two ages own, since its text key will be one namespace.
- The coherence, refused in `catalogued` with the one rejection vocabulary: a need of one or more; influence of nought or more; an achievement's technology held; every technology earned by exactly one achievement; every need held, and no technology needing itself through the others (the tree is a DAG); every unlocked card held with copies of one or more; every unlocked age held; every age but the first of the ages table unlocked by exactly one technology, the first by none. A technology may unlock nothing: the Nomadic victory's does until the Stone Age lands, by the user's lean.
- The chronicle carries its **achievements**: the ones it can reach, named at the launch, each with whether it is reached. The launch takes the technologies unlocked and opens the age's achievements whose technology is not among them and needs none outside them; until the campaign module lands every caller passes none unlocked, which opens the Nomadic victory. A launch fact an achievement needs — a region, a civilization once one exists — is a declaration on the achievement the launch's filter reads, never a reading of the count closure, and the chronicle never carries its region; no achievement of this line's content names one, so no field for it exists yet and the filter reads the technologies alone; the ship that adds the first achievement needing a launch fact adds the field with it. The filter opens every achievement that qualifies, however many, never one alone.
- The read: after every change, in the walk that reads the victory, each achievement of the chronicle not yet reached has its count read on the change's chronicle, and one whose count meets its need is recorded reached as a change of its own, `reached`, a plain change over a new row, the achievements. The read runs on the `ended` change too, the victory's and the fall's, so the victory achievement's `reached` stands right after the victory's `ended`: the one change that follows an ending. A refused command raises no change and reads nothing. An achievement already reached is not read again.
- The save: the chronicle's achievements each resolved through the age's, the flag read as a flag; the chronicle save keeps its shape otherwise, the region and the deck id beside the chronicle. A save of the shape before this line lacks the achievements and is refused and dropped as any unreadable save is.
- The Nomadic Age declares the achievement `first-shelter`: count one when the chronicle's ending is a victory, nought otherwise; need 1; influence 3; earning the technology `stone-age`, which needs nothing and unlocks nothing yet.
- The fixture: every fixture age owns a victory achievement, its count one on a victory ending, earning a technology that unlocks the next age of the table, the last age's unlocking nothing — generated where the fixture builds its ages. The first age also owns two a test reaches headlessly: one whose count is the food stock against a fixture need, earning a technology needing none and unlocking a fixture card with two copies; and one whose count is the population against a fixture need, earning a technology needing the first. Numbers are the fixture's own.

Out:

- The campaign, the take, influence spent or held, the collection, the launch on the campaign's technologies: the campaign module line.
- The ending's own influence, scaled by how the city fared: content the Stone Age brings, with the closure it needs.
- What fails an achievement (🔧), the pin, the tree on screen, the names: their own lines.
- A migration of today's saves: pre-demo, dropped.

Corner cases decided here:

- Two achievements met by one change are both recorded, each its own `reached`, in the age's declaration order.
- An achievement whose count meets its need on the chronicle the launch leaves is recorded by the first command's walk, never at the launch: the launch raises no stage.
- A count closure that throws propagates, as a capstone's `passes` does: content wrong on every chronicle stops play.

**Traps:**

- Every switch over a change's name is a closed-set site the typecheck refuses when `reached` is missing: the charting in `src/rules/chronicle.ts`, and the listeners in `src/ui/hand.ts`, `src/ui/map.ts` and `src/ui/piles.ts`. `reached` plays nothing on screen; each site takes it and does nothing.
- `passedOn` in `src/rules/chronicle.ts` cuts the tree at the victory and appends the `ended`; the achievements read belongs in that same walk and must read the appended `ended`'s chronicle and the fall's `ended` raised by `landedAs`. The docblocks of `Sequence` in `src/rules/stages.ts` ("Once a stage of it ends the chronicle, nothing follows it") and of `passedOn` say the ending is last; they are re-shaved to say a `reached` may follow it.
- `followed` in `src/rules/stages.ts` stops after an ending; the `reached` after an `ended` is appended by the walk, never by a helper composing landings.
- The ending screen rises "as the last change plays out" (`docs/CHRONICLE-SCREEN.md`); whether the chronicle screen keys its rise on the `ended` change or on the last stage is read in `src/ui/` before the walk changes, so a `reached` after the `ended` neither delays nor skips it. `e2e/victory.spec.ts` proves it.
- The fixture builders in `src/rules/fixtures.ts` (`opening`, `cityOf`, `settledOn`, `settledLaunch`) build whole chronicles and every one gains the new field; `Carrying` overrides it per test. `src/content/catalogue.test.ts` launches through `settledLaunch` and `launched`, and `e2e/chronicle-screen.ts` through the rules' helpers: each passes the technologies unlocked.
- The fixture's ages table holds many ages, one per fixture event among them (`agesOver`); the "every age but the first is unlocked by exactly one technology" rule makes the fixture chain them all, in the table's order.
- `merged` refuses duplicates across slices for brought tables only; an owned table needs its own check in `catalogued`.
- `ChronicleSave` keeps its three fields; `src/ui/save-entry.ts`, `e2e/chronicle-screen.ts`'s `plant` and the specs that plant a save are untouched by shape, and only carry a chronicle that now holds its achievements.
- The ids `first-shelter` (achievement, beside the capstone of the same id in its own table) and `stone-age` (technology) are fixed here: the campaign screen's text keys will be built from them.
- The content coherence test (`src/content/catalogue.test.ts`) asks every closure its cheapest answer on a settled chronicle in each age: every achievement's count answers an integer there; whether it is reached is not asserted.
- The chronicle screen's animation switch and the design pages never see a number of the fixture; `docs/PHASER.md` is not touched by this line, which changes no scene.

**Plan:**

1. `src/rules/catalogue.ts`: the two declarations on `Age` and `Tables`, the lookups, and the coherence in `catalogued`; `src/rules/fixtures.ts` chains its ages and declares the first age's three achievements; `src/rules/catalogue.test.ts` proves each refusal. Inert: nothing reads them yet.
2. `src/rules/state.ts`, `src/rules/stages.ts`, `src/rules/chronicle.ts`: the chronicle's achievements, the launch opening them from the technologies unlocked, the `reached` change over the achievements row, the read in the walk after every change, the `ended` included; every switch site the typecheck names, in `src/rules/` and `src/ui/`, takes `reached`; the docblocks re-shaved. `src/rules/chronicle.test.ts` proves: the launch opens the right achievements for none unlocked and for the first technology unlocked; a command whose change meets the food need raises `reached` right after that change and a later command raises it no second time; a change meeting the population need while its achievement is closed raises nothing; the victory's `ended` is followed by the victory achievement's `reached`; the fall's `ended` is read and raises nothing.
3. `src/rules/save.ts`: the achievements read through the age's, the flag read as a flag; `src/rules/save.test.ts`: the round trip holds, an achievement the age declares not is refused.
4. `src/content/nomadic.ts` declares the achievement and the technology; `src/content/catalogue.test.ts` asks every achievement's count on a settled chronicle in each age; `docs/ages/NOMADIC.md`, `docs/META.md`, `docs/CHRONICLE.md`, `DOGMAS.md` take the sentences above; the board line is deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/victory.spec.ts` — the victory's `ended` is now followed by a `reached`, and the ending screen must still rise on the game's content. CI proves on the push: every spec, since every one opens on a save whose chronicle now holds its achievements; `e2e/resume.spec.ts` for the save's own reading and `e2e/fall.spec.ts` for the fall's `ended` read, in particular.
