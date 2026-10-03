# Every right click through the door

**Line:** **Every right click through the door** — a right press on the map is answered only where it is let go on the thing it landed on, the tile it landed on or the map beyond its tiles, and a right press let go on another thing does nothing; a right click beside the things — the band the hand and the piles stand in, the resource bar's paper, the map beyond its drawn tiles — drops the inspection and leaves the selection and any aim standing; `e2e/inspect.spec.ts` is green. Doc-impact: none — `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md` say it.

**Spec:** `docs/INTERFACE.md` _The presses_: "A click is a press landed and let go on the same thing; a press let go on another thing is a drag where it took hold of something, and nothing otherwise." and "A press beside the things, where no scrim stands, drops the inspection and leaves the selection standing."; `docs/CHRONICLE-SCREEN.md` _The map's presses_, the paragraph on what is beside the things, which the line before this one adds. No sentence is added or changed, and no player-facing entry.

**Doc-impact:** none — the pages say it.

**Scope:**

In:

- A right press landed on a tile and let go on that tile inspects it, as today; let go on another tile, on a thing standing over the map, or off the map's frame, it does nothing.
- A right press landed beside the things and let go beside the things drops the inspection and leaves the selection standing, an aim among it.
- The same holds while a card or a unit is being aimed, and for a right click pressed while the left button holds, which is answered at its own release as today.

Out: a right drag past the slack, which pans the map and answers nothing, as today; a right click on a thing standing over the map, which that thing answers, as today; the left click, the line before this one's; a scrim and what stands on it.

Corner cases, decided:

- Beside the things is one ground, as for the left click.
- A right press landed on a tile and let go on its neighbour inside the drag slack does nothing: the tile is the thing.
- A right click beside the things with nothing inspected changes nothing.

Reconcile: the right click goes through the door the line before this one widened for the left click; the map's catchers, which answer a right press by the pointer's position alone today, stop answering one themselves.

**Traps:**

- The map's press catcher and the aim's catcher answer a right press at its release by the pointer's coordinates alone (`src/ui/map.ts`), which is how a right press let go on the infopanel, a chip or the pinned achievement inspects the tile under them today, and one let go a few units under the map's frame inspects a tile the frame hides.
- The infopanel stands on the map's own scene, over the catchers; the bar, the chips and the pinned achievement stand on the UI scene, over the map scene (`docs/PHASER.md`, _Input across scenes_).
- A second button's click while a press is held is answered at its own release (`takePress`, `src/ui/map.ts`), and `e2e/press.spec.ts` holds the tests of a right click under a carried unit and under a held press on an aim.
- The drag slack is `DRAG_SLACK` in `src/ui/design-space.ts`, in device pixels through the render factor.
- Comments are for traps only; the pages hold the why.

**Plan:**

1. `src/ui/chronicle-scene.ts`, `src/ui/map.ts`: the right press goes through the door; a right press let go on another thing does nothing; a right click beside the things drops the inspection. Leaves every right click let go on the thing it landed on answered as today.
2. `e2e/inspect.spec.ts`, beside "a right click inspects and never selects…": a right press landed on a tile and let go on the infopanel inspects nothing new, the infopanel reading what it read; a right click on the band drops the inspection and leaves the selected tile ringed.
3. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/inspect.spec.ts`.
- CI's, on the push: `e2e/press.spec.ts`, `e2e/map.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/hover.spec.ts`, `e2e/browse.spec.ts`, `e2e/fog.spec.ts`.
