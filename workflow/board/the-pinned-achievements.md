# The pinned achievements

**Line:** **The pinned achievements** — the pinned achievements stand as one ledger against the chronicle screen's left edge, a row to each, folded into the edge and brought back by a tab that reads the tally while folded, and `e2e/pin.spec.ts` proves the rows, the fold and the screen opening unfolded. Doc-impact: `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`, `docs/INTERFACE.md`.

**Spec:** the mockup the user picked on is https://claude.ai/artifact/GnJxoW2w4TgF7L9y4Gp9U6, its picks pasted back as `ledger: top 120, width 236, row room 8, between rule, reached faint · tab: silver, at the top, 24 by 48, triangle · folded: tally, sign none`; every number it holds is written out under Scope, so the page need not be opened.

`docs/CHRONICLE-SCREEN.md` _The pinned achievements_, the whole section replaced by these two paragraphs:

> While the campaign pins technologies whose achievements the chronicle reads, those achievements stand in a **ledger** against the screen's left edge, a little under the height the resource bar hangs to, at the same place on every window: one panel, a row to each achievement, one under the other in the order the chronicle reads them, a thin rule between two rows. A row reads its technology's name; at the right end of the name's line, the achievement's count over its need, which a need of one does not read; and under the name the goal as the plate reads it, wrapped onto as many lines as it takes, the row as tall as they stand. Once an achievement is reached its row reads the check mark and the name alone, fainter, as tall as that one line, and the rows under it close up. A name in a goal reacts to the rest and the right click as on a plate. The ledger reacts to no press; the wheel over it zooms the map, as over the resource bar. It stands on the settle phase and in city mode as on any turn.
>
> A **tab** stands on the ledger's outer edge, at its top: a button wearing a triangle and no word, the triangle pointing at the screen's edge. A left click on it folds the ledger into the edge: the panel and its rows are gone, and the tab alone stands on the screen's edge at the height it stood at, its triangle pointing away from the edge, under the tally, the achievements reached over those the ledger holds, `1/5`. A left click on the folded tab brings the ledger back. The pointer resting on the tab raises a tooltip under it reading `Pinned achievements`, folded or not, and no key folds the ledger. It is a display and not a mode, as the Icons button's is: the back key leaves it as it stands, the settle phase and city mode stand with it, and every chronicle screen opens with the ledger unfolded. A pinned technology whose achievement the chronicle does not read stands there as nothing, and a campaign pinning none the chronicle reads shows neither the ledger nor its tab.

`docs/LOOK.md`:

- The table of signs, one row after the Hex grid button's, its three cells: "The pinned achievements' tab", "a triangle", "Material Design Icons, `menu-left`".
- _The chrome_, **A panel**: in the list of what stands on one, "a pinned achievement" becomes "the pinned achievements' ledger"; and after the band's clause the sentence goes on: "; the ledger's stands against the screen's left edge and runs on past it, so it shows its rim along its top, its outer side and its foot."
- _The chrome_, **A button**: the bright silver's list becomes "the Menu button, the Icons button, the Faction signs button, the Hex grid button and the tab of the pinned achievements' ledger"; and one sentence is added at the paragraph's end: "The ledger's tab is taller than wide, its inner end hidden under the ledger's panel, or past the screen's edge while the ledger is folded; it wears its triangle in the dark ink and with no outline, and folded it reads the tally over the triangle, bold, in the same ink."
- _The chrome_, **A well**: "a reached pinned achievement, " leaves the list.
- _The chrome_, the paragraph "Words on the charcoal read in a pale ink…": one sentence added after its first: "A reached row of the pinned achievements' ledger reads in a fainter ink, and the rule between two of its rows is a thin line of the pale ink, faint."

`docs/INTERFACE.md`:

- _The window_: "…and the end-turn button to its bottom right one, and the map fills the screen under them all" becomes "…and the end-turn button to its bottom right one, the pinned achievements' ledger to its left edge, and the map fills the screen under them all".
- _What stands over what_: "the chip of a mode, the pinned achievements, the Icons button" becomes "the chip of a mode, the tab of the pinned achievements' ledger and the ledger over it, the Icons button".

Player-facing entries, both new in the text table: the tab's tooltip, `Pinned achievements`; the tally, `{reached}/{pinned}`. `achievement.reached` and `achievement.count` stand as they are.

`public/assets/LICENSES.md`, _Material Design Icons_: the count goes up by what enters, `menu-left` (and `menu-right` if a second file is taken rather than the one turned) joins Austin Andrews' list, and the licence line gains "and `menu-left`, read on 2026-11-23 in the set's `meta.json` (in Arrow)". Both glyphs are by Austin Andrews, in the Arrow category, added in 1.5.54, not deprecated.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`, `docs/INTERFACE.md`; `public/assets/LICENSES.md` for the glyph. `docs/GLOSSARY.md` none: **pin**'s row still holds, and "ledger", "tab" and "fold" are the screen's words, as the ending screen's ledger is.

**Scope:**

In, the ledger, in units of the screen:

- One kit panel, the resource bar's piece at the strip's rim, its left edge on the screen's left edge and run on past it as far as the bar's runs past the top, so its rim shows along its top, its right side and its foot. Its top stands 120 under the screen's top on every window; it is 236 wide, a number of its own and no longer the tree's plate's; it is as tall as its rows and 2 more.
- A row is laid as a pinned plate's inside is today: 12 in from each side, 8 over and under, the name line 22, a goal line 18, the name bold 16 and the count and the goal 14, in the charcoal's pale ink, so a row of one goal line is 56 tall. Rows adjoin with no room between them. A rule 1 tall lies along the top of every row but the first, from the screen's left edge to 2 short of the ledger's right edge, in a look entry of its own: the pale ink at 18%.
- A reached row is the check mark and the name on the name line alone, 38 tall, in a look entry of its own, `0x9aa1a9`; it sits in no well and is not sunk.

In, the tab:

- The kit's bright silver button with its hover and pressed looks, showing 24 wide by 48 tall past the ledger's right edge, its top 8 under the ledger's top; its body reaches 10 further in, under the ledger's panel, which is drawn over it. Its sign is the triangle in a square of 30, centred across what shows less 1 toward the screen's edge, in the dark ink with no outline, pointing at the screen's edge.
- Folded: the panel and the rows are not drawn and take no press; the tab stands with what shows starting at the screen's left edge, its body 10 past it, its top where it was; it shows 54 tall and as wide as the tally plus 12, never under 34; the tally stands bold 14 in the dark ink 9.5 above its middle and the triangle 9.5 below, pointing away from the edge.
- A left click folds and unfolds at once, with no motion. The tab carries the hand cursor and names itself under it on the rest as a corner button does. The fold is held as the Icons button holds what it shows: by the screen, forgotten when the chronicle screen is made again, nothing kept in the browser.

Corner cases decided here:

- The tally counts the rows the ledger holds, the reached among them over all of them; it moves while folded as an achievement is reached.
- Every row reached: the ledger stands, all its rows faint.
- No pinned technology the chronicle reads: no panel and no tab.
- A press on the ledger reaches no tile and lets a card being aimed go, a name in a goal included, as on a pinned plate today; a click on the tab lets it go too, as a click on the Icons button does. The right click on the tab does nothing.
- The wheel over the tab zooms the map as over the ledger.
- A ledger taller than the map's frame is not reached by the content (six rows at most are pinned at once in the Stone Age, a foot near 450 of 614 on the smallest window) and gets no rule.

Out: a motion for the fold (Motion's rung); a key; the tree's plates and the ending screen's ledger, which keep their looks.

The reconcile, all five taken as recommended:

1. The tab against the display buttons (Icons, Faction signs, Hex grid): apart in its place and in wearing no well, the triangle's direction saying the state; everything else is theirs — the kit's looks, the name on the rest, no key, forgotten at each chronicle screen, a display and not a mode.
2. The tally against the counts on the kit's counter chip: apart; it is read plain on the tab's own silver, as the resource bar reads idle over the population.
3. A reached row against the tree's learned plate and the ending ledger's row: apart, a fainter ink with a look entry of its own, sharing its value today with the ending's unpaid ink and never with its entry.
4. The rule against the ending ledger's rule: one look, in the ledger's faint form; this line ships the faint rule with its own entry, and the ending's rule takes it in the line that redoes that screen. The ending screen is not touched here.
5. The ledger's panel against the resource bar's and the band's: through the same piece at the same rim.

**Traps:**

- `PHASER.md` _Textures_: a nine-slice squeezed along one axis. The kit's buttons are fitted to their box's height (`src/ui/chrome.ts`), which on a tab taller than wide makes corners wider than the tab; the mockup fitted the tab to its narrower measure, the body's 34 across the file's 108, so the corners hold. The look is shot on the card before it is called right.
- `PHASER.md` _What the pointer is over_: the wheel reaches the topmost interactive object alone, and a cursor is written only at an edge; _Layers, Containers and Groups_: a hidden object is neither drawn nor hit, which is what folds the ledger; _Under a Playwright spec_: an object made interactive is hit only from the next frame.
- The rows, the panel, the rule and the tab are made once and shown, hidden and laid again in place (`DOGMAS.md` _Stack_); a row reached changes its ink and its height through setters.
- Three specs besides the proof read a pinned achievement by name and are CI's: `e2e/press.spec.ts` clicks `pinned-achievement-<technology>-name` and a name on `-face`; `e2e/map.spec.ts` drags the map until a lit tile lies under `pinned-achievement-<technology>`'s box, which must stay the one row's box; `e2e/faction-signs.spec.ts` rests on a name on `-face`. `e2e/pin.spec.ts` reads `-name`, `-goal`, `-goal-run`, `-count`, `-well` and `-stop`.
- The resource bar's left end is handed to the pinned achievements today for the beside-or-under rule; that rule goes, and what nothing reads after it goes with it.
- `src/ui/cast.ts` maps a symbol to its file, white on nothing, each Material Design file changed in one thing, its path filled white, with a comment saying so (`public/assets/LICENSES.md`); the set comes from `@mdi/svg` 7.4.47. No licence entry, no ship.
- Two look entries are new and each is named for its meaning (`DOGMAS.md` _Code_): the reached row's ink and the ledger's rule.
- The text table's lint and the glossary: the two entries above are the only new player-facing text.

**Plan:**

1. `public/assets/material-design-icons/`, `public/assets/LICENSES.md`, `src/ui/cast.ts`, `src/ui/look.ts`, `src/ui/text.ts`: the triangle in the cast with its licence record, the two look entries, the two text entries; the game draws as before.
2. `src/ui/chrome.ts`: a kit button that holds its corners where it is taller than wide; every standing button draws as before.
3. `src/ui/pinned-achievement.ts`, and `src/ui/chronicle-scene.ts` where it is made: the ledger in the stack's place, its rows, its rule and the reached row's look, standing at 120 on every window; then the tab, the fold and the tally. The screen opens unfolded.
4. `e2e/pin.spec.ts`, and `e2e/chronicle-screen.ts` where a reading is missing: the stacking test restated for adjoining rows and a reached row that sits in no well; the beside-or-under test replaced by one for the ledger standing against the left edge at one height on the design window and the wide one; a new test for the fold — a click on the tab leaves no row standing and the tab on the screen's edge reading the tally the rules give, a second click brings the rows back, a card being aimed is let go by the click, and the screen opened again stands unfolded. Every number read from the rules.
5. `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`, `docs/INTERFACE.md`: the sentences above. The board line and this file deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof: `npx playwright test e2e/pin.spec.ts`. CI's on the push, for the hand-back: `e2e/press.spec.ts`, `e2e/map.spec.ts`, `e2e/faction-signs.spec.ts`.
