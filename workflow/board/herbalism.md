# Herbalism

**Line:** **Herbalism** — Herbalism stands in the Stone Age's content as the technology of the sky's door, needing Settlement: its achievement counts the kinds of terrain Gather was played on toward 4, unlocks one copy of Heal and pays 1 influence; Heal costs 2 food and heals a unit of the player's standing inside the border to full health, refused on one at full health; healing a unit is proven on the fixture; `e2e/heal.spec.ts` plays the card on screen; `npm run check`, `npm test` and `npm run lint` pass. Doc-impact: `docs/CHRONICLE.md`, `docs/ages/STONE.md`.

**Spec:** `docs/CHRONICLE.md` _Units and combat_ and _Cards_ (a unit's health, the instant, a card aimed at a unit), `docs/META.md` _The campaign_ (an achievement, its tally, what a technology unlocks) and `docs/ages/STONE.md` are the spec. The sentences that change:

- `docs/CHRONICLE.md` _Units and combat_, the opening paragraph: after "and a unit at zero health is killed." one sentence is added: "A unit enters at its kind's health, its full health; lost health stays lost until a **heal** brings it back up, never above full." The rest of the paragraph stands.
- `docs/CHRONICLE.md` _Cards_, the Instant bullet: the list takes "**heal** a unit" between "**refresh** a unit's move points" and "**recall** a card from the discard pile"; after "it is refused on a unit whose move points are full." one sentence is added: "The heal takes one unit and brings its health back to full, leaving its move points and its action as they stand; it is refused on a unit at full health."
- `docs/ages/STONE.md` _The technologies_, a bullet after Fire's: "- **Herbalism** needs Settlement. Its goal counts a deed: the kinds of terrain Gather is played on, each read as the tile stands when the card is played, a Gather that gains nothing counted like any other. It unlocks the card **Heal** and pays influence."
- `docs/ages/STONE.md` _The cards_, a bullet after Fire's: "- **Heal**, an instant costing food, aimed at a unit standing inside the border, the city's own tile included: the unit is healed to full health and keeps its move points and its action. Nothing else in the age heals. A heal that spends the unit's action was rejected: the food and the walk home are its price."

The player-facing entries, each ending in no period:

- The technology's name: "Herbalism".
- The goal: "Play [card:gather] on {need} different terrains".
- The card's name: "Heal".
- The card's rules text: "Heal a unit inside your border".
- The refusal of a unit at full health: "Unit health is full".
- Every other sentence the card raises is a standing one and is not touched: "No unit stands here", "Outside the city border", "Costs {cost} food", "Play {card} at a unit".

**Doc-impact:** `docs/CHRONICLE.md`, `docs/ages/STONE.md`. `docs/GLOSSARY.md` stands: "heal", "health" and "refresh" already say what the line needs. `docs/CHRONICLE-SCREEN.md` stands: it describes no motion a unit's health plays. `docs/ages/NOMADIC.md` stands: the Nomadic deck does not change. `CHANGELOG.md` is written at the version bump.

**Scope:** In: healing a unit, in the rules — the helper content composes, the change it raises, the refusal of a unit at full health — with its test on the fixture and the fixture's card that heals; the map's motion for a healed unit; Heal's card, the technology and its achievement in the Stone Age's content; the five texts; `e2e/heal.spec.ts` with one test; the two pages.

Out: every later technology; a heal by an amount, a heal over several units, health coming back by itself; health shown on the map; any change to Gather, to the Nomadic deck or to the desert's share; the goal shown on the chronicle screen, the pinned achievement's line; a launch refusing a map whose desert no worker walks to.

The numbers, provisional and to be played: Heal costs 2 food; the need is 4; the technology unlocks one copy and its achievement pays 1 influence. 4 is every terrain a worker stands on in the Stone Age's temperate region — plain, forest, hills, desert — and 3 lands on the terrains beside any city with no journey.

Decided at intake:

- Heal touches health and nothing else: the unit keeps its move points and its action, a unit that attacked this turn is healed like any other, and a healed unit attacks and steps in the same turn. No worker is needed and nothing of the unit is spent.
- Heal is for any unit of the player's, a worker and a scout included. An enemy standing inside the border is never healed: a card aimed at a unit admits the player's units alone.
- The city's own tile is inside the border.
- Full health is the unit kind's health, the number the unit card's health row reads on the right.
- What Heal asks, in the order it answers: a unit of the player's on the tile, then the tile inside the border, then health below full.
- On the map a healed unit gives the bump a damaged unit gives, at the same size and speed: a stand-in until the look. Nothing else plays for it.
- A Gather on bare desert is played, gains nothing and counts toward the goal.
- The terrain counted is the tile's own when the card is played: a desert tile carrying an oasis or lying on a river counts as desert, and a forest burned afterwards has counted as forest.
- Gather is refused inside the border, so every terrain counted is gathered outside it. The empty deck never reaches the goal.
- On a map whose desert no worker walks to, 1 seed of 200 measured, the goal is not reached in that chronicle and nothing is done for it.
- A campaign and a chronicle begun before need no care.

What the reconcile chose:

- A card aimed at a unit: Heal goes through the standing aim at a unit as March does — the tiles lit, the line over the hand, the note over a refused tile — and what it asks beyond that is its own. The two effects stay apart: health is healed, move points are refreshed.
- Inside the border: Heal uses the check a building card uses, and its standing note, as they are.
- Health moving: damaged and healed stay two facts, each its own change, since which happened is what a listener plays. They share the map's bump and the one full-health number the unit card reads. No amount is taken: the one heal that exists is to full.
- The goal goes through the tally as it stands: the fixture's deed achievement already proves a tally of one card played through a worker by the terrain it was played on, counted in kinds, so the goal is content alone and gets the catalogue's coherence checks and no rules test.
- The spec is one of its own, on made ground: a warrior entered on the city's tile and damaged, the food gained to pay, all through the rules' helpers a card's effect or an answer composes, the deck being the first civilization's with one copy of Heal added as `e2e/trapping.spec.ts` adds its card. The seed search asks for one thing: Heal in the opening hand.

**Traps:**

- A unit carries its own copy of its kind's stats, and `stats.health` is the health it has left: full health stands nowhere on the unit and is read off the catalogue by the unit's type, as `src/ui/infopanel.ts` reads it for the unit card. The helper and the refusal read that same number.
- The tests' `standing` (`src/rules/fixtures.ts`) hands a unit any health, above its kind's included: the helper raises nothing and the refusal refuses on a unit at or above full, and never lowers a health.
- The helper is sane for every unit standing on the tile, whatever its faction, as `unitDamaged` (`src/rules/schedule.ts`) is; that Heal reaches the player's units alone is the aim's, in `refuses` (`src/rules/cards.ts`), which asks for a unit of the player's before the card's own reasons.
- The change names are the closed set in `src/rules/stages.ts`; a new one is taken by every switch over a change's name — `src/rules/chronicle.ts`, `src/ui/map.ts`, `src/ui/hand.ts`, `src/ui/piles.ts` — and the typecheck names the ones missed. The refusal reasons are the closed set `TileBlock` in `src/rules/state.ts`, each read through its `refusal.` entry in `src/ui/text.ts`.
- `src/ui/map.ts` plays a damaged unit through one function; the healed unit plays through that same motion, never a copy of it.
- The fixture holds `PH_March`, a card aimed at a unit, and no card that heals; the fixture's heal card is the implementer's to author in `src/rules/fixtures.ts`, on numbers of the fixture's own.
- The fixture's `PH_Survey` achievement is the goal's shape; the real achievement names Gather's id and reads the terrain off the chronicle the command started on.
- The tree's plates stand in a column in the order `CATALOGUE.technologies` declares them (`src/ui/tree-layout.ts`); the order of the doors is Agriculture, Trapping, Fire, Herbalism.
- `src/content/catalogue.test.ts` resolves every name a rules entry and a goal draw, asks every card its refusal and its admitted tiles, and every achievement its tally on an ended turn; it needs no edit to cover the new content.
- A card's age is the slice that brings it: Heal is a Stone Age card, and a new campaign's collection opens without it.
- `e2e/chronicle-screen.ts`'s `playedOn` plays a card at a tile and no other aim; `withCard` adds one copy of a card to the first civilization, `settledOn` takes that civilization and leaves the city's tile free of units, `unitEntered` enters a unit as a card does. `unitDamaged` and `gained` are the rules' helpers the spec hurts the unit and pays through; the damage must leave the unit standing, and the spec reads the unit's kind from the catalogue.
- The Nomadic deck does not change, so no spec's seed search moves.
- `docs/PHASER.md` holds what a spec rests for before it presses; the helpers the spec uses already rest.
- Comments are for traps only, in the rules, the content and the spec alike.

**Plan:** Two commits. First, inert, the mechanism: `src/rules/stages.ts`, `src/rules/state.ts` and `src/rules/cards.ts` hold the heal — the helper bringing the unit on a tile to its kind's health and answering the one change, nothing where no unit stands or none is to bring back, and the refusal of a unit at full health; `src/rules/fixtures.ts` holds the fixture's card that heals; the rules test beside the helper proves the heal, its refusal at full health and that move points and action stand; `src/rules/chronicle.ts`, `src/ui/map.ts`, `src/ui/hand.ts` and `src/ui/piles.ts` take the new change, the map bumping the healed unit; `src/ui/text.ts` holds the refusal's entry; no content changes, and `npm run check` and `npm test` pass. Second, the content and its proof: `src/content/stone.ts` holds the card, the technology after Fire and its achievement; `src/ui/text.ts` holds the technology's name, the goal, the card's name and its rules text; `e2e/heal.spec.ts` holds the one test, with whatever `e2e/chronicle-screen.ts` needs to play a card at a unit headlessly; the two pages take their sentences; the board line and this file are deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/heal.spec.ts` — Heal dragged out, aimed and pressed on the city's tile where a damaged warrior stands, the chronicle on the page equal to the one the rules leave, the unit at its kind's health, and nothing logged. CI proves on the push every other spec; the ones that walk the changed paths are `e2e/tree.spec.ts`, `e2e/campaign.spec.ts`, `e2e/launch.spec.ts`, `e2e/attack.spec.ts`, `e2e/press.spec.ts`, `e2e/refuse.spec.ts`, `e2e/collection.spec.ts` and `e2e/trapping.spec.ts`.
