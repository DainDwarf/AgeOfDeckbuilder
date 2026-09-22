# Drags run on under the Menu button

**Line:** Drags run on under the Menu button — a pan or a carried object dragged across the Menu button keeps its moves, the menu scene withholding a move from the scenes beneath only while no button is held unless a window of it stands; `workflow/BRANCH.md`'s design says so and `e2e/menu.spec.ts` asserts a pan dragged onto the button brings the map the full travel and opens no menu. Doc-impact: none.

**Spec:** `workflow/BRANCH.md`, _The design_, the paragraph opening **The barriers are the scene order for the pointer and the start order for the keys.** Its clause "and a scrim rising lets go of the press it stood over, so nothing is ever held beneath the overlay or the menu and both stop every move" becomes, verbatim:

> and a scrim rising lets go of the press it stood over, so nothing is ever held beneath the overlay or a window of the menu: the overlay stops every move, and so does the menu while a window stands, its button alone standing stopping a move only while no button is held

The rest of the sentence, "and a press let go of over a higher scene still ends where it began…", stays as it is. No `docs/` page changes: `docs/INTERFACE.md` says nothing of drags across widgets, and `docs/PHASER.md` already states that a scene standing still over one that is dragged stops a move only while no button is held. No player-facing sentence is foreseen.

**Doc-impact:** none — the interface page states what stands over what and not that a drag runs on beneath it, and the Phaser page's rule is already the one the code takes.

**Scope:**

- In: the menu scene's move rule, which now depends on whether a window of it stands; the design clause above; one spec.
- In: the pan and the carried object alike, since both are one mechanism, the withheld move. One spec on the pan proves it; no spec on a carried unit.
- Out: the overlay scene, which keeps stopping every move — nothing is held beneath its scrim, and a press begun on the scrim and dragged must raise no hover beneath it. Out: the console, which takes no pointer. Out: any change to the UI scene's rule, which is already "no button held".
- Corner, decided: a press begun on the Menu button itself and dragged off it lets its moves through to the screen beneath. Nothing there took the press, so nothing pans and nothing is carried, but hovers rise on the map's tiles and the UI's widgets under the dragged pointer, as they already do for a press begun on the end-turn button and dragged across the map. Accepted as the same behaviour; the button is not special-cased.
- Corner, decided: a drag released over the Menu button ends where it began, the release never being stopped, and the button's click needs the press it never saw, so the menu does not open. The spec asserts the second half.
- Corner, unchanged: a move with no button held onto the Menu button is still withheld from the scenes beneath, which is what takes the end-turn button's hover down; `e2e/hover.spec.ts` already asserts it and must still pass.

**Traps:**

- `docs/PHASER.md`, _Input across scenes_: a move stopped above is withheld from every scene beneath for that frame; one stop per scene, never per object; a release is never stopped. _The pointer's readings_: Phaser re-checks what is under the pointer only on a move, so the withheld move is announced to the scenes beneath by the stopper itself.
- The menu scene's stopper is built once at `create`, before any window stands, and the window comes and goes; the rule it answers at each move has to read whether a window stands at that move, not at creation. The overlay and the UI scene keep a fixed rule.
- Measured on the current code at a 1280 by 720 viewport: a pan of 80 units straight up onto the button brings the map 56, stopping where the pointer enters the button's 32-unit-tall face; on the switched rule, 80. With ten Playwright steps over 80 units, three land on the button. A spec asserting `toBeCloseTo(travel, 0)` tells the two apart with room to spare.
- The map's scene hears `pointermove` with nothing under the pointer (`node_modules/phaser/src/input/InputPlugin.js:1584-1587`), so the pan runs on above the map's frame, across the bar's strip the button stands in; the press itself has to land inside the frame, on the catcher.
- `e2e/map.spec.ts` holds a local `drag` helper; a second spec wanting it moves it to `e2e/chronicle-screen.ts`, and then `e2e/map.spec.ts` is run too.
- The `named-spec` hook refuses a Playwright run naming no spec.

**Plan:**

1. `workflow/BRANCH.md`: the design clause replaced as the Spec writes it. Leaves the design stating the rule the code is about to take.
2. `src/ui/menu-scene.ts`, and `src/ui/design-space.ts` where the stopper's rule has to be answered per move: the menu scene withholds a move while a window stands, and only while no button is held otherwise; the overlay and the UI scene unchanged. Leaves the pan and the carry running on across the button.
3. `e2e/menu.spec.ts`: one test — the chronicle opened, a press on bare map straight below the Menu button and inside the map's frame, dragged in steps onto the button's centre, the map read before the release, then released; the map came the full travel and no menu stands. Leaves the line asserted.

**Verify:** `npm run check`, `npm run lint`, `npx playwright test e2e/menu.spec.ts`, `npx playwright test e2e/hover.spec.ts`; and `npx playwright test e2e/map.spec.ts` if its drag helper moved.
