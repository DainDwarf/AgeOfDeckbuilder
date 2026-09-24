# Hunger is forged by its event

**Line:** - **Hunger is forged by its event** — Lean season lays Hunger with its food counter set by the turn, larger later, at one flat price to be rid of; the face reads the counter, the strike reads nothing off the turn, and the answer's name shows the Hunger as it will be laid, with the Nomadic, chronicle and interface pages saying so. Doc-impact: `docs/ages/NOMADIC.md`, `docs/CHRONICLE.md`, `docs/INTERFACE.md`.

Ships after **Cards carry counters**, whose dossier it builds on: the instance, the maker that sets declared counters, the strike handed a lookup of its counters, the face filled from the counters.

**Spec:** the three pages and the two player-facing sentences, written out.

- `docs/ages/NOMADIC.md`, _The events_, the escalation sentence: "The escalation is the event's, whichever answer is chosen: a later Lean season lays a Hunger that takes more, a later rival band is larger either way, Wildfire weighs nothing early, and Departure is dearer the larger the city — the population that leaves dearer to grow back, the one kept dearer in culture."
- `docs/ages/NOMADIC.md`, the Lean season bullet, its _Share food_ half: "_Share food_: the hazard **Hunger** is laid on the draw pile, its counter set to the food it takes, more on a later turn; it strikes the food stock for that amount while it stays in the hand, empties a stock that cannot cover the strike and kills one population then, the city's last no exception, and costs production to be rid of, the same whatever it takes. The answer names the Hunger as it will lay it and says what it takes. A price rising with the strike was rejected: the strike growing already tilts the choice toward paying, and a late Hunger a small city could not shed is a second escalation on the same event."
- `docs/CHRONICLE.md`, _The schedule_, after "An answer's cost may read the chronicle: the deal shows it as the chronicle stands, and the choice pays that.": "An answer's reading is what its card says of this turn, and a card the answer names is shown as the answer will lay it: made at the counters the reading hands under the names that card declares."
- `docs/INTERFACE.md`, _The presses_, the sentence the counters line adds, "a card named is shown as its content makes it, at the counters it starts with", continued: "; on an answer's card, at the counters the answer's reading hands under the names the card declares — the card as the answer will lay it".
- The Hunger face, `rules.hunger`, filled from its counter: `Takes {food}[food]. Not enough food kills one population`
- The Share food answer, `answer-rules.share`, filled from its reading: `Put [card:hunger] on top of the draw pile. It takes {food} [food]`

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/CHRONICLE.md`, `docs/INTERFACE.md`.

**Scope:**

- In: Hunger declares one counter, `food`, starting at the amount of the earliest turns; its strike takes that counter off the food stock and kills one population where the stock fell short, and reads the turn nowhere. Lean season's _Share food_ reads the food of the turn and lays Hunger with its counter set to it; the reading and the laying take the number from one function of the content, so the deal never says one amount and lays another. The formula is today's, two and one more for every ten turns, a tuning number that stands in the content and on no page; it has no cap, since a counter takes any number. The price to be rid of Hunger stays one flat production cost. The mechanism: a card named on an answer's card is shown, small at a rest and large at a right click, made at the counters the answer's reading hands under the names the card declares; a name on any other card shows the card at its starting values as before. One test on the fixture for it.
- Out: the stand-in's Hunger, which empties the stock and declares no counter; the reading's shape, which stays numbers by name; any other event or card.
- Corner cases decided here: a reading value named like no counter of the named card is the text's alone and sets nothing; a counter the card declares that the reading does not name stands at its starting value on the shown card. A Hunger already in a pile keeps the counter it was laid with, whatever turn it strikes on; two Hungers laid on different turns are two instances with different counters and strike each for its own. The reading is taken on the chronicle the deal stands on, the same turn the choice lays the card on, so the amount shown is the amount laid.

**Traps:**

- The Hunger face has a placeholder now, so every face of it is made with its `food` counter: an instance's from the instance, a name's from the starting value or the reading. `text()` in `src/ui/text.ts` refuses an unfilled placeholder, and the content coherence test in `src/content/nomadic.test.ts` reads every card's entry with its starting counters, which is where an entry that names a counter the card does not declare fails.
- The reading and the laying are two closures of one answer in `src/content/nomadic.ts`; the amount is computed in one function both call, never in each.
- The answer face (`src/ui/card-face.ts`) reads the answer's reading once for its text; the small card and the large card a name on it raises need that same reading to make the named card, so the face carries it, or whatever raises the small card from an answer's name has it: the implementer's cut, but one reading per deal, read on the chronicle the deal stands on.
- The fixture's Famine (`src/rules/fixtures.ts`) names the stand-in's Hunger through a shared text entry, `answer-rules.PH_Famine`, and the stand-in's Hunger declares no counter. The mechanism's test uses the fixture's counted card from the counters line and an answer of the fixture that names it, with an entry of its own; PH_Famine and `rules.PH_Hunger` stay as they are, the stand-in's face on screen.
- The rules text of the answer is laid out through `layOutRun` in `src/ui/text-run.ts`, which resolves `[card:hunger]` by id; the coherence test resolves every name on every answer's entry on a chronicle at turn 1, and the id is the same on every turn.
- `e2e/reference.spec.ts` walks a name on the deal window to its small card and its large card, on the stand-in's Famine; the path it walks is the one the mechanism changes, so it is the proof spec, and it must still pass with the stand-in unchanged.
- The board line's word, forged, is no glossary term and stands on no page: the pages say the counter is set and the card laid.

**Plan:**

1. The three `docs/` edits, verbatim from _Spec_.
2. `src/content/nomadic.ts`: Hunger's counter and its strike reading its counter; Lean season's _Share food_ reading and laying from one function. `src/ui/text.ts`: the two sentences.
3. The mechanism in `src/ui/`: the named card on an answer's face made at the reading's counters; the fixture's answer naming its counted card, and the one Vitest beside the pure face module asserting the named card is made at the value read.
4. `src/content/nomadic.test.ts` passes as it stands, the entry read with the starting counter; `npm run check`, `npm test`, `npm run lint`, then the spec.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The spec: `npx playwright test e2e/reference.spec.ts`, the name-to-small-card path on the deal window. CI proves the rest on the push: `deal.spec.ts`, `window.spec.ts` and `hover.spec.ts` walking the deal window and its names, and every other spec.
