# Every left click through the door

**Line:** **Every left click through the door** — the door the card's aim goes through answers every left click the screen's things do not answer themselves: a selected unit that lights or glows anything is let go by a left click on a reading of the bar, a pile, the infopanel, the pinned achievement or a chip, the inspection standing, while a unit that lights nothing and an enemy's tile stay selected; a left click beside the things — the band the hand and the piles stand in, the resource bar's paper, the map beyond its drawn tiles — drops any selection and the inspection with it; `docs/CHRONICLE-SCREEN.md` says what is beside the things on its screen; `e2e/press.spec.ts` is green. Doc-impact: `docs/CHRONICLE-SCREEN.md`.

**Spec:** [`../BRANCH.md`](../BRANCH.md), _The design_; on the pages, `docs/INTERFACE.md` _The presses_: "A press lands on the thing the pointer is on, and on nothing under it…", "a press beside the things drops it and the inspection with it", and "A selected thing being aimed filters every left click by its aim…"; `docs/CHRONICLE-SCREEN.md` _The map's presses_, "A unit that lights or glows anything is being aimed from the moment its tile is selected…".

One sentence is added, to `docs/CHRONICLE-SCREEN.md` _The map's presses_, as a paragraph of its own after the first:

> **Beside the things** on the chronicle screen is the map beyond the tiles it draws, the band the hand and the piles stand in, and the resource bar's paper between its readings: a press there lands on no thing.

No player-facing entry.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The door answers every left click on the chronicle screen that no thing standing on it answers by itself, whatever is selected, being aimed or not; while a card is being aimed it answers as it does today.
- A selected unit of the player's that lights or glows anything is being aimed. A click on a tile it lights or a unit it glows is the step or the attack, as today, and nothing is refused. A click on any other tile, its own excepted, lets it go and selects that tile, as today; a second click on its own tile acts on the selection, as today, the city's entering city mode.
- A click on a thing that is not a tile — a reading, a pile, the infopanel, the pinned achievement, the settle phase's chip — lets the unit go, the inspection standing: its tile is selected no more, the tiles it lit go dark, and the click then lands as on a clean screen, a yield reading toggling its yield.
- A left click beside the things drops the selection, whatever it is — a tile, a unit, a card of the hand being aimed or not — and the inspection with it. After an aim let go, the clean screen's landing beside the things drops the inspection too.
- The sentence above, on `docs/CHRONICLE-SCREEN.md`.

Out: the right click, the next line's; a unit's drag, which reads where it lands as it does; the slide home, the branch's last line; a card of the hand, the end-turn button, culture and idle, each of which drops the selection already; the wheel and every key, through all of which a selection stands.

Corner cases, decided:

- A selected unit that lights and glows nothing, a selected enemy's tile and a selected tile nobody stands on are a selection and no aim: a click on a reading, a pile, the infopanel, the pinned achievement or a chip leaves them selected, a yield reading still toggling its yield.
- In city mode no unit is being aimed; a click beside the things drops the selection and the inspection and leaves the mode standing, as the page says of a press beside the tiles.
- Beside the things is one ground, wherever on it: a press landed there and let go there is a click beside the things.
- A press landed on one tile and let go on another, inside the drag slack, is no click: nothing is selected, nothing let go, no step, no attack, no play. So is a press landed on a tile and let go on a thing standing over the map, and one landed on a thing and let go on another.
- A unit that steps or attacks and has something left to do is being aimed again where the selection follows it, as today.
- The pointer stays the arrow beside the things.

Reconcile: the door the card's aim goes through is widened to every left click; the map's own answer to a press off its tiles, which drops the selection today, goes through it too, so no second place answers a click beside the things.

**Traps:**

- The door opens today only while a card is being aimed (`src/ui/chronicle-scene.ts`, the scene's `pointerdown` and `pointerup`): widening it is the line, and the map's own press catcher still answers a click on a tile with nothing aimed.
- The band is drawn and not interactive, and the map's catchers cover the map's frame alone, so a press on the band reaches no object today and the pointer is on nothing there; the resource bar's paper is interactive, so a press there finds the paper (`resource-bar` in `src/ui/resource-bar.ts`). Both are beside the things.
- The Menu button stands on the bar in the menu's own scene: it is a thing, and the topmost thing under the pointer is read across every running scene (`thingUnder`, `src/ui/design-space.ts`), never inside Phaser's dispatch (`docs/PHASER.md`).
- The screen's own dismissal drops the inspection with the selection; a unit let go by a click on a thing keeps its inspection, so that is not the dismissal as it stands.
- Whether the selected unit lights or glows anything is the map's knowledge, read from what it lit at the selection; in city mode it lights none.
- The drag slack is `DRAG_SLACK` in `src/ui/design-space.ts`, in device pixels through the render factor.
- A spec that presses the bar's paper, a pile, a panel or the band with something selected rests on what the game did before this line: it is found by search and brought to the design, never loosened.
- Comments are for traps only; the pages hold the why.

**Plan:**

1. `docs/CHRONICLE-SCREEN.md`: the sentence above.
2. `src/ui/chronicle-scene.ts`, `src/ui/map.ts`, and what they hand each other: the door answers every left click the things do not; beside the things drops the selection and the inspection; a selected unit that lights or glows anything is let go by a click on a thing. Leaves every left click of today on a tile, a card, a reading and a button answered as today.
3. `e2e/press.spec.ts`, beside the tests of a card being aimed let go: a unit of the player's selected with tiles lit is let go by a click on a yield reading, which latches its yield as well, on a pile and on the infopanel, the infopanel standing after it; a selected unit that lights nothing stays selected through a click on a pile; a selected tile is dropped, with the inspection, by a click on the band and by one on the bar's paper; a selected card that aims at nothing is dropped by a click on the band; a press landed on one tile and let go on its neighbour within the slack selects nothing.
4. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/press.spec.ts`.
- CI's, on the push: `e2e/map.spec.ts`, `e2e/move.spec.ts`, `e2e/attack.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/inspect.spec.ts`, `e2e/yields.spec.ts`, `e2e/pin.spec.ts`, `e2e/camps.spec.ts`, `e2e/fog.spec.ts`, `e2e/hover.spec.ts`, `e2e/refuse.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/settle.spec.ts`, `e2e/browse.spec.ts`.
