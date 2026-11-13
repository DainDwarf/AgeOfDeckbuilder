# The city badge

**Line:** The city badge — a city's badge on his building says what population is, and tries a progress bar for the food growth and one for the culture threshold; its place too, the badge lying with the buildings where the unit on the city's tile covers part of it. Done when the player's city wears two bars along the bottom of its building, the food stock against the growth threshold over the culture stock against the culture threshold, each with what ending the turn would add paler past it, each city's badge stands at the bars' right end, all of it is drawn over the unit on the tile, and `e2e/population-badge.spec.ts` reads the bars off the rules and passes.

The mockup the user settled it on, the real screen shot in layers with the strip drawn over it: https://claude.ai/artifact/PxvasSgqmAfJ9SPcJnvCnF. It opens on the hexagon; the user's picks are the preset "Disc" with the badge moved 2 across and "And what ending the turn adds, paler" switched on. The page is a picture of the result, never a source of code.

**Spec:**

`docs/CHRONICLE-SCREEN.md` → _The map_ → **A tile's marks stand in four places.** The sentence "A city's own tile wears a badge at its lower-right corner, under the unit standing there: … while its tile is in sight." becomes:

> A city's own tile wears a badge below its middle, over the unit standing there: a disc in that city's colour reading its population, widening for a second digit; it is drawn where the tile is drawn live and not in fog, so the player's city wears it always and the neutral's while its tile is in sight. The player's city wears two bars beside its badge, along the bottom of its building and over the unit too: the food stock against the growth threshold, over the culture stock against the culture threshold. Each fills from its left, is full from its threshold on, and past what the stock holds shows, paler, what ending the turn would add to it; a turn that would take from a stock shows nothing more on its bar. The neutral's city wears no bar.

`docs/LOOK.md` → _The map_ → **The map's order.** "the buildings, the discs and a city's badge;" becomes "the buildings and the discs;", and "the units, each with its badge and its health bar; the yield glyphs and the culture threshold;" becomes "the units, each with its badge and its health bar; a city's bars and its badge; the yield glyphs and the culture threshold;".

`docs/LOOK.md` → _The map_ → **The path.** After "…the number alone." add: "On a city's own tile the city's bars, drawn over the units, cross the lower part of that number."

`docs/LOOK.md` → _The pieces on the map_ → **A unit's ring.** "It lies over the building and the city's badge and under every unit" becomes "It lies over the building and under every unit".

`docs/LOOK.md` → _The pieces on the map_, a new paragraph after **A unit's health bar.**:

> **A city's bars and its badge.** The player's city wears two bars along the bottom of its building, as a unit's health bar is drawn but lying flat: each 22 units long and 3 wide, centred across on the tile's middle, the food bar's middle 11 units below the tile's and the culture bar's 15 below, each on a track of the map's dark outline 0.5 wider on every side, its corners rounded by 1 unit, so the two tracks touch. A bar fills from its left by the share of its threshold the stock holds, in its resource's colour, and is full from the threshold on; the rest of it is the grey of a threshold not yet met. The food bar reads the growth threshold and the culture bar the culture threshold. Past what the stock holds, the part ending the turn would add to it is the resource's colour at 45% over the grey, stopping at the bar's end; a turn that would add nothing, or take from the stock, leaves the bar at the stock. At the bars' right end stands the city's badge: a disc of the city's colour 14 units across with a dark rim 0.5 wide, its left edge on the bars' end, 11 units right of the tile's middle, and its middle 13 units below the tile's, level with the middle of the two bars; on it the population, bold and 11 units tall, dark on the civilization's colour and pale on the neutral's. A second digit widens it to its right into a pill. The neutral's city wears the badge alone, at the same place. Bars and badge are drawn over the units and under the yield glyphs: they cross the lower part of a unit standing on the city and the heart at the foot of its health bar, no dim darkens them, and the badge passes the tile's lower-right edge onto the next tile. They grow and shrink with the map as every mark on it does.

No player-facing sentence is added: the strip has no tooltip and no text but the number.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`.

**Scope:**

In: the two bars on the player's city; the badge of both cities moved to the bars' right end and drawn over the units; the grey of a threshold not yet met as a look entry of its own, at the value of health lost's grey today (`0x3a4049`), a colour being named for what it means; the proof spec and the order spec.

Out: a population icon or any shape but today's disc (eleven were tried on the page, none taken); a tab under the resource bar and bars floating in city mode, which are the chrome's; a tooltip on the strip; bars on the neutral's city; any motion of a bar's fill beyond the map drawing again; the resource bar's readings, which keep saying the same stocks, thresholds and reckonings in numbers.

Corner cases decided:

- A stock at or past its threshold (culture 9 of 8 while a claim waits): the bar is full, nothing more.
- Ending the turn would take from a stock: no paler part. A paler part inside the held part would look like a gain, and the attack's red means an attack.
- No reckoning to read (the end of turn would not run the cities' half): no paler part.
- Stock plus what the turn adds passes the threshold: the paler part stops at the bar's end.
- The neutral's city: the badge alone at the same place as the player's, so the number leaves the lower-right corner on both cities.
- City mode: the strip stays on the map, unchanged.
- A feature on the city's tile: its disc stands in the row above the middle and the strip does not touch it. The top of the tile was tried and dropped because the bars hid that disc.
- A unit on the city: the bars cross its painting and, when it is hurt, the heart at the foot of its health bar. Accepted on the page.
- A unit's path landing on the city's own tile: the move points left stand on their plate under the units, as the map's order says, so the bars cross the lower third of the number. The user would not reorder the layers for it.
- A unit dragged over the city passes under the strip, being a unit.

What the reconcile chose:

- **The unit's health bar and the city's bars** become one bar: the same track, the same rounding, a ground and a fill. What differs is what the shared drawing takes: upright or flat, the length and the width (18 × 2.5 against 22 × 3, both kept), the colours of the ground and the fill.
- **The health bar's part an attack would remove and a city bar's part the turn would add** stay apart: one is a loss in the attack's red inside the held part, the other a gain in the resource's own colour past it.
- **The resource bar's readings** stay as they are, beside the bars; both read the same stocks, thresholds and reckoning, so they cannot disagree.
- **Today's badge** is the standing one, moved: its size, colours, rim, number and the rule for the neutral's are unchanged.

**Traps:**

- The map draws on the chronicle it stands on, which during a play-out is not the latest (`docs/CHRONICLE-SCREEN.md`, "A change plays on the map as it stood"). The bars' stocks, thresholds and reckoning are read on that same chronicle, where the badge's population already is, and follow every render as the badge does.
- The reckoning is the one the resource bar's "+3" reads. It answers nothing when the end of turn would not run the cities' half, and a stock's part of it can be below nothing.
- The badge's number is one of the texts the map raises again at its own zoom; it must stay among them on its new layer or it blurs when zoomed (`docs/PHASER.md`, _Rendering under WebGL_).
- Today's pill is drawn about its own middle and redrawn only when its width moves. With its left edge held on the bars' end, its middle moves when it widens.
- A Shape carries no tint (`docs/PHASER.md`, _Rendering under WebGL_); the health bar is darkened through its colours with its unit. The city's bars are never in fog or dimmed, so they take no shade, and the shared drawing must still darken the health bar as today.
- `e2e/map-order.spec.ts` holds the map's groups by name in their order, `city-badges` among the buildings' today; the layers and their stacking are `docs/PHASER.md`, _Scenes and stacking_.
- `e2e/attack.spec.ts` reads a unit's health bar as shares compared with the rules' reading; a city's bars are read the same way, by a helper in `e2e/`, never by a pixel.
- At the designed zoom on a 1920-wide window a bar is 33 × 4.5 px and one food of a threshold of 10 is 3.3 px: a stock of 1 must still show.

**Plan:**

1. `src/ui/look.ts`: the entry for the grey of a threshold not yet met. Leaves the look holding every colour the strip reads.
2. `src/ui/`, beside `health-bar.ts`: what a city's bar shows, the share held and the share the turn would add, worked out apart from Phaser with its Vitest file. Leaves the reading proven on its corner cases above.
3. `src/ui/map-marks.ts` and `src/ui/map.ts`: the health bar drawn through the shared bar, looking as it does today; then the city's bars and the badge at their place, on a layer over the units and under the yield glyphs, painted with every render. Leaves the screen as the spec says.
4. `e2e/chronicle-screen.ts`, `e2e/population-badge.spec.ts`, `e2e/map-order.spec.ts`: the reading of a city's bars, the proof, and the order with the badge's layer over the units.
5. `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`: the sentences above.
6. `workflow/BOARD.md`: the line deleted, and this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof is `npx playwright test e2e/population-badge.spec.ts`: on a chronicle whose turn would add to both stocks, the player's city wears both bars at the shares the rules give, each in its resource's colour with its paler part; on one whose turn takes food, the food bar stands at the stock alone; the neutral's city in sight wears its badge and no bar; the badge still reads the population the turn left. CI proves on the push: `e2e/map-order.spec.ts`, `e2e/attack.spec.ts`, `e2e/heal.spec.ts`, `e2e/fog.spec.ts`, `e2e/archer.spec.ts`, `e2e/siege.spec.ts`, `e2e/neutral.spec.ts`. The look is the `visual-check` skill's after the ship: the strip over a hurt unit on the city, at the designed zoom and two notches in.
