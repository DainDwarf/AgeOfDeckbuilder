# The console is a scene

**Line:** The console is a scene — the debug console runs on a scene of its own, started first at boot and standing over every other scene on every screen; while it stands every key pressed is its and no scene under it hears one, the launch page's seed digits and Enter included; a chronicle opening closes it, clears its lines and puts both veils back; `docs/INTERFACE.md` says so; the e2e harness finds a named object on any running scene; `e2e/console.spec.ts` and `e2e/boot.spec.ts` pass. Doc-impact: `docs/INTERFACE.md`.

**Spec:** [`BRANCH.md`](../BRANCH.md) _The design_: the tower's `console` row, _The barriers_ paragraph, _Restart_ and _The e2e harness_. `docs/INTERFACE.md` _The debug console_ and _What stands over what_. The two sentences of _The debug console_ that change, written out:

- Replace "The **debug console** is a dark panel down the top of the screen, with the last lines run above the line being typed." with: "The **debug console** is a dark panel down the top of the screen, on every screen, the launch page among them, with the last lines run above the line being typed."
- Replace "The console binds no key of the player's and stands in no Controls window, and a new chronicle raises it with every entry back where it began." with: "The console binds no key of the player's and stands in no Controls window, and a new chronicle closes it and puts every entry back where it began."

No player-facing text entry changes: the console's lines, answers and the `no such entry` answer read as today.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

In:

- A `console` scene, added to the game and started at boot ahead of every other scene, never stopped and never restarted, rendered above every other scene. Its display list holds the console's root container, named `console` as today, with the same children by the same names, on the scene's own display list, no Layer and no depth. `DEPTH.console` leaves `src/ui/depths.ts`; the console no longer touches `DEPTH`.
- The console scene's one camera laid out as the chronicle's UI camera is: zoomed to the render factor, centred on the design's middle, its texts re-resolved on every change of window. The panel is laid out in design units exactly as today, `LINES_TOP` under the resource bar's strip included.
- Every key read through the scene's keyboard plugin. The console's handler: the console key toggles the panel and is taken whether the panel stands or not; while the panel stands every other key press is taken; a taken key has the event's `stopPropagation` and `preventDefault` called, so no scene that started later hears it and the browser does nothing with it; a key pressed with Ctrl, Meta or Alt held is never taken, as today. A key not taken is left alone. Releases are never taken: a key held when the console opened is still let go of beneath it.
- The launch page's Enter, digits and Backspace read the same way, through its scene's keyboard plugin, each taken key stopped and prevented, chords never taken. `readsKeyboard` in `src/ui/keys.ts` goes: the console and the launch page were its two users.
- A chronicle opening, the chronicle scene created, a restart included, closes the console, clears the lines it ran and puts both veils back on; the chronicle screen draws under the veils the console holds, and hears every switch the console throws while it stands. The console keeps no reference to a chronicle scene's objects past that scene's shutdown.
- The trap comment in `src/main.ts`, where the scenes are added and started: the render order is the add order, bottom first; the key order is the start order, first started first heard, a restarted scene going to the back; the two run opposite ways, so the console is added to render on top and started to hear first.
- `e2e/chronicle-screen.ts`: `window.named` answers the named object on whichever running scene holds it, walking every running scene's display list, Layers and containers alike, and the camera that paints it: the camera named after the Layer the object stands in where the scene has one, the scene's main camera otherwise. `window.counted` counts across every running scene the same way. No spec changes.
- `docs/INTERFACE.md`, the two sentences above, verbatim.

Out:

- The menu, the overlay, the map and the UI: every other row of the tower is its own line. The chronicle scene keeps its two Layers, its two cameras and the depth table for everything but the console.
- The wheel and the mouse's spare buttons: `readMouseKeys` stays as it is, on the game's emitter.
- Any change to what the console's entries do or answer.
- How the overlay's window will stop a key ahead of the `ui` scene it restarts with: that line's intake settles it.

Corner cases decided here:

- The console open on the launch page when Launch is pressed with the pointer: the chronicle opens and the console closes with the reset.
- The console open when the menu's New chronicle is pressed: the same.
- The console key pressed while a slot of the Controls window listens: the console hears first and toggles; the slot never hears it, as the interface page promises.
- Escape while the console stands closes the console and reaches nothing under it; the back key it may be bound to is not pressed.
- Two keys landing inside one frame: Phaser hands the first to every plugin again on the second's arrival unless a handler stopped it, so a key the console takes is heard once; a key it lets through is the scene beneath's, as today.

**Traps:**

- **Keys are heard in start order, not scene order.** Phaser's keyboard manager pushes the DOM event on a queue and emits `MANAGER_PROCESS` synchronously from inside the DOM handler; every running scene's keyboard plugin listens on that one emitter, in the order it subscribed, which is the order the scenes started (`KeyboardPlugin.js:220`, `KeyboardManager.js:194`). A restarted scene resubscribes at the back. `stopPropagation` on the event sets `cancelled = -1`, which every later plugin skips.
- **At boot, start order is add order.** `game.scene.start` before boot only marks the scene to auto-start, and `bootQueue` starts the pending scenes in the order they were added. The add order is also the render order, bottom first. So the console added first starts first and renders at the bottom, and needs bringing to the top after; or every scene is added unstarted and started in the order wanted once the game is booted. Either way the comment in `src/main.ts` says why. `bringToTop` called while the scene manager is processing is queued to the next step, which is fine.
- **`preventDefault` works from inside a plugin handler** because the dispatch is synchronous from the DOM handler; the chronicle's `onKeyDown` in `src/ui/keys.ts` already relies on it. The keyboard manager drops an event already `defaultPrevented` before queueing it, so nothing upstream of Phaser may prevent a key any more, or no scene hears it.
- **The queue is cleared at the frame's end**, not after each dispatch: a raw `keydown` is emitted again to every plugin when a second key lands in the same frame, unless a handler stopped it. The console stopping every key it takes is what keeps typed text single.
- **The pointer falls through the console scene** because it holds no interactive object (`globalTopOnly`, the default, stops at the first scene where the pointer was over one). Nothing on the console scene may be made interactive.
- **The console outlives the chronicle scene.** A callback or object of the chronicle scene held by the console goes stale at the restart; a listener on the game's emitter dies with the scene through `whileUp`, a value handed at every create does not go stale.
- **A scene's camera paints the backing store at 1:1 until zoomed.** `applyDesignSpace` zooms the UI camera to `renderFactor()` and centres it on `DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2` on every resize, and re-resolves every Text the scene holds; the console scene needs the same for its one camera or the panel draws small in a corner.
- **The chronicle scene still has two cameras named after its two Layers** until the map and UI line lands; the harness reads the camera by the Layer's name there and the main camera on a scene with no such Layer.
- **`e2e/console.spec.ts` reads the console's shape**: the container named `console`, its Text children read in order as the lines, `console-input` and `console-line-<n>` by name, `reading-food` on the chronicle scene for the bar's bottom, and `shows` reading the container's `visible`.
- **Layers and containers both carry `list`**, and the harness's `within` already recurses into either; only its starting set changes.
- The hook flags a comment block longer than three lines under `src/` or `e2e/`; the trap comment in `src/main.ts` is cut to its trap.

**Plan:**

1. `src/main.ts`: the `console` scene added and started ahead of every other, rendered on top, with the trap comment. Leaves standing: an empty console scene running on every screen; every spec as before.
2. `src/ui/debug-console.ts`: the console as that scene's contents, on its own display list, its camera laid out like the UI's, keys through the scene's keyboard plugin, taken keys stopped and prevented. The camera layout shared with `applyDesignSpace` in `src/ui/design-space.ts`, which keeps doing it for the chronicle's UI camera. `src/ui/depths.ts` loses its `console` row. Leaves standing: the console opens and closes on its key, types, runs lines, on every screen; the chronicle does not yet hear its veils.
3. `src/ui/chronicle-scene.ts`: the console's veils reach the map view, and a chronicle opening resets the console. Leaves standing: `e2e/console.spec.ts` green but for the harness.
4. `src/ui/launch-page.ts`: its keys through the scene's keyboard plugin; `readsKeyboard` deleted from `src/ui/keys.ts`. Leaves standing: the launch page types nothing while the console stands; `e2e/boot.spec.ts` green.
5. `e2e/chronicle-screen.ts`: `named` and `counted` across every running scene. Leaves standing: every spec finds what it names.
6. `docs/INTERFACE.md`: the two sentences. `workflow/BRANCH.md`: the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/console.spec.ts`, `npx playwright test e2e/boot.spec.ts`, and, the harness being a path every spec walks, `npx playwright test e2e/menu.spec.ts` and `npx playwright test e2e/map.spec.ts` for a camera on each surface; the whole suite on the push.
