# The near draw

**Line:** One weighted draw for everything an event or a strike places or takes near the player, every candidate tile weighing an eighth per tile of distance from the nearest held tile, held tiles at full weight, the far ones standing in when none stands near; the camp's span, the inside-the-border gates and the nearest-ring draw replaced by it — done when one draw of the rules picks every tile an event or a strike places onto or takes near the player's city, weighted an eighth per tile from the nearest tile the player's city holds and never a tile the neutral holds; no rule reads the border or a span to pick such a tile, but for the camp's three-tile standoff from the player's city and the flood's buildings; Abandon a herd is refused by nothing and Make room while no tile takes a camp; the four pages say so; the fixture tests hold the draw; the coherence test passes; and `e2e/predators.spec.ts` proves the wolves taking a herd outside the border.

**Spec:** `docs/CHRONICLE.md` _The schedule_ and _Enemies and camps_; `docs/GLOSSARY.md`; `docs/ages/NOMADIC.md` _The events_; `docs/ages/STONE.md` _The events_. The sentences to land:

`docs/CHRONICLE.md` _The schedule_, a paragraph of its own between **An event deals its answers** and **An event carries lore**:

> **An event lands near a city.** Where an answer or a strike places something onto a tile or takes something off one, the tile is drawn **near a city**: among the tiles that qualify for it, one drawn seeded, each weighing less by a fixed factor 🔧 for every tile it lies from the nearest tile that city holds, the held tiles at full weight, the city's own tile among them, and never a tile the other city holds; so the far tiles are drawn only while none nearer stands, and the draw is never empty while one qualifying tile stands on the map. Where several are taken, each is drawn anew among those left. A draw that qualifies no tile takes nothing, or is refused, as its answer says. The border as a gate was rejected: an answer refused while nothing stands inside the border is a problem the player keeps away from by claiming nothing, and what happens twelve tiles from the player's city is nothing that happened to the player. Weighing by ring rather than by tile was rejected: one bare tile beside the city would be drawn as often as the twelve on the ring after it.

`docs/CHRONICLE.md` _Enemies and camps_, **Enemies enter from camps**, a sentence added after "and a camp is a camp in everything however it came to stand":

> A camp an answer places is drawn near the player's city among the tiles a camp lies on, the slot empty, no unit standing, the ground running to that city from them, no nearer than three tiles 🔧 from that city's own tile and apart from every camp standing 🔧; where no such tile stands, the answer says what it does instead.

`docs/GLOSSARY.md`, a row after **border**:

> | **near a city** | How an answer or a strike draws its tile: seeded, each tile weighing less the further it lies from the tiles that city holds, never the other city's. | nearby, close to, around (for a draw), in the vicinity |

`docs/ages/NOMADIC.md` _The events_:

> - **A rival band.** _Fight them_: their warriors enter the map as one raid and come. _Make room_: a new camp is placed near the player's city with its guards on and around it, one at first — a door for the raids to come, and a capture with its rewards for a band bold enough; it is refused while no tile takes a camp. Both answers cost no stock: raiders at the player's city now against a camp beside it for good.
> - **The herd**, rare and fortunate. _Hunt it_: food now. _Follow it_: deer are dealt onto a forest tile or cattle onto a plain tile carrying no feature, drawn near the player's city, and the band knows where the herd went: the tile is charted where it was not, in fog unless something sees it. Both are gains; a fortunate event is a breath, not a decision.

`docs/ages/STONE.md` _The events_, the bullets rewritten, the rest of each as it stands:

> - **Wildfire.** The band's event, dealt with a third answer between its two. _Burn the forest_: the challenge **Embers** is added to the discard pile; played by nothing, at the end of every turn it stays in the hand it burns one forest tile into plain, drawn near the player's city, the feature and what stands on the forest going with it and the population working the tile staying on it, nothing once none stands; it gains influence on victory. Wildfire is food now against the forest over time for influence against production now.
> - **Flood.** The low ground floods, wherever the player's city stands. _Lose the fields_: improvements are removed, drawn near the player's city, more on a later turn; once none stands, the buildings inside the border go in their place, drawn seeded among those standing, the player's city the last of them. _Settle the floodplain_: the challenge **Floodplain** is added to the discard pile; played by nothing, it removes one, in the flood's order, at the end of every turn it stays in the hand, and gains influence on victory. _Dig channels_: production paid for each thing the flood would take, more than an improvement costs to place, so paying is never the plain saving while improvements stand. Flood is production now against what stands now against improvements over time for influence.
> - **Predators.** Wolves come for the herds. _Abandon a herd_: deer and cattle tiles lose their feature, drawn near the player's city, more on a later turn, what stands on the feature going with it, nothing once none stands. _Let the farmers handle it_: the challenge **Wolves** is added to the discard pile; played by nothing, it kills one population at the end of every turn it stays in the hand, and gains influence on victory. _Defend the herds_: military paid for each herd the wolves would take, whatever stands, so defending is never free. Predators is the herds now against population over time for influence against military now.
> - **Drought.** The rains fail, wherever the player's city stands. _Rain dance_: the challenge **Rain dance** is added to the discard pile; played by nothing, at the end of every turn it stays in the hand it dries one plain or forest tile into desert, drawn near the player's city, the feature and what stands on the old terrain going with it and the population working the tile staying on it, nothing once none stands; it gains influence on victory. _Rationing_: food paid, more on a later turn. _Buy grain_: money paid, more on a later turn, so a deck that builds the Tannery has a way out that keeps its food. Drought is the land over time for influence against food now against money now.

The grievance's bullet stands as it is: "a camp is placed near the player's city" now reads the term, and "where no tile takes a camp those warriors enter as a raid" is the fallback kept.

Player-facing entries, every one written out; the keys are the implementer's, the words are not:

| Entry | Text |
| --- | --- |
| Floodplain, rules | `Removes one improvement near your city, a building inside your border once none stands, your city last` |
| Rain dance, rules | `Dries one [terrain:plain] or [terrain:forest] near your city into [terrain:desert]` |
| Lose the fields, rules | `The flood removes {improvements} improvement near your city, {buildings} building and {city} city` |
| Settle the floodplain, rules | `Add [card:floodplain] to the discard pile. Each turn it stays in your hand, it removes one improvement near your city, a building inside your border once none stands, your city last` |
| Abandon a herd, rules | `The wolves remove {deer} [feature:deer] and {cattle} [feature:cattle] near your city` |
| Rain dance, answer rules | `Add [card:rain-dance] to the discard pile. Each turn it stays in your hand, it dries one [terrain:plain] or [terrain:forest] near your city into [terrain:desert]` |
| Follow it, rules | `Near your city, one [terrain:forest] gains [feature:deer] or one [terrain:plain] gains [feature:cattle]` |
| The camp refusal | `No tile takes a camp` |
| The herd refusal | removed with its block |

Embers' two texts, Make room's and the grievance's already say "near your city" and stand.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Scope:**

In:

- **The draw.** One helper of the rules: given the chronicle and a predicate on tiles, the tiles the predicate admits that the neutral does not hold, each weighing an eighth to the power of its distance from the nearest tile the player's city holds, the held tiles at nought, one drawn seeded through the generator's weighted pick; and a counted form drawing that many one after another, each anew among those left, fewer where fewer stand. The eighth is one constant of the rules, in one place, and no page states it. The city standing nowhere draws nothing.
- **Through it:** the herd's Follow it (bare forest or plain, the feature the terrain's, the tile charted after, as today); Embers' strike (forest a terraform into plain reaches); the Flood's improvements (every improvement standing, each tile counting once for each it carries, the city's own tile included) and the Floodplain's; the wolves' Abandon a herd, its reading and its landing drawing alike (deer and cattle tiles, every layer going with the feature); the Rain dance's strike (plain or forest a terraform into desert reaches, the city's own tile like any other); and the camp's placing for Make room, the grievance's Escalate, the fixture's encampment and the fixture's siege: the tiles a camp lies on, the slot empty, no unit standing, the ground running to the player's city from them, no city holding them, three tiles at least from the player's city's own tile, and apart from every camp standing by the content's number, as today. The fixture's sprawl, deluge, cull, rivals, wildfire and herd go through it too.
- **Not through it, by decision:** the Flood's second stage, the buildings inside the border drawn seeded among those standing, the player's city last, as today; Heal's aim; a raid's entry around its door; the generator's camps at the opening; a unit's nearest by its walk.
- **The refusals.** Abandon a herd names no block: with no deer or cattle standing on the map it takes nothing and reads nought of each. Make room keeps its block, true while no tile takes a camp anywhere, with the text above; the grievance's Escalate keeps its camp-or-raid fallback on the same fact. Measured at the settle over 200 seeds, no tile for a first or a second camp on 0 maps of either age and region, for a third on 36 Stone archipelago maps.
- **The span goes.** The camp's `fromCity` span, the content's and the fixture's, and the block member for the herd with its refusal text.
- The texts above, the four pages, the board line deleted.

Out:

- No change to what an event takes or costs, to the counts, to the escalations, to the schedules, to the camp's `apart`.
- No change to how a raid enters, to the generator, to the neutral's scripts.
- Where the helpers live and how the predicate and the count are passed is the implementer's.

Corner cases decided:

- The player's city's own tile is held and weighs full: the Rain dance may dry it and the Flood take the improvement on it, as today.
- A tile a unit stands on is drawn like any other for a feature deal, a feature removal and a terraform, as today; for a camp it is excluded, as today.
- The near draw crosses water: the herd may be dealt on an island forest beside the border, as the nearest-ring draw could. The camp's ground-runs-to-the-city condition stays its own.
- A tile the neutral holds is never drawn, whatever the event. A tile nobody holds is, however far.
- The counted draws take fewer where fewer stand and nothing where none does; the Flood's reading counts improvements standing anywhere but the neutral's land, then buildings inside the border, then the city.
- On the turn the border is the city's own tile, a camp lands on the third ring or beyond, the third the likeliest.

Reconcile: three draws become the one near-a-city draw taking the predicate and the count as parameters — the uniform draw inside the border, the nearest-ring draw from the city and the camp's span filter; the Flood's buildings stage keeps the uniform draw inside the border, the difference meant. The weighted pick is the generator module's, used as it is. The raid's entry around its door and the generator's camps at the opening stay apart.

**Traps:**

- `Block` in `src/rules/state.ts` is a closed union the screen reads a refusal text for by member: removing `no-deer-or-cattle` removes its `refusal.<member>` entry in `src/ui/text.ts`, and the coherence test in `src/content/catalogue.test.ts` reads every answer's refusal on a launched chronicle.
- `pickWeighted` in `src/rules/rng.ts` takes `[item, weight]` pairs: read its contract before handing it weights as small as an eighth to the twelfth power, and whether it refuses a weight of nought.
- An answer's reading and its landing must draw alike: both start from the chronicle's generator as it stands, so the wolves' reading of what it takes and the Flood's count match what lands, as today's inside-border helpers do.
- Follow it charts the tile after the deal: the helper hands back where it landed.
- A terraform's candidates are the tiles a terraform into the target reaches (`reaches` in the rules), as the nearest draw filters today.
- `holderOf` in `src/rules/state.ts` says which city holds a tile; `holds` is the player's alone, and the camp's filter today reads `holds`, not both cities.
- The siege fixture places five camps through `campsPlaced` with a span of its own: the standoff and `apart` replace it; the fixture's five may not all fit on a small field, and its tests say what the fixture then does.
- The seeded tests in `src/rules/schedule.test.ts` on the inside-border removal, the feature removal, the terraform inside, the nearest terraform, the nearest feature deal and the camp placing assert tiles a seed picked under the old draws: rewrite them to the rule — nearest first by weight, seeded among the rest, the neutral's land never, the standoff, the count, nothing where none — and never re-pin a tile blindly.
- The glossary lint reads the forbidden words of the new row across the pages and the texts.
- `e2e/predators.spec.ts` builds its chronicles through `wonCampaign()`, `firstDealtAlone` and `dealtAloneOn`, and rests before it presses (`docs/PHASER.md`); its refusal test becomes a test of the wolves taking a herd standing outside the border when none stands inside, the tile read off the landing's changes, not pinned. `e2e/flood.spec.ts` removes the clay pit on the city's tile: check it stands alone as the only improvement, or read the tile off the landing.
- A stock a harm takes past nothing is paid in people inside the harm helper, the player's city alone; nothing here changes it.

**Plan:**

1. The mechanism: the near-a-city draw and its counted form in the rules (`src/rules/schedule.ts`), the eighth its one constant; the inside-border draws, the nearest draw and the camp's span filter replaced by it, the camp's standoff and `apart` kept; the herd's block member gone (`src/rules/state.ts`); the fixture's content reshaped (`src/rules/fixtures.ts`) and the schedule and scripts tests rewritten to the rule (`src/rules/schedule.test.ts`, `src/content/scripts.test.ts`, `src/rules/campaign.test.ts` where it lands a removal). Leaves standing: every test green on the fixture, the real content not yet compiling against the new door, or compiling through it unchanged in words.
2. The content and its docs: the Nomadic and Stone call sites (`src/content/nomadic.ts`, `src/content/stone.ts`, `src/content/scripts.ts`), the texts (`src/ui/text.ts`), `e2e/predators.spec.ts` and `e2e/flood.spec.ts` where it needs it, the four pages, the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `e2e/predators.spec.ts`, on a won campaign in the Stone Age: the Predators dealt alone with every herd inside the border removed and one standing outside it, Abandon a herd offered and taken, the deer gone from the tile the landing names and the deal closed. CI proves on the push: `flood`, `drought`, `wildfire`, `grievance`, `camps`, `landing`, `deal`, `capstone`, `resume`, `reference`, `console`, and the rest of the suite.
