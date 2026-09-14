# Units join the catalogue

**Line:** **Units join the catalogue** — the rules receive a catalogue holding the unit kinds, the enemy scripts and what a camp enters, threaded from the boot through the founding and every rule that reads them; the chronicle names its catalogue's version and `apply` refuses any other; a fixture catalogue serves the rules tests, and a coherence test checks the stand-in's kinds against the UI's names and marks. Doc-impact: `docs/DOGMAS.md`.

**Spec:** `docs/DOGMAS.md`, _Stack_. The first bullet under the table is replaced, verbatim, by: "**`src/rules/` never imports Phaser, never touches the DOM and never imports `src/content/`; `src/ui/` never mutates state.** The game is one pure function, `apply(catalogue, state, command) → stages`: the ordered steps the command resolves as, never none, each carrying the state it leaves, the last of them carrying the state the command ends on. The seeded generator's state lives inside `state`. The **catalogue** is the content — the unit kinds, the enemy scripts, what a camp enters, and what the later content brings — an argument every rule that reads content receives before the state, never a field of the state and never an import of `src/rules/`; a closure content carries that takes the chronicle takes the catalogue before it; a catalogue is validated once, when it is built, and a chronicle names its catalogue's version, so `apply` refuses a chronicle with any other. Why an argument: a test hands in content of its own, and a save names the content it replays on. That single rule is what makes a chronicle replay from its seed, a save the state serialised, and a headless simulator `apply` in a loop keeping the last stage's state. Why stages and not the state alone: what happened — which tile attacked which — is not in the state that follows it, and the chronicle screen has to play it. Phaser renders a state and emits commands, nothing else." The layout block gains one line after `src/rules/`: `src/content/        the catalogues: the stand-in today, an age's content later; what the boot hands the rules and the screen`. Nothing else on the page changes, and no other `docs/` page changes. No player-facing sentence: nothing on screen changes.

**Doc-impact:** `docs/DOGMAS.md`.

**Scope:**

In:

- `src/rules/catalogue.ts`, new: the `Catalogue` type — `version: string`, `units: Record<string, UnitStats>`, `scripts: Record<string, EnemyScript>`, `camp: { unit: string; script: string }` — and `catalogued(content)`, the one constructor, which validates and returns it: every unit entry's `type` is its key, the camp's unit and script resolve, and the camp's unit stands on every terrain `BUILDINGS.PH_Camp.terrains` names (the map's constant, until the map line moves it in). Two lookups, one for a unit kind and one for a script, that throw on an id the catalogue does not hold. Every refusal — the constructor's, the lookups', and the version check below — is one `Error` thrown through one function in this module, its message opening with the catalogue's version; that is the one rejection vocabulary the later lines copy.
- Ids open: `UnitTypeId` and `EnemyScriptId` become `string`, and `UNIT_STATS`, `ENEMY_SCRIPTS` and `CAMP_ENEMY` go. `UnitStats` stays as it is, `type` included.
- The chronicle carries `content: string`, the version of the catalogue it was founded on. `beginChronicle(catalogue, seed, deck)` stamps it; `apply(catalogue, chronicle, command)` throws when the two differ, before anything else.
- The pattern, which the map, the cards and the schedule lines copy: a rules function takes the catalogue as its first parameter when it, or something it calls, reads it — the typecheck drives each extension, and nothing else is threaded ahead of need. Every closure content carries that takes the chronicle takes the catalogue before it, whether it reads it or not, fixed now: `Aim.blocked`, `Aim.refuses`, `Aim.effect`, the hazard's `strikes`, `ScheduledEvent.reads` and `lands`, `EnemyScript.moveTo` and `attacks`. `ScheduledEvent.weight(turn)` takes no chronicle and no catalogue.
- `src/content/stand-in.ts`, new: `STAND_IN`, built through `catalogued`, holding PH_Worker and PH_Warrior with the numbers `UNIT_STATS` holds today, the PH_Advance script — its body and the helpers only it uses move here from `enemies.ts` — and the camp entering PH_Warrior on PH_Advance. The script is exported on its own as well, for the fixture to bind.
- `src/content/stand-in.test.ts`, new, a coherence check and nothing more: the stand-in builds, and every unit kind it holds has a name in the UI's text table and a mark in the UI's marks table, read through the same lookups the screen uses.
- `src/rules/fixtures.ts`: `CATALOGUE`, the fixture catalogue, built through `catalogued`, version `fixture`: PH_Worker and PH_Warrior with numbers of the fixture's own (today's stand-in numbers are the easy pick, and they are the fixture's from then on, read from no table of the content's), the stand-in's script bound under the fixture's own id `advance`, and the camp entering PH_Warrior on it. `cityOf` stamps `content: CATALOGUE.version`; `withUnits`, `standing`, `stagedBy`, `endedTurn` and the walkers hand `CATALOGUE` in; tests call `apply(CATALOGUE, …)` explicitly, the catalogue visible at every call.
- `src/rules/catalogue.test.ts`, new: a catalogue whose camp names a unit kind it lacks, a script it lacks, or a unit that cannot stand on a camp's terrain is refused; a coherent one builds; a chronicle of another version is refused by `apply`; a unit entering under an id the catalogue lacks is refused. The test in `map.test.ts` asserting the camp's enemy stands on the camp's terrains goes: the validator holds that rule now.
- UI: `ChronicleScene(catalogue, seed, deck)`; the infopanel reads a unit's full health from the catalogue's kind, so it takes the catalogue at creation; the unit name lookup in `text.ts` takes an open id and throws when no entry names it; the marks table moves out of `map.ts` into a Phaser-free module holding the raw corner lists, with a lookup that throws when no mark is there, and `map.ts` wraps the list it gets with `corners()`. The deal card's `reads` call in `card-face.ts` hands the catalogue over.
- `src/main.ts` imports `STAND_IN` and hands it to the scene; the e2e specs and `e2e/chronicle-screen.ts` hand it to `beginChronicle`, `apply`, `refusalOf` and `admitted`, and read a kind's numbers from `STAND_IN.units`.

Out:

- The map tables, the cards, the decks and the schedule's entries stay module constants; their lines follow. The unit kind the two unit cards name is checked at play by the lookup until the cards line moves the check to construction.
- Card names and rules text stay in `text.ts`; the cards line inherits the same choice as the unit names, UI-side and keyed by id.
- The Testing dogma on mechanism versus content returns with the schedule line, not here.
- No number and no behaviour changes: every existing test yields the same stages on the fixture catalogue as it did on the constants, and a difference in `npm test` is a defect of the change.

Corner cases decided: a kind with no name or no mark throws at its first draw, never falls back, and the coherence test is what catches it before a draw. A unit carries its own copy of its kind's stats as before; the catalogue is read at entry and at the infopanel's full-health reading, nowhere else. The version check is `apply`'s alone; `refusalOf`, `admitted` and the other read-side helpers trust the catalogue they are handed.

**Traps:**

- `tsconfig.json` sets `noUnusedParameters`: a closure that takes the catalogue and ignores it, the stand-in script among them, names the parameter with a leading underscore.
- `src/ui/map.ts` and `src/ui/design-space.ts` both import Phaser for real, so a Node test cannot import either: the marks table has to live in a module that imports neither, holding raw numbers, and `corners()` is applied in `map.ts`. `text.ts` imports nothing and is safe to import.
- Vitest's include is `src/**/*.test.ts`, so a test under `src/content/` runs; `src/rules/fixtures.ts` importing the stand-in's script from `src/content/` is the one import of content outside the boot and the specs, and it is a test-only module.
- The `enters` closure in `cards.ts` calls `entered`, which now reads the catalogue: that is the one closure of the `Aim` type that reads what it is handed today.
- `enteredOnCamp` hardcodes the script id; it reads `catalogue.camp` now. `reinforced`, `raid` and `siege` in `schedule.ts` enter warriors and take the catalogue.
- `SnapshotUnit.type` becomes a string with the id; the fog snapshot tests compare ids, not tables.
- The e2e specs read `UNIT_STATS.PH_Warrior.action`, `.damage` and `UNIT_STATS.PH_Worker.move` in `attack.spec.ts` and `move.spec.ts`; `npm run check` covers `e2e/` and drives the rest of the rethread.
- `text.ts` is hook-linted for glossary synonyms; the unit lookup adds no sentence.
- `docs/DOGMAS.md`'s Stack bullet is one line; `npm run lint` refuses a wrapped one.

**Plan:**

1. `src/rules/catalogue.ts`: the type, the constructor with its checks, the two lookups, the one refusal function.
2. `src/rules/units.ts` and `src/rules/enemies.ts`: the ids open, the tables gone, `EnemyScript`'s closures take the catalogue, `enteredOnCamp` and `enteredFromCamp` take it and read `catalogue.camp`; the script body and its private helpers leave for content, the walk helpers other rules use stay.
3. `src/rules/state.ts`: `content` on the chronicle, `entered(catalogue, chronicle, entering)` through the unit lookup.
4. `src/rules/cards.ts` and `src/rules/schedule.ts`: the closures take the catalogue; `enters`, `raid`, `siege`, `reinforced`, `taken` read it.
5. `src/rules/chronicle.ts`: `beginChronicle` stamps, `apply` checks and threads, `enemyPhase` resolves the script through the lookup, `play` hands the catalogue to the effect.
6. `src/content/stand-in.ts` and its test.
7. `src/rules/fixtures.ts`, `catalogue.test.ts`, and every rules test the typecheck names.
8. `src/ui/`: the scene, the infopanel, the marks module, the text lookup, the deal card; `src/main.ts`; the e2e helpers and specs.
9. `docs/DOGMAS.md`: the Stack bullet and the layout line, written out under _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then one at a time: `npx playwright test e2e/boot.spec.ts`, `npx playwright test e2e/attack.spec.ts`, `npx playwright test e2e/move.spec.ts`, `npx playwright test e2e/inspect.spec.ts`, `npx playwright test e2e/camps.spec.ts`.
