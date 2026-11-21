# The resource bar in glyphs

**Line:** **The resource bar in glyphs** — on the chronicle screen the seven readings stand on one plate hung from the middle of the screen's top, each its glyph and its number with no word, food and culture wearing a threshold's bar under them, idle read over the population, what the turn adds in green, what it takes in red and a stock taken past nothing on a red pill, a tooltip naming each reading over its sentence; the map runs to the top of the screen; `npm run check`, `npm test` and `npm run lint` pass and `e2e/end-of-turn-reading.spec.ts` passes.

**Spec:** the mockups the user picked on are https://claude.ai/artifact/947EAc7s6wNL6zLW8GKUeK (the place) and https://claude.ai/artifact/9Tt5gBjsWbFGpDB9LBhZD4 (the readings, opened on every pick with "What the turn takes" set to "Every loss red, past nothing on a pill"). The pages hold no measure of the look (`DOGMAS.md` _Docs_); the measures are in Scope.

- `docs/CHRONICLE-SCREEN.md` _The resource bar_, first paragraph replaced by: "The resource bar is one plate hung from the middle of the screen's top edge, as wide as its seven readings, and the map runs to the top of the screen beside it. Each reading is its glyph and its number, and no word, in the order the bar reads them: the five core resources, culture, then the idle population under population's glyph, read over the population, `1/3`. Food and culture each wear a bar under their reading, as long as the reading: the food stock against the growth threshold and the culture stock against the culture threshold, drawn as the player's city's bars are ([`LOOK.md`](LOOK.md)) and filled as they are."
- Same section, second paragraph: the sentence "A stock the upkeep or the strikes take past nothing reads the income less the whole of what the upkeep and the strikes ask of it, `−6` on a stock of nothing, in the colour of a stock taken past nothing, and the idle reading of the population taken is in that colour too." becomes "What the turn would add reads in the colour of a gain, and what it would take in the colour of a loss. A stock the upkeep or the strikes take past nothing reads the income less the whole of what the upkeep and the strikes ask of it, `−6` on a stock of nothing, on a pill, and the idle reading of the population taken stands on a pill too." After "as the value does." the paragraph gains: "The paler part of a threshold's bar is down whenever this reading is."
- Same section, a paragraph added at its end: "The pointer resting on a reading raises its tooltip under it: the reading's name over its sentence, as a stat on a unit's card raises its own. Food's and culture's name is followed by the stock over its threshold."
- `docs/CHRONICLE-SCREEN.md` _The pinned achievements_: "the first as far from the map's top and left edges as a mode's chip stands from its top and right ones" becomes "the first as far from the screen's top and the map's left edge as a mode's chip stands from the map's right one, and under the resource bar, as far from it, on a window where the bar reaches over them".
- `docs/MAP-SCREEN.md`, city mode's paragraph: "the map's frame drawn in city mode's own colour and that chip are how the chronicle screen shows the mode is on." gains ", the chip standing in the map's top right corner, under the Menu button."
- `docs/INTERFACE.md`, the sentence of the window's shape: "the bar, the hand, the piles and the buttons keep to their edges, and the map fills what they leave." becomes "the bar, the hand, the piles and the buttons keep to their edges, and the map fills the screen over the band."
- `docs/LOOK.md` _A panel_: "The bar's panel runs on past the screen's top and sides, and the band's past its bottom and sides, so each shows only the rim along its inner edge." becomes "The resource bar's panel hangs from the screen's top and runs on past it, so it shows its rim along its sides and its foot; the band's runs on past the screen's bottom and sides, and shows only the rim along its top."
- `docs/LOOK.md`, a paragraph after _A well_: "**A reading's bar and its end of turn.** Food's and culture's readings on the resource bar wear a city's bar under them, drawn and filled as the city's is, longer and thicker: from the glyph's left edge to the end of the room the end-of-turn number takes. That number reads in a green of its own where the turn adds and a red of its own where it takes, and a stock taken past nothing reads white on a pill of a darker red. On a button's gold the green and the red are darker ones, as the number's ink is dark there."
- `docs/META-SCREENS.md` _The navbar and the bar_: "The **bar** runs along the top from the navbar to the Menu button, where the resource bar stands on the chronicle screen, and reads the influence at its left end as the resource bar reads a stock: influence's glyph, the word, the number. The pointer resting on the reading raises its tooltip under it, as a reading of the resource bar does; the reading reacts to no press." becomes "The **bar** runs along the top from the navbar to the Menu button and reads the influence at its left end: influence's glyph, the word, the number. The pointer resting on the reading raises its tooltip under it; the reading reacts to no press."
- Player-facing text, every entry the line foresees. A tooltip's name line: `Food`, `Production`, `Military`, `Money`, `Science`, `Culture`, `Idle population`; food's and culture's name line with its count is one entry reading as `Food 1/4`. A tooltip's sentence: the six resources' as they stand; idle's becomes `Assign to tile or turn into units`, its `Idle population.` having moved to the name line. Idle's value reads through the entry the thresholds read through today, `1/3`. The reading's words leave the bar; a label another surface still reads stays.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`, `docs/META-SCREENS.md`.

**Scope:**

In, with the user's numbers, in design units:

- **The plate.** One chrome panel at the strip's rim, hung from the screen's top as the bar's panel hangs today, 48 tall, centred across the screen, as wide as its readings with 16 from each end to the first and last reading. The readings stand in today's order, 16 between two of them; a reading's zone and its well reach into the gaps as they do today.
- **A reading.** Its glyph, 22, then 6, then its number at 18, then a space and its end-of-turn number at 13. No word. Each reading keeps a room of its own that no value moves: the widest value it reads (three digits for production, military, money and science, two for food and culture, `00/00` for idle), the space, and a two-digit loss on its pill. A value wider than its room grows rightward into the gap, its end-of-turn number with it, as today.
- **Food and culture** read their stock alone. Each wears a bar under its reading: from the glyph's left edge to the end of the reading's room, 5 thick, its top 13 under the reading's middle, on the track, the ground and the fill rule of the city's bar, the turn's part paler. It is sunk with its reading in a well or on the gold.
- **Idle** reads the idle population over the population.
- **The end-of-turn number.** A gain reads in green `#5fd38a`, on a button's gold `#14501f`. A loss the stock covers reads in red `#ff6b5c`, on the gold `#7d1309`. A stock taken past nothing, and the population taken, read white on a pill of `#c0392b`, the same on every ground: the pill is rounded to its height, 4 past the number at each side and 1.5 over and under it, and the number on it is the bundled font's heavier weight where it has one. Each is a look entry of its own meaning.
- **The tooltip.** Under the reading, where it rises today, in the form a stat's tooltip on a unit's card has: the name over the sentence.
- **The map** is framed from the screen's top to the band. City mode's and the settle phase's frame are drawn round that frame, their top edge under the plate and the Menu button.
- **The Menu button** stays where it stands today, on every screen. A mode's chip stands 14 under it, as far from the right edge as today.
- **The pinned achievements** stand as far from the screen's top as from the map's left edge while the plate's left end is more than 16 clear of their right edge, and that far under the plate otherwise; at 1280 by 720 they stand under it.

Out:

- The campaign, launch and collection screens: their bar keeps its strip, the influence reading its glyph size, its word and its tooltip; that reading's form is the meta screens' rung's.
- The ending screen: its total keeps its word, and its rows' glyph keeps its size, as does the collection's price.
- The Turn reading on the end-turn button keeps its word.
- The presses a reading takes, the latch, the gold of an act waiting and when the end-of-turn number stands: all as today.
- The debug console and a window's title keep their places under the top row.

What the reconcile chose:

1. The threshold's bar and the city's bars on the map are one drawing and one fill rule, the length and the thickness being what the plate hands it; the city's keep their size.
2. The tooltip goes through the stat tooltip's form, the name over the sentence; food's and culture's name line carries the stock over its threshold.
3. Idle's `1/3` goes through the slash entry as it is.
4. The Menu button is one button in one place on every screen.
5. The collection's price and the ending's rows keep their glyph's size; the size is what the shared drawing is handed.
6. The campaign screen's reading shares the reading's drawing, the word being what it is handed; its strip's flow stays its own.
7. The gain's and the loss's colours change with what the reading stands on, through the rule the number's ink follows.

**Traps:**

- `src/ui/navbar.ts` builds the meta screens' influence reading from the resource bar's own exports and lays it out through `src/ui/bar-layout.ts`; `src/ui/collection-stack.ts` and `src/ui/ending-screen.ts` draw their glyph through the bar's; `src/ui/icons-button.ts`, `src/ui/pinned-achievement.ts` and `src/ui/tree.ts` read how far a well sinks from it. None of those screens changes.
- The Menu button is drawn on the menu scene and reads its place from `src/ui/bar-layout.ts`; `src/ui/bar-layout.test.ts` holds the flow. The flow's five-and-two grouping is the chronicle bar's alone.
- The map's frame (`src/ui/band.ts`) is read by the map's camera, the modes' frame and chip, the pinned achievements and the Icons button. The bar's height is read besides by the debug console, a window's title, the menu and the navbar, which keep it.
- The city's bar is drawn in `src/ui/map-marks.ts` and filled by `src/ui/city-bar.ts`; the map hands it the end of turn's reading and none while that reading is down (`src/ui/map.ts`).
- A Phaser Text draws no ground of its own and no image: the pill is an object under the number. A Text is redrawn on every ink and text written to it, so each is written where it moved (`docs/PHASER.md` _Text_, _Shapes and Graphics_).
- A colour is one look entry per meaning (`DOGMAS.md` _Code_): a gain, a loss, each on the gold, the pill and the number on it. `takenPastNothing` is the one entry that exists; only the bar reads it.
- A player-facing sentence is one keyed entry, never assembled, and ends in no period (`DOGMAS.md` _Code_, _Writing rules_): the name line with its count is an entry with its own parameters.
- `e2e/end-of-turn-reading.spec.ts` reads each end-of-turn number's ink against the look; `e2e/window.spec.ts` expects the bar across the whole window; eighteen spec files read a reading's value, food's and culture's as stock over threshold; `e2e/hover.spec.ts` raises a reading's tooltip. A spec asserts no pixel and no coordinate (`DOGMAS.md` _Testing_): where a thing stands is asserted against another thing, as `e2e/window.spec.ts` does for the deal window.

**Plan:**

1. `src/ui/look.ts`, `src/ui/text.ts`: the new look entries and the text entries, read by nothing yet.
2. `src/ui/resource-bar.ts`, `src/ui/navbar.ts`: a reading drawn with or without its word and at the size handed, each reading in a room of its own, the tooltip in the name-over-sentence form. Leaves the chronicle bar reading glyphs in today's strip and the meta screens as they were.
3. `src/ui/map-marks.ts`, `src/ui/city-bar.ts`, `src/ui/resource-bar.ts`: the threshold's bar under food and culture through the city's drawing, idle over the population. Leaves the city's bars on the map unchanged.
4. `src/ui/resource-bar.ts`: the end-of-turn number's colours by ground, and the pill.
5. `src/ui/resource-bar.ts`, `src/ui/bar-layout.ts` with its test, `src/ui/band.ts`, `src/ui/standing.ts`, `src/ui/pinned-achievement.ts`: the plate centred and hung from the top, the map framed from the screen's top, the chip under the Menu button, the pinned achievements by the plate's reach. Leaves the Menu button and the meta screens' bar where they stand.
6. `e2e/`: the specs that read the bar brought to what it reads now; the proof spec holding the gain's, the loss's and the pill's reading.
7. The five `docs/` pages, the sentences above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof: `npx playwright test e2e/end-of-turn-reading.spec.ts`. CI proves on the push: `window.spec.ts`, `yields.spec.ts`, `city-mode.spec.ts`, `hover.spec.ts`, `pin.spec.ts`, `press.spec.ts`, `map.spec.ts`, `menu.spec.ts`, `settle.spec.ts`, `console.spec.ts`, and the specs reading a value of the bar: `bad-air`, `broken-motion`, `campaign`, `civilization-mode`, `collection`, `drought`, `ending`, `fog`, `grievance`, `inspect`, `manage-save`, `predators`, `resume`, `strangers`, `travellers`, `wildfire`.
