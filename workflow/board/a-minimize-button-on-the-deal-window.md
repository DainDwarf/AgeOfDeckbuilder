# A minimize button on the deal window, as a test

**Line:** A minimize button on the deal window, as a test — a button at the end of the deal window's ribbon minimizes the window, the ribbon and the sunk button alone left standing, the chronicle screen read under it and nothing commanded, and a click on the button or the ribbon, or the back key, brings the window back whole; `e2e/minimize.spec.ts` proves it. Built for the user to judge in play, and kept or taken out on their word.

**Spec:** `docs/CHRONICLE-SCREEN.md` _The deal window_, `docs/INTERFACE.md` _What stands over what_, `docs/LOOK.md` (the glyphs' table, _A button_, _A well_), `public/assets/LICENSES.md`.

- `docs/CHRONICLE-SCREEN.md` _The deal window_, two paragraphs added after its third:

  > **A button at the right end of the title's ribbon minimizes the window**: a small square wearing its sign, an eye struck through, and no word, the pointer resting on it raising a tooltip under it reading `Minimize`. A left click on it, once the window stands whole, minimizes the window: the scrim falls, the lore and what is dealt go, and the ribbon and the button alone stay where they stood, the button sunk in its well. A left click on the sunk button, a click on the ribbon, left or right, or the back key brings the window back, whole at once and as it stood. Over the ribbon of a minimized window the pointer is a hand, and resting there raises nothing. Every deal's window rises whole, the one a chronicle is opened on and the next one after a choice alike.
  >
  > **Under a minimized window the chronicle screen is read, and nothing is commanded.** The map pans and zooms, the right click inspects and the rest raises what it raises, on the map, on the bar and on a card of the hand, which lifts under the pointer as on any turn; what shows and hides a display reacts as on any turn, a pile opens its browse, the ledger folds and raises the capstone's window, and the menu opens. A left click selects nothing and acts on nothing, on the map or on a card of the hand, and a held press takes hold of nothing, so every drag on the map pans it and none lifts a card out of the hand; End turn is dead, and nothing enters city mode. City mode standing as the window rose stands as it stood. A browse, the capstone's window and the menu each close back onto the screen with the window still minimized. The back key takes down a card shown large, closes a browse or the capstone's window, drops the inspection, then brings the window back; from the window it raises the menu.

- `docs/INTERFACE.md` _What stands over what_, first paragraph: in the UI's order, `the resource bar, the end-turn button, a card in motion` becomes `the resource bar, the end-turn button, a minimized deal window's ribbon and its button, a card in motion`.
- `docs/LOOK.md`, the glyphs' table, one row after the Hex grid button's: `| The Minimize button | an eye struck through | Material Design Icons, `eye-off` |`.
- `docs/LOOK.md` _A button_: the bright silver's list gains `the Minimize button`, and the sentence naming the squares that wear a sign and no word gains it too, with `the Minimize button a smaller square, beside its ribbon` after it.
- `docs/LOOK.md` _A well_: the first sentence's list gains `the sunk Minimize button`.
- `public/assets/LICENSES.md` _Material Design Icons_: the count goes to twenty-three, `eye-off` is added to its author's list with the author read off the glyph's page or the set's `meta.json`, and its category is read and dated in the Licence entry as the others are.
- Player-facing text, one entry: `Minimize`, the button's tooltip, standing and sunk alike.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`, `public/assets/LICENSES.md`. No glossary row: minimize is an interface word, as the ledger's fold is, and the glossary holds neither.

**Scope:**

- In: the deal window in its three deals, an event's, a capture's and a card's. Out: a browse, the capstone's window and the ending screen get no button; the Menu button going under every scrim is the next line's.
- The look, settled on https://claude.ai/artifact/VPfns3RAgG5bSajULYG9Ji: the button is a 32 square of the kit's bright silver, 8 right of the ribbon's painted right end, its middle on the ribbon's; its sign Material Design's `eye-off`, as wide a share of the square as every sign button's, in the dark ink; sunk, it sits in the well a shown display's button sits in, the sign pale and a step down and right, as the Icons button's is. Minimized, the ribbon and its title stand exactly where they stood, at full light.
- Reconciled, each in the player's terms:
  - The button goes through the display buttons' behaviour as it is (Icons, Faction signs, Hex grid): standing or sunk, a left click switching it, a name on the rest under it. Its size is the one difference, meant.
  - The minimized ribbon reacts as the capstone's row of the ledger does, to either click; it differs in wearing no lighter look and raising no tooltip, both meant.
  - The ledger folds and the window is minimized: two words, kept apart on the pages.
  - Dead means what a play-out's dead means for End turn; the hand is new: it reads and takes no left click and no drag, a gate the hand does not have today.
- Corner cases decided here:
  - The button reacts to a left click only once the window stands whole, as what is dealt does; its tooltip rises on a rest at any time.
  - The window comes back whole at once, with no rise and no beat, and takes a left click at once.
  - A card shown large over the window covers the button with its scrim: a press there is a press on that scrim.
  - A refusal's note standing over an answer goes with the window, and is not back when the window is.
  - Nothing is selected under a minimized window: every play-out drops the selection before a deal rises, and no left click makes one, so the inspection key does nothing there. An inspection is made by the right click alone.
  - The end-of-turn reading on the bar stays down, as it does while any deal waits; the rules decide it, not the scrim.
  - The culture and idle readings raise their tooltips and enter no city mode; the city key does nothing. In city mode standing as a card's deal rose, the map is read as it stands and no claim or assignment is made.
  - End turn's tooltip rises on a rest, dead as it is.
  - A window resized, or the interface size changed, while minimized: the ribbon and the button stand where a risen window's would.
  - A page reloaded on a minimized window opens as any chronicle opened on a deal does, on the window whole.
  - A browse or the capstone's window raised while minimized stands on the scrim as over a clean screen; the minimized ribbon and its button are under that scrim, dimmed with the rest, and stand lit again once it closes.
- The verdict: the hand-back asks the user to judge it in play. Kept, nothing more is owed. Taken out, the delivery's commit is reverted, pages included.

**Traps:**

- `docs/PHASER.md` _What the pointer is over_ and _The pointer across scenes_: the overlay scene stops every press while anything on it takes the pointer, and a scrim rising or falling under a resting pointer brings no over and out. The minimized state is the overlay holding two pressable things and letting everything else through to the screen beneath.
- The overlay's browser holds one scrim and takes down everything standing on it whenever something is raised or closed. A pile's browse and the capstone's window raised from the ledger go through that same door, so the minimized ribbon and button, and the deal they stand for, must outlive both a raise and a close.
- The overlay raises the deal's window when a render finds a deal waiting and none standing. Closing the capstone's window or a browse over a minimized deal must not raise the deal's window again.
- The chronicle screen is told it is covered from the first thing to rise on the overlay to the last to go, and under cover its pan and zoom keys and wheel are dead. Minimized, it is not covered.
- The hand has one gate on its pointer, shut through a play-out: no hover, no click, no drag. Minimized asks for the hover, the rest and the right click alive and the left click and the drag dead.
- The map pans under a held left press unless the press took hold of a unit or a population; minimized, it takes hold of neither.
- The rules refuse every command but the take while a deal waits, as a `refused` group holding nothing, so a command sent by mistake shows nothing: the screen's gates are the only sign, and a spec must assert the chronicle unchanged.
- The glyphs' sheet is built from the cast's files at boot, and each Material Design file is changed in one thing, its path filled white, with a comment saying so; `eye-off` enters `public/assets/material-design-icons/` the same way, from `@mdi/svg` 7.4.47.
- The mockup's `Back to` bar, the button over End turn and the `Map` name were served and not taken; nothing of them ships.

**Plan:**

1. The glyph enters the repository with its licence entry and its place in the cast; the catalogue's and the cast's tests still pass.
2. The deal window wears the button, with its tooltip, live once the window is whole; pressing it does nothing yet beyond its looks.
3. Minimizing and bringing back: the scrim, the lore and the row go and return, the ribbon and the sunk button stay and react, the screen beneath is uncovered and covered again.
4. The gates under a minimized window: the hand reading, End turn, the left click on the map, city mode's doors, the back key's walk.
5. A browse, the capstone's window and the menu over a minimized window, each closing back onto it.
6. The spec, then the pages and the licence record.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is the spec the line adds, `npx playwright test e2e/minimize.spec.ts`: on an event's deal and on a card's, the button minimizes the window; under it the map pans, a right click on a tile inspects it, a card of the hand lifts and is shown large, a left click on a tile, on a card and on End turn leaves the chronicle and the selection as they were; a pile's browse opens and closes back onto the minimized window; the sunk button, a click on the ribbon and the back key each bring the window back, and a left click on an answer then takes it. CI proves on the push: `deal.spec.ts`, `calendar.spec.ts`, `capstone.spec.ts`, `landing.spec.ts`, `browse.spec.ts`, `piles.spec.ts`, `pin.spec.ts`, `reference.spec.ts`, `press.spec.ts`, `held-press.spec.ts`, `hover.spec.ts`, `buttons.spec.ts`, `resume.spec.ts`, `window.spec.ts`, `end-of-turn-reading.spec.ts`.
