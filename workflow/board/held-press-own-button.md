# A held press is let go by its own button alone

**Line:** **A held press is let go by its own button alone** — on every screen a press held stands through the other button's release, on the canvas and off it, and is let go by its own button's release, by a scrim rising and by the window losing focus: a unit, a population, a card of the hand or of a deck being dragged, the map, the tree or a panel being dragged, and a click held on a thing; one place under `src/ui/` hears a release off the canvas; `e2e/press.spec.ts` is green. Doc-impact: none — `docs/INTERFACE.md` says it.

**Spec:** `docs/INTERFACE.md` _The presses_: "A press is held by the button that landed it, and that button's release alone lets it go; a second button pressed meanwhile is a click of its own, answered at its own release on the thing under the pointer, and the hold stands through it, a scrim that click raises excepted." The same page, _What stands over what_: "A press the pointer holds as a scrim rises is let go of where it stands, whatever raised the scrim". [`../BRANCH.md`](../BRANCH.md), _The design_, the paragraph on a held press. No sentence is added or changed on a page, and no player-facing entry.

**Doc-impact:** none — the page says it. `docs/PHASER.md` takes an entry only if the work meets a Phaser fact neither it nor the bundled pages say.

**Scope:**

In:

- A button let go off the canvas lets go of the press that button holds and of no other: with the left button holding a unit, a population, a card of the hand, a card of a deck, the map, the tree or a panel, or a click on a thing, the right button let go outside the game window changes nothing, and the hold goes on until the left button comes up.
- The same with the buttons the other way round, and for a mouse button bound like a key: its release off the canvas lets nothing go.
- A panel being dragged stands through a second button's click on the canvas: it follows the pointer on until the button dragging it comes up, and runs on from there as it does.
- A scrim rising and the window losing focus let go of every press held, as today.
- The chronicle screen's door forgets, at a release off the canvas, the landing of the button let go and keeps the other's.

Out: what a second button's click does on the canvas, which stands; what a press let go off the canvas by its own button does, which stands — the thing dragged comes home, nothing plays, a browse stays open, a panel stands without running on; the slide home, the branch's last line; touch.

Corner cases, decided:

- A second button pressed on the canvas and let go off it is no click: it lands on nothing, and the hold stands.
- A second button pressed and let go off the canvas, which the game never saw pressed, changes nothing.
- With both buttons held off the canvas, each release lets go of its own press.
- A right click on a card of a panel being dragged shows the card large, and the scrim it raises lets the drag go, as the page says of a scrim that click raises.
- Where the ship finds a panel's drag already standing through a second button's click, the report says so as a deviation and that part of the line is dropped.

Reconcile: seven places hear a release off the canvas today, each letting go of what it holds whichever button came up — a click held on a thing, the map's press, the hand's card, the carried card of a deck, a panel's drag, the tree's drag, the chronicle screen's landings; they become one place that says which button holds no more, and the let-go a scrim and a lost focus force goes through it.

**Traps:**

- The forced let-go fakes a release off the canvas with the left button whichever button holds, and no button held after it (`letGoOfPress`, `src/ui/design-space.ts`): it works because no taker reads a button there, which is the defect's other face. A pointer's `buttons` says which buttons still hold (`docs/PHASER.md`, _The pointer's readings_; `HOLDS` in `src/ui/design-space.ts`).
- Phaser reads a `mouseup` on the window whose target is not the canvas as a release off the canvas, whether or not it saw that button pressed (`docs/PHASER.md`, _The pointer's readings_).
- Phaser ends its own drag at any button's release, on the canvas and off it, and sends no `drag` after (`docs/PHASER.md`, _The pointer's readings_): the hand carries its card on by itself from there and the carrier of a deck's card reads the scene's own moves, while a panel's scroll is let go in its zone's `dragend` (`src/ui/panel.ts`).
- The takers: `onClick` in `src/ui/design-space.ts`; the map's press in `src/ui/map.ts`; the hand's drag in `src/ui/hand.ts`, whose `dragend` also reads where the release landed; the carrier and the panel's zone in `src/ui/panel.ts`; the tree's drag in `src/ui/tree.ts`; the landings in `src/ui/chronicle-scene.ts`.
- `e2e/press.spec.ts` holds the tests of a press let go off the canvas by its own button, of a release the blur swallowed, of a card dragged as the menu rises and of a browse released off the canvas: each proves a let-go that stands, and stays green untouched.
- A spec opens on the game's content: a panel of the collection screen is dragged only where it holds more than its room, and a search that finds no such panel is a finding the report carries, that part then proven by no spec.
- Comments are for traps only; the pages hold the why.

**Plan:**

1. `src/ui/design-space.ts` and the takers above: one place hears a release off the canvas and the forced let-go, and each taker asks it whether its own button still holds. Leaves `pointerupoutside` named in one file under `src/ui/`, and every let-go of today by a press's own button, a scrim or a lost focus as it is.
2. `src/ui/panel.ts`: a panel's drag stands through a second button's click.
3. `e2e/press.spec.ts`, beside "a hand card released off the canvas comes home…": a unit dragged, the right button pressed and let go off the canvas, the left let go on a tile it lights, steps there; a card of the hand dragged, the right button let go off the canvas, the left let go clear of the hand, is played as the rules play it; a click held on the end-turn button, the right button let go off the canvas, the left let go on the button, ends the turn. In the spec that holds the collection screen's panels, where a panel overflows: a panel dragged, a right click beside its cards, goes on following the pointer.
4. `workflow/BRANCH.md`: this line deleted; this file deleted.

**Verify:**

- `npm run fmt`, `npm run check`, `npm test`, `npm run lint`.
- The proof, `npx playwright test e2e/press.spec.ts`.
- CI's, on the push: `e2e/map.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/collection.spec.ts`, `e2e/civilization-mode.spec.ts`, `e2e/tree.spec.ts`, `e2e/browse.spec.ts`, `e2e/menu.spec.ts`, `e2e/hover.spec.ts`, `e2e/inspect.spec.ts`, `e2e/controls.spec.ts`, `e2e/refused-save.spec.ts`.
