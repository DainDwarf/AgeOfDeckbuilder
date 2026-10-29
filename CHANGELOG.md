# Changelog

Player-facing release notes. Written at a version bump, for players; never a development log, and never the source another document cites for what is. Loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.0.5] - 2026-10-29

The meta. A chronicle now pays into a campaign: the achievements it reaches learn technologies, which unlock cards, a region, your city's building and the next age, and the influence it earns buys more copies of the cards you own. The Stone Age is the second age, the one the Nomadic victory unlocks, where the economy comes home. Every number is provisional; the balance pass waits for the demo.

### Added

- The campaign. The game boots on the campaign screen, which shows the technology tree across the ages. Each technology is learned by one achievement reached in a chronicle and needs the ones before it; its plate reads its goal and its reward. A learned technology is checked, an available one reads its goal and its reward, and one that needs more reads ??? alone. Click an available technology to pin it: while a chronicle can reach its achievement, that achievement stands in the chronicle's top-left corner with its count, and sinks once reached.
- The ending pays. When a chronicle ends, victory or defeat alike, the technologies of the achievements it reached are learned, the cards they unlock join the collection, and their influence is paid, along with the influence of the trophies and challenges still in it: a trophy pays on any ending, a challenge on victory alone. The ending screen reads the ledger, a struck-through row for a challenge lost to a defeat, and End chronicle opens the campaign.
- Influence, the meta-currency, read on the bar of every meta screen, and worn at the foot of every card that gains it.
- The collection screen. Every card you own stands as a stack of its copies with its price under it; a press buys one more copy for influence, the price doubling with every copy owned. Open a civilization's deck beside the collection and add a card to it with a press or a drag, or remove one; settle cards go to the settle section. Open the civilization alone to read the whole deck as stacks, a button to add and one to remove under each.
- A civilization is a city section and a deck. The city section holds your city's building, how far it sees, the population it opens with, and the card that settles it; the deck is what the collection screen edits. One civilization so far, the Nomadic.
- The launch screen. Choose the age on the time arrow, the region among clusters of hexagons drawn in its terrains' colours, the civilization among piles of cards. Continue reads where the chronicle in progress stands and what it has earned, and opens it where it stood; Launch warns first when it would end a chronicle that has earned something. A right click on a pile browses its cards.
- Save and resume. The game saves by itself after every move and boots on the save; a chronicle in progress waits for Continue, and the menu's Campaign leaves it standing. Manage Save on the menu exports the save as a file, imports one and clears it, each behind a warning; the game says so once when the browser refuses to keep the save.
- The navbar down the left edge of every meta screen: Campaign, Chronicle and Collection.
- The Stone Age, the second age: the village, your city's building from the Nomadic victory on, gives military and culture; fifteen technologies to learn, each by a goal of its own — Herbalism, Agriculture, Trapping, Fire, Irrigation, Domestication, Bow and arrow, Pottery, Calendar, Bread, Tanning, Raft, Megalith, Bartering and Fishing — and its victory, Metalworking, whose age is still to come.
- The Stone Age's cards. Four buildings built through a worker inside the border, each taking production every turn as its upkeep: Farm on plain for food, Tannery on deer or cattle for money, Megalith for culture, Fishery on coast through an embarked worker, giving food to the coast tiles around it. Four improvements placed through a worker wherever it stands: Trapping on deer, Pasture on cattle, Irrigation on a river bank, Clay pit on hills. Six instants: Fire discards another card of the hand for science, Heal brings a unit inside the border back to full health, Calendar shows the turn of the next event, Bread turns food into culture, Food trade and Goods trade turn money into food or production. Archer, a unit that attacks over a range. Embark steps a unit onto the coast and becomes Disembark, which steps it back ashore.
- Upkeep. A city pays at income for the buildings it keeps, out of what its tiles yielded. A stock taken past nothing, by the upkeep or by a strike, costs one population for each stock so taken.
- Embarked units. A unit on the water keeps its health and its sight, moves slowly, attacks nothing and is attacked only from range. Enemies embark on their way too.
- Two Stone Age regions. Temperate, the band's land on a bigger disc with a desert on it, whose oases are the only food in it; Archipelago, unlocked by Raft, islands in a sea with no river and no desert. The Stone Age's camps stand across the water.
- The neutral, in every Stone Age region: a second city with a village, a border, population, stocks and units of its own. It works its land, claims tiles, enters warriors, archers and workers, builds farms and improvements, and sends its warriors at the camps. At peace its units never attack yours and neither side crosses the other's tiles; a step onto its land or an attack on its unit declares war, after a warning, and from then on its units are enemies that go for your city. Its city falls to a unit of yours standing on it through the enemy phase, and deals one of three trophies: Capture, Their land or Their stores. The enemies capture it too, and a camp stands where it stood.
- Three sites, in both ages: the painted cave, the old cairn and the bones of a great beast, each captured once by standing on it. In the Nomadic Age each deals one trophy, culture once. In the Stone Age each deals a choice of two: Cave paintings or Old stories, Honour the dead or Dig the graves, Bone carvings or Bone tools.
- Challenges, a kind of card an answer may deal. It is played by nothing and cycles to the ending; it may strike at the end of every turn it stays in the hand, and kept to a victory it pays its influence.
- Trophies, the kind a capture deals: played, its effect lands and the card is banished; kept to the ending, it pays its influence.
- The Stone Age's events. Flood: lose the fields, settle the floodplain for a challenge that keeps taking them, or dig channels for production.
- Bad air and angry spirits: bury the dead, live with the sickness for a challenge, or help the healers for science.
- Strangers: take them in, population now and a challenge that takes culture, or refuse them.
- Predators: abandon a herd, let the farmers handle the wolves for a challenge that kills, or defend the herds for military.
- Drought: a rain dance for a challenge that dries the land into desert, rationing for food, or buy grain for money.
- Travellers: trade with them for money or share stories for culture.
- A grievance: the neutral demands amends. Escalate and declare war, or a camp beside you where it has none; pay tribute for a challenge that takes food and production; or send gifts for culture.
- Wildfire, in the Stone Age, has a third answer: burn the forest for a challenge that burns it tile by tile.
- Departure is the Stone Age's now, and Keep them costs culture.
- Three Stone Age capstones, one drawn at the opening. The long winter adds Cold night to the discard pile, several copies, and the land stops feeding until every one is paid. The monument adds Foundations, the first of three buildings built one over the other while a hazard lands every turn; the monument standing is victory and one of its buildings removed is defeat. The siege enters a raid led by a leader, whose band hits harder beside it; the leader killed is victory.
- Stone Age camps enter warriors and archers, and a new script walks out of them: the pillager goes for your workers and what you built, and stands on an improvement or a building to pillage it at the next enemy phase. Once enough guards gather, some leave together as a raid.
- An enemy that prepares a capture or a pillage shows it: its tile wears the enemy's colour and its card reads Capturing or Pillaging.
- The exhaust pile, a tab at the screen's right edge. A building card played goes there instead of cycling, so the copies your deck holds are how many of that building you build. A right click browses it.
- A right click on any pile opens its browse: every card as a stack of its copies, in the collection's order, so the draw order is given away to nobody.
- The resource bar reads, after each stock, what ending the turn now would do to it, in the colour of a stock taken past nothing where the end of turn would.
- A city's own tile wears a badge reading its population.
- A unit of yours attacks only a unit on a tile in sight, and an enemy only one its own sight reaches.
- Two settings under Controls: which way the wheel zooms, and which way it scrolls. The keys that pan up and down scroll panels and browses too.
- The debug console holds seed, which reads the chronicle's seed or launches on one, and unit, which enters a unit on the selected tile.

### Changed

- The Nomadic Age is the tutorial. Its hearth gives nothing on top of its terrain, so flint is the only military and the sites the only culture, and the age pays influence once, for its victory. Lean season's Share food puts Hunger on top of the draw pile and Keep to yourself brings the envious as a raid; Make room places a camp with its guards on and around it; Follow it charts the tile the herd went to.
- Pillage and Capture are trophies: played, they are banished.
- Events land after the draw, so the turn opens on its hand every time.
- Strikes come after income and before growth, so a strike never takes the person the same turn's growth made.
- Gather gains whatever the tile yields.
- Eight kinds of card: settle, building, unit, action, instant, hazard, trophy and challenge. A card played is exhausted, banished or discarded as its kind or its keyword says.
- A raid enters through one door: a camp still standing, or the map's edge, embarked where that edge is coast. A camp that has just entered an enemy waits before it rolls again.
- A captured camp's rewards stand in the deal window under the camp's lore, each capture's in turn.
- The capstone's window is raised twice, at the opening and at the landing; a left click on its card closes it.
- The menu lists Manage Save, Settings and Campaign; New chronicle is gone, the launch screen is where a chronicle starts.
- A press on a scrim is one step back: it takes down a card shown large, drops a window's selection, closes the window, and never opens the menu. Under a scrim the screen hears no key, and the wheel scrolls what scrolls on it.
- A press is held by the button that landed it, and only that button's release lets it go.

### Removed

- The launch page and its address. The address names continue alone, to open the chronicle in progress; the seed is read and set from the console.

## [0.0.4] - 2026-09-24

The first real age. The stand-in deck gives way to the Nomadic Age: a band that stops wandering, settles where it chooses, and wins the age by building its first shelter. Every number in it is provisional.

### Added

- The Nomadic Age, the first age of the game, with a deck, events, a capstone and a land of its own. Four resources are in play: food, production, military and culture.
- The settle phase. A chronicle opens before its first turn with the middle of the map in sight and three settle cards in hand: Settlement places the city on plain, forest or hills, and Worker and Scout place the band's first units, taking no population. The phase ends as a turn does, once the city stands; the map's frame, a chip and the end-turn button show it in a colour of its own.
- The scout, a unit that sees far, moves far and is weak.
- Gather, the most common card in the deck: played through a worker outside the border, it gains the yield of the tile the worker stands on. Inside the border it is refused.
- Trapping, placed by a worker on forest, gives food. Two new features: wildlife on forest, flint on hills.
- Five events, each dealt with two answers. Lean season lays Hunger on the draw pile or brings enemies to the city; a rival band attacks or places a new camp near the city; Wildfire burns forest into plain unless you pay production; Departure takes one population unless you pay culture; the herd, rarer, gives food or wildlife near the city. Every event carries lore, a few lines saying what is happening to the city, and so do a camp's capture and the capstone.
- The first shelter, the age's capstone. Its card is shown when the chronicle opens; when it lands it puts Shelter on top of the draw pile, and the chronicle is won the moment a worker builds it.
- Every camp opens with an enemy on it that keeps the camp, and the camp may enter another at each enemy phase.
- A captured camp deals two rewards and you choose one: Pillage, food and production, or Capture, one population. Both are single use.
- Names in brackets on a card. Rest the pointer on one to see the thing it names as a small card; right-click it to show it large. Cards shown large stack, up to twelve.
- A card's kind label says what the kind is when the pointer rests on it.
- Changes on the map play out: a terrain changes before your eyes, marks come and go, a tile just charted fades in, and a unit hurt or killed by no attacker bumps or shrinks.
- A unit with no move points and no action left is dimmed.
- The pointer is a hand over whatever a click presses.
- A launch page choosing the content, region, schedule, deck and seed. The address keeps the choices, so a reload replays the chronicle.
- A page saying the game could not start, with the error's own words, in place of a blank screen.

### Changed

- The city holds only its own tile when it settles, with one population on it; every other tile is claimed. The culture threshold is twice the tiles the city holds.
- The growth threshold is twice the population and your units on the map counted together, and growth now comes before income.
- The city gives military and culture, and nothing else on the map yields military.
- An attack, or a card played through a worker, spends the move points the unit has left: move first, then act.
- An event is one problem dealt with its answers, instead of two events to choose between, and events come less often.
- Hunger takes the food written on it, more on a later turn, and kills one population when the stock cannot cover it. Pay its production cost to be rid of it.
- An event's enemies enter together through one door: a camp still standing, or the map's outer ring. Capturing every camp no longer ends the raids.
- Victory comes the moment the capstone's condition holds, even in the middle of a play.
- The map is larger. Its middle is plain, forest and hills, with the water and the mountains further out, and forest also gathers in woodlands.
- A tile's feature and improvements stand in one row above its middle.
- Enemies seen in the fog are forgotten when the turn ends, since they have moved.
- The resource bar reads culture as the stock over the culture threshold, and population as the idle alone. Culture and idle fill in the accent while city mode has a claim or an assignment waiting.

### Removed

- The stand-in deck and everything that only it held: PH_Farm, PH_Harvest, PH_Mine, PH_Road, PH_Urbanisation, PH_Recall, PH_Spoils, the raid and famine events, urban ground and the PH_Siege capstone. No card places a road any more.

### Fixed

- The end-turn button reads End turn again when the turn's play-out ends under a pointer that never moved.
- A card, a unit or a population being dragged comes home when a window rises over it, instead of landing under the window.
- A pan dragged across the Menu button carries on instead of opening the menu.
- A small card or a kind label's bubble raised in a window follows the window as it scrolls.

## [0.0.3] - 2026-09-13

A chronicle that ends in victory: the age throws events at the city, the enemy comes from camps on a map you have to scout, and the capstone, announced at the founding, lands on a turn you never learn. Hold the city through its siege and the chronicle ends in victory instead of defeat.

### Added

- Victory. The chronicle opens on a window showing the capstone's card, the trial that ends the age; it says nothing of the turn it lands on. PH_Siege raises five camps around the city and puts a warrior on each; over the five turns that follow every free camp sends another. A city still standing at the end of the sixth turn wins the chronicle, and the victory screen names the turn.
- Events. From turn five or so, and every few turns after, the events phase deals two events and stops the turn on a window offering both as cards; take one and the turn plays out. The stand-in schedule holds a raid, which enters warriors, and a famine, which lays PH_Hunger on the draw pile. Which events can land shifts with the turn: the harshest wait.
- Hazards, a fourth kind of card. PH_Hunger sits in no deck; a famine puts it in your hand, and at the end of any turn it is still there it empties the food stock. Play it, at its cost, to be rid of it; otherwise it cycles back around with the rest of the hand.
- Camps. Three stand on every map, uncharted until a unit sees them, drawn as a wall in the enemy's red. Every enemy enters the map on a free camp; a chronicle whose camps are all captured sees no more raids. Stand any unit on a camp through the enemy phase to capture it: the camp leaves the map and PH_Spoils, a single-use card gaining ten of every resource but culture, lands in the discard pile. A camp cannot be claimed while it stands.
- Sight and fog. Every unit has a sight stat and the city a sight of its own. A tile in sight is drawn live, a tile seen before is drawn darkened as it was last seen, and a tile never seen is not drawn at all. Forests and hills block the line beyond them; a unit on hills sees over forest. Your units cannot be sent onto uncharted ground, and the city claims only what it has seen. The yield overlay and the inspection read the map as you know it.
- Terrain costs move points. Plain and urban cost one, forest and hills two; a unit enters a tile only when its points cover it in full, and what is left over waits for the next turn. Crossing a river spends every point the unit has left. The terrain card reads the cost in its corner.
- PH_Road, laid by a worker: a roaded tile costs half a move point whatever lies under it, and a river with a road on both banks is a bridge. Enemies use your roads too.
- PH_Recall, aimed at the discard pile: the pile opens as a window and the card you press comes back to the hand.
- Cards are selected by click. A left click selects a card of the hand; a second click plays it, or shows why it cannot be played, and a card that needs a target shows its ring pointing at the map with a line over the hand naming what it is played at. A right click shows any card large, in the hand, in a browse or in a window, and the same rule holds for tiles: a right click inspects and never selects. A browsed card can be selected and ringed like any other.
- City mode selects, then acts. A click selects a tile as anywhere else; a second click on it assigns, unassigns or claims. A claimable tile wears its culture cost on the tile itself. Drag an inhabitant's diamond from its tile to another held tile to move it there in one gesture. Clicking the city's tile twice enters city mode.
- Controls bind to the physical key, so a control keeps working when the layout changes the letter, and any key can be bound, one that prints nothing included. The bindings you kept from before come back as the defaults once.
- A debug console on the key above Tab, for now: type `uncharted` or `fog` to switch off either layer that hides the map.

### Changed

- Enemies no longer declare where they will strike. In the enemy phase each one moves and then attacks a unit in its range, one attack per action point, at once.
- The famine no longer empties the food stock itself; it deals PH_Hunger instead.
- A worker attacks nothing, whatever its damage, and lights no target; a warrior can play none of a worker's cards. A worker spends one action on every card played through it and holds one a turn.
- A card aimed at a tile is refused at the tile, not in the hand: a payable card can always be aimed, and the tile you press says why it is refused.
- The aim window has no Cancel button. A press beside its cards or the back key closes it with nothing paid, and the card stays selected in the hand.
- The back key now walks the window or the large card, then the inspection, then the selection, then city mode, before it opens the menu.
- Move numbers are counted in hundredths of a move point under the hood; the unit card still reads whole and half points.

### Fixed

- Text on a rotated card no longer tears into strips on some graphics setups.
- The selection ring is no longer darkened by fog, by city mode's marks or by the yield overlay's dim.

## [0.0.2] - 2026-09-05

The city is a city: its population grows, works the land, and pushes the border outwards, on a map with mountains, coasts and rivers. Every chronicle still ends in defeat.

### Added

- Population grows. Food that reaches the growth threshold is spent on a new inhabitant, who arrives idle; the threshold widens as the city grows. Nobody eats and nobody starves.
- Assignment. Only a tile an inhabitant stands on yields at income, the city's own tile included. The founding puts one on each of the seven tiles the city holds and keeps two idle. PH_Worker and PH_Warrior now take an idle inhabitant, and are refused when none is idle or when it would be the city's last.
- Claiming. Spend culture to take a tile touching the border; the cost rises with the tiles owned. A claimed tile is worked at once when someone is idle.
- City mode, on the C key or by clicking the culture or population reading. An accent lines the map and a chip names the mode. In it, a click on a held tile assigns or unassigns, a click beyond the border claims, and every tile inside the border shows what it yields. A refused click says why, over the tile.
- The yield overlay, on the Tab key. Every tile shows a glyph for each point of each resource it gives. Click a reading in the bar to show one resource at a time, several together, or all.
- Tiles have four layers: terrain, a feature, improvements and a building. Fertile plains appear at generation. Two new cards: PH_Mine lays a mine on hills a worker stands on, PH_Urbanisation turns the plain under a worker into urban ground, wherever the worker stands.
- Maps are dealt in biomes with mountains, coast, deep water and hills where a range or a sea meets the land. Mountains cannot be entered, like water.
- Rivers run along the edges between tiles, from a mountain range down to the sea. A plain or a forest a river runs along gives one more food.
- Selecting and inspecting are two steps. A left click selects a tile and rings it; the I key steps through its cards: the unit, the building with the improvements, and the terrain with its feature and river, each row with what it gives. A right click selects and inspects in one press.
- The resource bar reads population as idle over all, food as stock over the growth threshold, and its readings and Menu button never overlap, whatever font the browser uses.
- Two new controls in Settings, the city key and the inspection key, rebindable like the rest.

### Changed

- The back key steps out of inspection, then selection, then city mode, before it opens the menu. Right click is no longer a back key.

## [0.0.1] - 2026-09-03

The first chronicle you can play: found a city, hold it as long as you can, and watch it fall. Every chronicle ends in defeat — victory does not exist yet.

### Added

- A hexagonal map generated fresh for every chronicle — plain, forest, hills, water — with the city at its middle, holding its own tile and the six around it.
- A stand-in deck holding copies of five kinds of card: PH_Worker and PH_Warrior turn population into a unit, PH_Farm builds a farm, PH_March moves a unit and lets it act where it lands, PH_Harvest gains 2 food.
- A hand of five, drawn at the founding and drawn back up at the end of every turn; the discard pile is shuffled into a draw pile that has emptied.
- Drag a card up out of the hand to play it and pay its cost. A card that needs a target is then aimed at a tile, or at a unit and the tile it goes to.
- A card the rules refuse answers with every reason: what the city cannot pay, and what stands in the way.
- End the turn and the steps that follow play out one at a time: discard, combat, income, the enemies moving and declaring their intents, then the next turn's draw.
- An enemy lands on the rim of the map every fifth turn, advances on the city, rings the tile its attack is aimed at, and captures the city by standing on it through a whole turn.
- The defeat screen, naming what took the city and the turn it fell on.
- Click a tile to read it layer by layer — the unit standing on it, the building, the terrain — each on a card of its own, with what it yields at income or the unit's health, damage, range and move.
- The resource bar: food, production, military, money, science, culture and population, each explained by a tooltip.
- Browse the draw pile and the discard pile, and click any card to read it large.
- Pan the map by dragging it, or with W A S D and the arrow keys; zoom with the wheel.
- A menu with New chronicle and Settings, and under Settings the Controls: every key rebound to your liking and kept for the next time you play.
- Escape and right click back out one step — an aimed card, a window, a tile you were reading — and open the menu when there is nothing left to back out of.
- Everything is drawn as flat placeholder shapes. No art, no sound and no music yet.
