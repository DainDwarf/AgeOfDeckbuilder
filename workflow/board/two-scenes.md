# The map and the UI are two scenes

**Line:** The map and the UI are two scenes — the `map` scene holds the map's Layer and the one camera that pans and zooms, the `ui` scene the UI's Layer, its fixed camera and the chronicle screen's orchestration; the cross-ignoring cameras and the two-camera design space go, each scene homing what it draws onto its one Layer; the `ui` scene stops a press and a wheel notch that land on a widget of its own, and a move only while no button is held, so a pan or a carry begun on the map runs on across its widgets; a new chronicle restarts overlay, map and ui in that order; the e2e harness reads a named object under the camera of the scene that holds it and the map's frame off the `map` scene; `docs/PHASER.md` records the withheld move; `e2e/map.spec.ts`, `e2e/press.spec.ts`, `e2e/hover.spec.ts`, `e2e/refuse.spec.ts`, `e2e/inspect.spec.ts`, `e2e/menu.spec.ts`, `e2e/play-out.spec.ts` and `e2e/window.spec.ts` pass, the suite on the push. Doc-impact: `docs/PHASER.md`.

**Spec:** `workflow/BRANCH.md` _The design_: the tower table's `map` and `ui` rows, the _barriers_ paragraph as this intake edited it, _Restart_ and _The e2e harness_. `docs/INTERFACE.md` _What stands over what_ already reads true of the split and does not change. `docs/PHASER.md` _Input across scenes_ gains one entry, after the release entry, written out:

- "**A move stopped by a scene above is withheld from every scene beneath for that frame.** `stopPropagation` sets the manager's skip flag and the walk returns before the next scene's plugin updates (`src/input/InputManager.js:530-542`), so the lower scene's `pointermove` never fires: a press begun beneath and dragged across the object above loses its moves there and catches up on leaving. A scene that stands still over one that is dragged stops a move only while no button is held, which the pointer's `buttons` says (`src/input/Pointer.js:601`, `:645`)."

Player-facing sentences: none. Nothing the player meets changes but a stutter the screen never had.

**Doc-impact:** `docs/PHASER.md`.

**Scope:**

In:

- The `map` scene: a thin scene class in the overlay scene's shape, keyed `map`, holding one Layer named `map` on which it homes every object it is handed, as the design space's hook does today; its main camera is the map's, cut to the frame, zoomed and panned by the map view alone; it gives its scene the drag threshold and the text re-cut of the design-space hold but not its camera hold. Started ahead of the `ui` scene wherever a chronicle opens — the straight address in `src/main.ts`, the launch page's Launch — and restarted ahead of it by a new chronicle: overlay launched, map launched, ui restarted, in that order.
- The `ui` scene: the chronicle scene keyed `ui`, holding one Layer named `ui` on which it homes what it draws, its main camera held on the design space; it stops the pointer on its widgets with the move exception below; it hands the map scene to the map view, the infopanel, the map's tooltip and the map's refusal note, and its own scene to everything else. The menu reaches it by the `ui` key.
- The two-camera design space goes: the pairing function, its two-surface type, the cross-ignore and the hook that homed onto the UI's Layer are replaced by the one-Layer homing each scene does for itself. `Surface` stays what it is, a Layer and the camera that paints it. The launch page holds its one camera and nothing else.
- The barrier's move exception: the `ui` scene lets a move through while any button of the pointer is held; the menu and the overlay scenes go on stopping every move. How the one helper takes that difference is the implementer's.
- The covered signal, which the chronicle screen emits on its own input plugin, is emitted on the map scene's plugin too; every motion stopped at a new chronicle is stopped on both scenes; the map's refusal note is taken down by every press on the chronicle screen, the ones the `ui` scene stops included.
- The e2e harness: `named` and `counted` read every top-level child of every running scene under that scene's main camera, with no lookup by a Layer's name; `mapFrame` reads the `map` scene's main camera; every read of the scene keyed `chronicle` reads `ui`, in the harness and on the one line of `e2e/play-out.spec.ts` that names it.
- The `docs/PHASER.md` entry above.

Out:

- Strata as Layers and the depth table: the next line. Every depth call, every container, the one Layer per scene and its homing stay as they are.
- The clip camera and the browse: untouched, on the overlay scene.
- Any change to what the player meets.

Corner cases decided here:

- A pan, a unit carry or a population carry crossing the end-turn button, a mode chip, a pile's top or a lifted card keeps its moves, because a button is held and the `ui` scene lets the move through. It already stuttered across the Menu button; after this line the Menu button is the one place it still does, and that stays.
- A drag let go of as a scrim rises stays let go of: the scrim's rise releases the press through the let-go the drag line landed, so no button is held beneath the overlay or the menu, both stop every move as before, and nothing resolves under a window. The press spec's "a card dragged when the menu rises comes home" pins it and does not change.
- A hand card dragged across a standing infopanel: the move reaches the map while the button is held, so a row under the card hovers as it would under a bare pointer. Accepted: the pointer is over the row.
- The map's refusal note hears none of the presses the `ui` scene stops, since the walk never reaches the map scene for them; the chronicle screen takes it down on those presses itself, so a press anywhere on the chronicle screen still takes both notes down, as today. The UI's note already hears every press not stopped above the `ui` scene.
- The two tooltips keep their names, `tooltip-map` and `tooltip-ui`, which the map and hover specs read; the Layer each stands on keeps the name it has.
- The map scene's text re-cut subscribes to the window's resize in the map scene's own create, ahead of the map view's threshold repaint, so the repaint still runs after the re-cut on every resize.
- The play-out spec breaks the next motion of the `ui` scene alone; the map's motions now live on the map scene's tween manager and are not broken by it. The test asserts that the turn ends and the screen is painted whole, which a broken UI motion still exercises.

**Traps:**

- The withheld move is verified in the pinned package: `updateInputPlugins` returns at the first scene whose plugin set the skip flag (`src/input/InputManager.js:530-542`), so the lower scene's plugin is not updated at all for that event, and its `pointermove`, `pointerdown` and hovers are never processed for it.
- A scene's plugin emits `pointerdown` and `pointermove` only when the walk reaches it: anything on the map scene that listens for "any press" or "any move" on its own plugin hears none of the events the `ui` scene stops. The map's refusal note hides on its scene's `pointerdown`; the map view's pan and carry read its scene's `pointermove` and `pointerup`; the release is never stopped, so the map's release handling stands.
- The covered and uncovered signals are events on one scene's input plugin, and `onHover` subscribes on the hovered object's own scene: the infopanel's row hovers will live on the map scene and hear nothing emitted on the `ui` scene's plugin.
- `dragDistanceThreshold` is per input plugin and the map view's `dragged` reads its own scene's; the design-space hold sets it on the scene it is given, but its camera part would fight the map view's `place`, which is the one place the map's camera is written.
- The design-space hold re-cuts every Text of the scene it is given on resize, recursing into Layers and containers; the map view's threshold repaint relies on subscribing after it, and says so in a comment.
- Scene-plugin calls are queued in order, a `launch` of a running scene stops it first, and a scene with nothing to load creates synchronously inside its start (`docs/PHASER.md` _Scenes and stacking_): the `ui` scene's create may reach into the map scene's fields only because the map's start is queued ahead of it. Render order is add order, so the map scene is added after `launch` and before `ui` in `src/main.ts`; start order matters for keys alone, and the map's and the UI's keys are disjoint and neither stops a key, so only "both after the overlay" matters, which the queue order gives.
- A scene that outlives a restarted one holds stale handles: the menu reaches the `ui` scene by key at the moment of the press, and so must anything the map scene keeps of the `ui` scene, if it keeps anything at all.
- The chronicle screen's restart stops every tween of its scene before restarting, because the shutdown that follows destroys tweens in silence and a promise waiting on one waits for ever; the map's tweens now live on the map scene and are destroyed by its restart the same silent way.
- Phaser hit-tests an object only under a camera whose viewport holds the pointer: the map scene's objects are reached inside the map's frame alone, the `ui` scene's anywhere on the canvas.
- The game-emitter listeners run in subscription order: the overlay's mouse-key taker subscribes at the overlay's create and the map view's key reader at the `ui` scene's create, so the overlay still takes a notch ahead of the map; a reader moved into the map scene's own create would still come after the overlay's, since the overlay starts first.
- The harness's `openOnCapstone` waits on the scene keyed `chronicle` being active; `chronicleOf`, `playing`, `playedOut`, `stoppedTurn`, `dragUnit`, `settle` and `claimFree` read it too; `mapFrame` reads a camera named `map` off it. All of them read `ui` or `map` after this line.
- The `docs/PHASER.md` entry cites file and line in the pinned package; the ship re-reads each citation before writing it.

**Plan:**

1. `src/ui/design-space.ts` and a new map scene module: the one-Layer homing a scene does for itself, the non-camera half of the hold, the barrier helper with the move exception, and the map scene class; the pairing function and its type go. `src/main.ts` adds the scene between the launch page and the `ui` scene and starts it ahead of `ui`; `src/ui/launch-page.ts` holds its one camera and launches the map ahead of `ui`. `npm run check` passes.
2. `src/ui/chronicle-scene.ts` keyed `ui`: it homes onto its Layer, holds its camera, stops the pointer, hands the map scene to the four map-side factories, emits the covered signal and stops motion on both scenes, restarts all three, and takes the map's note down on its own presses; `src/ui/menu-scene.ts` reaches `ui`. `npm run check` passes and the app opens a chronicle from the launch page, from a straight address, and from New chronicle.
3. `e2e/chronicle-screen.ts` and `e2e/play-out.spec.ts`: the harness reads every child under its scene's main camera, the frame off the `map` scene, the screen by `ui`. The named specs pass.
4. `docs/PHASER.md`: the entry above; the branch line deleted.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/map.spec.ts
npx playwright test e2e/press.spec.ts
npx playwright test e2e/hover.spec.ts
npx playwright test e2e/refuse.spec.ts
npx playwright test e2e/inspect.spec.ts
npx playwright test e2e/menu.spec.ts
npx playwright test e2e/play-out.spec.ts
npx playwright test e2e/window.spec.ts
```

The rest of the suite runs on the push. Then the visual check on the running app: the map pans and zooms under the resource bar and the band with nothing of it painted over either; a tooltip on the map and one on the UI each stand over what raised them; the infopanel stands beside its tile and pans with it; a refusal note stands over a tile and one over a hand card; a pan dragged across the end-turn button runs on without a jump; the menu opens over a chronicle and New chronicle opens a fresh one with nothing left of the old.
