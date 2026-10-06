# Bartering

**Line:** **Bartering** — the technology Bartering, its achievement and the cards Food Trade and Material Trade stand in the Stone Age's content, the technology ahead of Fishing's; the catalogue's coherence test passes and `docs/ages/STONE.md` says so. Doc-impact: `docs/ages/STONE.md`.

**Spec:** [`docs/ages/STONE.md`](../../docs/ages/STONE.md), _The technologies_ and _The cards_; the shared ground is [`stone-age-pool.md`](stone-age-pool.md), _For the technologies_. The sentences below were drafted at intake and the user has not read them: the hand-back quotes each.

- `docs/ages/STONE.md`, _The technologies_, a bullet after Raft's and before Fishing's: "**Bartering** needs Tanning and Bread. Its goal reads the chronicle as it stands: the money in the city's stock. It unlocks the cards **Food Trade** and **Material Trade** and pays influence."
- `docs/ages/STONE.md`, _The cards_, Tannery's bullet: its last sentence, "Money has its source here, and nothing in the age costs it.", becomes "Money has its source here."
- `docs/ages/STONE.md`, _The cards_, a bullet after Disembark's and before Fishery's: "**Food Trade**, an instant costing money, aimed at nothing: the city gains food."
- `docs/ages/STONE.md`, _The cards_, a bullet after Food Trade's: "**Material Trade**, an instant costing money, aimed at nothing: the city gains production. Money is paid in the two trades, each for one good, so which good a deck's money goes to is chosen when the deck is built. A trade choosing its good when it is played was rejected: it leaves the deck's building nothing to choose."

The player-facing entries, verbatim:

- `card.food-trade`: `Food Trade`
- `rules.food-trade`: `Gain 3[food]`
- `card.material-trade`: `Material Trade`
- `rules.material-trade`: `Gain 3[production]`
- `technology.bartering`: `Bartering`
- `goal.bartering`: `Have {need}[money]`

Who wrote what: the instant was the user's pick among three shapes Claude served, and the user struck the good chosen when the card is played: "too flexible", it "defeats the purpose of strategical choice of deck building". Two cards under one technology, one for food and one for production, was one of three takes Claude served, the previous game's two Caravans, and the user picked it "to try". The goal, the money stocked, was one of three Claude served and the user picked it. The names were one of two pairs Claude served and the user picked them. The need of 30, the cost of 2 money, the gain of 3 and the cards' texts were served by Claude as riders and none was struck; the user called the need provisional.

The content's numbers, provisional: Food Trade is an instant aimed at nothing, costing 2 money, and the city gains 3 food; Material Trade is an instant aimed at nothing, costing 2 money, and the city gains 3 production; the technology needs Tanning and Bread and unlocks one copy of each card; the achievement counts the money in the city's stock, needs 30 and pays 1 influence.

**Doc-impact:** `docs/ages/STONE.md`.

**Scope:**

- In: the two cards, the technology and its achievement in the Stone Age's content; the six text entries; the four edits of the age's page.
- No mechanism is new, so no rules test is added: each card gains a stock for a cost as Bread does; the achievement reads the chronicle as it stands, as Bread's, Agriculture's, Tanning's and Raft's do, and the fixture already holds an achievement reading a stock.
- No spec of its own: neither card has a rule of its own. The tree's spec walks the tree the new plate stands in.
- The goal counts the money the city's stock holds, however it came. It is recorded the moment the stock stands at the need, and money paid after does not undo it. Nothing costs money before Bartering is learned, so on the chronicle that reaches it the stock is everything gained.
- No play reaches the goal with no card: the Tannery is money's one source.
- The need of 30 is arithmetic, not measured on maps: one Tannery gives 2 money a turn while a population works it, so 15 turns of one Tannery or about 8 of two. How early a Tannery can stand was not measured; weighing the need is the balance pass's.
- The goal reads one line on the plate: the sentence measures 66 px at the plate's font, against about 156.
- Priced against what does the job: a Farm gives more food a turn for the same production. The trades give production out of a tile carrying deer or cattle, which no building gives, and a stock that is kept and paid in one turn. The numbers are the previous game's Caravans' as they were; weighing them is the balance pass's.
- Bartering is the first technology to unlock two different cards. The plate reads one line a card, in the content's order.
- Out: a trade for military, a trade standing on the map that takes money at every income, and a trade with a camp. Each was served and not taken; none is an idea unless the user jots it.
- A chronicle in progress needs no care: no save is owed anything before the Bronze Age.
- Reconcile, the cards: each goes through the door Bread gains a stock through, as it is; what differs is which stocks.
- Reconcile, the goal: it is a count read on the chronicle as it stands, as four of the age's goals are, and keeps no tally.
- Reconcile, the plate: its reward lines are built as every plate's are, one a card, then the influence; no plate has read two card lines before, so the visual check looks at this one.

**Traps:**

- The tree stands a column in the content's order, and a technology's column is one after the furthest it needs: the technology and the achievement are declared after Raft's and before Fishing's, so Bartering's plate stands in the fourth column above Fishing's. Megalith, a later line, goes above it.
- The plate reads four lines under its name, the goal's one and the reward's three; Tanning's reads five, so no plate grows.
- Each card is aimed at nothing, as Bread is, and its effect is composed from the rules' own helper for a stock gained; nothing is added to `src/rules/`.
- A card's cost is drawn by the card's face from the content: the rules entry says the gain alone, the number against its glyph, and ends in no period. The goal's entry holds its number against the glyph the same way, with no space.
- The coherence test reads a name and a rules entry for every card, a name for every technology and a goal for every achievement: the six entries land with the content or it throws.
- A card's name is reached in code through its text key alone, never a re-typed literal.
- "Buy" is the glossary's verb for a copy paid in influence: no sentence, on the page or in a comment, says money buys.
- Neither card is a building or a unit: neither takes a mark or a colour.
- The collection gains two cards for a campaign that has learned Bartering; a browse or deck-editing spec red on CI for frame starvation is the known overflow the board's line _The collection scrolls_ answers, and is reported, not chased.
- Comments are for traps only, in every file the line touches.

**Plan:**

1. `src/content/stone.ts`: the two cards, the technology and the achievement stand, the last two between Raft's and Fishing's, Food Trade ahead of Material Trade.
2. `src/ui/text.ts`: the six entries stand, so the coherence test passes.
3. `docs/ages/STONE.md`: the four edits. The board line and this file are deleted.

One commit: the line carries no mechanism.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/tree.spec.ts`. CI proves on the push: `e2e/pin.spec.ts`, `e2e/launch.spec.ts`, `e2e/ending.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/deck-editing.spec.ts`, `e2e/reference.spec.ts`, `e2e/archipelago.spec.ts`. The visual check looks at Bartering's plate in the tree's fourth column above Fishing's, available on a campaign that has learned Tanning and Bread, its two card lines among its reward, and at the cards Food Trade and Material Trade shown large.
