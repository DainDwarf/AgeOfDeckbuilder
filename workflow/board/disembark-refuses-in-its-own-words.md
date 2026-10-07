# Disembark refuses a unit that is not embarked in its own words

**Line:** Disembark refuses a unit that is not embarked in its own words — in a tie, a click on an ashore unit of the player's beside the tile is refused with the unit's own sentence, "The unit is not embarked", the tile's sentence standing over no unit; the rules test asserts that answer, and the per-unit wrong-terrain answer of a tie, which no test holds today.

**Spec:** `docs/CHRONICLE.md` → _Cards_, the paragraph on a card played through a unit beside its tile, and `docs/CHRONICLE-SCREEN.md` → _The hand and the aim_, "A card played through a unit beside its tile asks which unit only where it must": a click on any other unit of the player's is refused over it with the one reason it is turned down. No sentence on either page changes. The one player-facing sentence the line adds, the refusal note said over the unit: `The unit is not embarked`

**Doc-impact:** none — no design page names a refusal sentence; the rule that a unit in a tie is refused over itself with its reason already stands.

**Scope:**

- In: one new member of the tile refusal vocabulary, the per-unit counterpart of the one that refuses an already embarked unit to Embark, answered by Disembark's step through a unit that is not embarked; its text entry; the Disembark tile-level sentence, "Needs an embarked unit beside it", kept for the tile where no embarked unit stands beside it. A rules test on the fixture for Disembark's per-unit answers in a tie, in the shape of the Embark one at the end of `src/rules/cards.test.ts`: through an ashore unit of the player's beside the tile, the new member; through a unit whose kind's move does not cover the tile, `wrong-terrain`; through the one that can, nothing, and the play through it.
- Out: any new Playwright spec. The note's rendering is the one path every refusal goes through and the typecheck refuses a refusal member with no text entry; a tie of two embarked units and one ashore around one bank is proven on the fixture.
- Reconcile: the projected reason goes through the standing door, the step helper's first check, which already names one reason for the unit and one for the tile per direction; the direction is the parameter, nothing else differs.
- Corner case decided here: Embark's per-unit wrong-terrain answer is not tested, since it is unreachable between two units beside one tile — every embarking unit takes the card's move, so two units beside a tile pass or fail that check together and the tile-level answer, already tested, is the whole of it.

**Traps:**

- A disembarking unit gets its kind's move back, read from the catalogue, not the move its standing stats carry: a fixture that overrides a unit's `move` through `standing` does not make it slower for Disembark. The slow unit needs a unit kind of its own, with a smaller move, added to the fixture's tables or to the test's own catalogue through `changed`, as the Embark test does for a card.
- The fixture's hills cost two move points ashore and its mountain six, and its three unit kinds all move two: hills beside the water is the tile one kind reaches and a slower one does not; the mountain is beyond every kind and answers at the tile level, which the existing Disembark test already holds.
- The text table's keys are a closed type and the refusal line reads `refusal.<member>` from it: a new member with no entry fails `npm run check`, which is the proof the entry exists.
- The refusal note over a unit in a tie is drawn by the chronicle scene from the rules' per-unit answer alone; nothing in `src/ui/` names a refusal member, so the UI changes nowhere.

**Plan:**

1. `src/rules/state.ts` — the tile refusal vocabulary gains its member; `src/ui/text.ts` — its entry, the sentence above. The typecheck passes again only once both stand.
2. `src/rules/cards.ts` — the step helper's first check answers the new member for the unit when disembarking, the tile's reason staying the tile's; the shared value that stood for both goes.
3. `src/rules/cards.test.ts`, and `src/rules/fixtures.ts` where the slow kind lands there — the Disembark tie test: the per-unit answers through an ashore unit, a unit the tile is beyond, a unit away from the tile, a tile no unit of the player's stands on, and the one it plays through; the existing Disembark test's tile-level answers unchanged.
4. `workflow/BOARD.md` — the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — the line adds no screen path, and the rules test is the proof. CI proves on the push `e2e/embark.spec.ts`, the one that walks Disembark's play.
