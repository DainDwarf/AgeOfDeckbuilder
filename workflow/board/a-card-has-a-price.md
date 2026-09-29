# A card has a price

**Line:** **A card has a price** — every age declares a base price, the catalogue refuses one that is not a whole number of at least 1, the rules answer a card's price as its age's base price doubled for every copy owned past the first, one test holding that on the fixture, and the price reads under every stack of the collection, in the collection mode and in the deck editing mode, `e2e/collection.spec.ts` reading it from the rules.

**Spec:**

- `docs/META.md`, _The collection and the deck_. The clause "and influence **buys** one more copy of a card owned, at the card's **price**, which is its content." becomes: "and influence **buys** one more copy of a card owned, at the card's **price**: the **base price** of the card's age, doubled for every copy of the card owned past the first, however the copies came. 🔧 An age's base price is its content." Nothing else in the paragraph moves.
- `docs/GLOSSARY.md`, a row after **price**: `| **base price** | The price of a card owned once, which the card's age sets for all its cards. | base cost, starting price, flat price |`. The **price** row stands as it is.
- `docs/META-SCREENS.md`, _The collection screen_.
  - In the collection mode's paragraph, after "every card owned stands once, as a stack of its copies with the count of them under it, six stacks to a line, the lines centred in the panel.", add: "On the line of the count, at the stack's right edge, reads the card's price, a diamond in the accent and the number."
  - In the deck editing mode's paragraph, "The collection stands four stacks to a line, and under a stack reads the copies this deck holds over the copies owned; a stack whose copies this deck all holds is dimmed." becomes: "The collection stands four stacks to a line, and under a stack reads the copies this deck holds over the copies owned, and the card's price as in the collection mode; a stack whose copies this deck all holds is dimmed, its price not."
- Player-facing text, one entry in the text table: `'collection.price': '{price}'`. The diamond is drawn, as the bar's is; it is no character of the entry.
- The catalogue's refusal, in the one rejection vocabulary: `the age ${id} sets a base price of ${basePrice}`.
- The rules' refusal of a price asked of a card the collection owns no copy of: `the collection owns no copy of ${card}`.

**Doc-impact:** `docs/META.md`, `docs/GLOSSARY.md`, `docs/META-SCREENS.md`.

**Scope:**

- In: the base price on the age's content; the Nomadic Age's base price, 1; the coherence refusal; the price in the rules; the reading under a stack in the two modes that show the collection.
- Out: buying, the button, a price greyed while the influence is short — the next line's. The price reads as plain text here and answers no press and no pointer. The civilization mode. Any price on a card itself: no card declares one, and no per-card override exists.
- The price is base price × 2^(copies owned − 1): owning 1, the price is the base price; owning 2, twice; owning 3, four times; owning 4, eight times. Copies the opening deck or a technology added count as copies bought do; the save holds nothing new.
- No cap on copies: the price keeps doubling.
- A card the collection owns no copy of has no price: the rules refuse the question. The city section's card, a hazard and a camp's reward stand in no collection and so have none.
- The Stone Age's base price, 1, lands with the Stone Age's content, not here. The numbers are temporary and stand in the content; no page names one.
- The mockup, `workflow/board/collection-screen-mockup.html`, already runs this formula and shows where the price stands; its button is the next line's, this line draws the diamond and the number in the same place without the button's ground.

**Traps:**

- `Age` is built whole in two places only, `src/content/nomadic.ts` and `agesOver` in `src/rules/fixtures.ts`; every other site spreads an existing age, so a required field reaches them through those two.
- The fixture's ages take base prices of the fixture's own, not all the same and none equal to the Nomadic Age's 1 alone, so the mechanism's test tells an age's base price from another's; the test reads no number from `src/content/`.
- The catalogue is an argument: the price is asked with the catalogue before the campaign, and `src/rules/` imports no content.
- A price grows past three digits on a card owned many times over (owned 8, the price is 128 × base): the reading under a stack holds the count at its left and the price at its right on one line of a card's width, in the deck editing mode's longer count too. `docs/PHASER.md` for anything the text or the drawn diamond does at render.
- The diamond is the bar's: the influence reading of the navbar's bar already draws one in the accent, in `src/ui/`; the price's is that one drawn again, never a second shape.
- `e2e/collection.spec.ts` names the stack's count `collection-card-${id}-copies`; the price is named `collection-card-${id}-price` beside it.
- A spec reads its oracle from the rules: the price it expects is the rules' answer on the campaign it wrote, never a literal.

**Plan:**

1. `src/rules/catalogue.ts`, `src/content/nomadic.ts`, `src/rules/fixtures.ts`, `src/rules/catalogue.test.ts`: every age declares its base price and the catalogue refuses a bad one; leaves the catalogue built and validated with a base price on every age, and one test of the refusal.
2. `src/rules/campaign.ts`, `src/rules/campaign.test.ts`: the price of a card of the collection; leaves the rules answering it, with the one test on the fixture — the base price owning one copy, doubled for each copy past it, another age's base price for a card of that age, copies a paid chronicle added counted, and the refusal for a card not owned.
3. `src/ui/text.ts`, `src/ui/collection-screen.ts`: the reading under a stack in the two modes; leaves the screen showing the price.
4. `e2e/collection.spec.ts`: the first test also reads each stack's price against the rules' answer.
5. `docs/META.md`, `docs/GLOSSARY.md`, `docs/META-SCREENS.md`: the sentences above; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/collection.spec.ts`. CI's on the push: `e2e/deck-editing.spec.ts`, which walks the deck editing mode's stacks, and the rest of the suite. Then the `visual-check` skill on the collection screen in both modes, the count and the price on one line.
