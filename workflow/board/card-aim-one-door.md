# The card's aim through one door

**Line:** **The card's aim through one door** — one place answers a left click while a card is being aimed, and the bar, the piles, the infopanel and the pinned achievement are handed no way to let a card go; the settle phase's chip, the line naming the aim and a dead end-turn button stop a press, and the end-turn button clicked through an aim lets the card go and ends the turn; `e2e/press.spec.ts` is green. Doc-impact: none — the first line says it.

**Spec:** [`../BRANCH.md`](../BRANCH.md), _The design_; on the pages, `docs/INTERFACE.md` _The presses_, the paragraphs opening "A press lands on the thing the pointer is on" and "A selected thing being aimed filters every left click by its aim", and `docs/CHRONICLE-SCREEN.md` _The hand and the aim_. No sentence is added or changed, and no player-facing entry.

**Doc-impact:** none — the first line of the branch says it. `docs/PHASER.md` takes an entry only if the work meets a Phaser fact neither it nor the bundled pages say.

**Scope:**

In, for a card aimed at a tile, at a unit or at the hand:

- A left click on a thing of the aim's kind is the play attempted there, as today: played, or refused in a note with the aim standing. A card aimed at a unit still says that no unit stands on a tile that holds none.
- A left click on anything else lets the card go and then lands, in the one press, as on a clean screen. One place decides this, reading what the pointer is on; the resource bar, the piles, the infopanel and the pinned achievement no longer take a way to let a card go.
- The end-turn button is live through an aim: a click on it lets the card go and ends the turn.
- The line naming the aim stops a press: a click on it lets the card go and does nothing else.
- The settle phase's chip stops a press, a card being aimed or not: with one, the click lets it go; with none, nothing is selected and nothing changes.
- The end-turn button while it is dead, before the city stands and during a play-out, stops a press as a live one does: with a card being aimed the click lets it go and no more.

Out: the selected unit, which is the next line's; the slide home, the line after; a card's drag, which plays as it does; the aim window, whose scrim covers the screen; the Menu button, which opens the menu with the aim waiting under it; the right click, the wheel and every key, through all of which the aim stands.

Corner cases, decided:

- A press that lands on a tile and is let go, inside the drag slack, on a thing standing over the map is no click: nothing is played, nothing is let go, nothing is selected.
- A card selected and not being aimed — one that aims at nothing, one that aims at the discard pile or at the hand before its second click — is not let go by a click on the bar, a pile, a panel, a chip or the line: an aim filters, a selection does not.
- A click on the infopanel lets the card go with the inspection standing, as today.
- A click on culture or on idle lets the card go and enters city mode, once.
- A refusal's note is see-through: a press on it takes it down and lands on what stands under it, as today.
- The pointer stays the arrow over the settle phase's chip, over the line naming the aim and over a dead end-turn button: none answers a press of its own.
- A mode's frame around the map is see-through, as today.

Reconcile: the five ways a card is let go today become the one door, on this line; stopping a press goes through the way the infopanel and the pinned achievement already do it, interactive and never marked as answering; what the pointer is on is read through the one reading the hover, the cursor and a unit's release already use.

**Traps:**

- The chronicle screen's UI scene keeps every press on an interactive object it holds from the map under it (`stopsThePointer`, `src/ui/design-space.ts`; `docs/PHASER.md`, _Input across scenes_), and the infopanel stands on the map's own scene over the map's catchers: the map's aim hears neither, which is why each thing lets the card go by itself today.
- The menu and the debug console are scenes of their own over the chronicle screen, and the overlay's scrim another: a press there must not let a card go.
- A hit test skips an object whose input is disabled (`docs/PHASER.md`, _The pointer's readings_), so a button put dead with `disableInteractive` is see-through: that is how a click on the end-turn button reaches the tile under it today, through an aim and before the city stands alike. Dead has to mean answering nothing while still stopping the press, and the pointer over it the arrow.
- The topmost thing under the pointer is never read inside Phaser's input dispatch (`thingUnder`, `src/ui/design-space.ts`; `docs/PHASER.md`): the unit's release in `src/ui/map.ts` shows the way round it.
- The map's aim resolves a release by the pointer's coordinates alone, whatever the press has drifted onto.
- The line naming the aim is raised anew with each aim, and an object made interactive is hit-tested only from the next frame (`docs/PHASER.md`, _Under a Playwright spec_): a spec rests before it presses it.
- The end-turn button stands inside the map's frame, and so do the line and the chip: a tile may stand under each.
- A play-out lets go of everything through the screen's own dismissal; the end-turn button's click must not let the card go twice or leave the button dead after it.
- The specs wait for an aim through `aimed` and read it through `standing(page, 'aim')` (`e2e/chronicle-screen.ts`), both by the name of the map's aim catcher.
- Comments are for traps only; the pages hold the why.

**Plan:**

1. `src/ui/chronicle-scene.ts`, `src/ui/map.ts`, `src/ui/hand.ts` and what they hand each other: one place answers a left click while a card is being aimed. Leaves every click of today answered as today, through that place.
2. `src/ui/resource-bar.ts`, `src/ui/piles.ts`, `src/ui/infopanel.ts`, `src/ui/pinned-achievement.ts`: each loses the way to let a card go it was handed. Leaves `unaim` named nowhere under `src/ui/` outside the hand and the scene.
3. `src/ui/standing.ts`, `src/ui/aim-line.ts`, the end-turn button in `src/ui/chronicle-scene.ts`: the settle phase's chip, the line and the button, dead or live, stop a press, and the button stays live through an aim. Leaves no click reaching a tile under any of the three.
4. `e2e/press.spec.ts`, beside "a click on the resource bar lets the card being aimed go…": the end-turn button clicked while a card is aimed at a tile leaves the chronicle the rules' own end of turn makes of the one opened, the card unplayed; the line clicked lets the card go and leaves the chronicle as it was; on a chronicle opened on the settle phase, the chip clicked with the settle card being aimed lets it go and settles nothing, the dead end-turn button clicked does the same, and the chip clicked on a clean screen rings no tile.
5. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/press.spec.ts`.
- CI's, on the push: `e2e/refuse.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/settle.spec.ts`, `e2e/pin.spec.ts`, `e2e/inspect.spec.ts`, `e2e/map.spec.ts`, `e2e/yields.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/menu.spec.ts`, `e2e/browse.spec.ts`, `e2e/heal.spec.ts`, `e2e/farm.spec.ts`, `e2e/trapping.spec.ts`, `e2e/worker-instants.spec.ts`, `e2e/hover.spec.ts`, `e2e/pointer-sweep.spec.ts`.
