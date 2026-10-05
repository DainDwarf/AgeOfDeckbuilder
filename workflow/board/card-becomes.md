# A card becomes another

**Line:** **A card becomes another** — a card may carry the keyword becomes and name another card: played, it goes to the discard pile as that card, and that card played goes there as the first again; the catalogue refuses a pair it cannot hold; the rule is held by tests on the fixture and no content of an age uses it yet. Doc-impact: `docs/CHRONICLE.md`, `docs/META.md`, `docs/GLOSSARY.md`.

**Spec:**

- `docs/CHRONICLE.md` → _Cards_, the opening paragraph. After the sentence ending "discarded unplayed, it comes around like any other." add: "**Becomes** is a keyword too: a card that carries it names another card, and played, it goes to the discard pile as that other card, made as its content makes it; that other, played, goes there as the first again. Neither leaves the chronicle, and either one discarded unplayed comes around as it is. The card named is a chronicle's alone, as a hazard is: no deck holds it and no technology unlocks it."
- `docs/META.md` → _The collection and the deck_. "The collection holds only cards a deck may hold: a hazard and a camp's reward are a chronicle's alone." becomes "The collection holds only cards a deck may hold: a hazard, a camp's reward and the card another card becomes are a chronicle's alone."
- `docs/GLOSSARY.md`, a row after **single use**: `| **become** | A keyword on a card: played, it goes to the discard pile as the card it names, and that card played as the first again. | turn into, flip, transform (for a card), toggle |`
- No player-facing sentence: no card of an age carries the keyword in this line. A card's text says the keyword in its own entry, as "Single use." is said, and that is the content line's.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/META.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the rule in the play, the catalogue's coherence for the pair, the fixture's pair of cards, the tests.
- Two faces only, the user's sizing: a **front**, which a deck holds, a technology unlocks and the collection shows, and a **back**, which is a chronicle's alone. No chain of three or more.
- Each face is a card of the catalogue in its own right: its own cost, its own aim and effect, its own text entries. Becoming is the play's, never an effect that removes one card and adds another: the card must not pass through "left the chronicle", because a later age brings a card that takes back what left.
- The other face is made as its content makes it: at the counters it declares, whatever counters the played face carried.
- The reconcile's choice: where a played card goes is one decision with three answers — the discard pile as itself, out of the chronicle, the discard pile as its other face — made in the one place the play makes it today.
- The catalogue refuses, when it is built: a card naming a card the catalogue does not hold; a back in any section of a civilization; a back a technology unlocks; a back that is a camp's reward; a card that is the back of two fronts, or a front and a back of different pairs; a front that is single use, a settle card or a hazard, and a back that is one. One rejection vocabulary, as every refusal there.
- A back is priced and bought by nothing: it never reaches the collection.
- Out: any card of an age, any text entry, anything on screen. A pile's browse and the discard pile's top card already draw a card by what it is, so the back needs nothing of them here.
- Saves from before this line need no care.

**Traps:**

- `leavesChronicle` in `src/rules/cards.ts` and `play` in `src/rules/chronicle.ts` hold today's two answers, and `heldByNoDeck` / `misfitIn` in `src/rules/catalogue.ts` hold what no deck holds; `treeHeld` there is where a technology's unlocks are refused.
- The change names are the closed sets `src/rules/stages.ts` holds, and `src/ui/` switches over them with no default: a new change name ripples into every listener. The architecture names a change for the row that moved and reads the rest off the chronicles before and after, so the hand-to-discard-pile move may well be the change it is today.
- The campaign's save drops "a copy of a card the collection may not hold" at the boot through the same question (`src/rules/save.ts`), so a back answers there with no new code or it is a deviation to report.
- The catalogue's coherence test (`src/content/catalogue.test.ts`) reads every card id through the screen's lookups; the fixture's pair lives in `src/rules/fixtures.ts`, not in an age.
- `DOGMAS.md` _Architecture_: no rule switches on a card's id. The keyword is a declaration on the card that the play reads, as single use is.

**Plan:**

1. `src/rules/catalogue.ts`: the declaration on a card and the catalogue's refusals — leaves a catalogue that holds a pair or refuses it by name.
2. `src/rules/cards.ts`, `src/rules/chronicle.ts`: the play's third answer — leaves a played front lying on the discard pile as its back, and a played back as its front.
3. `src/rules/fixtures.ts` and the tests beside the rules: a fixture pair; one test that a front played lies on the discard pile as its back and comes around as it, and the back played as the front again; one that a face discarded unplayed stays the face it was; the catalogue's refusals, each by its message.
4. The three `docs/` edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No proof spec: the line never reaches the screen. CI proves the whole suite on the push; the specs that walk a play to the discard pile are `e2e/hand-aim.spec.ts`, `e2e/browse.spec.ts`, `e2e/worker-instants.spec.ts` and `e2e/heal.spec.ts`.
