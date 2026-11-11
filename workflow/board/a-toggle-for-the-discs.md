# A toggle for the discs

**Line:** **A toggle for the discs** — an Icons button in the map's bottom-left corner and the icons key, `F` until it is rebound and listed in Controls, show or hide every feature's and every improvement's disc on the map, shown again at every chronicle screen's open; `e2e/icons.spec.ts` passes.

**Spec:**

`docs/CHRONICLE-SCREEN.md`, _The map_, a new subsection after _The yield overlay_, written out:

> ### The Icons button
>
> The **Icons** button shows or hides the discs of every tile's row, the features' and the improvements', with what they wear. Hidden, a feature and an improvement are told by what lies on the land alone, and an improvement under a building that fills its tile by nothing on the map. The button stands in the map's bottom-left corner, as far from the map's left edge as a mode's chip stands from its right one and 8 over the draw pile, drawn as the Menu button is, and sunk in a well while the discs are shown, as a latched reading of the resource bar is. A press on it or the **icons key** switches them at once, and a window standing over the chronicle screen takes the key instead. It is a display and not a mode, as the yield overlay is: the back key leaves it standing, city mode and the settle phase stand with it, and every chronicle screen opens with the discs shown. It changes the tiles' rows and nothing that reads the map: a tile in fog loses its discs with the rest, and the yield overlay, the infopanel, the selection and an aim read on as they did. It raises no tooltip.

`docs/INTERFACE.md`, _The menu_, the Controls paragraph: the list of keys gains the icons key after the yield key — "…the city key, the yield key, the icons key, the inspection key, and the back key…".

`docs/INTERFACE.md`, _What stands over what_: "…the frame and chip of a mode and the pinned achievements over it…" becomes "…the frame and chip of a mode, the pinned achievements and the Icons button over it…".

Player-facing entries, both written out: the button reads `Icons`; its row in the Controls window reads `Icons`. No other entry is foreseen: no tooltip, no note.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`. `docs/LOOK.md` stays as it is: the disc still tells a feature at every zoom while it is shown. No glossary row: the button's word is a screen's word, as "Yield overlay" is.

**Scope:**

In:

- The button on the chronicle screen's UI surface: 24 units in from the map's left edge, its bottom edge 32 units over the band's top, so 8 over the draw pile's top; 32 tall, as wide as its word and 12 of padding each side; the Menu button's face while the discs are hidden (panel paper, 1-unit edge, 18-unit regular word in ink); while they are shown, the bar's well in place of that face and the word pushed down and right by the well's own step. The mockup the user took it from, with "Over the draw pile", "Word, sunk while shown" and the word Icons: https://claude.ai/artifact/DREJgtSjExWEYdYxdECNTD.
- The icons key: an eleventh control, listed in the Controls window under Yield overlay, `F` in its first slot and nothing in its second, put back by Default, rebound as any key.
- The Controls window's rows 5 units apart in place of 8, so thirteen rows fit: the window is 692 of 720 units tall today, would be 734 at today's spacing, and is 698 at 5.
- What hides: on every tile the map draws, in sight and in fog, the feature's disc and icon and each improvement's disc and what it wears. What stays: the herd, the pond, an improvement's painting, the ditches, a face's tint, the city badge, the culture threshold's plate, and every disc on the infopanel's cards.

Out: the minimap and the toggles on it (an idea); a fade on the switch (Motion's); a tooltip; the state kept from one launch to the next; a row in Graphics.

Corner cases decided here:

- Every chronicle screen opens with the discs shown, a chronicle resumed, one launched from the launch screen and one launched by the console's `seed` alike.
- The button answers while a play-out runs, as a reading of the bar does.
- A press on the button while a card or a unit is being aimed lets the aimed thing go, as a press on any thing standing over the map does; the key leaves the aim standing.
- A feature removed or an improvement placed while the discs are hidden plays nothing of the disc; shown again, every row stands as the chronicle has it.
- The switch is instant, whatever motion is in the air.
- A player whose kept controls already hold `F` on another control keeps that binding, and the icons key's first slot reads empty until they bind it. A kept set that holds nothing on `F` takes the default.

What the reconcile chose, each going through what stands:

1. The button's face is the Menu button's as it is.
2. Sunk while shown is the bar's well as it is, the one the navbar's standing button also sits in.
3. Standing over the map's corner follows the mode chip and the pinned achievements, 24 in from the edge; the 32 from the band is the one meant difference, to clear the draw pile.
4. The display follows the yield overlay's rules sentence for sentence; the one meant difference is that it opens shown.
5. It is a switch of its own on what the map draws, apart from the console's two veils; nothing the rules read changes.
6. The Controls row is a key like the ten, on the standing list, the standing window and the standing store.

**Traps:**

- Every render and every motion writes the discs' own visibility: a render hides and repaints each tile's kept marks and empties the pools, and the map's motions fade and move the row's marks. A switch written on those objects is undone by the next render; the hiding has to hold over both.
- The specs' readings take a mark as standing only if it and every parent over it is visible (`e2e/chronicle-screen.ts`, the `isShown` walk), so a mark hidden through what holds it reads as not standing.
- The Controls window's rows come from the controls list, and each row's label is the text entry named after its control: a control added to the list brings its row, and its entry must exist under that name.
- The row gap is one number for the Controls window and the Graphics window, whose two rows come 3 units closer with it; that is accepted.
- `e2e/controls.spec.ts` lists every row and every default the Controls window reads, so it is red until its lists hold the new control.
- A press on a thing over the map reaches the scene's one door for left clicks, which already lets an aim go for any thing that is not the hand's: the button needs no rule of its own for that.
- While the debug console stands the keyboard is its, and while a window stands on the scrim the key is the window's: both hold through the scene's one key reader, as for the yield key.
- An object made interactive is hit-tested only from the next frame (`docs/PHASER.md`, _Under a Playwright spec_): the spec rests before its first press.
- `icon` is the code's word for what a disc wears (`asIcon`, `featureIconOf`); the control and the button name the switch, not that picture.

**Plan:**

1. `src/ui/bindings.ts` with `src/ui/bindings.test.ts`: the control stands on the list after the yield overlay's with its default, and a kept set holding that default's key on another control leaves the new control's slot empty. Leaves standing: the key bound, kept and read, with one test for the corner.
2. `src/ui/text.ts`: the two entries. `src/ui/menu.ts`: the rows 5 apart. Leaves standing: the Controls window listing thirteen rows inside the screen.
3. `src/ui/map.ts`: the map shows or hides its rows' discs on the screen's word, held over renders and motions. Leaves standing: a switch the screen can turn, off by nobody yet.
4. `src/ui/chronicle-scene.ts`, and a file of its own for the button if the implementer wants one: the button on the UI surface, its well, the key answered beside the yield key, both turning the map's switch. Leaves standing: the line's behaviour whole.
5. `e2e/icons.spec.ts`, new, and `e2e/controls.spec.ts`'s lists. The new spec opens on a saved chronicle with a feature in sight and an improvement placed through the rules' helpers, and asserts: the discs and the well stand at the open; a press on the button leaves no disc and no disc's picture standing on those tiles while what lies on the ground still stands, and the well is down; a second press brings them back; the key does both the same; a card being aimed is let go by the press and kept by the key.
6. `docs/CHRONICLE-SCREEN.md` and `docs/INTERFACE.md` as written above; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/icons.spec.ts`. CI's on the push, listed for the hand-back: `controls.spec.ts` (its lists changed here), `graphics.spec.ts` (the rows closer), `yields.spec.ts`, `map.spec.ts`, `trapping.spec.ts`, `irrigation.spec.ts`, `fog.spec.ts`, `press.spec.ts`, `hover.spec.ts`, `pointer-sweep.spec.ts`, `city-mode.spec.ts`, `settle.spec.ts`.
