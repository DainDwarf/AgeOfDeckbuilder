# Cards join the catalogue

**Line:** **Cards join the catalogue** — the cards and the decks move into the catalogue, each card a plain value whose closures name content through the rules' helpers, which resolve every id at play; the camp's gift moves in with them; a deck is a list of card ids the validator resolves and refuses a hazard or the gift in; the fixture catalogue carries cards and a deck of its own, the stand-in's coherence test checks every card's name and rules text and asks every card its refusal and its admitted tiles on a founded chronicle; and the "data owns its behaviour" dogma returns. Doc-impact: `docs/DOGMAS.md`.

**Spec:** `docs/DOGMAS.md`, _Code_ and _Stack_; the whole line lands on the units line's catalogue and the map line's, and copies their pattern.

- `docs/DOGMAS.md`, _Code_: one bullet is inserted immediately before "**An aim predicate and an effect closure are pure over the chronicle**", verbatim: "**Data owns its behaviour.** A card carries its aim and its effect as closures the rules call and never read into: a play resolves through the card's own aim and pays through its own cost, and no rule switches on a card's id or reads a card's fields to decide what it does. A new mechanic is a helper in `src/rules/` that content composes into a closure, never a branch in `apply`. The ids a closure names are resolved by those helpers when the card is played, not when the catalogue is built: a closure is opaque, and a card written as a recipe signed at construction was rejected as ceremony for the cards that name no id. Why: a branch on an id is a second home for the card's behaviour, and the two drift."
- `docs/DOGMAS.md`, _Stack_, the first bullet under the table, as the map line left it: the phrase "the unit kinds, the enemy scripts, what a camp enters, the terrains and the layers a tile is made of, the biomes and the regions, and what the later content brings" becomes, verbatim, "the unit kinds, the enemy scripts, what a camp enters and what its capture gives, the terrains and the layers a tile is made of, the biomes and the regions, the cards and the decks, and what the later content brings". Nothing else on the page changes.
- `IDEAS.md`, the entry "**Deferred dogmas return with their objects**": the clause "_data owns its behaviour_ comes back with the card model; " is deleted, the rest of the entry untouched. Task context, not a docs page.
- No other `docs/` page changes: `docs/CHRONICLE.md`'s three "until the deck is data" sentences name the whole rung, which the Nomadic Age closes, and stay. No player-facing sentence: nothing on screen changes, and no text entry is added.

**Doc-impact:** `docs/DOGMAS.md`.

**Scope:**

In:

- The `Catalogue` type, in `src/rules/catalogue.ts`, gains two tables and one entry, every id an open `string`:
  - `cards: Record<string, Card>`, the `Card` type of `src/rules/cards.ts` as it stands after the units line: `kind`, `cost`, `singleUse`, and the aim's closures or the hazard's `strikes`, every closure taking the catalogue before the chronicle. A card is a plain value; nothing about it is built by the constructor.
  - `decks: Record<string, readonly string[]>`, a deck one list of card ids and nothing more; the settle line adds the settle section when the first settle card exists.
  - `camp` gains `gift: string`, the card its capture lays in the discard pile.
- `catalogued` validates the new content, every refusal through the units line's one refusal function: every id of every deck resolves to a card; no deck holds a card of the hazard kind; no deck holds the camp's gift; `camp.gift` resolves to a card. A card's closures are not run and not inspected: what they name is the helpers' to resolve at play. Two lookups that throw on an unknown id, `cardOf(catalogue, id)` and `deckOf(catalogue, id)`, in the shape the earlier lookups took.
- `src/rules/cards.ts` keeps the mechanism and loses the content: `CARD_KINDS`, the `Aim`, `Card` and `AimedCard` types, `aimOf`, `leavesChronicle`, `struck(catalogue, chronicle)` and `refuses(catalogue, chronicle, card, tile)` stay; `CARDS`, `DECKS`, `DeckId`, `FOUNDING_CARDS` and `copies` go; `CardId` in `state.ts` becomes a `string` alias, its union and the `PH_` comment gone. The helpers a card is composed of are exported and are the whole vocabulary content writes a card in: `enters`, `throughWorker`, `firstRefusal`, `worked`, `inside`, `made`, `slotFree`, `unimproved`, `unitThere`, `movePointsSpent`, `built`, `improved`, `terraformed`, `refreshed`, `recalled`, `gained`. Every helper that takes an id or a list of ids resolves each through the catalogue's lookups before it reads or writes — `built` its building, `improved` its improvement, `terraformed` its terrain, `made` the terrains it is handed, `enters` its unit kind through `entered` — so the one door for an id a closure names is the helper, whether the closure reads the id or writes it onto the state; a helper that needs the catalogue takes it first, as every rules function does.
- `src/rules/chronicle.ts`: `costOf(catalogue, id)`, `refusalOf(catalogue, chronicle, id)`, `admitted(catalogue, chronicle, card)`, `blocked`, `play`, `aimedEffect` and `struck`'s caller read a card through `cardOf`; `captures` lays `catalogue.camp.gift`. `beginChronicle(catalogue, seed, deck, map)` keeps `deck` a list of card ids, state-shaped as the map is: it is not validated, and the card lookup throws at the first read of an id the catalogue lacks. `launched` passes it on unchanged.
- `src/content/stand-in.ts`: `STAND_IN` gains the eleven cards with the numbers `CARDS` holds today, written through the exported helpers, two decks `PH_Deck` and `PH_LongDeck` — two and five copies of the nine founding cards, in today's order — and `camp.gift: 'PH_Spoils'`. Its coherence test grows twice: every card has a name and a rules entry in the text table, read through the same lookups the screen uses; and, on a chronicle launched from the stand-in's region on a fixed seed with each of its decks in turn, every card of the catalogue answers `refusalOf`, and every card aimed at a tile or a unit answers `admitted`, without throwing — every aim's lookups run at test cost, no scenario per card.
- `src/rules/fixtures.ts`: `CATALOGUE` gains the same eleven card ids, the fixture's own, numbers frozen at today's, written through the same exported helpers; one deck `deck`, the ten cards `DECK` lists today, `DECK` staying the list the tests hand the opening; `camp.gift: 'PH_Spoils'`. `everyCard` and `fullDraw` answer strings. Tests call `costOf`, `refusalOf` and `admitted` with `CATALOGUE` explicit, as they call `apply`.
- `src/rules/catalogue.test.ts` gains: a catalogue whose deck names a card it lacks, whose deck holds a hazard, whose deck holds the camp's gift, or whose camp's gift it lacks, is refused; a coherent one builds. `src/rules/cards.test.ts` gains one test on the helpers' door: a fixture card built through `built`, `improved` or `terraformed` with an id the catalogue lacks, played on a tile its aim admits, throws with the refusal vocabulary. The test "the deck the game ships with founds a chronicle that draws a full hand" reads the fixture's deck; "no deck a chronicle is founded on holds a card of the hazard kind" in `cards.test.ts` and "no deck a chronicle is founded on holds the camp's reward card" in `enemies.test.ts` go: the validator holds both rules now.
- UI: `cardFace(catalogue, id)` in `card-face.ts`; the hand's two `aimOf` reads, the overlay's `cardsOf` sort and the aim line's sentence read the card and its name through the lookups; the scene threads the catalogue it already holds. `text.ts` gains a card name lookup and a card rules lookup that take an open id and throw when no entry names it, on the unit name lookup's precedent; `eventFace` is untouched.
- `src/main.ts`: `askedDeck` resolves a deck id through `deckOf` when the stand-in holds it, else splits the list and checks each id through `cardOf`; the address's `?deck=` keeps both forms.
- e2e: every `DECKS.PH_Deck` and `CARDS[id]` in the specs and `e2e/chronicle-screen.ts` reads `STAND_IN` through the lookups; `open` and `openOnCapstone` take a deck id or a list of ids as strings.

Out:

- The schedule's entries stay module constants; the schedule line follows. The famine's hazard is a card literal inside `schedule.ts` until then.
- Settle cards, the deck's second section: the settle line's.
- No number and no behaviour changes: every existing test yields the same stages on the fixture catalogue as before, and a difference in `npm test` is a defect of the change.

Corner cases decided: an id in a pile the catalogue lacks throws at its first read — the face, the strike, the play — and never falls back; the deck handed to the opening is state and is not validated, as the map is not; the camp's gift may be a card of any kind, resolution is all the validator asks; an empty deck is content, not a refusal; `made` resolving its terrains on every refuse call is an accepted cost, uniformity over a shortcut. The user chose to check what a closure names at play, through the helpers, over a card written as a recipe signed at construction; the dogma bullet above records the choice.

**Traps:**

- The units line and the map line ship first, and this line builds on their `catalogue.ts`, refusal function, `STAND_IN`, `CATALOGUE`, `launched` and text lookups; the ship session reads that code once, at the ship, and this dossier names shapes, not lines.
- `PH_Famine.lands` in `schedule.ts` lays the literal `'PH_Hunger'`, and `enemies.test.ts` reads `'PH_Spoils'` off the discard pile by literal: the fixture's hazard keeps the id `PH_Hunger` and its gift `PH_Spoils`, both the fixture's own cards.
- `TextKey` in `text.ts` is a closed union of keys, so a template key over an open id does not typecheck: the two lookups are the way through, and `text.ts` is hook-linted for glossary synonyms — no sentence is added.
- `tsconfig.json` sets `noUnusedParameters`: a closure that takes the catalogue and ignores it names the parameter with a leading underscore.
- `biome.json` sets `noImportCycles` with `ignoreTypes: false`, so a type-only import counts as a cycle: `Card`'s closures take `Catalogue` and `Catalogue` holds `Card`, so the two types share a module, as `Catalogue` and `EnemyScript` already share `catalogue.ts`.
- The e2e helpers find cards by literal id (`chronicle.hand.indexOf('PH_Worker')`); that is content read against the stand-in and stays.
- `overlay.ts` sorts the draw pile by `CARD_KINDS.indexOf(card.kind)`; `CARD_KINDS` stays in the rules, the card comes through the lookup.
- `docs/DOGMAS.md`'s bullets are one line each; `npm run lint` refuses a wrapped one.
- The boot and the card face are paths every spec walks, so the verify list below is long on purpose.

**Plan:**

1. `src/rules/catalogue.ts`: `cards`, `decks`, `camp.gift`, the validator's checks, the two lookups.
2. `src/rules/cards.ts` and `src/rules/state.ts`: the content out, the helpers exported and resolving their ids, `struck` and `refuses` taking the catalogue, `CardId` open.
3. `src/rules/chronicle.ts`: the card reads through `cardOf`, `captures` on `catalogue.camp.gift`.
4. `src/content/stand-in.ts` and its test.
5. `src/rules/fixtures.ts`, `catalogue.test.ts`, `cards.test.ts`, `enemies.test.ts`, and every rules test the typecheck names.
6. `src/ui/text.ts`, `card-face.ts`, `hand.ts`, `overlay.ts`, `aim-line.ts`, the scene; `src/main.ts`; `e2e/chronicle-screen.ts` and the specs.
7. `docs/DOGMAS.md` and `IDEAS.md`, the bullet, the phrase and the clause written out under _Spec_.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then one at a time: `npx playwright test e2e/boot.spec.ts`, `npx playwright test e2e/refuse.spec.ts`, `npx playwright test e2e/press.spec.ts`, `npx playwright test e2e/recall.spec.ts`, `npx playwright test e2e/browse.spec.ts`, `npx playwright test e2e/worker-instants.spec.ts`, `npx playwright test e2e/harvest.spec.ts`, `npx playwright test e2e/camps.spec.ts`.
