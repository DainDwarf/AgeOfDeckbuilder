# A population badge on the city

**Line:** A population badge on the city — the player's city's tile and the neutral's each wear their population in a badge at the tile's lower-right corner, drawn where the tile is drawn live; the proof spec reads the player's through a strike's take and the neutral's with the veils off. Doc-impact: `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`.

**Spec:** `docs/CHRONICLE-SCREEN.md` _The map_ → _The pointer and the tile's marks_, the paragraph opening "A tile's marks stand in three places", and `docs/INTERFACE.md` _What stands over what_. The badge is what the mockup settled: a pill at the tile's lower-right corner, its centre 12 units right of and 12 below the tile's middle, 14 high and never narrower than 14, widening for its digits with a pad of 3 on each side of the number's own box, filled in the city's colour with an outline of 1.5 in the map's outline colour, reading the city's population in a 10 px bold number of the UI font, dark on the player's and pale on the neutral's. The number reads the city's whole population, `population` of its city rows, assigned and idle together, never its units.

Sentences to add to `docs/CHRONICLE-SCREEN.md`, in that paragraph, after "the mark of an assigned tile stands below the middle.":

> A city's own tile wears a badge at its lower-right corner besides, over the unit standing there: a disc in that city's colour reading its population, widening for a second digit; it is drawn where the tile is drawn live and not in fog, so the player's city wears it always and the neutral's while its tile is in sight.

And the two colour sentences of that paragraph change to:

> The units of the player's, the player's city's mark and badge, the ring on every tile it holds and the emblem on a card's back are in the civilization's colour. The neutral's units, its city's mark and badge, and the ring on every tile it holds are in the neutral's colour.

Sentence to change in `docs/INTERFACE.md` _What stands over what_, the map's order:

> On the map the order is a tile's own: the terrain, then the tiles lit and the units glowed on it, its buildings, its units, a city's badge, the fog, city mode's marks, the yield overlay's dim, what stays at full strength through that dim, the ring, the yield glyphs and the culture threshold; the infopanel stands over all of that.

No player-facing text entry: the badge reads the number alone, as the pile's count pill does.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`.

**Scope:**

- In: the badge on both cities' own tiles, drawn by the map on every render from the chronicle it stands on, with no motion of its own: a growth, a strike's take, a unit card's take, a capture's population each change the number as the stage lands and the map renders the state it ends on. The badge stands over the unit on the tile and under the fog, city mode's dim and the yield overlay's dim, and it shares the city tile's fate under every veil: drawn only on a tile the map draws live (`live` of `drawing(chronicle)`), so the neutral's tile in fog shows its snapshot's building and no badge, with the fog veil off it shows the badge, and a fallen neutral has none. No badge on the settle phase, the player's city standing nowhere. Nothing answers a press on it: it is a mark of the tile and the press under it lands on the tile.
- In: two new look entries for the number's ink, one per city faction, named for the meaning (the ink a city's badge reads in), the player's at the ink's value and the neutral's at the pale ink's; the fill reads the city's colour through the table the rings read it from, and the outline the map's outline colour. No existing entry is renamed.
- Out: the pile's count pill and the browse's stack badge stay as they are, each drawing its own pill; a shared pill drawer is a question for v0.0.6's look pass. The culture threshold stays as it is. The resource bar's Idle reading stays as it is. No signal of the death beyond the badge: the line's conditional clause was dropped at intake.
- Corner cases decided: the neutral's city under the veils follows the tile, above. A unit standing on a city tile is partly covered by the badge at its lower-right corner, which is the mockup's pick. A population of ten or more widens the pill leftwards and rightwards about its centre, as the mockup draws it. The pill's shape is Phaser's rounded rectangle with a radius of half its height, as the pile's pill is drawn, so at one digit it is a disc.
- Reconcile: the count pills stay apart (the pile's, the browse's, the city's), as the user chose; the culture threshold stays apart, the badge going through the same crispness rule its text goes through; the bar's Idle and the badge are two meant readings.

**Traps:**

- A text on the map is rasterised once and scaled after: the threshold's text takes the map's zoom into its resolution and is raised again at every zoom change and on resize (`paintThreshold`, `onResize` in `src/ui/map.ts`). The badge's number follows the same rule or blurs at the close zooms; the zoom change that repaints the threshold must repaint the badge, and the render must too.
- A Layer's `removeAll(true)` destroys nothing (`docs/PHASER.md` _Scenes and stacking_); the map's groups are emptied by `wipe`. A Layer draws its children by add order among equal depths, and a group added to a stratum after another stands over it: the badge's group stands over the unit marks' and under the fog's.
- The number's own box is read with `ownBoxOf` (`src/ui/design-space.ts`), which takes the text's inset off; the pill's width is that box plus the pads and never under the height.
- The map's render is the one place the badge is painted from, as the border is: the chronicle it reads is `shown`, and the holder of a tile drawn live is read off the chronicle, in fog off the snapshot, which keeps no population — hence live only.
- `src/ui/` never imports `src/content/`; the badge reads the chronicle alone. A colour is named for what it means: two ink entries, never one named for its value, and never the existing `ink` or `paleInk` read directly for the badge's number.
- A spec reads what stands together in one question to the page (`readings` in `e2e/chronicle-screen.ts`), and rests before it measures what just changed. The fixture that draws a strike past the food, `hungry` in `e2e/end-of-turn-reading.spec.ts`, moves to `e2e/chronicle-screen.ts` once the proof spec is its second user: a helper copied between specs is blocked in review.
- The Nomadic region deals no neutral: the neutral's badge is proven on the age whose content names one, as `e2e/neutral.spec.ts` finds it through the catalogue, on a campaign built through `tools/learned-with-needs.ts`, the veils taken off through the debug console as that spec does.
- Comments are for traps only.

**Plan:**

1. `src/ui/look.ts`: the two ink entries for a city's badge, by city faction.
2. `src/ui/map.ts`: the badge painted on each city's own tile drawn live at every render, over the units and under the fog, its number rasterised at the map's zoom and repainted with the threshold on a zoom change and on resize; named so a spec reads it by its tile, for instance `population-<tileKey>`.
3. `e2e/chronicle-screen.ts`: `hungry` moved here from `e2e/end-of-turn-reading.spec.ts`, that spec importing it.
4. `e2e/population-badge.spec.ts`: the player's city wears the badge reading its population, and after the turn whose strike takes one it reads the ended chronicle's population; the neutral's city tile, uncharted, wears none, and with the uncharted and fog veils off wears one reading the neutral's population, in the neutral's colour.
5. `docs/CHRONICLE-SCREEN.md` and `docs/INTERFACE.md`: the sentences above, verbatim.
6. `workflow/BOARD.md`: the line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof: `npx playwright test e2e/population-badge.spec.ts`.
- CI's on the push: `e2e/end-of-turn-reading.spec.ts`, `e2e/neutral.spec.ts`, `e2e/fog.spec.ts`, `e2e/map.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/fall.spec.ts`, `e2e/pointer-sweep.spec.ts`, `e2e/hover.spec.ts`.
