# Pottery

**Line:** **Pottery** — the technology Pottery, its achievement and the card Clay pit stand in the Stone Age's content, the technology after Bow and arrow's; the catalogue's coherence test passes and `docs/ages/STONE.md` says so. Doc-impact: `docs/ages/STONE.md`.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_ and _The cards_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The sentences, verbatim, written by Claude and read by the user at intake, none struck:

- `docs/ages/STONE.md`, _The technologies_, a bullet after Bow and arrow's and before Bread's: "**Pottery** needs Fire. Its goal counts a deed: the production gained from hills tiles, at income and through Gather alike. It unlocks the card **Clay pit** and pays influence."
- `docs/ages/STONE.md`, _The cards_, a bullet after Archer's and before Bread's: "**Clay pit**, an improvement giving production, placed through a worker for production on hills and nowhere else. The ground along a river was rejected: not every map deals a river near the centre, and the archipelago deals none."

The player-facing entries, verbatim:

- `improvement.clay-pit`: `Clay pit`
- `card.clay-pit`: `Clay pit`
- `rules.clay-pit`: `Place [improvement:clay-pit] on [terrain:hills]`
- `technology.pottery`: `Pottery`
- `goal.pottery`: `Gain {need}[production] from [terrain:hills]`

Who wrote what: the user asked for a technology that touches production, which no technology had; Clay pit was one of four takes Claude served, and the user took it over the Kiln, a building giving production, a shape they keep for a later age, and chose hills over the ground along a river. The goal was one of three Claude served and the user picked it. The need of 50 is the user's "for now", over the 80 Claude recommended. The cost, the gain, the one copy, the influence and the five entries were served by Claude as riders and none was struck.

The content's numbers, provisional: the card Clay pit is an instant costing 2 production, placed as Pasture's card is; the improvement Clay pit goes on hills, names no feature and no river, and gives 1 production; the technology needs Fire and unlocks one copy of Clay pit; the achievement counts the production gained from hills tiles, needs 50 and pays 1 influence.

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:**

- In: the technology, its achievement, the card and its improvement in the Stone Age's content; the five text entries; the improvement's mark; the two sentences of the age's page.
- No mechanism is new, so no rules test is added: the card places its improvement as Trapping's, Irrigation's and Pasture's do, and the goal reads the counter Fishing's goal reads, on another resource and another terrain, which are that counter's two arguments.
- No spec of its own: Clay pit has no rule of its own, as Pasture has none. The tree's spec walks the tree the new plate stands in.
- The goal counts everything a hills tile gives in production, the tile read as it stood when it gave: the terrain's own, flint's on it, at income and through Gather alike, the city's own tile counted when it stands on hills. It keeps a tally, so production paid after does not undo it.
- A city that plays nothing does not reach the goal inside twenty turns: it opens with one population and hills feed nobody, so it gains from its own tile alone, the need in fifty turns on bare hills and in twenty-five on hills carrying flint. Arithmetic on the content's numbers, not measured on maps; a city settled on flint reaching it by standing was said to the user, who kept 50. Weighing the need is the balance pass's.
- Clay pit goes on any hills tile, carrying flint or not, inside the border or outside it: it counts at income where a population works the tile and through Gather outside the border, as every improvement does.
- The city's own tile takes a Clay pit when it stands on hills: no improvement asks for a free slot or a side of the border, and the rules stay as they stand.
- Clay pit shares a tile with no other improvement, the three others going on plain, desert and forest. It shares one with flint, as Trapping does with deer, and on a city settled on flint with the city's building too: three marks in one row reach past the tile's upper edges, accepted until the look pass, not to be fixed or raised here.
- Priced against what does the job: no improvement and no building gives production; Goods trade gives it once a play, for money. Clay pit keeps the price and the gain of the three other improvements on another resource, and weighing the four against one another is the balance pass's.
- Out: the Kiln, a building giving production; a card keeping another in the hand past the end of the turn; a card making a building cost less. Each was served and not taken; none is an idea unless the user jots it.
- A chronicle in progress needs no care: no save is owed anything before the Bronze Age.
- Reconcile, the card: Clay pit goes through the door the three other improvement cards go through, as it is. What differs is the ground: it names a terrain and nothing else, and a tile of another terrain reads the refusal a Farm off plain reads.
- Reconcile, the goal: it goes through the counter Fishing's goal reads, as it is; what differs is the resource and the terrain.
- Reconcile, the mark: a fourth beside the three improvement marks, drawn as they are.

**Traps:**

- The tree stands a column in the content's order, and a technology's column is one after the furthest it needs: the technology and the achievement are declared after Bow and arrow's and before Bread's, so Pottery's plate stands fourth in the second column, under Bow and arrow's.
- The plate reads its goal on one line or two, not measured: the sentence is Fishing's with two words changed. Either way it stays under the five lines Tanning's plate reads, so no plate grows.
- An improvement that names no feature and no river is read on its terrains alone; nothing is added to `src/rules/`.
- The card's cost is drawn by the card's face from the content: the rules entry says the placing alone and ends in no period. The goal's entry holds its number against the glyph with no space, as Fishing's does.
- The coherence test reads a name and a mark for every improvement, a name and a rules entry for every card, a name for every technology and a goal for every achievement: the five entries and the mark land with the content or it throws.
- The mark is a code-drawn placeholder under `DOGMAS.md` _Design principles_: a flat polygon, the fewest vertices that tell it apart from the three other improvement marks and from flint's, which it shares a tile with. It follows the precedent of the improvement marks beside it and is no fork.
- A card's name is reached in code through its text key alone, never a re-typed literal.
- No number stands on the age's page: the two sentences go in as written.
- `docs/PHASER.md`: nothing of it is touched, the UI's part being table entries.
- The collection gains a card for a campaign that has learned Pottery; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.
- Comments are for traps only, in every file the line touches.

**Plan:**

1. `src/content/stone.ts`: the improvement, the card, the technology and the achievement stand, the last two between Bow and arrow's and Bread's.
2. `src/ui/text.ts`, `src/ui/marks.ts`: the five entries and the mark stand, so the coherence test passes.
3. `docs/ages/STONE.md`: the two sentences. The board line and this file are deleted.

One commit: the line carries no mechanism.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/tree.spec.ts`. CI proves on the push: `e2e/pin.spec.ts`, `e2e/launch.spec.ts`, `e2e/ending.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/reference.spec.ts`, `e2e/trapping.spec.ts`, `e2e/irrigation.spec.ts`, `e2e/inspect.spec.ts`. The visual check looks at Pottery's plate in the tree's second column under Bow and arrow's, available on a campaign that has learned Fire, at a Clay pit placed on hills and on hills carrying flint, and at the card Clay pit shown large.
