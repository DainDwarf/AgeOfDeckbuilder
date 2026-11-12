# A unit in fog read as last seen

**Line:** **A unit in fog read as last seen** — the snapshot keeps the unit on its tile as it stood, and a tile in fog holds that unit's card, first in its cycle, read as last seen, Hostile alone read as the neutral stands now; a test in `src/rules/sight.test.ts` holds what the snapshot keeps, `e2e/fog.spec.ts` proves the card, and the two pages say so. Doc-impact: `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:**

- `docs/CHRONICLE.md`, _Sight_, the paragraph **Fog draws the tile as it was last seen.** Two sentences change. "The chronicle keeps a snapshot of every tile that has ever been in sight — its terrain, its feature, its improvements, its building, the city whose border it stands inside, and the non-player unit standing on it." becomes "The chronicle keeps a snapshot of every tile that has ever been in sight — its terrain, its feature, its improvements, its building, the city whose border it stands inside, and the non-player unit standing on it, as it stood." And "The snapshot is taken again each time a command changes the chronicle, so an enemy crossing in sight is recorded as it crosses, and a unit killed reveals nothing after the attack that killed it." becomes "The snapshot is taken again each time a command changes the chronicle, so an enemy crossing in sight is recorded as it crosses, one wounded in sight is recorded wounded, and a unit killed reveals nothing after the attack that killed it."
- `docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_, the paragraph **The rest of the screen reads what the map draws.** "An inspection reads that same face, and a tile in fog holds no unit card: the unit its snapshot keeps is a mark and not a card." becomes "An inspection reads that same face, and a tile in fog holds the card of the unit its snapshot keeps, read as the unit stood when last seen; whether a unit of the neutral's is hostile is no unit's own, and is read as it stands."
- No player-facing sentence is new: the card is the unit card, with the entries it reads today.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In: what the snapshot keeps of a unit, when it is taken again, the save reading and writing it, the infopanel's cards for a tile drawn in fog, the fog spec's test of that card, one rules test.

Out, each held elsewhere on the board or decided against:

- The selection and the ring: a click on a tile in fog still selects the tile, which wears its rim, as today. The line after this one changes that.
- The prepared colour on a tile in fog: the map still shows none of it, while the card now reads Pillaging or Capturing. The board line "A unit's own states" carries the clause.
- The personas: the simulator's builder still reads a snapshot's unit as a fresh one of its kind. Its correction is the board line "The personas read a unit as last seen".
- Any word, tint or mark on the card saying it is a memory: the fog on the tile says so, as it does for the building and terrain cards. The card is drawn as the card of a unit in sight is.
- Saves from before: no care, the user's standing call. A save whose snapshot keeps a unit in the old shape is read as any save the reader does not know.

Corner cases decided here:

- The snapshot keeps of a unit what its card reads of the unit itself and nothing more: its kind and stats as they stood, its faction, its move points, its action, whether it stood embarked, whether it had prepared. It keeps no number it is named by, no script and no camp.
- Hostile is read live, off the neutral's relations as they stand: it is the faction's, and no fog hides it.
- The bonus the unit carries is read as it is for a unit in sight, off the units as they stand, and added to the damage the snapshot kept. The user's standing verdict that a leader's bonus leaking out of sight is not an issue covers it. Claude decided this at the dossier, the user having agreed "everything but Hostile as last seen": the two differ only where a leader beside the unit dies or lands while the unit's tile is already in fog.
- Pillaging and Capturing are read off whether the unit had prepared when last seen, and where it stood.
- Raft is read off the snapshot, and the stats are read embarked as the card reads them in sight.
- The card is first in the tile's cycle, as in sight: a right click on a tile in fog a unit was last seen on opens on it, and so does the inspection key on that tile selected.
- A unit leaves the snapshot when the turn ticks, and its card goes with it. That is the standing rule and nothing here touches it.
- With the fog veil off the tile is drawn live and its card is the live unit's, as today. A tile drawn with no snapshot of it reads as it stands, as today.

Reconcile:

- The ghost's card and the unit card of a unit in sight: the ghost goes through the standing card as it is.
- The ghost's card and the kind's card a name raises: they stay apart, the fresh reading being meant there.
- The card reading Pillaging while the map shows no colour: they stay apart in this line.
- The personas' reading of a snapshot's unit: it stays apart in this line.

**Traps:**

- `src/rules/sight.ts` takes a snapshot again only where its `records` says the kept one differs, and that compares the unit's kind, faction and embarked alone. Everything newly kept has to be compared there, or a unit wounded in sight keeps the snapshot it had.
- The same file compares tiles by identity and says why beside `unitsGone`. What is kept of a unit has to compare stably too, or every tile in sight a unit stands on is charted anew on every command, and `chartedEach` stops handing back the very chronicle it was given.
- `tools/builder.ts` reads a snapshot's unit by its kind, faction and embarked (`shownEntering`, `shownMap`) and enters it fresh. It has to go on reading exactly those three and answering as it does: the simulator's rows do not move in this line. `tools/warlord.ts` reads the snapshots' tiles only.
- `src/ui/map.ts` draws the mark of a unit in fog from the snapshot's kind, faction and embarked, in the tile's own painter.
- `src/ui/chronicle-scene.ts` hands the infopanel the units only for a face drawn as it stands, and none for a face drawn from its snapshot. `src/ui/infopanel.ts` types what a unit card reads as `UnitReading` and builds it in `cardsOf`.
- `preparedAs` (`src/rules/enemies.ts`) and `damageOf` (`src/rules/catalogue.ts`) take a `Unit`. A unit of the player's is never kept in a snapshot, so `prepared` is always there to keep.
- `src/rules/save.ts` reads a snapshot in `snapshotOf` and a unit in its own reader further down; the writer is the state serialised. `src/rules/save.test.ts` holds the round trip.
- `e2e/fog.spec.ts`, "the overlay, the inspection and a press read what the map draws, and widen with it", asserts today that no card of the tile in fog is the unit's. That promise is withdrawn by this line, on the user's decision: the test is rewritten to the new one, not loosened.
- A spec wounds its unit through the rules' own helper, the one a card's effect composes, and reads its oracle off the snapshot the rules kept (`DOGMAS.md` _Testing_). `docs/PHASER.md` _Under a Playwright spec_ holds what a spec waits for.

**Plan:** two commits, the rules first.

1. `src/rules/state.ts`, `src/rules/sight.ts`, `src/rules/sight.test.ts`: the snapshot keeps the unit as its card reads it and is taken again when any of that changes. One test on the fixture: a unit wounded in sight and then lost to the fog is kept wounded. This leaves the rules tests green and the screen reading nothing new.
2. `src/rules/save.ts`, `src/rules/save.test.ts`: a save holding such a snapshot reads back as it was written.
3. `tools/builder.ts`: reads what it read, where the snapshot's shape moved under it. This leaves `npm test` green, the simulator's tests among it. The first commit ends here, inert on the screen.
4. `src/ui/infopanel.ts`, `src/ui/chronicle-scene.ts`, and `src/ui/map.ts` where the snapshot's shape moved under the mark: a tile drawn in fog holds its unit's card, first in the cycle.
5. `e2e/fog.spec.ts`: the test named in Traps rewritten: the card of a wounded unit in fog reads what the snapshot kept, and a unit of the neutral's in fog reads Hostile once war is declared.
6. `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`: the sentences of the Spec. The board line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/fog.spec.ts`. CI proves on the push: `e2e/inspect.spec.ts`, `e2e/neutral.spec.ts`, `e2e/archer.spec.ts`, `e2e/console.spec.ts`, `e2e/landing.spec.ts`, `e2e/population-badge.spec.ts`.
