# Phaser's traps are written down

**Line:** Phaser's traps are written down — `docs/PHASER.md` stands, reached from `docs/index.md`, every entry citing its source in the pinned package; `DOGMAS.md` _Stack_ says a Phaser claim is read from the package before it is asserted; the implementer's and the reviewer's charters and the intake and ship skills name the page for a line touching `src/ui/`, `src/main.ts` or `e2e/`; `npm run lint` passes. Doc-impact: `docs/PHASER.md`, `docs/index.md`, `DOGMAS.md`.

**Spec:** the page is the deliverable, so its whole text is written out here. The ship verifies every citation against the pinned package and corrects a line number; a fact the source contradicts is a deviation, never a silent rewrite. The other edits, each written out, follow the page.

`docs/PHASER.md`, verbatim, every paragraph and bullet one line:

> # Phaser
>
> Phaser 4.2.1, pinned in `package.json`. The framework's own pages, `node_modules/phaser/skills/`, one per topic, say what Phaser 4 is and what changed from Phaser 3; they are read before anything is assumed about it, and this page states only what they do not say: what Phaser does across scenes, across a restart, at render under WebGL and under a Playwright spec. Every entry states the fact and, where a natural reading or Phaser 3 says otherwise, what is not so, and cites its source in the package, a file and line under `node_modules/phaser/`. A bump of the pin re-reads every citation.
>
> ## Input across scenes
>
> - **The pointer walks the scene list from the top and, by default, stops at the first scene with an interactive object under it, the release included.** `globalTopOnly` is true by default and the input manager returns at that scene for a press, a move, a wheel and a release alike (`src/input/InputManager.js:225`, `:538`). The game turns it off, and the walk then goes on down until a scene calls its input plugin's `stopPropagation` (`src/input/InputPlugin.js:2826`). A scene above does not catch only what it handles.
> - **A release is never stopped.** A drag begun on a lower scene and let go of over a higher scene's object never reaches the lower scene's drag end while the release is stopped above it: no `dragend` fires and the dragged object follows the pointer until the next click.
> - **One stop per scene, never per object.** Inside a scene `topOnly` is on, so only the topmost object under the pointer receives the event, and a stop written on one object's handler is skipped whenever another object lies over it. A scene stops the walk from its input plugin's `gameobjectdown`, `gameobjectmove` and `gameobjectwheel`, which fire for the hit object with the event to stop.
> - **The pointer falls through a scene holding no interactive object.**
> - **A key is heard by each scene's keyboard plugin in the order the scenes started, a restarted scene last.** The plugin subscribes its update to the input manager's process event at start and unsubscribes at shutdown (`src/input/keyboard/KeyboardPlugin.js:220`, `:885`), and the keyboard manager emits that event synchronously from the DOM handler (`src/input/keyboard/KeyboardManager.js:196`), so the handlers run in subscription order. Not the scene list's order and not its reverse: the reverse loop in `SceneManager.update` drives each scene's `step`, not input, and Phaser's own comment on the stop, "further down the Scene list" (`KeyboardPlugin.js:763`), misleads.
> - **A key event's `stopPropagation` is Phaser's, not the DOM's.** The plugin replaces the event's `stopPropagation` with one that marks it cancelled for every plugin after it, and its `stopImmediatePropagation` with one that stops the same plugin's key objects alone (`KeyboardPlugin.js:754-766`). `preventDefault` is the DOM's and works from inside a handler, the dispatch being synchronous.
> - **A key whose default is already prevented never reaches Phaser.** The keyboard manager drops it before queueing (`KeyboardManager.js:188`), so nothing upstream of Phaser prevents a key, or no scene hears it. The mouse manager does the same for a button and for the wheel (`src/input/mouse/MouseManager.js:369-457`), which is how a press prevented on the way down is taken off the canvas.
> - **The keyboard queue is cleared at the frame's end, not after each dispatch**: a second key in the same frame runs the first through every plugin again, and only a stop keeps it from being answered twice.
> - **The game's emitter has no stopping and no start order.** `game.events` runs its listeners in subscription order, and a press emitted there by a window-level reader reaches every scene; a scene that takes one marks the object, and that mark is the only barrier (`src/ui/keys.ts`).
>
> ## The pointer's readings
>
> - **Phaser re-checks what the pointer is over only when the pointer moves** (`pollRate` is −1, `src/input/InputPlugin.js:207`), and its per-pointer over list keeps an object through everything but a move off it. So no `pointerout` comes when a scene or a scrim rises under a resting pointer, when the pointer leaves the canvas, which the scene's plugin hears as `gameout`, or on `disableInteractive`, which leaves the object's cursor standing too; and no `pointerover` comes when an object turns interactive under a resting pointer or the pointer returns onto it from off the canvas. A surface that covers another takes its hovers and tooltips down itself.
> - **`input.isOver` follows the canvas's `mouseover` and `mouseout` alone** (`src/input/InputManager.js:339`, `:356`); a `gameout` emitted on a scene's plugin does not flip it.
> - **`pointerup` reaches whatever lies under the pointer, however far it travelled since the press.** A bare `pointerup` is not a click, and it fires on an object a drag from elsewhere ended over.
> - **`downX` and `downY` are recorded for the primary button alone**, and `dragDistanceThreshold` is measured between raw pointer positions in device pixels, not design units.
> - **A release off the canvas is known by `pointer.upElement`, never by a coordinate**: a pointer reads a camera only while it is over one, so `worldX` and `worldY` freeze where it went out. A window that loses focus mid-press gets no `mouseup` at all and the drag stays in flight; Phaser reads a window `mouseup` whose target is not the canvas as a release off the canvas (`MouseManager.js:405`), which is how a lost release is ended by hand.
>
> ## Scenes and stacking
>
> - **The stacking tool is the scene and the Layer inside it, not the camera.** A scene has its own display list, camera and input plugin and renders in scene-list order; a Layer is one display list inside a scene; a camera answers where a display list is viewed from and nothing about what stands over what.
> - **Render order is add order, bottom first; key order is start order.** A `start` before boot only marks a scene to start, and the boot then starts every pending scene in add order, so neither the config's array nor a start before boot expresses a tower started from the top: it is added bottom up and started top down on `Phaser.Core.Events.READY`.
> - **Every scene-plugin call is queued, in order.** `launch`, `restart` and `stop` all go through `queueOp` (`src/scene/ScenePlugin.js:216-239`, `:485`, `:669`); `SceneManager.start` on a scene that is running, paused or sleeping shuts it down first (`src/scene/SceneManager.js:1230`); and a scene with nothing to load runs `create` synchronously inside its start (`:1270`). A `launch` then a `restart` from one scene therefore lands as start the launched, stop the caller, start the caller.
> - **`scene.restart()` keeps the instance and its fields**, and a restart with no data keeps the data of the last start.
> - **Cameras paint in creation order, each over everything the ones before it drew, whatever any depth says.** A depth number orders objects within one display list only, and equal depths draw in the order added; a table of depths across two lists is true only by the accident of which list paints last.
> - **Every camera draws the whole scene, and an ignore is never lifted.** Objects are assigned to cameras by ignore lists, so an nth camera is an nth list, and an object added while a list stands is drawn by every camera not told to ignore it. An object on the scene's own display list carries no camera filter, and a Layer re-announces an object on `ADDED_TO_SCENE`.
> - **A scene's camera paints the backing store one to one until zoomed**: a new scene draws its contents small in a corner until its camera is laid out on the design space as the others' are.
> - **A camera moved takes its zoom and scroll at render**, so an object can stand before its place on the page does.
>
> ## Rendering under WebGL
>
> - **There is no geometry mask under WebGL.** `GeometryMask` is Canvas-only (`types/phaser.d.ts:10585`), `BitmapMask` is gone, and masking is a Filter on an object's or a camera's filter list, `filters.internal.addMask` or `filters.external.addMask` (`phaser.d.ts:12169`); the game boots `Phaser.AUTO`, WebGL in Chromium. `preFX` and `postFX` are gone with it: a filter is a member of the internal or the external list of any game object or camera (`skills/filters-and-postfx/SKILL.md`).
> - **A rotated Text tears in a multi-texture batch** (phaserjs/phaser#7372, open): the shader picks a batch's sampler by exact float equality on an interpolated varying, and a rotated quad loses fragments. `maxTextures: 1` in `src/main.ts` works around it. It shows only under SwiftShader, the headless Chromium the e2e suite, the ui-check agent and CI run on, and never on a GPU. The Text documentation's warning against many Text objects is not this and was never the cause.
> - **A stroked Polygon skips a point whose origin-shifted position lands on the raw point before it** (phaserjs/phaser#7361, open), which a centred diamond always has once, so it comes out open; a Rectangle turned 45° is the only diamond that outlines whole.
> - **`killTweensOf` destroys a tween where it stands**, listeners removed, nothing emitted; `TWEEN_COMPLETE` and `TWEEN_STOP` are the only ends a tween announces, so a promise waiting on a killed tween waits for ever, and a scene's shutdown destroys its tweens the same silent way.
> - **A Text's `wordWrap.callback` runs inside `updateText` after the font is synced**, so the object's own context measures in the right font; the constructor calls `setText` before `setPadding`, so the callback runs twice per construction and has to be pure; a `wordWrap.width` set beside it makes `basicWordWrap` rejoin the lines on single spaces; and `GetTextSize` ceils each line's width and centres on the ceiled width.
> - **The rest of what changed from Phaser 3** is the migration guide's, `skills/v3-to-v4-migration/SKILL.md`: `roundPixels` off by default, textures Y-up, the Canvas renderer deprecated, a dynamic texture rendered on demand, tint modes, `Vector2` for `Point`, native `Set` and `Map`, render nodes for pipelines.
>
> ## Across a restart
>
> - **A listener left on an emitter outlives the scene across a restart** unless taken off at the scene's `SHUTDOWN`; `whileUp` in `src/ui/design-space.ts` is the one door a factory subscribes through.
> - **A scene that outlives a restarted one holds stale handles of it.** A callback or an object taken at create points at the old instance's fields after the restart; a long-lived scene takes a value, or reaches the other scene through the scene manager by key at the moment of the press.
> - **The scale manager refits the canvas, not the backing store**, and a scene's `scale.width`, `scale.height` and a pointer's `x`, `y` are in backing-store device pixels, not design units; the game keeps the backing store at the canvas's on-screen size in device pixels, which `Scale.FIT` fits by the same rule.
>
> ## Under a Playwright spec
>
> - **Playwright cannot see paint order.** A spec reading the scene graph sees an object that exists, is visible and stands at the right place, and passes green while another camera paints over it. Whether one thing stands over another is answered only by a pixel sampled at the overlap off a screenshot: the WebGL canvas will not hand back its own pixels.
> - **A position is read after a drawn frame.** A camera takes its zoom and scroll at render, so a spec rests two animation frames after a load, a scene start or a camera move before it measures or presses; `networkidle` means only that the module graph loaded, and a screenshot before Phaser's first frame is an empty canvas.
> - **Screen coordinates convert through the canvas's client rect**, a camera's viewport being in backing-store pixels while the canvas is drawn scaled down; at a viewport of 1280 by 720 alone is a mouse coordinate the design coordinate one to one.
> - **A mouse move to the coordinates the pointer already rests on is no move Phaser sees**, and neither is one jump from the bare page onto an object Phaser still counts as under the pointer.
> - **The game is read through `window.game`.** Importing the entry module from inside the page evaluates it a second time under Vite's module URL and boots a second game.
> - **A named object is found by walking every running scene**, recursing into Layers and Containers, both carrying `list`, and read under the camera of the scene that holds it.

`docs/index.md`, one bullet after `GLOSSARY.md`'s:

> - [`PHASER.md`](PHASER.md) — the platform: what Phaser 4.2.1 does across scenes, across a restart, at render under WebGL and under a Playwright spec that its bundled pages do not say, each fact with its source in the pinned package.

`DOGMAS.md` _Stack_, one bullet after "Every dependency is pinned exactly":

> - **A Phaser claim is read from the pinned package before it is asserted.** The bundled pages, `node_modules/phaser/skills/`, say what Phaser 4 is; `docs/PHASER.md` says what they do not, the mechanisms across scenes and the misreadings they invite; the source, `node_modules/phaser/src`, settles the rest, cited by file and line. Why: memory of Phaser is Phaser 3's, and a confident wrong claim about it has reached a review verdict.

`CLAUDE.md` _Environment_, one bullet after "Node 24 and npm are on PATH":

> - Phaser is read, never remembered: the bundled pages in `node_modules/phaser/skills/`, and `docs/PHASER.md` for what they omit.

`.claude/agents/implementer.md`, one paragraph after "Read `DOGMAS.md` before touching anything. It is the rulebook; the reviewer after you checks against it.":

> A diff touching `src/ui/`, `src/main.ts` or `e2e/` starts with `docs/PHASER.md`. A Phaser behaviour it relies on that the page does not state is read in `node_modules/phaser/skills/` or `node_modules/phaser/src` before it is relied on, and the report cites the file and line.

`.claude/agents/egress-reviewer.md`, one sentence appended to the paragraph ending "read the sections the diff touches.":

> A diff touching `src/ui/`, `src/main.ts` or `e2e/` is read against `docs/PHASER.md` too, and a finding that rests on a claim about Phaser cites `node_modules/phaser/src` by file and line, never memory.

`.claude/skills/intake/SKILL.md` §1 _Read_, the first sentence extended:

> The line; the design pages, `docs/GLOSSARY.md` and `DOGMAS.md` where they touch it; the code it lands in, enough to know what it changes; for a line landing in `src/ui/`, `src/main.ts` or `e2e/`, `docs/PHASER.md`, which the dossier's Traps cite rather than restate.

`.claude/skills/ship/SKILL.md` §2 _Implement_, one bullet after "the doc-impact list;":

> - `docs/PHASER.md`, named as the page to read first, when the line touches `src/ui/`, `src/main.ts` or `e2e/`;

**Doc-impact:** `docs/PHASER.md` (new), `docs/index.md`, `DOGMAS.md`.

**Scope:**

In:

- The page, the index pointer, the dogma, the `CLAUDE.md` pointer, the two charter sentences, the two skill sentences, all verbatim above.
- Every citation on the page opened in the pinned package and its line number corrected where the grep that produced it drifted. A citation the source does not bear out is a deviation in the report with the file read, never a sentence rewritten or dropped. An entry that carries no citation is one the ship adds a citation to where the source states it plainly, and leaves bare where the fact is a behaviour read off the running game rather than a line of source.
- `workflow/BRANCH.md`: the line deleted; `workflow/board/phaser-traps.md` deleted.

Out:

- No code change. A comment in `src/` or `e2e/` stating a fact the page now holds stays as it is; shrinking one to a pointer is a shave the user may order at the hand-back, never part of this line.
- The `ui-check` agent's charter keeps its renderer section; the `visual-check` and `upkeep` skills are not edited.
- `workflow/BRANCH.md` _The design_ keeps its mechanism sentences until the merge's Prep commit; only the line goes.
- Copying a bundled page into the repository: `node_modules` is not tracked, the pin keeps its paths stable, and a copy would drift from the pin.
- Traps a reader of one file already sees in that file's own comment: the polygon's origin convention, the text inset, the resize re-entry, the camera manager's resize. They stay local.

Corner cases decided here:

- The page cites paths under `node_modules/phaser/`, which git ignores. That is intended: the pin makes them stable, and a bump re-reads them by the page's own header.
- The page names Phaser's word "scene" and the code's names; it is a domain page, not a design page, so the interface page's "surface" does not govern it, and the glossary lint scopes `src/ui/text.ts` and `CHANGELOG.md` alone.
- The page cites project files (`src/ui/keys.ts`, `src/main.ts`, `src/ui/design-space.ts`) by path and never by line.

**Traps:**

- **The citations came from a grep of 4.2.1 on 2026-09-22, not from a reading of each site.** The lines confirmed at intake: `KeyboardPlugin.js:220`, `:754-766`, `:885`; `KeyboardManager.js:188`, `:196`; `MouseManager.js:369-457`, `:405`; `InputManager.js:225`, `:339`, `:356`, `:538`; `InputPlugin.js:207`, `:2826`; `ScenePlugin.js:216-239`, `:485`, `:669`; `SceneManager.js:1230`, `:1270`; `phaser.d.ts:10585`, `:12169`. Every one is still opened at the ship; the entries with no citation are read against `KeyboardManager.postUpdate` and `KeyboardPlugin.update` for the queue, `SceneManager.bootQueue` for the pre-boot start, `Cameras/2D/CameraManager.js` for the paint order, `Tweens/TweenManager.js` for `killTweensOf`, and `GameObjects/Text/Text.js` with `GetTextSize.js` for the wrap.
- **A domain page's altitude is the platform's, not the game's.** No entry names a piece of content, a card, a window or a screen; "a scrim", "a tooltip", "a drag" are the platform's shapes and stay.
- **`DOGMAS.md` _Docs_: a paragraph is one line.** Prettier refuses a hard-wrapped page, and nests a line beginning with a literal `>` one level per run; the page's text above is quoted in this dossier and is written to `docs/PHASER.md` unquoted.
- **`docs/index.md` says a page earns existence only when its summary line is much shorter than what it holds**; the pointer written above is that line and is not to grow.
- **The upkeep skill's docs lint checks a domain claim by its named source**; the citations are what it will open, so a citation of a bundled page names the file, and a citation of source names file and line.
- **The intake skill's §1 edit is a sentence in a skill Claude runs**: skills state their rules plainly, no justifying, no reference to another skill.
- **The long-comment hook does not fire on `docs/`**; nothing here triggers it, and no comment is touched.
- **The four-spec budget is untouched**: this line runs no spec and no typecheck; `npm run lint` alone.
- After the commit, the ship session and not the implementer cuts from the project memory's `project-status.md` the three facts the page now holds: the clip camera painting over the depth table, Playwright's blindness to paint order, and the reviewer's wrong key-order claim with its refutation. The memory lint holds nothing the repository holds.

**Plan:**

1. `docs/PHASER.md` written from the text above, every citation opened and its line corrected, the deviations noted. Leaves standing: the page, reached by nothing yet.
2. `docs/index.md`, `DOGMAS.md`, `CLAUDE.md`: the three sentences. Leaves standing: the page reached from the map, the rule in the dogmas, the pointer at the session's entry.
3. `.claude/agents/implementer.md`, `.claude/agents/egress-reviewer.md`, `.claude/skills/intake/SKILL.md`, `.claude/skills/ship/SKILL.md`: the four sentences. Leaves standing: every agent and loop that touches the UI or the harness told where to read.
4. `workflow/BRANCH.md`: the line deleted; `workflow/board/phaser-traps.md` deleted.
5. After the commit, the ship session cuts the three memory facts.

**Verify:** `npm run fmt`, then `npm run lint`. No spec, no typecheck: the diff holds no code. The reviewer reads the page against the citations it opens itself.
