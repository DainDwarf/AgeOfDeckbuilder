# A unit's path drawn

**Line:** **A unit's path drawn** — a unit being aimed wears its path to the tile of its reach the pointer is on, or the one it is dragged over: chevrons from the unit to the landing and the move points it would have left at the end, kept on the last such tile once the pointer leaves the reach; the rules answer the path; `e2e/path.spec.ts` passes.

**Spec:**

`docs/CHRONICLE.md`, _Units and combat_, the first bullet, **A unit moves on its own move points**: after "Crossing to a tile costs the cheapest way there, and the tile a unit already stands on costs it nothing." one sentence is added, written out:

> Of the ways that cost that, a unit's path is the one over the fewest tiles, and of those the one that keeps nearest the straight line from the unit to the tile.

`docs/CHRONICLE-SCREEN.md`, _The map's presses_, a new paragraph after the first, written out:

> **A unit being aimed shows its path.** The lit tile the pointer is on wears the unit's path to it, the tiles it would cross from where it stands, and at its end the move points the unit would have left; a unit dragged over a lit tile shows the same. Once the pointer leaves the lit tiles the path stays on the last one it was on, until the pointer is on a lit tile again, which takes the path, or on the unit's own tile, which wears none, or the unit is let go. A step or an attack lights the unit anew and keeps no path, and a tile lit no longer loses its path. The path is the pointer's reading as any other: it stands under a pointer that never moved.

`docs/CHRONICLE-SCREEN.md`, _The yield overlay_: "The dim spares the ring, the culture threshold the selected tile wears, the reach's region, the infopanel of the tile being inspected, and the tiles a card is aimed at." becomes "The dim spares the ring, the culture threshold the selected tile wears, the reach's region, the path of a unit being aimed, the infopanel of the tile being inspected, and the tiles a card is aimed at."

`docs/LOOK.md`, _The map_, a new paragraph after **The reach.**, written out:

> **The path.** A unit's path to a landing is chevrons in the selection's white, pointing the way: two to each step, at three tenths and seven tenths of the way from one tile to the next, each a right angle with its point on the way and its two arms reaching 3.75 units back and 3.75 to either side, stroked 1.5 units wide at 90% with round ends, over the same shape 3 units wide in the map's dark outline at 63%. It runs 8 units below the tiles' middles, where a unit's painting stands, from the unit's tile to the landing. At its end, 8 units below the landing's middle, the move points the unit would have left stand on the plate the culture threshold stands on, the number alone. The path and its number are drawn over everything on the map, the selection and a unit being dragged included, and are never darkened by the fog, being the screen's answer as the selection is; under the yield overlay the dim spares them.

Player-facing entries: none. The number at the end is the move points alone, read through the formatter the infopanel's unit card reads move points with, so half a point reads `0.5`.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`. No glossary row: the path is a mark's name on the look page, as the reach is.

**Scope:**

In:

- The rules answer a unit's path to one of its landings: the tiles it crosses in order, from the tile it stands on to the landing, by the sentence above. They answer for a unit of any faction, through the passage `reachable` reads, since the motion that walks a unit along its path comes later and walks the others too.
- The screen draws that path and the number while a unit of the player's is lit, by the paragraph above, on a hover and on a drag alike.
- The mockup the user took it from, opening on the picks: https://claude.ai/artifact/9Fc8YpamGAhUXXbKFUntKP. The picks, pasted back: chevrons, the move points left at the end, the selection's white, a dark edge under it, width 1.5, strength 90%, over everything on the map, the fewest tiles then the straightest. The user picked 7 below the middles meaning where the unit stands, which is 8.

Out: the move played along the path, the turns a longer way takes and a move ordered over several turns (Motion's); a mark where the path crosses a river; any motion on the path coming or going, which appears and goes at once; a path for an attack; a path for an enemy on the screen; the move command or its stage carrying the path.

Corner cases decided here:

- Before any lit tile is pointed at, no path stands. The mockup's first version opened on the far-left tile; that was the page's own.
- The pointer on the unit's own tile draws no path and drops the kept one. The pointer on anything else that is not a lit tile keeps it: a tile outside the reach, a tile one of the player's own units holds inside it, an enemy glowed, the map beyond the tiles, a card, the bar, a panel, a button, the page outside the canvas.
- A drag let go outside the reach sends the unit home and the path stays on the tile it last stood on.
- A step or an attack lights the unit anew: nothing is kept, and a pointer already resting on a tile of the new reach gets its path at once. After a step by click or by drag the pointer rests on the unit's own tile, so none stands.
- The path stands only while its tile is among the lit landings: a card played, a window risen or city mode entered that leaves the unit lit for nothing or lit otherwise takes it down. The menu and the Declare War warning leave the unit lit as it was, and the path with it.
- A path to a tile the neutral holds at peace is drawn as any other; the warning is the press's.
- A path may cross a tile one of the player's own units holds: its chevrons are drawn over that unit as over everything.
- On a drag the number can sit on the dragged unit's painting, the unit being under the pointer and the number 8 below the landing's middle. The user saw it and kept the place.
- The plate is never narrower than it is tall: one figure stands on a disc 16 across, more widen it as the threshold's plate widens.
- The last tie, two paths of one cost, one count of tiles and one distance from the straight line, falls back on the order the map lists its tiles in and on nothing else; which tile of the two paths is compared is the implementer's.

What the reconcile chose:

1. The number's plate goes through the culture threshold's plate as it is: dark, pale rim, 16 tall, 12 bold. The meant differences: no glyph, and 8 below the middle. The two never share the screen.
2. The number goes through the formatter the infopanel's unit card reads move points with.
3. The chevrons are the selection's white, the colour the reach's line and the selection's rim read, at a strength of their own that starts at 90%; the dark edge under them has a strength of its own too.
4. The path's ties stay apart from the scripts' ties in tile order: a script chooses which landing to go for, the path which tiles lie between.
5. The path stands on the stratum the selection's ring and a card's rims stand on, over everything on the map and over the yield overlay's dim, so a unit being dragged passes under it. No unit is lifted above that stratum.
6. The pages call it the path, with no glossary row.

**Traps:**

- `reachable` and `byHand` are called in the simulator's inner loop, by every persona and every enemy script: they hand out what they hand out today and cost what they cost today. The path is asked for one landing at a time, by whoever draws it.
- "Nearest the straight line" is exact in the rules' own coordinates: with `d` the landing less the unit's tile and `p` a tile of the path less the unit's tile, both axial, a tile's distance from the line is `|d.q · p.r − d.r · p.q|` up to one factor every tile shares, an integer. The path's distance is the sum over its tiles. No square root and no tolerance enter the comparison.
- A river crossing spends every point left whatever was spent before it, so a way that wanders and then crosses costs what the straight crossing costs: "the fewest tiles" is what keeps the path from wandering, and the test's first case.
- A tile of the unit's own faction is crossed and never offered; a tile whose passage ends the walk is landed on and never crossed; the unit's own tile is where every path starts whatever its passage says.
- What the pointer is on is the game's own reading, once a frame (`followPointer` in `src/ui/design-space.ts`), never Phaser's over and out: Phaser re-checks only when the pointer moves, so a map panned by key, a reach lit anew or a window closed under a resting pointer raises no event (`docs/PHASER.md`, _The pointer's readings_). A hit test of the game's own runs outside Phaser's dispatch, as `src/ui/map-grab.ts` does on a release (same section).
- A Graphics joins the segments of a stroke only above a width of 2 (`docs/PHASER.md`): a chevron stroked 1.5 wide by a Graphics has an open point and square ends, where the mockup's has round ones. The selection's rim is painted once on a canvas texture and shown scaled (`src/ui/map-fade.ts`).
- The chevrons come and go in numbers: pooled, hidden and reused, never destroyed to be drawn again (`DOGMAS.md`, _Stack_).
- Every strength and colour is a `LOOK` entry named for its meaning; the white is the selection's entry, the two strengths are new entries.
- The stratum over the dim is where the selection's ring already stands, so nothing has to be lifted when the yield overlay comes up; the reach, a stratum below, is lifted by `liftOverDim`.
- The lattice is squashed: positions come from `positionOf`, and a chevron is drawn unsquashed, turned to the line between the two points on screen.
- The specs read a mark as standing only if it and every parent over it is visible, and the reach's layer carries its landings' keys as data for them (`createReach`, `window.litKeys` in `e2e/chronicle-screen.ts`): the path's layer can carry its tiles' keys the same way.
- A mouse move to the coordinates the pointer already rests on is no move Phaser sees (`docs/PHASER.md`, _Under a Playwright spec_), and a spec rests before it presses or measures what just changed.
- A unit being dragged is the marker moved under the pointer by `src/ui/map-grab.ts`; while it is held, `lightUnit` has lit its unit, and the release relights the selection.

**Plan:**

Two commits, the rules' first.

1. `src/rules/`, with one test beside it on the fixture's ground: the rules answer a unit's path to a landing. The test, one rule a player could state: across a river with a free tile to wander on, the path is the one step; where one dear tile and two cheap ones cost the same, it goes over the dear one; on open ground it keeps to the straight line; it crosses a tile a unit of its own holds; and walked step by step it spends what the landing costs. Leaves standing: the question answered and proven, asked by nobody. Committed alone.
2. `src/ui/look.ts` and the map's marks: the chevron and its dark edge, pooled, on the selection's stratum; the number on the threshold's plate through the infopanel's formatter. Leaves standing: a path the map can show for a list of tiles, shown by nobody.
3. `src/ui/map.ts` and `src/ui/map-grab.ts`: while a unit is lit, the map reads which tile the pointer is on, on a hover and under a drag, keeps the last lit one by the paragraph above, asks the rules its path and shows it; whatever relights the unit or lights nothing drops it. Leaves standing: the line's behaviour whole.
4. `e2e/path.spec.ts`, new, with the reading it needs in `e2e/chronicle-screen.ts`. It opens on a saved chronicle with a unit entered through the rules where a landing lies two steps or more away, every oracle read from the rules' own path, and asserts: no path at the open and none once the unit is selected; the pointer on that landing raises two chevrons a step on the path's tiles and the move points left; the pointer moved beside the tiles leaves the same path standing; the pointer on another landing moves it there; the pointer on the unit's own tile leaves none; the unit dragged over a landing shows its path, and let go beside the tiles comes home with the path still standing; the map panned by key under a pointer that never moved changes the path to the tile now under it; a click on a landing lands the step and leaves no path.
5. `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md` and `docs/LOOK.md` as written above; the board line deleted.

The report's Verification also says what a pointer swept across the reach costs a frame against the same sweep with no unit selected, sampled over `requestAnimationFrame` in a throwaway spec: it was not measured at intake.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/path.spec.ts`. CI's on the push, listed for the hand-back: `move.spec.ts`, `attack.spec.ts`, `press.spec.ts`, `hover.spec.ts`, `pointer-sweep.spec.ts`, `map.spec.ts`, `yields.spec.ts`, `city-mode.spec.ts`, `hand-aim.spec.ts`, `embark.spec.ts`, `neutral.spec.ts`, `fog.spec.ts`.
