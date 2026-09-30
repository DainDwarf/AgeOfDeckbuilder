# A right click on a civilization's pile opens its browse

**Line:** A right click on a civilization's pile opens its browse — on the launch screen and in the collection mode of the collection screen, a right click on a civilization's pile, a name on its top card excepted, raises the civilization's browse: its name and the count of its cards over one stack per card it holds, the city section's card first, then the settle cards, then the deck's, each with its copies on a badge; a right click on a stack shows its card large over the browse, and the back key walks back the card, then the browse; `npx playwright test e2e/launch.spec.ts` passes on the test that proves it.

**Spec:**

`docs/META-SCREENS.md`, _The launch screen_. In the paragraph "The chosen age and the chosen region stand larger…", the sentence "The city section's card on a pile answers the presses as a card does anywhere: … and the rest of the pile answers no right click." is replaced by:

> A right click on a pile opens its civilization's **browse**, wherever on the pile it lands, the counts among it, and chooses nothing; a name on the city section's card is the one exception, and answers the rest and the right click as a name does anywhere, the named thing shown large on a scrim over the whole screen, the navbar and the bar among it, and the card's kind label answers the rest. A left click anywhere on the pile chooses its civilization.

A new paragraph follows that one:

> The browse stands on a scrim over the whole screen, the navbar and the bar among it, under a title reading the civilization's name and the count of its cards, the city section's card counted. Every card the civilization holds stands once, as a stack of the copies the deck holds, eight stacks to a line from the frame's top left: the city section's card first, a pale edge around it, then the settle cards, then the deck's, each in the order of the collection. A badge on the front card's bottom right corner, reaching a little past the card to the right and below, reads the copies, on the city section's card and on a single copy as on any other. A browse holding more than its frame scrolls as a panel of the collection screen does. A card there answers the right click and the rest as a card does anywhere, the card shown large over the browse and taken down onto it where it stood, and answers no left click: nothing is selected. A press beside the cards or the back key closes the browse, and under it the screen hears no key.

`docs/META-SCREENS.md`, _The collection screen_, the collection mode's paragraph. The sentence "A card of the collection and the city section's card on a pile answer the right click and the rest as a card does anywhere: a right click shows the card large, on a scrim over the whole screen, the navbar and the bar among it, and its names and its kind label answer the rest." is replaced by:

> A card of the collection answers the right click and the rest as a card does anywhere: a right click shows the card large, on a scrim over the whole screen, the navbar and the bar among it, and its names and its kind label answer the rest. A pile answers the right click and the rest as on the launch screen: a right click opens its civilization's browse.

`docs/INTERFACE.md`, _The presses_:

- "It inspects the thing under it — a tile in the infopanel, a card shown large — and pressed again…" becomes "It inspects the thing under it — a tile in the infopanel, a card shown large, a civilization's pile in its browse — and pressed again…".
- "**inspect** is the tile in the infopanel and the card shown large." becomes "**inspect** is the tile in the infopanel, the card shown large and the civilization's pile in its browse."

`docs/INTERFACE.md`, _A card's names and its label_: the list of faces whose kind label answers the rest gains "in a civilization's browse" after "on a stack and on a pile of the collection screen".

`docs/GLOSSARY.md`:

- **inspect** — "To show a tile's cards in the infopanel, one at a time, to show a card large, or to open a civilization's browse."
- **browse** — "A window offering a pile's cards to be read: the draw pile's, the discard pile's, a civilization's."

`docs/CHRONICLE-SCREEN.md` is not touched: a chronicle pile's browse keeps its left click and its look until the two lines behind this one.

Player-facing text, `src/ui/text.ts`:

- The browse's title: `{civilization} — {count}`, the civilization's name as `civilization.<id>` reads it, the count every card it holds, the city section's card counted ("Nomadic — 20" on a new campaign).
- The badge: `×{copies}`, the words `collection.row-copies` already holds.

**Doc-impact:** `docs/META-SCREENS.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Scope:**

In:

- The right click on a pile of the launch screen and on a pile of the collection mode, chosen or not, dimmed or not: it opens the browse wherever it lands in the pile's box, the counts under it included, and never chooses a civilization or opens the deck editing mode. A right click on a name on the top card still shows the named thing large, and the rest on a name and on the kind label is unchanged. The small card a name raised keeps its right click.
- The browse, as the mockup settled it (https://claude.ai/artifact/1onUebhX196H3kDCddHqKA, opened on the settled values):
  - One grid, no section word. The city section's card first, in the pale edge it wears in the civilization mode, then the settle cards, then the deck's cards, the settle cards and the deck's each in the order of the collection.
  - A card is a stack as the collection's stacks are: the front face 130 wide, the copies past the first under it up to three, stepped as a collection stack's. Stacks stand 10 apart and lines 18 apart, as the collection's; eight to a line; lines start at the left of a block eight stacks wide centred on the screen, and at the frame's top.
  - The title stands where the chronicle browse's does and in its style; the frame runs from under the title to the bottom margin, as the chronicle browse's.
  - Nothing reads under a stack. The badge: 22 tall, 30 wide at least and as wide as its count needs, round ends, the card back's colour (`LOOK.cardBack`), a 1 edge in the card's edge colour, the count bold at 14 in the pale ink; its bottom right corner stands 6 to the right of and 6 below the front card's bottom right corner, whatever stands under the front card. Every stack wears one, a single copy and the city section's card included (×1).
  - It scrolls as a collection panel: the wheel whatever it is bound to, a press held anywhere in the frame, a card included, the run-on after the release, the stops at both ends. On the starting civilization it stands whole.
  - A right click on a stack shows its card large over the browse; a right click on a name there shows the named thing large. The back key, or a press of either button on the scrim, takes down the newest card shown large, and the browse stands again at the offset it was scrolled to. With no card large, a press beside the stacks or the back key closes the browse. A left click on a stack does nothing and rings nothing.
  - The rest on a name raises its small card and the rest on a kind label its bubble, as on any face of the meta; neither while the browse is dragged.
  - Under the browse the screen hears no key and no press, as under a card shown large; the back key closing the browse raises no menu. The Menu button and the debug console stand over it as they stand over a card shown large.
- The browse reads the campaign the save holds when it is raised. Nothing edits the deck while it stands.

Out:

- The chronicle screen's piles: their left click and their browse's look are the two lines behind this one on the board.
- The collection mode's stacks, the deck editing mode and the civilization mode keep their readings as they are; no badge lands there.
- The deck editing mode and the civilization mode show no pile, so no browse opens from them.
- Whether a wheel notch may be bound to the back key is its own line on the board; over the browse a wheel notch scrolls and does nothing else.

Corner cases decided:

- A civilization always holds its city section's card, so the browse is never empty and says nothing for an empty deck.
- A count of two digits widens the badge leftwards from its fixed right edge.
- The city section's card has no copies to count: its badge reads ×1.
- The badge answers no press and no rest of its own: a press on it is the stack's.

**Traps:**

- Both screens reach a pile's right click through `Pile.answers` of `src/ui/civilization-pile.ts` (the launch screen by `inspectedThrough`, the collection screen as a panel's `Held.answers`), and `answersOf` in `src/ui/stack.ts` shows the face large only where `cardAt` holds; the pile's box is wider than its card and holds the backs and the counts.
- A card shown large on a screen of the meta stands through `standLarge` (`src/ui/stack.ts`), which owns a scrim and a claim on the overlay's keys (`overlay.takes`), and tells the screen it is covered (`away('overlay', …)`). The browse is a second thing standing on that overlay: the back key and a press on a scrim must find the card shown large first and the browse second, and the screen stays covered from the browse's rise to its close, a card large over it or not.
- The chronicle screen's browse (`src/ui/overlay.ts`) lays faces, rings one and is typed on a chronicle's piles; it is not this browse. Its look is changed by a line of its own; this line leaves `overlay.ts` behaving as it does.
- The collection screen claims the wheel notch ahead of `backRaisesMenu` (`takesMouseKeys(this, isWheelNotch)`); the launch screen claims nothing of the wheel today, and the browse scrolls on both.
- The launch screen's `lay()` destroys and redraws the room on every choice; the right click must not pass through `choose`.
- A scrolled container's mask: the stencil stays off every display list and is destroyed by hand — `docs/PHASER.md`, _Rendering under WebGL_. A thing raised answers a press only from the next frame, and a spec rests before it presses it — `docs/PHASER.md`, _Under a Playwright spec_; presses across the screen's scene and the overlay's — _Input across scenes_.
- The badge's text is keyed data. `LOOK` gains no colour: the badge uses roles that exist.
- The order of the collection is a rule the collection's layout already holds (`src/ui/collection-layout.ts`); the browse reads its order there and re-types none of it.
- Specs find things through `window.named`; the chronicle browse's names (`browse`, `browse-title`, `browse-card-<n>`) are read by `e2e/browse.spec.ts`.

**Plan:**

1. `src/ui/text.ts` — the title's entry stands; `src/ui/text.test.ts` passes.
2. The browse itself, in `src/ui/` beside the pieces it is built from (`collection-stack.ts`, `collection-layout.ts`, `scroll.ts`, `stack.ts`): what it lays out from a civilization — the order, the counts — as a pure function with its Vitest test on the fixture catalogue, and its drawing on the overlay with the badge, the scroll and the presses. Left standing: a browse a screen can raise for a civilization and that closes itself.
3. `src/ui/civilization-pile.ts` — a pile answers the right click with the browse, a name excepted. Left standing: the pile's one door for the right click, shared by both screens.
4. `src/ui/launch-screen.ts` and `src/ui/collection-screen.ts` — each hands its piles what raises the browse. Left standing: both screens open it.
5. `e2e/launch.spec.ts` — the first test is rewritten for the new right click, as Verify says; `e2e/collection.spec.ts` gains its test.
6. The docs sentences above, in `docs/META-SCREENS.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/launch.spec.ts`. Its first test, which today asserts that a right click on the city section's card shows it large, becomes: on the launch screen the kind label on the pile's card still raises its bubble; a right click on the pile's card raises the browse, its title reading the civilization's name and the count the rules give, its stacks the cards the rules give in the browse's order, the first the city section's card, each badge reading the copies the rules give; a right click on the first stack shows the city section's card large; the back key takes it down and the browse stands; the back key again closes the browse and raises no menu. A right click on a name on the pile's card still shows the named thing large and raises no browse. Every count and id is read from the rules and the campaign, none typed.
- CI's, on the push, listed at the hand-back and not run: `e2e/collection.spec.ts` (with its new test: a right click on a pile of the collection mode raises the browse, and the back key closes it onto the collection mode), `e2e/deck-editing.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/reference.spec.ts`, `e2e/hover.spec.ts`, `e2e/pointer-sweep.spec.ts`, `e2e/browse.spec.ts`, `e2e/menu.spec.ts`.
- A `visual-check` of the browse on both screens after the ship: the badge over a stack of four and over a single card, the city section's edge beside its badge, the title clear of the first line, the scroll on a deck that overflows.
