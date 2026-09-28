# A plate's name is shown large

**Line:** A plate's name is shown large — a right click on a name in a plate's text, or on the small card it raised, shows the named thing large on the campaign screen, in the stack the chronicle screen's cards shown large stand in, on a scrim over the whole screen under which the two pan keys still move the tree; `docs/INTERFACE.md` says so, and `e2e/tree.spec.ts` proves the right click and the back key.

**Spec:** `docs/INTERFACE.md` → _The presses_, _A card's names and its label_ (the stack: twelve at most, a band up and to the left, only the newest card's names answer, the back key and a press beside take the newest down) and _What stands over what_ are the spec as they stand; the campaign screen follows them. Two edits, in `docs/INTERFACE.md` → _The tree_:

- In the plate paragraph, replace "A plate answers no press. A name in a plate's text stands in brackets, and the pointer resting on it raises its small card, as on a card." with: "A name in a plate's text stands in brackets and answers the rest and the right click as on a card, its small card raised and the named thing shown large; the rest of a plate answers no press."
- At the end of the paragraph that opens "The tree moves left and right and no other way", add: "A card shown large stands on a scrim over the whole screen, the navbar and the bar among it; under it the campaign screen hears the two keys that move the tree and no other."

No player-facing text: the stack draws the faces and infopanel cards it already draws.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: the stack of cards shown large, today the chronicle's overlay's alone, standing on the overlay scene for the campaign screen too, with every behaviour it has on the chronicle screen — the stack of twelve, a name on the newest card stacking, its small cards, the back key and a left or right press beside walking it down, the inspection key doing nothing while a card stands large. A right click on a plate's name, and on a small card raised off a plate's name (today that right click does nothing), shows the named thing large.
- The stack is centred on the whole design space as on the chronicle screen, not on the room; the scrim covers the navbar and the bar; the Menu button and a window of the menu stand over it, as everywhere.
- Under the scrim the tree's two pan keys still move it (the user's call, the chronicle screen's rule for the map); the menu still freezes it, as today. The scrim stops the pointer, so no drag starts under it; the wheel does nothing on the tree either way.
- The back key while a card stands large takes the newest down and never raises the menu; with nothing standing it raises the menu, as today.
- Out: the chronicle screen's behaviour — unchanged, the chronicle's overlay composing the same stack. The launch page shows no name and does not need the stack. The collection screen is its own rung.
- Corner: pan keys under the scrim are a rule no age's content reaches on screen today (the one-age tree stands whole and does not move), so it has no spec; it holds by the overlay taking only the keys it answers.

**Traps:**

- Key order is start order (`docs/PHASER.md` → _Input across scenes_, "A key is heard by each scene's keyboard plugin in the order the scenes started"; _Scenes and stacking_, "Every scene-plugin call is queued"). The campaign screen's `backRaisesMenu` reads the back key on its own keyboard plugin, so the overlay scene must start before the campaign screen at every door that opens it, or the back key raises the menu over a card shown large. The doors: the boot's first screen (`src/main.ts`), a navbar press from the launch page (`src/ui/navbar.ts`, a shared function the launch page also wears), and the chronicle leaving to the campaign (`src/ui/chronicle-scene.ts` `leave`, which today stops the overlay before starting the campaign). The launch page's `open` launches the overlay again ahead of the chronicle, which restarts it.
- A scene that outlives the one it serves holds stale handles of it (`docs/PHASER.md` → _Across a restart_): the overlay scene's one taker must never be a campaign screen that has gone down — whatever the overlay does across a screen change, a key on the launch page reaches nothing a dead scene built. `OverlayScene.create` already clears the taker on a restart.
- The overlay takes every key its taker answers and lets the rest through (`src/ui/overlay.ts` `takes`), which is how the pan keys reach the tree; the tree's `cover` is the menu's freeze and is not told of the scrim.
- A scrim rising takes down what stands under it and lets go of a press the pointer holds (`docs/INTERFACE.md` → _What stands over what_): the campaign screen answers the scrim's covering as it answers the menu's today (`src/ui/campaign-screen.ts`, `COVERED` and `letGoOfPress`), the two covers combined as the chronicle screen combines them; and the menu rising emits `COVERED` on the overlay scene too, as the chronicle screen does, so the stack's own small cards go down under it.
- The catalogue is an argument (`DOGMAS.md` → _Architecture_): the stack takes it as the chronicle's overlay does today.
- A spec rests before it presses (`DOGMAS.md` → _Testing_); the named-object walk covers every running scene, so `inspection` on the overlay scene is found as the chronicle's specs find it.

**Plan:**

1. The stack of cards shown large stands as a widget of its own on the overlay scene, and the chronicle's overlay composes it; the chronicle screen behaves as before.
2. The overlay scene is started ahead of the campaign screen at each of its doors, and leaves nothing of a gone campaign screen answering keys.
3. The campaign screen builds the stack; the tree's names and their small cards answer the right click through it; the campaign screen's covering hears both the scrim and the menu.
4. `docs/INTERFACE.md` carries the two edits above.
5. `e2e/tree.spec.ts` carries the proof test.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- Proof: `npx playwright test e2e/tree.spec.ts`, with a new test: on a new campaign, a right click on the name in the within-reach plate's goal shows that card large (the `inspection` object's `card` data is the named id, read through the run as the first test reads it); the back key takes it down, and no window of the menu stands; the pointer resting on the name raises its small card, and a right click on the small card shows the card large again. The page logs nothing.
- CI proves on the push: `e2e/browse.spec.ts`, `e2e/capstone.spec.ts`, `e2e/deal.spec.ts`, `e2e/hover.spec.ts`, `e2e/inspect.spec.ts`, `e2e/press.spec.ts`, `e2e/reference.spec.ts` (the stack moved), and `e2e/campaign.spec.ts`, `e2e/menu.spec.ts`, `e2e/continue.spec.ts`, `e2e/resume.spec.ts` (the doors that start the overlay).
