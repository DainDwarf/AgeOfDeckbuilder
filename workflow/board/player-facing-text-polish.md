# Player-facing text polish

The dossier of the board line **Player-facing text polish**, written surface by surface over several intake turns. Each section is the agreed table for one surface: old text beside new text per key of `src/ui/text.ts`, and the conventions chosen on the way. Nothing in it is shipped; a ship session applies the table mechanically once every surface is settled.

The nouns the reading marks for a lookup go to [`../text-references.md`](../text-references.md), not here.

The review material: the contact sheet (every entry as the screen renders it, with the lint's flags), rebuilt from the throwaway specs parked in the session scratchpad; `lint.md` beside it holds the lint in full.

## Standing calls

- A reference on a card face is written the way the **Card references** line draws it: the id in brackets, shown as the name. Written `[worker]`, read _Worker_.
- A card's kind carries the kind's rules — the board line **Card kinds explain themselves** — so a rules entry stops repeating them: a unit card does not say it takes one idle population, a settle card does not say it is played on the settle phase.
- A list the screen already shows is not kept in prose: the settle card no longer names the terrains it lands on, the aim visual does.
- **place** becomes a glossary verb (the user, 2026-09-21): to put a thing onto a tile — a unit, a building, a camp; the simplest English word for it, and the one `docs/ages/NOMADIC.md` already uses for the camp. **settle** stays a different concept, the act of the settle phase, and loses "place (the city)" from its Not-list. The glossary row ships with this line.

## Card faces

### Settle section

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `card.settle` | Settle | Settlement | A card name is content; the glossary's Not-list for **city** (settlement) binds prose, not names. |
| `rules.settle` | Settle the city on plain, forest or hills | Place the [city] | Settled. |
| `card.first-worker` | First worker | Worker | Same word as the unit card; no collision, the settle section is another part of the deck and another phase. |
| `rules.first-worker` | A worker enters on a charted tile | Place a [worker] | Settled. "charted tile" goes: the aim shows where. |
| `card.first-scout` | First scout | Scout | As above. |
| `rules.first-scout` | A scout enters on a charted tile | Place a [scout] | Settled. |

### Unit cards

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `card.worker` | Worker | Worker | Unchanged. |
| `rules.worker` | Turn one idle population into a worker | Place a [worker] | First pass (the user, 2026-09-21): the same verb as the settle card; the unit kind's tooltip says a unit card takes one idle population (**Card kinds explain themselves**). **To be felt in play** after the ship: whether the unit card reading like the settle card is right, with only the kind label telling them apart. |
| `card.warrior` / `rules.warrior` | Warrior / Turn one idle population into a warrior | Warrior / Place a [warrior] |  |
| `card.scout` / `rules.scout` | Scout / Turn one idle population into a scout | Scout / Place a [scout] |  |

### Instants

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `rules.gather` | Through a worker outside the border: gain the yield of its tile | Gain the [yield] of a [worker]'s tile | Settled. The outside-the-border rule is learned from the refusal. |
| `card.trapping` | Trapping | Trapping |  |
| `rules.trapping` | Improve forest with trapping | Place [Trapping] on [Forest] | Settled by the user. Consequence for the glossary row: **improve**'s Not-list holds "place" too; it goes, like settle's, since place is now the verb for putting a thing onto a tile. Improve stays the concept's row. |
| `card.march` / `rules.march` | March / Refresh a unit's move points | _unchanged_ | The user: all good. |
| `card.stores` | The stores | Pillage | Glossary **pillage** is what enemies do to a tile's building or improvement; a card name is content, so the name is allowed, and nothing in prose is touched. |
| `rules.stores` | Single use.\n4[food] 4[production] | _unchanged_ |  |
| `card.band-joins` | The band joins | Capture | Same: **capture** is the glossary verb for taking a site; the name is content. |
| `rules.band-joins` | Single use.\nGain one idle population | Single use.\nGain one [population] | Settled. The user reads the _Single use._ line as a banner: a note for the reward-kind idea, where the keyword may leave the text. |

### Building

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `rules.shelter` | Build the shelter. The age ends when it stands. | Win the Nomadic Age | Settled. **win** is admitted as victory's verb: the glossary row **victory** loses "win" from its Not-list and names the verb. The age is what is won; the build itself is the building kind's tooltip. |

### Hazard

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `rules.hunger` | Takes food. Not enough food kills one population | Takes {food} food | Settled as text; the number is the board line **Hunger is forged by its event**: the card's amount is fixed on the card and shown on its face, and the event forges a stronger Hunger on a later turn. Today the amount is 2 + turn/10 read at the strike, and a card face reads its rules entry with no values, so this cell lands with that line, whichever of the two ships first carrying the value path. The kill on a short stock is the card's own strike, content, not the hazard kind's rule. |

### Capstone face

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `capstone-rules.first-shelter` | Lays Shelter on top of the draw pile | Put [Shelter] on top of the draw pile | Settled. Carried forward to the events turn: Share's "Lays Hunger on top of the draw pile" takes the same verb. |

### Glossary changes this surface decided

- **place**: new row, to put a thing onto a tile; **settle** and **improve** lose "place" from their Not-lists.
- **win**: the verb of **victory**; the row loses "win" from its Not-list.

Card faces: settled, 2026-09-21.

## Event answers

Read against the lore pitches the user gave for the **Events carry lore** line (`events-carry-lore.md`): the answers are written to read under that text.

### Standing calls for the answer faces

- **Answers address the player**: "your [city]", "Pay X". The card rules stay impersonal.
- **An answer's cost reads in its text, not in a chip** (the user, 2026-09-21): "Pay X [culture]" on Keep them, "Pay X [production]" on Cut a firebreak, and the cost chip leaves the answer face. The rules are untouched: the cost is still paid, an unaffordable answer is still drawn as one and still refused with its reason. The number is read into the entry the way `{warriors}` is. **Doc-impact:** `docs/CHRONICLE-SCREEN.md`'s deal-window paragraph says an answer's card reads "the stock it costs where it costs one"; it says the cost reads in the text instead.
- **No "raid" on a face**: the answers name what comes, "X [Warrior] …", and the design pages keep the word raid.

### Departure

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `answer-rules.let-them-go` | One population leaves the city, idle first | Lose one [population] | Settled. |
| `answer-rules.keep-them` | They stay | Pay {culture} [culture] | Settled. The cost chip leaves the face. |

### The herd

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `answer-rules.hunt-it` | Gain {food} [food] | _unchanged_ | The user: good as is. |
| `answer-rules.follow-it` | Deals game onto a forest tile near the city and charts it | One [forest] gains [Wildlife] | Settled. **The feature is renamed Wildlife** (the user, 2026-09-21): "game" collides with the game itself. The rename is content and id both, `feature.game` → `feature.wildlife` and the catalogue's id, since a code identifier carries the term too. **Doc-impact:** `docs/ages/NOMADIC.md`'s land table and its Follow it sentence. |

### Lean season

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `answer.share` | Share | Share food | Settled. |
| `answer-rules.share` | Lays Hunger on top of the draw pile | Put [Hunger] on top of the draw pile | Settled; the capstone's verb. |
| `answer.ration` | Ration | Keep to yourself | Settled. |
| `answer-rules.ration` | A raid of {warriors} enters the map | {warriors} [Warrior] attack your [city] | Settled; one entry per count, see _The attack verb_. |

### A rival band

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `answer.fight` | Fight | Fight them | Settled. The glossary exception on "fight" carries over, with its comment. |
| `answer-rules.fight` | A raid of {warriors} enters the map | {warriors} [Warrior] attack your [city] | Settled; one entry per count, see _The attack verb_. Fight's count is never one. |
| `answer-rules.make-room` | A camp is placed near the city, and a raid of {warriors} enters on and around it | A camp with {warriors} [Warrior] is placed near your [city] | Settled. Fixes the guards-versus-raid contradiction. Eleven words against the old twenty-three, which wrapped to three lines: two lines expected. |

### Wildfire

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `answer-rules.let-it-burn` | A fire starts in a forest near the city and burns the forest around it to plain: {tiles} tiles, {population} population killed, {units} of your units take {damage} damage | {tiles} [forest] burn into [plain]: {population} [population] killed, {units} [unit] damaged | Settled, to be felt in play. The damage amount goes; the count is what the answer weighs. Seven lines today; three or four expected. `{damage}` is no longer read. |
| `answer-rules.firebreak` | The forest stands | Pay {production} [production] | Settled. The cost chip leaves the face. |

### The attack verb

**attack**, the glossary's own word for the act: it says what a raider does, and the map shows the approach. **A reference is never pluralised** (the user, 2026-09-21): "3 [Warrior]" reads as a count of the thing the mark names, the way card games write it, so no plural form exists beside a name. The verb still agrees, and the count is 1 on the early turns of Keep to yourself and Make room (raiders(turn) = 1 + turn/10), so each attack answer is **two entries chosen by the count**, one sentence each: _One [Warrior] attacks your [city]_ and _{warriors} [Warrior] attack your [city]_.

### Capstone window

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `capstone.title` | The age ends on this capstone. | Pass the capstone to win the Nomadic Age | Settled. |

Event answers and the capstone window: settled, 2026-09-21.

## Tooltips

The thirteen `tooltip.*` entries: the six unit stats of the unit panel and the seven stocks of the resource bar. The resource bar itself, the user: all good.

### Standing calls for the tooltips

- **No trailing period**, the same as the card texts. A period between two sentences stays (`tooltip.population`).
- **The lore leaves the resource tooltips**: "The most basic need.", "A sad necessity." and the like go; a tooltip says what the stock does.
- **A resource tooltip states the stock's role in the game, not in the age**: money and science keep "Trade it for other goods" and "Manipulate your cards" though the Nomadic Age has neither. The lint's flag on the two closes as accepted.
- **No noun marked** for a lookup on this surface: a tooltip is where a lookup lands.

### Unit stats

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `tooltip.health` | What the unit has left before it is killed. | Unit is killed when it reaches 0 | Settled. **killed** is the glossary's word. |
| `tooltip.damage` | The health this unit's attack removes. | The health this unit's attack removes | The user: ok; the period goes. |
| `tooltip.range` | The distance, in tiles, this unit attacks over. | The distance this unit attacks over | Settled. |
| `tooltip.move` | The tiles this unit can still cross this turn, over its move. | How much this unit can move | Settled. Closes the lint's defect: the old text counted tiles where the reading is move points. |
| `tooltip.action` | The action this unit can still spend this turn, over its action. | How many actions this unit can do each turn | Settled. |
| `tooltip.sight` | The distance, in tiles, this unit sees over the ground. | The distance this unit sees over | Settled. |

### Resources

| Key | Old | New | Notes |
| --- | --- | --- | --- |
| `tooltip.food` | The most basic need. Grows your population toward the growth threshold. | Grows your population if you reach the threshold | Settled. Closes the lint's defect: the stock reaches the threshold, and the sentence now says so. "Threshold" is a shortening of **growth threshold** its Not-list does not refuse. |
| `tooltip.production` | Materials of every sort. Build, improve, and shape the land. | Build, improve, and shape the land | **Open.** The user's wording keeps the old verb, and "shape the land" is the concept **terraform** in other words; the row's Not-list already refuses "reshape", and a tooltip is prose. Recommended: _Build, improve, and terraform_, the concept's own word. The alternative is a glossary exception for this tooltip, the second after "fight". |
| `tooltip.military` | A sad necessity. Defend and attack. | Defend and attack | Settled. |
| `tooltip.money` | Exchange and opulence. Trade it for other goods, or amass it. | Trade it for other goods | Settled. |
| `tooltip.science` | The never-ending ingenuity of humanity. Draw, discard, and manipulate your cards. | Manipulate your cards | Settled. |
| `tooltip.culture` | What the city creates and believes. Claims tiles, pushing the border out. | Claims more tiles for your city | Settled. **claim** is the glossary's verb. |
| `tooltip.population` | Idle population. Assign to tile or turn into units. | Idle population. Assign to tile or turn into units | The user: already good; the trailing period goes. |

Tooltips: settled, 2026-09-21, the production cell open on one word.

## Not yet read

Info panel rows, refusals, aim lines, chrome and launch page, ending screens, console lines.
