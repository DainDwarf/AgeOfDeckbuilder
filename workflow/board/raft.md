# Raft

**Line:** **Raft** — the technology Raft stands in the Stone Age's content: it needs Bow and arrow, its achievement counts the coast tiles charted, and it unlocks the card Embark, which becomes Disembark; coast names a movement cost for embarked units; an embarked unit reads as one on the map and in the infopanel, and a tile two units could embark onto asks which; the catalogue's coherence test passes, `e2e/embark.spec.ts` passes, and the age pages say so. Doc-impact: `docs/ages/STONE.md`, `docs/ages/NOMADIC.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:**

- `docs/ages/STONE.md` → _The technologies_, a bullet after Tanning's: "**Raft** needs Bow and arrow. Its goal reads the chronicle as it stands: the coast tiles charted, the centre part's among them. It unlocks the card **Embark** and pays influence."
- `docs/ages/STONE.md` → _The cards_, two bullets at the end: "**Embark**, an instant costing production, aimed at a coast tile beside a unit: the unit embarks onto it, spending its action. It becomes Disembark. An embarked unit crosses the coast slowly, whatever it was ashore, so the copies a deck holds are how many units are on the water at once, and the deck's cycle is how long a crossing takes." and "**Disembark**, the card Embark becomes, costing nothing, aimed at a tile beside an embarked unit that the unit stands on ashore: the unit disembarks onto it, spending its action. It becomes Embark. A raft that carries units as a unit of its own was rejected: it takes one population that only ferries."
- `docs/ages/NOMADIC.md` → _The land_: "coast, ocean and mountain are crossed by nothing" becomes "ocean and mountain are crossed by nothing, and coast by embarked units alone". The table's rows stand.
- `docs/ages/NOMADIC.md` → _The camps_: "attacks a unit within its range on its way" becomes "attacks a unit on its way", and "Either attacks the unit of the least health within its range." becomes "Either attacks, of the units it can attack, the one of the least health." — a range-one warrior beside an embarked unit has it within range and does not attack it.
- `docs/CHRONICLE-SCREEN.md` → _The hand and the aim_, a paragraph after the one opening "**Every card being aimed is aimed at one kind of thing.**": "**A card played through a unit beside its tile asks which unit only where it must.** A click on a tile one such unit stands beside plays the card through it. Where several do, the click plays nothing: the card is from then being aimed at a unit, its line says so, the map lights those units' tiles beside the tile clicked, and a click on one of them plays the card through it at that tile. A click on any other unit of the player's is refused over it and the aim stands, as any card aimed at a unit; letting the card go lets go of the tile with it."
- `docs/CHRONICLE-SCREEN.md` → _The pointer and the tile's marks_, at the end of "**A tile's marks stand in three places.**": "An embarked unit's mark stands on a hull."
- `docs/CHRONICLE-SCREEN.md` → _The veils and the infopanel_, in the paragraph opening "An inspected tile shows one card": after "The unit card reads the unit's stats;" add "an embarked unit's is headed embarked, and reads the stats it has while embarked;". "The terrain card reads the tile's movement cost small in the top-right corner of its head, in move points, and a dash where nothing crosses the tile at all." becomes "The terrain card reads the tile's movement cost small in the top-right corner of its head, in move points — the cost a unit pays, or, where none does, the cost an embarked unit pays — and a dash where nothing crosses the tile at all."
- `src/ui/text.ts`, every entry written out:
  - `technology.raft`: `Raft`
  - `goal.raft`: `Chart {need} [terrain:coast]`
  - `card.embark`: `Embark`
  - `rules.embark`: `Move a unit onto [terrain:coast].\nBecomes [card:disembark]`
  - `card.disembark`: `Disembark`
  - `rules.disembark`: `Move a unit off [terrain:coast].\nBecomes [card:embark]`
  - the embarked unit's name: `Embarked {unit}`, the unit kind's own name filling it
  - the refusals, under whatever keys the rules' reasons carry: `Needs a unit beside it` (Embark, no unit of the player's that is not embarked beside the tile), `Needs an embarked unit beside it` (Disembark, no embarked unit beside the tile), `The unit has no action left` (a unit beside it, none holding an action), `Not beside that tile` (the tie's pick, a unit of the player's that is not one of those lit). `Uncharted`, `Wrong terrain`, `A unit already stands here` and `No unit stands here` are the standing entries.
  - The plate's reward reads `1 [card:embark]` through the standing `plate.cards`, and the tie's line `Play Embark at a unit` through the standing `aim.unit`.
- The user picked these sentences from Claude's serve; "Embarked {unit}" follows the user's choice of the term embarked over Claude's "on a raft".

**Doc-impact:** `docs/ages/STONE.md`, `docs/ages/NOMADIC.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

- In, content: the technology `raft` needing `bow-and-arrow`, declared after Tanning so it stands under it in the tree's third column; its achievement; the cards `embark`, which becomes `disembark`, and `disembark`, which becomes `embark`; coast's movement cost for embarked units. Ocean names none.
- **Numbers, all provisional, the user's and Claude's serve the user took:** Embark costs 1 production, Disembark nothing; the technology unlocks 1 Embark and its achievement pays 1 influence; the goal's need is 30; an embarked unit's move is one coast tile a turn (the user's, down from Claude's two). No test reads any of them.
- **The goal** counts the tiles the chronicle has charted whose terrain is coast, as the chronicle's own record of what was seen holds them. Over 200 Stone Age maps the settle alone charts a median of 8 and at most 26, and every map holds at least 32 within two tiles of ground a unit walks: 30 is not reached with no play and is there to reach on every map measured.
- **Embark and Disembark compose the rules' embark and disembark helpers as they stand**; each is aimed at a tile, and the tile's reasons are the helpers'. Neither card adds a reason of its own.
- **On screen:** an embarked unit's mark is its kind's mark over a hull, a flat polygon of four corners in the faction's colour, following `DOGMAS.md`'s code-drawn placeholder and the precedent of the unit marks; its infopanel card is headed "Embarked Worker" and reads the move it has embarked and no damage or range; a coast tile's terrain card reads the cost an embarked unit pays where it read a dash; a selected embarked unit lights the coast tiles it reaches and glows nothing.
- **The tie on screen** goes through the standing aim at a unit: same line, same refusal over a tile no unit of the player's stands on, the aim standing. The lit tile stays lit while the pick is made. The back key and a click on anything that is not a tile let the card go as they do any card being aimed.
- **A unit killed while embarked** leaves its Disembark a Disembark; nothing reaches that state today, no enemy having a range above one, and the user keeps it so for now.
- **Disembark is in no collection** because no technology unlocks it: the collection screen, the launch screen's piles and the deck never show it; a browse of a chronicle's piles and the hand do.
- **A card that becomes another, played, changes in the hand first**, into the card it becomes, and then flies to the discard pile as that card (`toDiscardPile` in `src/ui/hand.ts` flies the played card's own face today).
- The reconcile's choices: the tie's pick goes through the standing aim at a unit as it is; the step plays on screen as the standing move's change does; the goal's count stays content, beside Agriculture's.
- Out: the archipelago region, Fishing, any enemy on the water, any change to a script, any rule. A rule found missing is a deviation, never coded here.
- Saves from before this line need no care.

**Traps:**

- `docs/PHASER.md` → _Under a Playwright spec_: a press in the frame an object appears falls through it, so the spec rests before each press; → _The pointer's readings_ for what glows under a resting pointer; → _Rendering under WebGL_: a stroked Polygon comes out open on a point that lands on the one before it, which the hull's outline must not meet.
- The technology tree places a technology one column after the furthest it needs and orders a column by the content's order (`src/ui/tree-layout.ts`): `raft` is declared after `tanning`. The tree's room holds four plates of five lines a column; Raft's goal and reward read one line each.
- `unitMark` (`src/ui/map.ts`) draws a unit's mark for the map's markers, the fog's snapshots and the infopanel alike, from its kind and faction; `unitName` (`src/ui/text.ts`) names it by kind, reading the entry `unit.<kind>`, so the embarked name's entry takes a key no unit kind could ever be read under.
- The infopanel reads a tile's movement cost through the rules' one answer (`src/ui/infopanel.ts`); the small card a `[terrain:coast]` name raises reads the terrain's own, and reads the same way.
- The lit tiles come from `admitted` and the play from the rules' command; which units a tile's play could go through is a question the rules export. `src/ui/` asks it and never works it out: `src/rules/` is pure, `src/ui/` only renders.
- In `src/ui/`, `src/content/` is imported by a scene alone; every other function is handed the catalogue.
- `src/content/catalogue.test.ts` reads every id through the screen's lookups and asks every closure its cheapest answer on a chronicle launched on each age: the two cards, the technology and the achievement each need their text and answer there.
- A spec opens on the save it wrote, built headlessly through the rules' helpers on the game's content, and plays only the gesture it tests; it reads every number from the rules. The made ground is `DOGMAS.md` _Testing_: what a helper can make, the spec makes, and a seed is searched only for a shore.
- The glossary lint reads `src/ui/text.ts`: "embark", "disembark" and "embarked" are terms; "raft" is the technology's name and no term.

**Plan:**

1. `src/content/nomadic.ts`, `src/content/stone.ts`: coast's cost for embarked units, the two cards, the technology and the achievement — leaves a catalogue that builds, with Raft available to a campaign that has learned Bow and arrow.
2. `src/ui/text.ts`: the entries above — leaves the coherence test green.
3. `src/ui/`: the embarked unit's mark and name, the terrain card's cost, then the tie's pick in the hand's aim — leaves an embarked unit and a tie both readable and playable on the chronicle screen.
4. `e2e/embark.spec.ts`, one test a gesture: Embark played at a coast tile beside one unit puts that unit on it embarked, its action spent, and the discard pile's top card reads Disembark; Embark played at a coast tile two units stand beside plays nothing, the line names a unit, and a click on one of the two sends that one; Disembark played at a tile beside an embarked unit puts it ashore as itself and the discard pile's top card reads Embark.
5. The `docs/` edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`, then `npx playwright test e2e/embark.spec.ts`, the one proof spec. CI proves on the push: `e2e/hand-aim.spec.ts`, `e2e/move.spec.ts`, `e2e/attack.spec.ts`, `e2e/inspect.spec.ts`, `e2e/reference.spec.ts`, `e2e/tree.spec.ts`, `e2e/pin.spec.ts`, `e2e/collection.spec.ts`, `e2e/browse.spec.ts`, `e2e/fog.spec.ts`, `e2e/worker-instants.spec.ts`.
