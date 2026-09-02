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
| **schedule** | An age's set of events with their turn-shifting weights; what the Events step draws from. | timeline, calendar |
| **camp** | A generated site enemies enter the map from; captured, it spawns nothing again. | lair, nest, spawn point, spawner |
| **victory** | The end of a chronicle by passing the capstone. | win, success, triumph |
| **defeat** | The end of a chronicle by the city's fall. | collapse, game over, loss, death |
| **border** | The edge of the tiles the city holds; pushed out by culture. | frontier, territory |
| **turn** | One pass of the cycle: events, draw, play, end, combat, income, enemy phase. | round |
| **hand** | The cards drawn this turn; what is not played is discarded when the turn ends. | — |
| **draw** | To take cards from the draw pile into the hand. | pull |
| **play** | To put a card from the hand into effect, paying its cost. | cast, activate |
| **unaffordable** | A card whose cost exceeds what the city holds; it cannot be played. | unpayable, short, lacking, too expensive |
| **discard** | To send a card from the hand to the discard pile. | throw away, dump |
| **draw pile** | The cards not yet drawn this cycle; refilled from the discard pile when empty. | library |
| **discard pile** | The cards played or discarded this cycle, waiting to be shuffled back. | graveyard, trash, bin |
| **combat** | The step after the turn ends where every fighting unit attacks: the player's, then the enemies' declared intents. | battle, fight, skirmish, war |
| **income** | The step after combat where standing things yield. | upkeep, production phase, resolution |
| **intent** | The attack an enemy declares one turn before executing it. | telegraph |
| **sight** | The tiles the city and its units currently see. | vision, line of sight |
| **fog** | Every tile outside sight; known terrain, unknown occupants. | fog of war, unexplored |
| **order** | A card that does one thing with one unit; the plain order moves it, and its nature acts on arrival. | move card |
| **action** | A card with an immediate effect. | spell, effect card |
| **worker** | A non-fighting unit that transforms tiles: builds buildings, terraforms, lays roads. | builder, engineer, labourer |
| **population** | The city's inhabitants: assigned to tiles for income, turned into units by unit cards. | citizens, workforce, pops |
| **assign** | To put one population on a tile inside the border; free, instant, reversible. | allocate |
| **biome** | A stretch of map the generator grows as one kind — land, sea, … — weighting the terrain of each tile in it. | patch, zone, area, ecosystem |
| **terrain** | A tile's base layer: plain, forest, hills, …; one per tile, changed only by terraforming. | tile type |
| **feature** | A generated extra on a tile: a fertile plain, a river. | bonus |
| **improvement** | A layer a worker lays on a tile through an action; distinct ones stack, the same one never twice. | — |
| **claim** | To spend culture on a tile adjacent to one the city owns; free of cards. | buy, purchase, expand, annex |
| **culture** | The resource that claims tiles. | — |
| **health** | A unit's remaining life; at zero the unit is killed. | HP, hit points, hitpoints, life |
| **attack** | The act: a unit removes its damage from a target's health. | strike, hit |
| **damage** | A unit's stat: the health its attack removes. | strength, power, harm |
| **range** | The distance, in tiles, a unit attacks over; one for melee. | reach |
| **move** | The tiles a unit crosses per order. | speed, mobility, movement points |
| **military** | The resource that pays for military units, orders, actions and fortifications. | — |
| **occupy** | What an enemy does to a tile it stands on: the tile yields nothing. | blockade |
| **pillage** | What some enemies do to the tile they stand on: its building or improvement is destroyed. | raze, loot, burn |
| **capture** | To take a site by standing on its tile through a full turn: an enemy captures the city (defeat), the player captures a camp. | conquer, seize, sack |
