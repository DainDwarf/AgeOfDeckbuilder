# A unit and a population slide home

**Line:** **A unit and a population slide home** — a unit or a population dragged and let go off where it lands slides home as fast as a card of the hand does, whatever let it go; `e2e/map.spec.ts` is green. Doc-impact: none — the first line says it.

**Spec:** [`../BRANCH.md`](../BRANCH.md), _The design_; on the pages, `docs/INTERFACE.md` _The presses_, "let go anywhere else, a thing standing over where it would land included, it comes home, as fast whatever it is, and nothing changes". No sentence is added or changed, and no player-facing entry.

**Doc-impact:** none — the first line of the branch says it.

**Scope:**

In:

- A unit dragged and let go anywhere but on a tile it lights or a unit it glows slides from where it was let go to the tile it stands on, in the time a card of the hand takes to slide home.
- A population dragged in city mode and let go anywhere but on a tile the city holds and nobody stands on slides home the same way.
- Whatever lets the drag go slides it home: a release on the map, over a thing standing over the map, off the canvas, a scrim rising, and, for a population, city mode left by its key under the press.

Out: a drag that lands, which plays as it does today; a press on a unit that never became a drag, which has moved nothing; the card of the hand and the deck's card, which slide home already.

Corner cases, decided:

- The time is the one a card of the hand slides home in, the same value read from the same place, never a second number.
- The selection stays where it was through the slide and after it.
- A unit or a population taken hold of again while it slides is taken from where it then stands.
- A play-out that begins while one slides finds it home: the slide ends at once.

Reconcile: the unit and the population join the card of the hand and the deck's card, which slide home in the same time; the four become one in what the player sees, each surface keeping its own motion.

**Traps:**

- The time a card slides home in is `SLIDE_HOME` in `src/ui/card-motion.ts`, which the hand and the collection's carrier both read.
- The map redraws its unit marks and its population marks on a render: a mark still sliding when a render comes is stopped first, as every motion a render overtakes is.
- A tween killed announces no end (`docs/PHASER.md`, _Rendering under WebGL_, `killTweensOf`): nothing waits on a slide that a render or a new hold may kill.
- The screen stops every motion on the map when it lets go of a play-out (`stopAllMotion`, `src/ui/chronicle-scene.ts`).
- A spec asserts where a mark stands after a rest: the tests of a drag let go over the infopanel and the pinned achievement in `e2e/map.spec.ts` read the mark home, and now read it home once the slide has ended, on the game's clock.
- Comments are for traps only; the pages hold the why.

**Plan:**

1. `src/ui/map.ts`: a unit and a population let go off where they land slide home. Leaves a drag that lands, and a press that dragged nothing, as they are.
2. `e2e/map.spec.ts`, beside "a unit carried onto a lit tile the infopanel stands over and let go there comes home…": the tests of a drag let go read the mark home once the slide has ended. No test reads the mark mid-way: the slide itself is the visual check's and the user's to see.
3. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/map.spec.ts`.
- CI's, on the push: `e2e/city-mode.spec.ts`, `e2e/press.spec.ts`, `e2e/attack.spec.ts`, `e2e/move.spec.ts`, `e2e/menu.spec.ts`, `e2e/broken-motion.spec.ts`.
