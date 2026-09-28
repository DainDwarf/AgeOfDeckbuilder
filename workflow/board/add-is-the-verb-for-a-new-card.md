# Add is the verb for a new card

**Line:** Add is the verb for a new card — the glossary holds the row **add**; no design page, and under `src/` and `e2e/` no identifier, comment or test title, says lay of a card, or says a card enters, joins or is brought into a chronicle, a deck or the collection; the rules' change is `added`, raised for a card an answer or the capstone adds to the draw pile and for a reward added to the discard pile alike; the two entries that said Put say Add; the screen plays as it did; `e2e/capstone.spec.ts` proves it.

**Spec:** `docs/GLOSSARY.md` is the spec, with the sentences below. Every sentence is written out; the implementer authors none.

`docs/GLOSSARY.md`:

- A new row, after **recall**: `| **add** | To put a new card on a pile or into the collection. | lay (for a card), put (for a card on a pile), gain (for a card), give (for a card), insert, shuffle in |`. The meaning lists nothing that adds a card: the user ruled that more may add one later.
- The row **place** keeps lay in its Not column.
- The row **hazard**, its meaning: "A card no deck holds: an event adds it to a chronicle's piles, and it strikes while held."

`docs/CHRONICLE.md`, _Cards_:

- "Whatever makes a card in a chronicle — the deck at the opening, an event adding one, a capture's reward — makes it at those values or sets them otherwise, …" — the rest of the sentence as it stands.
- The hazard's bullet: "It sits in no deck: an event adds a hazard to a chronicle's piles, and from there it cycles like any other card."

`docs/CHRONICLE.md`, _The schedule_: "…and a card the answer names is shown as the answer will add it: made at the counters the reading hands under the names that card declares."

`docs/CHRONICLE.md`, _Enemies and camps_: "A captured camp's **rewards** are cards added to the chronicle: the capture deals them as an event deals its answers, …" and, further in the same sentence, "…and the one chosen is added to the discard pile; …" — the rest as it stands.

`docs/DESIGN.md`, the sentence of the map's cards: "What the map holds can yield a card added to the deck for this chronicle only: a camp's capture deals its rewards."

`docs/CHRONICLE-SCREEN.md`, _The windows_: "…and what it does on this turn — how many enemies it enters, that it adds a hazard to the top of the draw pile; …"

`docs/INTERFACE.md`, _A card's names and its label_: "…— the card as the answer will add it."

`docs/META.md`, _The campaign_:

- "…cards, settle cards among them, added to the collection with the copies it names…"
- "…the technologies of the achievements it reached are learned, the cards those unlock are added to the collection, and the player gets the influence they pay; a chronicle that never ends pays nothing."

`docs/ages/NOMADIC.md`:

- _The age_: "One building exists, the one the capstone adds, and building it ends the age."
- _The events_, the opening paragraph: "…a later Lean season adds a Hunger that takes more, …"
- _The events_, Lean season: "_Share food_: the hazard **Hunger** is added to the top of the draw pile, its counter set to the food it takes, …" and "The answer names the Hunger as it will add it and says what it takes."
- _The capstone_: "When it lands it adds one card to the top of the draw pile, **Shelter**, the age's only building: …"

The two player-facing entries of `src/ui/text.ts`, their keys unchanged:

- `'answer-rules.share': 'Add [card:hunger] to the top of the draw pile. It takes {food} [food]'`
- `'capstone-rules.first-shelter': 'Add [card:shelter] to the top of the draw pile'`

The names in code: the change `laid` becomes `added`, and the reward raises `added` where it raised `discarded`. The rules helper `laid` takes a name that holds the verb add and says the top of the draw pile, the implementer's to choose; `rewarded` keeps its name, reward being the glossary's word.

**Doc-impact:** `docs/GLOSSARY.md`, `docs/CHRONICLE.md`, `docs/DESIGN.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/META.md`, `docs/ages/NOMADIC.md`.

**Scope:**

- In: the row and the sentences of Spec.
- In: the change's name in `src/rules/stages.ts` and every `switch` that names it — `src/rules/chronicle.ts`, `src/ui/hand.ts`, `src/ui/piles.ts`, `src/ui/map.ts`.
- In: the helper and every site that names it — `src/rules/schedule.ts`, `src/content/nomadic.ts`, `src/rules/fixtures.ts`, `src/rules/save.test.ts`.
- In: the reward's change. A reward is added, not discarded: the glossary's discard is from the hand. The expectations that read the stages of a take follow — `src/rules/enemies.test.ts` reads `'discarded'` after `'taken'` in three places, `src/rules/schedule.test.ts` reads `'laid'` in one and titles a test "the card discarded" of a reward. These are renames of a name the design changed, not tests weakened: what each asserts of the piles does not move.
- In: the comments and test titles that say lay of a card — `src/rules/schedule.ts` (two docblocks), `src/rules/fixtures.ts`, `src/rules/schedule.test.ts` (two titles), `src/rules/cards.test.ts` (one comment, three titles), `src/rules/enemies.test.ts` (one title), `e2e/chronicle-screen.ts` ("the card the capstone's landing lays").
- In: the two sites that say a card enters the collection — the docblock over `Technology` in `src/rules/catalogue.ts`, and the title of one test in `src/rules/campaign.test.ts`, of which the collection clause alone is reworded.
- Out: lay said of layout — "laid out", `layOutRun`, `layOutBar`, `layOutTree`, `layGrid`, `lay()`, a local `laid` holding a layout — and "lays it over" of a test's fixture in `src/rules/catalogue.test.ts`. It is not gameplay vocabulary.
- Out: `improvement-laid` and the lay of an improvement in `src/rules/cards.ts`: the line ahead on the board renames them.
- Out: enter said of a unit and of a unit card's unit ("a card enters a unit"): it is the units' word and no card's.
- Out: "brings back", of the recall instant in `src/rules/cards.ts` and its test: it is recall's paraphrase, not add's, and is reported at the hand-back as a finding for the user to `/todo` or not.
- Out: `docs/META.md`'s "never added to a civilization", of the city section: it is no card put on a pile or into the collection.
- Out: `CHANGELOG.md`, which a rename sweep skips.
- Corner, decided: the screen plays as it did. On a card added to the draw pile the piles play nothing at the change, and on a reward added to the discard pile they repaint at once, the reward on top; one change name now covers both, and which pile grew is read off the chronicle before and the chronicle after.
- Corner, decided: "to the top of" replaces "on top of" in the two entries, since add takes to.

**Traps:**

- `discarded` carries places and `laid` carried none: the reward raised `discarded` with no place, which the docblock over `Change` in `src/rules/stages.ts` still says ("and none out of no pile"). `added` carries no place, and that docblock is reworded with the change.
- `src/ui/piles.ts` plays a repaint on `discarded` and nothing on `laid`, and `src/ui/hand.ts` flies the places of a `discarded` to the discard pile, none for a reward. No spec takes a reward on screen — `e2e/camps.spec.ts` stops at the window — so the reward's play on screen is held by nothing but the implementer's reading; the Verification section says how it was kept.
- A closed set is switched: `added` is a case of every `switch` over a change's name, and the typecheck refuses a miss.
- A save holds the chronicle and no change name: nothing in the save format moves, and no save version changes.
- `src/ui/text.ts` is under the glossary lint hook, which reads a Not entry with a parenthesis as one literal and never matches it: the scoped entries of the new row flag nothing, and the two entries hold no forbidden word.
- The two lines ahead on the board edit `src/rules/cards.ts`, `src/rules/cards.test.ts` and the title of the test in `src/rules/campaign.test.ts`: this line ships after them and rewords what stands then.
- Phaser's own `add` (`scene.add`, `layer.add`) and a `Set`'s are everywhere under `src/ui/`: a search for add proves nothing, and Verify searches for what must be gone.
- Comments are for traps only: each docblock touched is shaved as it is reworded.

**Plan:**

1. `docs/` — the glossary's row and the sentences of Spec stand on the seven pages.
2. `src/rules/` — the change and the helper carry their new names, the reward raises `added`, the docblocks are reworded; the fixtures and the tests follow, titles included. `npm run check` fails on the screen's switches alone.
3. `src/content/nomadic.ts` names the new helper.
4. `src/ui/` — the three switches take the new case, the piles playing on it what they played before for each pile; the two entries of `text.ts` say Add. `npm run check` and `npm test` pass.
5. `e2e/chronicle-screen.ts` — the one comment is reworded.
6. The searches of Verify are read.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Under `src/` and `e2e/`, `'laid'` matches nothing, and `\b(lay|lays|laid|laying)\b` is read hit by hit: every hit left is of layout, of a fixture laid over, or of the improvement the line ahead renames if it has not shipped. Under `docs/`, the same search leaves layout alone, and `(enter|enters|entering|join|joins|brings)\b[^.]{0,40}\b(collection|deck|chronicle)` leaves no card. The proof spec: `npx playwright test e2e/capstone.spec.ts`, which walks the capstone's landing adding its card and the draw after it. CI's on the push: `e2e/deal.spec.ts`, `e2e/reference.spec.ts`, `e2e/landing.spec.ts`, `e2e/camps.spec.ts`, `e2e/pointer-sweep.spec.ts`.
