---
name: sim
description: Run the headless simulator on a cell and report its numbers. Use whenever asked to simulate, measure, run the sim, play a cell or a persona headlessly, trace a seed, query a run's rows, or how a persona fares on an age, a region or a deck.
---

# Sim

One job: run `npm run sim` on the cell asked for and hand back what it printed. The reading of why is the user's.

## Procedure

1. **Name the cell from the question.** `--age`, `--region`, `--civilization`, `--persona` and `--seeds`, each defaulting to what the launch screen opens on, the idle and 20; the age and the region learn what reaches them, and a technology named after the flags learns more. `--turns <n>` moves the turn cap off 60. `--personas` prints every persona as its sentences.
2. **Write the rows to the scratchpad**, `--out <scratchpad>/<cell>.csv`, never into the tree. A run past a few seconds goes in the background; its end resumes the turn.
3. **Query the file for what the rows say**, through the recipes below, every number read off a query's answer and none counted by eye: the endings and their causes, the turns, the stops with their seeds; the achievements reached and on which turns, the influence paid, the stocks and population the city ended on, the cards never played, the deals' entries taken, the units killed. Then stop.
4. **Replay a seed worth a look** with `--trace <seed>` on the same cell, the seed read off its row. The trace names the gambit behind every command.

## Rules

- Numbers, never a diagnosis: no reading of why, no balance recommendation, no fix. A surprising number is said as the number, and the next measurement is offered.
- A stop is an error to investigate, never a result. A row whose ending is `stopped` is reported first, with its seed and cause, and its trace is the next measurement.
- Which seed to replay is read off the rows; a run is never repeated in search of one.
- No script over the rows and none over the rules: a question about the rows is a query, and one the rows cannot answer is a column to add, reported for a board line.
- No measurement runs on CI and none is committed.
- A content variant is its own run, in its own process: the edit, the run, then `git checkout <file>` and `git status --porcelain <file>` printing nothing, unless the user is tuning, in which case the edit stays on the tree and the hand-back says so. Two files are compared seed by seed: the same seed is the same map, through the join below.

## Queries

The rows are queried in place with DuckDB's command line, `duckdb -c "<sql>"`, on the file `--out` wrote; nothing is loaded and no session state stands. Several statements go in one `-c`, separated by `;`; a query of several lines goes through a PowerShell here-string, `$q = @"…"@; duckdb -c $q`, the path inside `read_csv('…')` written with forward slashes. A column named with `:` or `-` is double-quoted in SQL. A blank cell reads NULL, and a column blank in every row reads as text.

The endings and the stops, with their seeds:

```sql
SELECT ending, cause, count(*) AS n, string_agg(seed, ' ' ORDER BY seed) AS seeds FROM read_csv('<file>') GROUP BY 1, 2 ORDER BY n DESC
```

Every number's distribution at once:

```sql
SELECT column_name, min, q25, q50, q75, max, avg, null_percentage FROM (SUMMARIZE SELECT * EXCLUDE (age, region, civilization, learned, persona, "turn-cap", seed) FROM read_csv('<file>')) WHERE column_type <> 'VARCHAR'
```

A listing unpacked — a faction's units or kills, the cards played or never played, the deals — into how many times each name is listed and the median of its number:

```sql
SELECT split_part(e, ':', 1) AS name, count(*) AS n, median(CAST(split_part(e, ':', 2) AS INT)) AS number FROM read_csv('<file>'), unnest(str_split("units:enemy", ' ')) AS t(e) GROUP BY 1 ORDER BY n DESC
```

A cut by a condition, the rows it holds for beside the rest:

```sql
SELECT list_contains(list_transform(str_split(deals, ' '), lambda e: split_part(e, ':', 1)), '<event>><entry>') AS cut, ending, cause, count(*) AS n FROM read_csv('<file>') GROUP BY ALL ORDER BY 1, 4 DESC
```

Two files seed by seed: the endings moved, with the seeds to trace, and a number's movement:

```sql
SELECT concat_ws(' ', a.ending, a.cause) AS first, concat_ws(' ', b.ending, b.cause) AS second, count(*) AS n, string_agg(a.seed, ' ' ORDER BY a.seed) AS seeds FROM read_csv('<first>') a JOIN read_csv('<second>') b USING (seed) GROUP BY 1, 2 ORDER BY n DESC;
SELECT count(*) FILTER (WHERE b.food < a.food) AS down, count(*) FILTER (WHERE b.food = a.food) AS same, count(*) FILTER (WHERE b.food > a.food) AS up, median(b.food - a.food) AS moved FROM read_csv('<first>') a JOIN read_csv('<second>') b USING (seed)
```
