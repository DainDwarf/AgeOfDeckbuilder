# Agriculture

**Line:** **Agriculture** — the Stone Age's catalogue holds the technology Agriculture, needing Settlement, its achievement counting the plain tiles inside the border toward a need of 5 and paying 1 influence, and the card Farm, one copy unlocked: a single-use building on plain, costing 4 production and giving 2 food; `docs/CHRONICLE.md` says a single-use building card builds once; `npm test` passes with the catalogue's coherence tests, and `e2e/farm.spec.ts` builds a Farm on screen. Doc-impact: `docs/ages/STONE.md`, `docs/CHRONICLE.md`.

**Spec:** `docs/CHRONICLE.md` _Cards_ (the building kind, single use), _The city_ (the border, income on an assigned tile) and `docs/META.md` _The campaign_ (an achievement read on the chronicle after every change, as a count toward a need) stand as the spec and do not change beyond the sentences below. The sentences this line writes:

- `docs/CHRONICLE.md` _Cards_, the **Building** item: the two sentences "A copy bought in the meta makes the deck faster, never the city bigger. Consuming a building card on play was rejected: the deck would be the city's blueprint and the chronicle merely where it is built." go, and in their place stands: "🔧 A building card that carries single use builds once: the copies a deck holds are how many of that building the city can build, and a copy bought in the meta makes the city bigger."
- `docs/ages/STONE.md` _The technologies_, a new item above Fire's: "**Agriculture** needs Settlement. Its goal reads the chronicle as it stands: the plain tiles inside the border, the city's own tile counted when it stands on plain. It unlocks the card **Farm** and pays influence."
- `docs/ages/STONE.md` _The cards_, a new item above Fire's: "**Farm**, a building on plain giving food, built through a worker for production, single use: the copies a deck holds are how many farms the city builds."

The player-facing entries, each ending in no period:

- The technology's name: "Agriculture". The card's name: "Farm". The building's name: "Farm".
- The card's rules entry, on two lines as a camp reward's: "Single use." then "Build [building:farm] on [terrain:plain]".
- The goal's entry, its need filled from the achievement: "Have {need} [terrain:plain] inside your border", which reads "Have 5 [Plain] inside your border".
- Nothing else is new: the plate's reward reads through `plate.cards` as "1 [card:farm]", the refusals over a tile are the ones Shelter raises, and the building's small card and its row in the infopanel read the name and the yield as every building's do.

**Doc-impact:** `docs/ages/STONE.md`, `docs/CHRONICLE.md`.

**Scope:** In: the technology, its achievement, the card and the building in the Stone Age's content; the building's name, mark and colour on the screen; the text entries; the two pages; one spec that builds a Farm on screen.

Out: the three other doors; the pinned achievement's ledger; the tree's columns; single use moved from the card to the building kind; pillage; a card bringing back what left the chronicle; any change to Trapping, Shelter or the Nomadic deck; any rules change — single use already stands on a building card in `src/rules/`.

The numbers, all provisional and to be played: a need of 5, 1 influence, one copy of Farm, 4 production, 2 food.

No mechanism is new, so the line adds no rules test: single use is proven on the fixture, a building built through a worker is, and so is an achievement counting what stands toward a need above one. The content gets the coherence checks alone.

Corners decided at intake:

- Farm is built on plain and on no other terrain. A fertile plain takes it and keeps its feature; a plain a river runs along takes it.
- It is built as Shelter is: through a worker standing on the tile, inside the border, on a tile whose building slot is free. So the city's own tile and a camp's refuse it.
- Played, the card leaves the chronicle; discarded unplayed, it comes around. A Farm with no free plain inside the border, or no worker on one, is a blank draw, and nothing warns of it.
- A farm yields as any building does: at income, on an assigned tile no enemy occupies.
- A deck holds cards of any age, so a Farm is built in a Nomadic chronicle when the deck holds one.
- Farms and Shelter share the plain's slots; Shelter also stands on forest and hills. Nothing keeps a slot for it.
- The goal counts every plain tile the city holds, as the chronicle stands: assigned or not, occupied or not, the city's own tile when it stands on plain, a forest inside the border burned to plain. It is recorded the moment the count reaches the need and stays recorded if the border's plain later counts fewer.
- The goal is reached on turn 21 at the earliest, culture having the city as its one source; an empty deck reaching it on the stand-in schedule is accepted, the real schedule permitting no idle play that long.
- In the Stone slice Agriculture is declared before Fire, technology and achievement alike, so its plate stands above Fire's in their column, in the skeleton's order.
- A campaign begun before this line needs nothing: one that has learned Settlement finds Agriculture available, and a chronicle in progress keeps the achievements it was launched with.

What the reconcile chose:

- Farm's card goes through what Shelter's goes through, as it stands: the worker, the border, the free slot, the building's own terrains. The differences are meant and are content: plain alone, a yield, single use.
- The goal's count goes through the achievement as it stands, read on the chronicle with no tally, as the Nomadic victory's is.
- On the map the farm's mark takes the colour Shelter's takes, the player's own building, and is a flat rectangle, wide enough to show under a unit as the other building marks are: the stand-in follows the placeholder dogma and is no fork.
- The keyword reads on the card's face as it does on the camp's rewards, a line of its own above the sentence.

**Traps:**

- The plates of one column stand top down in the order the catalogue's technologies table lists them (`layOutTree` in `src/ui/tree-layout.ts`), which is the order the slice declares them; a chronicle's achievements are named in the order its age declares them.
- Every achievement's count is read at the launch too, on a chronicle whose city stands nowhere and holds no tile, and the coherence test wants an integer back on a chronicle launched and settled in the age.
- The coherence tests in `src/content/catalogue.test.ts` refuse a building with no name, no mark or no colour, a card with no name or rules entry, a technology with no name, an achievement with no goal, and a name in a rules entry or a goal that resolves in no table of its kind: `[building:farm]` needs the building in the buildings table, `[terrain:plain]` the terrain.
- A building's colour is a role of `LOOK.building` in `src/ui/look.ts`, not a value; Shelter's role is the one a player's building takes.
- `docs/PHASER.md` _Rendering under WebGL_: a stroked Polygon skips a point whose origin-shifted position lands on the raw point before it. A centred diamond meets it; the worker's block and the oasis' square do not, and a centred rectangle does not either.
- The Stone slice brings the card, the building and the technology and owns the achievement; `merged` refuses an id two slices bring to one table, and the fixture's own farm, `PH_Farm`, is the fixture's alone.
- The catalogue's version has stood at `'1'` through every content line and this one does not move it.
- A chronicle carries Agriculture's achievement only when launched with Settlement learned; the specs and tests that launch with nothing learned never read it. `e2e/tree.spec.ts` opens one campaign a won chronicle paid into, where the Stone Age's doors stand available: two plates in that column from this line on.
- In a spec, `launchedOn` in `e2e/chronicle-screen.ts` launches in the first age on a civilization handed in, and a deck holds cards of any age; `landed` there is the standing shape of a building's fixture — a tile beside the city claimed through `apply`, the card's cost gained, a worker entered on the tile, the chronicle charted, the aim asked whether it admits the tile. A single-use card played is in no pile afterwards, which the page's chronicle equal to the rules' outcome already says.

**Plan:** One commit, nothing inert before it, since no mechanism is new. The work lands in this order:

1. `src/content/stone.ts`: the technology, the achievement, the card and the building stand in the catalogue, Agriculture declared before Fire.
2. `src/ui/text.ts`, `src/ui/marks.ts`, `src/ui/look.ts`: the five entries, the farm's mark and its colour role, so the coherence tests pass.
3. `e2e/farm.spec.ts`: one test, a Farm built on screen on the plain a worker stands on inside the border — the page's chronicle is the one the rules' play leaves, and the map shows one building more.
4. `docs/CHRONICLE.md` and `docs/ages/STONE.md` take their sentences, and the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/farm.spec.ts`. The visual check: on the campaign screen, on a campaign with Settlement learned, Agriculture's plate stands available above Fire's with its goal, its reward under it, no plate taller than before; on the chronicle screen, a farm's mark on a plain tile, outlined whole, readable under a worker, and its small card raised from the name on Farm's face reading its yield. CI proves on the push: `e2e/tree.spec.ts`, `e2e/campaign.spec.ts`, `e2e/collection.spec.ts`, `e2e/launch.spec.ts`, `e2e/ending.spec.ts`, `e2e/reference.spec.ts`.
