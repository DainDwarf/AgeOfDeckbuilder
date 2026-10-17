# The row

**Line:** The row — the row reads the chronicle as it ended and what the flow did on the way: the influence the ending paid, the capstone drawn and its turn, the stocks, the population, the tiles held, the neutral's population, the units standing and the units killed each by faction and kind, the cards played with their count and the cards in the piles never played, every deal with the entry taken and its turn, and every achievement's count and the turn it was reached; the header is fixed per cell, the fixed columns one value each and the variable ones one cell each in `learned`'s shape; the `sim` skill reports the new columns. Doc-impact: `docs/SIMULATOR.md`.

**Spec:** `docs/SIMULATOR.md`, _The cell, the row, the fold_, second paragraph. Its first sentence, "One CSV **row** per chronicle, flushed as it lands: the cell and the seed, the ending or the stop with its cause and the turn it came on, the city's stocks and population over the turns, the cards played and never played, every deal with the answer taken, every achievement's count and the turn it was reached, the capstone drawn, the enemies killed, and the time the chronicle took.", becomes:

> One CSV **row** per chronicle, flushed as it lands: the cell and the seed, the ending or the stop with its cause and the turn it came on, the influence the ending paid, the capstone drawn and the turn it lands on; the city as the chronicle ended, its stocks, its population, the tiles it holds, the neutral's population, and the units standing, by faction and kind; the units killed, by faction and kind, the cards played with their count and the cards left in the piles never played, every deal with the entry taken and its turn, every achievement's count and the turn it was reached, and the time the chronicle took. A row holds one value per column for what every chronicle of the cell has, and one cell listing what varies by seed.

The rest of the paragraph stands.

The header, in order, the ten columns standing today first:

```
age,region,civilization,learned,persona,seed,ending,cause,turn,ms,
influence,capstone,capstone-turn,
food,production,military,money,science,culture,population,held,neutral-population,
units:player,units:enemy,units:neutral,killed:player,killed:enemy,killed:neutral,
played,unplayed,deals,
count:<id>,reached:<id> — one pair per achievement of the chronicle's row, in its order
```

On one line in the file; the breaks above are for reading. The columns:

- `influence`: the whole influence the ending paid into the campaign, achievements and influence cards kept together; empty on a stop, which pays nothing.
- `capstone`: the id of the capstone the timeline drew; `capstone-turn`: the turn it lands on. Both read on every row, the chronicle ended before it or not.
- `food` … `culture`, `population`, `held`: the player's city's six stocks, its population and the count of tiles it holds, on the chronicle the ending or the stop left.
- `neutral-population`: the neutral's city's population on that chronicle; empty where it has fallen or the region deals none.
- `units:<faction>`: the units of that faction standing at the end, by kind with their count, `warrior:2 archer:1`; empty where none stands.
- `killed:<faction>`: the units of that faction killed over the chronicle, by kind with their count, in the same shape; empty where none was.
- `played`: every card played, by id with its count, `gather:7 hunt:2 worker:1`, in the order first played; the settle phase's play counts.
- `unplayed`: the ids of the cards in the piles at the end that no play played, each once, in the piles' order, the draw pile, the hand, the discard pile, the exhaust pile.
- `deals`: every deal taken, `turn:event>answer` for an event and `turn:building>reward` for a capture, in the order taken, the turn being the chronicle's when the take landed.
- `count:<id>`: the achievement's count on the chronicle at the end; `reached:<id>`: the turn it was reached, empty where it was not. The achievements are the chronicle's row, the age's whose technology the campaign has not learned, in the order the age declares them, the same on every seed of the cell.

A cell listing several entries separates them with one space and puts a colon between a name and its number, as `learned` separates its technologies; the `deals` cell puts `>` between the deal and the entry taken. No id holds a comma or a space.

`.claude/skills/sim/SKILL.md`, _Procedure_, step 3, becomes:

> 3. **Report what the rows say, counted**: the endings and their causes, the turns, the stops with their seeds; the achievements reached and on which turns, the influence paid, the stocks and population the city ended on, the cards never played, the deals' entries taken, the units killed. Then stop.

No player-facing sentence: the tool is read in a terminal.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

- In: every column above; the header built from the cell before the first row, the achievements' pairs from the chronicle's row, which is the same on every seed; every reading made as each command lands, off its stages and the chronicles it started on and left, never by replaying the seed; a stop's row reading everything off the chronicle the stop left, `influence` alone empty; the `sim` skill's step 3 as written above; the test on the fixture extended to the new columns, and the process test's header assertion updated to the new header.
- The readings, each through the standing door the reconcile chose: the influence through the rules' payment of an ended chronicle into the cell's campaign; the plays through the stage tree's own reading of `played` groups; a deal's entry through the schedule's listing of a deal's entries, indexed by the landed take's place, the deal being the one standing first on the chronicle the command started on; the never-played through the rules' listing of every card in the piles; an achievement's count through the rules' count of a chronicle's achievement; the turn reached off the chronicle a command left, where the achievement's flag flipped between the chronicle the command started on and the one it left, the launch's own `reached` on turn 0; the units killed off every `killed` change, the unit being the one on the change's tile in the chronicle the change carries as its before, with its faction and kind.
- Out: the stocks at fixed turns or at the capstone's landing, an idea; the relations; any column of the balance file's own, which the general columns answer; the fold, the goal, the deck's edits; the trace, which prints as it does today.
- Reconcile: the influence paid, the plays, a deal's entries, the cards in the piles and an achievement's count go through the standing doors as they are. The units killed go through the stage's before, which the line ahead of this one puts on every change; no walk of the stages with a before of the row's own, and no diff of the unit rows.

**Traps:**

- The line ahead, the change carrying the chronicle before, has shipped before this one is taken: `src/rules/stages.ts` gives every change and group the chronicle it was raised on. The `killed` change carries its tile; the unit killed is the one standing on that tile in the change's before, `unitAt` in `src/rules/units.ts`; its kind is `stats.type`, its faction `faction`. Two sites raise it: `src/rules/cards.ts` where a retiled terrain cannot hold the unit standing on it, `src/rules/schedule.ts` where damage kills.
- `paidInto` in `src/rules/campaign.ts` refuses a chronicle that has not ended, which is why a stop's `influence` is empty, and refuses an achievement reached whose technology the campaign has learned, which the launch rules out: `beginChronicle` in `src/rules/chronicle.ts` names on the chronicle only the achievements of technologies still available. It is pure and leaves the cell's campaign as it is.
- Every `reached` change is raised at the tail of a command, on the chronicle the command leaves, after its tallies, so the turn reached is that chronicle's turn; `beginChronicle` raises the launch's on turn 0. A `reached` change names no achievement: the one reached is read by comparing the `reached` flags before and after.
- `plays` in `src/rules/stages.ts` yields every `played` group of a stage tree with the card's id. The settle card's play on turn 0 is one.
- `offered` in `src/rules/schedule.ts` lists a deal's entries in the order dealt; the take command's `at` indexes it; the deal is `deals[0]` on the chronicle the command started on, since the take removes it. A capture's deal carries the `building` captured, an event's the `event`.
- `cardsInPiles` in `src/rules/state.ts` lists the piles in the order the `unplayed` column wants. `countOn` in `src/rules/chronicle.ts` counts an achievement of the chronicle's row.
- The driver's `playedBy` in `tools/sim-driver.ts` keeps the commands landed with their turn and gambit and nothing of their stages; the readings need each landed command's stages and the chronicles it started on and left, so the driver hands them on or reads as it walks. The trace reads `landed` as it does today and changes not at all.
- `tools/sim.test.ts` reads rows by header name through `rowsOf`, so new columns break none of its tests but the process one, which asserts the header verbatim. The fixture catalogue in `src/rules/fixtures.ts` builds its ages' achievements from `ageOf(CATALOGUE, AGE).achievements` and a victory per age; the ids are the fixture's own, read off it.
- `Resources` in `src/rules/resources.ts` lists the six stocks in the bar's order, the order the header takes.
- `docs/PHASER.md` holds nothing this line needs: no file under `src/ui/` or `e2e/` changes.

**Plan:**

1. `tools/sim-driver.ts` — what a walk answers carries what the row reads off each landed command, the stages and the two chronicles, or the readings themselves; `npm run check` and `npm test` green, the trace unchanged.
2. `tools/sim-body.ts` — the header built from the cell, every column above, the compound cells in `learned`'s shape; `npm run sim -- --seeds 2` on both ages writing rows to the scratchpad, read once by eye for the shape, never committed.
3. `tools/sim.test.ts` — the first test extended: the row's stocks, population, held tiles, neutral population, units, capstone, counts and reached turns equal what the walked chronicle and the rules say; a chronicle with a kill, the fixture a `killed` change is raised on, reads it in `killed:<faction>` by kind; the plays, the unplayed and the deals read on a fixture that deals; the process test's header updated.
4. `docs/SIMULATOR.md` — the sentence above; `.claude/skills/sim/SKILL.md` — step 3 above.
5. `workflow/BOARD.md` — the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Spec: none — the tool never reaches the screen. CI proves on the push nothing this line changes; the suite runs as on every push.
