# Glossary

The **closed vocabulary** of gameplay. Every concept has exactly one term, and that term is the
only one used for it — on cards, in the UI, in the codex, in code identifiers, in these docs.
Paraphrase and synonyms are defects: *remove* is never *destroy*, *sacrifice* or *trash* if
*remove* is the term. A concept that has no term here has no term yet; adding one is a design
decision made with the user, not a choice an implementer makes in passing.

Each row lists the forbidden near-synonyms so the review and the lint hook can catch them.
Prose that must mention a forbidden word for another reason (a card *named* "Sacrifice") is a
deliberate exception the reviewer sees; there is no silent allow-list.

| Term | Meaning | Not |
|------|---------|-----|
| **age** | One span of history: the unit a chronicle plays through, the campaign unlocks, and content is partitioned by. | era, epoch, period, tier |
| **campaign** | Humanity's history as the player has unlocked it — the meta's progression. | tech tree, map (for the meta) |
| **collection** | Every card the player owns, with the copies owned of each. | library, pool, inventory |
| **civilization** | A playable identity: starting units, one passive rule, a look, and its deck. | people, faction, nation, civ, board |
| **deck** | A civilization's set of cards, fixed for a chronicle. | build, loadout |
| **technology** | A permanent unlock earned by an achievement: new cards, better buildings, better units. | tech, advancement, upgrade, research |
| **achievement** | A goal a chronicle can reach; reaching it unlocks a technology. | mission, objective, quest, milestone |
| **influence** | The meta-currency every chronicle pays, scaled by how the city fared. | gold, points, XP |
| **chronicle** | One city's story through one age, from founding to victory or defeat — what a roguelite calls a run. | run, playthrough, attempt, session |
| **city** | The player's single settlement; what a chronicle is about. | town, capital, base, settlement |
| **map** | The hexagonal grid a chronicle is played on. | board, world, grid |
| **tile** | One hexagon of the map, of one terrain. | hex, cell, square, territory |
| **region** | The launch choice that biases map generation; the difficulty dial. | site, biome, location, start |
| **unit** | A mobile piece on the map, the player's or not. | army, troop, piece, token |
| **building** | A standing structure on a tile. | structure, improvement |
| **neutral** | A non-player unit that does not attack. | NPC, city-state, friendly |
| **enemy** | A non-player unit that attacks. | barbarian, raider, hostile, invader, foe |
| **killed** | What happens to a unit that loses: it leaves the map. | destroyed, slain, dead, lost |
| **event** | One entry of the age's schedule; what the chronicle throws at the city. | disaster, threat, crisis, encounter |
| **capstone** | The age's final trial; passing it is victory. | boss, finale, objective |
| **victory** | The end of a chronicle by passing the capstone. | win, success, triumph |
| **defeat** | The end of a chronicle by the city's fall. | collapse, game over, loss, death |
| **border** | The edge of the tiles the city holds; pushed out by culture. | frontier, territory |
| **turn** | One pass of the cycle: events, draw, play, end, income, enemy phase. | round |
| **hand** | The cards drawn this turn; what is not played is discarded when the turn ends. | — |
| **draw** | To take cards from the draw pile into the hand. | pull |
| **play** | To put a card from the hand into effect, paying its cost. | cast, activate |
| **discard** | To send a card from the hand to the discard pile. | throw away, dump |
| **draw pile** | The cards not yet drawn this cycle; refilled from the discard pile when empty. | library |
| **discard pile** | The cards played or discarded this cycle, waiting to be shuffled back. | graveyard, trash, bin |
| **income** | The step after the turn ends where standing things yield and act. | upkeep, production phase, resolution |
| **intent** | The attack an enemy declares one turn before executing it. | telegraph |
| **sight** | The tiles the city and its units currently see. | vision, line of sight |
| **fog** | Every tile outside sight; known terrain, unknown occupants. | fog of war, unexplored |
