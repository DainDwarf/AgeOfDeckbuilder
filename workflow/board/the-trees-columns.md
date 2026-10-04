# The tree's columns

**Line:** **The tree's columns** — the Stone Age's four doors are declared in the order their column stands in, Herbalism, Agriculture, Trapping, Fire, their achievements in the same order, and `docs/ages/STONE.md` lists them so. Doc-impact: `docs/ages/STONE.md`.

**Spec:** `docs/META-SCREENS.md`, _The campaign screen_, stands as it is: "Every column is centred on the room's middle, its technologies in the content's order". The tree's display does not change; the line ends on the tree's order alone. In `docs/ages/STONE.md`, _The technologies_:

- The opening paragraph gains a second sentence, after "…with the deck the age opens on.": "The technologies are declared in the order the tree stands them in, column by column and each column top to bottom, and stand here in that order."
- The four bullets stand in the order Herbalism, Agriculture, Trapping, Fire, each bullet's words unchanged.

No player-facing sentence is added or changed.

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:**

- In: the order the four doors are declared in, their achievements' with them, and the age page's order.
- Out: the tree's display, the plates, every gesture, the layout code. Rows that open into plates and columns pushed on were weighed and left: on the settled tree the tallest column holds five technologies, and five of today's plates stand 638 of the room's 672 tall. The limits that keeps true are in `workflow/board/stone-age-pool.md`, _The frame_, and are read by the technologies' lines, not by this one.
- Out: the twelve technologies not yet in the catalogue. Each is declared where its column holds it by the line that lands it; the order is in the pool's skeleton.
- The achievements are re-declared in the doors' order so that what reads a chronicle's achievements in their declared order reads them as the tree stands them. Decided here.
- No test and no spec asserts the order: it is content, and its checkable state is the content standing in the catalogue, the coherence test passing and the age page saying so.
- Saves from before the reorder need no care.
- Reconcile: the job "a column stands in an order" is done by the standing rule and the standing layout, the content's order read as declared; the line goes through it as it is, and nothing is added beside it.

**Traps:**

- The tree reads a column's order from the key order of the catalogue's technologies (`src/ui/tree-layout.ts`), which `merged` (`src/rules/catalogue.ts`) builds slice by slice in declaration order. The order of the keys in `src/content/stone.ts` is therefore the order on screen, and nothing at the table says so: a trap comment there is in order, three lines at most.
- A chronicle's achievement rows follow the age's declared achievements (`src/rules/chronicle.ts`, where the rows are built from `Object.entries` of the age's achievements); the launch screen's Continue, the launch warning and the ending read them in that order.
- `e2e/pin.spec.ts` takes the first two available technologies in the catalogue's order: after the reorder they are Herbalism and Agriculture. The spec is written against whichever they are; CI proves it.
- Whether the catalogue's version moves with a reorder is read at the ship.

**Plan:**

1. `src/content/stone.ts`: the technologies re-declared Herbalism, Agriculture, Trapping, Fire, and the achievements in the same order; this leaves the Stone Age's first column standing in that order, top to bottom, and the catalogue's coherence test passing.
2. `docs/ages/STONE.md`: the sentence added and the bullets reordered, as the Spec writes them.
3. `workflow/BOARD.md`: the line deleted, and this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No proof spec: the order is content. CI proves on the push `e2e/tree.spec.ts`, `e2e/pin.spec.ts`, `e2e/launch.spec.ts`, `e2e/launch-warning.spec.ts`, `e2e/continue.spec.ts` and `e2e/ending.spec.ts`.
