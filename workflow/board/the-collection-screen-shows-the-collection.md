# The collection screen shows the collection

**Line:** **The collection screen shows the collection** — the navbar's Collection button opens the collection screen on a new campaign: every card owned stands as one stack reading its copies, six to a line, by age, then kind, then name; each civilization's pile stands on the right over its two counts, as it now does on the launch screen; a right click shows a card large; `e2e/collection.spec.ts` passes.

**Spec:** `docs/META-SCREENS.md` — _The navbar and the bar_, _The launch screen_, _The collection screen_ — and `docs/META.md` _The collection and the deck_, which this line leaves as it stands. The mockup, [collection-screen-mockup.html](collection-screen-mockup.html), in its Collection mode, is the layout's reference, with two differences this line ships: no price button under a stack, and no press on a pile or a stack but the right click.

Sentences to change in `docs/META-SCREENS.md`:

- _The launch screen_, second paragraph, the last sentence becomes: "The civilizations the campaign owns stand in a row, each a pile of cards under its city section's card, face up, and under the pile the count of its cards over the count of its settle cards."
- _The collection screen_, the collection mode's paragraph becomes: "In the **collection mode** the collection takes most of the room, under its word, centred: every card owned stands once, as a stack of its copies with the count of them under it, six stacks to a line, the lines centred in the panel. The stacks stand by age, in the order of history, then by kind — settle, unit, building, instant — then by name. The collection is where a copy is bought. The right panel is as wide as a pile and its margins, under its word, centred, and holds the civilizations the campaign owns top down, each a pile as on the launch screen, and a press on a pile opens the deck editing mode on its civilization. A card of the collection and the city section's card on a pile answer the right click and the rest as a card does anywhere: a right click shows the card large, on a scrim over the whole screen, the navbar and the bar among it, and its names and its kind label answer the rest. The screen hears no key but the back key."

The two sentences of that paragraph about buying and about the press on a pile stand as design ahead of their lines: the page keeps its ✅ and they are not this line's to build.

Sentences to change in `docs/INTERFACE.md`:

- The `seed` paragraph: "The campaign screen holds no entry." becomes "The campaign screen and the collection screen hold no entry."
- _A card's kind label answers the rest_: the list of faces takes "on a pile of the launch screen, on a stack and on a pile of the collection screen".

Player-facing text, every entry this line adds or changes:

| Where | Text |
| --- | --- |
| The navbar's third button | `Collection` |
| The word over the left panel | `Collection` |
| The word over the right panel | `Civilizations` |
| Under a stack | `Copies {copies}` |
| Under a pile, on both screens, two lines | `Cards: {cards}` over `Settle: {settle}`, one entry with its line break |

The launch screen's entry `Cards: {cards} · Settle cards: {settle}` is replaced by the pile's entry, not kept beside it.

**Doc-impact:** `docs/META-SCREENS.md`, `docs/INTERFACE.md`.

**Scope:**

In:

- The navbar's third button, **Collection**, under Chronicle, on every screen of the meta, and the scene it opens, which wears the navbar and the bar and is left by the menu as the other two are.
- The collection mode, read only. The measures, in design units, all from the mockup: the right panel 160 wide with a 1-unit edge on its left; the panes' top margin 24; a card of the collection 110 wide; up to three cards under a stack's face, each stepped 4 right and 4 down, one per copy past the first; stacks 10 apart across and the lines 18 apart; the count under its stack; the two words 18 bold in the pale ink, the counts 14 in the deck counts' colour.
- The pile is the launch screen's pile, drawn by the one piece both screens use: 100 wide, three card backs under the city section's card. On the collection screen no pile is chosen, so none is raised, edged or dimmed.
- The launch screen's pile loses the civilization's name and reads the two-line count, centred under the pile, in the room the name and the one-line count took.
- The right click and the rest on every card face of the screen, as the launch screen's pile answers them today.
- The order of the stacks, a pure function beside the screen with its Vitest test on the fixture catalogue: age in the catalogue's order, then kind in the order settle, unit, building, instant, then the name as the player reads it; two cards alike in all three stand in the catalogue's order.

Out:

- Any left press on a stack or a pile: it answers nothing, and the hand cursor does not show on them.
- The price, the price button and buying; the deck editing mode and the civilization mode.
- Scrolling: the next line's. A collection past what the room holds runs off the room's foot unclipped until then; a new campaign's does not, 8 cards in two lines.
- A sort or a filter the player chooses.
- The inspection of a whole deck from a pile.

Corner cases decided here:

- A card the collection holds in one copy stands as a face alone and reads `Copies 1`.
- A card owned in more than four copies shows three cards under its face, no more; the count says the rest.
- The city section's card stands in no collection and in no count: it shows on its pile alone.
- The kind hazard has no place in the order: no collection holds one. The order is a switch over the closed set all the same, and a hazard met is sorted last.
- The civilization's name is read nowhere on either screen after this line; its text entries and `civilizationName` stay, the later modes of this screen read them and the catalogue's coherence test does.

**Traps:**

- This line ships after **A card knows its age**: the order by age reads what that line leaves in the rules. If the board shows that line unshipped, stop and report.
- `META_SCREENS` in `src/ui/navbar.ts` is read by the navbar and by `src/ui/menu-scene.ts`, which walks it to find the screen standing; the scene's key is the member added there.
- `src/main.ts` adds scenes bottom up and starts them top down (`docs/PHASER.md`, _Scenes and stacking_): the new scene is added beside the campaign and launch screens, under the map.
- A card shown large stands on the overlay's scrim through `standLarge` in `src/ui/stack.ts`, with `awayUnder` and `resetMenu` wired as `src/ui/launch-screen.ts` wires them; the collection screen passes no key under a card shown large.
- One stop per scene, never per object, and the topmost hit is read off the last frame's render list (`docs/PHASER.md`, _Input across scenes_): a zone over a card face inside a container is how the launch screen's pile hears its presses.
- `src/content/` is imported by a scene alone: the pile's piece and the order's function take the catalogue as an argument (`DOGMAS.md`, _Stack_).
- The campaign's collection holds one entry per copy, numbered; a stack is every entry of one card id.
- `e2e/launch.spec.ts` finds the pile and its card by the names `launch-civilization-<id>` and `launch-civilization-<id>-card`; they keep those names on the launch screen.
- The mockup's HTML is a drawing, not code to port: it holds the later lines' presses and prices.

**Plan:**

1. `src/ui/text.ts`: the entries above, the launch screen's count entry replaced.
2. The pile becomes one piece both screens draw, out of `src/ui/launch-screen.ts`; the launch screen draws it with no name and the two-line count, and stands otherwise as it did.
3. The order of the stacks, pure, beside the screen, with its test.
4. The collection screen's scene: the navbar and the bar worn, the two panels, the stacks in order, the piles, the right click and the rest; added in `src/main.ts` and `META_SCREENS`.
5. `e2e/collection.spec.ts`.
6. The two `docs/` pages, the board line deleted, this file deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/collection.spec.ts`, new. On a new campaign it opens the collection screen by the navbar's button and asserts, every number read from the rules: the button sunk; one stack per card id the collection holds, each reading its copies, in the order's order; the first line holding six; the pile's counts equal to the civilization's; a right click on a stack showing that card large, and the back key taking it down and raising no menu.
- The `visual-check` skill after the change, on the collection screen and on the launch screen.
- CI's on the push, listed for the hand-back: `e2e/launch.spec.ts`, `e2e/campaign.spec.ts`, `e2e/menu.spec.ts`, `e2e/boot.spec.ts`, `e2e/manage-save.spec.ts`.
