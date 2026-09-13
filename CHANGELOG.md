# Changelog

Player-facing release notes. Written at a version bump, for players; never a development log, and never the source another document cites for what is. Loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
