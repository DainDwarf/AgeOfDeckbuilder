# Economy baseline

The economy free play: the simulator on the Stone Age, temperate, with the camps, the neutral, the events and the capstone off, so nothing but the deck and the persona moves the stocks. Measured on 2026-10-24 at the commit that lands these rows, the builder playing bread, both personas on three decks, seeds 1 to 20, one row as each turn opens. The rows stand in `economy/`, one folder per cell, one file per five seeds, so a balance change ships against a baseline: run the same cell into the scratchpad, join it to these rows seed by seed, and the movement is the change's. Rerun this baseline when a change lands that moves it on purpose, and replace the folders; the chart's page rebuilds from `economy/chart/`.

## The cell

| Flag        | Value                           |
| ----------- | ------------------------------- |
| `--age`     | `stone`                         |
| `--region`  | `temperate`                     |
| `--persona` | `builder`, then `warlord`       |
| `--off`     | `camps,neutral,events,capstone` |
| `--seeds`   | `1-20`, split five at a time    |
| `--every`   | `1`                             |
| `--turns`   | the default, 60                 |

The decks, each its own cell, in `decks/`:

| Folder | Deck | Flags after the cell |
| --- | --- | --- |
| `<persona>-nomadic` | the campaign's first civilization | none |
| `<persona>-stone-end` | `decks/stone-end.json` | `--civilization workflow/decks/stone-end.json herbalism agriculture trapping fire irrigation domestication bow-and-arrow pottery calendar bread tanning raft megalith bartering fishing` |
| `<persona>-stone-no-scouts` | `decks/stone-no-scouts.json` | `--civilization workflow/decks/stone-no-scouts.json` |

The end-of-Stone deck learns the whole tree as [`BALANCE.md`](BALANCE.md) says; measured with and without the technologies, every ending row is the same on all 20 seeds of both personas, so a technology changes nothing but the cards it unlocks for now, and the learned form is what is stored.

The split, from the project root, `$dir` a scratchpad folder, `$extra` the deck's flags:

```powershell
0..3 | ForEach-Object -Parallel {
  $from = $_ * 5 + 1; $to = $from + 4
  node tools/sim.ts --persona builder --age stone --region temperate --off camps,neutral,events,capstone --seeds "$from-$to" --every 1 --out "$using:dir/$from-$to.csv" @using:extra
} -ThrottleLimit 8
```

## What the baseline says

Every one of the 120 chronicles stood to the turn cap. The medians on the turn-60 row:

| Cell | Population | Held | Food | Production | Science | Culture | Military | Money |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Builder, nomadic | 14.5 | 8 | 18.5 | 127 | 0 | 3 | 104 | 0 |
| Builder, end of Stone | 19 | 10 | 25.5 | 73 | 22 | 8.5 | 102 | 0 |
| Builder, no scouts | 18 | 8 | 17.5 | 81 | 22.5 | 3 | 98 | 0 |
| Warlord, nomadic | 5 | 8 | 17.5 | 53 | 0 | 11 | 27 | 0 |
| Warlord, end of Stone | 5 | 8 | 14.5 | 24.5 | 21 | 10 | 33 | 0 |
| Warlord, no scouts | 6 | 8 | 19 | 46.5 | 22 | 7 | 37.5 | 0 |

What the builder plays, the median count per chronicle and in how many of the 20 chronicles the card was played at all:

| Card        | Nomadic  | End of Stone | No scouts   |
| ----------- | -------- | ------------ | ----------- |
| gather      | 117 (20) | 44 (20)      | 66 (20)     |
| fire        | —        | 22 (20)      | 22.5 (20)   |
| clay-pit    | —        | 5 (19)       | 4.5 (20)    |
| farm        | —        | 2 (20)       | 3 (17)      |
| irrigation  | —        | 4.5 (12)     | 6 (13)      |
| pasture     | —        | 2 (9)        | 2 (9)       |
| trapping    | —        | 1 (9)        | 1 (10)      |
| megalith    | —        | 1 (15)       | not in deck |
| tannery     | —        | 1 (8)        | not in deck |
| food-trade  | —        | 6.5 (8)      | not in deck |
| goods-trade | —        | 7 (7)        | not in deck |
| bread       | —        | 10 (20)      | not in deck |
| worker      | 2 (19)   | 1 (20)       | 1 (19)      |
| warrior     | 1 (19)   | 1 (13)       | 1.5 (14)    |
| archer      | —        | 1 (15)       | 1.5 (12)    |

The nomadic deck has no card that places anything. Heal and march stay unplayed in every chronicle of the two Stone decks.

## Comparing a change

Run the cell changed into the scratchpad with the split above, then join it to the baseline. The rows are read with DuckDB's command line as the `sim` skill says, `comment='#'` on every `read_csv`; a file written with `--every` holds a row per turn beside each chronicle's ending row, the ending blank on the turn rows.

The ending rows seed by seed, each stock's movement:

```sql
SELECT count(*) FILTER (WHERE b.production < a.production) AS down, count(*) FILTER (WHERE b.production = a.production) AS same, count(*) FILTER (WHERE b.production > a.production) AS up, median(b.production - a.production) AS moved
FROM read_csv('workflow/economy/builder-stone-end/*.csv', comment='#', union_by_name=true) a
JOIN read_csv('<scratchpad>/<cell>/*.csv', comment='#', union_by_name=true) b USING (seed)
WHERE a.ending IS NOT NULL AND b.ending IS NOT NULL
```

The curve, turn by turn, baseline beside the change:

```sql
SELECT turn, median(a.production) AS before, median(b.production) AS after
FROM read_csv('workflow/economy/builder-stone-end/*.csv', comment='#', union_by_name=true) a
JOIN read_csv('<scratchpad>/<cell>/*.csv', comment='#', union_by_name=true) b USING (seed, turn)
WHERE a.ending IS NULL AND b.ending IS NULL GROUP BY turn ORDER BY turn
```

The cards played, unpacked from the ending rows' `played` listing:

```sql
SELECT split_part(e, ':', 1) AS card, count(*) AS chronicles, median(CAST(split_part(e, ':', 2) AS INT)) AS plays
FROM read_csv('<cell>/*.csv', comment='#', union_by_name=true), unnest(str_split(played, ' ')) AS t(e)
WHERE ending IS NOT NULL GROUP BY 1 ORDER BY 1
```

## The chart

The page at <https://claude.ai/artifact/5rvYcBwnhYHbz9Dgi5wcbX> draws every stock by turn, the median over the standing chronicles per deck with the seeds faint behind, a panel per persona, and the endings beneath. To rebuild it on new rows, export the turn rows and the ending rows of the six cells to JSON, then fold them into the template:

```sql
COPY (SELECT regexp_extract(filename, '([^/\\]+)[/\\][^/\\]+$', 1) AS cell, seed, turn, food, production, military, money, science, culture, population, held FROM read_csv('workflow/economy/*/*.csv', comment='#', union_by_name=true, filename=true) WHERE ending IS NULL ORDER BY cell, seed, turn) TO '<out>/curve.json' (FORMAT JSON, ARRAY true);
COPY (SELECT regexp_extract(filename, '([^/\\]+)[/\\][^/\\]+$', 1) AS cell, seed, ending, cause, turn, population, held FROM read_csv('workflow/economy/*/*.csv', comment='#', union_by_name=true, filename=true) WHERE ending IS NOT NULL ORDER BY cell, seed) TO '<out>/endings.json' (FORMAT JSON, ARRAY true)
```

```powershell
node workflow/economy/chart/compact.mjs <out> workflow/economy/chart/template.html <out>/stone-temperate-economy.html
```

The template names the cells it draws, `builder-` and `warlord-` before `nomadic`, `stone-end` and `stone-no-scouts`, and the date in its cell line; a new baseline edits both. The page is republished to the same link with the Artifact tool, the URL above as `url`.
