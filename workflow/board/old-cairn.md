# The old cairn

**Line:** **The old cairn** — the second site, a grave under a heap of stones standing on the city's ground in every region of both ages, each age's building its own under one name; it deals **Honour the dead** in the Nomadic Age, and in the Stone Age **Honour the dead** against **Dig the graves**, each age's lore its own; with it the painted cave's building split the same way, one per age, the Nomadic cave's lore closing on no question. Done when the cairn stands in both ages' content on every region, the cave's building is one per age with a lore each, the coherence test passes, `e2e/sites.spec.ts` captures a site on screen, and the pages say so. Doc-impact: `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Spec:** [`docs/CHRONICLE.md`](../../docs/CHRONICLE.md) _Sites_ and _Enemies and camps_, which decide everything a site does; [`docs/MAP.md`](../../docs/MAP.md) _The generator_ and _The region_ for where it is placed; [`docs/ages/NOMADIC.md`](../../docs/ages/NOMADIC.md) _The sites_; [`docs/ages/STONE.md`](../../docs/ages/STONE.md) _The sites_. The sentences to add, written out:

- `NOMADIC.md` _The sites_, after the cave's sentence: "The **old cairn**, a grave under a heap of stones, stands wherever the city stands and deals **Honour the dead**."
- `STONE.md` _The sites_, after the cave's sentence: "The **old cairn** deals **Honour the dead**, culture once and banished, more than the Nomadic card gives, and **Dig the graves**, money once and banished, worth something to a deck that trades and nothing to one that does not: the dead honoured against the dead robbed."

Every player-facing entry, written out:

- The cairn's building name, under both ids: `Old cairn`.
- The cave's building name, under both ids: `Painted cave`.
- The Nomadic card, id `honour-the-dead`: name `Honour the dead`, kind instant, costing nothing, banish, aimed at nothing, gaining 2 culture; its rules entry `Banish.\n2[culture]`.
- The Stone Age's first card, id `stone-honour-the-dead`: name `Honour the dead`, the same card gaining 4 culture; its rules entry `Banish.\n4[culture]`. Two cards of one name, as Cave paintings is.
- The Stone Age's second card, id `dig-the-graves`: name `Dig the graves`, kind instant, costing nothing, banish, aimed at nothing, gaining 4 money; its rules entry `Banish.\n4[money]`.
- The cairn's lore, the Nomadic building's: `A heap of old stones in the open, and under it the dead of a band nobody remembers, laid down with their tools and their beads. The band sits with them a while before moving on.`
- The cairn's lore, the Stone building's: `A heap of old stones in the open, and under it the dead of a band nobody remembers, laid down with their tools and their beads. Do you leave them in peace, or take what they no longer need?`
- The cave's lore, the Nomadic building's: `Deep in the hill, by torchlight, the walls are alive with painted herds and hunters long gone. The band stands in silence a long while, and carries the pictures away in their heads.`
- The cave's lore, the Stone building's, the standing words: `Deep in the hill, by torchlight, the walls are alive with painted herds and hunters long gone. The band stands in silence: what do you take from this place?`

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`. The design pages already say a site's building, its lore and what it deals are content and the age's.

**Scope:**

In: the cairn as a site of both ages, each age's slice bringing a building of its own under the one name, on the ground the city's building names; both ages' regions listing it after the cave, the standing distances unchanged; its three cards, their text and the two lores; its mark and its colour, the site role; the cave's building split into one per age the same way, the Stone slice bringing its own, the Stone site naming it, the mark, the colour, the name and the lore entered under both ids, the Nomadic cave's lore closing as written above; the coherence test unchanged in what it asks, walking the new entries by itself.

Out: the third site, the Nomadic city's culture, the neutral, any number's tuning.

Corner cases decided:

- A site's building is one per age, by decision: the ages share a site's name and nothing else, so each keys its own lore, and the lore lookup, keyed on the building captured, stays as it is. A lore keyed on the age and the building was rejected: it changes the lookup and enters the camp's words twice.
- The cairn's ground is the city's: the terrains the city's building names, the desert among them as the city's and the camp's name it. Measured on 100 seeds per region with the real generator, the cave placed first and the standing distances, 7 from the centre and 4 from the other site: no map short in any region, and on plain, forest and hills alone 122 candidate tiles per map on the Nomadic temperate region, 191 on the Stone one and 38 on the archipelago, which deals no desert.
- Two sites now keep 4 from one another; one may stand beside a camp, on a camp's tile never, as the mechanism already holds.
- Money gained in a chronicle with no trade in the deck sits in the stock: the bar shows every resource whatever the age, and that is the choice the Stone Age's two cards put.
- Saves: a Stone chronicle saved before this line holds a cave under the building id the Stone slice no longer brings, and the boot drops it as it drops any chronicle naming an id the content no longer holds; no care until the Bronze Age, as decided.

Provisional numbers, tuning: 2 culture, 4 culture, 4 money.

Reconcile, chosen: every gain goes through the cave's door as it is, an instant banished, aimed at nothing, gaining a stock; the site's declaration, the region's list and the placing are the cave's as they are; the two buildings of one site share one mark polygon through one shared constant, as the city and the camp share the wall, and each has its entry in the colour table under the site role.

**Traps:**

- The ids, after the standing precedent `stone-cave-paintings`: the Nomadic building keeps the bare id, `painted-cave` and `old-cairn`, and the Stone slice brings `stone-painted-cave` and `stone-old-cairn`; an id two slices bring is refused when the catalogue is merged, so the Stone slice brings its buildings in its own `brings.buildings`, beside the farm's.
- A building the catalogue holds must have its name in `src/ui/text.ts`, its mark in `src/ui/marks.ts`, its colour role in `src/ui/look.ts` and, as a site's, its lore in `src/ui/lore.ts`: four tables, each refusing a missing id at the first draw, and the coherence test `src/content/catalogue.test.ts` walks every site of every age through them.
- The fixture's site is `PH_Cairn` in `src/rules/fixtures.ts`, the fixture's own content under its prefix; it has nothing to do with the real cairn and is not touched.
- The card ids `honour-the-dead`, `stone-honour-the-dead` and `dig-the-graves` go in the slice's `brings.cards` and nowhere in a deck or a technology: the catalogue refuses a deck or a technology holding a site's reward.
- `e2e/sites.spec.ts` takes the first site the age's sites name on seed 1's map; with two sites it still captures one, and reads the title and the lore off the rules, so it follows the cave's new Nomadic lore on its own.
- The glossary lint reads player-facing text, and lore is outside it; "dead" and "graves" in a card name are plain words with no row.
- Two commits: the cave's split first, with its Nomadic lore, a content change of its own; then the cairn, its cards, its lores and the pages.

**Plan:**

1. The cave's building one per age: the Stone slice brings its own under the prefixed id, its site names it, and the name, the mark through a shared polygon, the colour role and the lore stand under both ids, the Nomadic cave's lore closing as written. Leaves: the typecheck, the rules tests and the coherence test green, the cave as before on screen, its Nomadic window reading the new close. Commit.
2. The cairn's buildings in both slices, on the city's ground; both ages' sites naming them with their rewards; both ages' regions listing the cairn after the cave; the three cards; the text entries, the two lores, the mark and the colour. Leaves: the cairn on every map of both ages, the coherence test walking it.
3. The two pages as the Spec writes them, and the board line deleted. Commit.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the proof spec `npx playwright test e2e/sites.spec.ts`. CI proves on the push: `camps`, `pillage`, `deal`, `city-mode`, `map`, `fog`, `inspect`, `settle`, `resume`, `continue`, `manage-save`.
