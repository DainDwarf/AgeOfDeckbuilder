# Quick wins on the boot

**Line:** Quick wins on the boot — the same e2e tests run about 3.5× slower on CI than on 2026-10-30, the boot-only test from 1.0 s to 3.6–5 s, as the look's paintings landed: measure where the boot goes under software drawing and take the cheap wins now, the deeper work left to the Deliverable rung. Done when every sheet the boot draws holds the same frames and the same pixels as at c76b0a07 (the baseline hashes in `.playwright/boot-probe/sheets-c76b0a07.txt`); each sheet is uploaded to the graphics card once, after it is painted; the loose files the sheets are drawn from are never made textures; the card fronts' recolouring reads each pack file's pixels once, not once per colour; and the boot's CPU profile under software drawing shows `drawSheets` at 2.5 s or less, against 3.5 s at c76b0a07, with no texture made for a loose file.

**Spec:**

- No design page states the boot's cost or how the sheets are made; what the player sees stays the same, pixel for pixel. Nothing on any page changes.
- No player-facing sentence.

**Doc-impact:** none in `docs/`, because the design holds no sentence about how the boot paints its sheets. `docs/PHASER.md` takes a trap line only if the fix leans on a Phaser behaviour the page does not state (for instance, that `textures.createCanvas` uploads its canvas at once, or that the loader makes every image it loads a texture), cited by file and line from `node_modules/phaser/src`.

**Scope:**

- In, the three wins measured at intake (2026-11-28, c76b0a07, headless Chromium drawing by software at 1280×720, CDP CPU profile, boot to the campaign screen 6.2 s, of which `drawSheets` 3.5 s):
  - a. **Each sheet painted, then uploaded once.** Today `drawSheet` (`src/ui/sheet.ts`) makes the sheet's canvas texture first, which uploads the blank canvas with its mipmaps. It then paints, and `refresh` uploads it again: 0.95 s of blank uploads under software drawing.
  - b. **The loose files never made textures.** Each file a sheet names is loaded through Phaser's loader, which makes it a texture of its own and uploads it: 0.5 s, plus 0.19 s of `createObjectURL`. The sheet copies it and `drawSheets` removes it. The files are read as pictures that are never uploaded. The SVG files a sheet rasterises keep their size, and the hashes prove the pixels.
  - c. **The card fronts' recolouring computed once per pack file.** `src/ui/card-frames.ts` reads every pixel's hue, saturation and lightness again for each colour a front is turned to. It also allocates a tuple per pixel on every conversion (`toHsl`, `fromHsl`, `hslAt`, `turned`, `bodyOf`, `meanOf`). That is 1.3 s inclusive under `paintChanged`, about 0.7 s of it waste by estimate (not measured). The recolouring's arithmetic stays as it is, so the pixels stay the same.
- These wins are temporary. The Deliverable rung re-measures the boot and may replace all three, for instance by baking the sheets into files. They are taken now because that rung is five rungs away.
- Out: the anisotropic filter stays as it is, at the user's word: turning it off under software drawing would have saved 10–15 ms a frame. Out: drawing the settle phase's and city mode's frames round the screen without their middle (up to −19 ms a frame, measured by hiding the frame), not taken in this line. Out: the art sheet's own paint (0.46 s), `aroundPicture`'s outlines (0.28 s), and the frame cost of the map and the hand.
- Out: changing which state the specs open on. The specs open on forged saves past the settle phase. About 20 tests of 419 stand on a chronicle still in its settle phase: they plant a `launchedAs` or launch through the launch screen. Those test the launch, the settle phase or the save's opening.
- The refusals stay: a file that did not load is refused where the sheet is drawn ("the texture … could not be loaded" today, in the refusal's own vocabulary), and so is a painting a sheet does not hold.
- Corner: the anisotropic filter is set on a sheet's texture once it is uploaded, and again once a lost context is restored (`filterAnisotropically`, `src/main.ts`). With one upload per sheet it must still come after that one upload.
- Reconcile: nothing found. No other place in the tree paints a canvas texture before its first upload or reads a file without making a texture.

**Traps:**

- `paintingsIn` (`src/ui/sheet.ts`) finds a painting of a sheet drawn earlier through the texture manager (`textures.get(from).getSourceImage()`). The features' and the art sheet's paintings are drawn from other sheets' paintings, which is why `LoadScene.preload` orders the sheets. If a sheet becomes a texture only after it is painted, the lookup still has to find the sheets painted before it, and their frames' cuts.
- `roomIn` lays out frames by reading the canvas texture's frame list (`getFrameNames`, `cutX`/`cutWidth`), and the frames' names and cuts are part of the baseline hash. A different packing order changes the hash.
- Mipmaps are made only for a power-of-two side and at every upload (`docs/PHASER.md`, the mipmap bullet). A sheet uploaded once must still be uploaded with its mipmaps.
- The baseline hashes come from a throwaway spec, `.playwright/boot-probe/zz-sheets.spec.ts`, copied into `e2e/` to run (`npx playwright test e2e/zz-sheets.spec.ts -x --workers=1`) and deleted afterwards. It writes `.playwright/boot-probe/sheets.txt`, one row per canvas texture of side 1024 or more: its frames' names and cuts, and its pixels as `getImageData` reads them, hashed in the page. Two runs at c76b0a07 gave the same rows. A function handed to `page.evaluate` that returns a Phaser object hangs it.
- The boot profile comes from `.playwright/boot-probe/zz-probe.spec.ts`, run the same way. It writes `boot-campaign.txt` (self and inclusive times by function), `.cpuprofile` files and `summary.txt` (boot wall times, four boots each). Wall times varied 6.1–7.3 s at intake, with the user's other game running, so the done-condition reads the profile's `drawSheets` and not the wall clock. Check free memory before reading a stall (`Win32_OperatingSystem.FreePhysicalMemory`).
- A throwaway spec in `e2e/` lands in no commit: delete it before staging, and check with `git status --short`.

**Plan:**

1. Record the profile at c76b0a07 with the probe, so the delivery has its own before. This leaves a before profile beside the intake's.
2. Upload each sheet once, after it is painted (`src/ui/sheet.ts`, `src/main.ts` where the boot's order needs it). The hashes match the baseline, and the profile loses the blank uploads.
3. Read the loose files without making them textures (`src/ui/sheet.ts`, the loader's use in `src/main.ts`). The hashes match, and the profile shows no texture for a loose file.
4. Compute the recolouring once per pack file and cut the per-pixel allocations (`src/ui/card-frames.ts`, and `src/ui/chrome-kit.ts` only if it shares the conversions). The hashes match, and `drawSheets` is at 2.5 s or less.
5. Profile again. The boot's wall times and `drawSheets` before and after go in the commit message.

**Verify:**

- `npm run check`, `npm run lint`, `npm test`.
- The hash probe after the change: `.playwright/boot-probe/sheets.txt` equals `.playwright/boot-probe/sheets-c76b0a07.txt` row for row.
- The boot probe, before and after: `drawSheets` inclusive at 2.5 s or less, and no texture made for a loose file.
- The proof spec: `npx playwright test e2e/boot.spec.ts -x`, where the boot stands, its fonts load and it logs nothing.
- CI proves on the push: every spec, since each one boots. At the hand-back, compare the boot-only tests' times on CI (`boot.spec.ts`, 4.6 s and 5.0 s on run 46068564193) and the shards' durations against that run.
