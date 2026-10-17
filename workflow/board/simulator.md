# The headless simulator's shape

The shape the simulator rung was settled on in discussion, before its cut. The cut reads this page and the lines' dossiers carry their contracts; what every line shares stays here, and the page is deleted with the rung's last line. Where the simulator is documented for good is a line's own doc-impact.

## What it is

A consumer of `src/rules/` through its public API, `apply` in a loop keeping the last stage's state and reading the flow for what happened; no hook, field or flag lands in the rules or the content for it. It runs only when asked, from the terminal, and reports numbers, never a diagnosis: the row says what happened, the reading of why is the user's. Nothing of it runs on CI and no measurement is committed to the repository.

It is not a player made of search. No within-turn search, no beam, no lookahead over turns, no value model over the map, no oracle of any kind. A turn here offers far more orderings than a search can keep, and a value model is the thing that went blind in the previous project.

## The persona and the gambit

A **persona** is a stance a player could hold, written as an ordered list of **gambits**. A gambit is one condition and one command: read top down on every decision, the first gambit whose condition holds answers the command, the driver sends it through `apply`, re-reads the chronicle, and starts again from the top; the persona's last gambit ends the turn. A command refused or changing nothing is dropped and the walk goes on; a turn caps the commands it takes.

A gambit reads the chronicle the way the screen does and never opens a closure: it asks the rules' own question functions, or plays a candidate command on the chronicle and reads the one it leaves, the game being pure. A trial whose chronicle carries another generator than the one it started on drew from it, which the player could not see, and the gambit reads nothing of that trial. A gambit weighs candidates one ply deep and no further. The one currency a gambit may sum is a tile's yield, every resource together, as the neutral's script sums it.

No gambit names a card, a building, an event or a capstone: it reads kinds, aims, costs, blocks, yields, counts. A persona plays with the player's knowledge, the charted tiles and what is in sight, and reads the whole map nowhere. Personas are lists in code, and a persona may be printed as its sentences. Every choice a gambit makes is deterministic on the seed: ties fall in tile order, and a gambit that draws draws from a generator seeded from the chronicle's seed, never from the chronicle's own.

The question functions a gambit asks, each the one the screen asks too:

| Question | Function |
| --- | --- |
| Whether a card can be played, and what stops it | `refusalOf` |
| Which tiles its aim admits, which unit it goes through | `admitted`, `playedThrough` |
| What an answer costs on this chronicle, and whether it is refused | `answerCost`, `answerRefusal` |
| Which case an answer names | `answerCase` |
| What ending the turn now would take and give | `reckoned` |
| Where a unit can land, whom it can attack | `byHand` |
| Which tiles the city may claim, what a claim costs | `claimable`, `tileCost` |
| A tile's yield with the capstone's rule laid over it | `tileYield` |
| An achievement's count toward its need | `countOn` |

A reserve a gambit keeps is derived, never a constant: the dearest a card in hand or an answer the region's schedule could deal asks of that resource on this chronicle.

## The personas to start with

A bracket of stances, each readable, none tuned toward optimal play:

- **Idle**: settles and ends turns, taking the first entry of every deal. The floor, and what the neutral's measurements already used.
- **Builder**: works the land and the border; its gambits are served one at a time at the cut, as sentences to strike.
- **Warlord**: fields units and goes for the camps.

One gambit sits on top of any persona when asked, `--goal <technology>`: among the commands the persona would take, prefer the one that raises that achievement's count. It answers whether a player going for a goal reaches it, and on which turn.

Where a persona is plainly wrong in one spot, the trace shows it and the user decides whether that is the persona's defect or the content's lesson. A second stance is a second persona, never a knob that makes the first optimal.

## The row, the fold, the trace

One CSV row per chronicle, flushed as it lands, holding: the cell and the seed; the ending and its turn, running where the cap was reached; each stock at fixed turns and its peak; population, tiles held, units fielded and lost; the cards played by id and the cards never played; every deal with the answer taken and whether each other answer was affordable; every achievement's count at the end and the turn it was reached; the capstone drawn and its turn; the enemies killed and the population the strikes took; the time the chronicle took.

A separate fold turns a file of rows into tables, and compares two files seed by seed where their cells pair. Seeds pair across cells: seed _n_ is the same map and timeline under every persona and deck, so a comparison is a per-seed diff. One seed replays with a per-turn trace that names the gambit behind every command. A knob sweep takes a list of values and emits one cell per value; an ablation switches one gambit off at a time and emits one cell per gambit.

## The cells

A cell is an age, a region, a campaign and the civilization launched on it, a persona and a seed count. The campaign is built through the rules, a technology learned with its needs, copies bought and the deck edited, as the forge builds one; a deck file or flags name the edits. The chronicle runs to its ending or to a turn cap, since the schedule has no last turn.

## Where it lives and what it costs

A CLI under `tools/`, loaded through Vite's module runner as the forge is, its modules beside it, its tests Vitest on the fixture catalogue; `npm run sim` measures and a second verb folds. The first sweep is `BALANCE.md`'s entries, each a column.

Measured 2026-10-17, the idle persona on the Stone Age's temperate region over 20 seeds: a launch 16 ms; an end of turn with its deals 10 ms at the median and 31 at the ninetieth percentile; the legality of a whole hand 1 ms; the idle city falls at median turn 14. The estimate, unmeasured: a builder weighing fifty candidates a turn costs a few seconds a chronicle, under two minutes for a hundred seeds once split across processes. The reachability cache and the end of turn's cost are looked at after a profile of the builder's sweep, never before.

## What it will not do

It separates decks that differ in kind and reports how a deck fares as distributions of endings, failure modes and goals reached. It does not rank decks that differ by a copy or two: at a hundred seeds a rate carries about ten points of binomial error, the map and the timeline vary with the seed, and a persona plays a deck its own way. An optimiser over gambits and knobs is an idea for the demo's balance pass, as an exploit finder, not a line of this rung.

## Parked for the cut

- The builder's and the warlord's gambit sentences.
- The turn cap, and the floor of population a unit card leaves.
- How a sweep splits across processes, and the row's exact columns.
- A persona file the CLI reads, only once a persona is wanted that no list in code holds.
