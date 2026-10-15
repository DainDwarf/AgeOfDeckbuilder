# The long winter

**Line:** **The long winter** — the temperate schedule's capstone: its landing adds Cold night hazards paid in production, and from the landing on the terrain's and the feature's food is nothing on every tile; passed when no Cold night is left in any pile. Done when `long-winter` stands in the Stone Age's catalogue as the temperate schedule's capstone, the catalogue's coherence test passes on it, the yield rule a capstone carries is held by one rules test on the fixture, and `docs/ages/STONE.md` says what the trial is.

**Spec:**

`docs/CHRONICLE.md` _The capstone_, first paragraph, a sentence added after "…after the draw and before whatever that turn deals.":

> A capstone may carry a rule over what a tile yields, laid from its landing to the chronicle's end over every tile of the map and read wherever a tile's yield is read: at income, through a card played on the tile, by the neutral's script and on the screen.

`docs/CHRONICLE-SCREEN.md` _The yield overlay_, the second sentence's opening rewritten from "It reads the faces the map draws, the tile's and those beside it, and nothing else —" to:

> It reads the faces the map draws, the tile's and those beside it, and the rule the capstone lays over the yield once it has landed, and nothing else —

`docs/ages/STONE.md` _The capstones_, a paragraph added after the section's one standing paragraph, which stays as it is:

> **The long winter.** When it lands it adds **Cold night** to the discard pile, several copies, more on a later turn: a hazard costing production, and while it stays in the hand it kills one population at the end of the turn. From the landing on, the terrain's food and the feature's are nothing on every tile of the map, the neutral's land as the player's; what a worker placed or built keeps giving, and a card's own gain is a card's. The chronicle ends in victory the moment no Cold night is left in any pile, in the middle of the play that pays the last. So the winter is paid in production or in people, the food for the next population comes from what the city built, and a city that never built shrinks: the trial is whether the economy came home.

Player-facing entries, the user's picks of the intake's drafts, verbatim:

- Capstone name: `The long winter`
- Capstone rules: `Add {count} [card:cold-night] to the discard pile. Terrain and features give no food`
- Card name: `Cold night`; its rules: `Kills one population`; its cost reads on the card as every cost does
- Opening lore: `The elders say a winter is coming such as none remembers. When it comes, keep the fires burning until the thaw, and the Stone Age is won.`
- Landing lore: `The snow has come and the fields lie dead under it. Keep the fires burning until the thaw, and the Stone Age is won.`
- Victory line: `The fires held and the thaw came. Stone Age is over.`

No goal entry: the `goal.` entries are the achievements', and the Stone Age's victory achievement is the board line **The victory**.

**Doc-impact:** `docs/ages/STONE.md`, `docs/CHRONICLE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The capstone `long-winter` in `src/content/stone.ts`, named as the temperate schedule's one capstone in place of the Nomadic stand-in `first-shelter`. Its landing adds Cold night to the discard pile in copies; its yield rule makes the food of the terrain part and of the feature part nothing on every tile; it carries no second script; it passes when it has landed and no Cold night is in any pile of the chronicle.
- The card `cold-night`, a hazard costing production, striking one population of the player's city as Sickness strikes.
- Provisional numbers, tuning: the copies are 2 and one more for every ten turns of the landing turn, so 4 or 5 in the window; each costs 3 production.
- The mechanism, its own inert commit before the content: a capstone's declaration gains one optional closure over a tile's yield parts, read while the capstone has landed, through the one door every reader of a tile's yield uses. The fixture gets a capstone carrying one, and one rules test: from the landing on, the terrain's and the feature's food read nothing at income for the player's city and the neutral's and through a worker's card on the tile, the improvement's and the building's food keep, and before the landing nothing changes.
- The text and lore entries above; the catalogue's coherence test passes on the new capstone and card.
- The three docs sentences.

Out:

- The archipelago's schedule keeps the stand-in capstone until its own board line.
- The age's victory achievement, its technology and what the ending pays: the board line **The victory**.
- The monument and the siege: their own lines.
- Any end to the winter other than victory: the chronicle ends when it is passed, so the rule needs no lifting.

Corner cases decided here:

- Gather gains a tile's yield, so on a bare plain or coast it gains nothing and on an improved tile the improvement's food. Hunt is a card's gain and keeps its food. Both follow from the rule as written; no card changes.
- The neutral's land freezes too: its script reads yields through the same door, so it claims, assigns and builds on the frozen land as it stands. Symmetry is the standing default.
- A tile in fog shows the frozen yield on the overlay and in the infopanel as a tile in sight does: the rule is the map's, not a tile's state.
- The Cold nights land in the discard pile, so they come around on the next refill of the draw pile, never in the landing turn's hand.
- A Cold night discarded unplayed comes around like any hazard; paid, it is banished, so the exhaust pile never holds one.
- The strike's victim is the player's city's population alone, and its last is taken like any: population reaching zero is defeat, at its source.
- Where a capstone's turn is drawn and how the window is shown change nothing.

Reconcile, each likeness chosen:

- A card paid off in a stock and striking while held: through the hazard kind as it is, as Hunger is.
- A strike killing one population: the same strike as Sickness and Wolves, through the same helper.
- Cards added to the discard pile in copies: through the helper Burn the forest adds Embers with, as it is.
- A tile giving nothing because a unit occupies it: stays apart, a difference that is meant. Occupation is one unit's doing on one tile, at income alone, lifted when the unit leaves; the winter is the map's, on every reader, to the end.
- A capstone passing on a state: the same passes door, reading the piles.

**Traps:**

- Every reader of a tile's yield goes through one door, or the screen, the neutral and the income disagree on the frozen land. The readers today: income and Gather both through `yielded` in `src/rules/city.ts`; the neutral's scripts in `src/content/scripts.ts`, four sites, choosing where to build, which tile to claim and which to work; the infopanel's rows in `src/ui/infopanel.ts`; the yield overlay in `src/ui/map.ts`; one rules test in `src/rules/city.test.ts`. The two readers in `src/ui/` read faces and snapshots, not the chronicle; the winter is read off the timeline, which the scene holds. `docs/PHASER.md` for anything the scene's rendering raises.
- "Landed" is read in `conditionsRead` (`src/rules/chronicle.ts`) as the turn being at or past the capstone's; the yield door and the capstone's passing condition read the same fact the same way, as `spanEnded` in `src/rules/schedule.ts` does. On the landing turn the landing group comes after the draw and before the income, so the first frozen income is the landing turn's own.
- The catalogue's coherence test (`src/content/catalogue.test.ts`, the test naming "every capstone of its schedule lands, continues and is not passed") asks `passes` to be false on a chronicle settled and never landed on. A condition reading "no Cold night in any pile" alone is true there; it reads the landing first.
- The helper that adds a card to the discard pile in copies is `rewarded` in `src/rules/schedule.ts`, named for a capture's rewards; Burn the forest already adds Embers through it.
- `first-shelter` is three things: the Nomadic capstone, which the Nomadic schedule and the archipelago's keep naming; the Nomadic achievement, untouched; and text and lore entries, untouched. The Shelter is Nomadic-only and takes no Stone terrain.
- The capstone's name, rules, both lores and the victory line are entries keyed by the capstone's id in `src/ui/text.ts` and `src/ui/lore.ts`; the glossary lint hook reads the text entries and not the lore. The rules entry marks the card as `[card:cold-night]`; the count rides as `{count}`, read as the landing would add it on the chronicle as it stands, the way an answer's `reads` hands its numbers.
- The chronicle screen opens every chronicle on the capstone's card; `e2e/chronicle-screen.ts` closes it through `capstoneClosed`, and `e2e/capstone.spec.ts` and `e2e/victory.spec.ts` walk the Nomadic landing and win, which this line leaves as they are.
- A Stone Age spec launches on `wonCampaign()` and its window is turns 26 to 34; an idle city falls by about turn 16 (a measurement, not a rule). A seed search to the landing keeps the city standing through the rules' helpers a card composes and nothing else, as `e2e/drought.spec.ts` gains a stock through `gained`; a search that finds no seed is a finding for the report, never a turn set or a stock written.
- No row of the chronicle changes: the save needs nothing.

**Plan:**

1. The mechanism, one inert commit: the capstone declaration's optional yield closure in `src/rules/catalogue.ts`; the one yield door in `src/rules/map.ts` or beside it reading the chronicle's capstone once landed; every reader listed in Traps through it; the fixture's capstone carrying a closure in `src/rules/fixtures.ts` and its one test beside the income's tests. Leaves standing: the rules tests green, no content changed, the Nomadic and the stand-in capstones reading as before.
2. The content: `long-winter` and `cold-night` in `src/content/stone.ts`, the temperate schedule's capstone list, the entries in `src/ui/text.ts` and `src/ui/lore.ts`. Leaves standing: the coherence test green on the new capstone and card, the archipelago on the stand-in.
3. The docs: the three sentences of Spec, verbatim.
4. The proof spec, `e2e/long-winter.spec.ts`.
5. The board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/long-winter.spec.ts` — a Stone chronicle on `wonCampaign()` the turn before its landing, found by seed; the landing's window reads the long winter's landing lore and its card; closed, the infopanel of the city's own tile reads the terrain's food as the rules read it through the door, nothing, and the Cold nights stand in the discard pile in the copies the rules added.
- CI's on the push, never run here: `e2e/capstone.spec.ts`, `e2e/victory.spec.ts`, `e2e/continue.spec.ts`, `e2e/resume.spec.ts`, `e2e/neutral.spec.ts`, `e2e/map.spec.ts`, and the Stone events' specs.
