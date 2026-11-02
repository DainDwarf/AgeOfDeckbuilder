# The type-size floor

**Line:** **The type-size floor** — no text is set under 11 design units, refused at the one door every text is made through; every card face but the one shown large is the hand's width; the pages state the floor and the smallest window, and the ui-check agent reads its 1280 by 720 viewport at factor 1 as that window. Doc-impact: `docs/LOOK.md`, `docs/INTERFACE.md`.

**Spec:**

- `docs/INTERFACE.md` _The window_, after "The screen is one design, 1280 by 720 units, laid out once and drawn at the window's own pixels": add the sentence "The game is read on a window of 1280 by 720 of the screen's own pixels at the smallest, the design drawn one to one; a smaller window shrinks it below what its type was sized for ([`LOOK.md`](LOOK.md))."
- `docs/LOOK.md` _The type_, after "The debug console's monospace is the machine's own.": add "No text is set under 11 units of the design, the smallest that reads as a word on the smallest window the game is read in ([`INTERFACE.md`](INTERFACE.md)); a text on the map is measured at the map's designed zoom, the zoom being the player's own magnifier."
- `docs/LOOK.md` _The cards_, after "The chips, the cost and the glyphs in a card's text are symbols.": add "A card face is one size wherever it stands, and a card shown large is the one other."
- `.claude/agents/ui-check.md`, at the end of the paragraph "Keep the viewport at 1280x720 for anything you click.": add "That viewport at `deviceScaleFactor: 1` is also the smallest window the game is read in (`docs/INTERFACE.md`): what reads there reads everywhere, so a readability check needs no other context." In the paragraph on `deviceScaleFactor`, after "The backing store is assertable directly:" and its code block, add "A smaller window is the same trick downward: `deviceScaleFactor: 0.75` at the 1280x720 viewport draws the game as a 960x540 window does, every click still a design coordinate." (verified on 2026-11-02: Chromium emulates 0.5 and 0.75 and the clicks land).
- `workflow/LOOK.md`: the bullet "**Type-size floor, verified small**" under _The style lock's lines_ is deleted; the pool's sentence about no UI-scale slider needs no page, since _The window_ already says the design scales as a whole.
- No player-facing sentence changes.

**Doc-impact:** `docs/LOOK.md` (_The type_, _The cards_), `docs/INTERFACE.md` (_The window_).

**Scope:**

- In: the floor, 11 design units, as a constant beside the design's width and height in `src/ui/design-space.ts`, and `addText` refusing a style whose size is under it, by a throw: every text in `src/ui/` is made through `addText` (the one `scene.add.text` in `src/`), so a text under the floor fails the first spec that draws its screen. A style's `fontSize` is a CSS string here, `"14px"` or `` `${0.66 * em}px` ``; the refusal reads the number out of it.
- In: one card width. `CARD_WIDTH` (130, `src/ui/card-face.ts`) is the width of every face but the one shown large (`WIDTH` 380 in `src/ui/stack.ts`): `COLLECTION_CARD_WIDTH` (110, `src/ui/collection-stack.ts`, read by the collection screen and the deck panel's dragged card), `PILE_WIDTH` (100, `src/ui/civilization-pile.ts`, the launch screen's and the collection screen's piles) and `GRID_WIDTH` (180, `src/ui/overlay.ts`, the deal's and the capstone's cards) all become it and go. The `width` option of `createCardFace` and the width argument of `createThingCard` stay for the large card; the `card` parameter of `spanOf` and `linesOf` in `src/ui/collection-stack.ts` is left with one value and goes.
- In: the face's shares raised to clear the floor at 130. The rules text, the kind label and the influence at the face's foot all go to 0.66 of the em (11.15 units); today 0.62, 0.65 and 0.65 (`src/ui/card-face.ts`). The infopanel's row labels and values (0.62) and its movement reading (0.55) go to 0.66 too (`stylesOf` in `src/ui/infopanel.ts`). The city badge's digit goes from 10 to 11 (`BADGE_STYLE`, `src/ui/map-marks.ts`); its pill (`BADGE_HEIGHT` 14) grows if the digit needs it. The 0.66 is Claude's number, picked at intake; one share for the three texts over three finer ones.
- In: the collection screen's lines. `shapeOf` in `src/ui/collection-screen.ts` hard-codes the stacks a line holds per mode; at 130 the rooms hold 5 in collection mode (6 today), 6 in civilization mode (7 today), 4 in deck mode (unchanged): `spanOf(across)` at 130 is across × 142 + (across − 1) × 10 against rooms of 880, 1040 and 640. The specs' `ACROSS` constants follow the layout: `e2e/collection.spec.ts` 6 → 5, `e2e/civilization-mode.spec.ts` 7 → 6, `e2e/deck-editing.spec.ts` stays 4.
- In: the deal's and the capstone's cards at 130 with `GRID_GAP` as it is; a row then holds 8, no event deals that many.
- Out: a second theme, a UI-scale setting, any change to the map's zoom range, the type of the ending screen, the debug console's monospace (the developer's, and not through the floor's meaning, though it is 14 and clears it).
- Corner cases decided: the map's two texts, the badge and the culture threshold, are measured at the map's designed zoom, so the badge at 11 reads 8.25 at the furthest zoom out and that is the player's own doing. A phone is not a window this line cares about: its pixel density puts an 11-unit word under a millimetre, and no dogma targets it.
- Reconcile: the four face widths become one (`CARD_WIDTH`), the large card staying apart as the one difference that is meant; the floor goes through `addText` as it is, no second mechanism; the ui-check agent's pinned viewport is reshaped by the two sentences above, nothing new; the smallest-window sentence joins `docs/INTERFACE.md` _The window_ and the floor joins `docs/LOOK.md` _The type_.
- Measured at intake (2026-11-02, real screenshots at factors 0.5 to 1.5, https://claude.ai/artifact/MwHmwhikMA1TEFxNpND8Ug): the collection stack's rules at 110 wide are 8.9 units and the pile's at 100 are 8.1, both unreadable at factor 1; the hand's 10.5 reads but thin; 11 has an x-height of about 5.3 pixels at factor 1 (Source Sans 3's x-height is 0.486 em).

**Traps:**

- A map text's resolution is re-cut at every zoom (`src/ui/map-camera.ts`, the `resolution` closure near its end) and its drawn size is the style's size times the map's zoom; the floor is read on the style's size alone.
- `addText` pads every text by `TEXT_INSET`, and `ownBoxOf` takes it back out: a size raised moves every layout that reads a text's `width` or `height` by the text's own growth, nothing else.
- The civilizations panel of the collection screen is 160 wide (`shapeOf`'s `right` in collection mode) and centres `PILE_SPAN` in it: 145 at 130 wide, 7.5 to spare each side.
- The collection screen rebuilds its stacks on a mode change (`workflow/LOOK.md` names it under _The meta screens_); nothing here changes that.
- `docs/PHASER.md`: a Text is measured when it is made and at each change, never again when a font arrives; the face is loaded before the game is made, so a size raised is measured in Source Sans 3. The fits accepted until now in `workflow/LOOK.md` _The cards and the windows_ were measured at the old shares; one that moves is reported, not re-fitted.
- The collection screen's and the launch screen's piles are read by `e2e/launch.spec.ts`, `e2e/collection.spec.ts` and `e2e/civilization-mode.spec.ts` through named objects, never through a width constant; no spec imports a card width.

**Plan:**

1. `src/ui/design-space.ts`: the floor constant and the refusal in `addText`. Leaves standing: a text under 11 units cannot be made.
2. `src/ui/card-face.ts`, `src/ui/infopanel.ts`, `src/ui/map-marks.ts`: the shares and the badge raised. Leaves standing: every text at 130 wide, in the infopanel and on the map clears the floor; the suite is green but for the three small widths.
3. `src/ui/collection-stack.ts`, `src/ui/civilization-pile.ts`, `src/ui/overlay.ts`, `src/ui/collection-screen.ts`, `src/ui/deck-panel.ts`, and the three specs' `ACROSS`: one card width, the lines per mode. Leaves standing: one face width everywhere but shown large, the collection at 5, 6 and 4 across.
4. `docs/INTERFACE.md`, `docs/LOOK.md`, `.claude/agents/ui-check.md`, `workflow/LOOK.md`: the sentences above. Leaves standing: the pages state the floor and the window, the agent reads its viewport as the smallest window, the pool's bullet gone.
5. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof spec: `npx playwright test e2e/collection.spec.ts` — the stacks at the hand's width, 5 a line, and the pile in its panel.
- The ui-check pass through the `visual-check` skill, at 1280x720 and factor 1: the chronicle screen (a hand card's rules text and kind label, the city badge, the infopanel on the city's tile), the collection screen in collection and civilization mode, the launch screen's pile, the deal window on `seed` with an event dealt if one is cheap to reach; read the smallest texts and report any clipping or overlap the raised shares cause.
- CI proves on the push: `civilization-mode`, `deck-editing`, `launch`, `browse`, `deal`, `capstone`, `monument`, `hover`, `inspect`, `population-badge`, `city-mode`, `map`, `reference`, `hand-aim`, and the whole suite for the floor's door.
