# Departure leaves the Nomadic Age

**Line:** **Departure leaves the Nomadic Age** — the Nomadic schedule deals four events and never Departure, the Stone schedule deals the four and Departure at today's weights and price, the event's name, answers and lore standing as they are; the catalogue's coherence test lands Departure's answers on a Stone chronicle alone, and the two age pages say so. Doc-impact: `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Spec:**

- `docs/ages/NOMADIC.md` _The events_, first paragraph. The whole paragraph becomes:

  > Four events, each with its lore, each a problem the chronicle deals with two answers, one of them open to a city with nothing. The escalation is the event's, whichever answer is chosen: a later Lean season adds a Hunger that takes more, a later rival band is larger either way, and Wildfire weighs nothing early.

  The bullet "**Departure.** _Let them go_: one population leaves the player's city, its last no exception. _Keep them_: culture paid, more the larger the player's city." is deleted.

  The closing sentence "Lean season is food against a raid, a rival band is a raid now against a camp later, Wildfire is production against the map, Departure is culture against population." becomes:

  > Lean season is food against a raid, a rival band is a raid now against a camp later, and Wildfire is production against the map.

- `docs/ages/STONE.md` _The events_. The paragraph stays as it is; after it, one bullet:

  > - **Departure.** _Let them go_: one population leaves the player's city, its last no exception. _Keep them_: culture paid, more the larger the player's city. The event is dearer the larger that city: the population that leaves dearer to grow back, the one kept dearer in culture. Departure is culture against population.

- No player-facing text changes: `event.departure`, `answer.let-them-go`, `answer-rules.let-them-go`, `answer.keep-them`, `answer-rules.keep-them` in `src/ui/text.ts` and `event.departure` in `src/ui/lore.ts` stand as they are, read by the Stone Age.
- `CHANGELOG.md`'s Departure sentence is history and stays.

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Scope:**

- In: the entry `departure` off the Nomadic schedule; the Stone schedule's entries its own, the four Nomadic entries and `departure` at a weight of 1 on every turn, as today; the event's definition moved to the Stone slice's tables, so the Nomadic module holds nothing it never deals; the two page edits.
- Out: the Nomadic weights, which stay as they are — the first Nomadic deal, on turn 6 to 9, is now Lean season three times in four and the herd once, the user's call, tuned at the balance pass; _Keep them_'s price, culture equal to the population, and the Stone weights, both the transition line's; any text, lore or screen change; the Stone region split, the region's schedule line's; saves and campaigns, which need no care before the Bronze Age ends — a Nomadic save stopped on a Departure deal names an event the catalogue still holds and replays.
- Corner cases decided here: none the agreed design did not foresee — the Stone schedule's spacing and window stay; the Nomadic schedule with four entries still deals one on every due turn, Lean season weighing 1 on every turn with no need.
- Reconcile: nothing standing does the job twice — the Stone schedule reusing the Nomadic entries by reference is the one thing the line reshapes, into entries of its own.

**Traps:**

- `src/content/stone.ts` names its schedule `entries: schedule.entries`, the Nomadic object by reference; the line is where that stops. The Stone slice brings no `events` table today; the Nomadic `events` table sits inside `TABLES` in `src/content/nomadic.ts`, under `brings`.
- `merged` in `src/rules/catalogue.ts` refuses an id two slices bring to one table: Departure moves, never copies. `populationTaken` (`src/rules/city.ts`) and `unchanged` (`src/rules/stages.ts`) go with it where `stone.ts` does not import them yet.
- `src/content/catalogue.test.ts` walks every age's schedule entries twice — the answers' rules entries at the names they read, and every answer costed, read, faced and landed on a chronicle settled in the age — so Departure's answers run on a Stone chronicle only after the line; `answer-rules.keep-them` reads `{culture}` from the population, which a settled Stone chronicle has.
- `e2e/chronicle-screen.ts`'s `firstDealt`, `leanSeason` and `e2e/deal.spec.ts`'s `unpaid` search Nomadic seeds for a first deal; the specs read the event dealt and its answers off the rules, so a seed shifting asserts nothing new; a search that finds no seed is a finding, reported, never a widened search.
- No UI file changes: `docs/PHASER.md` is not needed.
- Comments are for traps only; the event's definition carries none.

**Plan:**

1. `src/content/nomadic.ts`, `src/content/stone.ts`: the `departure` entry off the Nomadic schedule and the event's definition out of the Nomadic tables; the Stone schedule's entries its own, the Nomadic four spread and `departure` at `() => 1`; the Stone slice bringing the `events` table holding Departure as it stood. `npm test`: the catalogue's coherence tests pass with Departure's answers landed on the Stone chronicle alone.
2. `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`: the sentences above, verbatim. `npm run fmt`.
3. `workflow/BOARD.md`: the line deleted, this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — no spec opens on a Stone deal, and the coherence test is the proof. CI proves on the push: `deal`, `reference`, `hover`, `resume`, `fall`, `menu`, `broken-motion`, `boot`, `capstone` and the rest of the suite.
