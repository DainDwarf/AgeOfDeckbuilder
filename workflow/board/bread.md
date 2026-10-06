# Bread

**Line:** **Bread** — the technology Bread, its achievement and the card Bread stand in the Stone Age's content, the technology ahead of Tanning's; the catalogue's coherence test passes and `docs/ages/STONE.md` says so. Doc-impact: `docs/ages/STONE.md`.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_ and _The cards_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The two sentences below were drafted at intake and the user has not read them: the hand-back quotes each.

- `docs/ages/STONE.md`, _The technologies_, a bullet after Bow and arrow's and before Tanning's: "**Bread** needs Irrigation. Its goal reads the chronicle as it stands: the city's population, idle and assigned alike, a unit never counted. It unlocks the card **Bread** and pays influence."
- `docs/ages/STONE.md`, _The cards_, a bullet after Archer's and before Tannery's: "**Bread**, an instant costing food, aimed at nothing: the city gains culture. Culture has its second source here, after the city's own tile, so food is kept for the next population or paid toward the next claim."

The player-facing entries, verbatim:

- `card.bread`: `Bread`
- `rules.bread`: `Gain 2[culture]`
- `technology.bread`: `Bread`
- `goal.bread`: `Have {need} population`

Who wrote what: food becoming culture was one of three takes Claude served, the previous game's Beer under Bread's name, and the user picked it; the goal's sentence was one of three Claude served, and the user picked it over the deed Claude recommended, "Grow your city N times"; the need of 12, the cost of 2 food, the gain of 2 culture and the card's text were served by Claude as riders and none was struck.

The content's numbers, provisional: the card Bread is an instant aimed at nothing, costing 2 food, and the city gains 2 culture; the technology needs Irrigation and unlocks one copy of Bread; the achievement counts the city's population, needs 12 and pays 1 influence.

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:**

- In: the card, the technology and its achievement in the Stone Age's content; the four text entries; the two sentences of the age's page.
- Bread is kept, the user's call, on a trial: the tree reads a bit bloated to them, and a technology may be taken out after play. Bartering's line stands as it is, needing Tanning and Bread.
- No mechanism is new, so no rules test is added: the card gains a stock as the camp's Pillage reward and Fire do, with a cost as any card has one; the achievement reads the chronicle as it stands, as Agriculture's, Tanning's and Raft's do, and the fixture already holds an achievement reading the population.
- No spec of its own: the card has no rule of its own. The tree's spec walks the tree the new plate stands in.
- The goal counts the population the city holds, idle and assigned alike, however it arrived, growth or a camp's Capture; a unit is never counted. It is recorded the moment the population stands at the need, and a population lost after does not undo it. It is read at the launch like every achievement, on a chronicle that opens with no population.
- The need of 12, measured at intake on 200 temperate maps: a city with no card, every claim and every population on food, ending its turns. With no unit on the best settle tile and no event, no map holds 12 by turn 20, one holds 11 and 33 hold 10; 155 hold 12 by turn 30. With the two settle units standing, none holds 10 by turn 20, and 5 hold 12 by turn 30. On the stand-in schedule with no unit, taking the answers that cost no stock, 17 hold 12 by turn 30 and 73 cities have fallen. So standing does not reach it inside twenty turns, and the road that costs least food, fielding no unit, is the one the schedule kills. A unit fielded is one population gone and 2 food more on every growth after: 12 population costs 132 food in growth with no unit and 220 with four.
- The goal reads one line on the plate: "Have 12 population" measures 121 px at the plate's font, against about 156.
- Priced against what does the job: the city's own tile is the one other source of culture, one a turn. One copy of Bread comes around every three or four turns in the deck the age opens with, so about half a culture a turn for about half a food a turn. Weighing the numbers is the balance pass's.
- Out: the trial that takes culture off the city's yield. It stands on the balance pass rung.
- A chronicle in progress needs no care: no save is owed anything before the Bronze Age.
- Reconcile, the card: it goes through the door the Pillage reward and Fire gain a stock through, as it is.
- Reconcile, the goal: it is a count read on the chronicle as it stands, as three of the age's goals are, and keeps no tally.
- Reconcile, the proof: nothing new to prove in the rules; the coherence test holds the content, and the tree's spec the plate.

**Traps:**

- The tree stands a column in the content's order, and a technology's column is one after the furthest it needs: the technology and the achievement are declared after Bow and arrow's and before Tanning's, so Bread's plate stands in the third column above Tanning's. Calendar, a later line, goes above it.
- The card is aimed at nothing, as the camp's rewards are, and its effect is composed from the rules' own helper for a stock gained; nothing is added to `src/rules/`.
- The card's cost is drawn by the card's face from the content: the rules entry says the gain alone, the number against its glyph, and ends in no period.
- The coherence test reads a name and a rules entry for every card, a name for every technology and a goal for every achievement: the four entries land with the content or it throws.
- The card is no building and no unit: it takes no mark and no colour.
- The collection gains a card for a campaign that has learned Bread; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.
- Comments are for traps only, in every file the line touches.

**Plan:**

1. `src/content/stone.ts`: the card, the technology and the achievement stand, the last two between Bow and arrow's and Tanning's.
2. `src/ui/text.ts`: the four entries stand, so the coherence test passes.
3. `docs/ages/STONE.md`: the two sentences. The board line and this file are deleted.

One commit: the line carries no mechanism.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/tree.spec.ts`. CI proves on the push: `e2e/pin.spec.ts`, `e2e/launch.spec.ts`, `e2e/ending.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/reference.spec.ts`. The visual check looks at Bread's plate in the tree's third column above Tanning's, available on a campaign that has learned Irrigation, and at the card Bread shown large.
