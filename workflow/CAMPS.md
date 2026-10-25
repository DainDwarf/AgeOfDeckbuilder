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

## Comparing a change

The economy pass's queries read here unchanged, `workflow/camps/` in place of `workflow/economy/`. What the pass reads beside the stocks: the ending and its turn, `defeat` being the capture, the `neutral-fell` listing, `enemies:<turn>` where the neutral's city fell to the enemies, blank where it stands, the `neutral-population`, and the `units:` and `killed:` columns by faction. The captures per cell, the turn they came on and the neutral's falls:

```sql
SELECT count(*) FILTER (WHERE ending = 'defeat') AS captured, list(seed || '@' || turn ORDER BY turn) FILTER (WHERE ending = 'defeat') AS falls,
  count(*) FILTER (WHERE "neutral-fell" IS NOT NULL) AS neutral_fell, median(TRY_CAST(regexp_extract("neutral-fell", ':(\d+)', 1) AS INT)) AS neutral_fall_turn
FROM read_csv('workflow/camps/<cell>/*.csv', comment='#', union_by_name=true) WHERE ending IS NOT NULL
```

A per-turn mean over all 20 seeds with a fallen city counted as nought carries no survivor bias; a median over the standing chronicles does, and climbs as the weak fall.
