# The cell beside the rows

**Line:** The cell beside the rows — the file `--out` writes opens on one `#` line holding the cell as one JSON object, the age, the region, the civilization, the technologies learned, the persona, the turn cap and the seed count, and its header holds none of them; the trace opens on the same line; the `sim` skill's recipes read past it. Doc-impact: `docs/SIMULATOR.md`.

**Spec:** `docs/SIMULATOR.md` _The cell, the row, the query_. The paragraph opening "One CSV **row** per chronicle" changes to open:

> The cell is written once, as the first line of the file, a comment holding it as the command that made it: the age, the region, the civilization, the technologies learned, the persona, the turn cap and the seed count, so a file found later reads its cell whole, and the trace opens on the same line. One CSV **row** per chronicle, flushed as it lands: the seed, the ending or the stop with its cause and the turn it came on, the influence the ending paid, the capstone drawn and the turn it lands on; …

The rest of that paragraph stands as it is, "A row holds one value per column for what every chronicle of the cell has" included. The sentence "The rows are **queried** in place, in SQL through DuckDB's command line, which the machine carries and the project does not depend on" gains ", reading past the cell's line" after "command line".

The record, written out, on today's default cell with two seeds:

```
# {"age":"nomadic","region":"temperate","civilization":"nomadic","learned":[],"persona":"idle","turns":60,"seeds":2}
seed,ending,cause,turn,ms,influence,capstone,capstone-turn,food,…
```

Its keys, in that order, named as the flags are where a flag exists: `age`, `region`, `civilization`, `learned`, `persona`, `turns`, `seeds`. `learned` is the campaign's whole technology list as the row's `learned` column holds it today, what reached the age, what unlocked the region and what was named with its needs, in the campaign's order, `[]` on the first age. The trace's record carries `"trace":<seed>` in place of `"seeds"`, so the line still reads as the command that made it; it is printed before the trace's first command line. Without `--out` the record is printed before the header, as the rows are.

`.claude/skills/sim/SKILL.md`, the record's reader, changes in the same commit. Step 2 becomes:

> 2. **Write the rows to the scratchpad**, `--out <scratchpad>/<name>.csv`, the name the question's word, never into the tree; the file's first line holds the cell, read with `Get-Content <file> -TotalCount 1`. A run past a few seconds goes in the background; its end resumes the turn.

In _Queries_, "on the file `--out` wrote" becomes "on the file `--out` wrote, every `read_csv` given `comment='#'` so the cell's first line is skipped". Every recipe's `read_csv('<file>')`, `read_csv('<first>')` and `read_csv('<second>')` gains `, comment='#'` inside the parentheses, and the SUMMARIZE recipe's `EXCLUDE (age, region, civilization, learned, persona, "turn-cap", seed)` becomes `EXCLUDE (seed)`.

No player-facing sentence: nothing of this reaches the screen.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:** In: the six columns leave the row's head, the record written first to the file or printed first, the trace opening on its record, the simulator's tests reading the record, the page and the skill. Out: the deck, which the deck flag's line adds to the record as a key beside these; the sentence `CLAUDE.md` holds for `npm run sim`, still true; `--seeds` given beside `--trace`, ignored today and ignored still. The reconcile: the row's cell columns and the record become one, in the record's form; the forge's save file stays apart, a campaign the game's Import reads against the run's command written back. The seed count is written though the line's list omits it, by the user's call, so a file cut short shows how many rows it should hold.

**Traps:**

- DuckDB's `comment` option skips a line that starts with the character and nothing else about it; measured on the v1.5.5 on this machine with `# {` opening the line: `read_csv(…, comment='#')` reads the header and the rows, SUMMARIZE over it works, and a plain `read_csv` without the option fails on the first line. A row starts with the seed, a number, so no row is ever skipped.
- The file is truncated once, then appended a line at a time as each chronicle ends, so the record is written before the first chronicle is played and a run cut short leaves the record and the rows that landed.
- The last test of `tools/sim.test.ts` runs the real CLI and matches the header against a regular expression opening on `^age,region,…,turn-cap,seed,`; the header now opens on `seed,` and the first line is the record. The first test reads the cell's values off the row's columns and the "a cell learns the victory of every age" test reads `learned` off the row; both read the record instead.
- `learned` holds the campaign's technologies whole, as `cellColumns` joins them today, not the positionals as typed.
- The key for the turn cap is the flag's name, `turns`, not the column's old `turn-cap`.
- `--out` beside `--trace` stays refused.
- Prettier keeps every markdown paragraph on one line; `npm run lint` refuses a wrapped one.

**Plan:**

1. `tools/sim-body.ts`: the record assembled from the cell, the turn cap and the seed count or the traced seed, written or printed before the header and before the trace's lines; the six columns gone from the row. Leaves a run whose file opens on the record and whose header opens on `seed`.
2. `tools/sim.test.ts`: the tests that read the cell read it off the record; the CLI test's header expression; one assertion that the trace's first line is the record carrying the traced seed. Leaves `npm test` green.
3. `docs/SIMULATOR.md` and `.claude/skills/sim/SKILL.md` as the Spec writes them. Leaves the page and the skill saying what the file is.
4. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. One run on the game's content, `npm run sim -- --seeds 2 --out <scratchpad>/cell.csv`, then `duckdb -c "SELECT seed, ending FROM read_csv('<scratchpad>/cell.csv', comment='#')"` printing two rows and `Get-Content <scratchpad>/cell.csv -TotalCount 1` printing the record; and `npm run sim -- --trace 1` opening on the record with `"trace":1`. No spec proves the line: it never reaches the screen. CI's specs on the push: none walk `tools/`; the suite runs as on every push.
