# A copy is bought for influence

**Line:** **A copy is bought for influence** — the rules buy one copy of a card owned for its price, refusing an unaffordable card and a card the collection owns no copy of, one test holding that on the fixture; the price under every stack of the collection, in the collection mode and in the deck editing mode, is a button on the panel's paper that buys, greyed and answering no press while its card is unaffordable, and `e2e/collection.spec.ts` buys a copy and presses a greyed button on a campaign a won chronicle paid into, reading every number from the rules.

**Spec:**

- `docs/GLOSSARY.md`, the **unaffordable** row becomes: `| **unaffordable** | What cannot be paid for: a card whose cost the city's stocks do not cover, or whose price the influence does not. | unpayable, short, lacking, too expensive |`. The forbidden list stands as it is.
- `docs/META.md`, _The collection and the deck_: after "doubled for every copy of the card owned past the first, however the copies came." add "An unaffordable card is not bought." Nothing else in the paragraph moves.
- `docs/META-SCREENS.md`, _The collection screen_:
  - In the scrolling paragraph, "and a card shown large leaves them where they stood, as a card added or removed does." becomes "and a card shown large leaves them where they stood, as a card added or removed does, and a copy bought."
  - In the collection mode's paragraph, "On the line of the count, at the stack's right edge, reads the card's price, a diamond in the accent and the number." becomes: "On the line of the count, at the stack's right edge, the card's price stands as a button on the panel's paper, a diamond in the influence's colour and the number in ink, and a press on it buys one copy of the card, which no deck holds. While the card is unaffordable the button stands greyed, its diamond and its number in the greyed ink, and answers no press."
  - In the deck editing mode's paragraph, "and under a stack reads the copies this deck holds over the copies owned, and the card's price as in the collection mode; a stack whose copies this deck all holds is dimmed, its price not." becomes: "and under a stack reads the copies this deck holds over the copies owned, beside the card's price as a button, as in the collection mode; a stack whose copies this deck all holds is dimmed, its button not, and a copy bought there is added to no deck, so the stack reads one copy more owned and stands undimmed."
- Player-facing text: none new. The button reads the existing `'collection.price': '{price}'`; the diamond is drawn, as the bar's is.
- The rules' refusal of an unaffordable card, in the one rejection vocabulary: `the influence ${influence} does not cover the price ${price} of ${card}`. A card the collection owns no copy of is refused by the price's own refusal, `the collection owns no copy of ${card}`.

**Doc-impact:** `docs/GLOSSARY.md`, `docs/META.md`, `docs/META-SCREENS.md`.

**Scope:**

- In: the rules' buy; the price under every stack turned into the button, in the collection mode and in the deck editing mode; the bar's influence, every button's state and the save following a buy at once.
- The buy: the influence falls by the card's price as it stood before the buy, the collection gains one copy of the card, dealt the next number as any new card is, and no civilization's sections change. Its price then doubles, as the price rule already answers.
- The button's look, as the user settled it: the live button's ground is the panel's paper (the navbar's and the bar's fill), its number in ink, its diamond in the influence's colour — never the accent. The greyed button's ground is the greyed fill of the launch screen's Continue, its diamond and its number in the greyed ink. The button has no edge and raises no tooltip.
- The pointer is the hand over a live button and the arrow over a greyed one; a greyed button answers no left click. A right click and a rest on either answer nothing.
- A press held on a button drags the panel, as on the panel's bare ground: the button carries nothing. Only a left click buys.
- In the deck editing mode the button stands undimmed on a dimmed stack. A buy there adds the copy to no deck: a stack whose copies the deck all held now holds one free, so it reads one copy more owned, stands undimmed, and its card answers the press and the carry again.
- A buy leaves both panels scrolled where they stood, as an add or a remove does.
- A buy with a chronicle in the save changes nothing of that chronicle; buying raises no warning (both already on the pages).
- Out: the civilization mode and its buy-and-add press, which are later lines; the bar's own diamond and every other diamond, whose sentences stay as they are; any sound or motion on a buy.

**Traps:**

- The bar reads the influence once, in `wearNavbar` (`src/ui/navbar.ts`), and the collection screen's `lay` redraws its panels alone: a buy that leaves the bar reading the old influence passes every screen check but the bar's.
- A stack's `Held` box is the card alone; the count's line lies under it, outside every box. The button is a thing of its own the panel answers, with a press and no carry, so the panel's drag start grabs the scroll on it. A greyed button hands no press: the panel reads the hand from a press being there, and a click with none does nothing. Every button's state is read on the campaign the lay draws, so a buy that makes another card unaffordable greys its button at the redraw.
- The rules refuse the unaffordable buy themselves; the greyed button is the UI's reflection of that rule, never its enforcement (`DOGMAS.md` _Design principles_).
- The colours are existing `LOOK` roles: `panelFill` for the ground, `ink` for the number, `influence` for the diamond, `greyedFill` and `greyedInk` for the greyed button. The influence's colour and the accent hold one value today and are separate roles; the diamond takes `influence`. No new entry.
- The diamond is drawn through `chipAt` (`src/ui/resource-bar.ts`), in the colour handed.
- The button's ground is taller than the count's text: the count and the button share one line within the stack's width — in the deck editing mode's longer count too, with a price of three digits — and a line's foot is the button's bottom, so the next line of stacks stands clear of it. `docs/PHASER.md` for what the text and the shapes do at render.
- A new card's number comes from `dealt` (`src/rules/campaign.ts`), and the campaign's `nextCard` advances with it.
- The rules test builds its campaign with influence through `paidInto` on the fixture, as `src/rules/campaign.test.ts`'s price test already does; no influence is written into a campaign.
- The spec's campaign is `wonCampaign()` (`e2e/chronicle-screen.ts`), planted with `plantCampaign` as `e2e/campaign.spec.ts` does; it reads the save with the helpers `e2e/deck-editing.spec.ts` uses. The card it buys and the card it finds unaffordable are searched from the rules' prices against that campaign's influence, never named: a search that finds neither is a finding.
- `e2e/collection.spec.ts` names the price's text `collection-card-${id}-price` and its diamond `collection-card-${id}-price-chip`; the button's ground is named `collection-card-${id}-buy`.

**Plan:**

1. `src/rules/campaign.ts`, `src/rules/campaign.test.ts`: the buy; leaves the rules buying a copy, with one test on the fixture — the influence falls by the price, the collection gains one copy dealt the next number and no section changes, the price doubles after it, an unaffordable card refused, a card not owned refused.
2. `src/ui/collection-screen.ts`, `src/ui/navbar.ts` as the bar needs: the price as the button in the two modes, its greyed state, the buy written through the save, the bar following it; leaves the screen buying.
3. `e2e/collection.spec.ts`: one test — on the won campaign, the collection mode's pointer is the hand over a live button; a click on it buys: the bar reads the influence less the price, the stack reads one copy more, its button reads the doubled price, the save holds the campaign the rules' buy makes; over a greyed button the pointer is the arrow, and a click on it changes neither the bar nor the save.
4. `docs/GLOSSARY.md`, `docs/META.md`, `docs/META-SCREENS.md`: the sentences above; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/collection.spec.ts`. CI's on the push: `e2e/deck-editing.spec.ts`, whose stacks now carry the button, and the rest of the suite. Then the `visual-check` skill on the collection screen in both modes: a live and a greyed button on the count's line, a three-digit price beside the deck editing mode's count, the lines of stacks clear of the buttons.
