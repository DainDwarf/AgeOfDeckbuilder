# The fold

**Line:** **The fold** — the rows are queried in place with DuckDB's command line, the `sim` skill holding the recipes, each checked running: one file's endings and numbers, a listing unpacked, a cut by a condition, two files joined on the seed; the row gains its `turn-cap` column and the deals listing takes the `name:number` shape every other listing has, `npm test` passing on it; the project's settings allow `duckdb`. Doc-impact: `docs/SIMULATOR.md`.

**Spec:** `docs/SIMULATOR.md`, section _The cell, the row, the fold_, which becomes _The cell, the row, the query_. Its third paragraph is rewritten as follows, the rest of the page untouched:

> One CSV **row** per chronicle, flushed as it lands: the cell and the seed, the turn cap, the ending or the stop with its cause and the turn it came on, the influence the ending paid, the capstone drawn and the turn it lands on; the city as the chronicle ended, its stocks, its population, the tiles it holds, the neutral's population, and the units standing, by faction and kind; the units killed, by faction and kind, the cards played with their count and the cards left in the piles never played, every deal with the entry taken and its turn, every achievement's count and the turn it was reached, and the time the chronicle took. A row holds one value per column for what every chronicle of the cell has, and one cell listing what varies by seed, a listing being names each with its number. The rows are **queried** in place, in SQL through DuckDB's command line, which the machine carries and the project does not depend on: one file's distributions, a cut of its rows by a condition, and two files joined on the seed, the same seed being the same map and timeline under every persona and deck. One seed replays with a **trace** naming the gambit behind every command. A **sweep** emits one cell per value of a knob of the cell's own, and an **ablation** one cell per gambit switched off.

The `sim` skill, `.claude/skills/sim/SKILL.md`, changes in four places, written out here:

- Its description gains the trigger: "…trace a seed, query a run's rows, or how a persona fares on an age, a region or a deck."
- Procedure step 3 becomes: "**Query the file for what the rows say**, through the recipes below, every number read off a query's answer and none counted by eye: the endings and their causes, the turns, the stops with their seeds; the achievements reached and on which turns, the influence paid, the stocks and population the city ended on, the cards never played, the deals' entries taken, the units killed. Then stop."
- The rule "No script over the rows or the rules. A question the command cannot answer is a flag to add, reported for a board line." becomes: "No script over the rows and none over the rules: a question about the rows is a query, and one the rows cannot answer is a column to add, reported for a board line." The rule "Two files are compared seed by seed: the same seed is the same map." stays, ending "…the same map, through the join below."
- A new section after _Rules_:

> ## Queries
>
> The rows are queried in place with DuckDB's command line, `duckdb -c "<sql>"`, on the file `--out` wrote; nothing is loaded and no session state stands. Several statements go in one `-c`, separated by `;`; a query of several lines goes through a PowerShell here-string, `$q = @"…"@; duckdb -c $q`, the path inside `read_csv('…')` written with forward slashes. A column named with `:` or `-` is double-quoted in SQL. A blank cell reads NULL, a column blank in every row reads as text, and a listing's number is read with `TRY_CAST`, since a bare name carries none.
>
> The endings and the stops, with their seeds:
>
> ```sql
> SELECT ending, cause, count(*) AS n, string_agg(seed, ' ' ORDER BY seed) AS seeds FROM read_csv('<file>') GROUP BY 1, 2 ORDER BY n DESC
> ```
>
> Every number's distribution at once:
>
> ```sql
> SELECT column_name, min, q25, q50, q75, max, avg, null_percentage FROM (SUMMARIZE SELECT * EXCLUDE (age, region, civilization, learned, persona, "turn-cap", seed) FROM read_csv('<file>')) WHERE column_type <> 'VARCHAR'
> ```
>
> A listing unpacked — a faction's units or kills, the cards played or never played, the deals — into how many rows carry each name and the median of its number:
>
> ```sql
> SELECT split_part(e, ':', 1) AS name, count(*) AS n, median(TRY_CAST(split_part(e, ':', 2) AS INT)) AS number FROM read_csv('<file>'), unnest(str_split("units:enemy", ' ')) AS t(e) GROUP BY 1 ORDER BY n DESC
> ```
>
> A cut by a condition, the rows it holds for beside the rest:
>
> ```sql
> SELECT deals LIKE '%<event>><entry>%' AS cut, ending, cause, count(*) AS n FROM read_csv('<file>') GROUP BY ALL ORDER BY 1, 4 DESC
> ```
>
> Two files seed by seed: the endings moved, with the seeds to trace, and a number's movement:
>
> ```sql
> SELECT concat_ws(' ', a.ending, a.cause) AS first, concat_ws(' ', b.ending, b.cause) AS second, count(*) AS n, string_agg(a.seed, ' ' ORDER BY a.seed) AS seeds FROM read_csv('<first>') a JOIN read_csv('<second>') b USING (seed) GROUP BY 1, 2 ORDER BY n DESC;
> SELECT count(*) FILTER (WHERE b.food < a.food) AS down, count(*) FILTER (WHERE b.food = a.food) AS same, count(*) FILTER (WHERE b.food > a.food) AS up, median(b.food - a.food) AS moved FROM read_csv('<first>') a JOIN read_csv('<second>') b USING (seed)
> ```

The row, `tools/sim-body.ts`: a `turn-cap` column among the cell's, after `persona` and before `seed`, holding the cap the run was under; the deals listing's entry written `<event>><entry>:<turn>` for an event's deal and `<building>><reward>:<turn>` for a capture's, the number last as every other listing writes it. `.claude/settings.json` gains `"PowerShell(duckdb *)"` in its allow list, beside `"PowerShell(node *)"`.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:** In: the row's two changes with their tests, the skill's query section and its three edits, the settings entry, the page's paragraph and heading. Out: any report or fold tool — DuckDB on the machine is the tool, found before one was written, and the pitch of a fold CLI was withdrawn at intake; a split or compare flag on `npm run sim`; the fixed-turn stock reads, an idea; a DuckDB dependency in `package.json`, since the CLI is a machine tool like butler. Corner cases decided here: the column is `turn-cap`, the driver's word for it, never `turns`, which beside `turn` reads as its plural in a query; a third file or a sweep's several cells in one file is the sweep line's question, nothing here foresees it. The reconcile: the deals entry goes through the `name:number` shape the counted listings already write, and how the writer shares the joiner is the implementer's; the settings entry is the previous project's, in the form this project's allow list already uses; the pitch page of a fold's tables is moot and is cited nowhere.

**Traps:**

- `tools/sim-body.ts` imports the content, so the sim loads through Vite's module runner (`tools/vite-boot.ts`); the skill's recipes touch no code, and nothing here needs the runner changed.
- The header test in `tools/sim.test.ts` matches the column order by regex and the first test lists every non-listing column by name: both name `turn-cap` once the column exists, or the test is red for the right reason.
- Two tests assert the deals column verbatim (`2:PH_Upheaval>PH_Ambush`, and the capture's with the fixture's building and first reward): they move to the new shape, the oracle still read from the fixture, never a literal event id typed anew.
- DuckDB's `||` returns NULL when either side is NULL, and a victory's cause is blank: the join recipe uses `concat_ws`, which skips a NULL, and no recipe concatenates with `||`.
- `CAST('' AS INT)` is an error in DuckDB, and `unplayed` lists bare names: the listing recipe uses `TRY_CAST`.
- A column blank in every row — `reached:<technology>` where no seed reached it — reads as VARCHAR and falls out of `SUMMARIZE`'s numeric rows; that is the column saying no seed reached it, not a defect.
- `DOGMAS.md` _Tooling_: a tracked file changes through Read and Edit/Write alone — the settings file included.
- The glossary lint hook reads the skill and the page: "held" and "cut" are glossary words; the recipes alias `AS cut` for the condition's boolean, which is plain English in that sense (a forbidden word is forbidden in the term's own sense alone), and no alias uses `held`.

**Plan:**

1. `tools/sim-body.ts`: the `turn-cap` column and the deals entry's shape; `tools/sim.test.ts` follows, the header regex, the first test's expected row and the two deals assertions. `npm test` green.
2. `.claude/settings.json`: the allow entry.
3. `.claude/skills/sim/SKILL.md`: the description, step 3, the two rules, the _Queries_ section, as written in Spec.
4. `docs/SIMULATOR.md`: the heading and the paragraph, as written in Spec.
5. The recipes checked running: `npm run sim -- --age stone --seeds 20 --out <scratchpad>/a.csv` and the same with `--turns 20 --out <scratchpad>/b.csv`, then every recipe of the section run once on them through `duckdb -c`, its answer pasted in the report's Verification section, the two files deleted after.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the recipes run as step 5 says, each answer in the report. No Playwright spec: the line never reaches the screen. CI proves the whole suite on the push as always, no spec of it walking this change.
