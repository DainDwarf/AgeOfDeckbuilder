# The aim's note lets the aim through

**Line:** The aim's note lets the aim through — the line naming what a card is aimed at is see-through: a left click on it lands on the tile under it, as on a refusal's note.

**Spec:** [`docs/INTERFACE.md`](../../docs/INTERFACE.md) _The presses_, the paragraph beginning "A press lands on the thing the pointer is on". Its sentence "A tooltip, a refusal's note and the frame a mode draws around the map are see-through: the pointer is on what stands under them." becomes "A tooltip, a refusal's note, the line naming what a card is aimed at and the frame a mode draws around the map are see-through: the pointer is on what stands under them." No other page changes: [`docs/CHRONICLE-SCREEN.md`](../../docs/CHRONICLE-SCREEN.md) _The hand and the aim_ says what the line reads and where it stands, and says nothing of a press, so the interface page's rule covers it. No player-facing text changes.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:** In: the line naming the aim stops no press and no hover, so a left click on it is the act attempted on the tile under it where the aim admits that tile, and lets the card go and selects that tile where it does not, as the interface page says of a left click while a card is being aimed; the right click through it inspects the tile under it; the hand cursor and a tooltip's hover reach the tile under it. Out, decided at intake and standing as they are: the shown event's strip, which reads as part of the end-turn button and keeps stopping a press; the settle phase's chip and the city mode's chip, buttons dead or live, which keep stopping one; the pinned achievement, whose names answer presses, which keeps stopping one; the aim window's title, which stands on a scrim. The reconcile found the standing see-through thing, the refusal's note: a container of a bubble and its labels with no interactive object in it, which is what makes it see-through. The line goes through that same mechanism as it is, by holding no interactive object either; nothing new is made.

**Traps:**

- The line is a container of a slab, a label and a stop zone, and the zone alone is interactive: a Graphics and a Text answer no hit test unless made interactive, so the zone going is the whole change on the screen, and the two-line comment over it goes with it.
- The line stands on the UI scene, the tiles on the map scene under it. The UI scene stops a press only where it lands on an interactive object of that scene, and the pointer falls through a scene holding no interactive object under it (`docs/PHASER.md`, _The pointer_), so with the zone gone the press and the hover reach the map scene's tile. The hover follows the hit test the same way: the hand cursor is read each frame off the topmost interactive object across the scenes (`docs/PHASER.md`).
- `e2e/press.spec.ts` holds one test that asserts the old decision, "a click on the line naming the aim lets the card go and reaches no tile under it"; it is rewritten, not deleted, since the behaviour it promised is overturned by this line and the new promise takes its place. The helper `carriedUnder` in that spec carries a tile under the middle of a named object, and `click` presses that middle; both stand. `aimLine` in `e2e/chronicle-screen.ts` reads the container's Text and does not touch the zone.
- Whether the city's own tile, which the standing test carries under the line, is a tile the card's aim admits is the rules' to say: the spec's oracle for where the card plays is read through the rules on the fixture chronicle, never assumed, and a tile the aim admits is the one carried under the line.
- The comments "Interactive, so no press reaches the map under it, and never marked as answering one" in `src/ui/shown-event.ts` and `src/ui/pinned-achievement.ts` state the standing decision for those two things and stay.

**Plan:**

1. `docs/INTERFACE.md`: the sentence above changed; the page says the line is see-through.
2. `src/ui/aim-line.ts`: the stop zone and its comment gone; the container holds the slab and the label; the line is see-through on screen.
3. `e2e/press.spec.ts`: the test on the line rewritten to prove the new rule: a card being aimed, a tile its aim admits carried under the line, a click on the line, and the card played at that tile, read off the chronicle through the rules; the aim and the selection down after it. Its title says what it proves.
4. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/press.spec.ts`. CI proves on the push the specs that walk the aim and the pointer over the UI: `e2e/hand-aim.spec.ts`, `e2e/hover.spec.ts`, `e2e/pointer-sweep.spec.ts`, and the rest of the suite.
