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
| **collection** | Every card the player owns, every copy a card of its own. | library, pool, inventory |
| **civilization** | What a chronicle is played as, unlocked by the campaign: a city section and a deck. | people, nation, civ, board |
| **deck** | A civilization's cards: its settle section and the cards the draw pile cycles. | loadout |
| **settle section** | The part of the deck that holds its settle cards; with the city section's card, the hand of the settle phase. | opening hand, starting hand, sideboard, reserve |
| **city section** | The part of a civilization that holds the city — its building, its sight, its idle population — and the card that settles it. | city slot, capital card |
| **technology** | One step of the campaign, learned for good by reaching its achievement; it unlocks new cards, better buildings, better units. | tech, advancement, upgrade, research |
| **learned technology** | A technology whose achievement has paid. | unlocked technology, researched |
| **available technology** | A technology not learned whose every needed technology is learned. | within reach, reachable |
| **unknown technology** | A technology that needs one not learned; the player is told only that it is there. | mystery, locked, secret |
| **pin** | To hold an available technology in view: while a chronicle reads its achievement, the chronicle screen shows it. | track (for an achievement), follow (for an achievement), watch (for an achievement), bookmark |
| **achievement** | A goal a chronicle can reach; its technology is learned by reaching it. | mission, objective, quest, milestone |
| **influence** | The meta-currency every chronicle pays, scaled by how the city fared. | gold, XP |
| **price** | The influence one more copy of a card is bought for. | fee, rate, value (for a card) |
| **base price** | The price of a card owned once, which the card's age sets for all its cards. | base cost, starting price, flat price |
| **buy** | To pay a card's price in influence and add one more copy of it to the collection. | purchase, acquire |
| **save** | The chronicle in progress and the meta, kept on the player's machine. | savegame, save slot, checkpoint, autosave |
| **chronicle** | One city's story through one age, from its opening to victory or defeat — what a roguelite calls a run. | run, playthrough, attempt, session |
| **city** | A settlement on the map; the player owns exactly one — _the_ city, what a chronicle is about. | town, capital, base, settlement |
| **settle** | To put the city on a tile, on the settle phase; also the kind of card played on the settle phase alone. | found, founding, establish |
| **map** | The hexagonal grid a chronicle is played on. | board, world, grid |
| **chronicle screen** | The surface a chronicle is played on — the map, the hand, the piles, the resource bar, the infopanel; what a window opens over and closes back to. | table, playfield, play area |
| **campaign screen** | The home: the screen the game boots on and a chronicle's ending returns to, showing the campaign. | main menu, title screen, hub, lobby |
| **launch screen** | The screen a chronicle is launched from, offering the launch's choices. | new game screen, setup screen, lobby |
| **collection screen** | The screen the deck is edited on and influence spent, showing the collection. | deck builder, deck editor, shop, store |
| **city mode** | The chronicle screen's second mode, in which the player acts on the city: assigns, unassigns, claims. | build mode, manage mode, edit mode, planning mode |
| **select** | To make one thing the selection: the one held, among those offered with it. | pick, highlight, focus, arm, target (for a tile or a card) |
| **inspect** | To show a tile's cards in the infopanel, one at a time, to show a card large, or to open a pile's browse. | read (a tile), examine, view, look at, zoom (for a card) |
| **tile** | One hexagon of the map, of one terrain. | hex, cell, square, territory |
| **region** | The launch choice that biases map generation; the difficulty dial. | site, location, start |
| **unit** | A mobile piece on the map, the player's or not. | army, troop, piece, token |
| **faction** | Who a unit acts for: the player, the enemies, or — when they exist — the neutrals. | side, team, owner, allegiance |
| **building** | A standing structure on a tile; one slot per tile. | structure |
| **place** | To put a thing onto a tile: a unit, a building, an improvement, a camp. | deploy, drop, spawn (for a thing on a tile), improve, lay, install |
| **build** | To put a building on a tile; what a building card does. | raise, construct, erect |
| **neutral** | A non-player unit that does not attack. | NPC, city-state, friendly |
| **enemy** | A non-player unit that attacks. | barbarian, raider, hostile, invader, foe |
| **killed** | What befalls a unit or a population: the unit leaves the map, the population the city. | destroyed, slain, dead, lost |
| **event** | One entry of the age's schedule: a problem the chronicle throws at the city, dealt with its answers. | disaster, threat, crisis, encounter |
| **answer** | One of the cards an event deals: a way out of its problem with a cost of its own, of which the player chooses one. | option, response, reply, solution |
| **capstone** | The age's final trial; passing it is victory. | boss, finale, objective |
| **schedule** | An age's events and capstone, with their odds and tempo; what a timeline is rolled from. | calendar |
| **timeline** | One chronicle's roll of its schedule: the turns its events and its capstone land on. | forecast, agenda, itinerary |
| **camp** | Where enemies enter the map from. | lair, nest, spawn point, spawner |
| **victory** | The end of a chronicle by passing the capstone; the age is won by it, and win is the verb. | success, triumph |
| **defeat** | The end of a chronicle by the city's fall. | collapse, game over, loss, death |
| **border** | The edge of the tiles the city holds; pushed out by culture. | frontier, territory |
| **turn** | One pass of the chronicle's cycle of phases. | round |
| **phase** | One part of the turn's cycle, in its fixed order; what the turn list names. | step, stage (in prose), section |
| **settle phase** | The chronicle's opening, before its first turn: the city stands nowhere, the hand is the city section's card and the settle section, and none of the cycle runs. | turn 0, turn zero, opening turn, setup, deployment |
| **hand** | The cards drawn this turn. | — |
| **draw** | To take cards from the draw pile into the hand. | pull |
| **play** | To put a card from the hand into effect, paying its cost. | cast, activate |
| **aim** | What a card is played at, nothing included; for a selected unit, the tiles it lights and the units it glows. | target (for a card's aim), targeting (for a card's aim), cast at, pointed at, destination |
| **aim window** | The window offering the discard pile's cards to a card aimed there. | browse (for the aim window), picker, chooser, selector |
| **being aimed** | The state of a selected card or unit while what its aim admits is offered, until it lands or is let go of. | armed, pending, targeting, in flight |
| **stock** | The city's holding of one resource: what income adds to and every cost is paid out of. | reserve, treasury, pool, supply, balance, bank |
| **cost** | What the city pays out of its stocks to play something, for example a card. | fee, charge, toll |
| **unaffordable** | What cannot be paid for: a card whose cost the city's stocks do not cover, or whose price the influence does not. | unpayable, short, lacking, too expensive |
| **discard** | To send a card from the hand to the discard pile. | throw away, dump |
| **recall** | To put a card from the discard pile into the hand; what a recall instant does. | retrieve, recover, reclaim, salvage |
| **add** | To put a new card on a pile or into the collection, or a card of the collection into a deck. | lay (for a card), put (for a card on a pile), gain (for a card), give (for a card), insert, shuffle in |
| **remove** | To take a card out of a deck, the reverse of add, or a layer off a tile. | destroy, sacrifice, trash, clear, strip |
| **single use** | A keyword on a card: played, it leaves the chronicle instead of going to the discard pile. | one-use, gone once played, consumed, exhaust, exile |
| **become** | A keyword on a card: played, it goes to the discard pile as the card it names. | flip, transform (for a card), toggle |
| **counter** | A named number a card carries in a chronicle, declared by its content and set when the card is made. | token, charge, variable |
| **draw pile** | The cards not yet drawn this cycle; refilled from the discard pile when empty. | library |
| **discard pile** | The cards played or discarded this cycle, waiting to be shuffled back. | graveyard, trash, bin |
| **browse** | A window offering a pile's cards to be read. | pile window, viewer, gallery, preview, list (of a pile) |
| **combat** | Units attacking one another: the player's by hand in play, the enemies' in the enemy phase. | battle, fight, skirmish, war |
| **income** | The phase where standing things yield. | upkeep, production phase, resolution |
| **sight** | A unit's stat and the city's own: how far it sees; a tile it reaches is in sight. | vision, line of sight |
| **elevation** | How high a terrain stands over the ground; what blocks sight, and what lifts the river layer's height. | altitude, tallness |
| **fog** | A tile seen before and out of sight now. | fog of war, shroud, dimmed, remembered |
| **charted** | A tile that has been in sight, in sight now or in fog. | explored, revealed, discovered, known, seen (of a tile's state) |
| **uncharted** | A tile never yet in sight. | unexplored, unrevealed, black, hidden |
| **instant** | A card with an immediate effect that no unit's action goes to. | spell, effect card |
| **hazard** | A card no deck holds: an event adds it to a chronicle's piles, and it strikes while held. | penalty, curse, drawback, upkeep, affliction, bane |
| **strike** | What a hazard does to the chronicle at the end of a turn it is still in the hand. | bite, trigger, proc, go off |
| **worker** | A non-fighting unit that cards are played through to change tiles: build, terraform, place an improvement. | builder, engineer, labourer |
| **population** | The city's inhabitants: assigned to tiles for income, turned into units by unit cards. | inhabitants, citizens, workforce, pops |
| **assign** | To put one population on a tile inside the border. | allocate |
| **unassign** | To take one population off the tile it stands on; the reverse of assign. | free up, release |
| **idle** | One population assigned to no tile; what a unit card takes. | unemployed, spare, unassigned (as a noun) |
| **grow** | What the city does at the growth phase: it gains one population, paid in food. | birth, breed, spawn (for population), expand |
| **growth threshold** | The food the next population costs. | step, growth cost, food cap |
| **biome** | A stretch of map the generator spreads or deals as one kind — land, sea, … — weighting the terrain of each tile in it. | patch, zone, area, ecosystem |
| **terrain** | A tile's base layer: plain, forest, hills, …; one per tile, changed only by terraforming. | tile type |
| **movement cost** | What entering a tile spends of a unit's move points; a tile that names none for a unit is not entered by it. | move cost, terrain cost, travel cost, difficulty, impassable |
| **terraform** | To change a tile's terrain into another. | transform, convert, reshape |
| **feature** | An extra on a tile, dealt by the generator or by an event's answer: a fertile plain. | bonus |
| **river** | A watercourse the generator runs along the edges between tiles, from a mountain range to the sea. | stream, creek, waterway |
| **improvement** | A layer a worker places on a tile; unlike a building, a tile holds any number. | — |
| **road** | An improvement that names its tile's movement cost outright. | path, track, highway, trail |
| **bridge** | A river edge with a road on both banks, crossed as if no river ran there. | ford, viaduct, span |
| **yield** | What a tile gives at income, resource by resource. | output, produce, harvest |
| **claim** | To take a charted tile adjacent to one the city holds into the border, for culture. | purchase, expand, annex |
| **culture** | The resource that claims tiles. | — |
| **culture threshold** | The culture the next claim costs. | claim cost, step |
| **health** | A unit's remaining life; at zero the unit is killed. | HP, hit points, hitpoints, life |
| **heal** | To bring a unit's health back up. | refresh (of health), repair, restore, regenerate, cure |
| **attack** | The act: a unit removes its damage from a target's health. | hit |
| **damage** | A unit's stat: the health its attack removes. | strength, power, harm |
| **range** | The distance, in tiles, a unit attacks over; one for melee. | reach |
| **move** | A unit's stat: the move points it refreshes to. | speed, mobility, movement points |
| **move points** | What a unit spends to cross tiles, a tile's movement cost to enter it; refreshed to its move. | movement points, steps, stamina |
| **embark** | To step a unit from the tile it stands on onto a tile beside it that embarked units enter. | board (for a unit), set sail, launch (for a unit) |
| **disembark** | To step an embarked unit back onto a tile it stands on ashore; the reverse of embark. | land (for a unit), unload, go ashore |
| **embarked** | A unit carried over water: it enters the tiles embarked units enter and no other, and attacks nothing. | aboard, afloat, at sea |
| **action** | A unit's stat and the pool it refreshes to: what it spends to attack or on a card played through it; also the kind of card a unit's action goes to. | action points, energy, attack pool |
| **refresh** | To bring a unit's spendable stat — move points, action — back to its full value; health is healed, never refreshed. | restore, replenish, reset, recharge, recover, regain |
| **military** | The resource that pays for military units, instants and fortifications. | — |
| **occupy** | What an enemy does to a tile it stands on: the tile yields nothing and is not claimable. | blockade |
| **pillage** | What some enemies do to the tile they stand on: its building or improvement is removed. | raze, loot |
| **capture** | To take the city or a camp by standing on its tile. | conquer, seize, sack |
| **reward** | What a capture deals: cards, of which the player chooses one. | gift, prize, bounty |
