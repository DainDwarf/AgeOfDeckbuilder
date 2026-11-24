# The combat log

**Line:** **The combat log** — a log stands against the screen's left edge under the pinned achievements' ledger, its top at one height on every window, reading in sentences what the chronicle did where the map played it in sight, on the player's turn and through the end of turn, each line landing as its change plays, under a heading to each turn and five turns back; it is as tall as its lines down to just over the resting cards, scrolls past that as a browse does and folds by a tab as the ledger's; the ledger is as wide as the log, stops a little over the log's top and scrolls past it; the wheel over either never zooms the map; and `e2e/log.spec.ts` passes.

The mockup the user settled it on, the real chronicle screen with the ledger and the log drawn over it: https://claude.ai/artifact/J48mDUP9CbXRx6mkWiSMHi. It opens on its defaults, which are the picks but for three: the user took the log **down to the cards on every window**, the line under the pointer **not lit in a faction's colour**, and the wheel over either panel **never zooming the map**. The rings on the map and the press that centres it are the next line's on the board, **The log's lines on the map**, and out of this one.

**Spec:** the sentences below are added or changed as written.

`docs/CHRONICLE-SCREEN.md` _The pinned achievements_, first paragraph: "An achievement's row reacts to no press; the wheel over the ledger zooms the map, as over the resource bar." becomes:

> An achievement's row reacts to no press. The ledger reaches no lower than a little over the log's top: one whose rows ask for more scrolls them as a browse scrolls, by the wheel and by a held press dragging it, under the browse's scrollbar, its tab holding still. The wheel over the ledger never zooms the map, whether the ledger scrolls or not.

`docs/CHRONICLE-SCREEN.md` _The deal window_, the paragraph on a minimized window: "the ledger folds and raises the capstone's window" becomes "the ledger folds, scrolls and raises the capstone's window, the log folds and scrolls".

`docs/CHRONICLE-SCREEN.md`, a new section after _The summary_:

> ## The log ✅
>
> A **log** stands against the screen's left edge under the pinned achievements' ledger, its top at one height on every window: one panel ([`LOOK.md`](LOOK.md)), as wide as the ledger, reading in sentences what the chronicle did, a line to each thing, the newest at its foot. It is as tall as the lines it holds, never shorter than its tab asks, and grows down to just over the height the hand's resting cards rise to. Holding more than that, it scrolls as a browse scrolls, by the wheel and by a held press dragging it, under the browse's scrollbar, and a line landing brings it back to its foot. The wheel over the log never zooms the map, whether the log scrolls or not. A log holding no line does not stand, and neither does its tab.
>
> **A line lands as its change plays**, on the player's turn and through the end of turn alike, and only where the map plays that change in the player's sight: what the fog or the uncharted hid is never a line. The log reads an attack, with the attacker, the unit attacked and the damage; an attack that kills; a unit entering the map; an enemy preparing, on a city's tile or on a tile it will pillage; a pillage, with what it removed, the building or else the improvements; a capture, with what was captured; the income, with each stock it moved; a strike, with its card and what it took; and the player's city growing. Population a city pays for a stock taken past nothing reads on the line that took it. A unit is named by its kind after a disc of its faction wearing the faction's sign, as the summary names one, whatever the Faction signs button shows. A unit standing on a tile out of sight is not named: the line reads the unit in sight alone. A stock or the population moved reads as a signed number before its glyph, as the resource bar's end of turn reads one. Nothing else is a line: not a walk, not a card played, and nothing that has a window, a row or a warning of its own. Nothing is a line on the settle phase.
>
> **Lines stand under a heading to their turn**, `Turn 40`, a turn with no line having none. The log holds the turn the chronicle stands on and the four before it, and older lines leave it. It keeps what happened on this screen and no more: a chronicle opened again from its save opens on an empty log.
>
> A **tab** stands on the log's outer edge, at its top, as the ledger's stands on the ledger. A left click on it folds the log into the edge, the tab alone standing there with its triangle pointing away from the edge, and a second brings the log back. The pointer resting on the tab raises a tooltip under it reading `Log`, folded or not. It is a display as the ledger's fold is: no key folds it, the back key leaves it as it stands, and every chronicle screen opens with the log unfolded. A line reacts to no press and no rest, and the log stops a press as anything standing over the map does.

`docs/INTERFACE.md` _The menu_, the Controls paragraph: "it scrolls what scrolls under the pointer, and on the chronicle screen, while nothing stands on a scrim, it zooms the map one notch a notch." becomes "it scrolls what scrolls under the pointer, and on the chronicle screen, while nothing stands on a scrim and the pointer is off the ledger and the log, it zooms the map one notch a notch."

`docs/INTERFACE.md` _The window_: "the pinned achievements' ledger to its left edge" becomes "the pinned achievements' ledger and the log under it to its left edge".

`docs/INTERFACE.md` _What stands over what_: "the tab of the pinned achievements' ledger and the ledger over it, the Menu button" becomes "the tab of the pinned achievements' ledger and the ledger over it, the log's tab and the log over it, the Menu button".

`docs/LOOK.md` _The chrome_, **A panel**: "the pinned achievements' ledger, the summary, an answer" becomes "the pinned achievements' ledger, the log, the summary, an answer"; and "the ledger's stands against the screen's left edge and runs on past it, so it shows its rim along its top, its outer side and its foot" becomes "the ledger's and the log's stand against the screen's left edge and run on past it, so each shows its rim along its top, its outer side and its foot".

`docs/LOOK.md` _The chrome_, **A button**: "the Minimize button and the tab of the pinned achievements' ledger" becomes "the Minimize button, the tab of the pinned achievements' ledger and the log's tab"; and after the sentence on the ledger's tab, add: "The log's tab is the ledger's, and folded it wears its triangle alone."

`docs/LOOK.md` _The chrome_, a new paragraph after **The summary**:

> **The log** is a panel as the ledger's, and as wide. Its lines are set small, in the charcoal's ink, one under the other with no rule between them. A unit's name stands bold just after its faction's sign, drawn as the summary draws it. A signed number stands just before its glyph, in the green of a gain or the red of a loss the resource bar's end of turn reads in, the glyph in its colour and its outline. A turn's heading is set a size smaller, in a fainter ink. A line too long for the log runs on onto a second row, set in from the first. The ledger and the log scroll under a browse's scrollbar.

`docs/LOOK.md`, last paragraph of _The chrome_: "The aim's line keeps its dark slab, and a browse its scrollbar." stays.

Player-facing entries, each as written, a unit drawn where its placeholder stands:

- `{attacker} attacks {target}: {damage} damage`
- `{attacker} kills {target}`
- `{target} is attacked: {damage} damage`, the attacker on a tile out of sight
- `{target} is killed`, the attacker on a tile out of sight
- `{attacker} attacks`, the unit attacked on a tile out of sight, killed or not
- `{unit} enters`
- `{unit} prepares to capture your city`
- `{unit} prepares to capture {building}`, on the tile of a city that is not the player's
- `{unit} prepares to pillage`
- `{unit} pillages {removed}`, the building's name, or else the improvements' names
- `{unit} captures {captured}`, the building's name
- `Income`, then a signed number and its glyph to each stock the income moved, in the resource bar's order, then the population taken where it took any
- `{card} strikes`, then the same reading of what it took; a strike that moved nothing reads the card and the word alone
- `Your city grows`, then `+1` and population's glyph
- `Turn {turn}`, a turn's heading
- `Log`, the tab's tooltip

**Doc-impact:** `docs/CHRONICLE-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`.

**Scope:**

In: the log on the chronicle screen; the ledger's width, its lowest foot and its scroll; the wheel over the ledger and the log; the three pages.

The mockup's measures, in units, are the instruction for the look. The log: its top 470 under the screen's top on every window; 256 wide from the screen's left edge, its panel running on past the edge as the ledger's; 12 of padding at its sides and 8 over and under; rows of 18; its type at 12, a heading at 11; a faction's disc 12 across, its glyph 0.64 of the disc, 4 before the name; a signed number half a type's size after what stands before it and 2 before its glyph, the glyph 12 across; a second row of one line set in 16; its foot no lower than 14 over the resting cards' tops, the height End turn's foot stands at on a narrow window, on every window; its room the whole rows that fit, 5 on a window 720 tall and 25 on one 1080 tall; never shorter than its tab with 8 over and under it. The tab: the ledger's, 24 by 48 showing, 8 under the log's top. The ledger: 256 wide; its lowest foot at 462, 8 over the log's top, which holds the capstone's row and five goals of two lines; past it the rows scroll and the tab holds still.

Out, each decided with the user:

- A line under the pointer ringing its tiles in each unit's faction colour, and a press on a line centring the map on them: the next line, **The log's lines on the map**.
- Walks: a tile has no name, and a walk would read "moves" alone.
- A card played, a heal, a deal, the capstone landing, an achievement reached, war declared, harm an answer does: each has its window, its ledger row or its warning.
- The log kept across a reload: the save keeps the state, and the log opens empty.
- A key for the tab, and a tally on the folded tab.
- The log's foot down in the corner on a wide window: the user took it down to the cards on every window.

Corner cases decided:

- A line is recorded exactly where the map plays its change: a fight in the fog or the uncharted leaves none. Where one of an attack's two tiles is out of sight, the unit on it is not named and the line reads the other alone.
- An attack that kills reads the kill alone, with no damage.
- The capture of the player's city ends the chronicle on its ending screen and is no line.
- Nothing is recorded on the settle phase, and the first heading is `Turn 1`.
- The population a shortfall takes reads on the Income line or the strike's line that took it.
- The five turns count every turn, quiet ones too; a quiet turn has no heading.
- The log and the ledger take the wheel whether they scroll or not; the resource bar keeps letting the wheel zoom the map; the two keys that pan up and down keep panning the map over them.
- Under a scrim the log is dimmed with the screen; under a minimized deal window it folds and scrolls; a card lifted out of the hand stands over it.
- A ledger folded stays folded as it is today; a log holding no line shows no tab.

The reconcile, each chosen by the user:

1. The log's panel and its tab are the ledger's, as they are; folded, its tab wears the triangle alone, as a ledger holding no achievement does.
2. The log and the ledger scroll through the browse's scroll as it is: the wheel, the drag that runs on, the browse's scrollbar. The pan keys not scrolling them is meant.
3. A unit in a line is not a name in brackets, as an answer's text writes one: it is the faction's disc and the bare name, reacting to nothing. The difference is meant. The disc is the summary's, as shipped.
4. What is in sight is what the map plays: the log asks the map's own rule and decides nothing of its own.
5. A signed number is the resource bar's end-of-turn reading's, in its colours. The bar forecasting a turn's sum and the log reading each step after it is meant.
6. A turn's heading reads as the launch screen writes a turn.

**Traps:**

- `docs/PHASER.md` for everything the log does on the UI surface, and `DOGMAS.md` _Stack_: a game object is made once and changed in place; lines come and go in numbers, so they are pooled, hidden and reused, never destroyed to be drawn again.
- The flow is the only source: what happened is in the stages a command resolves as, each carrying the chronicle it was raised on and the one it leaves, and never in the state. A reader asks the stage for its before: who was killed is read off it, by whom off the attack's group. Nothing is added to `src/rules/` for the log, and nothing of it enters the save.
- The map already decides whether a stage plays: a stage with no tile drawn live on the map as it stands or on the chronicle it leaves plays nothing (`src/ui/map-motion.ts`). The log's line and the map's motion must not drift apart: one answer, asked once.
- A walk is one `move` change a step, and an attack by a press may hold a walk before its `attack` group: neither is a line.
- The change names and the group names are closed sets (`src/rules/stages.ts`): the log's reading of them is a switch over every member, as the map's, the hand's and the piles' are.
- `LEDGER.width` (`src/ui/pinned-layout.ts`) sizes the ledger's rows, rules and stops; `e2e/pin.spec.ts` reads the ledger's place and its rows from the game, and one of its tests reads the last row reaching the ledger's foot.
- The ledger's tab is made before its panel so the panel covers its inner end; the log's is the same piece.
- A name in a goal reacts to the rest and the right click inside a ledger that now scrolls: what a browse's card does under its scroll is the precedent.
- No text is set under the type floor of 11 (`src/ui/design-space.ts`): a heading stands on it.
- A colour is named for what it means: the heading's fainter ink is `0x9aa1a9` on the mockup. Where no entry of `src/ui/look.ts` means it, it is a new entry and goes in the report.
- The log shows no literal: every sentence is an entry of `src/ui/text.ts`, one entry a sentence, and a piece outside the scene receives the catalogue as an argument.
- The Stone tree pins six goals at once at the most: a ledger past its foot is reached by a campaign pinning six that a Stone chronicle reads.

**Plan:**

1. `src/ui/pinned-layout.ts`, `src/ui/pinned-achievement.ts` and the chronicle scene: the ledger stands 256 wide, stops at its lowest foot and scrolls its rows past it, and the wheel over it never zooms the map.
2. `src/ui/text.ts`: the log's entries stand.
3. A pure module in `src/ui/` with its test on the fixture's catalogue: the stages of a command read as the log's lines, each change the log records answered once, a unit out of sight unnamed, a change out of sight unanswered.
4. A new module in `src/ui/` for the log's panel, made by `src/ui/chronicle-scene.ts`: it stands under the ledger, takes each line as its change plays, heads the turns, drops what is older than five, scrolls, folds by its tab and takes the wheel.
5. `e2e/log.spec.ts`, with the readings it needs in `e2e/chronicle-screen.ts`: an end of turn with an enemy beside a unit of the player's lands the attack's line under its turn's heading, its damage read from the rules; a fight the fog hides lands none; the wheel over the log and over the ledger leaves the map's zoom where it stood; a left click on the tab folds the log and a second brings it back; a campaign pinning six goals stands a ledger that stops over the log and scrolls.
6. The three pages, and the board line deleted with this file.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `npx playwright test e2e/log.spec.ts`. CI proves on the push: `pin`, `capstone`, `chrome`, `window`, `press`, `held-press`, `hover`, `pointer-sweep`, `map`, `minimize`, `browse`, `attack`, `camps`, `end-of-turn-reading`, `resume`, `buttons`.
