# The sweep

**Line:** The sweep — a knob sweep over the cell's own parameters, one cell per value, and the ablation of one gambit at a time, one cell per gambit; the `sim` skill gains both, and the split of a sweep across processes, one process per cell by the shell and the parts read as one by the query, a seed range on `--seeds` where one cell must split. Done when `npm run sim` takes `--without <n>` and a range on `--seeds`, its record carries both, its tests on the fixture hold them, and the `sim` skill holds the split, the sweep and the ablation as recipes with the query that reads a run's parts as one.

**Spec:** The Wheel check settled what is code and what is recipe. The knob sweep is a shell loop, one sim per value into its own folder; the split is PowerShell 7's parallel loop with a throttle; the parts are read as one by DuckDB's read of a glob of files, each file's cell line skipped, columns merged by name, the file's path on every row — verified on DuckDB 1.5.5 with two files of different achievement columns. The code is two flags on the sim and nothing else:

- `--without <n>` names the gambit left out of the persona's walk, by the number `--personas` prints; one per cell. Any gambit may be left out, the end of turn, the settle and the deal included: the driver's stops are the detection, a chronicle stuck on a decision where no command lands or hitting the command cap, and the rows report a stop first as an error with its seed. The flag is refused where `n` is not a whole number from 1 to the persona's gambit count, the refusal naming the count. The trace takes it as the rows do.
- `--seeds` takes a count as today, the seeds then running from 1, or a range `<a>-<b>` with 1 ≤ a ≤ b, the seeds then running from a to b, both included; anything else is refused.
- The record carries `seeds` as the flag was given, a number for a count and the string for a range, and `without` with its number after `persona` when given, absent otherwise, so a file found later reads its cell whole and a record of today's shape stays as it is.

`docs/SIMULATOR.md`, _The cell, the row, the query_, three sentences change, each written out:

- "The seeds run from 1 to the count, and pair across cells: …" becomes "The seeds run from 1 to the count, or over the range named, and pair across cells: …".
- "… the persona, the turn cap and the seed count, so a file found later reads its cell whole …" becomes "… the persona, the gambit left out where one is, the turn cap and the seeds as given, so a file found later reads its cell whole …".
- "A **sweep** emits one cell per value of a knob of the cell's own, and an **ablation** one cell per gambit switched off." becomes "A **sweep** is one cell per value of a knob of the cell's own, and an **ablation** one cell per gambit left out of the persona's walk, nothing else changed; a cell past a handful of seeds runs as parts, a seed range each in its own process, and a run's files are read as one by the query."

`CLAUDE.md`, the `npm run sim` row: "`--age`, `--region`, `--persona` and `--seeds` name the cell, each defaulting to what the launch screen opens on, the idle and 20;" becomes "`--age`, `--region`, `--persona` and `--seeds` name the cell, each defaulting to what the launch screen opens on, the idle and 20, `--seeds` taking a count or a range `<a>-<b>`; `--without <n>` leaves the persona's gambit of that number out of its walk;".

The `sim` skill: step 1 gains the two flags in the terms above; a new section **Sweeps** holds the rule and the three recipes below, verbatim or reworded to the skill's voice, and the parts query joins _Queries_. The rule: a cell past a handful of seeds runs split, parts of five seeds, eight processes at a time, into one folder per cell, the part named for its range; a sweep and an ablation are the same loop over the values or the gambit numbers, one folder per cell under the run's folder, named for the value or the number; the query reads the run's folder as one and groups by the cell's folder. Calibration, as data: the split run is one process per part through the node entry, `node tools/sim.ts`, since npm's wrapper would add its startup to every part; a process starts in 1.4 s; eight at a time slow each by a tenth and sixteen by 2.3×, so eight is the throttle; twenty starting at once take 7 s; a builder chronicle is 2.4 s at the median and 12 s at worst, so the wall clock of a split is its slowest seed, 13 s for 20 seeds against 85 s in one process; the `ms` column of a split run reads a tenth high. The ablation's gambit count is read off `--personas`, the numbered lines under the persona's name.

The split, one cell, its flags in `$cell`, into `$dir`:

```powershell
$cell = @('--persona', 'builder', '--age', 'stone')
$dir = "<scratchpad>/<name>"; New-Item -ItemType Directory -Force $dir | Out-Null
0..19 | ForEach-Object -Parallel {
  $c = $using:cell; $from = $_ * 5 + 1; $to = $from + 4
  Set-Location <project root>; node tools/sim.ts @c --seeds "$from-$to" --out "$using:dir/$from-$to.csv"
} -ThrottleLimit 8
```

The sweep and the ablation, the same loop with a folder per value under the run's folder, the values a knob's or the gambit numbers 1 to the count: every part of every cell goes on one list of jobs, each a folder and a range, and the one parallel loop runs the list at the throttle of eight, so no core idles between cells.

The parts query, a run's cells side by side:

```sql
SELECT regexp_extract(filename, '([^/\\]+)[/\\][^/\\]+$', 1) AS cell, ending, cause, count(*) AS n, string_agg(seed, ' ' ORDER BY seed) AS seeds FROM read_csv('<run>/*/*.csv', comment='#', union_by_name=true, filename=true) GROUP BY ALL ORDER BY 1, n DESC
```

**Doc-impact:** `docs/SIMULATOR.md`; `CLAUDE.md`'s command table and the `sim` skill beside it.

**Scope:** In: the two flags, their refusals, their record, their tests on the fixture; the three docs sentences and the command row; the skill's section, rule, recipes, calibration and query. Out: any change to `tools/vite-boot.ts` — Vite's client dependency optimiser, which the tool never uses, switched off gained nothing measurable and is not taken; any change in `src/`; any measurement committed. Corner cases decided here: the header line goes before the first row of the range, not before seed 1; a gambit that reads another's helper to test its own condition (the warlord's unassign reads whether a unit card would enter) still reads it when that other is left out — the ablation leaves the walk, not the helpers, and the trace shows it; `--personas` prints the whole persona whatever `--without` says; `--without` beside `--trace` traces the ablated cell. Reconcile: a range of one seed and `--trace` play the same chronicle and stay apart, the one writing a row and the other the commands; the skill's seed-by-seed join of two files stays beside the parts query, the one answering how a seed moved and the other each cell's distribution; the single-cell runs keep `npm run sim` and the split runs the node entry; the gambit numbering has one source, the persona's list order, read by `--personas` and `--without` alike.

**Traps:**

- `tools/sim.test.ts`'s last test matches the record's closing with a regex anchored on `"persona":"idle","turns":60,`; `without` goes after `persona` and is absent when not given, so that regex holds as it is and the ablation's test writes its own.
- The parallel loop's runspaces see the caller's variables through `$using:` alone and are given the project root explicitly; the recipes above do both.
- Twenty processes starting at once once raced on Vite's dependency cache rename, `node_modules/.vite/deps_temp_*` (89 stale folders stand there from past runs, harmless); the throttle of eight is the answer, and `tools/vite-boot.ts` is not touched.
- The idle's gambit 2 settles and gambit 1 takes a deal; the end of turn is refused on the settle phase before the city stands and while a deal stands (`src/rules/chronicle.ts`, `endOfTurnAs` and `refusedAhead`), so the idle without 2 stops stuck on turn 0 and without 1 stuck on its first deal: the fixture ground for the ablation's test.
- The sim skill's rule "No measurement runs on CI and none is committed" covers the proof run below: its files stay in the scratchpad.

**Plan:**

1. `tools/sim-body.ts`: `--seeds` reads a count or a range and the loop runs over it, the header before its first row; `--without` reads the number against the persona's gambit count and the cell plays the persona with that gambit left out; the usage and the record carry both. `tools/sim.test.ts`: a range run's rows are the seeds of the range, the record carrying the range as written and the header first; an ablated idle stops stuck where the trap above says, its record carrying `without`; `--without` past the count is refused naming the count. `npm test` green.
2. `docs/SIMULATOR.md`, the three sentences; `CLAUDE.md`, the command row.
3. `.claude/skills/sim/SKILL.md`: step 1's flags, the **Sweeps** section with the rule, the recipes and the calibration, the parts query under _Queries_.
4. The proof run: the split recipe on the idle, Stone temperate, 10 seeds in parts of five, into the scratchpad, then the parts query on it; the Verification section quotes the query's table.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof run of step 4 and its query, the table in the report. No spec: the line never reaches the screen. CI proves nothing beyond the rules tests on this push; no e2e spec walks the sim.
