# Tanning

**Line:** **Tanning** — the technology Tanning, its achievement and the card Tannery stand in the Stone Age's content after Bow and arrow's, a building or an improvement names one feature or several, proven by one test on the fixture, `e2e/tannery.spec.ts` passes, the catalogue's coherence test passes and `docs/MAP.md` and `docs/ages/STONE.md` say so. Doc-impact: `docs/MAP.md`, `docs/ages/STONE.md`.

**Spec:** [`docs/MAP.md`](../../docs/MAP.md), _The tile_; [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_ and _The cards_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The sentences, verbatim, drafted at intake: the user read the two of `docs/ages/STONE.md` and struck neither, the first reworded since for the goal the user then made a reading of the map; the one of `docs/MAP.md` the user has not read, and the hand-back quotes it.

- `docs/MAP.md`, _The tile_, the Improvement bullet: the sentence "A layer may also name a feature, a building's or an improvement's alike: it then goes on a tile carrying that feature and on no other, and is removed with the feature, however the feature leaves the tile." becomes "A layer may also name a feature, or several, a building's or an improvement's alike: it then goes on a tile carrying one of them and on no other, and is removed with the feature it stands on, however the feature leaves the tile."
- `docs/ages/STONE.md`, _The technologies_, a bullet after Bow and arrow's: "**Tanning** needs Domestication. Its goal reads the chronicle as it stands: the tiles inside the border carrying a Pasture or a Trapping, the city's own tile counted when it carries one. It unlocks the card **Tannery** and pays influence."
- `docs/ages/STONE.md`, _The cards_, a bullet after Archer's: "**Tannery**, a building giving money, built through a worker for production on a tile carrying deer or cattle and nowhere else, single use. It goes with the feature, so a Hunt played there removes both. Money has its source here, and nothing in the age costs it."

The player-facing entries, verbatim:

- `building.tannery`: `Tannery`
- `card.tannery`: `Tannery`
- `rules.tannery`: `Single use.\nBuild [building:tannery] on [feature:deer] or [feature:cattle]`
- `technology.tanning`: `Tanning`
- `goal.tanning`: `Place {need} [improvement:pasture] or [improvement:trapping] inside your border`

The goal's sentence is the user's wording, the count ahead of the two names so that one of each reads as a way to reach it. The two names are the improvements', what the goal reads on the map; that choice is intake's.

The content's numbers, provisional: the building Tannery goes on forest and plain, names deer and cattle and gives 2 money; the card Tannery is a building card costing 4 production, single use, built as Farm's card builds; the technology needs Domestication and unlocks one copy of Tannery; the achievement needs 2 and pays 1 influence.

**Doc-impact:** `docs/MAP.md`, `docs/ages/STONE.md`.

**Scope:**

- In: a layer naming one feature or several, with its test on the fixture; the technology, its achievement, the card and its building; the five text entries; the building's mark and its colour role; the pages' sentences; `e2e/tannery.spec.ts`.
- Out: the armour the user also wants from this technology. It is a card modification, the Bronze Age's, and stands in `workflow/IDEAS.md`.
- Out: weighing the need of 2. It stands on the balance pass rung.
- Out: the tree's display. The goal reads three lines at the plate's width, so every plate reads five lines under its name and stands 128 tall where it stood 110: the user accepts it. A column of four stands 578 of the room's 672 and a column of five would stand 56 over; one of Pottery and Burial rites goes, decided at their intakes. Nothing in the tree's layout is changed here, and a taller plate is not a finding of the visual check.
- The goal is a reading of the chronicle as it stands, as Agriculture's is, the user's choice over a deed counted: the tiles the city holds that carry a Pasture or a Trapping, the city's own included. It is reached the moment that number stands at the need, whichever came last, the improvement placed or the tile claimed. A Hunt played on such a tile takes the improvement with the herd and the number falls with it; an achievement once recorded stays.
- A tile carries one feature, so it carries one of the two improvements and counts once.
- Money has no cost anywhere in the game, and the Tannery gives it all the same: the user's choice, knowing it, until the technology that spends it lands.
- A Tannery shares its tile with the Pasture or the Trapping placed there; on cattle it takes the slot Farm would take, and the rules decide that as they stand.
- A chronicle in progress needs no care: no save is owed anything before the Bronze Age.
- Reconcile, the ground a layer names: Trapping's and Pasture's improvements each name one feature, the Tannery names two. They become one rule: a building or an improvement names one feature or several, Trapping and Pasture keep naming one, and a tile carrying none of them answers the refusal it answers today.
- Reconcile, the goal: Agriculture's goal reads the tiles the city holds, and so does this one, each by what a tile must be; the counter of a card's plays on a ground is not touched.
- Reconcile, the card: Tannery goes through the door Farm's card goes through, as it is.
- Reconcile, the proof: `e2e/farm.spec.ts` proves a building built and `e2e/trapping.spec.ts` an improvement naming a feature placed, inspected and removed by Hunt; both stay as they are, and the Tannery gets a spec of its own, being the first building on a feature and the first layer naming two.
- Priced against what does the job: Farm's price for Farm's amount, of a resource nothing gives yet, on a ground the border has to reach.

**Traps:**

- A layer's one feature is read in four places today: the ground a layer goes on and the layers a tile keeps when its feature or terrain changes (`src/rules/cards.ts`), and the catalogue's check that a named feature lies on a terrain the layer names and its refusal of a city's or a camp's building naming one (`src/rules/catalogue.ts`). Each holds for every feature a layer names. The fixture's building and improvement that name one feature keep naming one, and their tests hold unloosened.
- A feature lies on one terrain: the Tannery names both terrains its two features lie on, or the catalogue refuses it when it is built.
- The achievement's count is a closure of the content reading the chronicle, as Agriculture's is, with no tally. It gets no test of its own: the coherence test asks it its answer on a launched chronicle.
- The tree stands a column in the content's order, so the technology and the achievement are declared right after Bow and arrow's; a later line's Calendar and Bread go above them in the third column.
- Every plate of the tree shares one height, the tallest reading's. This goal is the first to read three lines, so every plate grows by one line: expected, and no spec is changed for it.
- The building's mark is a code-drawn placeholder under `DOGMAS.md` _Design principles_: a flat polygon, the fewest vertices that tell it apart from the wall, the Shelter's and Farm's, wide enough to show under a unit. Its colour is the role Farm's and the Shelter's read, a building of the player's. Both follow precedent and are no fork. A comment over a marks table is re-shaved to its trap or cut when the table gains an entry, never extended into a list.
- The spec is built as `DOGMAS.md` _Testing_ says and under [`docs/PHASER.md`](../../docs/PHASER.md), _Under a Playwright spec_: the chronicle made headlessly, a tile beside the city claimed as `e2e/farm.spec.ts` claims its own, the herd made on it through the rules' helpers and not searched for, a worker entered there, the card's cost gained. Each test is built for the one thing it asks, and every oracle is read from the rules. A helper two specs need stands in `e2e/chronicle-screen.ts`, never copied.
- The collection screen gains a card; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.

**Plan:**

1. `src/rules/` and its tests, `src/rules/fixtures.ts`, and the content's two improvements where the declaration's shape asks it: a building or an improvement names one feature or several; one test on the fixture proves a layer naming two is built on a tile carrying either, refused on a tile carrying neither, and removed with the one it stands on. Nothing in the game changes. This is the mechanism's own inert commit.
2. `src/content/stone.ts`: the building, the card, the technology and the achievement stand, the last two after Bow and arrow's.
3. `src/ui/text.ts`, `src/ui/marks.ts`, `src/ui/look.ts`: the five entries, the mark and the colour role stand, so the coherence test passes.
4. `e2e/tannery.spec.ts`, with what it needs of `e2e/chronicle-screen.ts`: the Tannery played at a tile inside the border carrying deer that its worker stands on builds it there; the same on cattle; a Hunt played on a herd carrying a Tannery removes the herd and the Tannery with it.
5. `docs/MAP.md`, `docs/ages/STONE.md`: the sentences. The board line and this file are deleted.

Steps 2 to 5 are the content's commit.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/tannery.spec.ts`. CI proves on the push: `e2e/farm.spec.ts`, `e2e/trapping.spec.ts`, `e2e/irrigation.spec.ts`, `e2e/tree.spec.ts`, `e2e/pin.spec.ts`, `e2e/inspect.spec.ts`, `e2e/ending.spec.ts`, `e2e/launch.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`. The visual check looks at a Tannery built on a herd beside its improvement, at the money on the resource bar after the income that follows, and at the tree's columns at the plates' new height.
