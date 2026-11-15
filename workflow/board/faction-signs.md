# Faction signs

**Line:** Faction signs — With **Faction signs** turned on in Settings → Graphics, every unit, every city and every camp the map draws wears its faction's sign, and a unit's card on the infopanel is headed by its painting wearing it; with it off, which is how a browser that never set it opens the game, nothing wears one; the row's press takes at once on a standing chronicle screen and is kept in the browser. `e2e/faction-signs.spec.ts` proves it.

**Spec:**

`docs/LOOK.md`, _Two families_, the Symbols bullet's first sentence becomes:

> **Symbols** are signs of quantities, states and factions: a resource, population, influence, a unit's stat, a unit's state, a faction.

`docs/LOOK.md`, _The cast_, three rows at the foot of the table:

- Symbol "The player", its sign "a crown", from "Material Design Icons, `crown`"
- Symbol "The neutral", its sign "a scale", from "Material Design Icons, `scale-balance`"
- Symbol "The enemies", its sign "a battle axe", from "Material Design Icons, `axe-battle`"

`docs/LOOK.md`, _The map_, **The map's order**: "the units, each with its badge and its health bar; a city's bars and its badge;" becomes:

> the units, each with its faction's sign, its badge and its health bar; a city's bars, its badge and its faction's sign, and a camp's sign;

`docs/LOOK.md`, _The pieces on the map_, **A unit**, the last sentence becomes:

> On the infopanel a unit's card is headed by the same painting in its halo, in its canoe while embarked, fitted to its box by the painting and the canoe, the halo reaching past them, and its faction's sign with it where the signs are on.

`docs/LOOK.md`, _The pieces on the map_, a new paragraph after **A unit's badge**:

> **The faction signs.** With **Faction signs** on ([`INTERFACE.md`](INTERFACE.md)), every unit, every city and every camp wears its faction's sign; with it off, which is how the game first opens, none does, and colour alone tells whose a thing is. A unit's sign is the prepared badge in everything but its place and what it reads: a disc of its faction's colour, 11 units across, with the badge's dark rim, its middle 5 units left of its tile's middle and level with it, at the painting's upper left, and on it the faction's glyph 8 units across, dark on the civilization's colour and white on the neutral's and the enemies'. It is part of the unit as the badge is: it is drawn over the painting, goes where the unit goes, and is darkened with it in fog and when it is dimmed, so a unit a tile in fog keeps as last seen wears it still. A hostile unit of the neutral's wears the neutral's sign. A city's own tile and a camp's tile wear the sign as the twin of a city's badge: that badge's disc, 14 units across with its rim, its right edge on the left end of a city's bars, 11 units left of the tile's middle, and its middle 13 units below the tile's, the glyph 10 units across in the same inks; the neutral's city and a camp, which wear no bars, wear it at the same place. It is drawn with a city's badge, over the units, so it crosses the lower part of the health bar of a hurt unit standing on the tile, and it passes the tile's lower-left edge onto the next tile; it is darkened by the fog with its tile, and city mode leaves it standing. A site wears none. On the infopanel a city's row and a camp's wear none.

`docs/INTERFACE.md`, _The menu_, the Graphics paragraph: its first sentence becomes "**Graphics** lists **Animation speed**, **Fullscreen** and **Faction signs**.", and before "**Back** closes the window as it does Controls." comes:

> Faction signs is a row reading whether every unit, every city and every camp wears its faction's sign ([`LOOK.md`](LOOK.md)), On or Off, and a press turns it; it is off until the player turns it on, a change takes at once on the chronicle screen, the infopanel's card among what changes, and it is kept in the browser from one launch to the next.

Player-facing text, one new entry in the text table: the row's label, `Faction signs`. Its two readings are the standing `On` and `Off` the Fullscreen row reads. The row raises no tooltip.

`public/assets/LICENSES.md`, the Material Design Icons entry: fifteen becomes eighteen, `crown` joins Austin Andrews's glyphs, and `scale-balance` by Simran and `axe-battle` by Colton Wiscombe are added; "none of the fifteen" becomes "none of the eighteen", the three read on 2026-11-15 in the set's `meta.json` (`crown` in no category, `scale-balance` in Science, `axe-battle` in Gaming / RPG).

**Doc-impact:** `docs/LOOK.md`, `docs/INTERFACE.md`.

**Scope:**

In: the option, its row and its keeping; the sign on every unit, on each city's own tile and on every camp's tile; the sign on the infopanel's unit card; the three glyph files with their licence record; the proof spec.

Out: the borders, which stay as they are, colour alone; a sign per civilization, the player's being one sign whatever civilization is played, looked at again when a second civilization lands; a key or a button on the chronicle screen for the option; a tooltip on the row; anything on the meta screens.

Decided at intake, on the page https://claude.ai/artifact/XTYdQeJqWbUu6qiShDfX5o (the user's paste, then their answers):

- The signs are Material Design's `crown`, `scale-balance` and `axe-battle`, the user's picks over the plain forms the page starred.
- A unit's sign: the disc 11 across, 5 left of the tile's middle and level with it, on every unit of every faction, the player's included. The user sized it to the prepared badge on purpose.
- A city's and a camp's sign: the disc 14 across, the user's 15 brought to the city's badge's 14 at the reconcile, and moved by the user from the tile's upper left to the left end of the city's bars, "symmetric to the badge": its middle 18 left of the tile's middle and 13 below it, where the badge's is 18 right and 13 below. The neutral's city and a camp wear it at that place, with no bars beside it.
- It is drawn over the units, on the population badge's layer, the user's call over drawing it under them: it hides about 7 of the 18 units of a hurt unit's health bar at its lower end where that unit stands on a city's or a camp's tile, and "a player will still be able to see the unit has a bar, which means it's hurt, even if it's not clear how much".
- The option is off by default, "the map is already almost cluttered", and is the user's "accessibility feature and/or graphics".
- A hostile unit of the neutral's keeps the neutral's sign.
- The infopanel's unit card wears the sign with the option on and the halo alone otherwise.
- Ink: dark on the player's gold, white on the neutral's blue and the enemies' red, the values the city's badge reads its number in on gold and the prepared badge's glyph reads in. Each is an entry of its own meaning in the look.
- City mode: a unit's sign fades with the units, being part of the unit; a city's sign stays, the mode taking the player's city's bars and badge only.
- A dragged unit's sign goes with it, and a unit a tile in fog keeps as last seen wears its sign darkened, as its badge does.
- A tile in fog wears a city's or a camp's sign where its snapshot keeps that city's own building or the camp, darkened by the fog's tint.
- The sign passes its tile's lower-left edge and lies over the disc row of the tile below and to the left, as the population badge lies over the one below and to the right: the same issue, taken the same way.
- A unit standing on a city's or a camp's tile wears its own sign over the tile's: the two discs stand about 6 units apart.
- On the infopanel the sign stands where it stands on the map against the painting, 5 left of the painting's middle and 8 above it, and reaches past the head's box as the halo does: it is not among what the head is fitted by.

The reconcile:

- A unit's sign goes through the prepared badge's build as it is, the same disc, rim and glyph size, its place and its ink on the player's colour being what differs.
- A city's sign stands on the same disc as the city's population badge, 14 across with the 0.5 rim, at the badge's place mirrored across the tile's middle and on its layer.
- The option goes through the Graphics window's row as Animation speed does, kept in an entry of its own in the browser, apart from what the Controls window's Default puts back.
- The infopanel's head stays the map's own unit mark, taking the sign when the option is on.
- The three glyph files enter as the fifteen Material Design ones did: the set's own drawing from `@mdi/svg` 7.4.47, the path filled white, a comment in the file saying so.

**Traps:**

- `@mdi/svg` is not installed: the three files are fetched from the package at 7.4.47 (`https://unpkg.com/@mdi/svg@7.4.47/svg/<name>.svg`), each into the folder the fifteen stand in, and registered where `src/ui/marks.ts` lists the glyph files. A glyph is rasterised at the size given when it loads (`docs/PHASER.md`), so its size is picked at boot as the others' are.
- A change of the option is no change of the chronicle: the map writes its tiles and units again on a state change, so the row's press has to ask a standing chronicle screen to draw again, the infopanel's card included, as the Animation speed row's press reaches the standing scenes. The menu's window stands over the chronicle screen while the row is pressed.
- The units' layer fades whole through its filter camera in city mode (`src/ui/map.ts`), so a sign inside the unit's mark fades with it and needs nothing more; the city's sign stands with the city badges, which that fade does not touch.
- The player's units are the only ones dimmed, and until now no unit of the player's wore a disc: the sign is darkened by the dim's shade as the health bar is.
- A unit's mark is one pooled container whose parts are read by place (`unitBadgeOf`, `unitHealthBarOf`, `unitMotionTargets`, `unitFittedBy`), and `e2e/chronicle-screen.ts` reads a unit's mark through `unitMarkOn`: a part added moves what those read.
- A game object is made once and changed in place (`DOGMAS.md` _Stack_): the signs are made with what wears them and hidden while the option is off, never made at the press.
- A spec opens on the entry the game keeps the option in, planted as the speed is (`plantEntry`), and the suite's other specs open with it off, so none of their readings moves.
- The fog's darkening and the dim are tints multiplied into each part, the glyph through its tone as the prepared badge's is.

**Plan:**

1. The three glyph files in `public/assets/material-design-icons/`, their rows where the glyph files are listed, and the licence record. Leaves the three symbols loadable and drawn nowhere.
2. The option beside `src/ui/animation-speed.ts`, with its Vitest test of what it keeps and reads back, the text entry, and the row in the Graphics window (`src/ui/menu.ts`). Leaves a row that turns and is kept, changing nothing on the map.
3. The look's entries for the three inks, then the unit's sign in the unit's mark (`src/ui/map-marks.ts`) and the map reading the option (`src/ui/map.ts`). Leaves every unit signed while the option is on, in sight, in fog, dimmed and dragged.
4. The city's and the camp's sign with the city badges (`src/ui/map.ts`, `src/ui/map-marks.ts`). Leaves both cities and every camp signed.
5. The infopanel's head (`src/ui/infopanel.ts`) and the press taking at once on a standing chronicle screen. Leaves the option whole.
6. `e2e/faction-signs.spec.ts` and the readings it needs in `e2e/chronicle-screen.ts`; `docs/LOOK.md`, `docs/INTERFACE.md`; the line deleted from the board with this file.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/faction-signs.spec.ts`. It opens on a campaign that reaches the neutral, on a chronicle the map draws a unit of each of the three factions on, both cities and a camp, one of the signed things in fog; with the option planted on, each wears its faction's sign, its symbol and its disc's colour read off the look, and the infopanel's unit card does; opened with nothing planted, nothing wears one; and a press on the Graphics row over that standing chronicle screen puts them on at once and is found kept after a reload.
- CI proves on the push: `graphics.spec.ts`, `inspect.spec.ts`, `fog.spec.ts`, `pillage.spec.ts`, `population-badge.spec.ts`, `city-mode.spec.ts`, `camps.spec.ts`, `neutral.spec.ts`, `move.spec.ts`, `attack.spec.ts`, `map-order.spec.ts`, `icons.spec.ts`.
