# Strata are Layers

**Line:** Strata are Layers — every stratum of the interface page's order is a Layer of its scene, created in that order, and every object is added to its Layer; the one-Layer homing, the depth table and every depth call go, a depth surviving only as a slot's index in the resting hand and a place in a flight; the lit glow moves between its two Layers, under the buildings and over the yield dim, and no Layer is ever reordered; `e2e/yields.spec.ts`, `e2e/move.spec.ts`, `e2e/settle.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/fog.spec.ts`, `e2e/play-out.spec.ts`, `e2e/hover.spec.ts`, `e2e/press.spec.ts`, `e2e/inspect.spec.ts` and `e2e/refuse.spec.ts` pass, the suite on the push. Doc-impact: none.

**Spec:** `workflow/BRANCH.md` _The design_: the tower table's `map` and `ui` rows, which list the strata in their order, and the _Strata are Layers_ paragraph. `docs/INTERFACE.md` _What stands over what_ states that order already and does not change. `docs/PHASER.md` _Scenes and stacking_ already says the stacking tool is the scene and the Layer inside it; no entry is added. Player-facing sentences: none. Nothing the player meets changes.

**Doc-impact:** none — the interface page states the order and the Phaser page the tool; this line makes the code read as both already do.

**Scope:**

In:

- The map scene's strata, one Layer each, created in this order: terrain, lit and glowed, buildings, units, fog, city mode's marks, the yield dim and what stays through it, the ring, the yield glyphs and the culture threshold, the infopanel, the map's refusal note, the map's tooltip. A stratum the map repaints in parts is one Layer holding Layers, in the order those parts stand today: the terrain holds the ground, the rim, the rivers, the features and the border; the buildings hold the improvements and the buildings; the glyphs and the threshold are two inside theirs. The press catcher and the aim's catcher stand on the terrain Layer.
- The lit and glowed stratum holds the tiles lit for a unit and the glow a card is aimed by; while the yield overlay stands, both move onto the dim's Layer, after the dim, and back under the buildings when it falls. Each is one Layer inside whichever stratum holds it, and the move is one add.
- The UI scene's strata, one Layer each, in this order: the band, the mode frame and chip, the piles and the resting hand, the resource bar, the end-turn button, the cards in flight, the lifted card, the aim line, the UI's refusal note, the UI's tooltip. The small cards' Layer is not created here; it comes with the line that draws small cards.
- A resting card of the hand carries its slot's index as its depth inside the resting Layer, a card in flight its place in the block inside the flight Layer, and nothing else under `src/ui/` carries a depth. A card lifted out of the lane, hovered or selected or dragged, stands on the lifted Layer and comes back onto the resting Layer with its index; a card leaving for the discard pile and a back coming off the draw pile stand on the flight Layer; the shuffle's carrier stands there too.
- A pile keeps its top card under its pill and its count at every repaint by order inside its Layer: the card a repaint stands is placed under the three, never on top of them. The how is the implementer's.
- Every factory adds what it draws to the Layer it is handed and nothing lands on a scene's own display list: the one-Layer homing of the two-scenes line goes, `src/ui/depths.ts` goes, the refusal note's depth option goes, and the tooltip's depth call goes. The overlay scene's three strata stay as they are.
- The tooltip on each surface keeps its name, `tooltip-map` and `tooltip-ui`, which the map and hover specs read: named after the scene, not after the Layer it stands on.
- The e2e harness does not change: it already recurses into Layers and reads every child under its scene's camera.

Out:

- The clip camera and its ignore lists: the mask line. The refusal note's `raised` callback stays until then.
- The menu, console and overlay scenes: the menu takes no Layer by design, the console holds one container, the overlay already has its strata.
- The small cards' Layer and the card-references dossier: the line after the mask.
- Any change to what the player meets, and any change to `docs/`.

Corner cases decided here:

- A group the map wipes on every render destroys its own children one by one: a Layer's remove-all destroys nothing, whatever flag it is handed.
- The ring's Layer carries the selected tile's key in its data as the container did; a Layer is a full game object and carries data.
- The infopanel, the threshold mark, a unit's marker and every card face stay containers: each moves as one, and none holds a Layer.
- The named groups the specs count by list length — the terrain, the border, the lit, the aim's glow, the buildings, the improvements, the units, the fog — keep their names on the Layers that replace their containers; a Layer has a list.
- The end-turn button's rolling label is added to the button's Layer after the button and its resting label, so it stands over both, as its depth put it.
- Two standings, the settle phase's and city mode's, share the mode Layer in the order they are created; they never stand at once on the same spot.

**Traps:**

- **A Layer's `removeAll(true)` destroys nothing and skips the remove callback** (`src/structs/List.js:484-494`, which the Layer extends, `src/gameobjects/layer/Layer.js:81`), where a container's `removeAll(true)` destroys every child (`src/gameobjects/container/Container.js:980`). The map calls the container form on eleven groups today. A Layer emptied that way leaks every child and leaves each one's `displayList` pointing at the Layer it no longer stands on.
- **Adding an object to a Layer takes it off the display list it was on** (`Layer.js:236-243`): the move between the lit Layer and the dim's, and a card's between resting, lifted and flight, is one add and no remove.
- **A Layer may hold a Layer and nothing else may** (`Layer.js:58-59`): a container never holds a Layer, and a stratum holding its repainted parts holds them as Layers.
- **A Layer is a game object since Phaser 4.1** (`Layer.js:61-62`, `:83-92`), with a name, data, visibility and depth, but no position, size or input: nothing that is positioned, scaled or hit-tested may become one.
- **The topmost object under the pointer is the last one the camera rendered** (`src/input/InputPlugin.js:2874-2890` sorts by the camera's render list), so Layer order alone decides which of two interactive objects in one scene takes a press; the infopanel's row zones beat the map's catcher because their Layer stands above the terrain's, and no depth is needed for it.
- **Equal depths inside one Layer draw in add order**, and a depth set on a child orders it within that Layer alone (`Layer.js:40-46`): the resting cards' indices and the flight's places order nothing outside their Layer.
- The tooltip names itself after the Layer it is handed today; the specs read `tooltip-map` and `tooltip-ui`.
- `src/ui/hand.ts` sets a depth in three places, `src/ui/piles.ts` in five, `src/ui/map.ts` in twelve including the lift over the dim, and `src/ui/chronicle-scene.ts`, `band.ts`, `standing.ts`, `resource-bar.ts`, `aim-line.ts`, `infopanel.ts`, `tooltip.ts` and `refusal-note.ts` once or more each; a grep for `setDepth` and `DEPTH` after the ship finds the two index uses and nothing else.
- `workflow/board/card-references.md` cites `src/ui/depths.ts` and its rows; that dossier is rewritten by its own line and is not touched here.

**Plan:**

1. The map scene: its strata created in order, the map view, the infopanel, the map's tooltip and the map's refusal note adding to theirs, the groups wiped by destroying their children, the lit and the glow moving between their two Layers. `npm run check` passes; the map specs named pass.
2. The UI scene: its strata created in order, the band, the standings, the piles, the hand, the bar, the end-turn button, the aim line, the note and the tooltip adding to theirs; the hand's and the piles' depths reduced to the two indices. `npm run check` passes; the UI specs named pass.
3. `src/ui/depths.ts` deleted, the one-Layer homing deleted, the refusal note's depth option and the tooltip's depth call gone; `npm run lint` finds no unused import. The branch line deleted.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/yields.spec.ts
npx playwright test e2e/move.spec.ts
npx playwright test e2e/settle.spec.ts
npx playwright test e2e/city-mode.spec.ts
npx playwright test e2e/fog.spec.ts
npx playwright test e2e/play-out.spec.ts
npx playwright test e2e/hover.spec.ts
npx playwright test e2e/press.spec.ts
npx playwright test e2e/inspect.spec.ts
npx playwright test e2e/refuse.spec.ts
```

The rest of the suite runs on the push. Then the visual check on the running app, which is the only reading of paint order: the terrain under the rings and the features under what is built on them; the yield overlay's dim over the tiles with the lit tiles and the ring bright through it; the fog over a charted tile's building and unit; the infopanel over every mark of the map; a hovered card over its neighbours and the piles, a dragged card over the button and the bar, a card leaving for the discard pile over the resting hand; the aim line over the lifted card; a refusal note over a hand card and one over a tile; a tooltip over everything on its surface.
