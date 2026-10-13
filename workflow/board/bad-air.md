# Bad air and angry spirits

**Line:** **Bad air and angry spirits** — the Stone Age's sickness, dealt on every map, no need named: _Bury the dead_ kills population, one and one more for every ten turns; _Live with it_ adds the challenge **Sickness** to the discard pile, which kills one population at the end of every turn it stays in the hand; _Help the healers_ pays science for each population the sickness would take. Done when the event stands on both Stone schedules, `npm test` is green with the coherence test among it, `e2e/bad-air.spec.ts` passes, and the page below says so. Doc-impact: `docs/ages/STONE.md`.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md) _The events_. The sentences to land, written out:

- `ages/STONE.md` _The events_, after the Flood bullet, one bullet:

  > - **Bad air and angry spirits.** A sickness runs through the player's city, wherever it stands. _Bury the dead_: population killed, more on a later turn, the player's city's last no exception. _Live with it_: the challenge **Sickness** is added to the discard pile; played by nothing, it kills one population at the end of every turn it stays in the hand, and gains influence on victory. _Help the healers_: science paid for each population the sickness would take, so a deck that plays Fire has the way out the others do not. Bad air and angry spirits is science now against population now against population over time for influence.

- Player-facing text, `src/ui/text.ts`, verbatim: `event.bad-air` "Bad air and angry spirits"; `answer.bury-the-dead` "Bury the dead", carrying `// glossary exception: dead` as Honour the dead does; `answer-rules.bury-the-dead` "Kills {population} population"; `answer.live-with-it` "Live with it"; `answer-rules.live-with-it` "Add [card:sickness] to the discard pile. Each turn it stays in your hand, it kills one population"; `answer.help-the-healers` "Help the healers"; `answer-rules.help-the-healers` "Pay {science}[science]"; `card.sickness` "Sickness"; `rules.sickness` "Kills one population".
- Lore, `src/ui/lore.ts`, verbatim: `event.bad-air` "A fever runs through the houses. The elders say the air has gone bad and the spirits are angry, and the healers have no more roots to boil."

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:**

- In, the content, one commit with its measurement: the event `bad-air` in the Stone slice's events, answers declared in the order _Bury the dead_, _Live with it_, _Help the healers_; _Bury the dead_ costing nothing, reading `{ population: n }` with n one and one more for every ten turns, as the flood counts, landing n population taken from the player's city one after another, the idle first and the last assigned tile's after, the city's last no exception; _Live with it_ costing nothing, reading nothing, landing one copy of `sickness` on the discard pile through the capture's reward helper; _Help the healers_ costing two science for each population _Bury the dead_ would take, read the same way, landing nothing. The card `sickness`, kind challenge, influence three, its strike taking one population of the player's city as Hunger's shortfall does. `'bad-air': 1` on both Stone schedules, each written out. The texts and the lore above.
- In, the proof spec `e2e/bad-air.spec.ts`.
- Out: a count of the city's size in the harm, which the user struck for the turn's; the numbers above, provisional, the balance pass's; the neutral, which the sickness never touches; saves and campaigns, which need no care before the Bronze Age ends; a rules test, since the content lays its count over helpers that already carry their fixture tests and decides nothing.
- Corner cases decided here: a city whose population the count exceeds loses what it has, its last among them, and falls; a strike on a city of one population takes it, and the chronicle ends in defeat on that change; Fire discarding Sickness spares that turn's strike, as it spares Hunger's; _Help the healers_ is unaffordable on a city with no science, as every paid answer is when its stock is short, and the deal still holds the two free ones.
- Reconcile, every likeness chosen by the user: several population taken at once go through the one rule Departure's _Let them go_ and Hunger's shortfall use, repeated for the count as the flood repeats its removal, no new rule; the count that grows every ten turns stays the event's own arithmetic in its content, apart from the flood's, the rival band's and Hunger's, each its own tuning; the challenge goes through the capture's reward helper and the hazards' strike loop as Floodplain does, the strike's content the one difference; the paid answer is the flood's _Dig channels_ shape over science; the loss's text says killed where Departure's says lose, two meanings kept apart.

**Traps:**

- `populationTaken` in `src/rules/city.ts` takes one population and answers the changes it raised; the fall at nought is born in `landedAs` (`src/rules/stages.ts`), so a loop that keeps taking past it moves nothing more and must not be read as a defect. The flood's `removedInside` in `src/rules/schedule.ts` is the shape of a counted loop over `followed`.
- `rewarded` in `src/rules/schedule.ts` makes copies and adds them to the discard pile, which is the challenge answer's door; `addedToDrawPileTop` is Hunger's and not this.
- The challenge member of the `Card` type in `src/rules/catalogue.ts` carries an optional `strikes`, the same `Strike` shape as a hazard's, which the end-of-turn strike loop resolves; `floodplain` in `src/content/stone.ts` is the standing example.
- `merged` refuses an answer id two events deal and a card id two slices bring; `bad-air`, `sickness` and the three answer ids are new to the tree. The coherence test in `src/content/catalogue.test.ts` asks every event its name and lore and every answer its name, cost, reading and face, and lands every answer on a settled chronicle of the age, a city of one population: _Bury the dead_ lands its fall there as Departure's _Let them go_ does today, and the test asks only that nothing throws.
- Schedules are never factorized: `TEMPERATE_SCHEDULE` and `ARCHIPELAGO_SCHEDULE` in `src/content/stone.ts` each get `'bad-air': 1` written out.
- The glossary lint hook reads forbidden synonyms in `src/ui/text.ts`: "dead" is one of killed's, and the line carries `// glossary exception: dead`; "healers", "spirits" and "air" are no glossary words.
- The specs' seed search (`endedTurn`, `e2e/chronicle-screen.ts`) takes the first answer of every deal it runs through, so a searched chronicle that meets this event before turn 10 loses one population, which Departure's first answer already costs it; no spec is newly exposed, and CI proves the ones ending turns on Stone content.
- The resource bar names its idle reading `reading-idle` and its value `reading-idle-value`; the bar shows the idle count, never the population, so the spec reads the idle count and the chronicle.
- `e2e/` reads Phaser: a spec rests before it presses or measures, `docs/PHASER.md`.
- Comments are for traps only; the page holds the why.

**Plan:**

1. The content: the event, the card and the two schedule entries in `src/content/stone.ts`; the texts in `src/ui/text.ts` and the lore in `src/ui/lore.ts`. Leaves `npm test` green, the coherence test among it.
2. `e2e/bad-air.spec.ts`, `e2e/flood.spec.ts` its model: a Stone chronicle on the won campaign, settled, one population brought in through the rules' own arrival so one stands idle, turns ended to the first due turn, the seed searched for a first deal that is this event alone with the idle one still standing; the save opened on the deal, the title, the lore and the faces read off the rules, _Bury the dead_ taken, the idle reading one fewer and the chronicle equal to the rules' outcome.
3. The page, the board line deleted, this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/bad-air.spec.ts`. A visual check through the `visual-check` skill of the deal window's title at its length, the longest an event has had, against the window's width. CI's on the push, listed for the hand-back: `deal`, `reference`, `hover`, `resume`, `neutral`, `fishery`, `pillage`, `capstone`, `ending`, `browse`, `flood`.
