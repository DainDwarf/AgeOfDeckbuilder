# Domestication

**Line:** **Domestication** — the technology Domestication, its achievement and the card Pasture stand in the Stone Age's content after Irrigation's, every goal that counts a card's plays on a ground reads one counter proven on the fixture, the catalogue's coherence test passes and `docs/ages/STONE.md` says so. Doc-impact: `docs/ages/STONE.md`.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_ and _The cards_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The sentences, verbatim:

- _The technologies_, its opening paragraph, replaced whole by: "A goal is a focus themed on its technology: a deed read from the technology's fiction, asked for more often than a chronicle played as usual gives it."
- _The technologies_, a bullet after Irrigation's: "**Domestication** needs Trapping and Agriculture. Its goal counts a deed: the times Gather is played on a tile carrying cattle, the same tile as often as a worker gathers there. It unlocks the card **Pasture** and pays influence."
- _The cards_, a bullet after Irrigation's: "**Pasture**, an improvement giving food, placed through a worker for production on a tile carrying cattle and nowhere else. It goes with the cattle, so a Hunt played there removes both."

The player-facing entries, verbatim:

- `improvement.pasture`: `Pasture`
- `card.pasture`: `Pasture`
- `rules.pasture`: `Place [improvement:pasture] on [feature:cattle]`
- `technology.domestication`: `Domestication`
- `goal.domestication`: `Play [card:gather] on [feature:cattle] {need} times`

The content's numbers, provisional and the user's: the card Pasture is an instant costing 2 production, placed as Trapping's card is; the improvement Pasture goes on plain, names cattle and gives 1 food; the technology needs Trapping and Agriculture and unlocks one copy of Pasture; the achievement needs 10 and pays 1 influence.

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:**

- In: the technology, its achievement, the card and its improvement, their five text entries, the improvement's mark, the three sentences of the page; and the counter the goal reads, with Trapping's and Irrigation's goals moved onto it.
- Out: any spec of Pasture's own. It has no rule of its own; `e2e/trapping.spec.ts` proves an improvement that names a feature placed, inspected and removed by Hunt.
- Out: making the goal a focus, and weighing the three improvements of one price and one gain. Both stand on the balance pass rung.
- The goal counts every Gather played on a tile carrying cattle, read as the tile stands when the card is played, the same tile as often as it is played there. A worker standing on one herd reaches it: the user's choice, knowing Trapping's rejected goal on the same page, whose sentence stays as it stands.
- Gather is refused inside the border, so a herd the city holds counts nothing; a tile carrying a Pasture counts like any other.
- Pasture is the first improvement that shares a tile with another: a cattle tile a river runs along takes Irrigation too, and a Farm inside the border. The rules allow it as they stand. On the map the three marks of that tile's row, 11 apart on a tile 41.6 wide, reach about 2 and 5 units past the tile's upper edges, computed and not shot: accepted until the look pass, not to be fixed or raised here.
- The page's opening sentence says "a deed" and Agriculture's goal reads the chronicle as it stands: the sentence is the user's, verbatim, and is not reworded at the ship.
- A chronicle in progress may lose the count its Trapping or Irrigation goal held when the counter's tally changes its names: no care is owed a save before the Bronze Age.
- Reconcile, the goal's count: Trapping's goal counts Hunts anywhere, Irrigation's counts Farms built along a river, Domestication's counts Gathers on cattle. They become one counter of a card's plays on a ground, the ground being what it takes — anywhere, along a river, carrying a named feature; Trapping's and Irrigation's are reshaped onto it in this line, and the fixture's river achievement with them. Herbalism's counter, the kinds of terrain, counts another thing and stays apart.
- Reconcile, the card: Pasture goes through the door Trapping's card goes through, as it is.
- Priced against what does the job: the same price and gain as Trapping and Irrigation on another ground; Farm gives twice as much for twice the price, once, inside the border.

**Traps:**

- An improvement that names a feature names that feature's terrain and no other: the catalogue refuses any other ground when it is built.
- The counter reads the tile as the chronicle stood when the command began: Hunt removes the feature it is played on, so the chronicle the play leaves no longer carries it. A play aimed at a unit is counted by the tile its unit stands on, and one aimed at no tile counts none on a ground that names a tile.
- The tree stands a column in the content's order, so the technology and the achievement are declared right after Irrigation's, and a later line's Burial rites goes above them.
- A plate reads four lines under its name at most; the goal entry is one line at the plate's width, so nothing in the tree's layout moves.
- The mark is a code-drawn placeholder under `DOGMAS.md` _Design principles_: a flat polygon, the fewest vertices that tell it apart from the marks it shares a row with, cattle's triangle and Irrigation's channel, and from Trapping's funnel. It follows the precedent of the improvement marks beside it and is no fork.
- The comment over the improvement marks lists each mark; it is re-shaved to its trap or cut when the table gains an entry, never extended into a longer list.
- `docs/PHASER.md`: nothing of it is touched, the UI's part being two table entries.
- The collection screen gains a card; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.

**Plan:**

1. `src/rules/chronicle.ts`, `src/rules/chronicle.test.ts`, `src/rules/fixtures.ts`, `src/content/stone.ts`: the one counter of a card's plays on a ground stands, the river counter gone into it; the fixture's river achievement and the content's Trapping and Irrigation goals read it; the river test holds on it and one test on the fixture proves the feature ground. Nothing changes on screen. This is the mechanism's own inert commit.
2. `src/content/stone.ts`: the improvement, the card, the technology and the achievement stand, each after Irrigation's.
3. `src/ui/text.ts`, `src/ui/marks.ts`: the five entries and the mark stand, so the coherence test passes.
4. `docs/ages/STONE.md`: the three sentences. The board line and this file are deleted.

Steps 2 to 4 are the content's commit.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/tree.spec.ts`, the tree read on the game's content with the plate added. CI proves on the push: `e2e/pin.spec.ts`, `e2e/trapping.spec.ts`, `e2e/irrigation.spec.ts`, `e2e/farm.spec.ts`, `e2e/ending.spec.ts`, `e2e/launch.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`. The visual check looks at a Pasture placed on a herd, and at the tree's second column.
