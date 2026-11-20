# The chrome's paper

**Line:** The chrome's paper — what a panel, a button, a well, a plate and a window are drawn as on the chronicle screen, the packs searched afresh at its intake; the meta screens keep theirs. Done when the chronicle screen's resource bar, band, pinned achievements, answers, exhaust tab, tooltip and refusal's note stand on the metal kit's panel, the menu's windows on its panel with the gold band, End turn, Menu, Icons and every button of the menu's windows and the ending screen are the kit's buttons with their hover and pressed looks, the wells are the kit's inactive tab, the Menu button and its windows wear the kit on every screen, the meta screens otherwise stand as they did, the kit is in the store with its licence entry, the pages below say so, and `e2e/chrome.spec.ts` passes.

**Spec:**

`docs/LOOK.md`, _Two families_, a paragraph after the card frame's:

> **The chrome** is neither either: DRStudios' metal kit, a piece of the interface from another hand, drawn round every panel, window and button the screens are worked through (_The chrome_, below).

`docs/LOOK.md`, a section before _The type_:

> ## The chrome ✅
>
> The chrome is DRStudios' metal kit, each piece drawn at any size from its corners, the corners as the kit paints them and its edges stretched between them, over the soft shadow the kit lays under it.
>
> **A panel** is the kit's panel: a thin polished silver rim round a charcoal body, its corners rounded. The resource bar, the band the hand and the piles stand in, a pinned achievement, an answer and the capstone's text, the exhaust pile's tab, a tooltip and a refusal's note each stand on one. The bar's panel runs on past the screen's top and sides, and the band's past its bottom and sides, so each shows only the rim along its inner edge.
>
> **A window** of the menu is a panel with the gold band of the kit's window laid inside its top edge, as tall as the window's title stands, the title on the gold.
>
> **A button** is the kit's: its gold for End turn, a window's buttons and the ending screen's, and its darker silver for the Menu button and the Icons button. Under the pointer a live button wears the kit's hover look, and while a press that landed on it is held on it, its pressed look; a dead button keeps its own look and wears no hover. End turn wears its gold on the settle phase as on any turn.
>
> **A well** is the kit's inactive tab: a latched reading of the resource bar, a reached pinned achievement and the latched Icons button sit in one. A reading whose act is waiting in city mode stands on a button's gold instead.
>
> Words on the charcoal read in a pale ink, and words on the silver and the gold in a dark one. An answer the player's city cannot pay for, or one refused, stands on its panel darkened, its words darkened with it.
>
> The Menu button and the menu's windows wear the chrome on every screen. The campaign, launch and collection screens otherwise keep a flat grey paper of their own, their buttons, wells and plates drawn on it. The aim's line keeps its dark slab, and a browse its copies badge and its scrollbar.

`docs/LOOK.md`, _The packs_, an entry after Nice Card Game Template 2's:

> - **DRStudios' UIForge kits**, a bundle of nine, bought: the metal kit draws the chrome, its panel, its window's gold band, its gold and darker silver buttons with their hover and pressed looks, and its inactive tab. Its terms: free and commercial games allowed, as many as are made, the raw files never handed out on their own. The files the game draws live in the store with the bought packs.

`docs/INTERFACE.md`, _The presses_, the sentence "One thing reacts to a press as it lands: a panel running on from a drag stops under it." becomes:

> Two things react to a press as it lands: a panel running on from a drag stops under it, and a button wears its pressed look for as long as the press that landed on it is held on it ([`LOOK.md`](LOOK.md)); the press changes nothing else until it is let go.

`docs/CHRONICLE-SCREEN.md`, the answers' paragraph: "on the panel's paper, as a plate of the tree is drawn," becomes "on a panel ([`LOOK.md`](LOOK.md))," and its last sentence becomes:

> An answer the player's city cannot pay for, or one refused, stands on its panel darkened, its words darkened with it.

`docs/CHRONICLE-SCREEN.md`, the paragraph opening "Culture and idle are the two readings that enter city mode": "each fills its well in a colour of its own while city mode has that act waiting:" becomes "each stands on a button's gold while city mode has that act waiting:", and its last sentence becomes:

> The gold stands where the well a latched reading sits in would, the reading sunk the same way; a reading latched with its act waiting stands on the gold.

`docs/CHRONICLE-SCREEN.md`, the pinned achievements' paragraph: "each on the panel's paper and as wide as a plate of the tree" becomes "each on a panel and as wide as a plate of the tree"; "the paper as tall as they stand" becomes "the panel as tall as they stand"; "the paper as tall as that one line" becomes "the panel as tall as that one line".

`docs/MAP-SCREEN.md`, _On the settle phase_: "The map's frame drawn in the settle phase's own colour, a chip naming the phase where city mode's chip stands, and the end-turn button filled in that same colour are how the chronicle screen shows the phase is on; the chip reacts to no press, and all three go as the turn ticks to turn 1." becomes:

> The map's frame drawn in the settle phase's own colour and a chip naming the phase where city mode's chip stands are how the chronicle screen shows the phase is on; the chip reacts to no press, and both go as the turn ticks to turn 1.

and the paragraph's last sentence loses ", and the button keeps the phase's colour", ending "stand in place of the settle phase's until it is left."

`public/assets/LICENSES.md`, an entry:

> ## UIForge metal kit
>
> - **What:** DRStudios' metal UI kit, the pieces the chrome draws, in `store/uiforge-metal-ui-kit/`, the kit's `pack.json` beside them.
> - **From:** DRStudios (Deer Rock Studios), <https://drrstudios.itch.io/metal>, bought on 2026-11-20 in the bundle "GAME UI ASSETS PACK OR ONE", <https://itch.io/s/198337/game-ui-assets-pack-or-one>, generated on 2026-08-13 as the kit's `pack.json` records, the files as released.
> - **Licence:** the pack page's own terms, the bundle carrying no licence file: "Royalty-free for commercial and personal projects. Unlimited shipped games. No redistribution of raw assets." The page states that no generative AI was used; the kit's `pack.json` names its maker as DRStudios' own generator, UIForge, its pieces vector shapes and gradients. The files sit in the store, never in this repository.

No player-facing text entry is added or changed.

**Doc-impact:** `docs/LOOK.md`, `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/MAP-SCREEN.md`; `public/assets/LICENSES.md`.

**Scope:**

In, every place below changing its paper and nothing else — no position, size or order moves:

- The resource bar's panel, and the wells under its readings: a latched reading sits in the kit's inactive tab, a reading whose act is waiting stands on the gold button's piece, a reading both stands on the gold.
- The band under the hand, the exhaust pile's tab, the pinned achievements (a reached one sits in the inactive tab), the answers of the deal window and the capstone's text, the tooltip's and the refusal's note's bubble.
- End turn (the kit's gold, also on the settle phase), the Menu button on every screen (darker silver), the Icons button (darker silver, latched in the inactive tab).
- Every window of the menu on every screen — Menu, Settings, Controls with its key slots and wheel rows, Graphics, Manage Save, the warnings, the refused save's window — and the ending screen's buttons: windows on the panel with the gold band, buttons on the kit's gold.
- Hover and pressed looks on every kit button that reacts to a press; End turn keeps its hover reading `End turn`.

Out: any layout (later lines); the palette; the campaign, launch and collection screens beyond the Menu button and its windows — the navbar and its bar, the tree's plates, the collection's and the launch screen's buttons and wells keep today's grey, wells and gold; the aim's line's slab; a browse's copies badge and scrollbar; the debug console; the kit's font (Source Sans 3 stays); the bundle's other eight kits.

Corner cases decided here:

- A dead button — End turn while it is dead — keeps its normal look and wears no hover. The kit's disabled pictures are not used.
- The pressed look comes off as the press is let go anywhere, as the pointer leaves the button with the press held, and as a scrim rising lets the press go.
- A refused answer: its panel and its words multiplied by the darkening today's refused paper stands at against today's paper (`0xa7` over `0xd4`, about 0.79); its glyphs keep their own colours, as today.
- A browse draws no paper of its own today, so the menu-everywhere and browse-everywhere decisions change nothing on a browse in this line.

The sizes, as the mockup drew them, in design units per pixel of the kit's 2x files (the corners and edges scale together, so the rim is the file's own rim, about 11.5 pixels, times this): the bar and the band 0.16; a pinned achievement, an answer, the capstone's text, the tooltip and the refusal's note 0.12; the exhaust tab 0.10; a window 0.24, its gold band from the window's top to 66 units under it, inside the rim, its top corners rounded as the rim's inner corner, the kit's dark line under the band kept. A button and a well are drawn at the height they stand today, the file's own height under its shadow fitted to it (108 pixels for the darker silver button, 164 for the gold, 92 for the inactive tab).

Inks, each a new `LOOK` entry named for its meaning: words on the charcoal `#f2f6ff` where they read today's ink, `#aab0b8` where they read today's faint ink (the bar's words); words on a button's silver or gold today's dark ink.

Reconcile, chosen with the user:

1. The three ways the chronicle screen draws a button today — the menu's gold buttons the ending screen borrows, the paper buttons of Menu and Icons, End turn's own rectangle — become one button with its states, the piece (gold or darker silver) its parameter.
2. Today's grey paper, drawn separately by the bar, the band, the pinned achievements, the answers, the menu's windows, the tooltip's bubble and the exhaust tab, becomes the kit's panel through one door, the window its panel with the band.
3. The tree's plates keep today's paper, so a pinned achievement and an answer leave the plate's paper they share with it today; the meta screens keep it too.
4. Today's well stays for the navbar and the tree; the chronicle screen's wells are the kit's tab. Two wells stand side by side, meant, until the meta screens are redone.
5. A refused answer's darkening and a worn card's darkening stay two entries: two meanings.
6. Words go pale wherever they stand on the charcoal.
7. The aim's line keeps its slab.
8. The scrollbar and a browse's copies badge stay as they are.
9. The debug console stays as it is.

**Traps:**

- The kit's files are at `C:\Users\daind\OneDrive\Bureau\Bought Assets\DRStudios\uiforge-metal-ui-kit\`: `png/1x`, `png/2x` and `png/4x` of every piece and state as separate files (`btn_cta_hover.png`, …), `svg/`, and `unity/sprite_borders.csv`, the cut lines in 2x pixels as (left, bottom, right, top) — the panel 68 all round, the window 68 with 150 on top, the buttons 46/54/46/46 and the gold 54/62/54/54, the tab 44/52/44/44. Every file carries a shadow margin of 10 pixels at 2x all round, outside the piece's own box. The pieces used: `panel_normal`, `modal_normal` (its gold band alone: the band and the dark line under it are rows 21 to 147 of the 2x file, inside the rim), `btn_cta_*` and `btn_secondary_*` in `normal`, `hover` and `pressed`, `tab_inactive`.
- The store first: the files land in `public/assets/store/`, are committed and pushed there, and only then does the pointer move on `main` (`DOGMAS.md` _Stack_); the licence entry lands in the same unit.
- Phaser's NineSlice keeps its corners at the texture's own pixels and stretches only the edges and the middle (`node_modules/phaser/src/gameobjects/nineslice/NineSlice.js`): a thinner rim is the object scaled down, its width and height set as the box over that scale. It takes a multiply tint, which carries the refused answer's darkening. Which file scale is loaded is the implementer's, read against the window's pixel density (`docs/INTERFACE.md` _The window_, `docs/LOOK.md` _The type_).
- The images the game loads go through `src/ui/sheet.ts`; its sheet's 4096 side has overflowed before with many variants.
- A game object is made once and changed in place (`DOGMAS.md` _Stack_): a button's state is a texture swap, never a rebuild, and the hover the cursor reads stays on the same object.
- End turn stays interactive dead or live, so no press reaches the map under it; its hover already swaps its label through `onHover`, and the hover look rides that same hover.
- The pinned achievements and the answers take their text styles from `src/ui/plate.ts`, which the tree shares; the tree keeps today's ink.
- `createWell` lives in `src/ui/resource-bar.ts` and serves the navbar and the tree, which keep it.
- `e2e` reads today's chrome by fill colour: `wellFill`, `endTurnFill` and `fillOf` in `e2e/chronicle-screen.ts`, `e2e/city-mode.spec.ts` against `LOOK.actWaiting`, `e2e/settle.spec.ts` against `LOOK.settlePhase` and `LOOK.button`, `e2e/end-of-turn-reading.spec.ts` against `LOOK.ink` for the bar's words. Those readings move to what the kit's objects are (the texture worn, the ink entry) through helpers in `e2e`, never an object shaped for them. The settle spec's lime check goes: the design no longer promises it (the user's decision at this intake).
- The meta screens' specs (`campaign`, `collection`, `civilization-mode`, `tree`) read today's grey and gold and must stand unchanged.
- The mockup the user judged is `.playwright/chrome/page/index.html` (local, git-ignored), look `kit`, window `header`, rims 50% and 80%; its `sliced` and `kitWindow` functions are how it drew each piece.

**Plan:**

1. The kit's pieces in the store, pushed; the licence entry. Leaves: the files reachable by the dev server, nothing drawn yet.
2. The kit loaded at the boot and the chrome's doors in `src/ui/` — a panel, a window with its band, a button with its states over a piece, a well — with the new `LOOK` entries. Leaves: the doors standing, used by nothing.
3. The chronicle screen moved onto them, one surface at a time, the screen whole after each: the resource bar and its wells; the band and the exhaust tab; the pinned achievements; the Icons and Menu buttons; End turn; the menu's windows and the ending screen's buttons; the answers and the capstone's text; the tooltip's and the refusal's note's bubble. Dead `LOOK` entries and today's door that no screen uses any more go with the last of their users.
4. The `e2e` helpers and the specs reading today's chrome; the settle spec's lime check removed; `e2e/chrome.spec.ts` added: on a planted chronicle, End turn wears its hover look under the pointer and its pressed look while a press landed on it is held, the chronicle unchanged until the press is let go and the turn ended at the release; a press held on it and dragged off leaves its normal look and ends no turn.
5. The docs above, word for word.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof: `npx playwright test e2e/chrome.spec.ts`. The `visual-check` skill on the chronicle screen at rest and in city mode with culture's act waiting, the menu and each of its windows, the deal window with a refused answer, the capstone's window and the ending screen. CI proves on the push, repeated at the hand-back: `settle`, `city-mode`, `icons`, `pin`, `press`, `held-press`, `hover`, `frame-press`, `pointer-sweep`, `menu`, `controls`, `graphics`, `manage-save`, `refused-save`, `deal`, `capstone`, `ending`, `victory`, `fall`, `end-of-turn-reading`, `refuse`, `reference`, `launch`, `campaign`, `collection`, `civilization-mode`, `tree`, `console`, `window`, `boot`.
