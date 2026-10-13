# Strikes after the harvest

**Line:** **Strikes after the harvest** — the end of turn runs growth, income, strikes, discard, enemy phase; a strike is measured against the stock the harvest left. Done when `npm test` is green with the end of turn's stage lists moved to the new order, and `docs/CHRONICLE.md` says so. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _The turn_ and _Cards_. The sentences to land, written out:

- _The turn_, the numbered list: items 4 to 7 become the four below, item 7 (_Enemy phase_) becoming item 8 with its text unchanged. Growth and Income are today's sentences unchanged; End loses its discard clause; Strikes is new.

  > 4. **End.** The player ends the turn.
  > 5. **Growth.** A food stock that has reached the growth threshold is spent on one idle population, at most one a turn.
  > 6. **Income.** Standing things do their standing thing: assigned tiles and their buildings yield their resources. So what the player sees when drawing holds for the whole turn: a building built this turn yields from the next.
  > 7. **Strikes.** Each card in the hand carrying a strike strikes, in hand order, each on the chronicle the one before it left, and then the rest of the hand is discarded. A strike is measured against the stock the harvest left.

- _Cards_, the **Hazard** entry: "It **strikes** at the end of any turn it is still in the hand, before the hand is discarded — and again every cycle it comes around" becomes "It **strikes** at the end of any turn it is still in the hand, once the harvest is in and before the hand is discarded — and again every cycle it comes around". The rest of the entry stays.
- _Cards_, the **Challenge** entry: "A challenge may **strike** as a hazard does, at the end of any turn it is still in the hand, and nothing pays it off" becomes "A challenge may **strike** as a hazard does, at the end of any turn it is still in the hand once the harvest is in, and nothing pays it off". The rest of the entry stays.
- No player-facing text changes: no card, answer or lore names the order.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the end of turn's steps reordered to growth, income, strikes, discard, enemy phase, the player's hand being the only hand that strikes; the rules tests that assert the old order moved to the new one, their titles with them; the page sentences above.
- Out: the shortfall rule (a stock below nothing taking a population, born at the bottom of the rules), the next line's, **Paid in people**; the resource bar's reading of what the end of turn leaves, the line after it; the settle phase, which runs none of the cycle and is untouched; the age pages, whose Lean season and Strangers sentences name no order; the glossary's **strike** row, order-neutral.
- Corner cases decided here: growth stays ahead of income, the user's standing call of 2026-09-20, so a city that grows this turn is struck on what growth and the harvest left; a strike taking the player's city's last population still ends the chronicle on the strike, growth and income having already landed and nothing of the enemy phase following; the neutral has no hand and is struck by nothing, as today; a capture prepared on the player's city still lands in the enemy phase, after the strikes, as today.
- Reconcile: nothing found — one standing step moves, nothing new is built.

**Traps:**

- The end of turn is one list of steps in `src/rules/chronicle.ts` (`endOfTurn`), each on the chronicle the one before it left; the strikes and the discard are its first two entries today and growth and income its third and fourth. The move is of those entries alone; `struck` (`src/rules/cards.ts`) and `discarded` are not reshaped.
- Rules tests that encode the old order, each to be moved to the new one and retitled where the title names it: `src/rules/cards.test.ts` "a hazard strikes at the end of a turn it is still in the hand, before the income and the discard" (asserts the strike as stage 0), "a challenge carrying a strike strikes … before the discard …" (asserts the first three stages), "every hazard in hand strikes as one strike of its own …" (the first five), "a hazard whose strike moves nothing still strikes …" (stage 0), "a strike taking the city's last population falls on the strike, and no step of the end of turn follows it" (the whole stage list, which gains growth's and income's stages ahead of the strike, and whose "no step follows" now means the enemy phase); `src/rules/enemies.test.ts` "a capture ends the end of turn on its own stage, with the ending set" (lists `discarded` first). `src/rules/chronicle.test.ts` "growth is staged on the food stock the turn ends with, before the income and before the enemy phase" stays true and stays.
- The fixture's shortfall tests in `src/rules/cards.test.ts` (`droughty`, `stricken`, the three tests after them) build a city on `['urban', 'plain']` holding exactly the drought's food, one less, or one more, and read the stock and the population the strike left. The harvest now lands before the strike, so the food those cities hold at the strike is their stock plus what their assigned tiles yield; the tests keep their meaning by setting the stock against that yield, or by standing on a city whose tiles yield no food. The hazard test "a hazard strikes at the end of a turn …" compares the ended stock to a bare city's yield and holds in either order, as do the arithmetic tests around it.
- `src/content/catalogue.test.ts`'s coherence test strikes every card carrying a strike directly, not through the end of turn: order-neutral, untouched.
- The screen plays the stages in the order the rules emit them: the resource bar (`src/ui/resource-bar.ts`) rises on the `grow` and `income` groups and answers a `strike` group with nothing, the hand (`src/ui/hand.ts`) animates the strike on the card still in hand. No UI file changes; the play-out's order follows the rules'.
- The specs' seed search (`endedTurn`, `e2e/chronicle-screen.ts`) takes the first answer of every deal it runs through; on Nomadic content that adds a Hunger to the draw pile, so the chronicles the searches find change state with this line. Every spec reads its oracle from the rules; a spec ending many turns may search further for its seed, and CI proves them.
- A design page is never edited down to match an implementation, and the page's new sentences are the ones above, verbatim.
- Comments are for traps only; the page holds the why.

**Plan:**

1. The rules: the end of turn's steps reordered in `src/rules/chronicle.ts`; the tests above moved to the new order and retitled where a title names it; the fixture's shortfall tests set against the harvest. Leaves `npm test` green.
2. `docs/CHRONICLE.md`, the sentences above; the board line deleted; this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof: the rules tests, no spec of its own — nothing on screen changes but the play-out's order, which follows the stages. CI's on the push, listed for the hand-back: `deal`, `reference`, `hover`, `resume`, `neutral`, `fishery`, `pillage`, `capstone`, `ending`, `browse`, `flood`, `bad-air`, `strangers`.
