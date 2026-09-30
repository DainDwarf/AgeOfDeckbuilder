# A chronicle pile's browse opens on a right click, in the civilization's browse's design

**Line:** A chronicle pile's browse opens on a right click, in the civilization's browse's design — on the chronicle screen a right click on the draw pile or the discard pile opens its browse and a left click on a pile does nothing; the browse lays the pile out as the civilization's browse lays a civilization out, one stack per card that reads the same with its copies on a badge, in the order of the collection, with no ring and no inspection key; a name on the discard pile's top card answers the rest and the right click; `npx playwright test e2e/browse.spec.ts` passes on the tests that prove it.

**Spec:**

`docs/CHRONICLE-SCREEN.md`, _The piles_. The paragraph is replaced whole by:

> A right click on a pile opens its **browse**, under a title reading the pile's name and the count of its cards. Every card the pile holds stands once, as a stack of its copies, a badge on the front card reading them, eight stacks to a line from the frame's top left, in the order of the collection, so the draw order is given away to nobody. Copies stand in one stack only where they read the same: a copy whose counters differ stands as a stack of its own, beside the others of its card, the smaller numbers first. A browse holding more than its frame scrolls. A card there answers the right click and the rest as a card does anywhere, shown large over the browse and taken down onto it where it stood, and answers no left click: a card in a browse is there to be seen and no more, and nothing is selected. A press beside the cards or the back key closes the browse. A left click on a pile does nothing. A name on the discard pile's top card answers the rest and the right click as a name does anywhere, and its kind label answers the rest.

`docs/CHRONICLE-SCREEN.md`, _The windows_: "The answers dealt stand in one row, centred, as cards at the browse's width, in the order dealt…" becomes "The answers dealt stand in one row, centred, as cards at the deal window's own width, in the order dealt…". The capstone's "drawn as the deal window draws an answer and at the same width" stands.

`docs/CHRONICLE-SCREEN.md`, _The right click, the back key and the menu_: "The right click finds a tile, a card of the hand, a card in a browse or one in the aim window, in city mode…" becomes "The right click finds a tile, a card of the hand, a pile, a card in a browse or one in the aim window, in city mode…".

`docs/INTERFACE.md`, _The presses_:

- "…a card shown large, a civilization's pile in its browse — and pressed again…" becomes "…a card shown large, a pile in its browse — and pressed again…".
- "**inspect** is the tile in the infopanel, the card shown large and the civilization's pile in its browse." becomes "**inspect** is the tile in the infopanel, the card shown large and the pile in its browse."

`docs/INTERFACE.md`, _A card's names and its label_: "Every card face answers so but a pile's top card on the chronicle screen — in the hand, in a browse, …" becomes "Every card face answers so — in the hand, on the discard pile, in a browse, …", the rest of the list as the line ahead left it.

`docs/GLOSSARY.md`, the **inspect** row: "To show a tile's cards in the infopanel, one at a time, to show a card large, or to open a pile's browse." The **browse** row stands as it is.

`docs/META-SCREENS.md` is not touched.

Player-facing text: none new. The titles `browse.draw-pile` and `browse.discard-pile` stand, their count every card in the pile; the badge reads the entry the civilization's browse reads.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/GLOSSARY.md`.

**Scope:**

In:

- The right click on a pile opens its browse, in every state the chronicle screen can be in where a right click shows a card of the hand large today — city mode, a card selected, a card being aimed — and the browse closes back onto that state as a card shown large does. An empty pile opens its browse too: its title, and no stack.
- A left click on a pile does nothing: it opens nothing, selects nothing, and drops neither the selection nor the inspection. The pointer over a pile is the arrow, a name and the kind label on the discard pile's top card excepted, where it is the hand as over any thing that answers a rest.
- The discard pile's top card: a name on it raises its small card at a rest and shows the named thing large at a right click, and its kind label raises the kind's bubble at a rest, as on a card of the hand. A right click anywhere else on the pile opens the browse. The draw pile's top is a card back and answers nothing of the kind.
- The browse's design is the civilization's browse's, with every number it settled: front faces 130 wide, a stack's under-cards up to three, stacks 10 apart and lines 18 apart, eight to a line, from the top left of a block eight stacks wide centred on the screen, the badge on every stack, a single copy's included, nothing under a stack, the scroll of a panel. The title, its place and its style stand as they are.
- What makes a stack: copies of one card with the same counters. Stacks stand in the order of the collection — by age, then kind, then name — for both piles; stacks of one card stand side by side, ordered by their counters, the smaller first, read in the order the card declares them. The order never reads where a card lies in its pile.
- The presses in the browse are the civilization's browse's: a right click on a stack shows its card large, as its counters make it; a right click on a name shows the named thing large; a left click on a stack does nothing; no ring, and the inspection key does nothing while a browse stands. The back key and a press of either button beside the stacks take down the newest card shown large, then close the browse; the back key never raises the menu from a browse.

Out:

- The aim window: it keeps one face per card of the discard pile, newest first, at its width, a press landing on the one card pressed.
- The deal window and the capstone's window keep their cards' width and their ring; only the sentence naming that width changes.
- The piles themselves on the chronicle screen: their look, their count pills, the shuffle.
- The civilization's browse and the collection screen.

Corner cases decided:

- A hazard is a card like another in the order: the kinds' declared order puts it last within its age.
- A discarded card no longer reads when it was discarded; nothing replaces that reading.
- A left click on a pile is not a press beside the things: the selection stands.
- The discard pile's top card changes as cards land; a small card or a bubble raised from it goes down with the face that raised it, as the pointer's rule in `docs/INTERFACE.md` has it.

**Traps:**

- This line ships on the tree the line ahead leaves: the civilization's browse exists, with its stack, its badge, its scroll and its presses. The chronicle's browse is that drawing handed a pile's stacks; nothing of it is re-typed, and a width, a gap or a badge number appears in one place.
- `src/ui/overlay.ts` lays the browse, the aim window, the deal window and the capstone's window through one grid (`layGrid`) at one width (`BROWSE_WIDTH`), and rings the browse and the deal through one `ring`; its `Carried` union is switched in several places (`back`, `inspectSelection`, `inspectNamed`, `aimStanding`, `raise`). The aim window, the deal and the capstone must stand exactly as they do; the browse leaves `Ringing`.
- `cardsOf` in `src/ui/overlay.ts` holds the two orders of today and goes; the order of the collection is `stacksOf`'s in `src/ui/collection-layout.ts`, which counts copies by id alone — a chronicle's cards need the counters in what makes a stack, and the catalogue's order is its last tie-break.
- The overlay's `takes` swallows the wheel notch and scrolls through Phaser's own `wheel` event, moved from the scene's update and not from inside the dispatch — `docs/PHASER.md`, _The pointer's readings_ and the comment there.
- A card shown large over the browse stands as it does over the civilization's browse: the browse stays standing under the card's scrim at its offset, through `standLarge`'s `Beneath` (`src/ui/stack.ts`), and is neither wiped nor laid again when the card comes down. Today's chronicle browse wipes the scrim and lays the browse again (`Inspection.over`); that path goes, so one way of standing a window under a card shown large remains. The browse has no selection left to restore.
- The pile's press zone (`src/ui/piles.ts`) is one zone over the top card, under the count pill; the discard pile's top card is redrawn at every render and lifted away by the shuffle, so what answers the rest on it is rebuilt with the face, and nothing is left pointing at a destroyed face.
- The top card is drawn worn (`tone: worn`); the card shown large and the small card are not.
- `e2e/chronicle-screen.ts` holds `browse()`, which left-clicks a pile, `scrolled`/`offsetOf`/`wheel`, which read `browse` and `browse-frame` by name, and `doubledCivilization`, whose doubled deck no longer overflows a frame: doubling copies adds no stack. `ringed` stays for the deal window.
- An overflowing pile needs three lines, so 17 stacks that read differently. The Nomadic content holds 13 cards, and a hazard's counter reads the turn it was added on: a pile that overflows is composed through the rules' own adding helpers, as the specs dogma allows, and if no such pile reaches 17 the report says so and the scroll's tests are put to the user — no frame, width or count is changed to make one overflow.

**Plan:**

1. What a pile lays out — its stacks by card and counters, in the browse's order — as a pure function beside the collection's layout, with its Vitest test on the fixture catalogue: copies alike merge, copies whose counters differ do not, the order holds whatever order the pile lies in.
2. `src/ui/overlay.ts` — the browse stands in the civilization's browse's drawing, with no ring and no inspection key; the aim window, the deal window and the capstone's window stand untouched.
3. `src/ui/piles.ts` and `src/ui/chronicle-scene.ts` — a pile answers the right click and no left click, and the discard pile's top card answers the rest and a name's right click.
4. `e2e/chronicle-screen.ts` and the specs — `browse()` opens by a right click; `e2e/browse.spec.ts`, `e2e/press.spec.ts` and `e2e/menu.spec.ts` follow, as Verify says.
5. The docs sentences above.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/browse.spec.ts`, its three tests rewritten:
  - The scroll: a pile composed to overflow scrolls by the wheel and by a press held, and stops at both ends, on the draw pile and on the discard pile.
  - The presses, in place of "a click rings a browsed card…": a left click on a pile opens nothing; a right click opens the browse, its title's count and its stacks — which card, in which order, how many copies on each badge — read from the rules on a chronicle whose pile holds two copies alike and two of one card whose counters differ; a left click on a stack does nothing; a right click shows it large; the inspection key does nothing; the back key brings the browse back and then closes it, raising no menu; the chronicle is unchanged.
  - The small card and the bubble following the scroll, on the rebuilt overflowing pile.
  - A fourth: on the discard pile's top card, a rest on a name raises its small card and a right click on it shows the named thing large, no browse rising.
- CI's, on the push, listed at the hand-back and not run: `e2e/press.spec.ts` (its "right presses beside the cards walk a browse back" loses the ring step; its "a browse released off the canvas stays open" runs on the rebuilt pile), `e2e/menu.spec.ts`, `e2e/hover.spec.ts`, `e2e/reference.spec.ts`, `e2e/inspect.spec.ts`, `e2e/pointer-sweep.spec.ts`, `e2e/deal.spec.ts`, `e2e/capstone.spec.ts`, `e2e/worker-instants.spec.ts`, `e2e/launch.spec.ts`, `e2e/collection.spec.ts`.
- A `visual-check` of both browses on the chronicle screen after the ship: the badge on a hazard's stack, two stacks of one card side by side, the title clear of the first line, the discard pile's small card clear of the hand.
