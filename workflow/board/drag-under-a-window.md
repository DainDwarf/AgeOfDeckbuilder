# A drag does not resolve under a window

**Line:** A drag does not resolve under a window — a press the pointer holds as a scrim rises is let go of where it stands, a card, a unit or a population being carried coming home and nothing playing, and the release under the scrim lands as nothing; a press is held by the button that landed it alone, a second button pressed meanwhile a click of its own the hold stands through; `docs/INTERFACE.md` says so and `docs/PHASER.md` that Phaser ends a drag at any button's release; `e2e/press.spec.ts` asserts it. Doc-impact: `docs/INTERFACE.md`, `docs/PHASER.md`.

**Spec:** [`BRANCH.md`](../BRANCH.md) _The design_, _The barriers_ paragraph; `docs/INTERFACE.md` _The presses_ and _What stands over what_; `docs/CHRONICLE-SCREEN.md` _The chronicle screen_, the drag sentences of the unit, the population and the hand, which do not change, and its menu sentence, which lists what waits under the menu and never a drag. The edits, written out:

- `docs/INTERFACE.md` _The presses_, after "The two clicks press the screen and are not keys: neither binds to anything, and Controls lists neither.", add: "A press is held by the button that landed it, and that button's release alone lets it go; a second button pressed meanwhile is a click of its own, answered at its own release on the thing under the pointer, and the hold stands through it, a scrim that click raises excepted."
- `docs/INTERFACE.md` _What stands over what_, tooltip paragraph, after "A scrim rising takes a standing tooltip down, and a hover afterwards raises it again." — the sentence the overlay line replaces, which this one leaves whole — add: "A press the pointer holds as a scrim rises is let go of where it stands, whatever raised the scrim: a card, a unit or a population being carried comes home and nothing plays, nothing is selected, and the release that comes under the scrim lands as nothing."
- `docs/PHASER.md` _The pointer's readings_, after the `pointerup` entry, add: "- **A drag ends at any button's release, and no `drag` comes after it.** The drag end is processed ahead of the release for the pointer and not for a button (`src/input/InputPlugin.js:754-756`, `:1464-1515`), so a right click on an object the left button is dragging fires its `dragend` with the left button still down, and Phaser's drag state is over from then on: a hold that is to outlive a second button's click is the taker's from there. A pointer's `button` names the button of the event being answered, on a release as on a press (`src/input/Pointer.js:606`, `:650`), and `buttons` says which still hold (`:599-625`)."
- `workflow/BRANCH.md` _The barriers_, replace "and a press begun on a lower scene and let go of over a higher one still ends where it began." with "and a press begun on a lower scene and let go of over a higher one still ends where it began — or ended already, let go of as the scrim rose, so nothing resolves under a window."

No player-facing text entry changes.

**Doc-impact:** `docs/INTERFACE.md`, `docs/PHASER.md`.

**Scope:**

In:

- A scrim rising over the chronicle screen lets go of the press the chronicle screen holds, whichever scrim: the overlay's — a card shown large, a browse, the aim window, the deal window, the capstone's window, the ending screen — and the menu's. Every hold the screen has: the hand's drag and a press on a card not yet dragged, the map's press whatever it holds — a unit or a population carried, a tile pressed, a pan in progress by either button, a press on the aim's catcher. What was carried comes home at once, unplayed and unselected; the release that comes later, under the scrim or off the canvas, lands as nothing on the chronicle screen. The scrim's own presses are as today. A scrim falling does nothing to any press, and a scrim rising over a scrim already standing does nothing either.
- The map's press is held by the button that landed it, let go of by that button's release or by an abandon alone. A second button pressed while one is held is a click of its own: nothing at its press, no pan, no let-go of the hold, and at its release a press on the tile under the pointer, the right one inspecting it in the infopanel and the left one selecting it, exactly as the same click on a clean screen. The same holds on the aim's catcher: a right click while a left press is held on it reports as a right press does today, and the left release chooses or refuses as today.
- The hand's drag outlives a second button's release: the `dragend` Phaser fires at a right release mid-drag is not the hand's release and plays nothing. The right click then shows the card large, its scrim rises, and the scrim's rule brings the card home.
- `e2e/press.spec.ts`, three tests, each on the runs the file already has and each watching the console:
  - _a card dragged when the menu rises comes home, plays nothing, and the release under the menu lands as nothing_: the card that plays at nothing lifted by hand as the blur tests lift it, Escape pressed; the menu stands, the card is back at its home, the hand unchanged; the left button let go; the hand still unchanged and the menu still standing; Escape closes the menu; the same card dragged out plays.
  - _a right click on a card being dragged shows it large and brings it home, and the release plays nothing_: the same lift, the right button pressed and released where the pointer is; the card shown large stands, the card is back at its home, the hand unchanged; the left button let go; the hand unchanged; Escape takes the card shown large down.
  - _a right click while a unit is carried inspects the tile under it and leaves the unit in hand, and the left release steps it there_: the worker run as `menu.spec.ts` uses it, the worker entered, the press taken on the city's tile and carried onto the run's tile, the right button pressed and released there; the infopanel shows a card, the unit still stands on the city's tile; the left button let go; the unit stands on the run's tile.
- The docs edits above, verbatim; `workflow/BRANCH.md` the clause, and the line deleted.

Out:

- The console: it has no scrim and the pointer is not its; a press held under it goes on.
- A second button on the menu's or the overlay's own objects — a browse's frame being dragged when a right click lands — is out of this line.
- The overlay and the chronicle screen as scenes: this line lands on today's one-scene chronicle screen with the two cover sources it has, and the overlay line carries the rule into its counted handler.
- Touch pointers.

Corner cases decided here:

- A pan in progress when the menu rises, by either button: let go of, the map staying where it was panned to; the release lands as nothing.
- A press on a hand card not yet dragged when a scrim rises: the release does not select the card.
- A unit carried while the end of turn plays out, the deal window or the capstone's window rising at its end: the unit comes home at the rise and the release under the window lands as nothing.
- A right click mid-carry of a unit over a lit tile: inspects that tile; the unit stays in the pointer's hand and the left release steps it there, or brings it home anywhere else. A right click mid-carry of a population: inspects the tile; the carry stands.
- A left click while a right press pans: selects the tile under the pointer at its release; the pan goes on for the right press.
- A second button still held when the first is released: the first's release resolves the hold as today; the second's release is its own click.
- A card dragged past the play height and right-clicked: shown large and brought home, not played.
- Escape mid-drag while a tile is selected or an inspection stands: the back key walks that back and raises no menu; the drag stands, since only a scrim lets a press go.
- The city key mid-carry of a population: as today, the carry goes with the marks.
- A scrim rising while nothing is held: nothing.

**Traps:**

- **The two covers reach the chronicle scene in `src/ui/chronicle-scene.ts`**: the overlay's `covering` callback and the menu's announcement through `resetMenu`. The overlay calls `covering(true)` at every show, a browse re-raised from a card shown large among them, while its scrim already stands; the `covered` flag already gates `dropTooltips` on the rise alone, and the let-go keys on the same rise.
- **The blur is the precedent**, `releaseOnBlur` in `src/ui/design-space.ts`: a window `mouseup` whose target is not the canvas is a release off the canvas to Phaser (`MouseManager.js:432`), so the hand's `dragend` reads `upElement` and comes home, the map's `pointerupoutside` abandons the hold, `onClick`'s press drops, and the browser's real release later lands as nothing, which the press spec's blur tests prove. A part-by-part let-go instead leaves Phaser's drag in flight and the map's taken button standing: `dragend` and `pointerup` still fire at the real release, and the map's release lands a tile press, or a command on the lit unit.
- **A synthetic release must not run inside Phaser's processing of the pointer event that raised the scrim.** The right click's inspect runs inside the right release's `processUpEvents`, and a nested `updateInputPlugins` walks the same plugin's lists mid-walk. The dispatch is synchronous, so a microtask runs after it. The menu's rise from the back key runs inside the keyboard's dispatch, not the pointer's, and the deal window's rise from a promise continuation.
- **Phaser ends the drag at any button's release**, the `docs/PHASER.md` entry above: the hand's `dragend` today reads no button, so a right release mid-drag plays the card at `src/ui/hand.ts:326-343` and then shows it large. After that `dragend` no `drag` comes, so the hand cannot follow the pointer on; the scrim's let-go is what brings the card home, and since Phaser's drag state is already over, a synthetic release fires no second `dragend` — the scene's `pointerupoutside` (`InputPlugin.js:2064-2075`) fires either way and is the one signal the hand can count on.
- **The map's `takePress` holds one button**, `src/ui/map.ts:684-717`, and a second button's press overwrites it; its release then reaches `on.release` with the grab still held and commands the unit at `:1447-1481`. The comment above `takePress` already states the rule this line lands. `pointer.button` names the released button on a release, and `pointer.buttons` says which still hold.
- **`onClick` on a hand card answers the right click at its release**, after Phaser's `dragend` for the same release: the order is fixed by `InputPlugin.js:754-756`.
- **`readMouseKeys` hears every window `mouseup` in capture**, `src/ui/keys.ts`: button 0 is never in its held set, so a synthetic left release passes through it untouched.
- **`hand.ts`'s `dragend` guard** `if (dragged === undefined) return;` is what makes a later `dragend` nothing once the hand has let the drag go.
- `menu-scene.ts:96`'s comment on never stopping the release stays true: Phaser skips the lower scene's drag end with a stopped release.
- Phaser re-checks what the pointer is over only on a move: a card brought home under a scrim raises no hover until the pointer moves after the fall, as the overlay dossier already settles.
- The hook flags a comment block over three lines under `src/` or `e2e/`.

**Plan:**

1. `docs/PHASER.md`: the entry. Leaves standing: the fact, cited.
2. `src/ui/map.ts`: the press held by the button that landed it, a second button's click of its own. Leaves standing: a right click mid-carry inspects and the carry stands; `e2e/move.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/inspect.spec.ts` green.
3. `src/ui/hand.ts`: a second button's `dragend` is not the hand's release. Leaves standing: a right click on a dragged card no longer plays it; the card hangs where it was until step 4.
4. `src/ui/chronicle-scene.ts`, and `src/ui/design-space.ts` where the blur's release is shared out: a scrim's rise from either source lets the held press go. Leaves standing: the three behaviours of the line.
5. `e2e/press.spec.ts`: the three tests. Leaves standing: the spec green.
6. `docs/INTERFACE.md`: the two sentences. `workflow/BRANCH.md`: the clause, the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/press.spec.ts`, and, the map's press and the hand's drag being paths they walk, `e2e/menu.spec.ts`, `e2e/move.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/inspect.spec.ts`, `e2e/deal.spec.ts`, `e2e/browse.spec.ts`; the whole suite on the push.
