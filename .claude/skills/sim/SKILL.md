---
name: sim
description: Run the headless simulator on a cell and report its numbers. Use whenever asked to simulate, measure, run the sim, play a cell or a persona headlessly, trace a seed, query a run's rows, or how a persona fares on an age, a region or a deck.
---

# Sim

One job: run `npm run sim` on the cell asked for and hand back what it printed. The reading of why is the user's.

## Procedure

1. **Name the cell from the question.** `--age`, `--region`, `--persona` and `--seeds`, each defaulting to what the launch screen opens on, the idle and 20, `--seeds` taking a count or a range `<a>-<b>`; `--without <n>` leaves the persona's gambit of that number out of its walk, the number as `--personas` prints it; `--off <switch>[,<switch>...]` plays the cell with its camps, its neutral, its events or its capstone switched off, the ones named; `--goal <technology>` names the goal the persona's goal gambits go for, the achievement of a technology the cell's chronicles read, the capstone without it or once the goal is reached; `--civilization` hands in the civilization played, a JSON inline or in a file in the content's own format, the campaign's first without it; the age and the region learn what reaches them, and a technology named after the flags learns more. A civilization handed in is written to the scratchpad as a JSON file and the file's path given, the inline form being for a one-liner alone. `--turns <n>` moves the turn cap off 60. `--every <n>` writes one row more as each nth turn opens, the ending's columns blank, and goes beside no `--trace`. `--personas` prints every persona as its sentences.
2. **Write the rows to the scratchpad**, `--out <scratchpad>/<name>.csv`, the name the question's word, never into the tree; the file's first line holds the cell, read with `Get-Content <file> -TotalCount 1`. A run past a few seconds goes in the background; its end resumes the turn.
3. **Query the file for what the rows say**, through the recipes below, every number read off a query's answer and none counted by eye: the endings and their causes, the turns, the stops with their seeds; the achievements reached and on which turns, the influence paid, the stocks and population the city ended on and, with `--every`, the curve of any column over the turns, the cards never played, the deals' entries taken, the units killed. Then stop.
4. **Replay a seed worth a look** with `--trace <seed>` on the same cell, the seed read off its row. The trace names the gambit behind every command.

## Rules

- Numbers, never a diagnosis: no reading of why, no balance recommendation, no fix. A surprising number is said as the number, and the next measurement is offered.
- A stop is an error to investigate, never a result, but for a stop on the cap with the capstone off, which is such a cell's ending. A row whose ending is `stopped` is reported first, with its seed and cause, and its trace is the next measurement.
- Which seed to replay is read off the rows; a run is never repeated in search of one.
- No script over the rows and none over the rules: a question about the rows is a query, and one the rows cannot answer is a column to add, reported for a board line.
- No measurement runs on CI and none is committed permanently: a baseline the user orders kept lives under `workflow/`, ephemeral like the rest of it, with its setup written beside it.
- A content variant is its own run, in its own process: the edit, the run, then `git checkout <file>` and `git status --porcelain <file>` printing nothing, unless the user is tuning, in which case the edit stays on the tree and the hand-back says so. Two files are compared seed by seed: the same seed is the same map, through the join below.

## Sweeps

- A cell past a handful of seeds runs split: parts of five seeds, eight processes at a time, into one folder per cell, each part named for its range.
- A split run calls the node entry, `node tools/sim.ts`, one process per part; a single-cell run keeps `npm run sim`.
- A sweep and an ablation are the same loop over the values or the gambit numbers, one folder per cell under the run's folder, named for the value or the number. The ablation's gambit count is read off `--personas`, the numbered lines under the persona's name.
- The parts query below reads the run's folder as one and groups by the cell's folder.

Calibration: npm's wrapper adds its startup to every part; a process starts in 1.4 s; eight at a time slow each by a tenth and sixteen by 2.3×, so eight is the throttle; twenty starting at once take 7 s; a builder chronicle is 2.4 s at the median and 12 s at worst, so the wall clock of a split is its slowest seed, 13 s for 20 seeds against 85 s in one process; the `ms` column of a split run reads a tenth high.

The split, one cell, its flags in `$cell`, into `$dir`:

```powershell
$cell = @('--persona', 'builder', '--age', 'stone')
$dir = "<scratchpad>/<name>"; New-Item -ItemType Directory -Force $dir | Out-Null
0..19 | ForEach-Object -Parallel {
  $c = $using:cell; $from = $_ * 5 + 1; $to = $from + 4
  Set-Location <project root>; node tools/sim.ts @c --seeds "$from-$to" --out "$using:dir/$from-$to.csv"
} -ThrottleLimit 8
```

The sweep and the ablation, the same loop with a folder per value under the run's folder, `$knob` the flag swept and `$values` its values, the gambit numbers 1 to the count for an ablation: every part of every cell goes on one list of jobs, each a value and a range, and the one parallel loop runs the list at the throttle of eight, so no core idles between cells.

```powershell
$cell = @('--persona', 'builder', '--age', 'stone'); $knob = '--without'; $values = 1..<count>
$run = "<scratchpad>/<name>"
$jobs = foreach ($v in $values) {
  New-Item -ItemType Directory -Force "$run/$v" | Out-Null
  foreach ($p in 0..19) { @{ value = "$v"; from = $p * 5 + 1 } }
}
$jobs | ForEach-Object -Parallel {
  $c = $using:cell + @($using:knob, $_.value); $from = $_.from; $to = $from + 4
  Set-Location <project root>; node tools/sim.ts @c --seeds "$from-$to" --out "$using:run/$($_.value)/$from-$to.csv"
} -ThrottleLimit 8
```

## Queries

The rows are queried in place with DuckDB's command line, `duckdb -c "<sql>"`, on the file `--out` wrote, every `read_csv` given `comment='#'` so the cell's first line is skipped; nothing is loaded and no session state stands. Several statements go in one `-c`, separated by `;`; a query of several lines goes through a PowerShell here-string, `$q = @"…"@; duckdb -c $q`, the path inside `read_csv('…')` written with forward slashes. A column named with `:` or `-` is double-quoted in SQL. A blank cell reads NULL, and a column blank in every row reads as text. A file written with `--every` holds a row per turn read beside each chronicle's ending row, the ending blank on it: a recipe over the endings takes `WHERE ending IS NOT NULL`, a curve `WHERE ending IS NULL`, and a join of two such files `USING (seed, turn)`.

The endings and the stops, with their seeds:

```sql
SELECT ending, cause, count(*) AS n, string_agg(seed, ' ' ORDER BY seed) AS seeds FROM read_csv('<file>', comment='#') GROUP BY 1, 2 ORDER BY n DESC
```

Every number's distribution at once:

```sql
SELECT column_name, min, q25, q50, q75, max, avg, null_percentage FROM (SUMMARIZE SELECT * EXCLUDE (seed) FROM read_csv('<file>', comment='#')) WHERE column_type <> 'VARCHAR'
```

A column's curve over the turns, each turn over the chronicles still standing on it, then the curve cut by how the chronicle ended:

```sql
SELECT turn, count(*) AS standing, min(production), median(production), max(production) FROM read_csv('<file>', comment='#') WHERE ending IS NULL GROUP BY turn ORDER BY turn;
SELECT e.ending, turn, median(production) FROM read_csv('<file>', comment='#') r JOIN (SELECT seed, ending FROM read_csv('<file>', comment='#') WHERE ending IS NOT NULL) e USING (seed) WHERE r.ending IS NULL GROUP BY ALL ORDER BY 1, 2
```

A listing unpacked — a faction's units or kills, the cards played or never played, the deals — into how many times each name is listed and the median of its number:

```sql
SELECT split_part(e, ':', 1) AS name, count(*) AS n, median(CAST(split_part(e, ':', 2) AS INT)) AS number FROM read_csv('<file>', comment='#'), unnest(str_split("units:enemy", ' ')) AS t(e) GROUP BY 1 ORDER BY n DESC
```

A cut by a condition, the rows it holds for beside the rest:

```sql
SELECT list_contains(list_transform(str_split(deals, ' '), lambda e: split_part(e, ':', 1)), '<event>><entry>') AS cut, ending, cause, count(*) AS n FROM read_csv('<file>', comment='#') GROUP BY ALL ORDER BY 1, 4 DESC
```

Two files seed by seed: the endings moved, with the seeds to trace, and a number's movement:

```sql
SELECT concat_ws(' ', a.ending, a.cause) AS first, concat_ws(' ', b.ending, b.cause) AS second, count(*) AS n, string_agg(a.seed, ' ' ORDER BY a.seed) AS seeds FROM read_csv('<first>', comment='#') a JOIN read_csv('<second>', comment='#') b USING (seed) GROUP BY 1, 2 ORDER BY n DESC;
SELECT count(*) FILTER (WHERE b.food < a.food) AS down, count(*) FILTER (WHERE b.food = a.food) AS same, count(*) FILTER (WHERE b.food > a.food) AS up, median(b.food - a.food) AS moved FROM read_csv('<first>', comment='#') a JOIN read_csv('<second>', comment='#') b USING (seed)
```

A run's parts read as one, its cells side by side, each named for its folder; the parts of one split cell are read by any query above as `read_csv('<cell>/*.csv', comment='#', union_by_name=true)`:

```sql
SELECT regexp_extract(filename, '([^/\\]+)[/\\][^/\\]+$', 1) AS cell, ending, cause, count(*) AS n, string_agg(seed, ' ' ORDER BY seed) AS seeds FROM read_csv('<run>/*/*.csv', comment='#', union_by_name=true, filename=true) GROUP BY ALL ORDER BY 1, n DESC
```
