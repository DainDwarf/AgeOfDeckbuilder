# A technology unlocks only a card a section holds

**Line:** A technology unlocks only a card a section holds — the catalogue refuses a technology that unlocks a hazard or a camp's reward, and the reading of a campaign's save drops a collection copy of either, a section entry naming that copy going with it; `docs/META.md` says the collection holds only cards a deck may hold. Done when a rules test on the fixture proves each door: a catalogue whose technology unlocks the fixture's hazard, and one whose technology unlocks the fixture's camp's reward, are refused where they are built; a save whose collection holds a copy of either reads back without it, the reasons dropped naming the copy and the section entry that held it. Proof: none on screen, since no content reaches either door.

**Spec:** [`docs/META.md`](../../docs/META.md) → _The collection and the deck_ (any card of the collection is added to a deck) and _The save_ (the campaign's save drops what it cannot resolve). [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md): **hazard** ("a card no deck holds"), **reward**. [`docs/DESIGN.md`](../../docs/DESIGN.md) → "The map is the draft" (a camp's reward is added for this chronicle only).

Sentences to change in `docs/META.md`:

- _The collection and the deck_, first paragraph: after "A card is of one age, the age whose content it is." add "The collection holds only cards a deck may hold: a hazard and a camp's reward are a chronicle's alone."
- _The save_, first paragraph: "The campaign's save survives a content change by dropping what it cannot resolve, a card the catalogue no longer holds among it, and a city section it cannot resolve is the one its civilization was authored with again; a save that is not a campaign's shape at all is refused, a new campaign opened, and the boot says why on the browser's console alone." becomes "The campaign's save survives a content change by dropping what it cannot resolve, a card the catalogue no longer holds among it, and a copy of a card the collection may not hold; a city section it cannot resolve is the one its civilization was authored with again; a save that is not a campaign's shape at all is refused, a new campaign opened, and the boot says why on the browser's console alone."

Player-facing entries: none. The reasons a save drops are said on the browser's console, in the rejection vocabulary the save's reading already uses.

**Doc-impact:** `docs/META.md`.

**Scope:**

In:

- The catalogue: a technology whose unlocks name a card no section of a civilization may hold — a hazard, an age's camp's reward — is refused when the catalogue is built, as a civilization authored with one already is.
- The save's reading: a collection copy of a card no section may hold is dropped with its reason, as a copy of a card the catalogue no longer holds is; a section entry numbering that copy is then dropped as naming no card of the collection.

Out:

- The screen: the deck editing mode keeps offering a press on every stack with a copy free. With both doors closed, every such press is one the rules accept.
- Buying: a later line; it buys a copy of a card owned, so it opens no third door.

Corner cases decided:

- A card turned into a hazard or a camp's reward by a later content version leaves an old save with its copies gone from the collection and from every deck, each drop named on the console. The player earned those copies; the card is no longer one a deck may hold, and nothing else can be done with it.
- A new campaign's collection is its first civilization's authored sections, which the catalogue already checks; it is no third door.

**Traps:**

- `src/rules/save.test.ts` → "a hazard or a camp’s reward in the deck is dropped from it and kept in the collection" states the promise this line overturns: the copies now leave the collection, and the section entries' reasons become the one for a number the collection does not hold. That test is rewritten to the new promise, not deleted; the user decided the change at intake.
- `misfitIn` (`src/rules/catalogue.ts`) answers for a section, and a collection copy stands in none: the section a card would go to is already decided by kind in `src/rules/campaign.ts`, privately. One routing, not two.
- `src/rules/save.ts` reads the collection before the sections, so the copy is dropped first and the section entry's own misfit is never reached.
- The real content unlocks no such card, and `src/content/catalogue.test.ts` must keep building it.

**Plan:**

1. `src/rules/catalogue.ts`, `src/rules/catalogue.test.ts`: the refusal of a technology unlocking a card no section may hold, proven on a fixture catalogue for the hazard and for the camp's reward.
2. `src/rules/save.ts`, `src/rules/save.test.ts`: the collection copy dropped with its reason, the section entry with it; the test in Traps rewritten to the new promise.
3. `docs/META.md`: the two sentences above. `workflow/BOARD.md`: the line deleted, and this file with it.

**Verify:** `npm run fmt`, `npm run check`, `npm test`, `npm run lint`. Proof spec: none — no content reaches either door. CI's on the push, which read a save at boot: `e2e/boot.spec.ts`, `e2e/refused-save.spec.ts`, `e2e/manage-save.spec.ts`, `e2e/resume.spec.ts`, `e2e/collection.spec.ts`, `e2e/deck-editing.spec.ts`.
