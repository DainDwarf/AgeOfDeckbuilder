# The driver and the idle persona

**Line:** The driver and the idle persona — `npm run sim` loads through Vite's module runner as the forge does, takes a cell whose age and region flags learn what reaches them, walks each chronicle gambit by gambit, plays the idle persona, stops a chronicle at the turn cap, at 100 commands landed in one turn, on a `runtime-error` or on a decision no command lands, prints a persona's sentences, traces one seed and writes a skeleton row; the launch from a campaign, the opening choices, the module-runner boot and the runtime-error walk each stand in one place the screen, the specs and the simulator share; its test runs on the fixture catalogue. Doc-impact: `docs/SIMULATOR.md`.

**Spec:** `docs/SIMULATOR.md`, and the root files the tool touches.

_The persona and the gambit_, first paragraph. Replace its last two sentences, "A command refused or changing nothing is dropped and the walk goes on. A turn caps the commands it takes, and a chronicle runs to its ending or to a turn cap, since the schedule has no last turn.", with:

> A command refused or changing nothing is dropped and the walk goes on down the list. A chronicle runs to its ending, or is **stopped**, the stop noted as an error with its cause: on the turn cap's turn, a flag defaulting to 60, since the schedule has no last turn; at 100 commands landed in one turn; on a `runtime-error` among a command's stages; and on a decision where no gambit's command lands, the end of turn's included. Why: a cap is a net for a loop in the content, a persona or the driver, never a budget, and a stop is a thing to investigate.

Same section, after the paragraph ending "is the user's reading.", a new paragraph:

> The **idle** persona is the floor: it settles on the map's centre tile, plays nothing else, takes the first answer or reward of a deal that is not refused, and ends the turn.

_The cell, the row, the fold_, first paragraph. Replace "The campaign is built through the rules as the forge builds one: a technology learned with its needs, copies bought and the deck edited." with:

> The campaign is built through the rules as the forge builds one: the technologies that reach the age and unlock the region learned first, each with its needs, then the ones the cell names, then copies bought and the deck edited.

Same paragraph, replace "Seeds pair across cells: seed _n_ is the same map and timeline" with:

> The seeds run from 1 to the count, and pair across cells: seed _n_ is the same map and timeline

Second paragraph, replace "the cell and the seed, the ending and its turn," with:

> the cell and the seed, the ending or the stop with its cause and the turn it came on,

`CLAUDE.md`, _Commands_, a row after the forge's:

> | `npm run sim -- [<technology>...]` | Plays a cell headlessly with a persona and writes one CSV row per chronicle: `--age`, `--region`, `--civilization`, `--persona` and `--seeds` name the cell, each defaulting to what the launch screen opens on, the idle and 20; the age and the region learn what reaches them, the technologies named learn more; `--turns <n>` sets the turn cap, `--out <path>` the file; `--trace <seed>` replays one seed naming the gambit behind each command; `--personas` prints each persona as its sentences. |

`DOGMAS.md`, the layout's `tools/` line, its alignment kept:

```
tools/              the standing scripts: the itch push, the save forge, the simulator
```

The idle persona's gambits, in order, each printed as this sentence by `--personas` and named by it in the trace:

1. `While a deal stands, take its first answer or reward that is not refused`
2. `On the settle phase, settle on the map's centre tile`
3. `End the turn`

The row's header, verbatim: `age,region,civilization,learned,persona,seed,ending,cause,turn,ms`. `learned` is every technology the campaign learned, in the order learned, space-separated. `ending` is `victory`, `defeat` or `stopped`; `cause` is the defeat's cause as the rules name it (`capture`, `population`, `removal`, `capstone`), the stop's (`turn-cap`, `command-cap`, `runtime-error`, `stuck`), and empty on a victory. `turn` is the chronicle's turn when it ended or was stopped. `ms` is the whole milliseconds the chronicle took, from its launch to its ending or stop.

The trace: one line per landed command, the turn, the gambit's sentence and the command in the rules' words, in that order; then one line for the ending or the stop with its cause and turn, a runtime error's naming the group it happened during. No player-facing sentence: the tool is read in a terminal.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

- In: the entry `npm run sim`, booted through Vite's module runner as the forge is; the cell flags with their defaults; the campaign built from a fresh one through `tools/learned-with-needs.ts`, the list handed it being the victory technology of every age before the cell's age in age order, the technology that unlocks the region where one does, then the positionals; the driver, which walks a persona's gambits as the page says; the idle persona; the four stops; one CSV row per chronicle, header first, flushed as each lands, to the terminal or to `--out`; `--trace <seed>`, which walks that one seed of the cell, prints the trace to the terminal and writes no row; `--personas`, which prints every persona as its numbered sentences; the four moves the reconcile chose.
- The walk: on every decision the gambits are read top down; the first whose condition holds has its command sent through `apply`; a command that leaves the chronicle as it stood is dropped and the reading goes on to the next gambit; a command that changed it counts as landed, the chronicle it left is kept, and the reading starts again from the top. A landed end of turn resets the turn's count. The take gambit's "not refused" is read through the rules' refusal of an answer, and a reward is never refused.
- The stops, each noted in the row's `cause`: `turn-cap` when the chronicle stands on the cap's turn before any command on it, so turns 1 to the cap less one are played and the row's turn reads the cap; `command-cap` when the hundredth command of one turn has landed; `runtime-error` when a landed command's stages hold one, the chronicle it left kept; `stuck` on a decision where every gambit's command was dropped, the last gambit's included. A chronicle that ended, in victory or defeat, is never stopped: its ending is the row's.
- Defaults are the launch screen's, read on the fresh campaign before anything is learned: the age the last reached, so the first age; the region the first of the chosen age the campaign has reached once the age's unlocks are learned; the civilization the campaign's first. An age or a region the catalogue does not hold is refused through the rules' own lookups; an age the campaign cannot reach by any technology, or a region no technology unlocks that the age does not list, is refused by those too. A persona name no list holds is refused, the refusal naming the personas. `--out` beside `--trace` is refused: the trace writes no row. A flag no table holds is refused as the forge refuses one.
- Seeds run from 1 to `--seeds`, in order. `--turns` is a positive integer; `--seeds` too.
- The body takes the catalogue as an argument, the entry hands it the game's; the test hands it the fixture's.
- Out: every other column, which is the Row line's; the fold; the goal gambit; deck edits; the builder and the warlord; any profiling or split across processes; a persona file; a save written.
- Reconcile, the two become one, in this line, each with its callers repointed and its test moved with it: the launch from a campaign on choices (the chronicle scene's `begin` and the specs' `launchedIn`) into one door in `src/rules/`; the opening choices (`openingChoices` in `src/ui/launch-layout.ts`, with its tests in `src/ui/launch-layout.test.ts` and the `Choices` type it returns, declared in `src/ui/save-entry.ts`) into `src/rules/`, the launch layout and the scene reading them there; the module-runner boot (`tools/forge-save.ts`) into one boot both entries use; the runtime-error walk (`logRuntimeErrors` in `src/ui/chronicle-scene.ts`, the group each happened during named) into `src/rules/` beside the other readings of a stage tree, the scene logging what it answers, the simulator stopping on it and the trace naming the group.
- Reconcile, through the standing door as it is: `tools/learned-with-needs.ts`. The inverse reading, which technologies reach an age or unlock a region, is new and the implementer's.
- Reconcile, stay apart: the specs' and the fixtures' headless settle and first-admitted take, which build fixtures and throw where the driver drops.

**Traps:**

- `tools/forge-save.ts` imports `vite` and `node:*` alone and everything that touches `src/` through the runner, because plain Node resolves no extensionless import; the shared boot keeps that split, and the simulator's body imports `src/content/catalogue` as the forge's body does.
- `src/rules/` never imports `src/content/` or `src/ui/`; the moved door, the moved choices and the moved walk take the catalogue as an argument. `src/ui/launch-layout.ts` imports `Choices` from `./save-entry` as a type; once the type lives in the rules, `save-entry.ts` re-exports nothing — every importer reads it from the rules.
- A chronicle waiting on a deal refuses every command but the take, and a chronicle that has ended refuses every command; the end-of-turn gambit's command is dropped on a deal, which is why the take gambit stands first.
- On the settle phase the hand is the city's card first and the settle cards after it; the idle plays the hand's first card at the centre, `CENTRE` in `src/rules/map.ts`, aimed at a tile with no `through`, and the end of the settle phase banishes the rest. The hearth and the village stand on plain, forest and hills, and the heartland biome deals the centre nothing else, so the settle lands on every seed of both ages; a region where it did not would stop the chronicle as `stuck`, which is the finding.
- `apply` answers stages built off the chronicle the command started on; the chronicle a command left is the last stage's, `outcome` in `src/rules/chronicle.ts`. A refused command is one `refused` group holding nothing, whose chronicle is the one handed in, so "changed nothing" is read as identity on the chronicle, the way the specs' `playedAs` reads it.
- A `runtime-error` is a change among the stages, possibly deep in a group; `walked` in `src/rules/stages.ts` yields every stage in order. The schedule test at `src/rules/schedule.test.ts:429` shows a fixture that raises one through a take: a raid with no free tile to enter on.
- `src/rules/fixtures.ts` exports the fixture catalogue, `AGE`, `REGION`, `CLEARING`, `CIVILIZATION`, and `endedTurn`, `settledLaunch`, `cityOf`, `withUnits`; a test imports it, nothing else does. The fixture content's victory and the technologies it earns are the fixture's own: the cell flags' unlocks are read off whatever catalogue is handed.
- The tests' config includes `tools/**/*.test.ts`; the forge's test runs the entry as a child process and takes up to a minute. A test of the driver on the fixture catalogue calls the body in-process.
- `performance.now()` is on Node's global; `Date.now()` is a millisecond clock too and is enough for a column of whole milliseconds.
- `--trace` replays by walking the seed again with the same persona; the walk is deterministic on the seed, so the trace is the row's chronicle. The seeded generator is the chronicle's own; the idle draws nothing.
- `DOGMAS.md` _Code_: comments are for traps only, and a hook flags a comment block longer than three lines touched under `src/`. A persona's sentences are data, the list the gambits are, not comments.
- `docs/PHASER.md` holds nothing this line needs: the scene's edits are an import repointed and a function moved out.

**Plan:**

1. `src/rules/` — the launch from a campaign on an age, a region and a civilization's name; the opening choices and the `Choices` type, with the tests moved from `src/ui/launch-layout.test.ts`; the runtime errors among stages with the group each happened during. The chronicle scene, the launch layout, the launch screen, `save-entry.ts` and `e2e/chronicle-screen.ts` repointed; `npm run check` and `npm test` green, nothing else changed.
2. `tools/` — the boot both entries use; `tools/forge-save.ts` reduced to naming its body through it; the forge's test green.
3. `tools/` — the simulator's body: the cell from the flags, the campaign through `learned-with-needs.ts`, the driver, the idle persona as its three gambits with their sentences, the four stops, the row writer, the trace, the personas print; its entry; `"sim"` in `package.json`'s scripts.
4. `tools/` — the test on the fixture catalogue: the idle walks a seed to its ending or stop and the row reads the cell, the seed, the ending, the cause, the turn; a chronicle standing on the cap's turn is stopped as `turn-cap`; a test persona that reassigns one population between two held tiles for ever is stopped as `command-cap` on the hundredth; a persona whose only gambit ends the turn is stopped as `stuck` on the settle phase; a landed command whose stages hold a `runtime-error` stops the chronicle as `runtime-error`. One test through the entry on the game's content with a seed count of 1, asserting the header, the row count and the trace's line shape, no number.
5. `docs/SIMULATOR.md`, `CLAUDE.md`, `DOGMAS.md` — the sentences above.
6. `workflow/BOARD.md` — the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Spec: `e2e/launch.spec.ts`, the one that walks the moved launch most directly. CI proves on the push every spec that launches a chronicle or reads the opening choices, among them `boot`, `settle`, `continue`, `resume`, `manage-save`, `menu`, `pin`, `press`, `reference`, `archipelago`, `irrigation`, `launch-warning`, `city-mode`, `controls`, `console`, listed for the hand-back and never run.
