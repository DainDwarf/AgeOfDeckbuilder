# Rethink the card kinds

**Line:** **Rethink the card kinds** — the kinds are settle, unit, building, action, instant and hazard: an action card is one a unit's action goes to, labelled Worker action where it names the worker and Action where it names no unit; a building card leaves the chronicle once played by its kind and carries no single use; the rewards stay instants; every card of both ages stands under its kind, the catalogue's coherence test passes and the pages say so. Doc-impact: `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/DESIGN.md`, `docs/META-SCREENS.md`, `docs/MAP.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Spec:**

`docs/CHRONICLE.md`, _Cards_:

- "Five kinds, four of them the player's own." becomes "Six kinds, five of them the player's own."
- "Every kind cycles: played or discarded, a card goes to the discard pile and comes around again. The deck's settle cards are the exception: in hand when the chronicle opens, played on the settle phase alone, they never cycle — a settle card leaves the chronicle once played, and the end of the settle phase takes the ones left in hand." becomes "Every kind cycles: played or discarded, a card goes to the discard pile and comes around again. Two kinds leave the chronicle once played instead, the settle cards and the building cards, as their entries say; a building card discarded unplayed comes around like any other. The deck's settle cards never cycle: in hand when the chronicle opens, played on the settle phase alone, a settle card leaves the chronicle once played, and the end of the settle phase takes the ones left in hand."
- The Building entry's last sentence, "🔧 A building card that carries single use builds once: the copies a deck holds are how many of that building the city can build, and a copy bought in the meta makes the city bigger." becomes "A building card builds once: played, it leaves the chronicle instead of going to the discard pile, so the copies a deck holds are how many of that building the city can build, and a copy bought in the meta makes the city bigger; it carries no keyword for it, leaving being the kind's own."
- A new entry after Building and before Instant: "**Action** — a card a unit's action goes to: played through a unit standing on the tile it is aimed at or beside it, which spends one of its action, and what it does is content. The card names the unit it is played through, and its label reads that name before the kind's; one that names none is played through any unit."
- The Instant entry becomes "**Instant** — an immediate effect that no unit's action goes to, and what it does is content."

`docs/GLOSSARY.md`:

- The **action** row's meaning becomes "A unit's stat and the pool it refreshes to: what it spends to attack or on a card played through it; also the kind of card a unit's action goes to." Its Not column stays.
- The **instant** row's meaning becomes "A card with an immediate effect that no unit's action goes to." Its Not column becomes "spell, effect card".

`docs/DESIGN.md`, _The chronicle_: "it is the age of the fewest verbs: units and instants, one building" becomes "it is the age of the fewest verbs: units, actions and instants, one building".

`docs/META-SCREENS.md`, _The collection screen_: "then by kind — settle, unit, building, instant — then by name" becomes "then by kind — settle, unit, building, action, instant — then by name".

`docs/MAP.md`, the Improvement bullet: "what a worker places on a tile through an instant" becomes "what a worker places on a tile through an action card".

`docs/ages/NOMADIC.md`, _The cards_: "**Gather**, the age's card, costing nothing:" becomes "**Gather**, the age's card, a worker action costing nothing:"; "**Hunt**, an instant costing nothing, played through a worker" becomes "**Hunt**, a worker action costing nothing, played through a worker".

`docs/ages/STONE.md`, _The cards_: Farm's "built through a worker for production, single use:" becomes "built through a worker for production:"; Tannery's "and nowhere else, single use." becomes "and nowhere else."; Embark's "an instant costing production" becomes "an action card costing production"; Disembark's "the card Embark becomes" becomes "the action card Embark becomes"; Megalith's "built through a worker for production, single use." becomes "built through a worker for production."; Fishery's "on a coast tile, single use." becomes "on a coast tile.". The four improvement cards' sentences stay: "placed through a worker" already says their kind.

Player-facing entries, each one entry in the text table:

- The kind labels: `Action` and `Worker action`.
- The action kind's tooltip: `Played through a unit, spending its action`; the worker action's: `Played through a worker, spending its action`.
- The instant kind's tooltip becomes `An immediate effect, needing no unit`.
- The building kind's tooltip becomes `Built once by a worker on a tile inside your border`.
- The rules text of Farm, Tannery, Fishery and Megalith loses its first line, `Single use.`, and keeps the rest. Pillage and Capture keep theirs: they are instants carrying the keyword.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/DESIGN.md`, `docs/META-SCREENS.md`, `docs/MAP.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Scope:**

In: the closed set of kinds gains action, in the order settle, unit, building, action, instant, hazard, which is the collection's sort order; a building card leaves the chronicle once played by its kind, and single use is not declared on it, as it is not on settle and hazard; the content's kinds: Gather, Hunt, Trapping, Irrigation, Pasture and Clay pit are worker actions, Embark and Disembark are actions naming no unit, Shelter, Farm, Tannery, Fishery and Megalith are buildings with no single use, every other card keeps its kind; the fixture catalogue follows the same cut; the label at a card face's foot and the deck panel's row read the qualified label, and the kind tooltip beside the label reads the kind's; the docs edits above.

Out: a reward kind (an idea); a terraform card, since none exists; any change to what a card does, costs or is aimed at; the hand's order, which the kinds never sort; the specs' play command.

Corner cases decided here: Shelter leaves the chronicle once played, and nothing changes, since building it wins the age. A building card discarded unplayed cycles, as any card does. Actions sort as one group in the collection, by name, the qualifier sorting nothing. The test that states a built building card lies on the discard pile states the new promise instead, that it has left the chronicle: that is the design decision this line makes, not a test weakened. The collection order test names action among the kinds it proves, on a fixture action card.

Reconcile: a building card's leaving goes through the one door settle and hazard leave by; the qualified label goes through the standing kind label and its tooltip, as new entries of the text table; nothing else in the tree does these jobs.

**Traps:**

- The label's qualifier and the check that refuses a non-worker must have one source: a card that reads Worker action while admitting any unit, or Action while refusing one, is the drift this line must make impossible. Every worker card composes the one helper that checks and spends the worker; where the qualifier is declared is the implementer's, and a catalogue check that refuses a mismatch is acceptable where the declaration stays on content.
- The face's kind is shared with the event and capstone faces and read in two places, the card face's label and the deck panel's row; both read the qualified label.
- `hover.spec.ts` reads the tooltip's oracle from the card's kind through the text table's key; with a qualified label the spec must derive the key the way the UI does, through one shared function, never a literal.
- The glossary lint reads `docs/GLOSSARY.md`: until the instant row stops forbidding "action (for a card)", the lint refuses the word on a card's entry, so the glossary edit lands first.
- The card type refuses single use on a building after this line, as it does on settle and hazard; the typecheck finds every declaration to drop.
- `docs/PHASER.md` for anything the label's text object does.

**Plan:**

1. `docs/GLOSSARY.md`: the action and instant rows as the Spec says. Standing: the word action is admitted for a card.
2. `src/rules/`: the kinds set, the type, the card rules' switches, the fixture catalogue's kinds, and the tests whose promise the design changed. Standing: `npm test` green on the new kinds, a building card leaving the chronicle once played.
3. `src/content/`: the two ages' cards under their kinds, the building cards without single use. Standing: the coherence test green.
4. `src/ui/`: the text entries, the qualified label on the face and the deck row, the tooltips, the collection order and its test, the four building cards' rules text. Standing: `npm run check` and `npm test` green.
5. The remaining `docs/` pages as the Spec says, and the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/hover.spec.ts`, the kind label's bubble reading the kind on the game's content. CI proves on the push: `browse.spec.ts`, `deck-editing.spec.ts`, `civilization-mode.spec.ts`, `launch.spec.ts`, `collection.spec.ts`, and the specs that build a building, `trapping.spec.ts`, `irrigation.spec.ts`, `fishery.spec.ts`.
