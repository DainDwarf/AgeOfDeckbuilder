# The kit's pieces squeezed as they are drawn, and the buttons' strip

**Line:** **The kit's pieces squeezed as they are drawn, and the buttons' strip** — every piece of the chrome is drawn off the kit's own file, the sheet they stand in read through the card's anisotropic filter where the browser has one, no frame of the sheet squeezed once as it is made and none cut to a slab; every button of the kit stands in its three looks with the shaded strip across its foot lifted; the fold's width test and its reading are gone; `docs/LOOK.md`, `docs/PHASER.md` and `public/assets/LICENSES.md` say so. Doc-impact: `docs/LOOK.md`, `docs/PHASER.md`.

**Spec:**

- `docs/LOOK.md` → _The chrome_ → the paragraph **A button**, one sentence added at its end: "The kit paints a shaded strip across a button's foot, and the game lifts it: a button's face runs in one tone down to its lip, in each of its looks and on the gold a waiting reading stands on."
- `docs/PHASER.md` → _Textures_ → the entry **A NineSlice whose middle is squeezed along one axis more than its corners are…** keeps its first three sentences, and its last sentence ("The game squeezes such a piece once into a frame of its sheet, or cuts a flat middle down to a slab every draw stretches (`src/ui/chrome-kit.ts`).") is replaced by: "The game asks the card for its anisotropic filter on the sheet its nine-slices draw from, `EXT_texture_filter_anisotropic` at the most the card gives, set on the sheet's texture once it is uploaded and again once a lost context is restored (the Phaser lines that re-make the texture, cited), so a squeezed pixel is read through several taps along the squeeze at the level of the weaker one; a browser without the extension draws the smear." The file named is the one the setting lands in.
- `docs/PHASER.md` → _Textures_, a new entry after it: "**A canvas squeeze along one axis is read through mipmaps where the card draws the canvas.** `drawImage` narrowing an image sideways alone at `imageSmoothingQuality` `high` comes out blurred up and down on a 2D canvas the card draws, and nearly exact on one drawn by software. A frame the game makes off a painting copies its pixels or computes them, and never scales it along one axis by `drawImage`."
- `docs/PHASER.md` → _Textures_, a new entry after that one: "**Playwright's headless Chromium draws by software**, ANGLE over SwiftShader, where a texture's filtering and a canvas's scaling can come out unlike a card's. A look that turns on either is shot on the card too: the launch arguments `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist` run headless on it, and `WEBGL_debug_renderer_info` names the renderer that drew."
- `public/assets/LICENSES.md` → _UIForge metal kit_ → its **What** bullet, one sentence added: "The game lifts the shaded strip across the foot of the kit's buttons as it draws them, the files unchanged."
- No player-facing sentence.

**Doc-impact:** `docs/LOOK.md`, `docs/PHASER.md`.

**Scope:**

In:

- The filter. The chrome's sheet asks the card for anisotropic filtering at the card's most (16 on both renderers measured), always, with no setting in the Graphics window. A browser without the extension gets no filter and draws the pieces off the files all the same, smear included: that is accepted, and no frame is kept for it.
- The fold's made frames go, all of them: each button look's `#square`, the tab's and the counter chip's `#slab`, and what makes them. A button on a square box, a well, a count chip and a pile's round draw off the kit's file like any other piece.
- The strip lifted, on every button of the kit: the gold and the bright silver, each in its normal, hover and pressed look, wherever one is drawn — End turn live and dead, the Menu button, the standing Icons button, a window's buttons, the ending screen's, and the gold a waiting reading stands on in city mode. No frame of the sheet holds a button with its strip. The store's files are untouched; the lift is made as the sheet is drawn.
- The lift's rule, the one the user picked on the page (treatment "the strip lifted", strip strength 0%, line softness 0%, sign size 60%, sign lift 0%, on every button), in the 2x files' pixels:
  - Gold (`btn_cta_*`, 600 × 184): the face's last row is 127, the strip is rows 128 to 166, row 167 is the lip's own edge and is left alone.
  - Bright silver (`btn_primary_*`, 440 × 128): the face's last row is 86, row 87 is the line falling, the strip is rows 88 to 110, row 111 is the lip's own edge and is left alone.
  - For each column and each colour channel, the ratio is the face's last row over the strip's first row, held between 1 and 2; every row of the strip in that column is multiplied by it. On the row where the line falls the ratio is the face's last row over that row itself.
  - On each row the lift reaches only inside the piece's opaque span, 4 pixels in from each end, fading in over 2, so the outline and the shadow keep their values.
  - The three looks share these rows.
- The fold's width test goes ("End turn, its chip, the Menu button and the Icons button, sunk and standing, draw no middle narrower than their kit's frame holds it…" in `e2e/buttons.spec.ts`) with the `middles` reading it alone asks. Pieces are squeezed as they are drawn again, by design, and the user has agreed the test goes. No pixel test replaces it: the look is proven by the look check under **Verify**.

Out:

- The panel, the window's gold band, the inactive tab and the counter chip keep their paintings; the band carries no strip and darkens smoothly to its dark line.
- The signs keep their size and their place.
- No other sheet asks for the filter.
- The kit's own icon buttons and its disabled looks are not in the store and stay out.

Reconcile, each taken as it stands:

1. The gold under a waiting reading is the button's gold and loses its strip with it.
2. The window's gold band stays as it is.
3. Wells, count chips and pile rounds are untouched in look; only the frame they draw from changes.
4. Hover and pressed looks are lifted alike.
5. A dead End turn on the settle phase wears the same gold, lifted.
6. The licence record gets its sentence.

**Traps:**

- The fold failed on the card and passed everywhere else. Its square frames were squeezed by a canvas `drawImage` at `imageSmoothingQuality` `high`; on the user's card (GeForce RTX 3080 Ti, ANGLE D3D11) that squeeze is read through mipmaps and the smear is baked into the frame, while Playwright's software renderer bakes it nearly exact. A shot from a plain Playwright run proves nothing about this line's look on the card.
- The lift is computed on pixels read and written (`getImageData`, `putImageData`) or copied unscaled; nothing in it scales by `drawImage`.
- The filter was set in the probes like this, and held across frames on both renderers: the extension from `gl.getExtension('EXT_texture_filter_anisotropic')`, the texture at `game.textures.get('chrome').source[0].glTexture.webGLTexture`, the texture bound, `gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, n)`, and the binding found before put back. Phaser keeps its own record of what is bound on each unit: the setting leaves that record true, through Phaser's own binding or by restoring what it found. Read how Phaser re-makes a texture on a restored context before choosing where the setting is made again, and cite the lines in `docs/PHASER.md`.
- `getExtension` answers null on a browser without the filter; that state is real and takes no fallback frame.
- A nine-slice is laid at the size its box asks whatever its frame holds (`lay` in `src/ui/chrome.ts`), so a piece off the file is squeezed by the draw. The squeezes measured: the silver square's middle 9.7 times, the gold square's 6.5, a count chip's about 12, the sunk Icons well's about 9, all under 16. A pile's round has no middle at all.
- The sheet's row and column gaps stay.
- `e2e/chronicle-screen.ts` tells a piece by its frame's name: `pieceWornOf` reads `BUTTONS[…].looks`, `.squares` and `TAB.frame`. Seven specs go through it or its neighbours: `buttons`, `chrome`, `city-mode`, `icons`, `map`, `piles`, `settle`.
- The frame's cost, measured at rest on the chronicle screen, one step drawn and flushed: on the card about 4 ms with the filter off and on, at 1280 and at 1920; on the software renderer 52 ms off and 61 ms on at 1280, 63 ms and 72 ms at 1920. CI draws by software, so its frames on this screen grow by about a seventh. A spec that times out on CI after this ship is reported with that number beside it, never re-budgeted in silence.
- The references the user judged on: the repair, <https://claude.ai/artifact/QC2MZrxb5HtyLSHXPqAtvn>; the strip, <https://claude.ai/artifact/SvutEvegcwo37sDCjXk1Yo>, whose page computes the lift by the rule above.

**Plan:**

1. `src/ui/sheet.ts`, and `src/main.ts` if the setting is made there: a sheet can ask for the filter, and the chrome's does. Leaves every piece drawn as today, the sheet filtered.
2. `src/ui/chrome-kit.ts`, `src/ui/chrome.ts`: the made squares and slabs and what makes them are gone; every piece draws off its kit's file. Leaves the squeeze repaired with the strip still painted.
3. `src/ui/chrome-kit.ts`: the six button looks stand in the sheet with their strip lifted, by the rule in **Scope**. Leaves no button with a strip.
4. `e2e/buttons.spec.ts`, `e2e/chronicle-screen.ts`: the width test and the `middles` reading are gone, and the piece a frame names is read off the frames as they now stand.
5. `docs/LOOK.md`, `docs/PHASER.md`, `public/assets/LICENSES.md`: the sentences in **Spec**.
6. The look check and the frame's cost, under **Verify**, reported in the Verification section.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/buttons.spec.ts`.
- The look check, by a throwaway spec deleted before the commit, run once as it is and once on the card (`test.use({ launchOptions: { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] } })`, top-level in the file; the renderer's name read through `WEBGL_debug_renderer_info` and reported). It shoots, at 1280 × 720 and 1920 × 1080, blown up enough to read: End turn at rest, under the pointer and pressed; the Menu button; the Icons button sunk and standing; a one-line tooltip (the rest on End turn); a count chip; culture waiting on the gold (a settled chronicle given culture up to its threshold through `gained`); the Menu window's buttons. On each the report says whether the middle of a top strip or a bottom lip is as bright as beside the corners, whether anything runs past an edge, whether a rim is crisp on all four sides, and whether any button look still shows the strip's line.
- The frame's cost on both renderers, measured as in **Traps**, reported beside those numbers.
- CI proves on the push: `chrome`, `city-mode`, `icons`, `map`, `piles`, `settle`, and every other spec that boots the chronicle screen, their frames slower by the software cost above.
