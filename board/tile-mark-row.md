# A feature's mark under an improvement's

**Line:** A feature's mark under an improvement's — the map draws a tile's feature and improvements in one row above its middle, the feature first, every mark of the row 10 px across, so Trapping on a game forest reads as two marks; `docs/CHRONICLE.md` says where a tile's marks stand, and the two specs that read the marks pass. Doc-impact: `docs/CHRONICLE.md`.

**Spec:** `docs/CHRONICLE.md` → _The screen_ → _The chronicle screen_. One paragraph added after the one beginning "**The ring stands undarkened over everything that darkens its tile**", verbatim:

> **A tile's marks stand in three places.** Its feature and its improvements stand in one row above its middle, the feature first and then the improvements in the order they were improved, the row centred whatever it holds; its building stands in the middle, and the unit on the tile over it; the mark of an assigned tile stands below the middle.

The numbers behind that sentence, settled on the mockup and not written into the page: the row stands 15 design px above the tile's middle, its marks 11 px apart centre to centre, and every mark of the row — feature and improvement alike — is 10 px across its larger dimension. No player-facing text is added or changed.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the placement of the feature mark and the improvement marks on a tile, and the size of those marks. Both are re-authored in the mark tables at 10 px across, the fewest vertices that tell the ids apart, flat polygons — one fill, one outline, no detail — under the placeholder dogma. Every feature and improvement id of both catalogues gets a mark: `PH_Fertile`, `fertile`, `game`, `flint`, `PH_Mine`, `PH_Road`, `trapping`. Stroke widths stay as they are: a feature's 1, an improvement's 2.
- In: the false claim in the map renderer's docblock that an improvement and a feature never share a terrain goes with the change. The design gives an improvement several terrains and a feature one, so they share a tile whenever the lists overlap.
- Out: the building mark, the unit mark, the assigned mark, the yield glyphs, the threshold, the rings, the scrims: none moves, none is resized. Out: any level of detail by zoom, any change to how a tile in fog is drawn (the row is drawn from whatever face the map draws, the snapshot's in fog).
- A tile with one mark in the row — an improvement with no feature, or a feature with no improvement — shows it centred, where a lone feature stands today. The row is centred whatever it holds, never anchored to a slot.
- A row of more marks than the tile is wide (four or more) grows outward at the pitch and spills over the neighbours. No content has it; no cap.
- The stand-in's mine and road on one tile stand side by side in the row, after the flint where the hills carry one, the improvements in the order the tile's list holds them.

**Traps:**

- Phaser centres a polygon on its bounding box (origin 0.5), so a mark's raw corners about its own centre draw displaced by half its box; `corners()` in `src/ui/design-space.ts` is what every mark goes through, and the row's slot is the box's centre.
- Phaser's WebGL stroke skips a polygon point whose origin-shifted position lands on the raw point before it, so a turned square outlined comes out open; `src/ui/map.ts` carries the comment at `diamond()`. No re-authored mark may be a turned square.
- `e2e/inspect.spec.ts` and `e2e/worker-instants.spec.ts` find a feature by the name `feature-<tile key>` and count the children of the `improvements` container; both names stay exactly as they are.
- `src/content/nomadic.test.ts` and `src/content/stand-in.test.ts` read every feature and improvement id through `featureMarkOf` and `improvementMarkOf`; a missing entry fails there, in Node, before any browser runs.
- The mark tables carry both the stand-in's `PH_` ids and the nomadic ids; both catalogues are drawn by the same tables.
- Marks keep drifting toward pictures (a standing ratchet): the fewest vertices that tell one id from the next, and nothing more.

**Plan:**

1. `src/ui/marks.ts`: the feature marks and the improvement marks re-authored at 10 px across. Leaves standing: every id resolves to a mark of the new size, and the two content tests pass.
2. `src/ui/map.ts`: the feature and the improvements of a tile placed in one row above its middle — feature first, then the improvements in the tile's order, centred, 15 px up, 11 px apart — with the rise and the pitch as constants, and the false terrain claim removed from the docblock. Leaves standing: the map draws a game forest with Trapping as two marks side by side; names and containers unchanged.
3. `docs/CHRONICLE.md`: the paragraph above, in place. Leaves standing: the page says where a tile's marks stand.
4. `BOARD.md`: the line deleted, and this file with it.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/worker-instants.spec.ts
npx playwright test e2e/inspect.spec.ts
```

Then the `visual-check` skill on the running app: a tile carrying a feature and an improvement at zoom 1 and at the furthest zoom out — the marks stand apart, neither one under the other, and nothing else on the tile moved.
