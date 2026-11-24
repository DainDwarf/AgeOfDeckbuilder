# A short info window on selection

**Line:** **A short info window on selection** — a left click that selects a unit or a tile raises the summary under the four buttons of the screen's top right corner: one panel of one size reading a unit's name, whose it is and its health, move, action and damage, or a tile's name, all it yields, its building's upkeep and what entering it costs; it reads again at each change that lands and goes with the selection, the chip of a mode stands under its place, damage wears a sword of the cast, and `e2e/summary.spec.ts` passes.

The window's name in the pages is **the summary**. The mockup the user settled it on, the real chronicle screen shot under each selection with the summary drawn over it: https://claude.ai/artifact/3YpYW53Zz795yFt39BpBF4 (open on its defaults: they are the picks).

**Spec:** the sentences below are added or changed as written.

`docs/CHRONICLE-SCREEN.md`, a new section after _The pinned achievements_:

> ## The summary ✅
>
> A **summary** of what is selected stands in the screen's top right corner, under the four buttons there, its right edge on the Menu button's: one panel ([`LOOK.md`](LOOK.md)), of one size whatever it reads, at the same place on every window, in city mode and on the settle phase as on any turn. It stands from the left click that selects a unit or a tile until that selection is dropped, and a selected card of the hand raises none. It reads the chronicle as the map draws it, and reads again at each change that lands, as a value of the resource bar does: a step spends the move it reads.
>
> **A unit's summary** reads, on its first row, a disc of the unit's faction wearing the faction's sign, whatever the Faction signs button shows, then the unit's name, then the badge of a unit that has prepared, as the map's; and at the row's right end the sentence the unit's card reads on the infopanel, where it reads one. Its second row reads four numbers, each after its sign: the health, the move and the action the unit holds over its kind's own, and its damage, with the bonus it carries after a plus sign, each as the unit's card on the infopanel reads it ([`MAP-SCREEN.md`](MAP-SCREEN.md)), a unit a tile in fog keeps read as last seen and an embarked one as it has them embarked. Its range and its sight stand on its card alone.
>
> **A tile's summary** reads, on its first row, the name of the building standing on it, and at the row's right end its terrain's name; a tile with no building reads its terrain's name alone. Its second row reads what the tile yields, a plus sign and one glyph to each point, in the order the resource bar reads the resources: every part of it, its building's among them, read as the yield overlay reads a tile ([`MAP-SCREEN.md`](MAP-SCREEN.md)). After it, behind a minus sign, stands one glyph to each point of its building's upkeep, and last move's glyph and what entering the tile costs in move points, as the terrain card's disc reads it. A tile that yields nothing reads no plus, and one with no upkeep no minus.
>
> The pointer resting on one of a unit's four numbers, or on what entering a tile costs, raises that stat's tooltip, as on a card ([`INTERFACE.md`](INTERFACE.md)). The summary reacts to no press, and stops one as anything standing over the map does.

`docs/MAP-SCREEN.md` _City mode_, second paragraph: "the chip standing in the map's top right corner, under the Menu button" becomes "the chip standing in the screen's top right corner, under the summary's place ([`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)), whether a summary stands there or not".

`docs/INTERFACE.md` _The window_: "the Menu button, the Icons button, the Faction signs button and the Hex grid button to its top right corner and the end-turn button to its bottom right one" becomes "the Menu button, the Icons button, the Faction signs button and the Hex grid button to its top right corner with the summary under them, and the end-turn button to its bottom right one".

`docs/INTERFACE.md` _What stands over what_: "the chip of a mode, the tab of the pinned achievements' ledger and the ledger over it" becomes "the chip of a mode, the summary, the tab of the pinned achievements' ledger and the ledger over it".

`docs/LOOK.md` _The cast_, a row after Health's: `| Damage | a sword | Material Design Icons, `sword` |`.

`docs/LOOK.md` _The chrome_, **A panel**: "the pinned achievements' ledger, an answer" becomes "the pinned achievements' ledger, the summary, an answer". And a new paragraph after **A reading's bar and its end of turn**:

> **The summary** is a panel as a tooltip's, with two rows of room. The name stands bold at the left of its first row, in the charcoal's ink, a unit's after its faction's sign, drawn as the map draws a unit's sign, and before its prepared badge, drawn as the map's. What stands at that row's right end, a unit's sentence or a tile's terrain, is set smaller and paler. On its second row a number stands just after its sign and the numbers a little apart: health's heart in its red, the signs of move, action and damage in the paler ink, a resource's glyph in its colour, the glyphs of a yield touching as a tile's yield glyphs do, every glyph in its outline. The chip of a mode stands just under the summary's place, its right edge on the summary's.

No player-facing sentence is new: every word the summary shows is a name, a reading or a tooltip the game already holds.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`.

**Scope:**

In: the summary on the chronicle screen; damage's sign in the cast, its file and its licence entry; the mode's chip moved under the summary's place; the four pages.

The mockup's measures, in units, are the instruction for the look: the summary's right edge 20 from the screen's right edge, on the Menu button's, its top 14 under that button, where the chip's top stands today; the panel a tooltip's; 12 of padding at its sides and 8 over and under; two rows of 22; the name bold at 16, the numbers at 16, the right-end words at 13; a glyph 14 across, 4 before its number, 14 between two numbers; a plus or a minus sign at 16, 3 before its glyphs, 12 between the yields and the upkeep, 14 before move's glyph; the faction's disc 14 across with its glyph 9 across, 6 before the name; the prepared badge 14 across, 8 after the name; 16 at the least between the name and the right-end words; the chip 8 under the summary's foot. The page measured the panel at 227 by 60: its one width is the widest reading in the shipped font, a unit holding every number at two figures with a bonus on its damage (`5/5`, `2/2`, `0/1`, `2+1`), measured once at the delivery.

Out, each decided with the user:

- A unit's range and sight, and what lies on a tile, its feature, its improvements and the river: the cards hold them.
- Anything lit on the map for a selected tile: the map shows nothing more on a selection than today.
- The unit card: it keeps the pack's crossed swords for damage, as it keeps the pack's heart for health while the map wears the cast's.
- Any press on the summary, any key for it, and a tooltip on a yield or an upkeep glyph: the card's row of what a thing gives raises none either.
- A second row passing the room: no content reaches it. The richest tile the first twenty Stone seeds deal yields 4 points, and 8 points with an upkeep fit.
- The chip's own look and place for good: the rung _City mode and the settle phase_ redoes it. Here it only moves.

Corner cases decided:

- The summary's place is fixed: it never moves for the chip, and the chip stands under that place in city mode and on the settle phase whether or not a summary stands.
- On a tile where one unit carries another, the summary reads the embarked unit, the one the press selects.
- A unit a tile in fog keeps reads as last seen, with its badge as last seen; whether a unit of the neutral's is hostile is read as it stands, as its card does.
- It follows the screen's selection and nothing else: a unit dragged without being selected raises none; under a scrim it is dimmed with the screen; under a minimized deal window it stands while the selection waits; whatever drops the selection takes it down.

The reconcile, each chosen by the user:

1. A unit's numbers go through the reading the infopanel's unit card takes, as it is: the held over the kind's own, the damage with its bonus. Leaving out range and sight is meant.
2. A tile's yields are the sum the yield overlay shows of that tile, the building's part included, as it is. The terrain card goes on leaving the building's part out; that difference is meant.
3. What entering a tile costs is the terrain card's disc reading, as it is.
4. Damage's sign is a new row of the cast beside the card's swords, which stay.
5. Whose a unit is goes through the map's faction sign as it is drawn, at the row's glyph size; the Faction signs button does not hide it here, which is meant: that option is about the map.
6. The panel is a tooltip's, and the tooltips are the stats' own, as they stand.
7. It reads again at each change that lands, as the resource bar's values do.

**Traps:**

- `docs/PHASER.md` for everything the summary does on the UI surface, and `DOGMAS.md` _Stack_: a game object is made once and changed in place, so the summary's parts are made once and set, hidden or shown as the selection moves, never rebuilt.
- The cast's symbols are a closed set (`src/ui/cast.ts`): a new member is asked for by every switch over it, and its file is loaded with the others at boot.
- The glyph is the set's own drawing, `@mdi/svg@7.4.47/svg/sword.svg`, by Austin Andrews, tagged Gaming / RPG and not Brand / Logos. It is saved as the other files of `public/assets/material-design-icons/` are, its path filled white under the comment they carry. Its path: `M6.92,5H5L14,14L15,13.06M19.96,19.12L19.12,19.96C18.73,20.35 18.1,20.35 17.71,19.96L14.59,16.84L11.91,19.5L10.5,18.09L11.92,16.67L3,7.75V3H7.75L16.67,11.92L18.09,10.5L19.5,11.91L16.83,14.58L19.95,17.7C20.35,18.1 20.35,18.73 19.96,19.12Z`.
- `public/assets/LICENSES.md` counts the Material Design glyphs in words and lists them by author: the count moves and `sword` joins Austin Andrews' list, in the same unit of work.
- A colour is named for what it means: the paler ink of the stat signs and the right-end words is `0xd4d7db` on the mockup. Where no entry of `src/ui/look.ts` means it, it is a new entry and goes in the report.
- The mode's chip is placed in `src/ui/standing.ts` from the corner's layout. Eight specs find a chip by its name (`city-mode`, `settle`, `press`, `unit-ring`, `map-order`, `map`, `reference`, `yields`), and `press.spec.ts` carries a thing under the settle phase's chip.
- The summary stops a press where it stands, so a tile under it is out of reach while something is selected. A spec that selects, then presses a tile near the top right corner, meets it.
- A unit's sentence can hold a glyph in its text (`[hostile] Hostile`): it is laid as a card's text lays one.
- The summary shows no literal: names, readings and tooltips come through `src/ui/text.ts` and `src/ui/face.ts`, and a piece outside the scene receives the catalogue as an argument.

**Plan:**

1. `public/assets/material-design-icons/sword.svg`, `public/assets/LICENSES.md`, `src/ui/cast.ts` and what the typecheck then asks for: damage is a symbol of the cast, loaded and drawable, worn by nothing yet.
2. `src/ui/corner-layout.ts` with its test, and `src/ui/standing.ts`: the corner's layout answers the summary's place and the chip's under it, and both chips stand there.
3. A new module in `src/ui/` for the summary, made by `src/ui/chronicle-scene.ts`: it stands on a selection, reads a unit or a tile, reads again at each change, and comes down with the selection.
4. `e2e/summary.spec.ts`, with the readings it needs in `e2e/chronicle-screen.ts`: a unit selected reads what the rules say of it and reads its move again after a step; a tile with a building and one without read their names, their yields and their cost; a press beside the things takes it down; in city mode the chip stands under it.
5. The four pages, and the board line deleted with this file.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/summary.spec.ts`. CI proves on the push: `city-mode`, `settle`, `press`, `unit-ring`, `map-order`, `map`, `reference`, `yields`, `window`, `buttons`, `chrome`, `inspect`, `move`, `attack`, `faction-signs`, `hover`, `held-press`, `minimize`.
