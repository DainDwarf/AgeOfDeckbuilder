# A card knows its age

**Line:** **A card knows its age** — the rules answer the age of any card the catalogue holds, the age whose slice brought it, with no card's content declaring it; a catalogue holding a card of no age it holds is refused when it is built; one test on the fixture proves both.

**Spec:** `docs/META.md`, _The collection and the deck_. The sentence to add, after "and influence **buys** one more copy of a card owned, at the card's **price**, which is its content.": "A card is of one age, the age whose content it is."

No player-facing text: nothing on any screen reads a card's age in this line.

**Doc-impact:** `docs/META.md`.

**Scope:**

In:

- The catalogue, as it is merged, keeps the age that brought each card, and the rules answer it for a card's id.
- The coherence of it, checked where the catalogue is validated: every card the catalogue holds is of an age the catalogue holds. It is refused in the one rejection vocabulary, as every other misfit of the catalogue is.
- A card the catalogue does not hold, asked its age, is refused as any id the catalogue does not hold is.

Out:

- Any other table: a unit kind, a building, an event do not know their age. Cards are the one table with a reader.
- Any declaration of an age on a card in `src/content/`: the slice it stands in says it, and nothing else may.
- Any reader on the screen: the order of the collection is the next line's.
- The catalogue's version: no content changes, and no save is touched.

Corner cases decided here:

- A card a technology of a later age unlocks is of the age whose slice brings the card, not of the technology's.
- A hazard, a reward and an answer's card are cards of the table like any other and are of the age that brings them.
- The city section's card is a card of the table and is of its age too.

**Traps:**

- `merged` in `src/rules/catalogue.ts` already knows, table by table, which age brought each id, to refuse an id two ages bring; it forgets it when the table is returned.
- A catalogue is not always merged: tests build one by changing the fixture's, and validate it through `catalogued` directly (`src/rules/catalogue.test.ts`, `src/rules/cards.test.ts`). A test that adds a card to the table that way meets the new check, and gives its card an age as it gives it everything else; the check is never loosened for it (`DOGMAS.md`, _Testing_).
- The fixture's slices bring every table through the first age alone (`src/rules/fixtures.ts`): the test that proves a second age's card builds its own later slice, as the merge's test in `src/rules/catalogue.test.ts` does.
- The catalogue is an argument, never an import of `src/rules/` (`DOGMAS.md`, _Architecture_): the answer takes the catalogue before the card's id.
- `workflow/IDEAS.md`'s entry **An age filter on the collection screen** says no entry carries its age: the ship cuts that clause, the idea standing.

**Plan:**

1. `src/rules/catalogue.ts`: the merge keeps each card's age, the validation checks it, the rules answer it.
2. `src/rules/catalogue.test.ts`: one test on the fixture — a card the first slice brings answers the first age, a card a later slice brings answers that age, and a catalogue holding a card of no age it holds is refused.
3. Whatever fixture or test adds a card to a catalogue by hand, brought to hold under the check.
4. `docs/META.md`, the idea's clause cut, the board line deleted, this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: none; the line never reaches the screen.
- CI's on the push, listed for the hand-back: the whole suite, no spec named, since every spec boots on the catalogue.
