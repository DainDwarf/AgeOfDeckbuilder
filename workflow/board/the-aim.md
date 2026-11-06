# The aim

**Line:** **The aim** — every tile a card being aimed admits wears the selection's rim, the same image and line as the selected tile's, over every dim and never darkened by the fog; the flat glow per tile is gone, and the lit tiles' ledger entries with it; `e2e/settle.spec.ts` and `e2e/hand-aim.spec.ts` pass. Doc-impact: `docs/LOOK.md`.

**Spec:** the mockup of 2026-11-06, https://claude.ai/artifact/8tNviGxr9XTQL8JqAXRoxR, and the user's word: "the same as selection's rim". The page sentence, `docs/LOOK.md`, _The map_, added to the end of **The selection**, written out:

> The tiles a card being aimed admits wear that same rim, each its own, since the card lifted out of the hand is the selection and they are where it lands; the two never stand together on the map. What tells them apart at rest is nothing; in motion, the aim's rims are to breathe faster than the selection's, which is Motion's.

`docs/CHRONICLE-SCREEN.md` stands as it reads: "lights the tiles its aim admits" in _The hand and the aim_, "the tiles a card is aimed at" in _The yield overlay_, both still true.

No player-facing text.

**Doc-impact:** `docs/LOOK.md`.

**Scope:**

- In: the tiles `aimTile` is given (a card's admitted tiles; the tile clicked and the units' tiles beside it on the second aim of a card played through one of several units), each wearing the selection's rim and line, in the `aim-lit` group lifted over the yield overlay's dim as today; the glow per tile gone.
- Out: the unit aim's mark on the token (the pieces rung), the breath (Motion), the unit's reach and the enemies' glow (their own lines).
- A tile the map draws in fog that a card admits wears the rim undarkened, as the selection does: the screen's answer, not the tile's. The map lights only the tiles it draws, as today.
- The look ledger: the aim reads `selected`, `selectionRim` and `selectionLine`, the selection's own entries, one meaning: the selection's answer. No new entry. `lit` and `litGlow` are read by nothing once the reach line has shipped and this one lands, and are deleted here; `asGlow`, `glowTile` and `unreadGlow` stay for the enemies' and the prepared tile's glows.
- The reconcile, settled 2026-11-06 on the user's word:
  - The selection's rim and line (`selectionRim` in `src/ui/map-fade.ts`, the `selected` group's rim image and `selectionLine` polygon in `src/ui/map.ts`): **become one**, the projected through the standing. The rim's canvas texture is painted once under its key and any number of images can wear it; the aim's tiles are one image on that texture and one line polygon each, made as the selection's are. Whether they come from a pool or are made per aim is the implementer's; today's aim glows are made per aim and destroyed with the group.
  - Today's glow per admitted tile (`glowTile` with `LOOK.lit` and `LOOK.litGlow` in `aimTile`): **goes**.
  - The harness: `marksIn(page, 'aim-lit')` in `e2e/settle.spec.ts` counts the `aim-lit` group's shown children against the admitted tiles. One container per tile holding its rim and its line keeps that count; two bare objects per tile would double it. The container carries the tile's key as its `tile` datum, as a glow does today.
- This line ships after the reach: the reach's dossier leaves `lit` and `litGlow` standing for the aim, and this one takes them down.

**Traps:**

- `docs/PHASER.md`, _Across a restart_: a texture is the game's and outlives the scene; `sceneCanvas` in `src/ui/map-fade.ts` makes the rim's texture once per scene and removes it at shutdown, so the aim's images take the texture by its key and never paint a second one. _Rendering under WebGL_: a Polygon stroke of 1 unit is drawn a segment at a time; the selection's line is one already.
- The rim image is shown at a quarter of its texture (`RIM_PIXELS`) and set at the tile's position; the selection's line is a hexagon just inside the face (`TILE_SIZE - 0.5` as the selection draws it, read off `map.ts` at the ship).
- The `aim-lit` group is added to `overDim` and lifted onto the dim's stratum while the overlay shows; a rim left outside that group is covered by the dim.
- `DOGMAS.md` _Code_: every colour and strength through the look ledger; an entry nothing reads is deleted, never left.

**Plan:**

1. `src/ui/map.ts`: `aimTile` dresses each admitted tile in the selection's rim and line, one container per tile in the `aim-lit` group with its `tile` datum, through the rim's texture and the line as the selection makes them (shared with the `selected` group's making, where the implementer finds it cleanest); the glow per tile goes. Leaves standing: the aim's presses, the lift over the dim, `e2e/settle.spec.ts` green.
2. `src/ui/look.ts`: `lit` and `litGlow` deleted, with their type lines.
3. `docs/LOOK.md` as the Spec says; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/settle.spec.ts`; `e2e/hand-aim.spec.ts` for the aim's presses and the second aim, `e2e/yields.spec.ts` for the dim sparing the aim's tiles; CI proves the whole suite on the push.
