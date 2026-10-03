# The unit's aim through that door

**Line:** **The unit's aim through that door** — a left click on the bar, a pile, the infopanel, the pinned achievement or a chip lets go of a selected unit that lights or glows anything, the inspection standing, and leaves selected a unit that lights nothing and an enemy's tile; `e2e/press.spec.ts` is green. Doc-impact: none — the first line says it.

**Spec:** [`../BRANCH.md`](../BRANCH.md), _The design_; on the pages, `docs/INTERFACE.md` _The presses_, the paragraph opening "A selected thing being aimed filters every left click by its aim", and `docs/CHRONICLE-SCREEN.md` _The map's presses_, "A unit that lights or glows anything is being aimed from the moment its tile is selected…". No sentence is added or changed, and no player-facing entry.

**Doc-impact:** none — the first line of the branch says it.

**Scope:**

In:

- A selected unit of the player's that lights or glows anything is being aimed, and the place that answers a left click for a card being aimed answers it for the unit.
- A click on a tile it lights or a unit it glows is the step or the attack, as today, and nothing is refused.
- A click on any other tile, its own excepted, lets it go and selects that tile, as today; a second click on its own tile acts on the selection, as today, the city's entering city mode.
- A click on anything else — the bar's ground, a reading, a pile, the infopanel, the pinned achievement, the settle phase's chip — lets the unit go: its tile is selected no more, the tiles it lit go dark, and the click then lands as on a clean screen, a yield reading toggling its yield.

Out: a unit's drag, which reads where it lands as it does; the slide home, the next line's; city mode, which lights no unit and so aims none; a card of the hand, the end-turn button, culture and idle, each of which drops the selection already; the right click, the wheel and every key, through all of which the unit stays selected.

Corner cases, decided:

- A selected unit that lights and glows nothing, a selected enemy's tile and a selected tile nobody stands on are a selection and no aim: a click on the bar, a pile, a panel or a chip leaves them selected, as today.
- The unit is let go with the inspection standing, as a card is: a click on the infopanel leaves the infopanel up and drops the ring.
- A press that lands on a tile and is let go, inside the drag slack, on a thing standing over the map is no click: no step, no attack, nothing selected, nothing let go.
- A unit that steps or attacks and has something left to do is being aimed again where the selection follows it, as today.

Reconcile: the unit is let go through the door the line before this one made for the card; no second place filters a click.

**Traps:**

- The screen's own dismissal drops the inspection with the selection (`src/ui/chronicle-scene.ts`): a unit let go by a click on a thing keeps its inspection, so it is not that dismissal as it stands.
- Whether the selected unit lights or glows anything is the map's knowledge, read from what it lit at the selection; in city mode it lights none.
- A spec that selects a unit and then presses a reading, a pile or a panel rests on what the game did before this line: it is found by search and brought to the design, the unit selected again after the press, never loosened.
- The map's press resolves a release by the pointer's coordinates alone when nothing is dragged, whatever the press has drifted onto.
- Comments are for traps only; the pages hold the why.

**Plan:**

1. `src/ui/chronicle-scene.ts`, `src/ui/map.ts`: a selected unit that lights or glows anything is let go by a left click on anything but a tile, through the place the card's aim goes through. Leaves a unit that lights nothing, an enemy's tile and a bare tile selected through those clicks.
2. `e2e/press.spec.ts`, beside the tests of a card being aimed let go: a unit of the player's selected with tiles lit is let go by a click on the bar's bare ground, on a yield reading, which latches its yield as well, on a pile and on the infopanel, the infopanel standing after it; a selected unit that lights nothing stays selected through a click on the bar; a selected tile nobody stands on does too.
3. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/press.spec.ts`.
- CI's, on the push: `e2e/map.spec.ts`, `e2e/move.spec.ts`, `e2e/attack.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/inspect.spec.ts`, `e2e/yields.spec.ts`, `e2e/pin.spec.ts`, `e2e/camps.spec.ts`, `e2e/fog.spec.ts`, `e2e/hover.spec.ts`.
