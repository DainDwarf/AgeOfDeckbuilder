# Invert the order of growth and income

**Line:** **Invert the order of growth and income** — the end of turn runs growth right before income, after the hazard strike and the discard, and the two pages list the cycle in that order.

**Spec:** `docs/CHRONICLE.md` → _The turn_: items 5 and 6 swap places, so the numbered list reads 5. **Growth.** then 6. **Income.**, each item's text unchanged. `docs/GLOSSARY.md` → the **turn** row's cycle reads "events, draw, play, end, growth, income, enemy phase". No sentence is added anywhere: the pages state the order, not why it changed. No player-facing text.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:** In: the growth phase moves to right before income, after every hazard in hand has struck and the hand is discarded; nothing else in the end of turn moves. The growth rule itself is untouched: the threshold, the stock spent, one idle population, at most one a turn. Out: the growth threshold's formula and the food-based cards — the two board lines after this one. Corner cases: a city of no population with no food still falls at growth, now before any income is staged, so the flow of that defeat lists the grow group first and no income group at all; the resource bar reads food over the threshold as before, and no screen reads the order of the two groups.

**Traps:** The stage-order assertions in `src/rules/chronicle.test.ts`, `src/rules/enemies.test.ts` and `src/rules/city.test.ts` list `'income'` and its `'stock'` stages before `'grow'`; every one of them reorders. One test title in `chronicle.test.ts` retells the old order ("growth is staged right after the income it comes from") and is retitled to the new one. The docblocks on the end of turn in `src/rules/chronicle.ts` and on the group names in `src/rules/stages.ts` list the groups in the old order: the prose follows the new order and says nothing more. The UI switch sites that list `'income'` and `'grow'` together answer each group alike and do not read their order: no UI change. The `NO_GROWTH` fixture keeps the threshold out of reach and is unaffected. The e2e `play-out` spec reads the food reading over the threshold at the draw and does not depend on the order.

**Plan:**

1. `src/rules/chronicle.ts`: the end of turn stages `grow` before `income`, both still after the strike and the discard and before the enemy phase; docblocks follow.
2. The rules tests: the stage-order expectations reorder and the one title retitles; `npm test` green.
3. `docs/CHRONICLE.md` and `docs/GLOSSARY.md`: the two edits under _Spec_, then the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and the one spec `npx playwright test e2e/play-out.spec.ts`, which walks an end of turn with the food reading on screen.
