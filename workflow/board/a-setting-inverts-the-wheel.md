# A setting inverts the wheel

**Line:** A setting inverts the wheel — the Controls window holds two rows under the zooms, **Wheel zoom** reading Up zooms in or Up zooms out and **Wheel scroll** reading Up scrolls up or Up scrolls down, a press turning each the other way, the map and every scrolling surface following through the one reading of the wheel, **Default** putting both back, and both kept in the browser with the bindings. Doc-impact: `docs/INTERFACE.md`.

**Spec:** `docs/INTERFACE.md`, _Controls_, written against the paragraph as the wheel line leaves it.

- After the sentence "The two zooms zoom the map one notch a press, and stand on `=` and `-` until they are rebound." add: "Under the zooms, **Wheel zoom** and **Wheel scroll** each read which way the wheel turns things — Up zooms in or Up zooms out, Up scrolls up or Up scrolls down — and a press turns it the other way, the map and everything that scrolls following on every screen."
- The sentence "**Default** puts every key back where it began, **Back** closes the window, and what the player binds is kept in the browser from one launch to the next." becomes "**Default** puts every key and the wheel back where they began, **Back** closes the window, and what the player binds and sets here is kept in the browser from one launch to the next."
- Player-facing text, six entries, verbatim: the two row labels **Wheel zoom** and **Wheel scroll**; the button readings **Up zooms in**, **Up zooms out**, **Up scrolls up**, **Up scrolls down**.

**Doc-impact:** `docs/INTERFACE.md`.

**Scope:**

- In: two settings, each a boolean, both off by default: the zoom inverted and the scroll inverted. Inverted, a notch up zooms the map out and a notch down zooms it in; inverted, a notch up scrolls a panel, a browse or a window down and a notch down scrolls it up. The wheel under Ctrl, Meta or Alt stays the browser's; the tree, where the wheel does nothing, is untouched; a trackpad follows the same two settings, the OS's own direction applying before them.
- In: the two rows stand in the Controls window right under the zoom-out row, before the city key's, each its label on the left and one button on the right as wide as the two slots and their gap together, reading the direction; a press flips it and repaints. **Default** turns both back off with the keys. A slot listening is let go of by a press on either button, as by a press on anything else.
- In: kept in the browser beside the bindings, from one launch to the next; a stored value that is not a boolean stands at its default, as a stored slot that is not a key does.
- Out: a setting for the map's drag or the pan keys; a sensitivity; anything in the Settings window itself.
- The window grows by two rows, from about 610 to about 694 of the 720 design pixels, the title's height being the part not measured, standing about 13 above and below; decided so, and the implementer reports the measured height.

**Traps:**

- The wheel line leaves one reading of the wheel for the game in `src/ui/keys.ts`, the chord dropped there and the delta handed on raw, the map's notch counting standing on it, and every scene that scrolls handed the wheel through its own door (`workflow/board/the-scrim-hears-the-wheel-through-one-door.md`, which is deleted as that line ships; `git log` finds its commit). The two settings are read there and nowhere else: the zoom's sign where the map's notches are counted, the scroll's where the delta is handed to what scrolls. A reader of the sign anywhere else is a second choke point (`DOGMAS.md`, _Code_).
- `src/ui/menu.ts` sizes the Controls window's rows from `CONTROLS.length` (`ROWS_HEIGHT`, `:124-131`), its body (`bodyHeight`, `:198-202`) and its height (`:379-385`) from that; the two new rows are not controls and bind no key, so `CONTROLS` and `bindings()` do not grow, and the Controls window's e2e reading of its rows (`rows` and `AS_FOUND` in `e2e/controls.spec.ts`) reads slots alone. Line numbers are as of the branch's cut; the wheel line does not touch `menu.ts`.
- `pressable` (`src/ui/menu.ts:161-176`) is the one shape a slot and a button of a window are drawn as; a slot's name is `controls-<control>-<slot>`, the buttons' `controls-default` and `controls-back`, and a spec reaches a face by its name and its reading by `<name>-label`.
- `src/ui/bindings.ts` keeps the bindings under `STORED` and parses them tolerantly (`parseBindings`, `slotsOf`); `restoreDefaults` is what **Default** presses. A setting stored elsewhere under the same origin would be a second store to lint; the design says "with the bindings".
- The e2e `grewBy` helper in `e2e/controls.spec.ts` measures a zoom off one notch, and `wheel` in `e2e/chronicle-screen.ts:1316` scrolls a browse from over its frame; Playwright's `mouse.wheel(0, dy)` sends a positive `dy` for a notch down.
- The pile browse overflows on the Nomadic content alone (`overflowingPiles`, `e2e/chronicle-screen.ts:926`), so the proof holds after the padding leaves; it uses no placeholder.
- Player-facing text is keyed data in `src/ui/text.ts`, never a literal; the six entries above are the whole of it.

**Plan:**

1. `src/ui/bindings.ts`, `src/ui/bindings.test.ts`: the two settings, read, kept and restored with the bindings, a bad stored value at its default. Leaves standing: a setting the game can read and the Controls window can flip.
2. `src/ui/text.ts`, `src/ui/menu.ts`: the two rows under the zooms, their readings, the flip, **Default** covering them. Leaves standing: the Controls window as the spec describes it.
3. `src/ui/keys.ts`: the one reading of the wheel follows the two settings, the zoom's where the notches are counted and the scroll's where the delta is handed on. Leaves standing: the map and every scrolling surface turning the way the window says.
4. `docs/INTERFACE.md`: the sentences above.
5. `e2e/controls.spec.ts`: one test proving the rows read their defaults, a press on **Wheel zoom** turns a notch up into a zoom out on the map and reads Up zooms out, a press on **Wheel scroll** turns a notch down into a scroll up on a pile's browse and reads Up scrolls down, both outlive a reload, and **Default** puts both back.
6. `workflow/BRANCH.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/controls.spec.ts`. CI's on the push: `map.spec.ts`, `browse.spec.ts`, `press.spec.ts`, `collection.spec.ts`, `menu.spec.ts`, `boot.spec.ts`.
