# The stocks over the turns

**Line:** The stocks over the turns — the row reads the city's stocks and population at fixed turns beside what it reads at the ending, so a query draws the curve. Done when `npm run sim -- --every <n>` writes, before each chronicle's ending row, one row per _n_th turn the chronicle opened, every column read at that opening under its meaning and the ending's own blank, the record naming `every`, and the file is as today without the flag; `docs/SIMULATOR.md`, `CLAUDE.md`'s command table and the sim skill say so.

**Spec:** `docs/SIMULATOR.md`, _The cell, the row, the query_, three edits:

1. The record's list: "the gambit left out where one is, what is switched off where anything is, the turn cap and the seeds as given" becomes "the gambit left out where one is, what is switched off where anything is, every how many turns a row is read where `--every` names it, the turn cap and the seeds as given".
2. After the row sentence ending "and the time the chronicle took." add: "With `--every` _n_, a chronicle writes one row more as each _n_th turn opens, from turn _n_, the chronicle as the persona's first decision of that turn reads it, under the same columns with the same meaning, what had happened by then, and the ending, its cause, what it paid and the time blank; the opening the ending or the stop reads writes no such row, the ending's row reading it. So a query draws the curve of any column over the turns, each turn's over the chronicles still standing on it."
3. The query sentence: "one file's distributions, a cut of its rows by a condition, and two files joined on the seed" becomes "one file's distributions, a cut of its rows by a condition, a curve over the turns, and two files joined on the seed, and on the turn too where both carry the rows over the turns".

`CLAUDE.md`, the `npm run sim` row: "`--turns <n>` sets the turn cap, `--out <path>` the file;" becomes "`--turns <n>` sets the turn cap, `--every <n>` writes one row more as each nth turn opens, `--out <path>` the file;".

`.claude/skills/sim/SKILL.md`:

- Step 1, after "`--turns <n>` moves the turn cap off 60.": "`--every <n>` writes one row more as each nth turn opens, the ending's columns blank, and goes beside no `--trace`."
- Step 3: "the stocks and population the city ended on" becomes "the stocks and population the city ended on and, with `--every`, the curve of any column over the turns".
- _Queries_, at the end of the opening paragraph: "A file written with `--every` holds a row per turn read beside each chronicle's ending row, the ending blank on it: a recipe over the endings takes `WHERE ending IS NOT NULL`, a curve `WHERE ending IS NULL`, and a join of two such files `USING (seed, turn)`."
- A recipe after _Every number's distribution at once_, headed "A column's curve over the turns, each turn over the chronicles still standing on it, then the curve cut by how the chronicle ended:", holding:

```sql
SELECT turn, count(*) AS standing, min(production), median(production), max(production) FROM read_csv('<file>', comment='#') WHERE ending IS NULL GROUP BY turn ORDER BY turn;
SELECT e.ending, turn, median(production) FROM read_csv('<file>', comment='#') r JOIN (SELECT seed, ending FROM read_csv('<file>', comment='#') WHERE ending IS NOT NULL) e USING (seed) WHERE r.ending IS NULL GROUP BY ALL ORDER BY 1, 2
```

Both recipes, the endings filter and the two-file join on seed and turn ran green on a mock file of the shape at intake, DuckDB 1.5.5.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:** In: the flag, a whole number of 1 or more read as `--turns` and `--without` are read, refused below 1, not whole, or beside `--trace` as `--out` is; the record key `every`, dropped where the flag is not given, after `off` and before `turns`; the rows over the turns, each the ending row's columns read on the chronicle as the turn opened and on the commands landed before it, the ending, the cause, the influence and the time blank; `docs/SIMULATOR.md`, `CLAUDE.md` and the skill as Spec. Out: the trace, which prints no row; any new column; anything in `src/rules/`; the sweep and parts recipes beyond the join note. Corner cases decided here: turn 0, the settle phase, is never read, the first row being turn _n_'s; an opening the ending or the stop reads writes no row of its own, which covers the stop on the cap's turn, a stop stuck at a turn's first decision and an ending landed inside the end of turn, the ending row reading that chronicle; a defeat landed mid-turn on a grid turn keeps that turn's row, the opening and the ending being two moments; a seed's rows over the turns precede its ending row; in a row over the turns `reached:<id>` is blank until reached, `count:<id>` the count on that opening's chronicle, `played`, `killed` and `deals` what landed before it, `unplayed` the piles' cards not played by then, `capstone` and `capstone-turn` as the ending row reads them. Reconcile: the ending row and a row over the turns are one reading at two moments and go through one door, the moment the parameter; the flag reads through the bounded whole-number reading the other flags use; nothing stays apart.

**Traps:**

- The turn moves inside the end-of-turn command's stages, the `turn` group in `src/rules/chronicle.ts`, and stages follow it in the same command. The opening the persona reads is the chronicle the whole command leaves, the outcome of the landed end-turn command, equally the `before` of the next landed command's first stage, never the chronicle the `turn` change leaves.
- The driver (`tools/sim-driver.ts`) stops on the cap and when stuck with the chronicle at a turn's opening, and an ending landed inside the end of turn ends it on the chronicle that command leaves: in each the end's chronicle is an opening, and the rule above says it writes no row of its own. Compare the chronicle, not the turn: a defeat mid-turn is another chronicle on the same turn and keeps the opening's row.
- The header is written from the first seed's first row, and the test at the end of `tools/sim.test.ts` matches it and the record's exact key order; no column is added, and `every` dropped where not given keeps the record regex green.
- The sim test's `rowsOf` takes every line after the header as a row, and the first test derives the expected rows from `playedBy`; with `--every` a seed has rows of two kinds.
- Rows are written after the drive, the rows over the turns first, then the ending's; a blank reads NULL in DuckDB, and `ms` with blanks still reads as an integer column.
- `CLAUDE.md` lists every flag of the sim in its commands table; it is a root file, not `docs/`.
- `tools/sim-body.ts` runs through `tools/vite-boot.ts`; the test at the end of the sim test spawns the real entry and takes up to a minute.

**Plan:**

1. `tools/sim-body.ts`: the flag in the table and the usage, read bounded, refused beside `--trace`; the record key; the rows over the turns written before the ending's through the one column reading, with the moment as its parameter and the ending's columns blank.
2. `tools/sim.test.ts`: on the fixture, with `--every <n>` the rows over the turns read the chronicle as each _n_th turn opened, the ending's columns blank, none for the opening the stop or the ending reads, the ending row after them and as today, the record carrying `every`; the refusals, `--trace` beside it among them. Without the flag the standing tests prove the file is as today.
3. `docs/SIMULATOR.md`, `CLAUDE.md`, `.claude/skills/sim/SKILL.md` as Spec.
4. The board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; a smoke out of the tree, `npm run sim -- --every 5 --seeds 2 --out <scratchpad>/every.csv`, the curve recipe run on it; no spec, the line never reaches the screen; CI proves the whole Playwright suite on the push, no spec walking this path.
