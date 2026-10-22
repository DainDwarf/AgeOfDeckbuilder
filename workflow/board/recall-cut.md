# The recall cut

**Line:** The recall cut — no card aims at the discard pile: the aim kind, its block and refusal line, the recalled change and its helper, the aim window and its title, the fixture's recall instant and its tests are gone, and the design pages describe a card as aimed at nothing, a tile, a unit or the hand. Doc-impact: `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Spec:** the pages after the cut say this and no more.

- `docs/CHRONICLE.md`, _Cards_: the paragraph beginning "A card aimed at the discard pile is offered the pile's cards" is deleted whole. The paragraph after it reads: "A card aimed at the hand lands on another card of the hand, whichever the player chooses, and never on itself. A hand holding no other card blocks it in the hand. The card played goes to its pile before it lands, the discard pile or the exhaust pile, so a card it discards lies over it."
- `docs/CHRONICLE-SCREEN.md`, _The hand and the aim_:
  - The first paragraph's second-click sentence reads: "A second click plays the card — one that aims at nothing is played where it stands, and refused over the card with its reason when it is unaffordable; one that aims at a tile or at a unit lands nowhere, no tile lying under a card in the hand, so it stays selected; one that aims at the hand is being aimed from then, where it lies, or refused over the card as one that aims at nothing is." The sentence "That window waits for the second click because it would stand over the hand, and a card is inspected from the hand before it is played." is deleted; the sentence about the card aimed at the hand that follows it stays.
  - The paragraph on the point and the line opens "**A card being aimed says so on the card itself.**" and loses its last sentence, "A card aimed at the discard pile wears neither: the aim window's title says that same sentence instead, with a card of the discard pile in place of the tile or the unit."
  - The paragraph "Every card being aimed is aimed at one kind of thing" ends its second sentence at "a card that aims at the hand is aimed at every other card of the hand."
  - The drag paragraph loses "one that aims at the discard pile raises the aim window;".
  - The paragraph beginning "A left click on one of the aim window's cards" is deleted whole.
- `docs/INTERFACE.md`, _A card's names and its label_: the list of faces that answer the kind label loses "in the aim window,".
- `docs/GLOSSARY.md`: the rows **aim window** and **recall** are deleted, their forbidden words with them.
- `workflow/IDEAS.md`: the minimize-button idea names the scrim's windows as "the deal window, a browse and the capstone's". The recall idea already keeps the recall for the Bronze Age and changes not.
- `CHANGELOG.md` keeps its words.

No player-facing sentence is added: the line removes two text entries, the aim window's title and the empty-pile refusal, and authors none.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the `discard-pile` member of the card's aim, of what a play is aimed at and so of the play command, and of the blocks; the `recalled` change name and the helper that raises it; the aim window, what the scrim carries for it, the way the hand raises it and the way the screen closes it; the two text entries; the fixture's recall instant; the rules tests that play it and the fixture helper that aims at the pile; the empty case the builder's plays answer for the aim; every switch case over those closed sets, in the rules, the screen, the catalogue test, the e2e helpers and the tools.
- Out: the hand aim, which Fire plays through, and everything it shares — the effect shape taking a place in a pile, the places a change carries, the hand's second-press path; the discard pile itself, its browse, its top card and its text entries; the window layout the deal, the capstone and the browse stand on; the changelog.
- Corner cases decided here: the change-name switches on the screen answer nothing for a recalled change already, so no playback is cut and nothing visible changes but the window; the one Vitest in `src/rules/chronicle.test.ts` on the places a pile change carries loses its recall half and keeps the rest; the comment on a placed change's places no longer names the discard pile.
- Reconcile: the line projects nothing, so it has no likeness to choose; the deletion leaves the hand aim as the one aim at a card.

**Traps:**

- The aim kinds, the blocks and the change names are closed sets switched without a default, in `src/`, `e2e/` and `tools/` alike, and `npm run check` covers all three: the typecheck is the list of sites, and a site it does not name is not touched.
- The refusal lines are read by block name through one template, so the block's text entry goes with the member and nothing else references it.
- The overlay's back key and its inspection key switch over what the scrim carries; the aim window's member goes from that union, not from the switches alone. `docs/PHASER.md` holds what the scrim and the scenes do; nothing of it changes here.
- The e2e helpers switch over the aim kinds too, in `e2e/chronicle-screen.ts`; the comment on the drag-out gesture names the aim window and is reshaved.
- The fixture catalogue's coherence test and the real catalogue's both walk every aim kind.

**Plan:**

1. `src/rules/catalogue.ts`, `src/rules/stages.ts`, `src/rules/state.ts`, `src/rules/chronicle.ts`, `src/rules/cards.ts`: the members and the helper go; the typecheck then names every switch left standing, in `src/rules/`, `src/ui/`, `src/content/catalogue.test.ts`, `e2e/chronicle-screen.ts` and `tools/builder.ts`, and each loses its case. What stands: a card aims at nothing, a tile, a unit or the hand, and the rules compile.
2. `src/ui/overlay.ts`, `src/ui/hand.ts`, `src/ui/chronicle-scene.ts`, `src/ui/text.ts`: the aim window, what raises and closes it, and the two text entries go. What stands: the screen compiles, the hand's second press plays a card at nothing or aims it at the hand.
3. `src/rules/fixtures.ts`, `src/rules/cards.test.ts`, `src/rules/chronicle.test.ts`: the recall instant, the tests that play it and the helper that aims at the pile go; the places test keeps its other halves. What stands: `npm test` green.
4. The four `docs/` pages and `workflow/IDEAS.md` as the Spec writes them; the board line deleted. What stands: no page names the aim window or a card aimed at the discard pile.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/hand-aim.spec.ts`, the sibling aim path through the hand's second press that stays. CI proves on the push every spec that plays a card from the hand, `press.spec.ts`, `refuse.spec.ts`, `settle.spec.ts`, `embark.spec.ts` and `browse.spec.ts` among them.
