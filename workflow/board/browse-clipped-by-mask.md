# The browse is clipped by a mask

**Line:** the grid's container takes a Mask filter with a frame-sized rectangle as its source, the tearing workaround moves from the renderer's texture cap to the batch's parallel texture units, and the clip camera, its ignore lists and the refusal note's `raised` callback go.

**Spec:** [`workflow/BRANCH.md`](../BRANCH.md) → _The design_, the paragraph "The browse's grid is clipped by a Mask filter": external context, the source a rectangle the size of the frame, nothing outside the container touched, so nothing is ever excluded; the clip camera and its ignore lists go. `docs/PHASER.md` → _Rendering under WebGL_ changes as follows.

The entry **A rotated Text tears in a multi-texture batch** keeps its first sentence and its last two; its second sentence, "`maxTextures: 1` in `src/main.ts` works around it.", becomes:

> The batch's parallel texture units set to one at boot, `renderNodes.setMaxParallelTextureUnits(1)` in `src/main.ts`, work around it: the batch shader is then built for one sampler and compares nothing (`src/renderer/webgl/renderNodes/RenderNodeManager.js:424-428`, `src/renderer/webgl/renderNodes/BatchHandlerQuad.js:223-265`). Not the game config's `maxTextures`, which caps how many units the renderer binds for any draw, a filter's included.

A new entry follows **There is no geometry mask under WebGL**:

> - **A filter's second texture binds only under the renderer's `maxTextures`.** `bindUnits` binds at most that many units (`src/renderer/webgl/wrappers/WebGLTextureUnitsWrapper.js:146-156`) and the Mask filter puts its mask on unit 1 (`src/renderer/webgl/renderNodes/filters/FilterMask.js:69`), so with the cap at one the mask sampler reads an unbound unit, opaque everywhere: nothing is clipped, and inverted, everything is. The cap stays at Phaser's default; the batch's own count is the knob the tearing needs. A mask's source game object is drawn to a dynamic texture each frame through the view camera (`src/filters/Mask.js:208-244`), so a rectangle in design units lands where that camera puts it; it is never added to a display list, or it paints, and the controller's destroy takes the dynamic texture and not the source.

No player-facing sentence: the line changes what is drawn, not what is said.

**Doc-impact:** `docs/PHASER.md`.

**Scope:**

- In: the game config's `maxTextures: 1` goes, and its trap comment with it; at `READY`, ahead of the scenes starting, the renderer's render nodes take one parallel texture unit, with the trap comment moved there. The grid container `layGrid` lays out takes a Mask filter on its external list, its source a white rectangle at the frame's place and size in design units, constructed and never added to any display list, destroyed with the grid at the wipe. `createClip`, the `Clip` type and the `objectsIn` walker go from `design-space.ts`; the `clip` in `overlay.ts`, its `show`, `hide` and `exclude` calls, and the last sentence of `layGrid`'s docblock go; the refusal note's `raised` option and its `told` call go, so `createRefusalNote` takes the scene and the stratum alone.
- Out: any change to the interface page; any change to the browse's behaviour, its scroll, its fling, its presses; the small cards and the tooltip on the overlay, which the card references line brings. The stale-clip tax is gone with the clip, and nothing replaces it.
- Every window on the grid — the browse, the aim window, the deal window and the capstone's window — goes through `layGrid`, so all four are clipped alike, by the same filter, with no per-window code.
- Corner cases decided: the view camera is the carried stratum's camera, passed explicitly; leaving it unset, so the filter takes the camera rendering at the moment, was measured to draw the same, and the explicit one is kept for the reader. The mask's `autoUpdate` stays on: the rectangle is one quad a frame while a window stands, and with it off nothing resizes or redraws the mask texture after a window resize, so the stencil would stand where the old window put it.

**Traps:**

- The two knobs are separate and read alike: the game config's `maxTextures` is the renderer's cap on units bound per draw, and it is what stopped the mask; the render node manager's `maxParallelTextureUnits` is what the batch shader is built for, clamped under the cap. The tearing needs only the second (`docs/PHASER.md`, both entries above). A `maxTextures` of two would also let the mask bind, and would bring two-texture batches, and the tearing, back.
- `renderNodes` stands on the WebGL renderer alone; the game boots `Phaser.AUTO`, which is WebGL everywhere it runs. The `READY` hook in `src/main.ts` already exists and is where the setting goes, before the scenes start. A batch node is built lazily and takes the manager's count on construction, and one already built re-reads it on the manager's event, so the order between the setting and the first frame does not matter.
- `scene.add.rectangle` adds the rectangle to the display list, where it paints a white block over the frame; the source is built with the class constructor and left off every list. The e2e harness's `named` walks display lists only, so the source is invisible to it, which is right.
- A game object's destroy destroys its filter camera, which destroys its filter lists, which destroys the Mask controller and its dynamic texture; the source rectangle is not in that chain and is destroyed at the wipe by the code that made it.
- The external list, not the internal: the stencil is in screen space, fixed while the container scrolls under it. At the design's own size the two coincide, which is why an internal mask measured the same in the spike; at any other zoom the internal one would move with the container.
- Measured under headless Chromium at device pixel ratios 1 and 1.5: the grid clipped exactly at the frame's top and bottom edges after a scroll, the renderer at sixteen units, the batch at one, the browse spec green. The tearing itself could not be made to show in any frame today, with either cap; the claim that it stays fixed rests on the batch shader being the one the current cap produces.
- `docs/PHASER.md` cites files and lines under `node_modules/phaser/`; the citations above were read on 4.2.1, the pinned version.
- A hook flags a comment block over three lines under `src/` or `e2e/`; the trap comment on the setting says what the knob is and what the other knob is not, in two lines.

**Plan:**

1. `src/main.ts`: the config's cap and its comment go; the render nodes take one parallel texture unit at `READY`, with the trap comment. `docs/PHASER.md`: the tearing entry's second sentence replaced. Leaves standing: the game as it is, drawn by the same one-texture batch shader, the renderer free to bind a filter's second texture.
2. `src/ui/overlay.ts`, `layGrid`: the grid container takes the Mask filter with the rectangle source and the stratum's camera in place of `clip.show`; the source is destroyed at the wipe. Leaves standing: the grid clipped by the mask while the clip camera still runs beside it, ignoring what it always ignored.
3. `src/ui/design-space.ts`: `Clip`, `createClip` and `objectsIn` go. `src/ui/overlay.ts`: the `clip`, its `hide` and `exclude`, and the docblock's last sentence go. `src/ui/refusal-note.ts`: the `raised` option goes. `docs/PHASER.md`: the new entry. Leaves standing: the overlay's one camera painting everything on the scene, nothing excluded anywhere, and the tree the line's done-condition describes.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- `npx playwright test e2e/browse.spec.ts`, and the specs that walk the other windows on the grid: `npx playwright test e2e/deal.spec.ts` and `npx playwright test e2e/capstone.spec.ts`.
- A `visual-check` pass at device pixel ratios 1 and 1.5: a browse of the tall deck scrolled part of a row, the grid cut clean at the frame's top edge under the title and at its bottom edge above the margin, nothing of it outside the frame, the title and the scrim whole; the fanned five-card hand at rest and with one card hovered, every letter whole.
