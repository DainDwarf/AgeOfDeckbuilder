# The code says civilization

**Line:** The code says civilization — nothing under `src/` or `e2e/` calls the whole a chronicle is launched on a deck: the catalogue's table, the campaign's field, the save's field, the launch page's row and every helper, type, comment and refusal that names it say civilization, and deck names its cards alone; the game plays as it did; `npm run check`, `npm test` and `npm run lint` pass, and `e2e/menu.spec.ts` passes.

**Spec:** `docs/GLOSSARY.md`, the rows **civilization**, **deck**, **settle section** and **city section**; `docs/DESIGN.md` → _Launching a chronicle_; `docs/META.md` → _The collection and the deck_. They are written and stand; this line brings the code to them.

- `docs/INTERFACE.md` → _The launch page_. Replace "one row per choice — the age, the region, the deck and the seed" with "one row per choice — the age, the region, the civilization and the seed".
- Player-facing text, `src/ui/text.ts`: the entry `'launch.deck': 'Deck'` becomes `'launch.civilization': 'Civilization'`. No other entry changes.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

In:

- A rename and nothing else. The whole — a city section, a settle section and cards, which the catalogue lists, a campaign is opened on and a chronicle is launched on — is a civilization everywhere it is named: types, functions, fields, parameters, fixtures, test titles, comments, refusal messages, object names the specs read.
- The word deck stays wherever it names the cards: a card of the deck, a hazard no deck holds, a reward joining the deck, the deck's order, the deck's settle cards.
- The save's text follows: the campaign's field and the chronicle's field that named a deck name a civilization.
- The launch page's third row is the civilization row, its label the new entry, its options the ids it lists today.

Out:

- Any change of behaviour. The campaign still holds one civilization, unnamed; the launch page still lists the catalogue's; the chronicle still launches on the catalogue's. Those change in the line after this one.
- `CHANGELOG.md`, which keeps its words.
- The game's name in `navbar.title`, and `tools/itch.ts`.

Corner cases decided:

- A save written before this line names a deck: its chronicle is dropped and its campaign refused, a new one opened, each with its reason on the console. Nothing deployed holds one, and no test is added for it.
- Whether the deck is an object of its own inside a civilization, holding the settle section and the cards, or the two sections stand beside the city section, is the implementer's; either way no name calls the whole a deck.

**Traps:**

- The word is in 35 files, about 320 times, and most of them name the whole. Each one is read: a blind replace renames the ones that name the cards, and the glossary lint does not tell the two apart.
- The catalogue's refusals are built from the table's name and the kind's word; tests assert refusal messages verbatim, in `src/rules/catalogue.test.ts` and `src/rules/save.test.ts`.
- The specs read the launch page's objects by name, the row's among them (`e2e/menu.spec.ts`); the names and the spec move together.
- `docs/` is already in the new words; a page edited to match a name the code kept is the dogma's defect, never the fix.
- Comments touched are re-shaved to their trap as they are renamed.

**Plan:**

1. `src/rules/catalogue.ts`, `src/content/nomadic.ts`, `src/rules/fixtures.ts` and the rules tests that name the table: the catalogue lists civilizations. Leaves the rules tests green.
2. `src/rules/chronicle.ts`, `src/rules/campaign.ts`, `src/rules/save.ts`, `src/rules/state.ts` and their tests: a campaign is opened on a civilization and holds one, a chronicle is launched on one, the save names one. Leaves the rules tests green.
3. `src/ui/save-entry.ts`, `src/ui/chronicle-scene.ts`, `src/ui/launch-page.ts`, `src/ui/text.ts`: the launch's third choice is the civilization. Leaves the typecheck green.
4. `e2e/chronicle-screen.ts` and the specs that name the whole. Leaves `e2e/menu.spec.ts` passing.
5. `docs/INTERFACE.md`'s sentence; the board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- A search of `src/` and `e2e/` for the word, every hit left naming the cards; the report lists the hits kept, by file.
- Proof: `npx playwright test e2e/menu.spec.ts`.
- CI's, for the hand-back: every other spec, the helpers in `e2e/chronicle-screen.ts` being every spec's door; `campaign`, `continue`, `resume`, `settle`, `browse`, `press`, `reference`, `tree` and `refuse` name the word themselves.
