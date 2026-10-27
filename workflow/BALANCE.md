# Balance findings

The balance issues met in play, kept here until the headless simulator is good enough to inform a decision on them; the balance pass rung reads this file when its turn comes, and an entry leaves when the pass settles it. An entry is what was seen, where, and the lead if there is one — no numbers proposed, no fix designed. Nothing here is a board line. The decks the pass reads on stand in `decks/`, in the content's own format: the Stone deck as it was played, the same without its scouts, and the end-of-Stone deck, the no-scouts one with its hunts and two of its gathers taken out and the tree's last cards added, so the simulator plays what was played, `npm run sim -- --civilization workflow/decks/stone.json`, and the end deck with the whole tree learned, `npm run sim -- --age stone --civilization workflow/decks/stone-end.json herbalism agriculture trapping fire irrigation domestication bow-and-arrow pottery calendar bread tanning raft megalith bartering fishing`.

## Stone Age

- **The neutral gets pummelled by the barbarians**: seen in two games out of two. Lead: a neutral that starts on desert is weak by construction, which may be the whole cause rather than the camps' strength.
- **Beast Bones**: the tools become a trophy as well, and more production.
- **Tanning's need**: two herds inside the border, to weigh. Held for v0.1.0's pass.
- **Fishing's need and the Fishery's gain**: 50 food from coast, and the gain on the coast around the Fishery, to weigh. Held for v0.1.0's pass.
- **Four improvements of one price and one gain**: Trapping, Irrigation, Pasture and Clay pit, to weigh against one another. Held for v0.1.0's pass.
