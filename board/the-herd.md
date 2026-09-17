# The herd

**Line:** **The herd** — the nomadic schedule deals The herd, rare, from the first deal, needing a forest tile near the city that carries no feature: _Hunt it_ gains food; _Follow it_ deals game onto one such tile, drawn seeded, and puts that tile in sight as it lands, charted where it was not, its snapshot holding the game. An answer's script is content: the design pages list no script. `npm test`, `npm run check` and `npm run lint` pass.

**Spec:**

[`docs/ages/NOMADIC.md`](../docs/ages/NOMADIC.md) → _The events_, The herd's line becomes:

```
- **The herd**, rare and fortunate. _Hunt it_: food now. _Follow it_: game is dealt onto a forest tile near the city that carries no feature, drawn seeded, and the band follows the herd there: the tile is in sight as the answer lands, charted where it was not. The herd needs such a forest near the city, and is not dealt without one. Both are gains; a fortunate event is a breath, not a decision.
```

[`docs/CHRONICLE.md`](../docs/CHRONICLE.md):

- _Sight_: a new paragraph right after "**Every tile the city holds is in sight** 🔧: one population works it.":

```
**An answer may put a tile in sight as it lands.** The tile is charted where it was not, and its snapshot is taken as it stands, whoever stands on it; it stays in sight until the player's next command, and is in fog from then on unless something sees it.
```

- _The map_, the **Feature** bullet: "at most one, put there by the generator: a fertile plain." becomes "at most one, dealt by the generator or by an event's answer: a fertile plain." The bullet's second sentence stays word for word.
- _Events and the capstone_, first paragraph: the sentence "An answer is a script — spawn enemies, shock a resource, change tiles, take or kill population, damage units, lay a card on top of the draw pile, which the landing's draw puts in hand." becomes "An answer is a script run on the chronicle, and what it does is content." The user's call: a list of what an answer can do only grows, and is too low an altitude for a design page — whoever needs the list reads the content.

[`docs/GLOSSARY.md`](../docs/GLOSSARY.md), the **feature** row: "A generated extra on a tile: a fertile plain." becomes "An extra on a tile, dealt by the generator or by an event's answer: a fertile plain."

Text-table entries, all of them (`src/ui/text.ts`):

- `event.herd`: `The herd`
- `answer.hunt-it`: `Hunt it` — `answer-rules.hunt-it`: `Gain {food} [food]`
- `answer.follow-it`: `Follow it` — `answer-rules.follow-it`: `Deals game onto a forest tile near the city and charts it`

**Doc-impact:** `docs/ages/NOMADIC.md`, `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:**

- In: the helper that deals a feature onto one tile near the city, and the predicate its need reads; the mechanism that puts a tile in sight as an answer lands; the fixture content and the mechanism tests below; the event `herd` with its answers `hunt-it` and `follow-it` and its schedule entry; the text entries; the docs edits.
- Out: nothing draws the eye to the dealt tile — no camera move, no pulse; that is the _Event animations_ line, which this intake wrote it into. Wildfire stays as it is: it puts nothing in sight and "never where it burns" stands. No new glossary term: the tile is _in sight_, _charted_, and the feature is _dealt_.
- Decided: "near the city" is Wildfire's — within 4 tiles of the city's tile. One tile is dealt, never more. The process is fixed, the draw is rolled: one step of the chronicle's generator, uniform among the candidates, as the fire's start is drawn.
- Decided: a candidate is any tile of the feature's terrain within that distance that carries no feature. Nothing else is asked of it: a forest with Trapping on it takes game, and so do the city's own tile and a camp's tile; charted or not, in sight or not, makes no difference to the draw.
- Decided: the need is that one candidate stands; without one The herd weighs nothing, as the rules have it for any need.
- Decided: the tile is in sight exactly as a tile in sight is — drawn live, its snapshot recording an enemy standing on it — through the take's stages and on the chronicle they leave, until the player's next command; a refused command changes nothing, this included. The answer's card reads no number and never where.
- Decided: both answers are flat and free, and neither scales with the turn: game is worth less the nearer the capstone, so the choice moves by itself. _Hunt it_ gains 4 food, read on the card through `reads`; _Follow it_ reads nothing. The herd weighs a third of what the other events weigh, on every turn. Priced against what does the job: 4 food is the food half of the stores; one game tile pays that back in four Gathers or four incomes.

**Traps:**

- The snapshots are not the landing's to write: `charting` in `src/rules/chronicle.ts` carries the snapshots from stage to stage and overwrites whatever a stage's own chronicle holds. `inSight` is "the one answer to what is in sight" and `charted` "the one place the map is charted" — the tile must come through them, so the screen's live set, which reads `inSight`, follows with no UI change.
- `records` in `src/rules/sight.ts` compares tiles by identity: the helper rebuilds the one tile it deals onto and leaves every other tile the very object it was.
- The need is asked on the chronicle the deal is drawn on, the draw lands on the chronicle the deal was popped from with its cost paid: both read the same candidates function, as `fireStartable` and `fireDrawn` read `fireStarts`.
- Whatever the state gains to carry the tiles in sight is plain data — a save is the state serialised — and every place that builds a `Chronicle` literal must hold it.
- An answer's id is unique across every event of a catalogue; `hunt-it` and `follow-it` are free. The lines _An answer's cost reads the chronicle_ and _Departure_ stand before this one on the board: the `Answer` type and the nomadic schedule may have moved since this was written; both answers here are the flat free price in whatever shape it has.
- The nomadic coherence test asks every `needs` and `reads` on a launched chronicle; the herd's must answer there.
- The glossary hook reads the text table; if it flags an entry above, report it, never reword it.
- Comments are for traps only: no docblock retelling a signature.

**Plan:**

1. `src/rules/state.ts`, `src/rules/sight.ts`, `src/rules/chronicle.ts` — the chronicle carries the tiles its last command's landing put in sight; `inSight` owns the invariant and counts them; `resolved` drops them as a command that is not refused begins. A helper beside `laid` in `src/rules/schedule.ts` is the one door that adds one.
2. `src/rules/schedule.ts`, beside the fire — the candidates function (feature, distance from the city), the predicate over it, and the helper that draws one candidate, deals the feature onto it and puts it in sight. It names a feature and a distance, never game or 4.
3. `src/rules/fixtures.ts` — one fixture event whose need is the predicate and whose answer lands the helper with `PH_Fertile` on a distance of the fixture's own, beside a flat free answer that does nothing.
4. Tests, mechanism only, on the fixture, in `src/rules/schedule.test.ts`, through `apply` and the take, from a seed: the feature lands on one tile of its terrain within the distance that carried none, and every other tile is as it was; taken with the tile out of sight, the tile's snapshot holds the feature after the take and an uncharted one is charted; after the player's next command the tile is in fog where nothing sees it. The need unmet deals nothing — built as the fire's unmet need is built in the tests already there; if no such test stands, report it and leave it out rather than wipe a map by hand.
5. `src/content/nomadic.ts` — the event `herd`, `needs` and `follow-it` through the helpers with `game` and Wildfire's distance, `hunt-it` through `gained`; its entry in the nomadic schedule at a third. `src/ui/text.ts` — the entries above. No gameplay test on the content.
6. The docs edits above; the board line and this file deleted.

The mechanism, the fixture and their tests may land as an inert commit ahead of the content, as `DOGMAS.md` → _Git_ has it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No Playwright spec: the map repaints every layer of every tile on every render and reads `inSight` for what it draws live, nothing on screen changes but that and the text entries, and no spec plays the nomadic schedule.
