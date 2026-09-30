# The pan keys scroll panels and browses

**Line:** The pan keys scroll panels and browses — the two keys that pan the map up and down scroll what scrolls frontmost while they are held, at the speed the map pans: the collection screen's panel under the pointer, a browse or a window's grid on a scrim wherever the pointer stands, and a card shown large holds it still. Doc-impact: `docs/INTERFACE.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** the sentences below are written against the pages as the wheel line leaves them (`docs/INTERFACE.md`'s scrim sentence reads "Under the scrim the chronicle screen hears no key, a pan key held as the scrim rose pans no further, and the wheel over the scrim is the scrim's: it scrolls what scrolls and reaches nothing beneath." once it ships).

- `docs/META-SCREENS.md`, the collection screen's scrolling paragraph: "The wheel scrolls the panel under the pointer; a press held on the panel drags it, unless it lands on a card the deck editing mode carries, and the release lets it run on until it slows to a stop." becomes "The wheel scrolls the panel under the pointer, and so do the two keys that pan the map up and down while they are held, at the speed the map pans, a tap moving it one frame; the two that pan it left and right do nothing here. A press held on the panel drags it, unless it lands on a card the deck editing mode carries, and while it is dragged no key moves it; the release lets it run on until it slows to a stop, and a key or the wheel stops it." The sentence "No key scrolls a panel." is deleted.
- `docs/INTERFACE.md`, the scrim paragraph: the sentence quoted above becomes "Under the scrim the chronicle screen hears no key, a pan key held as the scrim rose pans no further, and the wheel over the scrim and the two keys that pan the map up and down are the scrim's: they scroll what scrolls on it, wherever the pointer stands, as they do a panel of the collection screen, and reach nothing beneath; a card shown large holds it still under them."
- `docs/CHRONICLE-SCREEN.md`, the browse paragraph: "A browse holding more than its frame scrolls." becomes "A browse holding more than its frame scrolls as a panel of the collection screen does."
- `docs/META-SCREENS.md`, the launch screen's browse, already scrolls "as a panel of the collection screen does" and needs no word; the campaign screen's tree already moves on the two keys that pan the map left and right and needs none.
- Player-facing text: none. The Controls window's labels stay Pan up and Pan down.

**Doc-impact:** `docs/INTERFACE.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

- In: every scrolling surface — the collection screen's panels in its three modes, a browse on the chronicle, launch and collection screens, and a window's grid on the chronicle screen's scrim — scrolls while a key the pan-up or pan-down control is bound to is held, at the map's pan speed, 1200 design pixels a second, and one frame's worth on a tap, the way the map moves on a tap. It stops at its first and at its last line as it does under the wheel, a key stops a fling as the wheel does, and a panel the room holds whole does not move.
- In: which one. On the collection screen the panel under the pointer at that frame, and none while the pointer is on neither; on a scrim the browse or grid standing there, wherever the pointer stands. A card shown large holds the browse or grid under it still, as it does under the wheel; a window of the menu takes every key as it does now; a panel being dragged ignores the keys until the release.
- In: the two keys that pan left and right do nothing on a panel, a browse or a grid.
- Out: any change to the wheel; a horizontal panel, none existing; a key that scrolls to a card or a line. The collection's panels hold their room whole on today's content, so nothing on that screen scrolls until the Stone Age's cards fill it; the rule is proven on a browse and holds there by construction.
- Corner cases decided here: a key held as a scrim rises or falls, or as a browse opens or closes, scrolls the thing that is frontmost from that moment and nothing else, as the map's own held key stops under a scrim; a key held as the window loses focus is let go of, as the map's is.

**Traps:**

- `src/ui/tree.ts:416-427` is the precedent for a held key on a meta screen: `held` and `tapped` sets fed by `onKeyDown` and `onKeyUp` from `src/ui/keys.ts`, `covered` for the menu standing over it, a per-frame step; `src/ui/map.ts:789-836` the same on the chronicle screen, with the one-frame tap and the `BLUR` that clears a held key when the window loses focus.
- The overlay scene reads keys through `readsKeys` and `takesMouseKeys` (`src/ui/overlay-scene.ts:44-45`), which read no release — `readsKeys`'s comment says so — so a held key on a browse or a grid needs the release read some other way; `onKeyUp` in `src/ui/keys.ts` reads the keyboard's and the mouse's.
- After the wheel line the overlay's taker holds every key while anything stands on the scrim (`holds` in `src/ui/overlay.ts`), and the browse's own `takes` (`src/ui/browse.ts:226`) closes on the back key: a pan key is taken there and reaches nothing beneath, which is what the design wants, so the scroll is driven from what the taker hears, not from the screen under it.
- A panel knows the pointer is on it by `thingUnder(scene.game) === zone` once a frame (`src/ui/panel.ts:292-295`), and its scroll moves through `Scroll` (`src/ui/scroll.ts`): `wheel(by)` stops a fling and moves by an amount, which is the shape a held key's frame step needs; `dragged` says a press holds it.
- The wheel over a panel is gated on the console's cover (`src/ui/panel.ts:258`); a key never reaches a screen while the console stands, so no gate is needed for one.
- `docs/PHASER.md`, _Input across scenes_: a key is heard by each scene's keyboard plugin in start order; a key taken on the overlay's plugin reaches no plugin after it.
- `e2e/browse.spec.ts:75` proves a browse scrolls under the wheel and stops at its ends, with the `wheel` helper of `e2e/chronicle-screen.ts:1295`; a browse on the chronicle screen overflows its frame on today's content, which is why the proof stands there. `e2e/controls.spec.ts:94` (`heldBy`) shows how a spec holds a key and measures what moved.

**Plan:**

1. `src/ui/scroll.ts` and `src/ui/scroll.test.ts`: a held motion at a speed over a frame, stopping at the ends and stopping a fling, proven in Vitest on the pure scroll. Leaves standing: a scroll that can be driven by a held key as by the wheel.
2. `src/ui/panel.ts`, `src/ui/collection-screen.ts`: the panel under the pointer scrolls while a pan key is held, none while the pointer is on neither, none while dragged. Leaves standing: the collection screen's panels scrolling under the keys as under the wheel.
3. `src/ui/browse.ts`, `src/ui/overlay.ts`, `src/ui/stack.ts`: a browse or a grid on the scrim scrolls while a pan key is held wherever the pointer stands, held still under a card shown large. Leaves standing: every scrim surface scrolling under the keys as under the wheel.
4. `docs/INTERFACE.md`, `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`: the sentences above.
5. `e2e/browse.spec.ts`: one test proving a held pan-down key scrolls a browse and stops at its last line, a held pan-up key brings it back to its first, a tap moves it less than a hold, the pan-left and pan-right keys move nothing, and a card shown large holds it still under a held key.
6. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/browse.spec.ts`. CI's on the push: `press.spec.ts`, `collection.spec.ts`, `deck-editing.spec.ts`, `civilization-mode.spec.ts`, `launch.spec.ts`, `deal.spec.ts`, `controls.spec.ts`, `tree.spec.ts`, `map.spec.ts`, `menu.spec.ts`, `console.spec.ts`.
