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

Measured on 2026-10-25 at the commit that lands these rows, the camps rolling at 0.08 with a wave of two from three guards, five camps, the neutral seven to nine tiles from the centre. The ending rows per cell, 20 seeds each:

| Cell | Captured | Capture turn, median | First capture | Captured by turn 15 | Neutral fell | Neutral's fall turn, median | Enemies killed, median | Own units lost, median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Builder, nomadic | 20 | 19 | 10 | 8 | 5 | 18 | 1 | 4 |
| Builder, end of Stone | 19 | 19 | 12 | 5 | 7 | 15 | 0.5 | 3 |
| Builder, no scouts | 20 | 20 | 11 | 5 | 8 | 14.5 | 1 | 3 |
| Warlord, nomadic | 18 | 19.5 | 10 | 7 | 6 | 19 | 2 | 4.5 |
| Warlord, end of Stone | 14 | 23 | 12 | 2 | 8 | 15.5 | 6.5 | 5.5 |
| Warlord, no scouts | 14 | 18 | 11 | 6 | 9 | 15 | 4.5 | 5 |

Nearly every chronicle falls to the camps, the builder's all, the warlord's two in three, half of them before turn 20; the neutral falls in a quarter to a half of the seeds, around turn 15, and where both fall the neutral falls first in nearly every case. The same seeds fall early across the cells, so the opening is the map's and the rolls' as much as the persona's. The personas kill few enemies, the builder about one a chronicle. A player holding seed 20 by hand at a roll of 0.02 stood with two warriors and a camp taken on turn 18 while the warlord fell on turn 12 to one pillager, so the personas' openings are weaker than a player's: no unit before turn 10, a scout entered as the first unit, the garrison out charting when the first enemy comes.

## Comparing a change

The economy pass's queries read here unchanged, `workflow/camps/` in place of `workflow/economy/`. What the pass reads beside the stocks: the ending and its turn, `defeat` being the capture, the `neutral-fell` listing, `enemies:<turn>` where the neutral's city fell to the enemies, blank where it stands, the `neutral-population`, and the `units:` and `killed:` columns by faction. The captures per cell, the turn they came on and the neutral's falls:

```sql
SELECT count(*) FILTER (WHERE ending = 'defeat') AS captured, list(seed || '@' || turn ORDER BY turn) FILTER (WHERE ending = 'defeat') AS falls,
  count(*) FILTER (WHERE "neutral-fell" IS NOT NULL) AS neutral_fell, median(TRY_CAST(regexp_extract("neutral-fell", ':(\d+)', 1) AS INT)) AS neutral_fall_turn
FROM read_csv('workflow/camps/<cell>/*.csv', comment='#', union_by_name=true) WHERE ending IS NOT NULL
```

A per-turn mean over all 20 seeds with a fallen city counted as nought carries no survivor bias; a median over the standing chronicles does, and climbs as the weak fall.
