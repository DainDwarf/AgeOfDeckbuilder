# Changelog

Player-facing release notes. Written at a version bump, for players; never a development log, and
never the source another document cites for what is. Loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.0.2] - 2026-09-05

The city is a city: its population grows, works the land, and pushes the border outwards, on a
map with mountains, coasts and rivers. Every chronicle still ends in defeat.

### Added

- Population grows. Food that reaches the growth threshold is spent on a new inhabitant, who
  arrives idle; the threshold widens as the city grows. Nobody eats and nobody starves.
- Assignment. Only a tile an inhabitant stands on yields at income, the city's own tile
  included. The founding puts one on each of the seven tiles the city holds and keeps two idle.
  PH_Worker and PH_Warrior now take an idle inhabitant, and are refused when none is idle or when
  it would be the city's last.
- Claiming. Spend culture to take a tile touching the border; the cost rises with the tiles
  owned. A claimed tile is worked at once when someone is idle.
- City mode, on the C key or by clicking the culture or population reading. An accent lines the
  map and a chip names the mode. In it, a click on a held tile assigns or unassigns, a click
  beyond the border claims, and every tile inside the border shows what it yields. A refused click
  says why, over the tile.
- The yield overlay, on the Tab key. Every tile shows a glyph for each point of each resource it
  gives. Click a reading in the bar to show one resource at a time, several together, or all.
- Tiles have four layers: terrain, a feature, improvements and a building. Fertile plains appear
  at generation. Two new cards: PH_Mine lays a mine on hills a worker stands on, PH_Urbanisation
  turns the plain under a worker into urban ground, wherever the worker stands.
- Maps are dealt in biomes with mountains, coast, deep water and hills where a range or a sea
  meets the land. Mountains cannot be entered, like water.
- Rivers run along the edges between tiles, from a mountain range down to the sea. A plain or a
  forest a river runs along gives one more food.
- Selecting and inspecting are two steps. A left click selects a tile and rings it; the I key
  steps through its cards: the unit, the building with the improvements, and the terrain with its
  feature and river, each row with what it gives. A right click selects and inspects in one press.
- The resource bar reads population as idle over all, food as stock over the growth threshold,
  and its readings and Menu button never overlap, whatever font the browser uses.
- Two new controls in Settings, the city key and the inspection key, rebindable like the rest.

### Changed

- The back key steps out of inspection, then selection, then city mode, before it opens the menu.
  Right click is no longer a back key.

## [0.0.1] - 2026-09-03

The first chronicle you can play: found a city, hold it as long as you can, and watch it fall.
Every chronicle ends in defeat — victory does not exist yet.

### Added

- A hexagonal map generated fresh for every chronicle — plain, forest, hills, water — with the
  city at its middle, holding its own tile and the six around it.
- A stand-in deck holding copies of five kinds of card: PH_Worker and PH_Warrior turn population
  into a unit, PH_Farm builds a farm, PH_March moves a unit and lets it act where it lands,
  PH_Harvest gains 2 food.
- A hand of five, drawn at the founding and drawn back up at the end of every turn; the discard
  pile is shuffled into a draw pile that has emptied.
- Drag a card up out of the hand to play it and pay its cost. A card that needs a target is then
  aimed at a tile, or at a unit and the tile it goes to.
- A card the rules refuse answers with every reason: what the city cannot pay, and what stands in
  the way.
- End the turn and the steps that follow play out one at a time: discard, combat, income, the
  enemies moving and declaring their intents, then the next turn's draw.
- An enemy lands on the rim of the map every fifth turn, advances on the city, rings the tile its
  attack is aimed at, and captures the city by standing on it through a whole turn.
- The defeat screen, naming what took the city and the turn it fell on.
- Click a tile to read it layer by layer — the unit standing on it, the building, the terrain —
  each on a card of its own, with what it yields at income or the unit's health, damage, range and
  move.
- The resource bar: food, production, military, money, science, culture and population, each
  explained by a tooltip.
- Browse the draw pile and the discard pile, and click any card to read it large.
- Pan the map by dragging it, or with W A S D and the arrow keys; zoom with the wheel.
- A menu with New chronicle and Settings, and under Settings the Controls: every key rebound to
  your liking and kept for the next time you play.
- Escape and right click back out one step — an aimed card, a window, a tile you were reading —
  and open the menu when there is nothing left to back out of.
- Everything is drawn as flat placeholder shapes. No art, no sound and no music yet.
