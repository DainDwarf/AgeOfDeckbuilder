# Glossary

The **closed vocabulary** of gameplay. Every concept has exactly one term, and that term is the only one used for it — on cards, in the UI, in the codex, in code identifiers, in these docs. Paraphrase and synonyms are defects: _remove_ is never _destroy_, _sacrifice_ or _trash_ if _remove_ is the term. A concept that has no term here has no term yet; adding one is a design decision made with the user, not a choice an implementer makes in passing.

The vocabulary covers player-facing terms and the code that represents and manipulates those player-facing objects; development internals (the machinery under the game, such as `apply`'s command) are outside it.

So is lore, the fiction a window reads over its cards: prose the lint does not read, free to say tribe and hunter.

The meaning names what the term englobes, enough to tell it from its neighbours and from the word's other uses, and nothing more: the rules, the cases, the rendering and the reasons live on the design pages. A term a meaning needs is a row of its own, never a bold inside another's cell.

Each row lists the forbidden near-synonyms so the review and the lint hook can catch them. Prose that must mention a forbidden word for another reason (a card _named_ "Sacrifice") is a deliberate exception the reviewer sees; there is no silent allow-list. A line that lives with one marks it at its end, `// glossary exception: <word>`, and the lint skips that word on that line alone.

| Term | Meaning | Not |
| --- | --- | --- |
| **age** | One span of history: the unit a chronicle plays through, the campaign unlocks, and content is partitioned by. | era, epoch, period, tier |
| **campaign** | Humanity's history as the player has unlocked it — the meta's progression. | tech tree, map (for the meta) |
| **collection** | Every card the player owns, with the copies owned of each. | library, pool, inventory |
| **civilization** | A playable identity: starting units, one passive rule, a look, and its deck. | people, nation, civ, board |
| **deck** | A civilization's set of cards, fixed for a chronicle. | loadout |
| **settle section** | The part of the deck that holds its settle cards, the hand of the settle phase. | opening hand, starting hand, sideboard, reserve |
| **technology** | A permanent unlock earned by an achievement: new cards, better buildings, better units. | tech, advancement, upgrade, research |
| **achievement** | A goal a chronicle can reach; reaching it unlocks a technology. | mission, objective, quest, milestone |
| **influence** | The meta-currency every chronicle pays, scaled by how the city fared. | gold, XP |
| **chronicle** | One city's story through one age, from its opening to victory or defeat — what a roguelite calls a run. | run, playthrough, attempt, session |
| **city** | A settlement on the map; the player owns exactly one — _the_ city, what a chronicle is about. | town, capital, base, settlement |
| **settle** | To put the city on a tile, on the settle phase; also the kind of card played on the settle phase alone. | found, founding, establish |
| **map** | The hexagonal grid a chronicle is played on. | board, world, grid |
| **chronicle screen** | The surface a chronicle is played on — the map, the hand, the piles, the resource bar, the infopanel; what a window opens over and closes back to. | table, playfield, play area |
| **city mode** | The chronicle screen's second mode, in which the player acts on the city: assigns, unassigns, claims. | build mode, manage mode, edit mode, planning mode |
| **select** | To make a tile or a card the selection, the one thing a screen holds at a time. | pick, highlight, focus, arm, target (for a tile or a card) |
| **inspect** | To show a tile's cards in the infopanel, one at a time, or to show a card large. | read (a tile), examine, view, look at, zoom (for a card) |
| **tile** | One hexagon of the map, of one terrain. | hex, cell, square, territory |
| **region** | The launch choice that biases map generation; the difficulty dial. | site, location, start |
| **unit** | A mobile piece on the map, the player's or not. | army, troop, piece, token |
| **faction** | Who a unit acts for: the player, the enemies, or — when they exist — the neutrals. | side, team, owner, allegiance |
| **building** | A standing structure on a tile; one slot per tile. | structure |
| **place** | To put a thing onto a tile: a unit, a building, a camp. | deploy, drop, spawn (for a thing on a tile) |
| **build** | To put a building on a tile; what a building card does. | raise, construct, erect |
| **neutral** | A non-player unit that does not attack. | NPC, city-state, friendly |
| **enemy** | A non-player unit that attacks. | barbarian, raider, hostile, invader, foe |
| **killed** | What befalls a unit or a population: the unit leaves the map, the population the city. | destroyed, slain, dead, lost |
| **event** | One entry of the age's schedule: a problem the chronicle throws at the city, dealt with its answers. | disaster, threat, crisis, encounter |
| **capstone** | The age's final trial; passing it is victory. | boss, finale, objective |
| **schedule** | An age's events and capstone, with their odds and tempo; what a timeline is rolled from. | calendar |
| **timeline** | One chronicle's roll of its schedule: the turns its events and its capstone land on. | forecast, agenda, itinerary |
| **camp** | A site enemies enter the map from. | lair, nest, spawn point, spawner |
| **victory** | The end of a chronicle by passing the capstone; the age is won by it, and win is the verb. | success, triumph |
| **defeat** | The end of a chronicle by the city's fall. | collapse, game over, loss, death |
| **border** | The edge of the tiles the city holds; pushed out by culture. | frontier, territory |
| **turn** | One pass of the chronicle's cycle of phases. | round |
| **phase** | One part of the turn's cycle, in its fixed order; what the turn list names. | step, stage (in prose), section |
| **settle phase** | The chronicle's opening, before its first turn: the city stands nowhere, the hand is dealt from the settle section, and none of the cycle runs. | turn 0, turn zero, opening turn, setup, deployment |
| **hand** | The cards drawn this turn. | — |
| **draw** | To take cards from the draw pile into the hand. | pull |
| **play** | To put a card from the hand into effect, paying its cost. | cast, activate |
| **aim** | What a card is played at, nothing included. | target (for a card's aim), targeting (for a card's aim), cast at, pointed at, destination |
| **aim window** | The window offering the discard pile's cards to a card aimed there. | browse (for the aim window), picker, chooser, selector |
| **being aimed** | The state of a selected card while what its aim admits is offered, until it lands or is put back. | armed, pending, targeting, in flight |
| **stock** | The city's holding of one resource: what income adds to and every cost is paid out of. | reserve, treasury, pool, supply, balance, bank |
| **cost** | What the city pays out of its stocks to play something, for example a card. | price, fee, charge, toll |
| **unaffordable** | What the city cannot pay for: its cost exceeds the stocks. | unpayable, short, lacking, too expensive |
| **discard** | To send a card from the hand to the discard pile. | throw away, dump |
| **recall** | To put a card from the discard pile into the hand; what a recall instant does. | retrieve, recover, reclaim, salvage |
| **single use** | A keyword on a card: played, it leaves the chronicle instead of going to the discard pile. | one-use, gone once played, consumed, exhaust, exile |
| **counter** | A named number a card carries in a chronicle, declared by its content and set when the card is made. | token, charge, variable |
| **draw pile** | The cards not yet drawn this cycle; refilled from the discard pile when empty. | library |
| **discard pile** | The cards played or discarded this cycle, waiting to be shuffled back. | graveyard, trash, bin |
| **browse** | A window offering a pile's cards to be read. | pile window, viewer, gallery, preview, list (of a pile) |
| **combat** | Units attacking one another: the player's by hand in play, the enemies' in the enemy phase. | battle, fight, skirmish, war |
| **income** | The phase where standing things yield. | upkeep, production phase, resolution |
| **sight** | A unit's stat and the city's own: how far it sees; a tile it reaches is in sight. | vision, line of sight |
| **elevation** | How high a terrain stands over the ground; what blocks sight. | altitude, tallness |
| **fog** | A tile seen before and out of sight now. | fog of war, shroud, dimmed, remembered |
| **charted** | A tile that has been in sight, in sight now or in fog. | explored, revealed, discovered, known, seen (of a tile's state) |
| **uncharted** | A tile never yet in sight. | unexplored, unknown, unrevealed, black, hidden |
| **instant** | A card with an immediate effect: on the city, on a tile, or one thing with one unit. | action (for a card), spell, effect card |
| **hazard** | A card no deck holds: an event brings it into a chronicle, and it strikes while held. | penalty, curse, drawback, upkeep, affliction, bane |
| **strike** | What a hazard does to the chronicle at the end of a turn it is still in the hand. | bite, trigger, proc, go off |
| **worker** | A non-fighting unit that cards are played through to change tiles: build, terraform, improve. | builder, engineer, labourer |
| **population** | The city's inhabitants: assigned to tiles for income, turned into units by unit cards. | inhabitants, citizens, workforce, pops |
| **assign** | To put one population on a tile inside the border. | allocate |
| **unassign** | To take one population off the tile it stands on; the reverse of assign. | remove, free up, release |
| **idle** | One population assigned to no tile; what a unit card takes. | unemployed, spare, unassigned (as a noun) |
| **grow** | What the city does at the growth phase: it gains one population, paid in food. | birth, breed, spawn (for population), expand |
| **growth threshold** | The food the next population costs. | step, growth cost, food cap |
| **biome** | A stretch of map the generator spreads or deals as one kind — land, sea, … — weighting the terrain of each tile in it. | patch, zone, area, ecosystem |
| **terrain** | A tile's base layer: plain, forest, hills, …; one per tile, changed only by terraforming. | tile type |
| **movement cost** | What entering a tile spends of a unit's move points; a tile that names none is entered by nothing. | move cost, terrain cost, travel cost, difficulty, impassable |
| **terraform** | To change a tile's terrain into another. | transform, convert, reshape |
| **feature** | An extra on a tile, dealt by the generator or by an event's answer: a fertile plain. | bonus |
| **river** | A watercourse the generator runs along the edges between tiles, from a mountain range to the sea. | stream, creek, waterway |
| **improvement** | A layer a tile gains by being improved; unlike a building, a tile holds any number. | — |
| **road** | An improvement that names its tile's movement cost outright. | path, track, highway, trail |
| **bridge** | A river edge with a road on both banks, crossed as if no river ran there. | ford, viaduct, span |
| **improve** | To put an improvement on a tile where a worker stands; what an improvement instant does. | lay, build, install |
| **yield** | What a tile's layers and the river running along it give at income, resource by resource. | output, produce, harvest |
| **claim** | To take a charted tile adjacent to one the city holds into the border, for culture. | buy, purchase, expand, annex |
| **culture** | The resource that claims tiles. | — |
| **culture threshold** | The culture the next claim costs. | claim cost, step |
| **health** | A unit's remaining life; at zero the unit is killed. | HP, hit points, hitpoints, life |
| **heal** | To bring a unit's health back up. | refresh (of health), repair, restore, regenerate, cure |
| **attack** | The act: a unit removes its damage from a target's health. | hit |
| **damage** | A unit's stat: the health its attack removes. | strength, power, harm |
| **range** | The distance, in tiles, a unit attacks over; one for melee. | reach |
| **move** | A unit's stat: the move points it refreshes to. | speed, mobility, movement points |
| **move points** | What a unit spends to cross tiles, a tile's movement cost to enter it; refreshed to its move. | movement points, steps, stamina |
| **action** | A unit's stat and the pool it refreshes to: what it spends to attack, or, on a worker, on a card played through it. | action points, energy, attack pool |
| **refresh** | To bring a unit's spendable stat — move points, action — back to its full value; health is healed, never refreshed. | restore, replenish, reset, recharge, recover, regain |
| **military** | The resource that pays for military units, instants and fortifications. | — |
| **occupy** | What an enemy does to a tile it stands on: the tile yields nothing and is not claimable. | blockade |
| **pillage** | What some enemies do to the tile they stand on: its building or improvement is destroyed. | raze, loot |
| **capture** | To take a site, the city or a camp, by standing on its tile. | conquer, seize, sack |
| **reward** | What capturing a site deals: cards, of which the player chooses one. | gift, prize, bounty |
