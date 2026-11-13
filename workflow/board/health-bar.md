# A health bar on units

**Line:** A health bar on units — a unit on the map shows its health; the health an attack would remove, read as a number over the unit attacked, is looked at again once a bar can show it. Done when a unit below its full health wears the bar with its heart on the map, in sight and kept in fog; the attack read turns the health it would remove red on the attacked unit's bar, a skull in the heart's place where it would kill; the attack's number is gone from the map, the text table and the pages; and `e2e/attack.spec.ts` proves it.

The mockup the design was settled on, opening on the settled values: https://claude.ai/artifact/L6QCwG6Uqu6YKcDFq6BALc. Every number below is read off it; where the two differ, this file is right.

**Spec:**

`docs/LOOK.md` → _The pieces on the map_, a new paragraph after **A unit's badge**:

> **A unit's health bar.** A unit below its full health wears a bar upright at its painting's left: 18 units long, the painting's own height, and 2.5 wide, its middle 12 units left of its tile's middle and 8 below it, level with the painting's, on a track of the map's dark outline 0.5 wider on every side, its corners rounded by 1 unit. The bar fills upward by the share of its full health the unit holds, in health's green, and the rest of it is the grey of health lost; it is the same length for every kind. At the bar's foot stands a heart, red, 6 units across, its middle 1.5 units under the track's end, drawn over the bar with a dark edge 0.5 wide round it. A unit at its full health wears neither. The bar is part of the unit as its badge is: it is drawn over the painting, goes where the unit goes, and is darkened with it in fog and when its turn is done, track, bar, heart and all, so a unit a tile in fog keeps as last seen hurt wears it at the health last seen. While an attack is read on a unit, the part of its bar the attack would remove, from the top of the health held down, is turned the attack's red, a unit at full health wearing its bar for as long as the reading stands; where the attack would kill it, all the health held is red and a skull stands in the heart's place, white, 8 units across, with the heart's dark edge. A unit on the infopanel wears none, its card reading the numbers.

`docs/LOOK.md` → _The pieces on the map_ → **The attack's marks**, the last two sentences become:

> The health the attack would remove is read on the attacked unit's health bar. The arrow is drawn where the path is, over the selection's other marks and under the units, and neither it nor the ring is ever darkened by the fog, being the screen's answer as the selection is.

`docs/LOOK.md` → _The map_ → **The map's order**: "and the path with the attack's arrow and its number; the units, each with its badge;" becomes "and the path with its number and the attack's arrow; the units, each with its badge and its health bar;".

`docs/CHRONICLE-SCREEN.md` → _The map's presses_, first paragraph, a sentence added after the one on the prepared badge ("…darkened with the rest of it."):

> A unit below its full health wears a health bar on itself, whoever's it is, from the change that hurt it until it is healed to full or killed; a unit a tile in fog keeps as last seen hurt wears it still, at the health last seen, darkened with the rest of it.

`docs/CHRONICLE-SCREEN.md` → _The map's presses_ → **A unit being aimed reads its attack.**, the first sentence becomes:

> The marked unit the pointer is on wears the attack: an arrow from the unit being aimed to it, and on its health bar the health the attack would remove, the unit's damage as its card reads it or all the health the marked unit holds where that is less, with a skull in the heart's place where the attack would kill it; a unit dragged over a marked unit shows the same.

The rest of that paragraph stands as it is: the step's path, "the health read is the damage the unit would carry there", and where the reading stays and goes.

Player-facing text: none added. The entry `attack.health` leaves `src/ui/text.ts`.

`public/assets/LICENSES.md` → _game-icons.net_: the entry reads four glyphs. **What** becomes "four glyphs, white on nothing, in `game-icons/`: Fire by sbed, Flying flag by Lorc, Hearts by Skoll and Death skull by sbed."; **From** adds `1x1/skoll/hearts` and `1x1/sbed/death-skull`; the credit sentence adds "Hearts" by Skoll and "Death skull" by sbed, <http://opengameart.org/content/95-game-icons>, in the form the two standing credits take.

**Doc-impact:** `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The bar, its track, its heart on every unit below full health, of any faction, in sight and kept in fog, embarked or not, on the map alone.
- The colours, each a look entry of its own meaning with the value given: health's green `0x7fd14f`; the grey of health lost `0x3a4049`; the heart's red `0xe0564a`; the skull's white `0xf2f6ff`. The user's rule, 2026-11-13: a glyph's colour is that glyph's own meaning, so the skull's white is an entry of its own and never the badge glyph's entry, though the two hold one value. The track and the dark edges are the map's dark outline, as the badge's rim is; the red of the reading is the attack's own entry.
- The attack's reading on the bar, in place of the number: the plate over the attacked unit, its text entry and everything that only served it go.
- The glyphs: Skoll's Hearts and sbed's Death skull from game-icons.net, entering `public/assets/game-icons/` as the flame and the flag did, white on nothing, with the licence record above.
- The bar's coming and going: it comes with the badge's own fade when a unit at full health is hurt, and goes with it when the unit is healed to full; the fill takes its new length as the hurt unit's bump starts, with no drain; a unit killed shrinks off the map with its bar.

Out:

- A drain or any easing of the fill: Motion's.
- The infopanel: the unit at a card's head wears no bar and the Health row keeps its word and its "3 / 5". Whether the row takes the heart as its icon is the glyph rung's.
- A reading on the bar for anything but the attack: a card aimed at a unit changes no bar.
- The done dim itself, kept as it ships; the bar is darkened with the unit through it.

Corner cases decided here:

- A unit holding more than its full health is drawn as one at full health: no bar.
- The health read as removed is the smaller of the damage and the health held; the damage is the one the number read, the bonus carried on the tile the attack comes from included, after the step where one comes first.
- The reading stays on the bar as long as the attack's arrow stays, the last marked unit the pointer was on included, and goes with it.
- An attack is read only on a unit in sight and never on one of the player's (`byHand`, `broughtInRange`), so the red and the skull never meet a bar darkened by the fog or by the done dim: no rule is written for it.
- A unit being dragged carries its bar; the ring it leaves on the ground wears none.
- The heart lies partly over the disc row of the tile below and to the left, the bar's foot passing its own tile's lower-left edge; accepted on the mockup's card "Beside the next tile's discs". Units are drawn over the discs, so the heart covers the disc.
- Embarked, the bar stands where it stands ashore; the canoe passes under its foot.

What the reconcile chose, all on the user's word:

1. The attack's number goes entirely, the bar's red taking its place; the exact figure leaves the map and the infopanel's Damage row keeps it.
2. The bar goes through the unit's mark as the prepared badge does: part of the same mark, the same darkening, the badge's own fade for coming and going.
3. Every dark edge on a unit's marks but the painting's hairline is 0.5 wide: the badge's rim, the bar's track past the bar, and the heart's and the skull's edge, laid by distance from the glyph's outline as the painting's dark line is.
4. Each glyph's colour is its own entry; the attack's red on the bar is the attack's standing entry.
5. The heart and the skull enter as the flame and the flag did, drawn into the units' sheet.
6. The infopanel's Health row stays apart, for the glyph rung.
7. The scrollbar stays apart: it says a position, never a quantity.

**Traps:**

- A unit's mark is one container made once per unit and changed in place (`DOGMAS.md` _Stack_); the fog's kept units come from a pool of the same marker, and the infopanel's unit is made through the same door and must come out wearing no bar.
- Every render and every motion repaints a unit's marker over whatever stood on it, while the attack's arrow lives on the path's layer under the units: the red on the bar and the skull are a second home of one reading and must come and go exactly as the arrow does, a render under a pointer that never moved included.
- A shape has no tint: the badge's disc is darkened by multiplying its colours, as `asUnit` does today; an image is darkened by its tint.
- `e2e/chronicle-screen.ts` reads a unit's mark by its shape: the badge's disc is found as the mark's one circle and its glyph as the image drawn next after it, and the painting and the halo by their frames' endings. Parts added to the mark must leave that reading true, or the helper is changed with them.
- `e2e/chronicle-screen.ts`'s `aimDrawn` throws where the attack stands without the object named `attack-health`, and `e2e/attack.spec.ts` asserts that number's text and place in three tests: the reading of the attack there moves to the bar.
- The units' sheet rasterises its glyphs at 128 pixels a side and makes each painting's dark line by growing its outline (`src/ui/marks.ts`); the sheet is 1024 a side, and two glyphs with their edged frames must fit it.
- `docs/PHASER.md`: a Graphics strokes 2 units wide or less without joins or caps, and a stroked polygon comes out open under WebGL; the track's rounded corners and the glyphs' edges meet both.
- The game-icons downloads carry a black square behind the glyph (`M0 0h512v512H0z`); the two standing files are white on nothing.

**Plan:**

1. `public/assets/game-icons/` and `public/assets/LICENSES.md`: the two glyphs in, white on nothing, with their record; leaves the files loadable and credited, nothing drawing them.
2. `src/ui/look.ts`, `src/ui/marks.ts`: the four colour entries, and the heart and the skull in the units' sheet with their dark edge; leaves the frames standing, nothing wearing them.
3. `src/ui/map-marks.ts`, `src/ui/map.ts`, `src/ui/infopanel.ts`: the bar, its track and its heart on a unit's mark, shown below full health, darkened by the mark's shade, on live and fogged units alike, none on the infopanel; leaves every hurt unit wearing its bar at rest. The share a bar fills, with what an attack would turn red, is a pure reading that takes its Vitest test beside it.
4. `src/ui/map-motion.ts`: the bar's fade in and out and the fill's jump at the bump; leaves a hurt, a heal and a kill playing with the bar.
5. `src/ui/map.ts`, `src/ui/map-path.ts`, `src/ui/map-marks.ts`, `src/ui/text.ts`: the attack's reading on the bar and the skull, the number and its plate gone; leaves the reading as the pages say.
6. `e2e/chronicle-screen.ts`, `e2e/attack.spec.ts`: the helpers read a unit's bar and the attack's reading off it, every number from the rules; the spec asserts the bar at rest on the unit it hurt, and the reading with and without a kill.
7. `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`: the sentences above; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/attack.spec.ts`. CI proves on the push: `pillage.spec.ts`, `fog.spec.ts`, `neutral.spec.ts`, `archer.spec.ts`, `heal.spec.ts`, `path.spec.ts`, `unit-ring.spec.ts`, `map-order.spec.ts`, `siege.spec.ts`, `camps.spec.ts`, `embark.spec.ts`, `move.spec.ts`. The look check after the ship goes through the `visual-check` skill.
