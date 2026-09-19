# The culture curve

**Line:** The culture curve — the culture threshold is twice the tiles the city holds, its own counted, held by one test on the fixture, and `docs/CHRONICLE.md` names the curve. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** `docs/CHRONICLE.md` _The map_, the claim paragraph. The curve is the rules' own, one law every age's border grows by; the ages differ through what they yield in culture, which is content already. Its shape is linear in the tiles held, so a culture-heavy deck in a later age can buy its thirtieth tile on an income a building economy reaches; its factor is provisional, the balance pass's to tune on the real content. Today's curve, one culture and one more for every three tiles held, buys six tiles before the capstone on the nomadic city's one culture a turn; twice the tiles held buys a first claim on turn 3, a second on turn 7 and a third on turn 13 only where no Departure was kept, which is the age's wish: one claim needed, a second fought for. The sentences, written out:

- `CHRONICLE.md` _The map_, replace "claiming needs no card, like assigning, and the **culture threshold**, what a claim costs, rises with the tiles owned." with: "claiming needs no card, like assigning, and the **culture threshold**, what a claim costs, is twice the tiles the city holds, its own counted 🔧."
- Same paragraph, after "A cost that also rises with distance was rejected until a chronicle shows fractal borders: a tendril is adjacent-only and exposed already.", add: "A threshold rising by the square of the tiles held was rejected: it reads the same in the first age and shuts the large city a culture-heavy deck plays in a later one."
- `docs/GLOSSARY.md`'s row for the culture threshold, "rises with the tiles the city holds", stays true and stands.

No new player-facing text: the tile wears the threshold as it does today, and the resource bar reads culture plain.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

In:

- The threshold in `src/rules/city.ts` becomes twice the tiles held, the two constants of today's curve replaced by the one factor; the docblock that retells today's curve goes with it.
- One test on the fixture asserts the rule as a player states it, a claim costs twice the tiles held, the city's own counted, in the shape of the test that asserts today's curve; the two tests that assert today's numbers are the ones this line rewrites, since the promise they hold is the one being changed, and the report names them.
- The design page sentences above, verbatim.

Out:

- Culture income: the nomadic city's one culture a turn is content and stays.
- Departure's _Keep them_, the other culture sink, costing the population: content, unchanged.
- The growth threshold: the next board line.
- The factor's value beyond this provisional two: the balance pass's, on the real content.
- The curve as content per age: rejected here, not built; a later age that wants another law is a design change then.

Corner cases decided here:

- The city's own tile counts among the tiles held, as today, so the first claim costs two: the city holds one tile at the settle.
- A tile taken inside the border by anything but a claim, a free claim of the e2e content among them, counts as held like any other, as today.

**Traps:**

- Every fixture that seeds nine culture as "enough for any claim" reads today's curve on a ring of seven held tiles, whose threshold is now fourteen: `src/rules/city.test.ts` (the dark-border fixture, and every `ringed(3, …)` seeded with nine) and `src/rules/enemies.test.ts` (the camp captured at the end of the turn). A test that expects a claim to go through, or a refusal for a reason other than the culture, reads on that.
- The test that pays a claim exactly on the bare city seeds one culture and expects nothing left: the bare city's threshold is now two.
- `e2e/city-mode.spec.ts`, the spec that pays a claim on screen, ends one turn on the bare opening, asserts one culture in the stock and then expects the claim to go through: it needs as many ends of turn as the bare city's threshold, and the assertion reads the threshold through the rules, as the spec's own helper already does for the number the tile wears, never a literal.
- The ring opening every other city-mode spec uses now wears a two-digit threshold; the mark in `src/ui/map.ts` lays out by the number's measured width, so nothing on the screen changes shape.
- The stand-in city yields one culture a turn as the nomadic one does; no stand-in number changes.
- The dark-border fixture in `src/rules/city.test.ts` searches a thousand seeds for a chronicle and seeds its culture after; the search itself reads no threshold.

**Plan:**

1. The rule in `src/rules/city.ts`, and its tests in `src/rules/city.test.ts`: the two that assert today's curve rewritten to the new one, and every fixture seeded "enough for a claim" raised past the new threshold, `src/rules/enemies.test.ts` included. `npm test` passes.
2. `e2e/city-mode.spec.ts`, the claim it pays on screen reading the threshold through the rules.
3. The design page, the sentences above verbatim.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/city-mode.spec.ts
```
