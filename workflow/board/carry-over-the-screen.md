# The carry let go over the screen

**Line:** **The carry let go over the screen** — a unit or a population carried and let go over the infopanel, the pinned achievement or a mode's chip comes home, as `docs/CHRONICLE-SCREEN.md` says of one let go anywhere but a tile it can take, instead of landing on the tile hidden under it; `e2e/map.spec.ts` is green. Doc-impact: none — the design already says it.

**Spec:** no sentence is added or changed; these stand and the code disagrees with them:

- `docs/CHRONICLE-SCREEN.md`, _The chronicle screen_, the paragraph on the two modes: "A drag from the unit onto a lit or glowed tile is the same step or the same attack; let go anywhere else, the unit comes home".
- The same page, _City mode_: "A drag from a tile the population stands on onto a tile the city holds and nobody stands on takes it off the one and puts it on the other in that one gesture, the tile it lands on selected; let go anywhere else, the population comes home and nothing changes."
- `docs/INTERFACE.md`, the paragraph on tooltips and the pointer: "The pointer is on the one thing that stands topmost under it, across every surface, at every moment". Over the infopanel, the pinned achievement or a chip, the pointer is on that thing and on no tile, so a carry let go there is let go "anywhere else".
- `docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_: "A press on the infopanel reaches no tile under it." and _The pinned achievement_: "a press on it reaches no tile under it".

No player-facing entry.

**Doc-impact:** none — the design already says it.

**Scope:**

In:

- A unit carried out of the city mode, let go over the infopanel, the pinned achievement or a mode's chip (city mode's, the settle phase's): it comes home, no step and no attack, the selection where it was, as a unit let go anywhere else does today.
- A population carried in city mode, let go over the same things: it comes home and nothing changes, as one let go anywhere else does today.
- Every object that stands over the map's frame and keeps a press off the map keeps a carry's release off it too; the three named are the ones that stand there today.

Out: a hand card's drag, which plays at its release wherever it lands clear of the hand and reads no tile at its release; a pan, which carries the map the whole way and reads no tile either; a tooltip, the refusal's note and the aim line, which take no press.

Corner cases, decided:

- A carry let go over a thing standing over the map and then over nothing is decided where it is let go: what stood under the pointer at the release.
- The infopanel standing over the very tile the unit was carried from changes nothing: the unit comes home either way.

Reconcile: the coming home is the one a carry let go off any tile already goes through; no second way home is added.

**Traps:**

- The map's press catcher and the aim catcher resolve a release by the pointer's coordinates alone (`src/ui/map.ts`, the release of the press catcher's carry, where `map.at` and `tileUnder` find the tile): that is where a release over the infopanel lands on the tile under it today.
- The infopanel stands on the map scene, on a stratum over the catchers; the pinned achievement and the chips stand on the chronicle screen's UI scene, over the map scene. A release's target across those two scenes is not Phaser's hit test of the catcher: `docs/PHASER.md`, _Input across scenes_, says how the topmost object under the pointer is found and how the scenes stop a pointer.
- A press is held by the button that landed it and its release lets it go wherever the pointer is (`docs/INTERFACE.md`); the catcher's release is the scene's, so a press that travelled off the catcher still ends.
- Comments are for traps only; the docs hold the why.

**Plan:**

1. `src/ui/map.ts` and whatever reads what stands over the map: a carry let go over the infopanel, the pinned achievement or a chip comes home. Leaves every carry released over the map's own ground as it is today.
2. `e2e/map.spec.ts`: beside "a drag on bare ground pans the map, and a drag from the unit moves it", a unit carried onto a lit tile the infopanel stands over, let go there, comes home, with the chronicle unchanged; a population carried in city mode and let go over the infopanel comes home, with the chronicle unchanged; and a unit let go over the pinned achievement standing over a lit tile, if the map can be placed so one stands under it from the spec's saved chronicle.
3. The board line and this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/map.spec.ts`.
- CI's, on the push: `e2e/city-mode.spec.ts`, `e2e/attack.spec.ts`, `e2e/press.spec.ts`, `e2e/inspect.spec.ts`, `e2e/pin.spec.ts`, `e2e/menu.spec.ts`, `e2e/settle.spec.ts`.
