# City mode's panel

**Line:** City mode's panel — a panel standing while city mode is on, reading the food stock against the growth threshold, the culture stock against the culture threshold and the population, naming the mode and holding the way out of it, in place of the mode's chip. Done when, in city mode, the panel hangs under the resource bar reading the city's name, food and culture against their thresholds with the turns left, and the idle, assigned and unit counts, its Close button leaves the mode, city mode's chip is gone, and `e2e/city-mode.spec.ts` proves it.

**Spec:** settled on https://claude.ai/artifact/YNKESDTVwbQa9BiaE5Hpva (its fourth version, the game shot in city mode at 1280 and 1920 with the panel drawn over it; its files are in `.playwright/city-panel/page/`, which git ignores). The pages' sentences, written out:

- `docs/CHRONICLE-SCREEN.md`, a new section after _The resource bar_:

  > ## City mode's panel ✅
  >
  > While city mode is on, a **panel** stands under the resource bar, in the middle of the screen's top, coming out from behind the bar's foot: one panel ([`LOOK.md`](LOOK.md)), on two lines, at the same place on every window. It stands from the moment the mode is entered until it is left, on the settle phase as on any turn.
  >
  > Its first line reads the player's city by name, the civilization's name and then the name of the building the city stands as, in the middle of the line; at the line's left end a disc of the civilization's colour wearing the player's sign, whatever the Faction signs button shows; and at its right end a button reading `Close`. A left click on Close leaves city mode, wherever the city key would leave it.
  >
  > Its second line reads the food stock, the culture stock and the population. Food and culture each read as on the resource bar, the stock over its threshold, `5/12`, and after it what ending the turn would do to it, over a bar as long as the reading, drawn and filled as the bar under the resource bar's reading is. At the right end of each, a number and an hourglass read the turns left: how many ends of turn, each moving the stock as this one would, until the stock covers its threshold. Food reads never fewer than one, growth being the end of turn's, and culture reads none left, `0`, once the stock covers its threshold; where the turn adds nothing to the stock or takes from it, the number is an infinity sign. The population reads as three counts, each a number over its glyph: the idle population, the assigned population, and the player's units, which the growth threshold counts as it counts the population.
  >
  > What ending the turn would do, the paler part of each bar and the turns left are down whenever the resource bar's reading of the end of turn is. The panel reads the chronicle as it stands and reads again at each change that lands, as a value of the resource bar does.
  >
  > The pointer resting on food's reading or on culture's raises the tooltip the resource bar's reading raises, and on the idle count the idle reading's; resting on the assigned count, on the units' count or on the turns left it raises that one's own, a name over a sentence. The panel reacts to no other press, and stops one as anything standing over the map does.

- `docs/MAP-SCREEN.md` _City mode_, second paragraph: "and left by that key, by the back key, or by the chip naming the mode; the map's frame drawn in city mode's own colour and that chip are how the chronicle screen shows the mode is on, the chip standing in the screen's top right corner, under the summary's place ([`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)), whether a summary stands there or not." becomes "and left by that key, by the back key, or by the Close button of city mode's panel; the map's frame drawn in city mode's own colour and that panel ([`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)) are how the chronicle screen shows the mode is on."
- `docs/MAP-SCREEN.md` _What a tile wears_: "City mode takes the player's city's badge and its two bars off the map for as long as it is on; the neutral's city keeps its badge." becomes "City mode takes the player's city's badge and its two bars off the map for as long as it is on, its panel reading them in their place; the neutral's city keeps its badge."
- `docs/MAP-SCREEN.md` _The settle phase_: "a chip naming the phase where city mode's chip stands are how the chronicle screen shows the phase is on" becomes "a chip naming the phase, in the screen's top right corner, under the summary's place, whether a summary stands there or not, are how the chronicle screen shows the phase is on"; and "Entered once the player's city stands, its own frame and chip stand in place of the settle phase's until it is left." becomes "Entered once the player's city stands, its own frame and its panel stand, the settle phase's frame and chip down, until it is left."
- `docs/LOOK.md` _The cast_, three rows more on the table, each a symbol, its sign and where it is from: Idle, on city mode's panel — population's sign with three small Zs at its shoulder — Material Design Icons, `account` and `sleep`; The player's units, on city mode's panel — a figure on a shield — Material Design Icons, `shield-account`; The turns left — an hourglass — game-icons.net, Lorc's Hourglass.
- `docs/LOOK.md` _The chrome_, **A panel**: "the summary," becomes "the summary, city mode's panel,", and the paragraph gains "City mode's panel hangs from behind the resource bar's foot, so it shows its rim along its sides and its foot."
- `docs/LOOK.md` _The chrome_, **A button**: "its gold for End turn, a window's Back and the ending screen's button" becomes "its gold for End turn, a window's Back, city mode's Close and the ending screen's button".
- `docs/LOOK.md` _The chrome_, **The summary**, last sentence: "The chip of a mode stands just under the summary's place, its right edge on the summary's." becomes "The settle phase's chip stands just under the summary's place, its right edge on the summary's."
- `docs/LOOK.md` _The chrome_, a new paragraph after **A reading's bar and its end of turn**:

  > **City mode's panel** is a panel as the summary's, hung under the resource bar's middle with its top hidden behind the bar's foot. On its first line the city's name stands bold in the middle, in the charcoal's ink; at the line's left end stands the civilization's disc, drawn as the summary draws a unit's sign and larger; at its right end Close, a gold button lower than a window's, its word smaller. On its second line food's reading and culture's are drawn as the resource bar's readings are, glyph, number and end of turn, each over a bar as long as the reading and thicker than the resource bar's. The turns left stand at each reading's right end, small, in a fainter ink, the number before its hourglass, which wears no outline. The population's three counts stand after them, each number centred over its glyph, in population's colour: idle's is population's sign with three small Zs at its shoulder, assigned's population's sign alone, as an assigned tile wears it, and the units' a figure on a shield.

Player-facing entries, written out (the keys are the implementer's):

- the panel's name: `{civilization} {building}`, read `Nomadic Hearth`, from the two names `src/ui/text.ts` already holds
- the button: `Close`
- the stock over its threshold: the standing `reading.over`, `{count}/{over}`
- the infinity sign: `∞`
- the assigned count's tooltip: `Assigned population` over `Gives its tile's yield at income`
- the units' count's tooltip: `Units` over `Count in the growth threshold`
- the turns' tooltip: `Turns left` over `Until the threshold, at this turn's income`
- `button.city-mode` goes with the chip where nothing else reads it; Controls' `control.city` stays.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/MAP-SCREEN.md`, `docs/LOOK.md`.

**Scope:**

In, the look as picked, in units:

- The panel: the kit's panel at the summary's rim, centred across on the screen's middle as the resource bar is, its top and its top corners hidden behind the bar's foot. 12 from its sides to what it holds, 8 over its first line and under its second, 4 between the two lines.
- First line, 26 tall: the civilization's disc 20 across, its sign in the share the summary's disc gives it, at the left end, shown whatever the Faction signs button shows; the name bold at 18 in the charcoal's ink, its middle on the panel's middle; Close at the right end, the kit's gold, 26 tall, its word bold at 14 in the metal's ink, 11 of room each side of the word, with a button's hover and pressed looks.
- Second line: food's cell, culture's cell, then the population, 20 between each. A cell is 148 wide: glyph at 22, the number at 18, the end of turn at 13 a space after it, all as the resource bar's reading draws them, a stock taken past nothing on its pill included; at the cell's right end the turns left at 13 in a fainter ink of its own entry in the look (the page drew `0x9aa1a9`), the number and 2 after it the hourglass, 13 a side, with no outline; under them the bar, 148 by 8, drawn by what draws the resource bar's. A reading that asks for more than 148 widens both cells together, and the panel with them.
- The population: three counts 16 apart, each number at 18 centred over its glyph, the numbers on the readings' row and the glyphs level with the bars; the glyphs 18 a side in population's colour in their outline; idle's Zs 0.62 of the glyph's side, set 0.7 of a side right of the glyph's left edge and 0.12 of a side above its top.
- The turns left: the smallest count of ends of turn, food from one and culture from none, after which the stock moved each time by what the resource bar's end of turn reads for it covers the threshold; an infinity sign where no count does. Down with the end-of-turn reading.
- The counts: idle as the resource bar reads it, assigned the population less the idle, units every unit of the player's as the growth threshold counts them.
- Close goes through the one door the city key and the back key leave by, live exactly when that door is: under a minimized deal window it is dead today, as the key is.
- City mode's chip goes, its press with it; city mode keeps its frame. The settle phase keeps its frame and its chip where they stand.
- The panel stands under a scrim as the rest of the chronicle screen does, over the map, under the tooltips.

Out: the frame's look and the settle phase's chip (their own line); the extend button; what a minimized deal window lets through (its own line); any press on the panel's readings; the resource bar, which reads on as it does in every mode; the city's bars and badge, which stay off the map in city mode.

Reconcile: the readings and their end of turn go through the resource bar's reading as it is, at its sizes; the bars through the city's bar as it is, at the panel's size; Close is a window's button, its height and its word's size the difference meant; the disc is the summary's faction disc, its size the difference meant; the idle count is the resource bar's idle number; assigned's glyph is the one an assigned tile wears; the hourglass is End turn's file under a symbol of its own; the food and culture tooltips and idle's are the resource bar's own entries.

**Traps:**

- A `Chronicle` holds its city section's building and no civilization: the civilization's name is the save's (`ChronicleSave.civilization`, `src/rules/save.ts`). If the chronicle scene cannot be handed it, report it; no field is added to the chronicle for the panel.
- `src/ui/standing.ts` draws the frame and the chip of both standings by one piece, and `src/ui/corner-layout.ts` places the chip: city mode loses the chip alone, the settle phase loses nothing.
- City mode is entered and left through two doors in `src/ui/chronicle-scene.ts`, and whether each is open is one predicate each: the panel is shown, hidden and its Close made live through them, never by a test of its own.
- The resource bar's reading of the end of turn is switched by the scene (`live`), and the panel's is down at the same moments.
- The resource bar's panel hides the city panel's top, so the order of their strata in the scene matters.
- The cast is a closed record (`src/ui/cast.ts`): three symbols more. `sleep` and `shield-account` are new files of Material Design Icons 7.4.47, filled white and carrying the header comment the pack's other files carry; `public/assets/LICENSES.md` is read for whether the pack's entry lists its files.
- A new colour is an entry named for its meaning (`DOGMAS.md` _Code_); a sentence is one entry, the infinity sign too.
- `docs/PHASER.md`: _Layers, Containers and Groups_, _Text_, _What the pointer is over_, _Under a Playwright spec_. A text's own box is read through `ownBoxOf`.
- Seven specs read `city-chip` to tell the mode is on (`city-mode`, `map-order`, `map`, `settle`, `summary`, `unit-ring`, `yields`); `summary.spec.ts` also measures the chip against the summary, a reading that goes with the chip.

**Plan:**

1. `src/ui/text.ts`, `src/ui/cast.ts` with the two glyph files and the licence record, `src/ui/look.ts`: the entries, the three symbols and the turns' ink stand, read by nothing yet.
2. A new piece in `src/ui/` for the panel, its layout a pure function with its Vitest test beside it: the panel stands hidden, reads a chronicle it is handed, and is laid again when the window changes.
3. `src/ui/chronicle-scene.ts`, `src/ui/standing.ts`, `src/ui/corner-layout.ts`: the panel shown and hidden with the mode, Close leaving it, city mode's chip gone, the settle phase's standing as it was.
4. `e2e/`: `city-mode.spec.ts` proves the panel, every number read from the rules, and Close; the other six specs read the panel where they read the chip.
5. The three `docs/` pages as written above; the board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof: `npx playwright test e2e/city-mode.spec.ts`. CI's on the push: `map-order.spec.ts`, `map.spec.ts`, `settle.spec.ts`, `summary.spec.ts`, `unit-ring.spec.ts`, `yields.spec.ts`, `minimize.spec.ts`, `end-of-turn-reading.spec.ts`, `population-badge.spec.ts`.
