# Playing bread on the builder persona

**Line:** Playing bread on the builder persona — the builder's ladder holds, right after its gain at nothing, a gambit playing at nothing a card whose trial raises a resource the income gives less of than each resource the card costs, proven on the fixture, `docs/SIMULATOR.md` saying so, and the builder plays Bread on the end-of-Stone deck in 20 of 20 seeds of the economy free play, measured in the scratchpad against the baseline left as it stands.

**Spec:** `docs/SIMULATOR.md` _The persona and the gambit_. The gambit's sentence, as `--personas` prints it: "Play a card aimed at nothing whose trial raises a resource the income gives less of than each resource the card costs". The builder's paragraph takes one clause, after "places what it holds and gathers where it stands, never spoiling a tile,": "plays at nothing what raises its stocks and what turns a resource the income gives more of into one it gives less of,". The warlord's paragraph is unchanged. No player-facing text.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

- In: one gambit on the builder's ladder, its own number, placed right after the gain at nothing (the builder's 25th today) and before the discard of a striking card; its test on the fixture; the page clause; the measurement.
- Out: the warlord's ladder, unchanged, though it never plays Bread either; the card Bread and every other piece of content; the baseline under `workflow/economy/` and `workflow/ECONOMY.md`, both left exactly as committed, the user replacing them in a session of their own after the ship.
- The reconcile: the gain at nothing and this gambit stay two gambits, each with its own number, so `--without` leaves either out alone and the trace names which fired; the walk they share over the hand's cards aimed at nothing, playable, trialled, lives in one place, which is the implementer's.
- The income is what the income step would add to the player's stocks on the chronicle the decision stands on, read through the rules' own income, tile by tile as the end of turn runs it; the strikes a hazard in hand would take, which the resource bar's reckoning subtracts, are left out of it.
- "Less of" is strictly less: a resource the income gives as much of as one the card costs does not qualify. A card raising several resources qualifies when any one it raises reads less than every resource it costs. A card costing nothing qualifies by having no resource to compare; the gain gambit ahead takes those already, so nothing changes for them.
- As the gain gambit does, the walk passes a hazard and a card the refusal holds back, and reads nothing of a trial that drew from the chronicle's generator; candidates come in hand order.
- Measured at intake on the builder's end-of-Stone cell, seeds 1 to 20, the cell of `workflow/ECONOMY.md`: Bread played in 20 of 20 chronicles, a median of 10 times; tiles held 10 to 11, population 19 to 21, production 228 to 259 at the medians of the turn-60 row; the two trades and the trophies qualify too and were played before, so nothing else moved. The ship's measurement is expected to match.

**Traps:**

- The sim tests read a persona's gambit by its number, `answerOf(persona, number, chronicle)` in `tools/sim.test.ts`: the builder's 26 and 27 (the striking discard, the hand cycle) become 27 and 28 and the warlord's numbers stay; the `--personas` test counting the goal gambits as the 5th to 9th of both is unchanged.
- No fixture card costs one resource to gain another at par: one is added to `src/rules/fixtures.ts`, where the catalogue's coherence test reads it. The fixture's `urban` terrain yields one of every resource but food, and `glade` yields food alone: the test's city must hold tiles that make its food income beat its culture income for the play, and a second fixture shows the tie, and the reverse conversion, not played.
- `trial` in `tools/builder.ts` answers nothing for a command whose chronicle drew from the generator; the gain gambit is the precedent for the walk's shape.
- With the events off, the sites still deal their trophies, which cost nothing and raise culture: the measurement sees them played, as the baseline does.
- The card's cost is read off the catalogue's card, never off the trial: the trial shows what was paid and gained together.
- `docs/SIMULATOR.md` is a tool page; a paragraph is one line, never hard-wrapped, and `npm run lint` checks it.

**Plan:**

1. `src/rules/fixtures.ts`: the fixture card that costs one resource and gains another at par stands in the fixture catalogue, inert.
2. `tools/builder.ts`: the gambit stands on the builder's ladder right after the gain at nothing, the shared walk over the hand in one place; the warlord's ladder untouched.
3. `tools/sim.test.ts`: the gambit's test, the renumbered sentences holding.
4. `docs/SIMULATOR.md`: the builder's clause.
5. The measurement: the builder's end-of-Stone cell as `workflow/ECONOMY.md` names it, seeds 1 to 20 split five at a time, into the scratchpad; the cards played and the ending rows joined to `workflow/economy/builder-stone-end/` seed by seed through the page's recipes; the report carries Bread's chronicles and median plays and the movement of tiles held, population and production. Nothing under `workflow/economy/` and nothing in `workflow/ECONOMY.md` changes.
6. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: none, the line never reaches the screen. CI's specs on the push: none walk a changed path; the suite runs as it does on every push.
