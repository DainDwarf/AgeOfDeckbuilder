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

## Not yet read

Event answers, capstone window, tooltips, info panel rows, refusals, aim lines, chrome and launch page, ending screens, console lines.
