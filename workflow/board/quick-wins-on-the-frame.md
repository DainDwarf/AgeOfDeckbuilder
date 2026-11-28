# Quick wins on the frame

**Line:** Quick wins on the frame — under software drawing, the chronicle screen's frame on a settled save is 77 ms against a blank screen's 17. Two parts of it cost for pixels nobody sees: the border's band, a canvas over the whole disc that is almost all see-through, takes 12 ms; the pinned achievements rows' mask takes 9 ms though the rows fit their frame. Draw the band only where it paints, and keep a panel's mask only while it clips something. Done when the shots of the states listed under Verify come out pixel for pixel as before the change, and the frame on the turn-1 settled save of seed 1 is measured at least 12 ms below the before, both measured in the delivery session.

**Spec:**

- No design page states how the border's band, the reach, the claim marks or a panel's cut are drawn, only what they look like. What the player sees stays the same, pixel for pixel, and nothing on any design page changes.
- `docs/PHASER.md` _Filters and masks_ takes one bullet stating the measured cost, since the next session would otherwise re-try the knobs that did nothing: "**A mask costs a pass over the whole screen while it stands, whatever it clips.** A Container's filters render to a framebuffer the size of its camera, a Container having no size or origin to focus on (`src/gameobjects/components/Filters.js:271-281`, `:482-491`). Under software drawing the pinned achievements' rows' mask cost 9 ms a frame at 1280×720, and neither `focusFiltersOverride` nor the mask's `autoUpdate` off recovered any of it. A panel holds its mask only while something stands past its frame." The implementer checks the line numbers against the pinned package and fixes them if they moved.
- No player-facing sentence.

**Doc-impact:** `docs/PHASER.md` takes the bullet above, and a second one only if cropping an Image leans on a Phaser behaviour the page does not state.

**Scope:**

- In, e. **The border's band drawn only where it paints.** `discCanvas` (`src/ui/map-border.ts`) lays one canvas at a pixel to the unit over the whole disc, 1024×1024 on the Nomadic disc. The image draws the whole of it every frame, though the band covers a few tiles. The image is cut to the box round what was last painted, the band's fade included, and is redrawn uncut nowhere. Hiding the band's image saved 12 ms of 77; that the see-through area is what costs is inferred, and the delivery measures it.
- Reconcile, taken at intake: the reach and the claim marks are the same canvas over the disc, made by the same `discCanvas`. All three get the cut through that one door, so a fourth canvas over the disc gets it too. The reach shows while a unit is selected and the claim marks in city mode. Their gain was not measured; the delivery reports it.
- In, f. **A panel's mask only while it clips something.** `createPanel` (`src/ui/panel.ts`) masks every panel at its frame, whatever stands in it: the pinned achievements, the log, the browse, the capstone's window and the collection screen's panels. Removing the pinned rows' mask saved 9 ms of 77. The rule is in the player's terms: where the mask would clip nothing on screen it is off, and the screen shows the same pixels in every state.
- Corner of f, decided here: the mask is needed whenever anything the panel holds stands past its frame, not only when the panel scrolls (its `overflow` above zero). Examples are a card grown under the pointer at a panel's edge, a lifted card leaving it, or a row sliding in. The implementer reads the code for every way a panel's contents reach past its frame. If one cannot be told cheaply, the mask stays on for that panel, and the report says which.
- Out: the uncharted disc's dark hexes (18 ms), the resource bar (9 ms), the hand (7 ms) and the deal window with its scrim (19 ms while a deal waits). They are real content, and making them cheaper means drawing them another way. Out: the anisotropic filter, at the user's word. Out: the settle phase's and city mode's frames round the screen (19 ms, only on the ~20 specs on a settle phase and city mode's), not taken.
- These wins are temporary in the same sense as the boot's: the Motion rung and the Deliverable rung measure the frame again.

**Traps:**

- The measurements are local, under Playwright's headless Chromium drawing by software (SwiftShader), as CI draws, at the suite's 1280×720. On your graphics card the frame is capped at 16.7 ms and none of this shows. The game's own code is ~5% of the frame, so the CPU profile tells nothing here: measure the frame interval (the mean gap between `requestAnimationFrame` calls over 2–3 s) with the part shown and hidden.
- The intake's probes are in `.playwright/boot-probe/`: `zz-probe5.spec.ts` (a forged save opened with `openSaved(page, settledOn(1))`, every scene and layer hidden in turn) and `zz-probe6.spec.ts` (the band's image, the void hexes and the pinned rows' mask, each measured alone). Copy one into `e2e/` to run it, one spec named and `-x`, and delete it before staging. A function handed to `page.evaluate` that returns a Phaser object (`setVisible`, `sys.setVisible`) hangs it: wrap the call in a block.
- A resumed chronicle opens under the capstone's window, which adds ~20 ms. `openSaved` closes it; a `page.reload()` raises it again.
- Free memory matters: the user keeps a ~21 GB game running. Read `Win32_OperatingSystem.FreePhysicalMemory` before reading a slow frame as a finding, and take the before and after in one session, back to back.
- The band's canvas is repainted only when what it is drawn from changes (`drawnFrom`). The cut must follow every repaint, and the band's fade reaches past the tiles' edges.
- A mask's source is drawn through the view camera, and a filter camera takes the scroll and zoom of the camera drawing its object (`filtersFollow`, `src/ui/design-space.ts`; `docs/PHASER.md` _Filters and masks_). A mask turned off and on again must come back where the panel is cut.

**Plan:**

1. Shoot the states under Verify, and measure the turn-1 frame with the band's image and the pinned rows' mask each present and removed, on the code before the change. This leaves the before shots and numbers.
2. Cut the disc canvases' image to what was painted (`src/ui/map-border.ts`). The shots of the border, the reach and the claim marks match, and the frame drops.
3. Turn a panel's mask off while it clips nothing (`src/ui/panel.ts`, and wherever a panel's contents are known to move past its frame). The panel shots match, the hovered card at a panel's edge included, and the frame drops.
4. Add the `docs/PHASER.md` bullet, then measure again; the before and after numbers go in the commit message.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- Shots before and after, compared pixel for pixel by a throwaway spec in `e2e/`, deleted before staging. At 1280×720 under software drawing:
  - the turn-1 settled save of seed 1, its border standing;
  - a unit selected, its reach lit;
  - city mode with its claim marks;
  - the pinned achievements with rows fitting, then with enough pinned to scroll, scrolled part way;
  - the log open, fitting and scrolled;
  - a browse scrolled part way;
  - a collection-screen panel with a card under the pointer at its edge.
- The frame: the turn-1 settled save, mean frame at least 12 ms below the before.
- The proof spec: `npx playwright test e2e/pin.spec.ts -x` walks the pinned achievements' panel.
- CI proves on the push: every spec, and `log.spec.ts`, `browse.spec.ts`, `collection.spec.ts`, `map.spec.ts` and `city-mode.spec.ts` walk the changed paths most. At the hand-back, compare the shards' durations against the run before the push.
