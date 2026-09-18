# Branch: stage-tree

The board of this branch alone. It holds the design the branch exists to make true, then the lines that make it true, in order; **priority is order, completion is deletion**, exactly as [`BOARD.md`](BOARD.md). Each line ships as a board line does — `/ship` names it from this file — with the same trinity and the same review. The branch merges into `main` when no line is left, and this file goes with the merge. Nothing durable cites it.

## The design

A command resolves through one pure function with two products: the chronicle it leaves, and the flow of changes that led there. The chronicle is what is drawn and what a command's legality is read on. The flow is what listens to it plays — the chronicle screen's animations, a simulator's log — and what a closure may read to branch on what its own helper did. Each entry of the flow carries the chronicle it leaves, so a later chronicle is read off the flow for free; the flow is not read off the chronicles, because it carries what two chronicles cannot say, which tile attacked which.

The flow is a tree of **stages**. A **change** is one row of the chronicle moved: a unit, a tile, the stock, the population, a pile, the turn, the timeline, the deals, the ending. A card carries no identity — eight copies of one sit in a deck — so the piles are the rows, and one movement between them is one change however many cards it carries. A change is named for the fact that moved, its direction and amount read off the chronicles before and after, and it carries only what those cannot say: the tile, the two ends of a crossing. A helper that moves two rows raises two changes — a terraform relayers the tile and kills the unit on it — and a crossing moves one row in two columns, so it is one. A **group** is a name for why, over stages, carrying what the link needs, the attacker and the target. A change says what moved; a group says why. Nothing is dropped, ever: every helper that changes the chronicle answers the changes it raised, none where it moved nothing, and its caller groups them. A command resolves as at least one stage; a refusal is a group holding nothing, since the name is the fact, and so is a capstone whose landing moved nothing.

The change vocabulary, by row:

| Row | Changes |
| --- | --- |
| a unit | `enter`, `move`, `damaged`, `killed`, `refreshed`, `action-spent`, each on its tile |
| a tile | `retiled`, `charted`, `held`, `settled` |
| the stock | `stock`, gains and costs alike |
| the population | `population` for the count, `assigned` for a tile worked or left |
| the piles | `laid`, `drawn`, `discarded`, `recalled`, `shuffled`, and `left` for a card gone from the chronicle |
| the turn and the timeline | `turn`, `rolled` |
| the deals | `dealt`, `taken` |
| the ending | `ended` |
| no row | `runtime-error`, the one change that moves nothing: a helper the content should never have called, followed through as the change saying so |

The groups: `played` over the card leaving the hand, `discarded` or `left`, then the cost as one `stock`, absent where the card is free, then the effect's changes; one `strike` per hazard in hand order, carrying the hazard's card, over what its strike raised; `income` over one `stock` per tile worked; `grow`; `turn` over the tick and one `refreshed` per unit; `enemy-phase` over each enemy's `move` and its `attack` groups, an `attack` carrying attacker and target over the action spent and the target damaged; `camp-capture`; `capstone`; `deal`; `answer`; `reward`; `claim`; `refused` holding nothing. `no-deal` is gone: it is a `rolled` with nothing dealt after it. The fall is an `ended` on the first change that leaves the population at nought, and nothing after it is computed. The sight's charting rides on every change, as it does on every stage today: it is derived.

`held` names the tile's holder moving, whoever holds it after; the name covers a tile lost or a neutral's claim the day such a rule exists, and nothing widens for it now. A name for the player's act — `claimed` — would need a twin that day and is not used.

The one claim the design leaves unverified: the sight's charting runs once per change, so a tick over twenty units becomes twenty passes where it was one. Each pass is small; it is measured on the line that lands it, not assumed.

## Lines

- **The stage tree stands** — `apply` answers a tree of stages, the one stage type a change or a group over stages, the chronicle screen plays it through one walk in order, and every stage of today is sorted into a change or a group holding nothing, the play-out unchanged to the eye. Doc-impact: none. [board/stage-tree-stands.md](board/stage-tree-stands.md)
- **Every helper answers its changes** — every rules helper that changes the chronicle answers the changes it raised and every closure content composes them into does the same, the pairs that answer a bare chronicle beside a landing (`gained` and `stockGained`, `terraformed` and `terraformedOn`) become one helper each, and a card play and a hazard's strike group what their effect and their strike raised, one `strike` per hazard. Doc-impact: none. [board/every-helper-answers-its-changes.md](board/every-helper-answers-its-changes.md)
- **The cycle is groups over changes** — the end of turn, the take, the city's acts and the unit's commands resolve as groups over the changes they make, income per tile, the tick per unit, each enemy's blow an `attack` over its two changes, `no-deal` a bare `rolled`; and the fall is taken on the first change that leaves the population at nought, so nothing after it is computed and the guard in `grow` goes. The design's group list holds `claim` and no `assign`, while this line says the city's acts resolve as groups: whether an assign is a bare `assigned` change and a reassign two of them is settled at this line's intake, and the design section is made to say it.
