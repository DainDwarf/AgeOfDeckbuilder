# The raft, a unit on the water

**Line:** The raft, a unit on the water — the Stone Age holds the raft, a unit that stands on the water alone, and the unit card Raft, unlocked by Raft beside Embark: played at a free coast tile inside the border, the card turns one idle population into a raft there, embarked for as long as it stands, which moves on the coast, is attacked from range alone and is drawn as the canoe in its halo; units still cross by Embark and Disembark, and no unit enters a raft's tile; `e2e/raft.spec.ts` passes.

The mockup the look was picked on: https://claude.ai/artifact/Def8C2PYyYDgYeKvPwsZ3r, under these settings: the empty raft in its halo, as a unit, where a unit's painting stands. The user picked the place against Claude's star (where the canoe lies under a unit). The card's line picked on the same page, "Carries 1 unit", is the next line's, where it becomes true; in this line the card reads no sentence.

**Spec:**

_`docs/CHRONICLE.md`, Units and combat, the bullet "A unit embarks and disembarks through a card."_ Add at its end:

> A unit's kind may stand on the water alone: such a unit is embarked from the moment it enters, moves on its kind's own move, and never disembarks.

_`docs/CHRONICLE.md`, Units and combat, the bullet "A unit enters the map on its city's tile"._ Add at its end:

> A unit whose kind stands on the water alone enters instead on a tile inside its city's border that it stands on, charted and with no unit on it: the player's unit card is aimed at that tile.

_`docs/MAP-SCREEN.md`, The infopanel._ "Raft for an embarked unit, whose stats it reads as it has them embarked," becomes:

> Raft for an embarked unit, whose stats it reads as it has them embarked, and none for a unit whose kind stands on the water alone,

_`docs/LOOK.md`, the paragraph "A unit"._ Add after "and the canoe wears no halo.":

> A unit whose kind stands on the water alone stands in no canoe: its painting is the vessel itself, 30 units wide, where any unit's painting stands, with the dark line and the halo any unit wears.

_`docs/ages/STONE.md`, The technologies._ Raft's "It unlocks the card **Embark** and the archipelago region and pays influence." becomes:

> It unlocks the cards **Embark** and **Raft** and the archipelago region and pays influence.

_`docs/ages/STONE.md`, The units._ Add as the last bullet:

> - **The raft** stands on the water alone and attacks nothing: it crosses the coast slowly and holds little health.

_`docs/ages/STONE.md`, The cards._ Add after Disembark's bullet:

> - **Raft**, costing production: one population leaves the tiles to become a raft, on a coast tile inside the border.

_The text table, every entry written out._

- `unit.raft`: Raft
- `card.raft`: Raft
- `rules.raft`: no sentence
- Every refusal reads an entry that stands already; nothing is authored: "No idle population", "Your city keeps its last population", "Wrong terrain", "Outside your city border", "A unit already stands here".

The doc sentences above are Claude's, written at intake on the settled design.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/MAP-SCREEN.md`, `docs/LOOK.md`, `docs/ages/STONE.md`.

**Scope:**

In, as two commits in this order, pushed together:

1. _The mechanism, inert._ A unit kind declares that it stands on the water alone; a unit of such a kind enters embarked on its kind's move and never disembarks; a unit card of such a kind is aimed, at a tile inside the border that its unit stands on, charted and with no unit on it, and takes its population as every unit card does. One test, on a kind and a card of the fixture's own. The game as shipped.
2. _The raft._ The Stone Age's raft and its card, the technology's unlock, the text, the raft's painting on the map, on the infopanel and on its card's head wherever a unit's painting stands today, the infopanel's state line, the four pages, the spec.

The content's numbers, the user's picks of Claude's draft: the raft holds 2 health, 0 damage, 0 range, a move of one move point, 0 action and 2 sight; the Raft card costs 3 production; Raft unlocks one copy of it beside its one copy of Embark.

The look, picked on the mockup: the raft's painting is Baumgart's canoe, the file an embarked unit's canoe is drawn from, 30 units wide as under a unit, its middle where any unit's painting has its middle, with the dark line and the halo in the faction's colour, made as every unit's are. No canoe is drawn under a raft. The health bar, the ring, the dim and the fog go on it as on any unit.

Out:

- A unit embarking onto a raft, the raft carrying it, the card's line "Carries 1 unit", and Embark and Disembark leaving: the next line.
- The neutral and the enemies: they enter no raft, and embark as they do.
- The personas and `tools/`: no deck under `workflow/decks/` holds the Raft, so no persona meets it.
- The card's art box: empty as every card's, the paintings' lines'.
- The glossary: no row moves.
- Saves written before this line.

Corner cases decided here:

- A raft takes one idle population and is refused with none idle or on the city's last, as every unit card is; killed, the population is gone. It counts in the growth threshold as every unit of the player's does.
- The card is refused before any tile is read where the population refuses it. Of a tile's reasons, where several hold, the terrain is read first, then the border, then the unit standing, as a building card reads its ground before its border.
- A city holding no free coast tile leaves the card nowhere to go: a blank draw, no sentence of its own.
- While both stand, Disembark aimed beside a raft alone refuses it with "Wrong terrain", and Embark aimed at a raft's tile refuses with "A unit already stands here", both by what stands already.
- A raft is a gate on the water: a unit passes through the rafts of its own faction and lands on no raft's tile.
- An enemy attacks a raft as it attacks any embarked unit of the player's, from a range longer than one alone; a raft attacks nothing and holds no action.
- A raft with no tile in its reach is dimmed as any unit that can do nothing.
- A selected raft's ring is as wide as its painting and shows as a pale edge round it. Seen on the mockup and accepted.
- The infopanel's card of a raft is headed Raft, reads no state line, and reads the rows an embarked unit's card reads.
- A neutral whose content names a unit card of a kind that stands on the water alone is a defect of the content, refused when the catalogue is built with the vocabulary its other refusals use; no page says so.

What the reconcile chose:

- _A card that enters a unit where the player points._ The settle phase's unit cards enter on any charted tile their unit stands on and take no population; the Raft takes a population and enters inside the border alone. The Raft goes through the unit card's own rule, where it lands the one thing that differs, and the settle cards stay apart.
- _A unit on the water._ The raft goes through the embarked state as it stands: what an embarked unit enters, what attacks it and what it attacks are read as today, the kind's declaration being what keeps it there.
- _What a unit wears._ The halo, the dark line, the health bar, the ring, the dim and the fog go through as they are.
- _A technology unlocking two cards._ As Bartering unlocks its two.

**Traps:**

- A unit card is played at nothing today: `UnitCard` (`src/rules/catalogue.ts`) carries a `UnitEntry`, a block and an effect taking the faction, and no aim, and the neutral enters its units through the same entry (`enters`, `src/rules/cards.ts`). The Raft is the first unit card aimed at a tile: read how the hand, the aim and the map's lit tiles tell an aimed card from one played at nothing, and how the catalogue validates what a card places, before choosing the shape. `entersOn`, the settle cards' aimed entry, is the nearest standing shape and takes no population.
- `disembarks` (`src/rules/cards.ts`) admits a unit whose kind's move covers the tile ashore, and the raft's move covers a plain's cost: the kind's declaration is what refuses it, never its move. `standsOn` (`src/rules/units.ts`) is asked of kinds in many places, the enemies' doors and the neutral's landing among them.
- A unit is embarked or ashore by the move it enters with (`entered`, `src/rules/catalogue.ts`): every way a unit of such a kind enters must leave it embarked, behind one door (`DOGMAS.md`, _Code_, one choke point per invariant).
- The fixture's embarked move is three move points so that none of its units has it ashore (`src/rules/fixtures.ts`): the fixture's kind and card take numbers of the fixture's own, never the raft's.
- The units sheet paints each kind's lined painting and its halo off a square icon 128 pixels a side (`armsSquare`, `aroundPicture`, `src/ui/marks.ts`, `src/ui/sheet.ts`); the canoe is 82 by 57 pixels and stands in the sheet as a bare file. The mockup padded a copy of the canoe to a 128 square; a copy of a store file never enters the repository, so the frame is made from the store's own file.
- `asUnit` (`src/ui/map-marks.ts`) shows the canoe under every embarked unit and `unitFittedBy` fits a mark by its painting and its canoe: a raft is embarked and stands in none. The infopanel reads the state line off `embarked` alone (`src/ui/infopanel.ts`).
- A game object is made once and changed in place, and a closed set is switched (`DOGMAS.md`, _Stack_, _Code_).
- The catalogue's coherence test reads every unit kind's name and painting and every card's text through the screen's lookups: the raft answers each.
- `tools/builder.ts` reads every unit of the player's that is no worker as a unit that attacks. Nothing in `tools/` moves in this line; a tools test that walks every unit card of the catalogue and trips on an aimed one is reported, not bent.
- A spec may walk every unit card expecting one played at nothing: search `e2e/` for readings of the unit cards before the Raft joins them, `card-reads.spec.ts` and `tree.spec.ts` first. `docs/PHASER.md` for anything a spec presses or measures.
- Proven on the mockup's throwaway build: with the kind, the card, the unlock, the text and a painting in place the game boots, a campaign that learned Raft with its needs holds the card (`campaignWith`, `e2e/chronicle-screen.ts`), a raft entered embarked through `unitEntered` moves on the coast, and the card's face reads its unit.

**Plan:**

1. `src/rules/`, the fixture and one rules test, with the catalogue's validation: leaves the mechanism proven on the fixture and no content using it, committed alone as `Mechanism: A unit that stands on the water alone`.
2. `src/content/stone.ts`, `src/ui/text.ts`, the units sheet and the unit's mark, the infopanel's state line, whatever of the hand's aim an aimed unit card asks for, the four pages, `e2e/raft.spec.ts`, the board line deleted: leaves the done-condition true.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The one proof spec is `npx playwright test e2e/raft.spec.ts`, which the line adds: on a save whose campaign learned Raft, whose border holds a free coast tile and whose city has an idle population, the Raft card dragged out is aimed and a click on that tile leaves the chronicle the rules give, a raft embarked on the tile and one population fewer, the map drawing it with no canoe under it; a tile outside the border refuses the card with the border's sentence. Every number read from the rules. CI proves on the push, listed for the hand-back: `embark.spec.ts`, `archipelago.spec.ts`, `fishery.spec.ts`, `card-reads.spec.ts`, `tree.spec.ts`, `collection.spec.ts`, `deck-editing.spec.ts`, `hand-aim.spec.ts`, `inspect.spec.ts`, `unit-ring.spec.ts`, `move.spec.ts`, `reference.spec.ts`, `hover.spec.ts`, `browse.spec.ts`.
