# The end-of-Stone deck

**Line:** The end-of-Stone deck — a deck of the tree's last cards, authored in `workflow/decks/` for the pass's readings. Done when `workflow/decks/stone-end.json` holds the no-scouts Stone deck without its Hunts and down to four Gathers, with Tannery, Megalith, Bread, Food trade and Goods trade added, one copy each, a cell on it with the whole tree learned lands every chronicle, and `workflow/BALANCE.md` names the three decks and the command that plays the end deck.

**Spec:** No `docs/` page. The deck, in the content's own format, is the whole content:

```json
{
  "city": { "building": "village", "sight": 2, "idle": 0, "card": "settle" },
  "settle": ["first-worker", "first-worker"],
  "cards": [
    "gather", "gather", "gather", "gather",
    "worker", "worker",
    "warrior", "warrior",
    "march", "march",
    "fire", "fire",
    "farm", "farm", "farm",
    "trapping", "clay-pit", "pasture", "irrigation",
    "heal", "heal",
    "archer", "archer",
    "tannery", "megalith", "bread", "food-trade", "goods-trade"
  ]
}
```

Written one card per line as `stone-no-scouts.json` is: the no-scouts deck's cards in its order, its two Hunt and two of its six Gather taken out, then the five added, twenty-eight cards.

`workflow/BALANCE.md`, the opening paragraph's last sentence, "The decks the findings were met with stand in `decks/`, one per age in the content's own format, so the simulator plays what was played: `npm run sim -- --civilization workflow/decks/stone.json`." becomes: "The decks the pass reads on stand in `decks/`, in the content's own format: the Stone deck as it was played, the same without its scouts, and the end-of-Stone deck, the no-scouts one with its hunts and two of its gathers taken out and the tree's last cards added, so the simulator plays what was played, `npm run sim -- --civilization workflow/decks/stone.json`, and the end deck with the whole tree learned, `npm run sim -- --age stone --civilization workflow/decks/stone-end.json herbalism agriculture trapping fire irrigation domestication bow-and-arrow pottery calendar bread tanning raft megalith bartering fishing`."

**Doc-impact:** none — the deck and the balance file are `workflow/`'s.

**Scope:** In: the deck file; the balance file's sentence; the board line deleted. Out: Hunt, and the two Gathers past four, the user's cut; Calendar, which no persona plays, science paid for nothing raising the stocks; Embark and Fishery, which no persona lands on the temperate region and which go onto the end deck when the warlord embarks, an idea; any copy past the unlock's one; any archipelago deck; any change to a persona, the simulator or the rules; any measurement beyond the smoke in Verify. Corner cases decided here: the settle section is the no-scouts deck's, two workers, so the three decks differ in their cards alone; the city section is the village as the two Stone decks hold it; the technologies the end deck is played with are named on the command, since the format carries no learned list, and the command in the balance file is the one the pass runs. Reconcile: the two Stone decks are the standing likeness, and the end deck stands beside them as a third file of the same shape; the format and the simulator's reading of it stay as they are.

**Traps:**

- The simulator checks a handed-in deck against the catalogue alone, `civilizationMisfit` in `src/rules/catalogue.ts`: a card of a technology not learned plays as written, so the learned list on the command decides only what the chronicle's achievements read and the goal flag may name.
- The record line of a file written on a handed-in deck carries the deck whole, so a file's first line is the proof the right deck ran.
- On the draft at intake the builder never played Heal, March or Bread in ten seeds: Bread trades two food for two culture, an even trade on the stocks' sum, and the builder's instant gambit fires on a rise alone. A card never played is a reading of the pass, not a defect of the deck.
- The three decks are compared seed by seed, so a cell on the end deck takes the same age, region, persona, switches and seeds as the cells on the other two.

**Plan:**

1. `workflow/decks/stone-end.json` as Spec.
2. `workflow/BALANCE.md`, the sentence as Spec.
3. The board line deleted.

**Verify:** `npm run lint` for the markdown; a smoke out of the tree, `npm run sim -- --age stone --persona builder --seeds 5 --off camps,neutral,events,capstone --civilization workflow/decks/stone-end.json herbalism agriculture trapping fire irrigation domestication bow-and-arrow pottery calendar bread tanning raft megalith bartering fishing --out <scratchpad>/stone-end.csv`, every row ending as a stop on the cap and the file's first line carrying the deck as written; no `npm run check` or `npm test`, no code changes; no spec, the line never reaches the screen; CI proves the whole Playwright suite on the push, no spec walking this path.
