# The minimized deal window's presses

**Line:** The minimized deal window's presses — under a minimized deal window a left click selects a tile or a unit and aims nothing, city mode is entered and left by every door with culture's reading of its panel dead, the back key brings the window back last, and End turn, for as long as a deal stands, wears the kit's steel, a speech balloon holding a question mark and no chip, a left click on it under the minimized window bringing the window back; `e2e/minimize.spec.ts` proves it.

**Spec:** `docs/CHRONICLE-SCREEN.md` _The deal window_ and _The end-turn button_, `docs/LOOK.md` (the glyphs' table, _A button_), `public/assets/LICENSES.md` _Material Design Icons_.

- `docs/CHRONICLE-SCREEN.md` _The deal window_, fourth paragraph: `A left click on the sunk button, a click on the ribbon, left or right, or the back key brings the window back, whole at once and as it stood.` becomes

  > A left click on the sunk button, a click on the ribbon, left or right, a left click on End turn or the back key brings the window back, whole at once and as it stood.

- `docs/CHRONICLE-SCREEN.md` _The deal window_, fifth paragraph, replaced whole by:

  > **Under a minimized window the chronicle screen is read, and nothing is commanded or aimed.** The map pans and zooms, the right click inspects and the rest raises what it raises, on the map, on the bar and on a card of the hand, which lifts under the pointer as on any turn; what shows and hides a display reacts as on any turn, a pile opens its browse, the ledger folds, scrolls and raises the capstone's window, the log folds, scrolls and centres the map on a line's tiles, and the menu opens. A left click on a tile selects it, or the unit on it, as on any turn, the summary reads the selection and the inspection key inspects it; a unit of the player's selected there lights no tile and marks no unit, as an enemy's does on any turn. City mode is entered and left as on any turn, by every way in and every way out, and pressing culture on the resource bar enters it with nothing selected. In city mode a left click selects a tile and a second on it does nothing, and culture's reading of the panel is dead, so no claim is aimed. A card of the hand reacts to no left click, and a held press takes hold of nothing, so every drag on the map pans it and none lifts a card out of the hand. A browse, the capstone's window and the menu each close back onto the screen with the window still minimized. The back key walks back as on any turn, a card shown large, a browse or the capstone's window, the inspection, the selection, then city mode, and brings the window back where it would raise the menu; from the window it raises the menu. The selection and city mode stand under the window brought back, as they wait under the menu, and the choice's play-out drops the selection as any play-out does.

- `docs/CHRONICLE-SCREEN.md` _The end-turn button_, one paragraph added after its first:

  > **While a deal stands, End turn says so.** From the moment a deal's window rises until its choice is taken, the button wears the kit's steel ([`LOOK.md`](LOOK.md)), a speech balloon holding a question mark in the hourglass's place, and no chip. Under the window whole it stands dimmed under the scrim with the rest of the screen. Under the window minimized a left click on it brings the window back; it is lighter under the pointer, as a well is, and the pointer resting on it raises a tooltip over it reading `A choice is waiting`.

- `docs/LOOK.md`, the glyphs' table, one row after `The end-turn button on the settle phase`:

  > | The end-turn button while a deal stands | a speech balloon holding a question mark | Material Design Icons, `message-question` |

- `docs/LOOK.md` _A button_, after `while the player's city stands nowhere it wears the kit's disabled button, a steel with no gold, its sign in a greyed ink.`, one sentence added:

  > While a deal stands it wears that steel and that ink too, and under a minimized window, where a press on it reacts, it is lighter under the pointer as a well is and wears no pressed look.

- `public/assets/LICENSES.md` _Material Design Icons_: `twenty-six` becomes `twenty-seven` in both places; `` `axe-battle` by Colton Wiscombe `` becomes `` `axe-battle` and `message-question` by Colton Wiscombe ``; the Licence entry's list of readings gains, before `The licence's text ships`, ``, and `message-question`, read on 2026-11-27 in the set's `meta.json` (in no category)`` (read at the intake, `@mdi/svg` 7.4.47's `meta.json`: author Colton Wiscombe, no tag).
- Player-facing text, one entry: `A choice is waiting`, End turn's tooltip while a deal stands.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`, `public/assets/LICENSES.md`. `docs/MAP-SCREEN.md` and `docs/INTERFACE.md` stay as they are: every exception a minimized window makes lives in _The deal window_'s paragraph, as today, and the pointer's rules already say the arrow, the pointing hand and the help sign for what this line leaves. No glossary row.

**Scope:**

- In: the left click on the map under a minimized window, city mode's doors there, the back key's walk there, and End turn's look and press while a deal stands. Out: the hand, which reads exactly as today; the holds on the map, dead exactly as today; culture's reading of city mode's panel, dead exactly as today; the Minimize button, the ribbon and the window itself.
- Settled with the user, shape first: under a minimized window a left click selects to read and nothing is ever being aimed, because a lit reach, lit tiles or claim marks would look like the game should react.
- End turn, settled on https://claude.ai/artifact/RZSKXDkeGpPqLsgLiu6eYo: the kit's steel, the sign Material Design's `message-question` in the steel's greyed ink at a sign button's share, no chip, the tooltip `A choice is waiting`; worn for as long as the chronicle the screen stands on holds a deal waiting, the window whole or minimized; live under the minimized window alone, a left click bringing the window back; under the pointer, live, the wash a well wears, and no pressed look.
- Reconciled, each in the player's terms:
  - A unit of the player's selected under a minimized window goes through what an enemy's unit selected shows on any turn: the ring and the summary, nothing lit, nothing marked, no path. A second click on it still selects its tile, and one on that tile the unit again.
  - The hand and the map's holds go through the minimized window's own gates as they stand.
  - City mode under a minimized window is city mode as it stands, with three differences, all meant: a click on the selected held tile assigns nobody and unassigns nobody, and nobody is dragged; culture's reading of the panel stays dead; pressing culture on the resource bar enters the mode with no claim aimed.
  - End turn's look goes through the settle phase's steel as it ships, the same piece and the same greyed ink, with no chip as on the settle phase. It differs in its sign, in its tooltip, and in being live.
  - The live steel's lighter look goes through the wash a well and a pile's round wear under the pointer.
  - A press on it goes through what the sunk Minimize button does: the window back whole at once and as it stood. It takes the left click alone, as End turn does; the ribbon keeps both clicks.
  - "While a deal stands" is the fact the resource bar's end-of-turn reading goes down on.
- Corner cases decided here:
  - Nothing is aimed while a deal stands, the window whole included: a unit selected under the minimized window stays unlit under the window brought back, and the choice's play-out drops the selection.
  - Out of city mode, a left click on the player's city's own tile once selected enters city mode, as on any turn, and the pointer there is the pointing hand. In city mode the pointer on the selected held tile is the arrow, a click there doing nothing.
  - Culture and idle on the resource bar keep their gold as on any turn, and culture's reading of the panel its gold, dead as it is.
  - The dim of a unit that can do nothing, the yields, the assigned marks, the empty discs and the dark of an unassigned tile all stand as on any turn.
  - The pointer on a unit of the player's is the arrow, no hold taking it. On End turn under the minimized window it is the pointing hand.
  - End turn changes look as the screen comes to stand on the chronicle holding the deal, and is back on its gold, its hourglass or its village, and its chip as the screen stands on a chronicle holding none; through the play-out between, it is dead as through any play-out. Several deals waiting in a row keep the steel between them where the chronicle between them still holds one.
  - A deal standing on the settle phase: the deal's look wins over the village and over the settle phase's own steel, and the press brings the window back whether the city stands or not.
  - End turn's tooltip reads `A choice is waiting` whenever the deal's look is worn; under the window whole no pointer reaches it.
  - A second click on a held tile the rules would refuse raises no refusal's note either: it does nothing.
  - The debug console's entries are left as they are.
- Named to the user at the intake and accepted: with the chip gone the turn's number reads nowhere but the log's headings while a deal stands, and the steel means two things, dead before the city stands and live while a deal waits, told apart by sign and tooltip.

**Traps:**

- The rules refuse every command but the take while a deal waits, as a `refused` group holding nothing, and a play-out of such a group still drops the selection. So no command may be sent from under a minimized window: the spec asserts the chronicle unchanged and the selection still standing after a second click on a held tile in city mode.
- One gate recorded as each left press lands stops every left click's door under a minimized window today, on the map and beside it alike. Opening it opens the press beside the things too: it drops the selection and the inspection as on any turn.
- The map lights a selected unit of the player's by itself, whenever it is told what is selected. No aim under a deal has to reach that lighting, the pointer's reading of a lit tile and of a marked unit with it.
- City mode's two doors and the claim each have a gate of their own on the minimized window; the resource bar and city mode's panel read those gates for their own liveness, and so does the pointer.
- The back key's walk on the chronicle screen brings the window back right after the inspection today, ahead of the hand, the selection and city mode.
- End turn's steel is asked by one fact today, the city standing nowhere, and a button on the steel wears no look of its own: the kit holds no hover piece for it. Its liveness, its sign, its chip and its tooltip are each read where the settle phase's are.
- `docs/PHASER.md` _What the pointer is over_ and _The pointer across scenes_: End turn comes live and dies under a pointer that holds still, as the window is minimized and brought back, and the scrim rising on its own press is the pointer leaving it.
- The glyphs' sheet is built from the cast's files at boot, and each Material Design file is changed in one thing, its path filled white, with a comment saying so; `message-question` enters `public/assets/material-design-icons/` the same way, from `@mdi/svg` 7.4.47.
- `e2e/city-mode.spec.ts` holds a test of culture's reading dead under a minimized window, the mode entered before the deal rose; it stays true.
- The mockup's other treatments, the gold, the eye and the chip kept, were served and not taken; nothing of them ships.

**Plan:**

1. The glyph enters the repository with its licence entry and its place in the cast; the cast's and the catalogue's tests still pass.
2. End turn while a deal stands: the steel, the sign, no chip, the tooltip, on the window whole and minimized; dead still under the minimized window.
3. End turn live under the minimized window: the press bringing the window back, the wash under the pointer, the pointing hand.
4. The left click on the map under a minimized window: a tile or a unit selected, the summary and the inspection key reading it, nothing lit or marked, the press beside the things dropping it.
5. City mode's doors under a minimized window, culture on the resource bar entering with nothing aimed, the second click on a held tile sending nothing.
6. The back key's walk, and what stands under the window brought back.
7. The spec, then the pages and the licence record.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `npx playwright test e2e/minimize.spec.ts -x`, its tests rewritten to the paragraph as it now reads: under a minimized window a left click on the scout's tile rings the scout and raises the summary with no tile lit, a second rings its tile; the city key enters city mode and leaves it, culture on the resource bar enters it with no tile marked, and a second click on a held tile leaves the chronicle and the selection as they were; a left click on a card of the hand and a drag from the scout's tile do what they do today; End turn wears the steel, the speech balloon and no chip under the window whole and minimized, raises `A choice is waiting`, and a left click on it brings the window back whole; the back key drops the selection, leaves city mode, then brings the window back; a left click on an answer then takes it and End turn wears its gold, its hourglass and its chip. CI proves on the push: `city-mode.spec.ts`, `buttons.spec.ts`, `chrome.spec.ts`, `cursor.spec.ts`, `pointer-sweep.spec.ts`, `hover.spec.ts`, `press.spec.ts`, `settle.spec.ts`, `landing.spec.ts`, `sites.spec.ts`, `window.spec.ts`, `graphics.spec.ts`, `log.spec.ts`, `map.spec.ts`, `ending.spec.ts`.
