# Glossary

The **closed vocabulary** of gameplay. Every concept has exactly one term, and that term is the
only one used for it — on cards, in the UI, in the codex, in code identifiers, in these docs.
Paraphrase and synonyms are defects: *remove* is never *destroy*, *sacrifice* or *trash* if
*remove* is the term. A concept that has no term here has no term yet; adding one is a design
decision made with the user, not a choice an implementer makes in passing.

The vocabulary covers player-facing terms and the code that represents and manipulates those
player-facing objects; development internals (the machinery under the game, such as `apply`'s
command) are outside it.

Each row lists the forbidden near-synonyms so the review and the lint hook can catch them.
Prose that must mention a forbidden word for another reason (a card *named* "Sacrifice") is a
deliberate exception the reviewer sees; there is no silent allow-list.

| Term | Meaning | Not |
|------|---------|-----|
| **age** | One span of history: the unit a chronicle plays through, the campaign unlocks, and content is partitioned by. | era, epoch, period, tier |
| **campaign** | Humanity's history as the player has unlocked it — the meta's progression. | tech tree, map (for the meta) |
| **collection** | Every card the player owns, with the copies owned of each. | library, pool, inventory |
| **civilization** | A playable identity: starting units, one passive rule, a look, and its deck. | people, nation, civ, board |
| **deck** | A civilization's set of cards, fixed for a chronicle. | loadout |
| **technology** | A permanent unlock earned by an achievement: new cards, better buildings, better units. | tech, advancement, upgrade, research |
| **achievement** | A goal a chronicle can reach; reaching it unlocks a technology. | mission, objective, quest, milestone |
| **influence** | The meta-currency every chronicle pays, scaled by how the city fared. | gold, points, XP |
| **chronicle** | One city's story through one age, from founding to victory or defeat — what a roguelite calls a run. | run, playthrough, attempt, session |
| **city** | A settlement on the map; the player owns exactly one — *the* city, what a chronicle is about. | town, capital, base, settlement |
| **map** | The hexagonal grid a chronicle is played on. | board, world, grid |
| **chronicle screen** | The surface a chronicle is played on — the map, the hand, the piles, the resource bar, the infopanel; what a window opens over and closes back to. | table, playfield, play area |
| **city mode** | The chronicle screen's second mode, in which a tile click acts on the city — assigns, unassigns, claims — instead of selecting the tile. | build mode, manage mode, edit mode, planning mode |
| **select** | To make a tile the selection: the one tile the map rings and the inspection key steps. | pick, highlight, focus, target (for a tile) |
| **inspect** | To show a tile's cards in the infopanel, one per step: the unit, the building with the improvements, the terrain with the feature and the river; after the last the first again. | read (a tile), examine, view, look at |
| **tile** | One hexagon of the map, of one terrain. | hex, cell, square, territory |
| **region** | The launch choice that biases map generation; the difficulty dial. | site, location, start |
| **unit** | A mobile piece on the map, the player's or not. | army, troop, piece, token |
| **faction** | Who a unit acts for: the player, the enemies, or — when they exist — the neutrals. | side, team, owner, allegiance |
| **building** | A standing structure on a tile; one slot per tile. | structure |
| **build** | To put a building on a tile; what a building card does. | raise, construct, erect |
| **neutral** | A non-player unit that does not attack. | NPC, city-state, friendly |
| **enemy** | A non-player unit that attacks. | barbarian, raider, hostile, invader, foe |
| **killed** | What happens to a unit that loses: it leaves the map. | destroyed, slain, dead, lost |
| **event** | One entry of the age's schedule; what the chronicle throws at the city. | disaster, threat, crisis, encounter |
| **capstone** | The age's final trial, on a fixed turn known from the launch; passing it is victory. | boss, finale, objective |
| **schedule** | An age's set of events with their turn-shifting weights; what the Events phase draws from. | timeline, calendar |
| **camp** | A generated site enemies enter the map from; captured, it spawns nothing again. | lair, nest, spawn point, spawner |
| **victory** | The end of a chronicle by passing the capstone. | win, success, triumph |
| **defeat** | The end of a chronicle by the city's fall. | collapse, game over, loss, death |
| **border** | The edge of the tiles the city holds; pushed out by culture. | frontier, territory |
| **turn** | One pass of the cycle: events, draw, play, end, combat, income, growth, enemy phase. | round |
| **phase** | One part of the turn's cycle, in its fixed order; what the turn list names. | step, stage (in prose), section |
| **hand** | The cards drawn this turn; what is not played is discarded when the turn ends. | — |
| **draw** | To take cards from the draw pile into the hand. | pull |
| **play** | To put a card from the hand into effect, paying its cost. | cast, activate |
| **unaffordable** | A card or a claim whose cost exceeds what the city holds; the city cannot pay for it. | unpayable, short, lacking, too expensive |
| **discard** | To send a card from the hand to the discard pile. | throw away, dump |
| **draw pile** | The cards not yet drawn this cycle; refilled from the discard pile when empty. | library |
| **discard pile** | The cards played or discarded this cycle, waiting to be shuffled back. | graveyard, trash, bin |
| **combat** | The phase after the turn ends where every fighting unit attacks: the player's, then the enemies' declared intents. | battle, fight, skirmish, war |
| **income** | The phase after combat where standing things yield. | upkeep, production phase, resolution |
| **intent** | The attack an enemy declares one turn before executing it. | telegraph |
| **sight** | The tiles the city and its units currently see. | vision, line of sight |
| **fog** | Every tile outside sight; known terrain, unknown occupants. | fog of war, unexplored |
| **order** | A card that does one thing with one unit; the plain order refreshes its move points. | move card |
| **action** | A card with an immediate effect. | spell, effect card |
| **worker** | A non-fighting unit that changes tiles: builds buildings, terraforms them, improves them. | builder, engineer, labourer |
| **population** | The city's inhabitants: assigned to tiles for income, turned into units by unit cards. | citizens, workforce, pops |
| **assign** | To put one population on a tile inside the border; free, instant, reversible. | allocate |
| **unassign** | To take one population off the tile it stands on; the reverse of assign. | remove, free up, release |
| **idle** | An inhabitant assigned to no tile; what a unit card takes. | unemployed, spare, unassigned (as a noun) |
| **grow** | What the food stock reaching the growth threshold does at the growth phase: the city gains one idle inhabitant. | birth, breed, spawn (for population), expand |
| **growth threshold** | The food the next inhabitant needs; spent when the stock reaches it, and wider each time. | step, growth cost, food cap |
| **biome** | A stretch of map the generator spreads as one kind — land, sea, … — weighting the terrain of each tile in it. | patch, zone, area, ecosystem |
| **terrain** | A tile's base layer: plain, forest, hills, …; one per tile, changed only by terraforming. | tile type |
| **terraform** | To change a tile's terrain into another, where a worker stands; what a terraform action does. | transform, convert, reshape |
| **feature** | A generated extra on a tile: a fertile plain. | bonus |
| **river** | A watercourse the generator runs along the edges between tiles, from a mountain range to the sea. | stream, creek, waterway |
| **improvement** | A layer a worker improves a tile with through an action; distinct ones stack, the same one never twice. | — |
| **improve** | To put an improvement on a tile where a worker stands; what an improvement action does. | lay, build, place, install |
| **yield** | What a tile's layers and the river running along it give at income, resource by resource. | output, produce, harvest |
| **claim** | To spend culture on a tile adjacent to one the city owns; free of cards. | buy, purchase, expand, annex |
| **culture** | The resource that claims tiles. | — |
| **culture threshold** | The culture the next claim costs; rises with the tiles the city holds. | claim cost, step, price |
| **health** | A unit's remaining life; at zero the unit is killed. | HP, hit points, hitpoints, life |
| **heal** | To bring a unit's health back up. | refresh (of health), repair, restore, regenerate, cure |
| **attack** | The act: a unit removes its damage from a target's health. | strike, hit |
| **damage** | A unit's stat: the health its attack removes. | strength, power, harm |
| **range** | The distance, in tiles, a unit attacks over; one for melee. | reach |
| **move** | A unit's stat: the move points it refreshes to. | speed, mobility, movement points |
| **move points** | What a unit spends to cross tiles, one per tile; refreshed to its move. | movement points, steps, stamina, action points |
| **refresh** | To bring a unit's spendable stat back to its full value — its move points to its move; what the turn does to every unit when it ticks over, and what the plain order does to one unit. Health is never refreshed but healed. | restore, replenish, reset, recharge, recover, regain |
| **military** | The resource that pays for military units, orders, actions and fortifications. | — |
| **occupy** | What an enemy does to a tile it stands on: the tile yields nothing. | blockade |
| **pillage** | What some enemies do to the tile they stand on: its building or improvement is destroyed. | raze, loot, burn |
| **capture** | To take a site by standing on its tile through a full turn: an enemy captures the city (defeat), the player captures a camp. | conquer, seize, sack |
