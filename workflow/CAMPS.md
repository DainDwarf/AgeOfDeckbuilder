# Camps baseline

The camps pass's setting: the simulator on the Stone Age, temperate, with the camps and the neutral on and the events and the capstone off, so the camps and the neutral alone oppose the deck and the persona. Every line of the pass measures on these cells, as the economy pass's lines measured on [`ECONOMY.md`](ECONOMY.md)'s: both personas on the three decks, seeds 1 to 20, one row as each turn opens. The rows stand in `camps/`, one folder per cell, one file per five seeds, so a change ships against a baseline: run the same cell into the scratchpad, join it to these rows seed by seed, and the movement is the change's. Rerun this baseline when a change lands that moves it on purpose, a persona's gambits or the camps' numbers, and replace the folders.

## The cell

| Flag        | Value                        |
| ----------- | ---------------------------- |
| `--age`     | `stone`                      |
| `--region`  | `temperate`                  |
| `--persona` | `builder`, then `warlord`    |
| `--off`     | `events,capstone`            |
| `--seeds`   | `1-20`, split five at a time |
| `--every`   | `1`                          |
| `--turns`   | the default, 60              |

The decks are the economy pass's, each its own cell, the folders and the flags after the cell as [`ECONOMY.md`](ECONOMY.md) lists them. The split is the economy pass's with `--off events,capstone` in place of its four switches.

Seed _n_ deals the same map under every persona and deck, so a fall the map explains shows on one seed across the cells; the camps' rolls diverge from one cell to another once the chronicle's generator has been stepped differently, from the first reshuffle on.

## What the baseline says

Measured on 2026-10-26 at the commit that lands these rows, on the personas holding the range reading, the pull-back and heal, the refresh away and the withdrawal, the camps rolling at 0.08 with a wave of two from three guards, five camps, the neutral seven to nine tiles from the centre. The ending rows per cell, 20 seeds each:

| Cell | Captured | Capture turn, median | First capture | Captured by turn 15 | Neutral fell | Neutral's fall turn, median | Enemies killed, median | Own units lost, median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Builder, nomadic | 19 | 24 | 11 | 5 | 7 | 20 | 4 | 4.5 |
| Builder, end of Stone | 16 | 21 | 12 | 2 | 6 | 11.5 | 3 | 5 |
| Builder, no scouts | 19 | 22 | 11 | 3 | 10 | 15 | 2.5 | 4 |
| Warlord, nomadic | 13 | 19 | 11 | 5 | 6 | 20.5 | 4.5 | 5.5 |
| Warlord, end of Stone | 13 | 22 | 12 | 3 | 7 | 15 | 11 | 4 |
| Warlord, no scouts | 13 | 22 | 11 | 2 | 9 | 15 | 6.5 | 3.5 |

Most chronicles still fall to the camps, 93 of the 120: the builder's all but six, the warlord's two in three, 36 of them before turn 20. The neutral falls in six to ten seeds of twenty, its median fall between turns 11.5 and 20.5, and where both fall the neutral falls first every time. The same seeds fall early across the cells, seed 6 by turn 17 in every one but the builder's on no scouts, which stands to turn 24, so the opening is the map's and the rolls' as much as the persona's. On the Stone decks both personas raise their first unit that attacks around turn 7; on the nomadic deck the settle's scout is that unit. The builder kills two to four enemies a chronicle, the warlord seven to eleven on the Stone decks and four or five on the nomadic one. A player holding seed 20 by hand at a roll of 0.02 stood with two warriors and a camp taken on turn 18; on that seed the warlord stands to the turn cap on the nomadic deck and falls on turn 28 on no scouts.

## Comparing a change

The economy pass's queries read here unchanged, `workflow/camps/` in place of `workflow/economy/`. What the pass reads beside the stocks: the ending and its turn, `defeat` being the capture, the `neutral-fell` listing, `enemies:<turn>` where the neutral's city fell to the enemies, blank where it stands, the `neutral-population`, and the `units:` and `killed:` columns by faction. The captures per cell, the turn they came on and the neutral's falls:

```sql
SELECT count(*) FILTER (WHERE ending = 'defeat') AS captured, list(seed || '@' || turn ORDER BY turn) FILTER (WHERE ending = 'defeat') AS falls,
  count(*) FILTER (WHERE "neutral-fell" IS NOT NULL) AS neutral_fell, median(TRY_CAST(regexp_extract("neutral-fell", ':(\d+)', 1) AS INT)) AS neutral_fall_turn
FROM read_csv('workflow/camps/<cell>/*.csv', comment='#', union_by_name=true) WHERE ending IS NOT NULL
```

A per-turn mean over all 20 seeds with a fallen city counted as nought carries no survivor bias; a median over the standing chronicles does, and climbs as the weak fall.
