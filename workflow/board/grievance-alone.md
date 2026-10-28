# The grievance alone

**Line:** The grievance alone — the Tribute takes food and production alone, two of each at its first strike and two more of each at every strike after, no money; the Stone whole-game baseline rerun on it and its six Stone folders replaced, the events workfile's reading rewritten off the new rows. Doc-impact: `docs/ages/STONE.md`.

**Spec:** `docs/ages/STONE.md` _The events_, the grievance bullet; `docs/CHRONICLE.md` _Cards_ for what a challenge's strike is and _The player's city_ for the stock rule a strike's shortfall pays under; `workflow/EVENTS.md` for the cells and what the baseline holds.

The grievance bullet's Pay tribute sentence becomes:

> _Pay tribute_: the challenge **Tribute** is added to the discard pile; played by nothing, at the end of every turn it stays in the hand it takes food and production, each more than the strike before, and it gains influence on victory.

The rest of the bullet stands as written, its closing line included: "A grievance is the peace against a tribute over time for influence against culture now."

The numbers, in `src/content/stone.ts`: the Tribute's counters start at 2 food and 2 production, and each strike raises each counter by its start, as today; the money counter goes.

The player-facing entries, in `src/ui/text.ts`:

- `rules.tribute`: `Takes {food}[food] and {production}[production], more each time`
- `answer-rules.pay-tribute`: `Add [card:tribute] to the discard pile. Each turn it stays in your hand, it takes {food}[food] and {production}[production], more each time`

The lore entry stands: it names amends, not money.

**Doc-impact:** `docs/ages/STONE.md` — the sentence above. `workflow/EVENTS.md` is ephemeral and is edited, not doc-impact: _What the whole game says_ is remeasured, see Scope.

**Scope:**

In:

- The Tribute's counters lose money; nothing else about the card changes: a challenge, played by nothing, its influence as today, each strike raising each counter by its start.
- The two text entries above.
- The page sentence above.
- The Stone whole-game baseline rerun on the shipped code and its six Stone folders under `workflow/events/` replaced, `builder-nomadic`, `builder-stone-end`, `builder-stone-no-scouts`, `warlord-nomadic`, `warlord-stone-end`, `warlord-stone-no-scouts`, the cell as `workflow/EVENTS.md` _The whole game_ gives it; the two `-nomadic-age` folders stand. The workfile says to rerun the baseline when a change moves it on purpose, and this one does.
- `workflow/EVENTS.md` _What the whole game says_ rewritten off the new rows: the date and commit sentence, the table of endings per cell, the paragraph against the camps baseline, and the suspects: the grievance's bullet deleted, since the line settled it, and the Flood's and Wildfire's bullets reread off the new rows, their numbers and nothing else; the closing sentence on the events never last before a fall reread too. The workfile holds the suspects and the table, not every reading.

Out:

- Send gifts' price, Escalate, the deal's turn and the schedule's spacing: measured at intake and left as they are. Send gifts is unaffordable on every first deal of the alone cell, 7 culture asked on turns 5 to 9 against 1 to 2 held, and the user chose to balance the Tribute alone.
- The personas' deal gambit, which takes Pay tribute as the first answer not refused whenever Send gifts is unaffordable: unchanged.
- The stock rule, one population per stock taken past nothing: unchanged. The money strike on a city with no money was the whole of the early fall, and taking the money out is the fix the user chose.
- The alone cells are not committed: `workflow/EVENTS.md` _One event alone_ says they run into the scratchpad.

Measured at intake, the user's pick among three forms (today's 2 food, 2 production, 1 money rising; the same fixed; 2 food and 2 production rising; 2 food and 2 production fixed), on the alone cell and then on the whole game:

- Alone, both personas, Pay tribute fixed, 40 chronicles a form: today 38 population falls, median turn 21; the chosen form 34 population falls and 6 captures, median turn 31. Fixing the counters while keeping the money changed nothing: the first deal lands on turn 5 to 8 on a city of 2 holding no money, and six chronicles fell on turn 9 to the first Tribute alone.
- Whole game, 120 chronicles a form, the 60 that took Pay tribute the same seeds under every form: today 43 population falls, 30 captures, 12 removals, 8 victories, 26 stood to the cap; the chosen form 34, 34, 13, 8, 31. Of the 36 population falls after a Pay tribute, 27 still fall to population a median 8 turns later, 4 become captures, 3 stand to the cap, 1 wins, 1 becomes the Flood's removal.

Corner cases decided here:

- A save written before this change holds a Tribute with a money counter: no care, as every pre-Bronze save; the card strikes at the counters it carries, and its face reads them.
- The culture-only form of the gifts and a Tribute scaled by the turn were not tried: the user named the three forms, and the rising-per-strike shape is the card's own.

Reconcile: no other card of the catalogue takes several stocks rising per strike, the monument's hazards taking one flat each and the other challenges killing, removing or drying; the Tribute keeps its own strike with two counters, nothing to reshape.

**Traps:**

- The rules entries read the counters by name, and the catalogue coherence test renders every card's rules entry at the counters it starts with, so `{money}` must leave both entries with the counter or `npm test` fails at the catalogue.
- `e2e/grievance.spec.ts` reads every answer's face off the rules through `answerFace`, so the new entry proves itself there with no edit to the spec.
- `TRIBUTE` is read twice in `src/content/stone.ts`: the card's `counters` and the answer's `reads`; one constant serves both, and `costsOf` walks whatever it holds, so the strike needs no edit.
- The baseline split is `workflow/ECONOMY.md`'s with no `--off`, as `workflow/EVENTS.md` _The whole game_ says: `--age stone --region temperate --every 1`, `--persona` each, the decks' flags after the cell, seeds 1 to 20 in parts of five, eight processes at a time. Twelve such cells took 843 s at this intake, so six take about 7 minutes; run in the background.
- The rows' first line holds the cell, and the join to the old rows is by seed; the old folders are replaced whole, never merged.
- The sim skill's queries are the recipes for the workfile's table: the endings per cell with `WHERE ending IS NOT NULL`, the deals cut with `deals LIKE '%pay-tribute%'`, and the last deal before a fall off the `deals` listing's turns.

**Plan:**

1. `src/content/stone.ts`: the money leaves the Tribute's counters.
2. `src/ui/text.ts`: the two entries.
3. `docs/ages/STONE.md`: the sentence.
4. `npm run check`, `npm test`, `npm run lint`.
5. The baseline: the six Stone cells rerun in the background into `workflow/events/`, the old folders replaced.
6. `workflow/EVENTS.md` _What the whole game says_ rewritten off the new rows.
7. `workflow/BOARD.md`: the line deleted. One commit: the content, the page, the rows, the workfile.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: `e2e/grievance.spec.ts`. CI proves on the push the whole suite, `e2e/grievance.spec.ts` among it.
