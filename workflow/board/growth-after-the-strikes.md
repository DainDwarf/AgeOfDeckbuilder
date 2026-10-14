# Growth after the strikes

**Line:** **Growth after the strikes** — the end of turn runs income, then the strikes, then growth on what they leave; `docs/CHRONICLE.md` says so and one fixture test holds it: a stock over the growth threshold that a strike leaves under it grows nobody, and one the income brings to it grows. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** `docs/CHRONICLE.md` _The turn_, the numbered list. Steps 5 to 7 become, in this order and with these words, the rest of the list untouched:

> 5. **Income.** Standing things do their standing thing: assigned tiles and their buildings yield their resources. So what the player sees when drawing holds for the whole turn: a building built this turn yields from the next.
> 6. **Strikes.** Each card in the hand carrying a strike strikes, in hand order, each on the chronicle the one before it left, and then the rest of the hand is discarded. A strike is measured against the stock the income left.
> 7. **Growth.** A food stock that has reached the growth threshold is spent on one idle population, at most one a turn. Growth comes after the strikes so the income reads as a gain, a strike as a loss, and growth takes what they leave: a strike never takes the person the same turn's growth made.

Step 5's and step 6's sentences are today's, moved; step 7's first sentence is today's step 5, and its second sentence is the one new sentence. No sentence says what the order was, and no rejected alternative is written: the edit is the new order alone, in the glossary's words (**income**, **strike**, **grow**, **growth threshold**; never "harvest").

_The city_ needs no edit: "At the growth phase a food stock that has reached the growth threshold is spent…" holds whatever the phase's place. The hazard and challenge kinds under _The cards_ say a strike comes "after the income and before the hand is discarded", which stays true.

No player-facing text changes: no text-table entry, card text or tooltip names the order.

**Doc-impact:** `docs/CHRONICLE.md` _The turn_.

**Scope:**

- In: the order of the end of turn's steps in the rules, the page, the one fixture test, and every standing test whose expectation pins the old order of stages rewritten to the new one.
- In: both cities. Growth of the player's city and the neutral's moves together; the neutral takes no strike, so nothing changes for it but its place in the sequence.
- Out: the growth cap of one a turn. The user holds that question; nothing here touches it.
- Out: the resource bar's reading of what the end of turn leaves, the next line on the board; it reads the rules' run and lands on whatever order stands.
- Out: any change in `src/ui/`. The screen plays the stages in the order the rules give them.
- Corner, decided: a strike that takes the city's last population ends the chronicle on the strike, and growth never runs on a fallen city, as no step runs after an ending today. A city of population nought and food nought still falls at growth, which now comes after the income, the strikes and the discard, and still before the enemy phase, which still does not run after the fall.
- Corner, decided: growth comes after the discard, as the page's step 6 ends on the discard and step 7 is growth. Whether the discard is a stage of its own or part of the strikes' step is the implementer's, as today.
- Corner, decided: a population taken by a strike lowers the growth threshold by two, so a city struck short with food left over that lower threshold grows at once on the same turn. This is the rule as written and is meant: the take costs the city the food it then grows on. Nothing guards it.

**Traps:**

- The end of turn is one ordered course of steps in `src/rules/chronicle.ts`; the reorder is a move of one step inside it, nothing else. The previous reorder (Strikes after the harvest, `0097696`) moved two steps the same way; its diff is the shape.
- Many standing tests pin the stage names of the end of turn in order, 'grow' first: `src/rules/cards.test.ts` (around lines 1937, 2023, 2105, 2128, 2173), `src/rules/chronicle.test.ts` (around 135, 483, 514, 561, 920, 925), `src/rules/enemies.test.ts` (around 123, 190, 277, 421, 1254, 1283, 1570), and `src/rules/city.test.ts` reads the 'grow' group's inner stages (389, 398, 865). Their expectations move to the new order; their rules do not. A group named 'grow' appears in the sequence even when it grows nothing (the hazard test at `cards.test.ts:1925` lists it under `NO_GROWTH`), so it now appears after 'discarded'.
- The comment at `src/rules/cards.test.ts:2169`, "growth runs ahead of the strike", becomes false: cut it, and the test's fixture may no longer need to stand under the threshold.
- The fixture's city tile yields no food; its 'plain' does (`cards.test.ts:1925` relies on it), so "a stock the income brings to the threshold grows" is planted on `cityOf(['urban', 'plain'])`, and "a stock over the threshold a strike leaves under it" on a hand holding `PH_Hunger` with `HUNGER` food, as the strike tests do (`hungry`, `stricken` in `cards.test.ts`). The test reads its oracle from the rules' growth threshold, never a literal.
- `DOGMAS.md` _Docs_: a pivot edit is the new sentence alone. The page must not say "was", "now", "no longer", or what the order used to be; the memory holds that the user is angry at history in `docs/`.
- `src/ui/hand.ts` keeps the hand's cards through the leaves of the end of turn that do not change it, so a press mid play-out behaves; that logic names no order and needs no change. `src/ui/resource-bar.ts` ticks on the 'income' and 'grow' groups in whichever order they come.
- The glossary lint hook runs on the page: **income**, **strike**, **grow**, **growth threshold** are the terms; "harvest" is none.

**Plan:**

1. `src/rules/chronicle.ts`: the end of turn's course runs income, strikes, discard, growth, enemy phase, captures, opening. Leaves the rules on the new order and the suite red where tests pin the old one.
2. `src/rules/cards.test.ts`: the one new fixture test beside the strike tests, in two halves: a city with food over the growth threshold and a Hunger in hand whose strike leaves it under ends its turn with no growth, its food the stock the income and the strike leave; a city under the threshold by less than its tile's income, no strike in hand, ends its turn grown. Then every standing expectation pinning the old order rewritten, the false comment cut. Leaves the suite green.
3. `docs/CHRONICLE.md` _The turn_: the three steps as written above. Leaves the page the spec.
4. `workflow/BOARD.md`: the line deleted; this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof spec: none. The line lands in `src/rules/` and the page; the fixture test is its proof. No e2e spec reads the order of the end of turn's stages.
- On the push, CI runs the whole suite; the specs that read the bar after an end of turn are the ones a change here could reach: `e2e/bad-air.spec.ts`, `e2e/strangers.spec.ts`, `e2e/press.spec.ts` (the press mid play-out).
