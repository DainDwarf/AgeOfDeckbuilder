# Departure

**Line:** **Departure** — the nomadic schedule deals Departure from the first deal, with no need: _Let them go_ takes one population from the city, an idle one first and the last assigned else, the city's last no exception; _Keep them_ costs culture, as much as the city has population. Hunger's strike empties a food stock that cannot cover it and kills one population by the same helper. A city left without population falls on the spot, nothing of the command resolving after it. `npm test`, `npm run check` and `npm run lint` pass.

**Spec:**

[`docs/ages/NOMADIC.md`](../docs/ages/NOMADIC.md) → _The events_:

- The intro's second sentence becomes: "The escalation is the event's, whichever answer is taken: a later rival band is larger either way, Wildfire weighs nothing early, and Departure is dearer the larger the city — the population that leaves dearer to grow back, the one kept dearer in culture."
- Lean season's _Share_ becomes: "_Share_: the hazard **Hunger** is laid on the draw pile; it strikes the food stock while it stays in the hand, empties a stock that cannot cover the strike and kills one population then, the city's last no exception, and costs production to be rid of."
- Departure's line becomes: "**Departure.** _Let them go_: one population leaves the city, an idle one first and the last assigned else, the city's last no exception. _Keep them_: culture paid, more the larger the city."

[`docs/CHRONICLE.md`](../docs/CHRONICLE.md):

- _Population_: the sentence "Nobody eats and nobody starves." is deleted; the two rejections after it stay word for word.
- _Units and combat_, the **Defeat is capture** bullet: "Population reaching zero is the other defeat." becomes "Population reaching zero is the other defeat, and the city falls on the spot: nothing resolves after it."

[`docs/GLOSSARY.md`](../docs/GLOSSARY.md), the **killed** row: "or to one population an event kills" becomes "or to one population an event or a hazard's strike kills".

Text-table entries, all of them (`src/ui/text.ts`):

- `rules.hunger`: `Takes food. If not enough food, population starves` — the user's own words, verbatim; that a hazard strikes while in the hand is the kind's and stands on no card.
- `event.departure`: `Departure`
- `answer.let-them-go`: `Let them go` — `answer-rules.let-them-go`: `One population leaves the city, idle first`
- `answer.keep-them`: `Keep them` — `answer-rules.keep-them`: `They stay`

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the helper that takes one population; the helper a hazard's strike composes, shocking a stock and taking one population when the stock cannot cover the amount; the fall on the spot; the event `departure` with its answers `let-them-go` and `keep-them` and its schedule entry; Hunger's new strike and text; the fixture content and the mechanism tests below; the docs edits.
- Out: the stand-in's `PH_Hunger` and the fixture's `PH_Hunger` stay plain shocks — `shocked` keeps its rule and its tests. No animation of who left (that is the _Event animations_ line). No new glossary term: Departure _takes_ one population (`CHRONICLE.md`: "take or kill population"), Hunger _kills_ one, and the state change is the same.
- Decided: "cannot cover" is a stock below the strike. A stock equal to it is emptied and nobody is killed.
- Decided: a short stock is emptied **and** one population is killed — both, never either.
- Decided: both Departure and Hunger take the city's last, and the city falls by population. Departure therefore always does something and names no need; it weighs 1 on every turn, like Lean season.
- Decided: "the last assigned" is the last entry of the chronicle's assigned tiles — every writer appends, so it is the population most recently put on a tile, by an assign, a drag or a claim. Nothing on screen says so; the player learns it.
- Decided: _Keep them_'s cost is the population, read on the chronicle as it stands (`{ culture: population }`). _Let them go_ is the flat free answer. Hunger's strike keeps its number, `2 + floor(turn / 10)`, and its production cost.
- Decided here, not foreseen by the line — **report it in the hand-back**: today a city left without population falls on the _last_ stage of the command, so a Hunger killing the last at the strike would still play out the discard, the income, the enemy phase, the tick, even a victory if the shelter stood. The fall moves to the first stage that leaves a standing city without population, and the stages after it are dropped, for every command alike. A test asserting the fall on a later stage follows this rule; that is the design change, not a weakened test.

**Traps:**

- This line ships after _An answer's cost reads the chronicle_: `keep-them`'s cost is a reading, in whatever shape that line gave it. If the board still holds that line, stop and say so.
- The order of the assigned tiles is now a rule. `assign`, `reassign`, `bordered` and `settled` append, `populationKilled` filters in order; the helper reads the last entry. The one comment this line earns is on that field in `src/rules/state.ts`: its order is the order assigned.
- The strike runs first in the end of turn, before the discard and the income: the stock it reads is the stock the player ended on.
- `grow` guards a threshold of nothing; do not lean on it — the fall on the spot is what keeps a city of nobody from resolving anything.
- An answer's id is unique across every event of a catalogue; `let-them-go` and `keep-them` are free.
- The glossary hook reads the text table; "starves" and "leaves" are no forbidden synonym. If it flags the user's Hunger sentence, report it, never reword it.
- Tests build the "last assigned" by the real assign command, never by writing the array.
- Comments are for traps only: no docblock retelling a signature.

**Plan:**

1. `src/rules/chronicle.ts` — `resolved` owns the fall: the first stage leaving a standing city without population becomes the fall and ends the list.
2. `src/rules/schedule.ts`, beside `populationKilled` — the helper taking one population: the population one fewer, an idle one where one is idle, else the last assigned tile unassigned; and the helper a strike composes: the stock shocked, and one population taken where the stock stood below the amount. `src/rules/state.ts` — the trap comment on the assigned tiles' order.
3. `src/rules/fixtures.ts` — one fixture answer landing the first helper (on an event already there or one of its own), and one fixture hazard striking through the second on a number of the fixture's own; `PH_Hunger` untouched.
4. Tests, mechanism only, on the fixture: in `src/rules/schedule.test.ts`, the answer taken through `apply` — an idle population goes first and no tile is unassigned; with none idle the tile assigned last, by the assign command, is the one unassigned; a city of one falls by population at the take, its stages ending there. In `src/rules/cards.test.ts`, the fixture hazard at the end of turn — a stock equal to the strike is emptied and nobody killed; a stock below it is emptied and the population one fewer; a city of one falls at the strike, and no stage follows it.
5. `src/content/nomadic.ts` — Hunger's strike through the second helper; the event `departure`; its entry in the nomadic schedule. `src/ui/text.ts` — the entries above. The content gets the coherence checks it already has by being in the catalogue, and no gameplay test.
6. The docs edits above; the board line and this file deleted.

The helpers, the fall and their tests may land as an inert commit ahead of the content, as `DOGMAS.md` → _Git_ has it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No Playwright spec: nothing on screen changes but text-table entries, and no spec plays the nomadic schedule.
