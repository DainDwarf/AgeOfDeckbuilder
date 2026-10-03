# The aim let go off the corners

**Line:** **The aim let go off the corners** — a left click on the pinned achievement or on the resource bar while a card is being aimed lets the card go and then lands as it would on a clean screen, as `docs/CHRONICLE-SCREEN.md` _The hand and the aim_ says of a press on anything else; `e2e/press.spec.ts` is green. Doc-impact: none — the design already says it.

**Spec:** `docs/CHRONICLE-SCREEN.md`, _The hand and the aim_: "A press on anything else lets the card go and then lands, in the one press, as it would on a clean screen". The same page, _The right click, the back key and the menu_: "The menu opens over the chronicle screen as over any screen, and the screen waits under it: the selection, a card being aimed included". The same page, _The pinned achievement_: "It answers no press, and a press on it reaches no tile under it". No sentence is added or changed, and no player-facing entry.

**Doc-impact:** none — the design already says it; the code disagrees.

**Scope:**

In:

- Every aim the chronicle screen holds in its hand: at a tile, at a unit, at the hand. The discard pile's aim is out: its window's scrim covers the bar and the pinned achievement.
- A left click on the pinned achievement, anywhere on it, a name in its goal included, lets the card go and does nothing else: on a clean screen it answers no press. It still reaches no tile under it.
- A left click on a yield reading of the resource bar lets the card go and toggles that reading's yield, in the one press.
- A left click on culture or on idle lets the card go and enters city mode, in the one press, as it does today.
- A left click on the bar's bare ground, between and around its readings, lets the card go and does nothing else.

Out: the Menu button, which opens the menu with the aim waiting under it, as the menu sentence says; a right click, which inspects a name or does nothing and keeps the aim, the aim filtering left clicks alone; the wheel; the yield key and every other key, which are no press; the piles, the hand and the mode chips, which this line does not touch.

Corner cases, decided:

- The yield key toggles the overlay while a card is aimed and keeps the aim; only the reading's left click lets it go.
- The pointer stays the arrow over the pinned achievement and over the bar's bare ground: neither answers a press on a clean screen, and the letting go of an aim does not make a thing answer a press.

Reconcile: the card is let go through what lets it go today on a press beside the tiles and on a press on culture or idle; no second way to let a card go is added.

**Traps:**

- The chronicle screen's UI scene stops a press on any interactive object it holds from reaching the map (`stopsThePointer`, `src/ui/design-space.ts`; `docs/PHASER.md`, _Input across scenes_), so the map's aim catcher never hears a press on the bar or the pinned achievement: the letting go has to happen on the UI side.
- The bar's paper (`src/ui/resource-bar.ts`) is not interactive, and the map's camera frames `MAP_FRAME` alone, which the bar stands outside of: a press on the bar's bare ground reaches nothing today. Making the paper hear a press must not mark it as answering one (`answersPress`), or the pointer becomes a hand over it.
- The pinned achievement's zone (`src/ui/pinned-achievement.ts`) is interactive and deliberately not marked as answering a press; that stays.
- Culture and idle already let the card go through `enterCityMode`'s `dismiss`; a change that lets go ahead of the reading's own press must not make those two let go twice or drop the city mode they enter.
- The end-turn button is put dead for a tile aim and back live when it is let go (`aimTile` in `src/ui/chronicle-scene.ts`): a letting go from the UI side must go through the same release, or the button stays dead.
- Comments are for traps only; the docs hold the why.

**Plan:**

1. `src/ui/resource-bar.ts`, `src/ui/pinned-achievement.ts`, `src/ui/chronicle-scene.ts`: a left click on the pinned achievement and anywhere on the bar lets the card being aimed go, then lands as on a clean screen. Leaves every aim let go from those two surfaces, nothing else changed on screen.
2. `e2e/press.spec.ts`: beside "a click beside the tiles lets the card being aimed go, as it drops a selection", tests that a left click on the pinned achievement, on the bar's bare ground and on a yield reading each let the card being aimed go and leave the chronicle as it was, the yield reading's press latching its yield as well. The pinned achievement's test builds its campaign as `e2e/pin.spec.ts` does, through `e2e/chronicle-screen.ts`.
3. The board line and this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/press.spec.ts`.
- CI's, on the push: `e2e/pin.spec.ts`, `e2e/yields.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/refuse.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/menu.spec.ts`, `e2e/map.spec.ts`.
