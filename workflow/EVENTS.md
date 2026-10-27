# Events baseline

The events pass's setting: the simulator with everything on, the camps, the neutral, the events and the capstone, so the whole game opposes the deck and the persona, and beside it the cells that take the schedule apart, one event alone or one trial named. Every line of the pass measures on these cells, as the camps pass's lines measured on [`CAMPS.md`](CAMPS.md)'s. The whole-game rows stand in `events/`, one folder per cell, one file per five seeds, so a change ships against a baseline: run the same cell into the scratchpad, join it to these rows seed by seed, and the movement is the change's; the cells that take the schedule apart run into the scratchpad alone, there being one per answer. Rerun the baseline when a change lands that moves it on purpose, an event's numbers or a trial's, and replace the folders.

## The whole game

| Flag        | Value                        |
| ----------- | ---------------------------- |
| `--age`     | `stone`                      |
| `--region`  | `temperate`                  |
| `--persona` | `builder`, then `warlord`    |
| `--off`     | nothing                      |
| `--seeds`   | `1-20`, split five at a time |
| `--every`   | `1`                          |
| `--turns`   | the default, 60              |

The decks are the economy pass's, each its own cell, the folders and the flags after the cell as [`ECONOMY.md`](ECONOMY.md) lists them. The split is the economy pass's with no `--off`.

The camps baseline is this cell with the events and the capstone off: the camps and the neutral are drawn in both, so seed _n_ deals the same map and the same timeline in [`CAMPS.md`](CAMPS.md)'s rows and in these, and the per-seed diff between the two is what the schedule does to a chronicle. The `deals` listing names every event dealt with the entry taken and its turn, so a query over the falls says which events precede the defeats and which never do; those are the pass's suspects.

The Nomadic Age is its own cell: `--age nomadic --region temperate`, the campaign's first civilization, both personas, nothing off, the seeds and the rows as above, its folders `<persona>-nomadic-age`, since `<persona>-nomadic` is the economy pass's name for the nomadic deck on the Stone Age.

## One event alone

The region's schedule cut to one event, the capstone off, so the chronicle runs to the cap and the event is dealt at every spacing, eight or nine times in sixty turns against one or two in a chronicle: the cell measures the event's slope across its escalation, not its weight in a chronicle, and is read as such. One cell per answer, the answer fixed for every deal, and one cell more with the persona's own choice, which never takes an answer whose trial leaves more cards that strike while another stands, so the challenge answers are measured through the fixed cells alone. The deck is the end-of-Stone one first, the one on which every answer is affordable, science from Fire and money from the Tannery; the others where a line asks. The fortunate pair, the Herd and Travellers, need no cell.

The cell is the whole game's flags with `--event <id>` and `--off capstone`, one cell per answer with `--answer <id>:<answer>` and one with none; `--capstone <id>` beside them names the trial the goal gambits go for, the same on every seed.

The rival band on the Nomadic Age is read the same way on the whole-game cell, the band's answer fixed each way while the other deals go as the persona takes them. `--answer rival-band:show-your-spears` and `--answer rival-band:make-room`, one cell each.

## One trial named

The whole game with the capstone named instead of drawn, one cell per trial, on the end-of-Stone deck first, since the trials are meant beatable once the tree is climbed and hard to impossible before. The cell is the whole game's flags with `--capstone <id>`, one cell per trial. What the cell reads: the `ending` and its turn per trial, victory against defeat and the stop on the cap, and the turn the capstone landed on. The three are compared against one another, not against a number.

## Comparing a change

The camps pass's queries read here unchanged, `workflow/events/` in place of `workflow/camps/`. What the pass reads beside them: the `deals` listing, `<event>><answer>:<turn>` per deal, the `capstone` and its turn, and the `influence` the ending paid. The events dealt before each fall, and how often each event is dealt in all:

```sql
SELECT seed, turn, deals FROM read_csv('workflow/events/<cell>/*.csv', comment='#', union_by_name=true)
WHERE ending = 'defeat' ORDER BY turn
```
