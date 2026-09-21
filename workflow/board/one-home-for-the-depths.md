# One home for the depths

**Line:** **One home for the depths** — `docs/INTERFACE.md` says what stands over what, one ordered table holds that order and every depth in `src/ui/` is read from it, the tooltip stands over everything but the console and shows over the deal window, and `e2e/hover.spec.ts` asserts it. Doc-impact: `docs/INTERFACE.md`, `docs/index.md`.

**Spec:** `docs/INTERFACE.md` gains a last section, after _The presses_, written out here in full:

> ## What stands over what ✅
>
> The chronicle screen is drawn on two surfaces: the **map**, which pans and zooms, and the **UI**, which holds still and stands over the whole map. On the map the order is a tile's own: the terrain, then the tiles lit and the units glowed on it, its buildings, its units, the fog, city mode's marks, the yield overlay's dim, what stays at full strength through that dim, the ring, the yield glyphs and the culture threshold; the infopanel stands over all of that. On the UI the band the hand and the piles stand in is lowest, the frame and chip of a mode over it, then the piles and the resting cards of the hand, the resource bar, the end-turn button, a card in flight, a card lifted out of the hand, and the line naming what that card is aimed at. A refusal's note stands over everything on the surface it is raised from.
>
> The **scrim** cuts the stack in two. Everything named so far is under it. What it carries — a browse, the aim window, the deal window, the capstone's window, a card shown large, a window of the menu, the ending screen, and the note a refusal raises over a window's card — stands between the scrim and the two things over it: the **Menu** button, so a chronicle that has ended can still be left, and the resource bar for as long as a deal waits to be taken. The **debug console** stands over all of it.
>
> A **tooltip** stands over everything but the console, on the surface it was raised from: a hover reaches only what the pointer can reach, so a bubble is never drawn under the thing it was raised beside. The scrim rising takes a standing tooltip down, and a hover afterwards raises it again.

Two sentences elsewhere on the page change so nothing is stated twice. The page's header line reads `> How any screen is worked: the menu and what it lists, the keys and how they are rebound, the debug console, the three presses, and what stands over what. …` (the rest unchanged). The debug console's paragraph opens `The **debug console** is a dark panel down the top of the screen, with the last lines run above the line being typed. What it covers reads dimly through it, so the bar is still there to be read and the console writes clear of it.` in place of its first two sentences; the rest of the paragraph is unchanged.

`docs/index.md`'s line for the page reads: `- [`INTERFACE.md`](INTERFACE.md) — how any screen is worked: the menu, Controls, the debug console, the three presses, what stands over what.`

The player-facing sentences the line foresees: none. No text entry changes; the tooltips that now show over the deal window are the readings' existing ones.

**Doc-impact:** `docs/INTERFACE.md`, `docs/index.md`. `docs/CHRONICLE-SCREEN.md` is unchanged: its per-tile sentences (the ring over every dim, the threshold over everything a tile carries, the bar reading over the deal window's scrim) are the rules the table's rows follow, and stay where they are.

**Scope:**

- In: one ordered table of named depths, the map's rows first, in the order the new section states; every `setDepth` under `src/ui/` reads a row of it, and no other file names a depth number or defines a depth constant. A family that orders inside itself — the hand's resting cards by slot, cards in flight by index, a button and the label on it — orders within its one row; how much room a row leaves for that is the implementer's.
- In: the tooltip's row lies over the two over-scrim rows and under the console's. The resource bar's guard that raises no tooltip while the bar stands over the scrim goes, so the readings' tooltips show over the deal window. The readings still answer no press there; that is unchanged.
- In: the scrim going up takes down the tooltip standing on either surface. Decided so because a tooltip up under a resting pointer when the back key raises the menu would otherwise stand over the menu until the pointer moved.
- In: the design rationale now living in code comments — why the Menu button and the deal-time bar stand over the scrim, in `design-space.ts` and `resource-bar.ts` — is cut from the comments; the docs hold it. Each remaining depth comment states its trap or goes.
- Out: the refusal note's arrangement. The chronicle screen's note stays under the scrim and the overlay's own note stays over its window's card, exactly as today; both read their rows from the table.
- Out: the map camera's viewport, which clips whatever the map surface draws outside the map's frame, and the two-camera cut itself. Nothing about surfaces moves.
- Corner, decided: the map-surface tooltip (the infopanel's rows) is raised from something the scrim covers, so it too goes down when the scrim rises and is never raised over one; its row is the same row as the UI's tooltip.
- Corner, decided: while a card is shown large over the deal window, the bar over the scrim still stands over the card and its tooltips show; a hover on the bar there is a hover on the bar.

**Traps:**

- Depth orders inside a Phaser Layer only. The map layer and the UI layer are two display lists painted by two cameras, the UI's second, so every UI object paints over every map object whatever their numbers, and one table across both surfaces reads true only because its map rows come first. The infopanel, the tooltip and the refusal note are created once per surface and today share one number on both surfaces by coincidence; after this line they share one row by design.
- Phaser re-checks what the pointer is over only when the pointer moves: `InputPlugin.pollRate` defaults to -1. A scrim rising under a resting pointer sends no `pointerout` to the thing under the scrim, which is why the scrim rising must take the tooltip down itself. The overlay already tells the chronicle scene when it covers and uncovers, through the `covering` callback `createOverlay` takes.
- Phaser's `topOnly` hit test means a pointer that moves after the scrim rises does reach the scrim and not the bar under it, so the bar's hover ends on its own then; only the resting case needs the take-down.
- Equal depths draw in the order they were added; two files today lean on that for a label over its button (the mode chip, the Menu button) and say so in a comment. That stays legal within one row.
- The overlay's own refusal note is created with an explicit depth over the window it serves, through the `depth` option `createRefusalNote` takes; the chronicle screen's is created without one and takes the note's default. Both defaults become rows.
- `e2e/deal.spec.ts` knows how to reach a deal window on the stand-in content: its `dealRun` searches the seeds for one whose first deal is due, and `take` lands it. A hover test over the deal window needs that reach; whether the helper moves to `e2e/chronicle-screen.ts` or the test lives beside it in `deal.spec.ts` is the implementer's, but the test asserts a rule a player could state and never a depth number.
- The e2e helpers read objects by name: `tooltipUp(page, 'tooltip-ui')` and `'tooltip-map'`. The tooltips keep those names.

**Plan:**

1. `docs/INTERFACE.md` and `docs/index.md`: the section, the header line, the console paragraph, the index line, as written above. Leaves the spec standing before any code moves.
2. The table: one module the depths are read from, under `src/ui/`, the rows named in the order the section states, the scrim's two rows and the console's among them, and the tooltip's row between the over-scrim rows and the console's. Leaves a table nothing reads yet; `npm run check` passes.
3. Every file under `src/ui/` that sets a depth reads its row: `band.ts`, `standing.ts`, `piles.ts`, `hand.ts`, `card-motion.ts`, `resource-bar.ts`, `chronicle-scene.ts`, `infopanel.ts`, `tooltip.ts`, `aim-line.ts`, `refusal-note.ts`, `overlay.ts`, `debug-console.ts`, `map.ts`, and `design-space.ts` loses its two exported depths. Leaves no depth number outside the table and every drawn order as it was, save the tooltip's.
4. The tooltip over the deal window: the bar's guard goes; the scrim rising takes the tooltip down on both surfaces. Leaves the readings' tooltips showing over the deal window.
5. `e2e/hover.spec.ts`: one test that a reading hovered while the deal window stands raises its tooltip, and one that a tooltip standing over a reading goes down when the back key raises the menu. Leaves the line's done-condition asserted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- `npx playwright test e2e/hover.spec.ts` — the spec the line names, with its two new tests.
- `npx playwright test e2e/deal.spec.ts` and `npx playwright test e2e/press.spec.ts` — the deal window's own spec, and the presses that every depth change could redirect. CI runs the rest on push.
- A search of `src/ui/` for `setDepth(` followed by a digit returns nothing, and no file but the table's defines a depth constant.
