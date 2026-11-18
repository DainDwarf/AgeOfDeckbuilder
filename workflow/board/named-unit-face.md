# A named unit kind's face, proven

**Line:** A named unit kind's face, proven — no spec covers a unit kind named in a text (a raid's or the siege's "[enemy:…]", the Stone goal's "[player:scout]") shown as its unit's face; one needs a fixture that reaches such a text. Done-condition: `e2e/reference.spec.ts` holds two tests proving a unit kind named in a text raises, small at a rest, the face of a unit fresh of that kind in the halo of the faction the text names: the lean season's "Keep to yourself" naming "[enemy:warrior]", and Bow and Arrow's goal on the tree naming "[player:scout]"; both pass.

**Spec:** `docs/MAP-SCREEN.md`, the paragraph opening "A name on a card, or a mark at the foot of a card's window, that names a terrain or a feature…": "One that names a unit kind shows the infopanel's unit card of a unit fresh of that kind, of the faction the text names it for, small at a rest and large at a right click." `docs/INTERFACE.md`, the paragraph opening "A thing named in a card's text stands in brackets". Both stand as written; this line adds no sentence and no player-facing text.

**Doc-impact:** none — both pages already state the behaviour; the line only proves it.

**Scope:**

- In: two tests in `e2e/reference.spec.ts`, beside the existing named-thing tests.
  1. **Enemy.** The lean season dealt alone (`firstDealtAlone(LEAN_SEASON)`, the fixture the file's first test already uses). Its answer `ration` ("Keep to yourself") reads "Your [building:…] is attacked by N [enemy:warrior]". The pointer rests on the "[enemy:warrior]" name on that answer's face in the deal window; `small-card-0` stands the face of a fresh enemy warrior: its read (card, rules, numbers, art — as the file's `faceRead`/`faceSeen` compare) equals `freshUnitFace(CATALOGUE, 'warrior', 'enemy')`'s, and its window's unit wears the enemy's halo (`LOOK.enemy`) and the warrior's painting.
  2. **Player.** A fresh campaign with Bow and Arrow's needs learned (`learnedWithNeeds`, as the Tanning goal test builds its campaign), opened on the tree. The pointer rests on the "[player:scout]" name in the `plate-bow-and-arrow` goal ("Kill 3 units with a [player:scout]"); `small-card-0` stands the face of a fresh scout of the player's: its read equals `freshUnitFace(CATALOGUE, 'scout', 'player')`'s, and its window's unit wears the civilization's halo (`LOOK.civilization`) and the scout's painting.
- Out:
  - The right click showing the face large. Small cards and the large stack both take their face from `namedFace` in `src/ui/face.ts`, whatever the name's kind, and the card and terrain tests already prove the press.
  - The siege's "[enemy:leader]" / "[enemy:archer]". Reaching the siege capstone's text needs a Stone chronicle that drew it, and the face of a kind no card places (the leader's) is already proven on the infopanel by `e2e/inspect.spec.ts`, through the same `freshUnitFace` → `unitFace` path.
  - The UNIT label's tooltip being false on an enemy's face: an accepted fit in `workflow/LOOK.md`, not this line's.
- Corner case decided: which name in the ration text is hovered is found by its kind (the first reference of kind `enemy` among the text's names), not by a fixed index, as `namingAnswer` finds a card.
- Reconcile: test-only line; no standing player-facing job duplicates it. Whether `namingAnswer` is generalised by kind or a sibling helper is written is the implementer's.

**Traps:**

- The deal window lays its answers out as `deal-card-<at>`, `at` being the answer's place in `offered(CATALOGUE, deal)`, and a name is reached through `nameOnScreen(page, <face>, <index among the face's names>)` — the index counts every name the text draws, the building first in the ration text.
- The window's unit is read through a reading's `windowUnit` (`halo`, `paintedAs`); `paintedOn` in `e2e/chronicle-screen.ts` needs a tile, so the expected painting comes from `unitPaintingOf(type).painting` in `src/ui/marks.ts` directly. `e2e/inspect.spec.ts`'s unit test is the model.
- A warrior and a scout are placed by unit cards, so `freshUnitFace` returns the unit card's face with the stats of a fresh unit; the read compared must be built from `freshUnitFace`, not from `cardFaceAtStart`, or the stats line differs.
- The faction is all that sets the two named faces apart from a player's unit card shown elsewhere; a test that checks only `cardOnFace` proves nothing new — the halo assertion is the point.
- `docs/PHASER.md` for anything about hover timing; the file's existing tests poll `cardOnFace` after the move rather than waiting a fixed time.

**Plan:**

1. `e2e/reference.spec.ts`: the enemy test on the lean season, leaving the file's first test untouched.
2. `e2e/reference.spec.ts`: the player test on the tree, after the Tanning goal test.
3. Any helper the two need lives in the spec file, or in `e2e/chronicle-screen.ts` if another spec already reaches for the same thing.

**Verify:**

- `npm run check`, `npm run lint`.
- The proof: `npx playwright test e2e/reference.spec.ts`.
- CI proves the whole suite on the push; no other spec is touched.
