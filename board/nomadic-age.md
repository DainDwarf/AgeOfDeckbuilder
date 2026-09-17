# The nomadic age implemented

**Line:** The nomadic age implemented — `src/content/nomadic.ts` is the catalogue a launch with no choice lands on: the three units with the scout, the land and its three features, the cards and the deck, Lean season as the schedule's one event, the first shelter and the camps' two rewards, every id named on the screen and coherence-tested; the stand-in stays as the e2e suite's content. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`.

**Spec:** [`docs/ages/NOMADIC.md`](../docs/ages/NOMADIC.md) whole, under [`docs/CHRONICLE.md`](../docs/CHRONICLE.md) _The rules_. Every number below is provisional: the balance pass owns it, and no test reads it.

Sentences to change in `docs/CHRONICLE.md`:

- _The turn_, the turn-0 sentence: "today the one that **settles** the city on a charted tile that takes a city, and the stand-in's free claims beside it" becomes "the one that **settles** the city on a charted tile that takes a city, and the ones that enter the band's first units beside it".
- _Cards_, the **Settle** bullet: "what it refuses beyond the charting is content: the stand-in's names plain, forest and hills and makes the tile urban" becomes "what it refuses beyond the charting is content: the Nomadic Age's names plain, forest and hills and leaves the terrain as it stands". The bullet's last sentence, "The stand-in's free claim is a third.", is deleted.
- _Events and the capstone_, the camps paragraph: the two sentences "🔧 Until the deck is data the stand-in's camps roll at no odds: nothing enters on its own." and "🔧 Until the deck is data the reward is one stand-in card: an instant, single use, that gains some of every core resource." are deleted.

Sentence to change in `docs/ages/NOMADIC.md`, _The cards_, the **Gather** bullet: "gains the yield of the tile the worker stands on — terrain, feature and river" becomes "gains the yield of the tile the worker stands on, whatever its layers and the river give". Nothing else on the page changes: it carries no number.

Every player-facing sentence, as an entry of `src/ui/text.ts`; the key is the prefix the lookups use and the id:

```
unit.worker              Worker
unit.warrior             Warrior
unit.scout               Scout
feature.fertile          Fertile
feature.game             Game
feature.flint            Flint
improvement.trapping     Trapping
building.city            City
building.camp            Camp
building.shelter         Shelter
card.settle              Settle
rules.settle             Settle the city on plain, forest or hills
card.first-worker        First worker
rules.first-worker       A worker enters on a charted tile
card.first-scout         First scout
rules.first-scout        A scout enters on a charted tile
card.worker              Worker
rules.worker             Turn an idle inhabitant into a worker
card.warrior             Warrior
rules.warrior            Turn an idle inhabitant into a warrior
card.scout               Scout
rules.scout              Turn an idle inhabitant into a scout
card.gather              Gather
rules.gather             Through a worker: gain the yield of its tile
card.trapping            Trapping
rules.trapping           Improve forest with trapping
card.march               March
rules.march              Refresh a unit's move points
card.shelter             Shelter
rules.shelter            Build the shelter. The age ends when it stands.
card.hunger              Hunger
rules.hunger             Takes food at the end of every turn it is still in the hand
card.stores              The stores
rules.stores             Single use.\n4[food] 4[production]
card.band-joins          The band joins
rules.band-joins         Single use.\nGain one idle inhabitant
event.lean-season        Lean season
answer.share             Share
answer-rules.share       Lays Hunger on top of the draw pile
answer.ration            Ration
answer-rules.ration      A raid of {warriors} enters from the camps
capstone-name.first-shelter   The first shelter
capstone-rules.first-shelter  Lays Shelter on top of the draw pile
victory.first-shelter    The shelter stands. The age is over.
```

The terrain entries and colours exist by terrain id and are reused; `terrain.urban` and its colour stay for the stand-in.

**Doc-impact:** `docs/CHRONICLE.md` and `docs/ages/NOMADIC.md`, the sentences above.

**Scope:**

In: the whole catalogue below, its coherence test, the text entries and marks for every id, the launch landing on it, the e2e suite naming the stand-in, and one inert shape change before the content: the catalogue's city entry loses its terrain field, and the rules gain a resource shocked.

Out: the four other events — A rival band, Wildfire, Departure, The herd — each its own board line; Hunger striking population, which lands with Departure's line; the biome rework and the region's numbers, the next line; the stand-in's deletion, which waits for the e2e suite to open on saves.

The catalogue, `version: 'nomadic'`:

- **Terrains**, one point each: plain gives food 1, movement cost one move point, elevation 0, lift 0, river food 1; forest gives production 1, two move points, elevation 1, lift 0, river food 1; hills give production 1, two move points, elevation 2, lift 1; coast gives food 1, water, elevation 0, lift 0; deep gives nothing, water, elevation 0, lift 0; mountain gives nothing, **names no movement cost** so it is beyond every unit for good, not water, elevation 3, lift 2. No urban: the nomadic city keeps the terrain it lands on.
- **Features**: fertile on plain, food 1; game on forest, food 1; flint on hills, production 1.
- **Buildings**: city on plain, forest and hills, yields military 1 and culture 1; camp on plain, forest and hills, yields nothing; shelter on plain, forest and hills, yields nothing.
- **Improvements**: trapping on forest, yields food 1.
- **Biomes**: land, sea and mountain exactly as the stand-in's tables and rim widths.
- **Region** `temperate`: the stand-in's region numbers unchanged — radius 8, centre 3, 26 tiles per biome, at least 5 biomes, the centre biome land, sea 0.3 and mountain 0.1, 3 camps at least 6 from the centre and 3 apart, the river layer as is — with feature shares fertile 1/6, game 1/6, flint 1/6.
- **Units**: worker — worker, health 2, damage 0, range 0, move 2, action 1, sight 2; warrior — health 5, damage 2, range 1, move 2, action 1, sight 2; scout — health 2, damage 1, range 1, move 4, action 1, sight 3. Move counts in `MOVE_POINT` hundredths as the stand-in's do.
- **Scripts**: `advance`, the stand-in's ADVANCE script, shared by both catalogues.
- **City**: building city, sight 2, idle 2. No terrain field.
- **Camp**: unit warrior, script advance, building camp, rewards stores then band-joins, odds 0.08.
- **Cards**:
  - `settle` — settle, costs nothing, aimed at a tile made of plain, forest or hills with its slot free; the effect is the settle alone, no terraform.
  - `first-worker`, `first-scout` — settle, cost nothing, enter their unit on the tile aimed at through the settle-entry helper.
  - `worker` — unit, food 2; `warrior` — unit, military 2; `scout` — unit, military 1; each through the unit-entry helper.
  - `gather` — instant, costs nothing, played through a worker with no tile refusal of its own; the effect gains the tile's whole yield, layers and river, the same reading income and the yield overlay take.
  - `trapping` — instant, production 2, through a worker on forest not yet trapped; improves the tile with trapping.
  - `march` — instant, military 1, aimed at a unit whose move points are spent; refreshes them.
  - `shelter` — building, production 8, through a worker on plain, forest or hills inside the border with the slot free; builds the shelter. In no deck: the capstone lays it.
  - `hunger` — hazard, production 2; its strike shocks food by 2, one more for every ten turns of the chronicle's turn, never below nothing. Food alone: population is untouched on this line.
  - `stores` — instant, single use, aimed at nothing, gains food 4 and production 4.
  - `band-joins` — instant, single use, aimed at nothing, one inhabitant arrives idle.
- **Deck** `nomadic`: cards gather ×8, worker ×2, warrior ×2, scout ×1, trapping ×2, march ×2; settle section settle, first-worker, first-scout, in that order.
- **Event** `lean-season`: `share` costs nothing, reads nothing, lays hunger on the draw pile; `ration` costs nothing, reads the warriors as the raid's count, enters that many from the camps. The count is one, and one more for every ten turns.
- **Capstone** `first-shelter`: lands by laying shelter on the draw pile; no second script; passes when any tile's building is the shelter.
- **Schedule** `nomadic`: spacing 3 to 5, capstone first-shelter in the window 12 to 18, the one entry lean-season weighing 1 on every turn.

Corner cases decided here:

- Gather on a tile inside the border gains what that tile also yields at income; on the city's tile it gains the city building's military and culture. Accepted: the numbers price it.
- A first unit may enter on the city's tile or before the city stands: the settle-entry helper asks nothing of the city.
- The settle keeps the tile's feature: a city on a fertile plain yields the feature too.
- A Hunger strike larger than the stock leaves nothing and nothing more.
- The scout attacks for one damage; it is weak, not harmless.
- The camp's warrior is the player's warrior kind: same stats, the enemy's faction.

**Traps:**

- The e2e suite's helper (`e2e/chronicle-screen.ts`) opens the page with seed, deck and schedule and no content, and the boot lands on the first catalogue listed. Once the nomadic is first, that address has to name `content=stand-in` or every spec refuses its deck. `e2e/boot.spec.ts`'s third test presses Launch on the launch page's defaults and asserts the stand-in's deck: with the nomadic first, the defaults are the nomadic's, so the test either chooses the stand-in's content face before Launch or asserts the nomadic's deck. Its first test names `deck=PH_Deck` with no content and needs `content=stand-in` too.
- The stand-in's enemy script lives in `src/content/stand-in.ts` under a comment saying it goes with the stand-in; the nomadic needs it. It moves to a module both catalogues import.
- `catalogued` refuses a region whose camps keep no further from the centre than the centre part plus the city's sight: 6 against 3 + 2 holds; do not lower either.
- `catalogued` refuses a camp whose unit cannot stand on every terrain its building names: the warrior's move of two covers forest and hills at two.
- A terrain naming no movement cost is crossed by nothing and its inspection reads `Mv —`: that is what the mountain wants, not an omission.
- The text lookups read `${prefix}.${id}`, so every id above is a key; a card's rules entry takes no values, which is why Hunger's text carries no number; an answer's rules entry does take the values its `reads` returns.
- The catalogue check that the city's building stands on the city's terrain goes with the field; `src/rules/fixtures.ts`, `src/rules/chronicle.test.ts` and `src/rules/map.test.ts` read the field today and name urban themselves after.
- The fixture's `settledLaunch` plays the first card of the hand on the centre tile, so the settle is first in the settle section.
- The launch page draws the version, region, schedule and deck ids as its faces: the ids are seen.
- The `[resource]` glyph tokens in a rules entry are drawn only on a card face.
- The stand-in's hazard strikes by writing the stock outright; the nomadic's goes through the new helper, since an effect changes the chronicle through the rules' named helpers alone.
- No test reads a real number of the content: the coherence test resolves ids, finds text and marks, and asks closures their cheapest answer, as `src/content/stand-in.test.ts` does.

**Plan:**

1. **Shape**, one inert commit: `src/rules/catalogue.ts` drops `city.terrain` and its check; the stand-in's settle and the fixture's name urban themselves; the tests that read the field name it. `src/rules/cards.ts` gains a helper that shocks one resource by an amount, floored at nothing, beside the helper that gains; one mechanism test on the fixture: a hazard whose strike outruns the stock leaves nothing, exercised by ending a turn with it in hand.
2. **Content**, one commit: the script module shared by both catalogues; `src/content/nomadic.ts` built through `catalogued`, listed first in `src/content/catalogues.ts`; `src/content/nomadic.test.ts` mirroring the stand-in's coherence test; `src/ui/text.ts` entries; `src/ui/marks.ts` marks and colours for scout, shelter, game, flint and trapping, flat polygons on the existing ones' precedent; the e2e helper and `boot.spec.ts` naming the stand-in; the docs sentences; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/boot.spec.ts`, and since the helper every spec opens through changes, `npx playwright test e2e/settle.spec.ts` as well.
