# Balance findings

The balance issues met in play, kept here until the headless simulator is good enough to inform a decision on them; the balance pass rung reads this file when its turn comes, and an entry leaves when the pass settles it. An entry is what was seen, where, and the lead if there is one — no numbers proposed, no fix designed. Nothing here is a board line. The decks the pass reads on stand in `decks/`, in the content's own format: the Stone deck as it was played, the same without its scouts, and the end-of-Stone deck, the no-scouts one with its hunts and two of its gathers taken out and the tree's last cards added, so the simulator plays what was played, `npm run sim -- --civilization workflow/decks/stone.json`, and the end deck with the whole tree learned, `npm run sim -- --age stone --civilization workflow/decks/stone-end.json herbalism agriculture trapping fire irrigation domestication bow-and-arrow pottery calendar bread tanning raft megalith bartering fishing`.

## Nomadic Age

- **No military but flint's**: the Warrior costs military, military comes from flint alone, and no persona walks a worker to flint, so nothing but the scout attacks before turn 10; with Lean season alone, Keep to yourself's single raider captured the city in 40 of 40 chronicles, both personas, and the Show your spears cells stick unaffordable on 12 and 13 of 20 seeds. Lead: a second source of military, or a cheaper first warrior.

## Stone Age

- **The neutral gets pummelled by the barbarians**: seen in two games out of two. Lead: a neutral that starts on desert is weak by construction, which may be the whole cause rather than the camps' strength.
- **Beast Bones**: the tools become a trophy as well, and more production.
- **Tanning's need**: two herds inside the border, to weigh. Held for v0.1.0's pass.
- **Fishing's need and the Fishery's gain**: 50 food from coast, and the gain on the coast around the Fishery, to weigh. Held for v0.1.0's pass.
- **Four improvements of one price and one gain**: Trapping, Irrigation, Pasture and Clay pit, to weigh against one another. Held for v0.1.0's pass.
- **The Flood's Settle the floodplain on a city with nothing placed**: 12 of the 13 removals in 120 whole-game chronicles, seeds 11 and 19 under both personas and all three decks; dealt on turn 5 or 14, it is the answer whose trial costs least, and the Floodplain removes the village four turns later at the median. Lead: with the city never the floodplain's, 13 to 19 of 20 chronicles stand to the cap; Dig channels at 6 production is unaffordable before turn 20 under both personas. Held for v0.1.0's pass.
- **Wildfire's Let the fields burn**: the last deal before 3 of the 34 population falls of the same 120 chronicles, four turns before at the median; its three answers never measured alone. Held for v0.1.0's pass.
- **The three trials' level**: passed in 8 of the same 120, the siege in 3 of 18 drawn, the long winter in 3 of 24, the monument in 2 of 78. Lead: Ornaments costs money, which the decks seldom raise. Held for v0.1.0's pass.
- **The technologies' goals**: each to check for whether a player going for it reaches it, on which turn, and whether it asks more than a chronicle played as usual gives; Domestication's goal, which a worker standing on one herd reaches, first among them. Held for v0.1.0's pass.
