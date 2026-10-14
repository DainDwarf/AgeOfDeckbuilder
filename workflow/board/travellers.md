# Travellers

**Line:** **Travellers** — the Stone Age's fortunate event, dealt on both Stone schedules, no need named: _Trade with them_ gains money, _Share stories_ gains culture, each more on a later turn, both costing nothing. Done when the event stands on both Stone schedules, `npm test` is green with the coherence test among it, `e2e/travellers.spec.ts` passes, and the Stone page says so. Doc-impact: `docs/ages/STONE.md`.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md) _The events_, whose first paragraph already names "a fortunate one" and stays as it is, and [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _Events and the capstone_ as it stands, which the line obeys and does not change: all gains stand on an equal footing, and no do-nothing answer is dealt beside gains. The sentences to land, written out:

- `ages/STONE.md` _The events_, after the Drought bullet, one bullet:

  > - **Travellers.** A band passes by the player's city for a night. _Trade with them_: money gained, more on a later turn. _Share stories_: culture gained, more on a later turn. Both are gains: Travellers is money against culture, a breath and not a decision.

- Player-facing text, `src/ui/text.ts`, verbatim: `event.travellers` "Travellers"; `answer.trade-with-them` "Trade with them"; `answer-rules.trade-with-them` "Gain {money}[money]"; `answer.share-stories` "Share stories"; `answer-rules.share-stories` "Gain {culture}[culture]".
- Lore, `src/ui/lore.ts`, verbatim: `event.travellers` "A band of travellers has made camp at the edge of your fields for the night, packs full and tongues loose. They move on at dawn, but tonight there is trading to do and tales to swap around the fire."

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:**

- In, the content, one commit with its measurement: the event `travellers` in the Stone slice's events, answers declared in the order _Trade with them_, _Share stories_. The count is n = two and one more for every ten turns, the event's own arithmetic as each event keeps its own. _Trade with them_ costs nothing, is refused by nothing, reads `{ money: 2n }` and lands 2n money gained into the player's city's stock. _Share stories_ costs nothing, is refused by nothing, reads `{ culture: n }` and lands n culture gained the same way. `travellers: 1 / 3` on both Stone schedules, each written out, the weight The herd's. The texts and the lore above, and the docs bullet.
- In, the proof spec `e2e/travellers.spec.ts`.
- Out: a mechanism — none is needed, the stock gain being the standing door every trophy and Hunt it already go through, so no fixture test; the numbers above, provisional, the balance pass's; the Nomadic herd, which keeps its flat gain; saves and campaigns, which need no care before the Bronze Age ends; the neutral, which no answer touches.
- Corner cases decided here: a gain is never refused and never unaffordable, so the deal always offers both; the culture gained counts toward the next claim like any culture, and the money toward Bartering's goal like any money in the stock, as Their stores' does; the gift grows with the turn and never with the city's size; two free answers in one event are content and nothing in the rules.
- Reconcile, chosen by the user: both answers go through the stock-gain door as it stands, the one Hunt it, Bread and the trophies use; nothing is reshaped.

**Traps:**

- `gained` in `src/rules/cards.ts` is the stock gain, its one `stock` change; `herd` in `src/content/nomadic.ts` is the standing shape of a free answer that reads and lands a gain, and `strangers` in `src/content/stone.ts` the standing shape of a count growing with the turn. A `ScheduledEvent`'s `answers` and an `Answer`'s `cost`, `reads` and `lands` are `src/rules/catalogue.ts`'s.
- Every event must deal one answer costing no stock whatever the chronicle and blocked by nothing, or the validator in `src/rules/catalogue.ts` refuses the slice; both answers here are such.
- The coherence test in `src/content/catalogue.test.ts` asks every answer of every scheduled event its cost, its block, its landing and its face on the numbers it reads, on a settled chronicle of the age: a face naming `{money}` or `{culture}` that `reads` does not hand back fails there.
- Schedules are never factorized: `TEMPERATE_SCHEDULE` and `ARCHIPELAGO_SCHEDULE` in `src/content/stone.ts` each get `travellers: 1 / 3` written out, the fraction as `herd: 1 / 3` is written.
- The catalogue's merge refuses an answer id two events deal; `trade-with-them` and `share-stories` are new to the tree, and `travellers` names no card.
- The glossary lint hook reads forbidden synonyms in `src/ui/text.ts`; "trade", "stories", "share" and "travellers" are no glossary words and no forbidden ones. "Gain" is the verb Hunt it's face uses.
- The specs' seed search (`firstSeed`, `dealtAlone`, `stoppedOnDeal` in `e2e/chronicle-screen.ts`) takes the first of a thousand seeds whose first deal is the event alone; at a third's weight about one seed in twenty-seven deals it first, well inside the thousand. Adding an entry to the schedule shifts which event a seed deals, so every Stone spec's seed search finds other seeds; they read their oracle from the rules and nothing in them names a seed. `firstEntriesTaken` takes the first answer of every deal, so Stone chronicles ended headlessly take _Trade with them_.
- The resource bar reads money as a bare count and culture as a count over the culture threshold, `barReadingOn` in `e2e/chronicle-screen.ts` and `src/ui/resource-bar.ts`; the spec reads each through `barReadingOn` and never a literal.
- `e2e/` reads Phaser: a spec rests before it presses or measures, `docs/PHASER.md`.
- Comments are for traps only; the page holds the why.

**Plan:**

1. The content, one commit: the event and the two schedule entries in `src/content/stone.ts`; the texts in `src/ui/text.ts` and the lore in `src/ui/lore.ts`. Leaves `npm test` green, the coherence test among it.
2. `e2e/travellers.spec.ts`, `e2e/drought.spec.ts` its model: a Stone chronicle on the won campaign, settled, turns ended to the first due turn, the seed searched for a first deal that is this event alone; one test per answer, each reading the title, the lore, the two faces and the stock the answer gains on the bar, taking the answer, and reading the chronicle equal to the rules' outcome and the stock higher by what the rules read.
3. The page, the board line deleted, this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/travellers.spec.ts`. CI's on the push, listed for the hand-back: `deal`, `reference`, `hover`, `resume`, `neutral`, `fishery`, `pillage`, `capstone`, `ending`, `browse`, `flood`, `bad-air`, `strangers`, `predators`, `drought`, `end-of-turn-reading`.
