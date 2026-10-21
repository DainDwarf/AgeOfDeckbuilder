---
name: profile
description: CPU-profile a tool under tools/, the simulator first among them, and read where its time goes. Use whenever asked why a run is slow, to find a hotspot, to weigh an optimisation, or to measure one before and after.
---

# Profile

One job: run a Node entry under V8's sampling profiler, read the profile it leaves through DuckDB, and say where the time went, the measured kept apart from the inferred.

## Procedure

1. **Name the run from the question.** The entry and its flags, the sim's cell as the question names it. The run is sized by the profile it leaves, never by a count fixed here: long enough that the startup is a sliver of it and the hot frames resolve apart, read off the header below. A profile under ~20 s, or one where the runtime's rows (`node`, `node_modules`) hold more than a few percent, is re-run bigger before anything is read. Calibration: Vite's startup is ~1.3 s, a builder chronicle 3–4 s, the profiler adds nothing measurable, and the same seeds land the same rows profiled or not.
2. **Run it in the scratchpad.** The sim: `node --cpu-prof --cpu-prof-dir <scratchpad>/<name> tools/sim.ts <the sim's flags> --out <scratchpad>/<name>.csv`; any other entry the same way with its own arguments. A run past a few seconds goes in the background; its end resumes the turn. The profile is `<scratchpad>/<name>/CPU.<stamp>.cpuprofile`, and its path, with forward slashes, is `$f` below.
3. **Read it through the recipes**, in order: the header and the split, the self time, the cumulative time, then the callers of one hot leaf. Every number is read off a query's answer and none counted by eye.
4. **Report.** The header first, duration and samples. Then the hotspots, self and cumulative as shares of the run. Then the reading: what the shape says, the candidate changes ranked by the share each could remove, and for each the next measurement that confirms or kills it. "`inSight` is 26% self" is measured; "charting once per command removes most of it" is inferred, and each is said in those words. A sampler says where time goes, never how much of it was avoidable: a question of how many trials were thrown away needs a counter, and is reported as one. Then stop.

## Rules

- A change in `src/rules/` stands as game code or it does not land: clearer, or faster where the player feels it, and it carries its own review. It is re-profiled on the same cell before and after; a speedup predicted and not measured does not count, and one that moves a row is a bug.
- No script over the profile: a question the recipes do not answer is a query, and one the profile cannot answer is the next measurement, named.
- Nothing of a profile is committed, and no profile runs on CI.
- The entry is profiled as it runs. A bundled copy attributes every frame to the bundle's lines and loses the files.

## Recipes

The profile is JSON, read in place: `$f` is its path with forward slashes, the prefix below is one PowerShell here-string, and every query is `duckdb -c "$cte <select>"`. A column named with `:` or `-` is double-quoted in SQL.

```powershell
$cte = @"
WITH RECURSIVE p AS (SELECT * FROM read_json('$f')),
n AS (SELECT unnest(nodes, recursive := true) FROM p),
e AS (SELECT id AS parent, unnest(children) AS child FROM n),
s AS (SELECT unnest(samples) AS id, unnest(timeDeltas) AS dt FROM p),
self AS (SELECT id, sum(dt) / 1e6 AS s FROM s GROUP BY id),
anc AS (SELECT id AS leaf, id AS node FROM n UNION ALL SELECT anc.leaf, e.parent FROM anc JOIN e ON e.child = anc.node),
cum AS (SELECT node, sum(self.s) AS s FROM anc JOIN self ON self.id = anc.leaf GROUP BY node),
named AS (SELECT id, functionName AS fn, regexp_replace(url, '^.*/(src|tools)/', '\1/') AS file, lineNumber + 1 AS line FROM n)
"@
```

The header, then where the run went: the project's code, the runtime, and the frames whose file V8 dropped, read under their own name:

```sql
SELECT round((endTime - startTime) / 1e6, 1) AS duration_s, (SELECT count(*) FROM s) AS samples FROM p;
SELECT CASE WHEN file LIKE 'src/%' OR file LIKE 'tools/%' THEN 'project' WHEN file LIKE '%node_modules%' THEN 'node_modules' WHEN file = '' THEN fn ELSE 'node' END AS where_, round(sum(self.s), 1) AS s FROM self JOIN named ON named.id = self.id GROUP BY 1 ORDER BY s DESC LIMIT 12
```

Self time, the frames the samples landed in:

```sql
SELECT fn, file, line, round(sum(self.s), 1) AS self_s FROM self JOIN named ON named.id = self.id GROUP BY ALL ORDER BY self_s DESC LIMIT 20
```

Cumulative time, a frame with everything under it; an anonymous closure is told apart by its line:

```sql
SELECT fn, file, line, round(sum(cum.s), 1) AS cum_s FROM cum JOIN named ON named.id = cum.node GROUP BY ALL ORDER BY cum_s DESC LIMIT 30
```

One hot leaf apportioned across its callers, the time under each:

```sql
SELECT c.fn AS caller, c.file, c.line, round(sum(cum.s), 1) AS cum_s FROM e JOIN named c ON c.id = e.parent JOIN named k ON k.id = e.child JOIN cum ON cum.node = e.child WHERE k.fn = '<function>' GROUP BY ALL ORDER BY cum_s DESC
```

## Reading the tables

- A line is within a few lines of the source, shifted by Vite's transform: the function is found by its name, and no line is quoted off a profile.
- A function V8 optimised may lose its file and reads with an empty one; a function lands as several rows where it was compiled several times.
- The cumulative table counts a frame once per level it stands on a path: a function that recurses, and a closure nested in another of the same name, read above their share there. The self table and the callers' table do not.
- `(idle)`, `(program)` and `(garbage collector)` are the runtime's own rows; `(root)` is the whole run.
- A native leaf hot in self time, a string built or a map looked up, is changed at its callers: the apportioning query says which.
