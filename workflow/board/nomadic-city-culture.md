# The Nomadic city yields no culture

**Line:** The Nomadic city yields no culture — the Hearth, the Nomadic city's building, gives military alone, and Settlement unlocks the Village in its place, giving military and culture; the Stone Age's camp is a building of its own, so neither Nomadic building stands on desert. Done when the catalogue builds with Settlement unlocking the Village in place of the Hearth and its coherence test passes, the fixture test of a technology unlocking a city's building passes, Settlement's plate reads the Village in its reward, and `docs/META.md`, `docs/META-SCREENS.md`, `docs/ages/NOMADIC.md` and `docs/ages/STONE.md` say so.

**Spec:**

- `docs/META.md`, the technology tree paragraph (the one opening "The campaign is a **technology tree**."): replace "a civilization, authored with its city section and the deck it opens with, a region, or the next age:" with "a civilization, authored with its city section and the deck it opens with, a region, a city's building in place of the one it names, taken by the city section of every civilization the campaign owns whose city holds that one, or the next age:".
- `docs/META.md`, the ending paragraph ("🔧 **The ending pays into the campaign**"): replace "the cards those unlock are added to the collection, and the player gets the influence they pay" with "the cards those unlock are added to the collection, the city's buildings they unlock replace the ones they name, and the player gets the influence they pay".
- `docs/META.md`, the civilization paragraph: replace "what it holds — the city's building, how far it sees, the population it opens with — is what influence buys 🔧." with "what it holds — the city's building, how far it sees, the population it opens with — is what influence buys 🔧, and its building is what a technology may replace."
- `docs/META-SCREENS.md`, the plate paragraph: replace "the cards with their copies, the region and the age, one to a line," with "the cards with their copies, the region, the age and the city's building, one to a line,".
- `docs/ages/NOMADIC.md`, _The settle_: replace "The city keeps the terrain it lands on, and its building gives **military and culture** on top of that terrain and nothing else. Nothing on the map yields military, so the city is where warriors come from, and the tile is a choice a new player reads off the map: a plain feeds growth, and hills and forest give production." with "The city keeps the terrain it lands on, and its building, the **hearth**, gives **military** on top of that terrain and nothing else. Nothing on the map yields military, so the city is where warriors come from, and the culture the border grows by is the sites' alone, so the border stays a few tiles. The tile is a choice a new player reads off the map: a plain feeds growth, and hills and forest give production."
- `docs/ages/NOMADIC.md`, _The achievement_: replace "Its technology is **Settlement**, which unlocks the Stone Age, and it pays influence." with "Its technology is **Settlement**, which unlocks the Stone Age and the **village**, the city's building in place of the hearth, and it pays influence."
- `docs/ages/STONE.md`, the page's lead: replace "its land, its neutral," with "its land, its city, its neutral,".
- `docs/ages/STONE.md`, a new section between _The sites_ and _The neutral_:

  `## The city 🔧`

  "The **village** is the city's building Settlement unlocks in place of the hearth, so every chronicle after the Nomadic Age's victory is played on it, a Nomadic one replayed among them. It gives **military and culture** on top of its terrain and nothing else, and stands on desert as on plain, forest and hills."

- Player-facing entries, `src/ui/text.ts`:
  - `building.city` 'City' goes; `building.hearth`: `Hearth`; `building.village`: `Village`; `building.stone-camp`: `Camp`.
  - `rules.settle`: `Place the [building:{building}]`, the building being the city section's — "Place the [Hearth]", "Place the [Village]".
  - `answer-rules.ration` and `answer-rules.fight`: `Your [building:{building}] is attacked by {warriors} [enemy:warrior]`, the building being the chronicle's city section's.
  - `answer-rules.make-room`: `A [building:{camp}] with {warriors} [enemy:warrior] is placed near your [building:{building}]`, the camp being the chronicle's age's camp building and the building the city section's.
  - `goal.megalith`: `Claim a tile {need} tiles from your city` — plain "city", no brackets: the tree has no city section to name.
  - `plate.building`: `[building:{building}]` — Settlement's plate reads "[Village]" on its own line, after "The Stone Age" and before the influence.
- Lore, `src/ui/lore.ts`: `capture.stone-camp` reads the `capture.camp` text verbatim: "The camp has fallen. Its stores lie open and its people wait to hear their fate: what do you take?"

**Doc-impact:** `docs/META.md`, `docs/META-SCREENS.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Scope:**

- In: a technology may unlock a city's building in place of one it names (the mechanism, one unlock at most per technology as a region is); learning it puts the new building in the city section of every civilization the campaign owns whose city section holds the named one, and leaves every other civilization as it stands; Settlement unlocks `village` in place of `hearth`; the `city` building renamed `hearth`, its yield military alone; the Village; the Stone Age's own camp building; the texts above.
- Content, numbers and looks: `hearth` (Nomadic slice) gives military 1 and stands on plain, forest, hills; `village` (Stone slice) gives military 1 and culture 1 and stands on plain, forest, hills, desert; the Nomadic `camp` stands on plain, forest, hills; `stone-camp` (Stone slice) stands on plain, forest, hills, desert and is the Stone Age's camp building, name, mark and lore as the Nomadic one's. Both city buildings wear the wall mark and the `civilization` colour, both camps the wall mark and the `enemy` colour — one entry per id, the sites' split being the precedent.
- Corner cases decided here: a civilization unlocked after the technology arrives with the city it was authored with; a chronicle in progress keeps the city section it was launched with, the swap being paid at the ending; a Nomadic chronicle replayed after Settlement is played on the Village; the swap is paid through the ending's learning like the cards, so a defeat pays it only where it pays the technology.
- The specs' chronicles stand on the city the campaign that reaches them holds: on the Hearth while nothing is learned, on the Village once Settlement is — every Stone Age chronicle, and every chronicle whose deck holds a card a technology unlocks, since a campaign owning one has learned Settlement. The spec helpers that launch a chronicle (`e2e/chronicle-screen.ts`) give it that city section; how they carry it is the implementer's.
- Out: Departure (its _Keep them_ now paid in the sites' culture alone) — it rides the balance pass rung; the neutral's city; any number beyond the ones above; a migration of saves holding the `city` id (save compatibility waits for the Bronze Age).
- Reconcile: the plate's building line goes through the plate's reward list as it is, a run like the card lines; the swap goes through the learning that adds a technology's cards, so the ending's payment and the save forge carry it unchanged; the Hearth and the Village, the two camps, stay apart as the sites' split does — same name or mark, one entry per id.

**Traps:**

- The city section is the civilization's, carried by the campaign and the save (`src/rules/campaign.ts`, `src/rules/save.ts` reading the building's id through the catalogue): the swap reaches the campaign's civilizations, never the catalogue's authored one. `learnedInto` is the step both `paidInto` and the forge's `tools/learned-with-needs.ts` go through.
- `cardRules` (`src/ui/text.ts`) reads the card alone, and the city section's card is drawn in the settle phase's hand, the browse, the launch pile, the deck editing and civilization modes, and shown large: each place hands its civilization's building.
- An answer's text is filled from the values its `reads` closure hands (`answerRules`); the city's building comes from the chronicle's city section, the camp from the chronicle's age.
- The Stone Age's camp spreads the Nomadic one (`...camp` in `src/content/stone.ts`), so its `building` is overridden there.
- Tables keyed by building id: `LOOK.building` (`src/ui/look.ts`), `BUILDING_MARKS` (`src/ui/marks.ts`), `capture.<building>` (`src/ui/lore.ts`), `building.<id>` (`src/ui/text.ts`); the catalogue coherence test asks each of a new id.
- `src/rules/catalogue.ts` refuses a civilization's city whose building names no ground; the unlock's two buildings get the data-coherence checks a region's unlock has, in the one rejection vocabulary.
- `rewardOf` (`e2e/chronicle-screen.ts`) mirrors the plate's reward list, in its order; it reads the building line from the rules as the others are read.
- `launchedOn` and `settledOn` (`e2e/chronicle-screen.ts`) launch on the catalogue's authored civilization, or on one a spec spreads from it with its own deck (`farm`, `fishery` and the other card specs), and `secondEra` hands only the age and the technologies learned: as they stand, every spec chronicle would stand on a Hearth, the Stone Age's and the Stone cards' among them.
- `src/ui/text.ts`'s head comment lists the entries that may mark a glyph.

**Plan:**

1. The mechanism, inert (no content uses it): the technology's unlock of a city's building in place of one, its catalogue checks, the swap on learning, the plate's line and `rewardOf`'s, the one test on the fixture — a learned technology swapping a civilization's city building, one holding another building left as it stands; `docs/META.md` and `docs/META-SCREENS.md`. Leaves every chronicle and campaign as today.
2. The content: `city` renamed `hearth` without culture or desert, `village` and `stone-camp` brought by the Stone slice with their names, marks, colours and lore, Settlement unlocking the Village, the texts naming the city section's building and the age's camp, Megalith's goal, the spec helpers launching on the Village past Settlement; `docs/ages/NOMADIC.md` and `docs/ages/STONE.md`; the line deleted from `workflow/BOARD.md`.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: `npx playwright test e2e/tree.spec.ts` — Settlement's plate reads "[Village]" in its reward. CI on the push, the specs that walk the changed paths most: `settle`, `browse`, `launch`, `civilization-mode`, `deck-editing`, `deal`, `camps`, `sites`, `inspect`, `yields`, `city-mode`, `pin`, `victory`, `ending`, `campaign`, and every spec launching a Stone Age chronicle (`archipelago`, `farm`, `fishery`, `tannery`, `irrigation`, `embark`, `trapping`, `heal`, `calendar`, `archer`, `pillage`). A visual check of the tree's Settlement plate, its reward one line longer.
