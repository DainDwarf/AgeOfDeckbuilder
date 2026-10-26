# Camps baseline

The camps pass's setting: the simulator on the Stone Age, temperate, with the camps and the neutral on, the camps rolling at 0.04 and waiting five turns, and the events and the capstone off, so the camps and the neutral alone oppose the deck and the persona. Every line of the pass measures on these cells, as the economy pass's lines measured on [`ECONOMY.md`](ECONOMY.md)'s: both personas on the three decks, seeds 1 to 20, one row as each turn opens. The rows stand in `camps/`, one folder per cell, one file per five seeds, so a change ships against a baseline: run the same cell into the scratchpad, join it to these rows seed by seed, and the movement is the change's. Rerun this baseline when a change lands that moves it on purpose, a persona's gambits or the camps' numbers, and replace the folders.

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

Measured on 2026-10-26 at the commit that lands these rows, on the personas holding the range reading, the pull-back and heal, the refresh away and the withdrawal, the camps rolling at 0.04 and waiting five turns with a wave of two from three guards, five camps, the neutral seven to nine tiles from the centre and opening with a worker and two warriors. The ending rows per cell, 20 seeds each:

| Cell | Captured | Capture turn, median | First capture | Captured by turn 15 | Neutral fell | Neutral's fall turn, median | Enemies killed, median | Own units lost, median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Builder, nomadic | 7 | 43 | 22 | 0 | 1 | 41 | 5 | 3 |
| Builder, end of Stone | 9 | 41 | 26 | 0 | 3 | 39 | 5 | 3 |
| Builder, no scouts | 9 | 44 | 23 | 0 | 1 | 32 | 6 | 3 |
| Warlord, nomadic | 3 | 23 | 14 | 1 | 0 | — | 7 | 4 |
| Warlord, end of Stone | 3 | 45 | 31 | 0 | 1 | 22 | 9 | 2 |
| Warlord, no scouts | 2 | 34.5 | 31 | 0 | 1 | 49 | 7.5 | 2 |

Most chronicles stand to the turn cap: 33 of the 120 fall to the camps, the builder's 25 of 60 and the warlord's 8, at a median of turn 40, and one alone before turn 20, the warlord's on the nomadic deck at turn 14 on seed 4; the next falls at turn 22. The neutral falls in 7 of the 120, none to three per cell, its median fall at turn 39, and where both fall the neutral falls first every time. No seed falls in more than three cells: seeds 1, 5, 11 and 16 fall in three, and seeds 2, 8 and 12 stand to the turn cap in all six. On the Stone decks both personas raise their first unit that attacks between turns 6.5 and 7.5 at the median; on the nomadic deck the settle's scout is that unit. The builder kills five or six enemies a chronicle, the warlord seven to nine, and each loses two to four units of its own at the median.

## Comparing a change

The economy pass's queries read here unchanged, `workflow/camps/` in place of `workflow/economy/`. What the pass reads beside the stocks: the ending and its turn, `defeat` being the capture, the `neutral-fell` listing, `enemies:<turn>` where the neutral's city fell to the enemies, blank where it stands, the `neutral-population`, and the `units:` and `killed:` columns by faction. The captures per cell, the turn they came on and the neutral's falls:

```sql
SELECT count(*) FILTER (WHERE ending = 'defeat') AS captured, list(seed || '@' || turn ORDER BY turn) FILTER (WHERE ending = 'defeat') AS falls,
  count(*) FILTER (WHERE "neutral-fell" IS NOT NULL) AS neutral_fell, median(TRY_CAST(regexp_extract("neutral-fell", ':(\d+)', 1) AS INT)) AS neutral_fall_turn
FROM read_csv('workflow/camps/<cell>/*.csv', comment='#', union_by_name=true) WHERE ending IS NOT NULL
```

A per-turn mean over all 20 seeds with a fallen city counted as nought carries no survivor bias; a median over the standing chronicles does, and climbs as the weak fall.
