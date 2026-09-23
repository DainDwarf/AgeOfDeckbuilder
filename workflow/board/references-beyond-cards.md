# References beyond cards

**Line:** **References beyond cards** — a name in a rules entry names a terrain, a feature, an improvement, a building or a unit kind as it names a card, marked by its kind and id and drawn as its name in brackets, and answers the rest and the right click a card's name does, small and large as the card the infopanel reads that thing by, a unit kind's mark in the colour of the faction the mark names; `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md` say so, the catalogues' coherence tests refuse a name that resolves to nothing of theirs, and `e2e/reference.spec.ts` proves the settle card's name at the chronicle's opening. Doc-impact: `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Spec:** `docs/INTERFACE.md` _The presses_, the names paragraph; `docs/CHRONICLE-SCREEN.md` _The chronicle screen_, _The veils and the infopanel_, the infopanel paragraph.

The rule in one sentence: a name in a card's text is a card, a terrain, a feature, an improvement, a building or a unit kind, and whatever it names, the name behaves as a card's name does today — the rest raises it small, the right click shows it large or stands it on top of the stack, the small card answers the right click — the only difference being what is drawn: a card is drawn as its face, everything else as the card the infopanel would show it by.

`docs/INTERFACE.md`, _The presses_, the paragraph beginning "**A card named in a card's text stands in brackets**" becomes, in full:

> **A thing named in a card's text stands in brackets** — a card, a terrain, a feature, an improvement, a building or a unit kind — and answers two presses wherever the card it stands on answers any. The pointer resting on it shows the named thing small above it, centred on the name, as a card lies in the hand, after the rest a tooltip waits for: a card as its face, anything else as the card the infopanel reads it by. A small card is a card face, so a name on it shows its own small card the same way, and a small card stays up while the pointer is on it, on the name that raised it or on a small card raised from it, and goes down with those raised from it once the pointer is on none of them. A right click on a name shows the named thing large; while a card stands large, a right click on a name — on that card, or on a small card raised from it — stands the named thing over it, on top of the stack, a new copy whether or not it stands in it already. Each card beneath the newest peeks out by a thin band, up and to the left, and the stack stands centred as the one card does, so a deep one covers the resource bar; a stack holds twelve, and once twelve stand a right click on a name adds nothing, the rest on it still raising its small card. Only the newest card's names answer a press or a rest. A left click on a name is the card's own, and a small card answers the right click as the name that raised it does, and no other press.

The cursor paragraph above it stands as it is: a name and a small card show the hand, whatever they name.

`docs/CHRONICLE-SCREEN.md`, _The veils and the infopanel_, appended to the paragraph beginning "An inspected tile shows one card in the infopanel per step":

> A name on a card that names a terrain, a feature, an improvement, a building or a unit kind shows that thing as one of these cards, small at a rest and large at a right click, drawn at the size it is shown at: headed by the thing named, with its one row and what it gives at income, the terrain's movement cost in its corner and no other card's; a unit kind's card reads the kind's stats as a unit fresh of it reads them, full over full, its mark in the colour of the faction the card's text names it for. Its rows raise no tooltip.

`docs/GLOSSARY.md`: no row changes. "Name", "small card", "row" and "unit kind" stay plain words.

Player-facing text. A reference is marked `[<kind>:<id>]` in a `rules.`, `answer-rules.` or `capstone-rules.` entry, beside the resource glyph's `[<resource>]`; `card` marks a card, `terrain`, `feature`, `improvement` and `building` the thing a tile is made of, and `player` or `enemy` a unit kind painted for that faction. The name drawn is the thing's own entry — `card.<id>`, `terrain.<id>`, `feature.<id>`, `improvement.<id>`, `building.<id>`, and `unit.<id>` for either faction — in square brackets, in the run's ink. The entries, as they read after this line, the rest of `src/ui/text.ts` untouched:

| Entry | Reads |
| --- | --- |
| `rules.settle` | `Place the [building:city]` |
| `rules.first-worker` | `Place a [player:worker]` |
| `rules.first-scout` | `Place a [player:scout]` |
| `rules.worker` | `Place a [player:worker]` |
| `rules.warrior` | `Place a [player:warrior]` |
| `rules.scout` | `Place a [player:scout]` |
| `rules.gather` | `Gain the yield of a [player:worker]'s tile` |
| `rules.trapping` | `Place [improvement:trapping] on [terrain:forest]` |
| `answer-rules.ration` | `Your [building:city] is attacked by {warriors} [enemy:warrior]` |
| `answer-rules.fight` | `Your [building:city] is attacked by {warriors} [enemy:warrior]` |
| `answer-rules.make-room` | `A [building:camp] with {warriors} [enemy:warrior] is placed near your [building:city]` |
| `answer-rules.follow-it` | `One [terrain:forest] gains [feature:wildlife]` |
| `answer-rules.let-it-burn` | `The fire burns {tiles} [terrain:forest] into [terrain:plain], kills {population} population and damages {units} unit` |
| `rules.PH_Settle` | `Settle the [building:PH_City]` |
| `rules.PH_Worker` | `Turn one idle population into a [player:PH_Worker]` |
| `rules.PH_Warrior` | `Turn one idle population into a [player:PH_Warrior]` |
| `rules.PH_Farm` | `Build a [building:PH_Farm]` |
| `rules.PH_Mine` | `Improve [terrain:hills] with a [improvement:PH_Mine]` |
| `rules.PH_Road` | `Improve a tile with a [improvement:PH_Road]` |
| `rules.PH_Urbanisation` | `Terraform a [terrain:plain] into [terrain:urban]` |

On screen a player reads `Place a [Worker]`, `Gain the yield of a [Worker]'s tile`, `Your [City] is attacked by 3 [Warrior]`. Population, yield and unit are concepts with no row and no entry and stay plain words; the capstone window's title is not a run and stays as it is. The comment atop `src/ui/text.ts` names the marks as the paragraph above does.

**Doc-impact:** `docs/INTERFACE.md`, `docs/CHRONICLE-SCREEN.md`.

**Scope:**

In:

- The run's mark widened from `card` to the seven kinds; the name drawn from the kind's entry; the run answering each name's kind with its id, in place of the card alone. One Vitest test beside the run's: a mark of another kind is drawn as its name in brackets and answered with its kind and id.
- The entries above, both catalogues; the two coherence tests widened: every name a rules, answer or capstone entry marks resolves in the table its kind names — the cards, the terrains, the features, the improvements, the buildings, and the unit kinds for `player` and `enemy` — in the Nomadic Age and in the stand-in alike, since the e2e suite plays the stand-in.
- The infopanel's card drawn for a reference: one row from the kind — the building, improvement, feature or terrain — with what it gives at income or "No yield", headed by that row's mark and name, the terrain's movement cost in the corner; the unit kind's card reading the six stats off the kind, health, move and action as full over full, the mark painted for the mark's faction. One drawing serves the infopanel, the small card and the card shown large; it is drawn at the width it is shown at, the card's width small and the inspection's width large, never scaled up.
- The small card raised off a reference of any kind, on the surface that raised it, as a card's is today; a right click on such a name, or on the small card, shows the thing large alone or on top of the stack, exactly as a card's name does, and counts among the twelve. The small card and the card shown large carry what they stand in their data as they carry a card's id today, so a spec reads it back.
- The hand's hold: a hand card stays lifted while a chain off any of its names stands, whatever the name names.
- `e2e/reference.spec.ts` gains a second test, on the settle phase at the chronicle's opening, no turn played: the capstone's window closed, the first card of the hand is the stand-in's settle card, whose one name names the city building. The pointer resting on that name stands a small card that stands `PH_City` the building; the pointer moved onto the small card keeps it past the hand-over, and the cursor is the hand; moved beside it, it goes down; a right click on the name shows the building large alone and the back key takes it down; a right click on the card's body shows the settle card large, the cursor is the hand over its name, and a right click there stands the building on top of the settle card, `inspection` the building and `inspection-0` the settle card; two back keys bring the clean settle phase back.
- `workflow/text-references.md` deleted: its table is consumed by this line, and its note on the kinds is the next board line's sentence already.

Out:

- The concepts — population, yield, unit, capstone — and the capstone window's title: no row, no entry, not a run; **Card kinds explain themselves** decides them at its intake.
- The river: it has no entry to be named by and is never named.
- Tooltips on a reference's card, small or large: none. The infopanel's own rows keep theirs beside a tile.
- Any change to what a name resolves to at play: the rules never read a rules entry.
- The stand-in's answers and capstones: they name no thing a mark resolves; they stay as they read.

Corner cases decided here:

- A reference's card carries no name, so no chain is raised from it, and while it is the newest of the stack nothing on it answers a press but the stack's own.
- A card's name and a reference's name on one face behave alike; the name's kind decides what is drawn and nothing else.
- Which faction a unit reference is painted for is the entry's to say, by the mark it writes: the unit cards and Gather name the player's, the raids and the camp name the enemies'.
- A unit kind's card reads `health / health`, `move / move` in move points and `action / action`: the kind read as a unit fresh of it.
- The infopanel beside a tile does not change on screen: same face, same rows, same tooltips, same size.

**Traps:**

- The infopanel's face (`src/ui/infopanel.ts`) is laid out in the card's fixed metrics, `CARD_METRICS`, its styles module constants of that `em`, and the panel is scaled by the map's unit at each show. The card shown large is 380 wide against 130: a Phaser Text scaled by that blurs, so the face takes its width and sizes its type by it as `createCardFace` does through `metricsOf`. One renderer per card is the dogma: no second drawing of a row.
- The infopanel builds its cards off a tile's layers; a reference builds one off the catalogue alone — `terrainKind`, `featureKind`, `improvementKind`, `buildingKind` in `src/rules/map-kinds.ts`, `unitKind` in `src/rules/catalogue.ts`, which answers `UnitStats` and not a `Unit`; the stats' `move` counts in `MOVE_POINT` hundredths and the panel already reads it back through `inMovePoints`.
- The unit's mark colour lives in `map.ts`'s private `FACTION_COLOURS`, reached through `unitMark(scene, type, faction)`; `Faction` is the closed union `'player' | 'enemy'` in `src/rules/units.ts`, and the mark's kind is a closed set too: switched, no default.
- `src/ui/text-run.ts` parses the mark by one regex on a word; the drawn name may hold spaces and stays one word of the run, so `[player:worker]'s` is one word and its name's extent covers the brackets alone. `Named.card` is what every reader of a run's names takes today: `card-face.ts`'s `Name`, the small card's `Raiser`, the hand's and the overlay's `nameUnder`, both content tests' `namedIn`.
- `Overlay.inspect` and `HandPresses.inspect` carry a `CardId` and a refusal from the hand to the overlay through `chronicle-scene.ts`; the overlay's `Inspected` is a `Face` with costs and a rules entry, which a reference's card is not; the stack names its newest `inspection` and the rest `inspection-<i>`, and five specs read those names and their `card` data, so the naming stays.
- The small card and the card shown large mark themselves as answering a press (`answersPress` in `src/ui/design-space.ts`), which is what the cursor reads; a reference's card does the same or the hand does not show. A zone inside a container wins the pointer over the container (`docs/PHASER.md` _The pointer's readings_); a reference's card lays no zones, so its own hover is the whole of it.
- The e2e helpers `nameOnScreen` and `cardOnFace` in `e2e/chronicle-screen.ts` read a face's `names` data for a name's place and its `card` data for what it stands; `openOnCapstone` opens on the capstone's window and `open` settles past the settle phase, which this proof must not do.
- The comment rule: a comment block longer than three lines is flagged; the facts above go nowhere but here and the two design pages.

**Plan:**

1. `src/ui/text-run.ts` and `src/ui/text-run.test.ts`: the mark widened to the seven kinds, the name drawn from the kind's entry, the run answering kind and id; the test above. Leaves: `npm test` green, nothing on screen changed.
2. `src/ui/text.ts`: the entries above and the comment atop the file; `src/content/nomadic.test.ts` and `src/content/stand-in.test.ts`: every name resolves in its table. Leaves: the names draw in brackets, `npm test` green.
3. `src/ui/infopanel.ts`: the face drawn at a width, and built for a reference of any kind or for a unit kind. Leaves: the infopanel unchanged beside a tile, `npm run check` green.
4. `src/ui/small-card.ts`, `src/ui/overlay.ts`, `src/ui/hand.ts`, `src/ui/chronicle-scene.ts`: a reference raised small and shown large as its card, wherever a card's name is today. Leaves: the whole behaviour on screen.
5. `docs/INTERFACE.md` and `docs/CHRONICLE-SCREEN.md`: the sentences above, verbatim.
6. `e2e/reference.spec.ts`: the second test.
7. `workflow/text-references.md` deleted; the board line deleted.

**Verify:**

- `npm run check`, `npm test`, `npm run lint`.
- The proof: `npx playwright test e2e/reference.spec.ts`.
- CI's on the push: `e2e/inspect.spec.ts`, `e2e/hover.spec.ts`, `e2e/press.spec.ts`, `e2e/settle.spec.ts`, `e2e/deal.spec.ts`, `e2e/capstone.spec.ts`, `e2e/browse.spec.ts`, `e2e/recall.spec.ts`.
