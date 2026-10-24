# Production's prices

**Line:** Production's prices — every production price in the content stands at the table below, the catalogue's coherence test passes, the economy baseline is rerun on the new prices and `ECONOMY.md` reads from it, and the `BALANCE.md` entry is gone.

**Spec:** the design pages hold no number, so the spec is this table, the user's own rewrite of a ×2 sweep served on 2026-10-24: roughly ×1.5 on what a worker builds or places, ×2 on the rest.

| Where | Today | New price |
| --- | --- | --- |
| Farm, Tannery, Megalith, Fishery (`src/content/stone.ts`) | 4 | 6 |
| Trapping, Irrigation, Pasture, Clay pit (`stone.ts`) | 2 | 3 |
| Embark (`stone.ts`) | 1 | 1, unchanged |
| Foundations, Great stones (`stone.ts`) | 4, 8 | 8, 16 |
| Cold night, the hazard's price (`stone.ts`) | 3 | 6 |
| Flood, digging channels (`stone.ts`, `channels`) | 3 per thing the flood would take | 6 per thing |
| Shelter (`src/content/nomadic.ts`) | 8 | 12 |
| Hunger, the hazard's price (`nomadic.ts`) | 2 | 4 |
| Wildfire, the firebreak (`nomadic.ts`, `wildfireTakes`) | 2 per five turns | 4 per five turns |

What stays as it is: everything production is given by rather than paid in — Gather's yield, Bone tools, Goods trade, Their stores, Stores — and the strikes that take production as a harm, the Tribute's counter and Weary builders. No card text changes: a card reads its cost from the content.

The two `workflow/` pages that follow the numbers:

- `workflow/BALANCE.md`: the _Across the ages_ entry "Production is under-valued" is deleted, and the section with it if it holds nothing else.
- `workflow/ECONOMY.md`: the opening paragraph's "Measured on 2026-10-23 at commit e2693ae" becomes the rerun's date and the ship's commit; the two tables under _What the baseline says_ are rewritten from the rerun's rows through the page's own recipes, the ending medians and the builder's cards played; the sentence under them about heal and march is rewritten from the rows or deleted if the rows no longer bear it. The page's cell, decks, split and queries stay as they are.

**Doc-impact:** none — the `docs/` pages name which resource a thing costs, never how much.

**Scope:** in — the table above, the baseline rerun, the two `workflow/` pages, the chart's data rebuilt. Out — any new sink, any unit priced in production, any event price with events on: the sweep ran the economy cell, events and capstone off, so the hazard and answer prices follow the cards by the user's table and are measured by play. Out — a rules change of any kind. The Nomadic rows are in on coherence alone, unmeasured: the first civilization holds no production card. The ×1.5 on the cards is unmeasured too (the sweep ran ×1, ×2, ×3, ×4, ×6); the baseline rerun is its measurement, read at the hand-back beside the sweep's page, <https://claude.ai/artifact/2aKAwKfHRE76sqQ8kprnZ4>. Reconcile: nothing to reconcile, a number changes in place.

**Traps:**

- `channels` in `stone.ts` carries a docblock naming "three for each thing"; the number moves with it, and the docblock is a paraphrase of the line below it, so it may go. `wildfireTakes` in `nomadic.ts` likewise names its formula in prose above it.
- `e2e/neutral.spec.ts` (around line 524) pays the neutral's first building card out of a tile's yield in a loop of turns read off the catalogue, so it adapts to the farm's new price by playing more turns; it is CI's, never run from a session. Every other spec that plays a priced card reads the cost through `cardOf(CATALOGUE, …).cost` and pays it with `gained`, so no spec holds a literal to update.
- The economy baseline's rows under `workflow/economy/` describe the game before the upkeep shipped (ee9369f), not only before this line; the rerun replaces them whole. The chart template, `workflow/economy/chart/template.html`, names the run's date in its cell line (line 140); the baseline page says a new baseline edits it.
- The rerun's cells, flags and split are written in `ECONOMY.md` _The cell_; the split needs the node entry `node tools/sim.ts`, eight processes at a time, about eight minutes for the six cells, run in the background. The builder's three cells and the warlord's three each take `--every 1`.
- The chart's republish to <https://claude.ai/artifact/5rvYcBwnhYHbz9Dgi5wcbX> needs the Artifact tool, which the implementer lacks: the implementer runs the two `COPY` queries and `compact.mjs` from the page's _The chart_ section into its scratchpad and names the HTML's path in its report; the ship session republishes it with the page's URL as `url`.
- `src/rules/state.ts` carried a throwaway price patch during the sweep; it is reverted and the tree is clean at this dossier's commit. A `git status --porcelain src/rules` printing anything at the ship's start is a finding.

**Plan:**

1. The prices in `src/content/stone.ts` and `src/content/nomadic.ts` as the table says, `channels` and `wildfireTakes` included; `npm run check`, `npm test`, `npm run lint` green.
2. The baseline rerun: the six cells of `ECONOMY.md` _The cell_ into a scratchpad folder per cell, then the folders under `workflow/economy/` replaced, `chart/` left standing.
3. `ECONOMY.md`'s measured-on line and its two tables rewritten from the rows through the page's recipes; the chart's JSON exported and compacted into the scratchpad, the template's date line edited.
4. `BALANCE.md`'s entry deleted; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — the line reaches the screen through numbers the card face reads from the content, and no spec asserts a literal price. CI proves on the push every spec that plays a priced card: `farm`, `irrigation`, `tannery`, `fishery`, `monument`, `flood`, `long-winter`, `pillage`, `pin`, `neutral`, `refuse`, `worker-instants`.
