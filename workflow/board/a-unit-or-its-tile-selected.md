# A unit or its tile selected

**Line:** **A unit or its tile selected** — a left click on a tile a unit stands on, in sight or kept in fog, selects the unit, a click on the selected unit selects its tile, and a click on that tile selects the unit again or, on the player's city's own tile, enters city mode; an inspection of the selection opens on the card of what is selected; `e2e/unit-ring.spec.ts` proves it and the three pages say so. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`.

**Spec:**

`docs/INTERFACE.md`, _The presses_:

- "**The selection is one thing, a tile or a card, and the left click makes it.**" becomes "**The selection is one thing, a tile, a unit or a card, and the left click makes it.**" The rest of the paragraph stands.
- In the closing paragraph, "**Select** is the tile the map rings, the card lifted out of the hand, or the card ringed in a window" becomes "**Select** is the tile or the unit the map rings, the card lifted out of the hand, or the card ringed in a window".
- _The debug console_'s `unit` paragraph stands as written: "where the selection is not a tile" now covers a selected unit.

`docs/CHRONICLE-SCREEN.md`, _The right click, the back key and the menu_:

- "a tile it lands on afresh comes up at its first card." becomes "a tile it lands on afresh comes up at its first card, the selection's own tile excepted: there an inspection, by the right click and by the inspection key alike, comes up at the card of what is selected, the unit's for a unit and for a tile the first of the tile's own, and steps on through every card the tile holds."

`docs/CHRONICLE-SCREEN.md`, _The map's presses_, the first paragraph:

- "Out of city mode a left click on a tile selects it: the map rings it, or rings the unit standing on it in sight in the tile's place, whoever's it is, and, when that unit is the player's, lights every tile its move points reach, as one region with its own tile among them, and glows, in the enemies' own colour, every unit its attack reaches." becomes "Out of city mode a left click on a tile selects it, and the map rings it; on a tile a unit stands on, in sight or kept in fog as last seen, it selects the unit, whoever's it is, and the map rings the unit. A left click on a selected unit selects its tile in its place, and one on a tile selected under a unit selects that unit again, so successive clicks there switch between the two, the unit first. A selected unit of the player's lights every tile its move points reach, as one region with its own tile among them, and glows, in the enemies' own colour, every unit its attack reaches; a tile selected under a unit lights and glows nothing."
- "A unit that lights or glows anything is being aimed from the moment its tile is selected, at the tiles it lights and the units it glows: nothing of that kind is refused, and a click on any other tile, its own excepted, lets it go and selects that tile." becomes "A unit that lights or glows anything is being aimed from the moment it is selected, at the tiles it lights and the units it glows: nothing of that kind is refused, a click on any other tile lets it go and selects that tile or the unit on it, and a click on its own tile lets it go for that tile."
- "A unit with no action left glows nothing, and a press on the enemy beside it selects that tile like any other." becomes "A unit with no action left glows nothing, and a press on the enemy beside it selects that enemy like any other unit."
- "A second left click on a selected tile changes nothing, the player's city's own tile excepted. Nothing more." becomes "A left click on a selected tile no unit stands on changes nothing, the player's city's own tile excepted: a left click on that tile selected enters city mode, a unit standing on it or not. Nothing more."

`docs/CHRONICLE-SCREEN.md`, _City mode_:

- "In **city mode** a left click on a tile selects it as anywhere else, the tile wearing the selection whoever stands on it, and lights no unit: no press there moves one or attacks with one." becomes "In **city mode** a left click on a tile selects the tile, whoever stands on it and never the unit, and lights no unit: no press there moves one or attacks with one."
- "It is entered by the **city key**, by a second left click on the player's city's own tile, or by pressing culture or idle on the resource bar" becomes "It is entered by the **city key**, by a left click on the player's city's own tile once that tile is selected, or by pressing culture or idle on the resource bar".

`docs/LOOK.md`:

- _The selection_: "A selected tile a unit stands on in sight wears no rim, and a card aimed at a unit lights no tile: the unit wears its ring." becomes "A selected unit's tile wears no rim, the unit wearing its ring, and a tile selected under a unit wears the rim as any tile does, the unit no ring; a card aimed at a unit lights no tile."
- _A unit's ring_: "The unit standing on the selected tile, and each unit a card aimed at a unit admits, wears a ring on the ground under it" becomes "The selected unit, and each unit a card aimed at a unit admits, wears a ring on the ground under it". And "A unit a tile in fog keeps as last seen wears none, and neither does a unit on the infopanel." becomes "A unit a tile in fog keeps as last seen wears it while selected, undarkened as in sight, and a unit on the infopanel wears none."

No player-facing entry is new.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`.

**Scope:**

In: what a left click on a unit's tile selects, the three clicks in a row, the ring on a unit kept in fog, the card an inspection of the selection opens on, the specs those gestures run through.

Out: how a selected unit reads apart from a selected tile beyond ring and rim (Motion's, in the look's pool); the attack's mark and a unit's own states (their board lines); any change inside city mode.

Decided here, by the user unless said otherwise:

- The clicks on one tile, in a row. A tile with a unit: the unit, the tile, the unit again, and so on. The player's city's own tile with a unit: the unit, the tile, city mode. That tile bare: the tile, city mode, as today. The user took the uniform rule over keeping city mode on the second click.
- Every unit switches, whoever's it is, and so does a unit kept in fog as last seen, on the user's word. A unit in fog lights nothing, glows nothing and is never dragged, being never the player's.
- A tile selected under a unit wears the rim; the unit wears no ring, lights nothing and is not being aimed. A click on any other tile then selects that tile or the unit on it. A drag still takes a unit of the player's from there, lighting from the start of its drag and leaving the tile selected: let go beside the lit tiles, the unit comes home, nothing is lit and the tile stays selected; let go on a lit tile, it is the step, and the selection follows the unit as after any step.
- The switch is a new selection like any other: it drops the inspection, and a unit being aimed is let go, its reach, its glow and its path coming down.
- The back key on a tile selected under a unit drops the selection; it does not step back to the unit.
- After a step or an attack the unit is the selection, where it stands. After the city's act or a population carried in city mode, the tile is.
- City mode is untouched: the tile is selected whoever stands on it, and entering or leaving the mode drops the selection as today.
- A card being aimed filters the click first, as today, and a card aimed at a unit rings what it admits as today.
- An inspection of the selection, by the inspection key or by a right click on the selection's own tile, opens on the card of what is selected: the unit's card for a unit; for a tile selected under a unit, the card after the unit's, the building's where the tile holds one and the terrain's otherwise. It then steps through every card the tile holds, the unit's among them, and wraps. A right click on any other tile opens on its first card, as today. An inspection already standing on a tile steps on from where it stands, as today, whatever is selected. The user took the one cycle with a different start over a cycle split in two.
- The debug console's `unit` entry: with a unit selected it answers `no tile selected`; with the tile under a unit selected the tile refuses it as today.
- A selected unit whose tile a render leaves drawing no unit, a veil switched under it, leaves its tile selected in its place. Claude decided this corner at the dossier.

Reconcile, all taken as recommended:

- A tile selected under its unit and city mode's selection become one: a single answer to whether the unit or its tile is selected, city mode always answering the tile. What differs and is meant is what a drag takes, the unit out of the mode and the population in it.
- The unit giving way to its tile, and the tile giving back to its unit, go through the standing click on the selection as it is, beside the card played, the deal's choice, the city's act and the city's own tile entering city mode.
- The unit let go by its own click goes through the standing new selection as it is, the one a click on another tile takes.
- The opening card goes through the one place the infopanel is shown, as its parameter.
- The selection after a unit's command goes through the standing one as it is, now meaning the unit.
- The ring on a unit kept in fog is the unit's ring as it is, undarkened.

**Traps:**

- This line ships after "A unit in fog read as last seen": the card a selected unit in fog opens on is that line's.
- `src/ui/chronicle-scene.ts` keeps the selection as a tile, and its `select` returns at once when the tile named is the one already selected: the switch is a change on that same tile. Its `commandUnit` selects by the tile the unit stands on after a play-out, `act` and `reassign` by the tile in city mode, and the console's `unit` entry reads the selection's tile.
- `src/ui/map.ts` decides ring or rim in `paintRings` from whether a unit stands in sight on the selected tile and city mode is off, and `lightUnit` lights whichever unit of the player's stands on the tile it is handed. `lightUnit` is called with the selection from the render, from `markSelected`, from `showCityMarks`, and from `src/ui/map-grab.ts` each time a press lets a unit go: every one of those must light nothing while the tile is what is selected.
- `wearerOn` in `src/ui/map.ts` answers no unit for a tile not drawn live, which is why a unit in fog wears no ring today.
- `unitBeingAimed` reads what the map has lit, and the scene's left-click door reads it to let a unit go under a click on a thing of the UI.
- A click answers as it is let go, never as it lands (`docs/INTERFACE.md`, _The presses_; `e2e/held-press.spec.ts`): the switch comes at the release.
- The scene reads what the pointer is on in a microtask, outside Phaser's dispatch (`docs/PHASER.md`, _Input across scenes_); a spec rests before it presses (`docs/PHASER.md`, _Under a Playwright spec_).
- The ring is pooled and the rim made once (`DOGMAS.md` _Stack_): nothing is destroyed to be drawn again.
- `e2e/chronicle-screen.ts`'s `ringedTile` reads the tile the map was told is selected, and `ringsAndRims` the rings and rims drawn: between them a spec tells a unit selected from its tile selected.
- Specs whose gestures this line changes, each corrected to the new design and none loosened: `e2e/city-mode.spec.ts`, "a second left click on the city’s own tile enters city mode, and on any other tile changes nothing", where the count of clicks depends on whether its fixture stands a unit on the city; `e2e/unit-ring.spec.ts`, its first test, whose city tile carries a unit; `e2e/fog.spec.ts`, the test that clicks the tile in fog and steps its cards; `e2e/inspect.spec.ts`, wherever a selected tile carries a unit; `e2e/console.spec.ts`, the `unit` entry on the tile selected.

**Plan:**

1. `src/ui/chronicle-scene.ts`, `src/ui/map.ts`, `src/ui/map-grab.ts`: the screen's selection tells a unit from its tile, in one answer the ring, the rim and the reach all read, city mode always answering the tile. This leaves a first click on a unit's tile looking and working as today.
2. The click on the selection: a selected unit gives way to its tile, and that tile gives back to its unit or, on the player's city's own, enters city mode.
3. A unit kept in fog is selected first and wears the ring.
4. An inspection of the selection opens on the card of what is selected.
5. `e2e/unit-ring.spec.ts` gains the tests of the three clicks on a plain tile and on the city's own, of a unit in fog, and of the opening card; the specs named in Traps are corrected.
6. `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`, `docs/LOOK.md`: the sentences of the Spec. The board line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/unit-ring.spec.ts`. CI proves on the push: `e2e/city-mode.spec.ts`, `e2e/inspect.spec.ts`, `e2e/fog.spec.ts`, `e2e/console.spec.ts`, `e2e/press.spec.ts`, `e2e/held-press.spec.ts`, `e2e/move.spec.ts`, `e2e/attack.spec.ts`, `e2e/path.spec.ts`, `e2e/map-order.spec.ts`, `e2e/hand-aim.spec.ts`, `e2e/heal.spec.ts`, `e2e/archer.spec.ts`, `e2e/neutral.spec.ts`, `e2e/embark.spec.ts`.
