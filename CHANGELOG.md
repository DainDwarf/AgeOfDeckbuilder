# Changelog

Player-facing release notes. Written at a version bump, for players; never a development log, and
never the source another document cites for what is. Loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
- An enemy lands on the outer ring of the map every fifth turn, advances on the city, rings the
  tile its attack is aimed at, and captures the city by standing on it through a whole turn.
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
