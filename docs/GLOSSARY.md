# Glossary

The **closed vocabulary** of gameplay. Every concept has exactly one term, and that term is the only one used for it — on cards, in the UI, in the codex, in code identifiers, in these docs. Paraphrase and synonyms are defects: _remove_ is never _destroy_, _sacrifice_ or _trash_ if _remove_ is the term. A concept that has no term here has no term yet; adding one is a design decision made with the user, not a choice an implementer makes in passing.

The vocabulary covers player-facing terms and the code that represents and manipulates those player-facing objects; development internals (the machinery under the game, such as `apply`'s command) are outside it.

Each row lists the forbidden near-synonyms so the review and the lint hook can catch them. Prose that must mention a forbidden word for another reason (a card _named_ "Sacrifice") is a deliberate exception the reviewer sees; there is no silent allow-list.

| Term | Meaning | Not |
| --- | --- | --- |
| **age** | One span of history: the unit a chronicle plays through, the campaign unlocks, and content is partitioned by. | era, epoch, period, tier |
| **campaign** | Humanity's history as the player has unlocked it — the meta's progression. | tech tree, map (for the meta) |
| **collection** | Every card the player owns, with the copies owned of each. | library, pool, inventory |
| **civilization** | A playable identity: starting units, one passive rule, a look, and its deck. | people, nation, civ, board |
| **deck** | A civilization's set of cards, fixed for a chronicle, in two sections: its cards, which the draw pile cycles, and its **settle cards**, played on turn 0 alone. | loadout |
| **technology** | A permanent unlock earned by an achievement: new cards, better buildings, better units. | tech, advancement, upgrade, research |
| **achievement** | A goal a chronicle can reach; reaching it unlocks a technology. | mission, objective, quest, milestone |
| **influence** | The meta-currency every chronicle pays, scaled by how the city fared. | gold, XP |
| **chronicle** | One city's story through one age, from its opening to victory or defeat — what a roguelite calls a run. | run, playthrough, attempt, session |
| **city** | A settlement on the map; the player owns exactly one — _the_ city, what a chronicle is about. | town, capital, base, settlement |
| **settle** | To put the city on a tile; what the settle card does on turn 0, the **settle phase**, where the deck's settle cards alone are played. | found, founding, establish, place (the city) |
| **map** | The hexagonal grid a chronicle is played on. | board, world, grid |
| **chronicle screen** | The surface a chronicle is played on — the map, the hand, the piles, the resource bar, the infopanel; what a window opens over and closes back to. | table, playfield, play area |
| **city mode** | The chronicle screen's second mode, in which a left click on the selected tile acts on the city — assigns, unassigns, claims. | build mode, manage mode, edit mode, planning mode |
| **select** | To make a tile or a card the selection: the one thing a screen holds — the tile the map rings, the card lifted in the hand, or the card ringed in a browse — and what the inspection key inspects. | pick, highlight, focus, arm, target (for a tile or a card) |
| **inspect** | To show a tile's cards in the infopanel, one per step — the unit, the building with the improvements, the terrain with the feature and the river; after the last the first again — or to show a card large. | read (a tile), examine, view, look at, zoom (for a card) |
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
| **capstone** | The age's final trial, known from the chronicle's opening on a turn that is not; passing it is victory. | boss, finale, objective |
| **schedule** | An age's set of events with their turn-shifting weights; what the Events phase draws from. | timeline, calendar |
| **camp** | A generated site enemies enter the map from, filling its tile's building slot; captured, it leaves the map. | lair, nest, spawn point, spawner |
| **victory** | The end of a chronicle by passing the capstone. | win, success, triumph |
| **defeat** | The end of a chronicle by the city's fall. | collapse, game over, loss, death |
| **border** | The edge of the tiles the city holds; pushed out by culture. | frontier, territory |
| **turn** | One pass of the cycle: events, draw, play, end, income, growth, enemy phase. Turn 0, the settle phase, runs none of it. | round |
| **phase** | One part of the turn's cycle, in its fixed order; what the turn list names. | step, stage (in prose), section |
| **hand** | The cards drawn this turn; what is not played is discarded when the turn ends. | — |
| **draw** | To take cards from the draw pile into the hand. | pull |
| **play** | To put a card from the hand into effect, paying its cost. | cast, activate |
| **aim** | What a card is played at: a drawn tile, a unit of the player's on one, a card of the discard pile, or nothing. The window offering the discard pile's cards to a card aimed there is the **aim window**. A card is **being aimed** while it is selected and the things its aim admits are offered — the map lighting them, or the aim window standing. | target (for a card's aim), targeting (for a card's aim), cast at, pointed at, destination |
| **unaffordable** | A card or a claim whose cost exceeds what the city holds; the city cannot pay for it. | unpayable, short, lacking, too expensive |
| **discard** | To send a card from the hand to the discard pile. | throw away, dump |
| **recall** | To put a card from the discard pile into the hand; what a recall instant does. | retrieve, recover, return, reclaim, salvage |
| **single use** | A keyword on a card: played, it leaves the chronicle instead of going to the discard pile. | one-use, gone once played, consumed, exhaust, burn, exile |
| **draw pile** | The cards not yet drawn this cycle; refilled from the discard pile when empty. | library |
| **discard pile** | The cards played or discarded this cycle, waiting to be shuffled back. | graveyard, trash, bin |
| **browse** | A window offering a pile's cards to be read, opened by a left click on that pile; the window a card aimed at the discard pile opens is the aim window and not one. | pile window, viewer, gallery, preview, list (of a pile) |
| **combat** | Units attacking one another: the player's by hand in play, the enemies' in the enemy phase. | battle, fight, skirmish, war |
| **income** | The phase after the turn ends where standing things yield. | upkeep, production phase, resolution |
| **sight** | A unit's stat and the city's own number: how far it sees, and the tiles a line from it reaches over the ground. | vision, line of sight |
| **elevation** | How high a terrain stands over the ground: a raised tile at least as high as the one a unit is on stops the line from it there. | altitude, tallness |
| **fog** | A tile seen before and out of sight now; drawn as it was last seen, darkened. | fog of war, shroud, dimmed, remembered |
| **uncharted** | A tile never yet in sight; drawn not at all, and a unit of the player's is not moved onto one. Its opposite, **charted**, is a tile in sight or in fog. | unexplored, unknown, unrevealed, black, explored, revealed, discovered, known |
| **instant** | A card with an immediate effect: on the city, on a tile, or one thing with one unit. | action (for a card), spell, effect card |
| **hazard** | A card no deck holds: an event brings it into a chronicle, and it **strikes** while held. | penalty, curse, drawback, upkeep, affliction, bane |
| **strike** | What a hazard does to the chronicle at the end of a turn it is still in the hand. | bite, trigger, fire, proc, go off |
| **worker** | A non-fighting unit that changes tiles: builds buildings, terraforms them, improves them, spending its one action on each card played through it. | builder, engineer, labourer |
| **population** | The city's inhabitants: assigned to tiles for income, turned into units by unit cards. | citizens, workforce, pops |
| **assign** | To put one population on a tile inside the border; free, instant, reversible. | allocate |
| **unassign** | To take one population off the tile it stands on; the reverse of assign. | remove, free up, release |
| **idle** | An inhabitant assigned to no tile; what a unit card takes. | unemployed, spare, unassigned (as a noun) |
| **grow** | What the food stock reaching the growth threshold does at the growth phase: the city gains one idle inhabitant. | birth, breed, spawn (for population), expand |
| **growth threshold** | The food the next inhabitant needs; spent when the stock reaches it, and wider each time. | step, growth cost, food cap |
| **biome** | A stretch of map the generator spreads as one kind — land, sea, … — weighting the terrain of each tile in it. | patch, zone, area, ecosystem |
| **terrain** | A tile's base layer: plain, forest, hills, …; one per tile, changed only by terraforming. | tile type |
| **movement cost** | What entering a tile spends of a unit's move points, summed from the tile's layers unless one of them names it outright; water names none and is crossed by nothing. | move cost, terrain cost, travel cost, difficulty, impassable |
| **terraform** | To change a tile's terrain into another, where a worker stands; what a terraform instant does. | transform, convert, reshape |
| **feature** | A generated extra on a tile: a fertile plain. | bonus |
| **river** | A watercourse the generator runs along the edges between tiles, from a mountain range to the sea. | stream, creek, waterway |
| **improvement** | A layer a worker improves a tile with through an instant; distinct ones stack, the same one never twice. | — |
| **road** | An improvement whose tile costs half a move point to enter, whatever lies under it. | path, track, highway, trail |
| **bridge** | A river edge with a road on both banks, crossed as if no river ran there. | ford, viaduct, span |
| **improve** | To put an improvement on a tile where a worker stands; what an improvement instant does. | lay, build, place, install |
| **yield** | What a tile's layers and the river running along it give at income, resource by resource. | output, produce, harvest |
| **claim** | To spend culture on a charted tile adjacent to one the city owns; free of cards. | buy, purchase, expand, annex |
| **culture** | The resource that claims tiles. | — |
| **culture threshold** | The culture the next claim costs; rises with the tiles the city holds. | claim cost, step, price |
| **health** | A unit's remaining life; at zero the unit is killed. | HP, hit points, hitpoints, life |
| **heal** | To bring a unit's health back up. | refresh (of health), repair, restore, regenerate, cure |
| **attack** | The act: a unit removes its damage from a target's health. | hit |
| **damage** | A unit's stat: the health its attack removes. | strength, power, harm |
| **range** | The distance, in tiles, a unit attacks over; one for melee. | reach |
| **move** | A unit's stat: the move points it refreshes to. | speed, mobility, movement points |
| **move points** | What a unit spends to cross tiles, a tile's movement cost to enter it; refreshed to its move. | movement points, steps, stamina |
| **action** | A unit's stat, and what it spends to attack, one per attack, or, on a worker, what it spends on a card played through it, one per card, whatever its range or damage; refreshed to its action. | action points, energy, attack pool |
| **refresh** | To bring a unit's spendable stat back to its full value — its move points to its move, its action to its action. The turn refreshes both on every unit when it ticks over; an instant refreshes one unit's move points. Health is never refreshed but healed. | restore, replenish, reset, recharge, recover, regain |
| **military** | The resource that pays for military units, instants and fortifications. | — |
| **occupy** | What an enemy does to a tile it stands on: the tile yields nothing and is not claimable. | blockade |
| **pillage** | What some enemies do to the tile they stand on: its building or improvement is destroyed. | raze, loot, burn |
| **capture** | To take a site by standing on its tile through a full turn: an enemy captures the city (defeat), the player captures a camp. | conquer, seize, sack |
