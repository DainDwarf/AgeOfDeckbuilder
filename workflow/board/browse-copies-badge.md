# The browse windows' "xN" badges

**Line:** The browse windows' "xN" badges — the "xN" badges on the browse windows hide too much of the card now, and need to change. Done when the copies badge of every browse stack (a pile's browse, a civilization's browse, a capture's rewards of several copies) stands under its front card's bottom right corner, the numbers at the card's foot readable beside it, `docs/META-SCREENS.md` and `docs/CHRONICLE-SCREEN.md` say so, and the browse spec's badge test checks the place.

**Spec:** `docs/META-SCREENS.md`, the civilization's browse paragraph ("The browse stands on a scrim…"), and `docs/CHRONICLE-SCREEN.md`, the pile browse paragraph ("A right click on a pile opens its **browse**…").

In `docs/META-SCREENS.md`, replace "A badge on the front card's bottom right corner, reaching a little past the card to the right and below, reads the copies, on the city section's card and on a single copy as on any other." with:

> A badge under the front card's bottom right corner, standing mostly below the stack and a little past the card to the right so the numbers at the card's foot stay readable, reads the copies, on the city section's card and on a single copy as on any other.

In `docs/CHRONICLE-SCREEN.md`, replace "as a stack of its copies, a badge on the front card reading them," with:

> as a stack of its copies, a badge under the front card's bottom right corner reading them as on the civilization's browse,

No player-facing text changes: the badge still reads `collection.row-copies` ("×{copies}").

**Doc-impact:** `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

- In: the badge's place, in `src/ui/browse.ts` (`badgeOf` and where `badgedStackOf` hands it its corner). Every surface that wears it moves with it: a pile's browse, the civilization's browse on the meta screens, a capture's rewards of several copies (`src/ui/overlay.ts` through `badgedStackOf`).
- The place, picked by the user on the mockup (https://claude.ai/artifact/NzYcqgbeZY87SDQFshpLpp, Claude's star was the top-right corner; the user took "under the corner" nudged 4 right and 8 up): the badge keeps everything it is today (22 tall, at least 30 wide and widening leftwards, the dark pill with its line, 14 bold pale ink, "×N") and only moves. Its right edge stands 10 units past the front face's right edge (today 6), and its middle 4 units below the front face's bottom edge, so it reaches from 7 units above that edge to 15 below it (today it ends 6 below it). It no longer covers the middle of the influence disc or of a unit's health badge, which share one spot at the card's foot; it touches their lower tips, accepted on the mockup.
- Following, taken: a right click anywhere on the badge still shows the card large (it stays in the stack's box and `liesUnder`); the civilization's browse still reads "×1" on a single copy; colours and type unchanged.
- Corner case decided here: the badge now passes the stack's foot (under cards reach 12 below the face) by 3 units. A browse's cell counts the badge's bottom in its foot, so the lines stand 3 units further apart and a browse scrolled to its end shows its last line's badges whole. The capture window's row is far from its frame's foot and needs nothing.
- Reconcile: the collection's and civilization mode's reading under a stack ("×3", "2/3" beside the price) stays apart, a reading line with buttons that a browse does not have; the chronicle piles' gold count pill stays apart, the chrome rung's to review.
- Out: the badge's look, the "×1" rule, the browse's columns.

**Traps:**

- `linesOf` in `src/ui/collection-stack.ts` spaces the browse's lines by each cell's `bottom` (`stackCellOf` hands `stacked.foot` today); the collection screen shares `linesOf`, so the badge's bottom goes into the browse's cell, not into `stackedCardsOf`'s `foot`.
- The browse spec's scroll tests read the overflow off the game, so the 3 units change no expectation there.

**Plan:**

1. `src/ui/browse.ts`: the badge at its new corner, and the browse cell's bottom counting it. Leaves every browse with the badge under the corner and the last line whole at the scroll's end.
2. `e2e/browse.spec.ts`, the test "a left click on a pile opens nothing; a right click opens its browse…": for each stack, the badge's middle stands below its front face's bottom edge and right of the face's middle, and the influence disc's middle on that face (`DISC.influence` at the card's scale, as `e2e/frame-press.spec.ts` places the foot's badges) lies outside the badge's box. Leaves the place proved.
3. The two docs sentences above.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/browse.spec.ts`. CI proves on the push `e2e/launch.spec.ts`, `e2e/neutral.spec.ts` (the capture's reward stacks) and the rest of the suite.
