# Strangers

**Line:** **Strangers** — the Stone Age's strangers, dealt on every map, no need named: _Take them in_ gains population, one and one more for every ten turns, and adds the challenge **Misunderstandings** to the discard pile, which takes three culture at the end of every turn it stays in the hand and one population where the stock cannot cover it; _Refuse them_ does nothing. Done when the event stands on both Stone schedules, `npm test` is green with the coherence test among it, `e2e/strangers.spec.ts` passes, and the two pages below say so. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _Events and the capstone_ → _The schedule_, and [`docs/ages/STONE.md`](../../docs/ages/STONE.md) _The events_. The sentences to land, written out:

- `CHRONICLE.md` _The schedule_, second paragraph: the sentence "An event is dealt on every map and whatever the player has done: it names no need of the chronicle, and every answer it deals does something on any chronicle it lands on." becomes

  > An event is dealt on every map and whatever the player has done: it names no need of the chronicle. Its answers stand on an equal footing: all harms, all gains, or all mixed, each a gain and a harm in one. An answer that does nothing is dealt beside mixed answers alone: beside harms it is the plain choice, beside gains the plain refusal.

  The rest of the paragraph stays as it is.

- `ages/STONE.md` _The events_, after the Bad air and angry spirits bullet, one bullet:

  > - **Strangers.** A band comes to the player's city and asks to stay, speaking no word of its language. _Take them in_: population arrives idle, more on a later turn, and the challenge **Misunderstandings** is added to the discard pile; played by nothing, it takes culture at the end of every turn it stays in the hand, one population leaving where the stock cannot cover it, and gains influence on victory. _Refuse them_: nothing happens. Strangers is population and influence now against culture over time, or neither.

- Player-facing text, `src/ui/text.ts`, verbatim: `event.strangers` "Strangers"; `answer.take-them-in` "Take them in"; `answer-rules.take-them-in` "Gain {population} population. Add [card:misunderstandings] to the discard pile. Each turn it stays in your hand, it takes 3[culture]"; `answer.refuse-them` "Refuse them"; `answer-rules.refuse-them` "Nothing happens"; `card.misunderstandings` "Misunderstandings"; `rules.misunderstandings` "Takes 3[culture]. Not enough culture, one population leaves".
- Lore, `src/ui/lore.ts`, verbatim: `event.strangers` "A band has come down to your fires, thin and footsore, and asks to stay. Nobody understands a word they say, and they are not leaving."

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Scope:**

- In, the content, one commit with its measurement: the event `strangers` in the Stone slice's events, answers declared in the order _Take them in_, _Refuse them_; _Take them in_ costing nothing, reading `{ population: n }` with n one and one more for every ten turns, as the sickness counts, landing n population arrived idle for the player's city one after another and then one copy of `misunderstandings` on the discard pile through the capture's reward helper; _Refuse them_ costing nothing, reading nothing, landing the chronicle unchanged. The card `misunderstandings`, kind challenge, influence three, no counter, its strike Hunger's shape over culture: the player's city's culture stock shocked by three, and where the stock held less than three before the strike, one population taken after it, the idle first and the last assigned tile's after, the city's last no exception. `strangers: 1` on both Stone schedules, each written out. The texts and the lore above, and the two docs sentences.
- In, the proof spec `e2e/strangers.spec.ts`.
- Out: a count that grows in the strike, which the user set flat at three; the numbers above, provisional, the balance pass's; the neutral, which the strangers never reach; stocks standing below nothing, a discussion the user parked for after this line; saves and campaigns, which need no care before the Bronze Age ends; a rules test, since the content lays its numbers over helpers that already carry their fixture tests and decides nothing.
- Corner cases decided here: a strike on a city of one population and less than three culture takes it, and the chronicle ends in defeat on that change; a strike on a city holding exactly three culture empties the stock and takes nobody; Fire discarding Misunderstandings spares that turn's strike, as it spares Hunger's and Sickness's; _Refuse them_ is a take like any other, the deal popped and the hand drawn, and its group holds the pop alone.
- Reconcile, every likeness chosen by the user: the population arriving goes through the arrival rule the Capture trophy uses, repeated for the count as the sickness repeats its taking, no new rule; the challenge goes through the capture's reward helper and the hazards' strike loop as Sickness and Floodplain do, the strike's content the one difference; the strike's culture goes through the stock shock Hunger's strike uses, floored at nothing; the shortfall is Hunger's shape, the stock emptied and one population taken, and the card's text says leaves where Hunger's says kills, two meanings kept apart.

**Traps:**

- `arrived` in `src/rules/city.ts` adds one idle population and answers the one change it raised; `buried` in `src/content/stone.ts` is the shape of a counted loop over `followed`, and `sicknessKills` the count's arithmetic, which this event keeps as its own, apart from the sickness's: each is its own tuning.
- `shocked` in `src/rules/cards.ts` takes a stock down by the amount and never below nothing, and answers nothing where the stock stands where it did; the shortfall is read on the chronicle before the shock, as Hunger's strike reads it in `src/content/nomadic.ts`. `populationTaken` in `src/rules/city.ts` takes one and answers the changes it raised; the fall at nought is born in `landedAs` (`src/rules/stages.ts`).
- `rewarded` in `src/rules/schedule.ts` makes copies at their declared counters and adds them to the discard pile, the challenge answer's door; `addedToDrawPileTop` is Hunger's and not this.
- The challenge member of the `Card` type in `src/rules/catalogue.ts` carries an optional `strikes`, the same `Strike` shape as a hazard's, which the end-of-turn strike loop resolves; `sickness` in `src/content/stone.ts` is the standing example.
- An answer that lands `unchanged` is a take like any other in `take` (`src/rules/chronicle.ts`): the deal's pop is the `taken` change, so the `answer` group is never empty; `keep-them` in `departure` lands so today, its cost paid ahead of it.
- `merged` refuses an answer id two events deal and a card id two slices bring; `strangers`, `misunderstandings`, `take-them-in` and `refuse-them` are new to the tree. The coherence test in `src/content/catalogue.test.ts` asks every event its name and lore and every answer its name, cost, reading and face, lands every answer on a settled chronicle of the age, a city of one population and no culture, and strikes every card carrying a strike there: Misunderstandings takes that city's last population and lands its fall, as Sickness does today, and the test asks only that nothing throws.
- Schedules are never factorized: `TEMPERATE_SCHEDULE` and `ARCHIPELAGO_SCHEDULE` in `src/content/stone.ts` each get `strangers: 1` written out.
- The glossary lint hook reads forbidden synonyms in `src/ui/text.ts`: "strangers", "refuse", "misunderstandings", "leaves" and "band" are no glossary words, and "gain" is forbidden for a card alone, as Capture's "Gain one population" stands.
- The specs' seed search (`endedTurn`, `e2e/chronicle-screen.ts`) takes the first answer of every deal it runs through, so a searched chronicle that meets this event gains population and carries Misunderstandings from then on, which takes a population from a city holding no culture each time it comes to hand; a spec ending many turns on Stone content may now search further for its seed, every spec reads its oracle from the rules, and CI proves the ones ending turns on Stone content.
- The resource bar names its idle reading `reading-idle` and its value `reading-idle-value`; the bar shows the idle count, never the population, so the spec reads the idle count and the chronicle.
- `e2e/` reads Phaser: a spec rests before it presses or measures, `docs/PHASER.md`.
- Comments are for traps only; the page holds the why.

**Plan:**

1. The content: the event, the card and the two schedule entries in `src/content/stone.ts`; the texts in `src/ui/text.ts` and the lore in `src/ui/lore.ts`. Leaves `npm test` green, the coherence test among it.
2. `e2e/strangers.spec.ts`, `e2e/bad-air.spec.ts` its model: a Stone chronicle on the won campaign, settled, turns ended to the first due turn, the seed searched for a first deal that is this event alone; the save opened on the deal, the title, the lore and the faces read off the rules, _Take them in_ taken, the idle reading higher by the count the answer reads and the chronicle equal to the rules' outcome, the discard pile holding the card among it.
3. The two pages, the board line deleted, this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/strangers.spec.ts`. CI's on the push, listed for the hand-back: `deal`, `reference`, `hover`, `resume`, `neutral`, `fishery`, `pillage`, `capstone`, `ending`, `browse`, `flood`, `bad-air`.
