# The city's readings

**Line:** The city's readings — culture reads the stock over the culture threshold, population reads the idle alone under the word idle, and each of the two fills its well in the accent while city mode has that act waiting; `docs/CHRONICLE-SCREEN.md` says so and the city-mode spec asserts it. Doc-impact: `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/CHRONICLE-SCREEN.md` _The resource bar_, the whole section. Today the bar reads culture bare and population as idle over all of it, and nothing outside city mode says a claim is affordable or a held tile stands unworked. The indicator is the bar, not the map: tiles are dense already, and a state of the city reads on the bar. The two readings that enter city mode are the two that light, so the bar says "city mode has something for you" in the one colour the city is known by everywhere on the screen. Population reads the idle alone: the whole it read over did not count the units while the growth threshold does, so food's 3/6 beside population's 1/3 was a lie once a unit was out, and the whole is what the player acts on nowhere. The sentences, written out:

- `CHRONICLE-SCREEN.md` _The resource bar_, replace "The resource bar reads population as the idle population over all of it, and food as the stock over the growth threshold." with: "The resource bar reads food as the stock over the growth threshold, culture as the stock over the culture threshold, and the idle population alone, under the word idle. Culture and population are the two readings that enter city mode, and each fills its well in the accent while city mode has that act waiting: culture's while the stock covers the culture threshold and a tile the city may claim stands, population's while one is idle and a tile the city holds has nobody on it, its own tile and an occupied one no exception. The well is the one a latched reading sits in, sunk the same way, in the accent in place of grey; a reading latched and filled at once is in the accent."
- The city mode paragraph's "by pressing culture or population on the resource bar" stays true and stands; so does the yield overlay's "the reading of a resource shown is latched down in the bar".
- `docs/GLOSSARY.md`: no row changes. The reading's word is the glossary's own **idle**; "Idle pop." was put aside because the population row forbids "pops".

Player-facing text, written out:

- The population reading's word: `Idle` in place of `Population`.
- The population reading's tooltip: `Idle population. Assign to tile or turn into units.` in place of today's.
- Culture's reading takes the shape food's has, the count over the whole, through the entry that shape already has; population's reading is the number alone, as production's is. No other entry changes: culture's tooltip and the threshold a tile wears stay as they are.

The look, from the mockup the user chose on: the well of a reading with an act waiting is the well a latched reading sits in — the same zone, the same floor rectangle, the same edge above and to the left and light below and to the right, the reading pressed one pixel down and right and its word in the sunk ink — with the floor in the accent instead of the latch's grey. No other element is added to the bar, and no reading moves.

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- Culture's reading over the culture threshold; population's reading the idle alone under `Idle`, with its tooltip.
- The well of culture and of population filled in the accent while the act waits, on every render of the bar, and taken down on the render after the act is spent or the state moves under it.
- The two predicates, in the rules' own words: a claim waits when some tile the city may claim is one the city can pay for — the same reading the city-mode click answers a claim by; an assign waits when the city has one idle population and holds a tile nobody stands on. Where they live is the implementer's; a predicate that lands in `src/rules/` gets one Vitest test on the fixture, one each.
- `e2e/play-out.spec.ts`'s readings assertion following the two new shapes, and `e2e/city-mode.spec.ts` asserting the wells: culture's standing from the moment the stock covers the threshold beside a claimable tile and gone once the claim is paid; population's standing while one is idle over an unworked held tile and gone once it is assigned.
- The design page sentences above, verbatim.
- `workflow/IDEAS.md`'s "End-of-turn warning for idle population" deleted in the ship commit: this reading answers it as a standing state, which is what the shelving asked for.

Out:

- Any mark on the city's tile or on the map outside city mode: rejected by the user, tiles being dense already.
- Culture's tooltip naming the threshold, and the threshold a selected tile wears: unchanged.
- A tooltip or note on the filled well: the well says what it says by its colour, and the readings' tooltips are as they are.
- Any change to the rules of claiming, assigning or growth.

Corner cases decided here:

- A stock that covers the threshold with no claimable tile does not fill culture's well: the predicate is the act, not the number.
- A held tile an enemy occupies is a tile nobody stands on: the assign is admitted there, so the well fills. The reading reflects the rule, never whether the act is worth taking.
- The city's own tile is a held tile like any other for the assign predicate, as it is for the click.
- On the settle phase culture reads `0/0`, as food does there today, and idle reads `0`; no well fills, the city holding nothing.
- The yield key latches culture's reading grey with the five others; a claim waiting at the same moment stands the accent over the grey. The two states are read on one well; the accent wins.
- A well fills and empties on the bar's render and never by a tween: the readings tick, the well snaps.
- The readings' zones, names and presses do not change: culture and population still enter city mode by a press, and their wells cover the zones they cover today.

**Traps:**

- `e2e/play-out.spec.ts` builds the expected readings from the chronicle's resources as plain numbers and then overrides food and population; culture must be overridden to the over shape and population to the idle alone, or the spec fails on the first render it reads.
- `e2e/city-mode.spec.ts` presses the readings by the names `reading-culture` and `reading-population`, and the wells are named `reading-<key>-well`; the population reading's word changes, its key and names do not.
- The culture threshold in `src/rules/city.ts` is reachable today only through a tile's cost; the bar reads it with no tile in hand.
- The bar's latch paints the well of every shown resource and hides every other, culture's included, on every change of the overlay; the accent fill must survive that call and the latch must survive a render, since either can arrive alone.
- The bar's grouped stages answer `claim` and `assign` with nothing and the screen renders after the sequence; the well must follow that render, not the group.
- The digit slot every value grows into is measured on `00/00`; the idle reading is narrower than it was, and the culture reading is at most that wide until a three-digit stock, which grows into the gap as any value does. The word `Idle` is narrower than `Population`, so the right group shifts; nothing overlaps, the layout closes the gaps.
- The stand-in city and the nomadic city yield one culture a turn; the claim the city-mode spec pays already ends as many turns as the threshold says, reading it through the rules — the well assertion goes beside it, not in place of it.
- `e2e/hover.spec.ts` reads the bar's tooltips on food alone; the population tooltip's change breaks no spec.

**Plan:**

1. The rules: the threshold reachable with no tile, and the two predicates wherever they land, each with its test where it lands in `src/rules/`. `npm test` passes; nothing on screen changes.
2. `src/ui/text.ts` and `src/ui/resource-bar.ts`: the population word and tooltip, culture's reading over the threshold, population's reading the idle alone, and the well filled in the accent while an act waits, standing with the latch. `npm run check` passes.
3. `e2e/play-out.spec.ts` following the new shapes; `e2e/city-mode.spec.ts` asserting the two wells up and down.
4. `docs/CHRONICLE-SCREEN.md`, the sentences above verbatim; `workflow/IDEAS.md`'s line deleted; the board line deleted.

**Verify:**

```
npm run check
npm test
npm run lint
npx playwright test e2e/city-mode.spec.ts
npx playwright test e2e/play-out.spec.ts
```

Then the visual check on the running app, with both wells up: the accent floor reads on the bar's grey at play size, the one-pixel sink is visible, and no reading overlaps its neighbour or the Menu button.
