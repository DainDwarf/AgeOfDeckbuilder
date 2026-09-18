# A pile change carries the place

**Line:** A pile change carries the place — `discarded` and `left` carry the places in the hand the cards left, one for a play and every one at the end of a turn, `recalled` the place in the discard pile its card came out of, and a reward laid in the discard pile carries none, having left no pile; the hand flies the slot the change names and its guess among copies goes; one rules test on the fixture holds it. Doc-impact: `docs/DOGMAS.md`.

**Spec:** `docs/DOGMAS.md` → _Code_, the bullet "The flow is a tree of stages": its sentence "A change is named for the fact that moved, its direction and amount read off the chronicles before and after, and carries only what those cannot say: the tile, the two ends of a crossing." becomes, verbatim: "A change is named for the fact that moved, its direction and amount read off the chronicles before and after, and carries only what those cannot say: the tile, the two ends of a crossing, and the places in the pile the cards came out of, since which of two copies moved is what two chronicles cannot say." `BRANCH.md` → _The design_, as this intake rewrote it: the same clause in its paragraph, the piles' row of its table naming what each pile change carries, and the reward's sentence saying its `discarded` carries no place. `docs/CHRONICLE.md` → _The chronicle screen_ says nothing of which card flies and stays as it is. There is no player-facing sentence.

**Doc-impact:** `docs/DOGMAS.md`, the one sentence above. `BRANCH.md` is task context and already carries the design.

**Scope:**

In: the three pile changes that move one card out of a pile among copies of it, and every site that raises them, carrying what the chronicles before and after cannot say:

| Change | Raised by | Carries |
| --- | --- | --- |
| `discarded` | a play of a card that cycles | the one place in the hand the card left |
| `discarded` | the end of turn, the rest of the hand | every place of the hand, in hand order |
| `discarded` | a reward taken | no place: an empty list, the card left no pile |
| `left` | a play of a settle card, a single use card or a hazard | the one place in the hand the card left |
| `left` | the end of turn 0, the settle cards still in hand | every place of the hand, in hand order |
| `recalled` | a recall instant | the place in the discard pile the card came out of, in the pile as it stood before the recall's own card was laid on it: the number the play command named |

A place is an index into the pile as it stood before the change, the same number the play command names the card by. The list is always there, empty for the reward, so a listener never branches on whether a place is carried.

The hand: on `discarded` it flies the slots the change names, in the order named, and lays the rest out anew where they land; the guess that counted copies goes, and with it the slot the hand remembered letting go of as a hint to that guess. What stays is the come-home on `refused`: the card the hand let go of comes back down into its slot when the rules turn the play down. The piles read the number of cards in the air off the change's places instead of the two hands' lengths, or keep reading the lengths — either is the implementer's, both hold.

Out: `drawn`, `laid` and `shuffled` carry nothing, as today: a drawn card joins the back of the hand, a laid hazard the top of the draw pile, and the chronicles say so. A card that leaves the chronicle flies nowhere, as today: the hand plays nothing on `left` and the render removes it; the place it now carries is what an animation of it would read, on a line of its own. No card gains an identity: the piles stay lists of card ids, the state, the save and every fixture keep their shape. No change to what any helper answers beyond the place it carries. No e2e spec asserts which slot moved on screen: that is a coordinate on screen, which the testing dogma keeps out of the suite; the screen half is a visual-check pass.

Corner cases: a play of the only copy carries its place all the same, there is no special case for one. The end of turn's `discarded` on an empty hand is absent, as today, not a change carrying no place. A recall from a discard pile of one carries place nought. The recall's `discarded` and its `recalled` are two changes under one `played`: the first carries the recall card's place in the hand, the second the recalled card's place in the pile as the command named it, which is the pile before the recall card was laid on it, so the number is the one the aim window offered.

**Traps:**

- Five sites raise these changes: `play` in `src/rules/chronicle.ts` raises `discarded` or `left` for a card played and filters the hand by `command.index`, the number to carry; `moved('discarded', …)` in the same file raises the end of turn's, over `discard`, which empties the whole hand; the `turn` group in the same file raises `left` on turn 0 where settle cards were still in hand; `rewarded` in `src/rules/schedule.ts` raises the reward's `discarded`; `recalled` in `src/rules/cards.ts` raises `recalled` with the pile place `at` in hand already. `moved` is shared with `drawn` and `shuffled`, which carry nothing.
- `change()` in `src/rules/stages.ts` takes a plain name and the chronicle; `discarded`, `left` and `recalled` leave the plain set once they carry a place, so the type refuses every raise site that does not hand one over. That is the intended failure: the sets are closed, and a switch elsewhere over the change names needs no new case, since no name is added.
- The hand's `gone` in `src/ui/hand.ts` is the guess: it counts the new hand's copies per id and lets the first surplus slot go, the slot in `letGo` first. `act` sets `letGo` for a card aimed at nothing alone; a card aimed at a tile, a unit or the discard pile is played from the scene's `aimTile` and `aimDiscardPile` presses after `hand.unselect()`, so `letGo` is never set for them and the guess falls on the first copy. `comeHome` reads `letGo` on `refused`; it stays.
- The piles' `landed` in `src/ui/piles.ts` waits out the block's flight by the difference of the two hands' lengths; the reward's `discarded` finds no hand shrinking and lands at once, which is right, since a reward is drawn as a card of the deck and the hand holds nothing while the deal stands.
- `moved` is also what `drawn` and `shuffled` go through; only the `discarded` arm changes.
- Rules tests read stage names through `namesOf` and `stagedBy` in `src/rules/fixtures.ts` and never a change's shape, so none breaks on the field; the test this line adds reads the places off the changes through the walk. `cards.test.ts` holds the recall tests, on a hand and a discard pile the fixture writes by ids; the new test builds its hand of two copies the same way.
- `e2e/play-out.spec.ts` breaks a motion and asserts the turn still ends; `e2e/recall.spec.ts` drags the recall card and takes a card of the aim window. Neither reads a change's shape.
- `npm run e2e` is refused from a session; the specs run one at a time by name.

**Plan:**

1. `src/rules/stages.ts`: the three changes carry their places, out of the plain set. Leaves `npm run check` failing on the five raise sites.
2. `src/rules/chronicle.ts`, `src/rules/schedule.ts`, `src/rules/cards.ts`: each site hands over the places of the table. Leaves `npm run check` passing on the rules.
3. `src/rules/cards.test.ts`, or beside the play tests in `src/rules/chronicle.test.ts`, on the fixture: the second of two copies played carries place one and the hand keeps the first; the end of turn carries every place in hand order; the end of turn 0 the same for `left`; a reward taken carries none; a recall carries the pile place the command named. Leaves `npm test` passing.
4. `src/ui/hand.ts`: the slots named fly, the guess goes; `src/ui/piles.ts` only where the implementer reads the places. Leaves `npm run check` and `npm run lint` passing.
5. `docs/DOGMAS.md`: the sentence of _Spec_. Leaves `npm run lint` passing on the markdown.
6. The two specs below, one by one. Leaves them passing.
7. The visual-check pass: a seed whose hand holds two copies side by side, the second played, the first still standing in its slot as the second flies.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/play-out.spec.ts` and `npx playwright test e2e/recall.spec.ts`, named in the report as the specs that walk a play's motion and the recall.
