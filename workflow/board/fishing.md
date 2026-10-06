# Fishing

**Line:** **Fishing** — the technology Fishing, its achievement and the card Fishery stand in the Stone Age's content after Raft's; a building gives to the tiles beside it, and an achievement counts a resource gained from the tiles of a terrain, each proven by one test on the fixture; every number of a player-facing entry stands against its glyph; `e2e/fishery.spec.ts` passes, the catalogue's coherence test passes and `docs/MAP.md`, `docs/GLOSSARY.md`, `docs/CHRONICLE-SCREEN.md` and `docs/ages/STONE.md` say so. Doc-impact: `docs/MAP.md`, `docs/GLOSSARY.md`, `docs/CHRONICLE-SCREEN.md`, `docs/ages/STONE.md`.

**Spec:** [`docs/MAP.md`](../../docs/MAP.md), _The tile_; [`docs/GLOSSARY.md`](../../docs/GLOSSARY.md), the row **yield**; [`docs/CHRONICLE-SCREEN.md`](../../docs/CHRONICLE-SCREEN.md), _The veils and the infopanel_ and _The yield overlay_; [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_ and _The cards_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The sentences, verbatim, drafted at intake. The user read the Building bullet's first added sentence of `docs/MAP.md` and struck nothing; every other sentence below the user has not read, and the hand-back quotes each.

- `docs/MAP.md`, _The tile_, the opening sentence: "A tile is layers: its income is the sum of what its layers say, and its movement cost is its terrain's unless a layer names it outright:" becomes "A tile is layers: its income is the sum of what its layers say and of what the buildings beside it give it, and its movement cost is its terrain's unless a layer names it outright:"
- `docs/MAP.md`, _The tile_, the Building bullet, added at its end: "A building may give to the tiles beside it: it names one terrain and what it gives, and every tile of that terrain beside it, and its own, yields that much more, once from a kind of building however many of that kind stand beside the tile. An improvement placed on every tile around was rejected: it is a copy of where the building stands, to be kept in step when the building leaves."
- `docs/GLOSSARY.md`, the row **yield**, its meaning: "What a tile's layers give at income, resource by resource." becomes "What a tile gives at income, resource by resource."
- `docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_, the paragraph "The rest of the screen reads what the map draws.": the sentence "The yield overlay glyphs the tiles the map draws, each from the face it draws of it, so a tile in fog shows what it yielded when it was last seen." becomes "The yield overlay glyphs the tiles the map draws, each from the faces it draws, the tile's and those beside it, so a tile in fog is read as it was last seen."
- `docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_, the infopanel's paragraph, after "The river's row carries one line under it: a crossing ends the move.": "A building that gives to the tiles beside it carries one line under its row saying so, and its row reads what it gives the tile it stands on; the terrain card of a tile it gives to holds a row for it, drawn as the building's own with what it gives that tile and no line, once however many of its kind stand beside the tile."
- `docs/CHRONICLE-SCREEN.md`, _The yield overlay_: "It reads the layers of the face the map draws, and nothing else — whoever stands there and whatever occupies it change what the tile gives at income, never what the overlay shows, and a tile in fog shows what it yielded when it was last seen." becomes "It reads the faces the map draws, the tile's and those beside it, and nothing else — whoever stands there and whatever occupies it change what the tile gives at income, never what the overlay shows, and a tile in fog is read as it was last seen."
- `docs/ages/STONE.md`, _The technologies_, a bullet after Raft's: "**Fishing** needs Raft. Its goal counts a deed: the food gained from coast tiles, at income and through Gather alike. It unlocks the card **Fishery** and pays influence."
- `docs/ages/STONE.md`, _The cards_, a bullet after Disembark's: "**Fishery**, a building built through an embarked worker for production on a coast tile, single use. It gives food to its own tile and to every coast tile beside it, once however many stand around a tile, so it pays by the coast the city works around it."

The player-facing entries, verbatim:

- `building.fishery`: `Fishery`
- `card.fishery`: `Fishery`
- `rules.fishery`: `Single use.\nBuild [building:fishery] on [terrain:coast]`
- `technology.fishing`: `Fishing`
- `goal.fishing`: `Gain {need}[food] from [terrain:coast]`
- `panel.beside`: `And {terrain} beside it`, the line under the row of a building that gives to the tiles beside it, `{terrain}` the name of the terrain it names, read through that terrain's own entry.
- `answer-rules.share`: `Add [card:hunger] to the top of the draw pile. It takes {food}[food]`
- `answer-rules.firebreak`: `Pay {production}[production]`
- `answer-rules.keep-them`: `Pay {culture}[culture]`
- `answer-rules.hunt-it`: `Gain {food}[food]`

Who wrote what: the goal's sentence is the user's, "Gain X food from coast tiles", counting income and Gather both; the Fishery's gain, one food to every coast tile beside it and to its own, never twice from two Fisheries, is the user's design; the need of 50, the name Fishery, the line "And Coast beside it" and the card's text as Farm's reads were served by Claude and picked by the user.

The content's numbers, provisional: the building Fishery goes on coast, gives nothing of its own and gives 1 food to coast beside it and to its own tile; the card Fishery is a building card costing 4 production, single use, built as Farm's card builds; the technology needs Raft and unlocks one copy of Fishery; the achievement needs 50 and pays 1 influence.

**Doc-impact:** `docs/MAP.md`, `docs/GLOSSARY.md`, `docs/CHRONICLE-SCREEN.md`, `docs/ages/STONE.md`.

**Scope:**

- In: a building that gives to the tiles beside it, with its test on the fixture; an achievement's count of a resource gained from the tiles of a terrain, with its test on the fixture; the technology, its achievement, the card and its building; the six new text entries and the four answer entries rewritten; the building's mark and its colour role; the tile panel's row and line; the pages' sentences; `e2e/fishery.spec.ts`.
- The line is widened on the user's order: card texts write a number against its glyph and answer texts wrote a space between them; the four answer entries lose the space, so one form stands everywhere.
- Out: the Fishery's reach drawn on the map. The yield overlay and the tile panel are what show it.
- Out: weighing the need of 50 and the Fishery's gain. They stand on the balance pass rung.
- Out: an improvement that gives to the tiles beside it. The rule is a building's alone, the user's sizing: no seam for an instance that does not exist.
- A tile's yield is worked out each time it is asked, from the tile's own layers and from the buildings standing beside it, as a river running along a tile is; nothing is placed on the tiles around a Fishery. The user's choice over an improvement stamped on each of them.
- The gain is the tile's yield wherever yield is read: at income, on the yield overlay, in city mode's reading of the border, and through Gather. A coast tile outside the border beside a Fishery gains an embarked worker its food and the Fishery's.
- A tile takes the gain once from a kind of building: a coast tile beside two Fisheries, and a Fishery's own tile beside another Fishery, yield one food more and no more.
- The rule is written for a building naming one terrain, the one its line reads the name of.
- The goal counts the food a coast tile gives, by the two ways a tile gives: at income from a tile a population works, and through Gather. It counts the tile's whole food, a Fishery's included, and no food gained any other way. Its ground is the terrain as the tile stands when it gives.
- The need of 50, measured at intake on 200 maps a region, every claim spent toward the coast and every coast tile worked from its claim: 37 by turn 20, 76 by turn 30 and 125 by turn 40 from the best settle tile of a temperate map and from nearly any of an archipelago's; 7, 26 and 55 from the median settle tile of a temperate map. The archipelago reaching it sooner is the region doing its job, the user's verdict: never a finding.
- On the tile panel: the Fishery's row on its own tile stands on the building card, reads the one food it gives that tile and carries the line; a coast tile it gives to holds the Fishery's row on its terrain card, after the terrain's, the feature's and the river's, with no line; a name on a card that names the Fishery shows the row and the line as its own tile does.
- A coast tile in fog beside a Fishery reads the gain as soon as the Fishery is drawn.
- An enemy occupying a Fishery's tile and a Fishery leaving the map are reached by nothing today: enemies go on no water and nothing removes a building from coast. The rules decide both as they stand, and no page says anything of them.
- A chronicle in progress needs no care: no save is owed anything before the Bronze Age.
- Priced against what does the job: Farm's price for one food on each of up to seven tiles, each needing a population to work it, where Farm gives two on one; and an Embark and a worker's turns on the water besides.
- Reconcile, a tile's yield: one answer in the rules says what a tile yields, and income, Gather, the yield overlay and city mode read it. The Fishery goes through that answer, reshaped in this line to read the buildings beside the tile; the tile panel's rows, which read each layer on their own today, are read from the same answer, so the rows and the overlay never disagree.
- Reconcile, the goal's count: the counts that stand read a card's plays on a ground, the kinds of terrain a card is played on, turns, kills, or the map as it stands. This one counts an amount, and counts income. They stay apart, the difference being meant: a new count beside the others.
- Reconcile, the card: Fishery goes through the door Farm's card goes through, as it is. A worker embarked playing a card through itself is proven on the fixture already and gets no second test.
- Reconcile, the panel's row: the terrain card already holds a row for the river, which is no layer of the tile, with a line under it. The Fishery's row and its line are drawn as every row and that line are.
- Reconcile, the number against its glyph: the goal takes the card texts' form, and the answer texts are brought to it in this line.
- Reconcile, the proof: `e2e/farm.spec.ts` proves a building built, `e2e/embark.spec.ts` a unit embarked, `e2e/yields.spec.ts` the overlay and `e2e/inspect.spec.ts` the panel's rows; all stay as they are, and the Fishery gets a spec of its own, being the first building on water and the first that gives beside itself.

**Traps:**

- A tile's yield is read from a tile alone today (`tileYield`, `src/rules/map.ts`), by income and Gather (`src/rules/city.ts`), by the yield overlay and city mode (`src/ui/map.ts`), and by `e2e/inspect.spec.ts` and `e2e/chronicle-screen.ts` as their oracle. Every one of them reads the reshaped answer; none adds the gain on its own.
- The overlay and the panel read the faces the map draws, a tile in fog from its snapshot: the tiles beside are read from those faces too, never from the chronicle behind them.
- `tileAt` searches the whole map, and the overlay reads every drawn tile's yield on every render: six lookups more a tile, each a search of the Stone Age's 469 tiles, is the cost to keep off the frame.
- A building and an improvement share one declaration of what a layer is (`src/rules/map-kinds.ts`). What a building gives beside itself is a building's alone.
- The terrain a building gives to is an id: the catalogue refuses one it does not hold when it is built, in the vocabulary its other refusals use.
- An achievement's tally is handed every command's stages, the end of a turn's among them. Only a tile's yield gained raises a `stock` change carrying a tile, at income and through Gather alike; a change carries no amount, which is read off the chronicles before and after it.
- The tile panel builds a tile's cards from that tile alone (`cardsOf`, `src/ui/infopanel.ts`), and a named thing's card from its one row; a line under a row exists for the river's alone.
- `{terrain}` in `panel.beside` is the terrain's name through its own entry, never the word typed again.
- The tree stands a column in the content's order, so the technology and the achievement are declared right after Raft's; Megalith and Bartering, later lines, go above them in the fourth column.
- The goal reads one line at the plate's width, so no plate's height changes.
- The building's mark is a code-drawn placeholder under `DOGMAS.md` _Design principles_: a flat polygon, the fewest vertices that tell it apart from the wall, the Shelter's, Farm's and the Tannery's, wide enough to show under a unit; the trapezoid the intake's mockup drew may stand. Its colour is the role Farm's reads, a building of the player's. Both follow precedent and are no fork. A comment over a marks table is re-shaved to its trap or cut when the table gains an entry.
- The spec is built as `DOGMAS.md` _Testing_ says and under [`docs/PHASER.md`](../../docs/PHASER.md), _Under a Playwright spec_: the chronicle made headlessly, the coast made beside the city through the rules' helpers and not searched for, claimed, the worker embarked onto it by Embark played through the rules as `e2e/embark.spec.ts` plays it. An embarked worker has spent its action on the turn it embarked, so the chronicle the spec opens on stands a turn later, the card in hand and its cost gained through the rules. Each test is built for the one thing it asks, every oracle is read from the rules, and what stands together is read in one question to the page. A helper two specs need stands in `e2e/chronicle-screen.ts`, never copied.
- A spec reading an answer's text reads it through its entry; one holding the old text as a literal is corrected to read the entry, never loosened.
- The collection screen gains a card; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.
- Comments are for traps only, in every file the line touches.

**Plan:**

1. `src/ui/text.ts`: the four answer entries stand with each number against its glyph. Its own commit, saying the line was widened on the user's order.
2. `src/rules/` and its tests, `src/rules/fixtures.ts`, and the readers of a tile's yield in `src/ui/` and `e2e/`: a building gives to the tiles of one terrain beside it and to its own, once from its kind; one test on the fixture proves a tile of the terrain beside the building and the building's own tile yield that much more at income and through a card gaining a tile's yield, a tile of another terrain beside it does not, and a tile beside two of the kind takes it once. The tile panel shows the row and the line for a building that gives so. Nothing in the game changes. This is the first mechanism's inert commit.
3. `src/rules/` and its tests, `src/rules/fixtures.ts`: an achievement counts a resource gained from the tiles of a terrain; one test on the fixture proves the amount gained at income and through a card gaining a tile's yield is counted, and a gain that names no tile or comes from a tile of another terrain is not. Nothing in the game changes. This is the second mechanism's inert commit.
4. `src/content/stone.ts`: the building, the card, the technology and the achievement stand, the last two after Raft's.
5. `src/ui/text.ts`, `src/ui/marks.ts`, `src/ui/look.ts`: the six entries, the mark and the colour role stand, so the coherence test passes.
6. `e2e/fishery.spec.ts`, with what it needs of `e2e/chronicle-screen.ts`: the Fishery played at a coast tile inside the border that its embarked worker stands on builds it there; with a Fishery built, the yield overlay glyphs a coast tile beside it for what the rules say it yields and that tile's terrain card holds the Fishery's row with what it gives; the Fishery's own tile holds its row and its line on the building card.
7. `docs/MAP.md`, `docs/GLOSSARY.md`, `docs/CHRONICLE-SCREEN.md`, `docs/ages/STONE.md`: the sentences. The board line and this file are deleted.

Steps 4 to 7 are the content's commit.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/fishery.spec.ts`. CI proves on the push: `e2e/farm.spec.ts`, `e2e/tannery.spec.ts`, `e2e/trapping.spec.ts`, `e2e/irrigation.spec.ts`, `e2e/embark.spec.ts`, `e2e/yields.spec.ts`, `e2e/inspect.spec.ts`, `e2e/reference.spec.ts`, `e2e/city-mode.spec.ts`, `e2e/deal.spec.ts`, `e2e/tree.spec.ts`, `e2e/pin.spec.ts`, `e2e/ending.spec.ts`, `e2e/launch.spec.ts`, `e2e/archipelago.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`. The visual check looks at a Fishery built on coast under the embarked worker that built it, at the yield overlay on the coast around it, at the terrain card of a coast tile beside it and the building card of its own tile, and at Fishing's plate in the tree's fourth column.
