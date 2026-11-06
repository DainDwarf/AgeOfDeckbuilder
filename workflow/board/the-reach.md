# The reach

**Line:** **The reach** — a selected unit's landings this turn are drawn as one region over his ground, a line along its edges and a band fading inside it in the selection's white, the unit's own tile among them; the flat glow per landing is gone, the aim's and the enemies' glows untouched; `litTiles` and `marked` in `e2e/chronicle-screen.ts` read the landings off the region, and `e2e/press.spec.ts` and `e2e/archer.spec.ts` pass. Doc-impact: `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** the mockup picked on 2026-11-06, https://claude.ai/artifact/FM8du8LM2U16Uo4ZYyUT5o: "one outline round the region, a band inside, white, the selection's, strength 60%, band 5, a thin line in the colour, the unit's own tile inside, a tile that spends every point reads as the rest". The pages:

- `docs/LOOK.md`, _The map_, a paragraph after **The selection**, written out:

  > **The reach.** A selected unit's landings this turn, the unit's own tile among them, are one region: a line along its edges, corner to corner and straight, in the selection's white, 1 unit wide at 90%, and inside it a band of that white, 60% at the line and fading bell-shaped over 5 units as the selection's rim fades. A tile one of the player's own units holds is crossed and never offered, so the region wears a hole around it, and a region can be several pieces. It is drawn over the ground and the border and under the pieces, and is never darkened by the fog, being the screen's answer as the selection is; under the yield overlay the dim spares it. A tile that spends every point the unit has left reads as the rest. The enemies the unit can attack glow as they do.

- `docs/CHRONICLE-SCREEN.md`, _The map's presses_: "lights every tile its move points reach and glows" becomes "lights every tile its move points reach, as one region with its own tile among them, and glows". Every "lit tile" sentence after it stands as it reads.
- `docs/CHRONICLE-SCREEN.md`, _The yield overlay_: "the tiles lit under the ring" becomes "the reach's region".

No player-facing text: the mark has no word on screen, so the glossary's rule against "reach" as a synonym of range does not bite.

**Doc-impact:** `docs/LOOK.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

- In: the landings' region for a unit of the player's on the selected tile, out of city mode, as `lightUnit` lights them today: its drawing, its lift over the yield overlay's dim, and the e2e harness reading the landings off it.
- Out: the enemies glowed (the offensive glow line, `LOOK.targetGlow` untouched), the prepared tile (same), a card's aim (the aim line: `aimTile`, the `aim-lit` group, `LOOK.lit` and `LOOK.litGlow` stay the aim's), the unit aim's token mark (the pieces rung), the path and the breath (Motion).
- The region is the rules' landings plus the unit's own tile. `reachable` crosses a tile one of the player's own units holds and never offers it, so a hole or a second piece is what the rules say, drawn as such.
- Never darkened by the fog: a scout's landing can lie in fog (charted, out of sight); the region is drawn whole and bright over it.
- Under the yield overlay the region is lifted onto the dim's stratum as the lit tiles are today (`overDim`, `liftOverDim`): the dim spares it.
- The look ledger: the reach reads `LOOK.selected` (the user's pick, "white, the selection's"); two new entries, the band's strength at 0.6 and the line's at 0.9, named for the reach. `LOOK.lit` and `LOOK.litGlow` stay, the aim's until its line. `LOOK.borderBand` is a different meaning at the same number and stays apart.
- The reconcile, chosen with the user on 2026-11-06:
  - The border's drawing (`src/ui/border-loops.ts`, `src/ui/map-border.ts`, `paintFaded` in `src/ui/map-fade.ts`): **become one**, in the projected form. The loop finder splits into the edge loops, shared, and the curving, the border's alone; the band painter and the line take the colour, the strength, the depth and the shape (curved or straight) as parameters. The reach keeps a canvas texture of its own: it redraws on every selection, the border on a claim, and the border's cache (`drawnFrom`) stays as it is.
  - The selection's rim (`selectionRim`): **stay apart**. Both already go through the one fade; a tile painted once is not a loop painted per selection.
  - Today's glow on the landings (`litPool`, `asGlow` with `LOOK.lit`): **goes** for the landings; the pool keeps serving the targets' glow.
- The e2e harness: `marked().lit` counts and `litTiles` lists the children of the `lit` group with a `tile` datum, landings and targets alike, in `e2e/press.spec.ts`, `e2e/inspect.spec.ts`, `e2e/archer.spec.ts`, `e2e/neutral.spec.ts`, `e2e/city-mode.spec.ts`. The region's objects stand in that same group and carry the landings' keys as data (one key each, or one list), and the two readers in `e2e/chronicle-screen.ts` read them so those specs' assertions keep their meaning: a count of landings plus targets, a sorted list of their keys. `marksIn(page, 'lit')` at 0 in city mode must still read 0, so the region's objects are hidden, not left standing empty, while nothing is lit.

**Traps:**

- `docs/PHASER.md`, _Rendering under WebGL_: a Graphics has no curve and no clip of its own, and a canvas texture's context has both; mipmaps come only at a power-of-two size; a canvas texture is cleared on its own context and uploaded once by `refresh`; a Graphics joins the segments of a stroke only above a width of 2; a Graphics keeps every command in its `commandBuffer`, which `borderColours` in the harness walks. _Across a restart_: a texture is the game's and outlives the scene, so a key still in use refuses `createCanvas`; `sceneCanvas` in `src/ui/map-fade.ts` is the door that removes it at shutdown.
- `paintFaded` draws its strokes without the context's `filter` because Safari ships it disabled; the mockup used the filter, and the fade's numbers (strength at the line, depth) are the same in both.
- The band is painted at a pixel to the unit on the border's canvas over the whole disc; the selection's rim is painted at four pixels to the unit and shown scaled. The reach's band at one pixel to the unit reads as the border's does, which the user accepted shipped.
- `liftOverDim` moves whole groups between strata: the region's objects must live in the `lit` group (or a group added to `overDim`), or the yield overlay's dim covers them.
- The e2e readers count children of the `lit` group that are shown: a pooled object hidden by `setVisible(false)` is not counted, one shown with no datum breaks `litTiles`.
- `DOGMAS.md` _Code_: every colour and strength through the look ledger, one entry per meaning; a comment is for a trap only.

**Plan:**

1. `src/ui/border-loops.ts`: the loop finder hands the edge loops, straight corner to corner, and the curving becomes a step the border applies; `src/ui/map-border.ts` reads as before. Leaves standing: the border drawn as it ships, `npm test` and `e2e/map.spec.ts` green.
2. `src/ui/map-fade.ts` and `src/ui/map-border.ts`: the band painter and the line stroker take the colour, the strength, the depth and the shape; the border passes its own. Leaves standing: the same.
3. `src/ui/look.ts`: the reach's two entries.
4. `src/ui/map.ts`: `lightUnit` paints the region through the shared painter on a canvas of its own, in the `lit` group, hidden when nothing is lit, the landings' keys as data; the landings' glow leaves the pool. Leaves standing: the targets glowed as today, the region lifted over the dim with the group.
5. `e2e/chronicle-screen.ts`: `marked` and `litTiles` read the landings off the region and the targets off the glows.
6. `docs/LOOK.md` and `docs/CHRONICLE-SCREEN.md` as the Spec says; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/press.spec.ts`; `e2e/archer.spec.ts` and `e2e/neutral.spec.ts` for the readers, `e2e/city-mode.spec.ts` for the hidden region, `e2e/map.spec.ts` for the border untouched; CI proves the whole suite on the push.
