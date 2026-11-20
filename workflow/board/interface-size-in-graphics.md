# Interface size in Graphics

**Line:** Interface size in Graphics — a row reading 100%, 125%, 150%, 200% or Largest, a press moving it to the next as Animation speed's does, a change taking at once, kept in the browser.

Done when: the Graphics window lists Animation speed, Fullscreen, Interface size and Faction signs, top down; the Interface size row reads the size kept, 100% where nothing is kept; a press moves it to the next, 100% → 125% → 150% → 200% → Largest → 100%; the chronicle screen standing under the menu is drawn at the new size at once; the size is kept in the browser and read at the next launch; `e2e/graphics.spec.ts` proves it, and the suite is green on the push.

**Spec:** `docs/INTERFACE.md` → _The menu_, the Graphics paragraph, and _The window_, both written at the cut. The row's sentences, as they stand:

> **Graphics** lists **Animation speed**, **Fullscreen**, **Interface size** and **Faction signs**. … Interface size is a row reading how large the interface is drawn, 100%, 125%, 150%, 200% or Largest, a press moving it to the next and Largest back to 100%. At 100% a unit is one pixel of the window as the system scales it; Largest draws it as large as the window holds 1280 by 720 units, as _The window_ says. A change takes at once, and the size is kept in the browser from one launch to the next.

Player-facing text, entries of `src/ui/text.ts` beside the other `graphics.` ones:

- `graphics.interface-size`: `Interface size`
- `graphics.size`: `{size}%` (reads `100%`, `125%`, `150%`, `200%`)
- `graphics.largest`: `Largest`

**Doc-impact:** none — `docs/INTERFACE.md` already carries the row and the window, written at the cut.

**Scope:**

- In: the row, third in the Graphics window; the size kept in the browser under an entry of its own, beside the speed's and the signs'; the size read at boot before the first screen is laid out; a press re-laying the chronicle screen at once.
- Out: the meta screens, which stay fitted whatever the size; any other setting.
- **The sizes:** 100%, 125%, 150% and 200% draw one unit across that many hundredths of a CSS pixel, capped by the largest size that holds 1280 by 720 units; Largest is that cap itself. A window that cannot hold 1280 by 720 units at the size kept draws at the cap, and the row still reads the size kept: on a 1280 by 720 window every size draws alike.
- **A value kept that is not one of the five** stands at 100%, as the speed's unknown value stands at ×1.
- **Controls' Default** does not touch it: like the speed and the signs, it is kept apart from what Default puts back.
- **A press over the chronicle screen** lays the screen under the menu out again at the new size at once, the menu and its Graphics window with it, centred again; the pointer stays where it is, so the row may move from under it. Over a meta screen a press changes only what the row reads and what the next chronicle screen is drawn at.
- **Reconcile:** the row goes through the same form as Animation speed and Faction signs (`keptRow` in `src/ui/menu.ts`, a module like `src/ui/animation-speed.ts` holding the entry, the parse, the next size and the press); the size is the one value the previous line reads in one place.

**Traps:**

- The previous line (_The screen takes the window's shape_) must have shipped: this line sets the value it reads.
- The Graphics window's height is counted from its rows (`rowsHeight(GRAPHICS_ROWS.length)` in `src/ui/menu.ts`): adding a row grows the window; its buttons stand under the rows.
- A change of size is not a change of window: Phaser emits no RESIZE for it. The re-layout the previous line hangs on a resize has to be called for the press too (`game.scale.refresh()` emits RESIZE; `docs/PHASER.md` _The scale manager_).
- `setResolution` re-rasterises a Text every time (`docs/PHASER.md` _Text_): the texts re-cut for the new factor are cut where the resolution moved, as `cutTexts` does.
- `e2e/chronicle-screen.ts` plants the speed through `onDesignedSpeed`; a spec planting a size plants it the same way, before the page loads, never on every load.

**Plan:**

1. A module beside `src/ui/animation-speed.ts` holding the size kept: its entry, its parse, the size a press moves to, and the press, which stores it and has the screen laid out again. Leaves the size readable and settable.
2. The value the previous line reads in one place reads that module.
3. The row in `src/ui/menu.ts`, third in `GRAPHICS_ROWS`, and the three entries in `src/ui/text.ts`. Leaves the line done.
4. `e2e/graphics.spec.ts` extended as the proof.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/graphics.spec.ts`, extended to show:
  - on a 1920 by 1080 window, the row reading 100% and a hand card 124 CSS pixels wide;
  - a press reading 125% and the card 155 wide at once, under the menu;
  - then 150% (186), 200% drawing at the cap (186, the window holding 1280 by 720 units at 1.5 at most), Largest (186), and a press back to 100% (124);
  - the size kept across a reload;
  - on a 1280 by 720 window, every size drawing the card 124 wide.
- The visual check through the `visual-check` skill: the Graphics window with its four rows, and the chronicle screen at 1920 by 1080 at 100%, 125% and Largest.
- CI proves the whole suite on the push; list `graphics`, `menu`, `controls` and `window` for the hand-back.
