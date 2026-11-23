# The windows on the scrim

**Line:** **The windows on the scrim** — the title of the deal window, the capstone's window and a browse stands on the kit's ribbon and the ending screen's outcome on a larger one, each window on the scrim itself and on no panel; a deal's title and the capstone's stand at one height, the lore under the title and the row under the lore; the lore is broken as a window's line is; a stack's copies read on the counter chip; an answer the click would take is lighter under the pointer; an answer the player's city cannot pay for darkens its glyphs with its words, reads the number it cannot pay in the unaffordable red and says why in a tooltip under a resting pointer; the ending's rule is the faint rule; `e2e/deal.spec.ts` passes.

**Spec:** the pages below, each sentence written out. The measures stand in Scope and in the code, on no page.

[`docs/CHRONICLE-SCREEN.md`](../../docs/CHRONICLE-SCREEN.md) → _The deal window_, first paragraph:

- `one of several as a browse draws a stack, its badge reading the copies` becomes `one of several as a browse draws a stack, its count reading the copies`.
- `What is dealt stands in one row, centred, in the order dealt, under a title naming the event: an event's answers as text, a capture's rewards as cards. The lore stands over the row, centred, in the title's ink, and the two meet at one height whatever is dealt: the lore ends and the row starts at fixed heights, so the row stands clear of the hand.` becomes `The window is laid out from its title down: the title, naming the event, stands on the kit's ribbon ([`LOOK.md`](LOOK.md)) at one height whatever is dealt; the lore stands under it, centred, in the pale ink, broken as a line of a window of the menu is; and what is dealt stands under the lore in one row, centred, in the order dealt: an event's answers as text, a capture's rewards as cards. A row under a short lore so starts higher than one under a long lore, and each stands clear of the hand.`

Same section, second paragraph:

- `An answer the player's city cannot pay for, or one refused, stands on its panel darkened, its words darkened with it.` becomes `An answer a left click would take is lighter under the pointer, as a pile's round is. An answer the player's city cannot pay for, or one refused, stands on its panel darkened, its words and its glyphs darkened with it, and is no lighter under the pointer; the number of a cost the city cannot pay reads in the red an unaffordable cost's disc wears on a card, and is not darkened.`

Same section, third paragraph:

- After `a left click on an unaffordable or a refused answer says why over it, in the note a refused card raises, and the window stands.` add `The pointer resting on such an answer, off its names, raises the same line in a tooltip over it, as a pile's name stands over its pile.`

Same page → _The capstone's window_:

- `under one title naming it the capstone, with the capstone's lore for that raising standing over it as the deal's stands over its row, the two meeting at the same height` becomes `under one title naming it the capstone, on its ribbon at the height a deal's stands at, with the capstone's lore for that raising standing under the title as a deal's does, and the capstone under the lore`.
- After `The capstone is no card: it reads no kind, and no press shows it large.` add `It is lighter under the pointer, as an answer is.`

Same page → _The ending screen_, second paragraph:

- `The outcome, the ledger and the **End chronicle** button under it are one block, centred on the screen.` becomes `The outcome's word stands on the kit's ribbon, a larger one than a window's title stands on. The outcome, the ledger and the **End chronicle** button under it are one block, centred on the screen.`

Same page → _The piles_:

- `a badge under the front card's bottom right corner reading them as on the civilization's browse` becomes `a count under the front card's bottom right corner reading them as on the civilization's browse`; and `under a title reading the pile's name and the count of its cards` becomes `under a title on the kit's ribbon reading the pile's name and the count of its cards`.

[`docs/META-SCREENS.md`](../../docs/META-SCREENS.md), the civilization's browse:

- `under a title reading the civilization's name and the count of its cards` becomes `under a title on the kit's ribbon reading the civilization's name and the count of its cards`.
- `A badge under the front card's bottom right corner, standing mostly below the stack and a little past the card to the right so the numbers at the card's foot stay readable, reads the copies` becomes `A count on the kit's counter chip ([`LOOK.md`](LOOK.md)) under the front card's bottom right corner, standing mostly below the stack and a little past the card to the right so the numbers at the card's foot stay readable, reads the copies`.

[`docs/LOOK.md`](../../docs/LOOK.md) → _The chrome_:

- A new paragraph after **A window**: `**A ribbon** is the kit's: a gold band with a notched tail at each end, as long as the words on it ask, its tails drawn as the kit paints them at any length. The title of the deal window, of the capstone's window and of a browse stands on one, in the type and the dark ink of a window's title; the ending screen's outcome stands on a larger one, in a larger type. What a ribbon heads stands on the scrim itself, on no panel.`
- In **A pile's button**, add at its end: `A stack's copies, in a browse and in the deal window, read on the same chip as a pile's count does, under the front card's bottom right corner.`
- The paragraph starting `Words on the charcoal read in a pale ink`: `as is the rule over the wheel's two rows in Controls` becomes `as are the rule over the wheel's two rows in Controls and the rule over the ending screen's total`; and its last sentence becomes `An answer the player's city cannot pay for, or one refused, stands on its panel darkened, its words and its glyphs darkened with it, the number of a cost the city cannot pay in the red an unaffordable cost's disc wears, not darkened. Under the pointer an answer a left click would take, and the capstone's text, are lighter, as a pile's round is.`
- The last paragraph of the section: `The aim's line keeps its dark slab, and a browse its copies badge and its scrollbar.` becomes `The aim's line keeps its dark slab, and a browse its scrollbar.`

No player-facing sentence is new: the tooltip reads the lines the refusal's note already reads (`refused` in `src/ui/refusal-lines.ts`), and the chip reads what the badge read (`collection.row-copies`).

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`, `docs/META-SCREENS.md`.

**Scope:**

In, with the measures the user settled on the mockup (design units, a screen 1280 wide). The pictures of the agreed look are `.playwright/scrim/preview/final-*.png`, and the page that drew them `.playwright/scrim/index.html`; both are git-ignored and local, and where a picture and this file disagree this file is right.

- **The ribbon.** The kit's `ribbon_normal.png`, drawn from its corners. In the 2x file: cuts 56 from the left and the right, 46 from the top, 54 from the bottom, the piece 104 tall under its shadow margin, fitted by its height as a button is. The ribbon is as wide as its title plus 0.9 of its own height on each side. The title's middle stands 4% of the ribbon's height above the ribbon's middle.
- **A title of a window on the scrim** — the deal window's, the capstone's, a browse's, the civilization's browse among them: a ribbon 46 tall, the title 26 bold in the dark ink, the menu's window title's own style.
- **A browse's title** keeps its place: the ribbon's middle where the title's middle stands today, so the ribbon runs from 65 to 111 under the screen's top, and the frame under it starts where it starts today.
- **A deal's title and the capstone's**: the ribbon's top 113 under the screen's top, its foot at 159, on every deal — an event's, a capture's, a card's — and on both raisings of the capstone's window.
- **The lore** starts 24 under the ribbon's foot, 600 wide, centred, in today's type and ink, broken by the menu's line breaker. **The row** starts 32 under the foot of the lore's last line, measured as today's 16 is, whatever the lore's length; rows after the first follow as today. On the mockup the row starts at 260 under a two-line lore, 282 under three, 304 under four.
- **An answer under the pointer**: the wash a pile's round and a window's well wear, fitted to the answer's panel, its corners rounded as the panel's are. An answer refused for any reason wears none. The capstone's answer wears it.
- **An answer refused**: its glyphs through the same darkening as its words and its panel. The number the text reads just before the glyph of a resource the refusal names unaffordable is drawn in the red of an unaffordable cost's disc, at full strength; where the text reads no such number, or the refusal is not a cost's, nothing turns red.
- **Saying why under the pointer**: the pointer resting on a refused answer, off its names, raises the overlay's tooltip over the answer after the tooltip's own rest, reading the lines the note reads, one under the other, its left edge on the answer's and its foot over the answer's top, as a pile's name stands over its pile. A rest on a name raises the name's small card and no tooltip. A left click on the answer raises the note as today.
- **A stack's copies**: the pile's count — chip, type, ink, least width and padding — reading what the badge read, its right edge and its middle where the badge's stand today. The number keeps the name `<name>-copies`. The stack still lies under the pointer on its chip. This covers a browse, the civilization's browse and a deal's reward of several copies.
- **The ending screen**: the outcome on a ribbon 76 tall, its word 44 bold in the dark ink, the ribbon centred in the place the title takes today so the line, the ledger and the button stand where they stand. The rule over the total is the pinned ledger's rule, the pale ink at the row rule's strength. **End chronicle** stays gold.

Out:

- A panel behind any of the four windows, the scrim's strength, an answer's panel, the scrollbar of a browse, the collection screen's and the deck panel's copies.
- A card of the hand saying why under the pointer: it says it on a press, and wears its unpaid cost on a red disc.
- The capstone's window raised from the ledger, the cards it names shown, and a minimize button: their own lines.

Corner cases decided:

- The red is one meaning, a cost the city cannot pay, so it reads the look's one entry for it; whether that entry is renamed now that a number wears it is the implementer's.
- The look's entry for the copies badge's fill leaves with the badge.
- A deal whose rows pass the screen's foot scrolls as today; the lore does not scroll with it, as today.
- A ribbon wider than the screen is not foreseen: the longest title today is a browse's, far inside it.

What the reconcile chose:

1. Saying why under the pointer goes through the tooltip as it is, its rest included; the note stays a press's.
2. A stack's copies and a pile's count become one count; what it reads and where it stands are what differ.
3. The answer's lightening is the wash a pile's round and a well wear.
4. The lore goes through the menu's line breaker unchanged.
5. A ribbon's title is the menu's window title's type and ink.
6. The ending's rule is the pinned ledger's rule.
7. The red number and a card's red disc stay apart and share the red: an answer wears no disc.
8. The three title places stay apart: a deal's and the capstone's, a browse's, the ending's.

**Traps:**

- **The ribbon's file is not in the store.** It is in the bought kit on this machine, `Bought Assets\DRStudios\uiforge-metal-ui-kit\png\2x\ribbon_normal.png` on the desktop, and a copy stands at `.playwright/scrim/kit/ribbon_normal.png`. The store, `public/assets/store/`, is a submodule: the file is committed there and pushed before the pointer moves on `main` (`DOGMAS.md` → _Stack_), or CI is red. `public/assets/LICENSES.md` records the kit as "the pieces the chrome draws" and names no file, so its entry stands as written.
- The kit's sheet lists its files in `src/ui/chrome-kit.ts`; a piece not listed there is not loaded.
- A Phaser text has one colour (`docs/PHASER.md` → _Text_). The mockup laid the red number as a second text over the first, placed off the wrapped lines.
- A text's `wordWrap` callback runs on the text's own context with its font synced (`docs/PHASER.md` → _Text_); `src/ui/menu.ts` shows the breaker handed to it.
- The row's top now depends on the lore's height, and today the lore is raised after the window is laid.
- The window's panel frame starts under the title and clips what it holds; the lore is carried outside the panel, over the frame's span, as today.
- The refusal's note comes down as the next press on its scene is let go (`docs/INTERFACE.md`); the tooltip is another object on another stratum and follows the tooltip's rules alone.
- The deal window takes no left click until it stands whole; the tooltip's rest is longer than the rise.
- `setSlices` leaves a nine-slice's display origin stale; `src/ui/chrome.ts` already answers it in `lay`.
- A game object is made once and changed in place (`DOGMAS.md`): the wash is shown and hidden, never rebuilt.
- A spec asserts no coordinate (`DOGMAS.md` → _Tests_): the layout is proven by what stands under what and by a title holding its height across two deals, never by a number of this file.
- `e2e/deal.spec.ts` rests the pointer off an answer's names on purpose; a rest there now raises the tooltip on a refused answer.

**Plan:**

1. The store: the ribbon's file committed in the submodule and pushed. Leaves the file fetchable by CI.
2. `src/ui/chrome-kit.ts`, `src/ui/chrome.ts`: the ribbon a piece of the kit, drawn at a height round a title. Leaves a ribbon any screen can stand.
3. `src/ui/design-space.ts`, `src/ui/browse.ts`: a window's title on its ribbon, a browse's at today's place. Leaves both browses titled on the ribbon.
4. `src/ui/overlay.ts`: a deal and the capstone laid from the title down, the lore balanced. Leaves the two windows at one title height.
5. `src/ui/piles.ts`, `src/ui/browse.ts`, `src/ui/look.ts`: a stack's copies on the pile's count. Leaves no copies badge.
6. `src/ui/answer-plate.ts`, `src/ui/overlay.ts`, `src/ui/stack.ts` or `src/ui/panel.ts` as the reading asks: the wash under the pointer, the darkened glyphs, the red number, the tooltip on a rest.
7. `src/ui/ending-screen.ts`: the outcome on its ribbon, the faint rule.
8. `e2e/deal.spec.ts`, the specs and the helper in `e2e/chronicle-screen.ts` that read what moved, and the three `docs/` pages.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/deal.spec.ts`, which comes to say that a deal's title stands on its ribbon with the lore under it and the row under the lore, that the pointer resting on an answer the city cannot pay raises the tooltip reading why, and that a left click on it still raises the note.
- The look through the `visual-check` skill: the deal window on an event, on a capture and on an unaffordable answer, the capstone's window, a pile's browse, the civilization's browse and both endings, against `.playwright/scrim/preview/final-*.png`.
- CI proves on the push: `browse.spec.ts`, `calendar.spec.ts`, `ending.spec.ts`, `farm.spec.ts`, `held-press.spec.ts`, `launch.spec.ts`, `long-winter.spec.ts`, `monument.spec.ts`, `neutral.spec.ts`, `raft.spec.ts`, `refuse.spec.ts`, `siege.spec.ts`, `window.spec.ts`.
