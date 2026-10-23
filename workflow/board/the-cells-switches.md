# The cell's switches

**Line:** The cell's switches — `npm run sim -- --off camps,neutral,events,capstone` plays the cell with those four off, any subset of them in any order, the cell's record naming what is off; a switch is the content handed the rules changed for the cell alone, and `tools/sim.test.ts` proves each of the four on the fixture.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md), _The cell, the row, the query_. Three sentences change in its first two paragraphs, written out here as they will stand.

The pairing sentence, in the cell paragraph, now reads: "The seeds run from 1 to the count, or over the range named, and pair across cells: seed _n_ is the same map and timeline under every persona and deck, and under the events and the capstone switched off or on, so a comparison between cells is a per-seed diff; the camps and the neutral's city are drawn before what the deal places after them, so a cell with either switched off deals another map than one with it on, and pairs with it on the timeline alone."

The switch sentence, the cell paragraph's last, now reads: "A cell may be played with its region's camps, its neutral, its events or its capstone switched off, the content handed the rules changed for that cell alone — its region dealing no camp, naming no band for the neutral's city, its schedule's first deal or its capstone's turn due past any turn a chronicle reaches — so a reading isolates the economy from what opposes it; the capstone is still drawn at the opening, so the goal gambits go for it as ever; with the capstone off no chronicle ends before the cap, and the stop on the cap's turn is such a cell's ending, not an error."

In the record paragraph, the record's listing gains one item: "…the goal where one is named, the gambit left out where one is, what is switched off where anything is, the turn cap and the seeds as given…"; and the row's capstone item reads "the capstone drawn and the turn it lands on, blank where the capstone is off".

No player-facing sentence: the line never reaches the screen. The tool's own sentences, written out so the hand-back authors none:

- The usage line gains `[--off <switch>[,<switch>...]]` beside `--without <n>`.
- A name that is none of the four is refused: `--off names no switch <name>; the switches: camps, neutral, events, capstone`.
- A name given twice is refused: `--off names <name> twice`.
- [`CLAUDE.md`](../../CLAUDE.md)'s command table, the `npm run sim` row, gains after the `--without` clause: "`--off <switch>[,<switch>...]` plays the cell with its camps, its neutral, its events or its capstone switched off, the ones named;".
- [`.claude/skills/sim/SKILL.md`](../../.claude/skills/sim/SKILL.md), step 1, gains the same clause after the `--without` clause; its rule "A stop is an error to investigate, never a result" gains ", but for a stop on the cap with the capstone off, which is such a cell's ending".

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

- In: the `--off` flag, a comma list of the four names `camps`, `neutral`, `events`, `capstone`, any subset in any order; the cell's catalogue derived from the game's with the cell's one region changed for the switches named and validated as the game's is; the record field `off`, the list as given, dropped from the JSON where nothing is off, on the row run and the trace alike; the `capstone-turn` cell blank with the capstone off, the `capstone` cell the id drawn; the fixture tests; the three sentences in `docs/SIMULATOR.md`; the clause in `CLAUDE.md`'s table and in the sim skill.
- Out: any change to `src/rules/` or `src/content/`; a region handed in whole; a switch on anything else; the row's ending on a stopped cell, which stays `stopped` with cause `turn-cap`, the record saying why.
- Camps off is the region dealing zero camps: no camp stands, so none opens held, none rolls, none sends a wave, and a raid's only door is the outer ring. Neutral off is the region naming no band: no neutral's city, no neutral, `neutral-population` blank as it is for a region dealing none. Events off is a schedule whose first deal is due past any turn a chronicle reaches, the entries kept, so nothing is dealt. Capstone off is a window past any turn a chronicle reaches: the capstone is drawn as ever and never lands, so nothing passes or fails it, defeat is the city's fall alone, and every chronicle stops on the cap.
- A bare `--off` is refused as a string flag set bare already is. `--off` beside `--trace` is the trace's cell, recorded the same.
- Reconcile: the fixture's content changes (`changed`, `aged`, `rescheduled` in `src/rules/fixtures.ts`) and its far turn stay apart, test-only by dogma; the tool derives its own, through the catalogue's validation. The civilization handed in stays apart, a different shape of the same door. The blank cell and the record's optional field go through the row's and the record's standing conventions as they are.

**Traps:**

- One catalogue for the whole run. Every rules call after the derivation — the schedule check, the campaign's learning, the civilization read, the launch, the drive, the columns, the influence paid — takes the cell's catalogue, never the game's; the version string is unchanged, so a chronicle launched on the derived content passes `checkContent`.
- The derived content is built by laying the changed region over the game's catalogue and handing the result to `catalogued` in `src/rules/catalogue.ts`; the checks it meets as read today: nothing refuses a region dealing zero camps, the neutral's band is optional, and a schedule span passes while its least is 1 or more and its most no less (`scheduleHeld`).
- The map's deal, `src/rules/map.ts` lines 1023 to 1049: the neutral's city, then the camps, then the sites, each placed drawing once from the generator per building placed, so a map switch moves what is placed after it; the deal's retry on a short map counts what the region wants, so fewer wanted is never a throw.
- The timeline's draws, `src/rules/schedule.ts` `timelineOf` and `withinSpan`: the capstone's id is drawn first, then its turn, then the first spacing, each one step whatever the span, so the events and capstone switches keep the capstone's id and the timeline's generator in step with the cell they are off in.
- The far turn: `--turns` has no upper bound (`wholeFlag`), so the far turn is past any safe cap; with events off and the capstone on, the capstone's landing rolls the next deal as the landing turn plus the far spacing, a sum that must still read as past any turn.
- The opening enters one enemy on each camp tile and the neutral's worker on the neutral's city (`src/rules/chronicle.ts` `beginChronicle`): no camp, no enemy; no city, no worker.
- The capstone's count is read only once it has landed (`src/rules/chronicle.ts` `conditionsRead`), so with it off no victory comes and no capstone condition fails the chronicle.
- The `--personas` branch returns before the cell is read; `--off` beside it is ignored as every cell flag is.
- The fixture's regions: `disc` deals three camps and one site and no neutral; `clearing` deals two camps and the neutral's city; the first age's schedule deals every three to seven turns with a window of 27 to 33 and the idle reaches an ending on it, so one seed with the capstone off stops on the cap where the same seed without reaches its ending.
- A hook flags a comment block over three lines under `src/` or `e2e/`; the tool is under `tools/` and the fixture file under `src/rules/`.

**Plan:**

1. `tools/sim-body.ts`: the flag read and refused, the cell carrying the switches, the cell's catalogue derived and validated, every call after taking it, the record carrying `off`, the capstone turn blank with the capstone off, the usage line.
2. `tools/sim.test.ts`: one test driving the fixture with all four off — the map holding no camp and no neutral's city, no enemy standing or killed, no deal taken to the cap, the stop on the cap with the capstone's id read and its turn blank, the record naming the four as given; one test that the same seed with the capstone alone off stops on the cap where the seed without reaches its ending, on the trace too; one refusal test for a name that is none of the four and for a name twice.
3. `docs/SIMULATOR.md`: the three sentences as the Spec writes them.
4. `CLAUDE.md` and `.claude/skills/sim/SKILL.md`: the clauses as the Spec writes them.
5. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`; then `npm run sim -- --off camps,neutral,events,capstone --seeds 3 --persona builder` on the game's content, the record's first line read for `"off"` and every row read as stopped on the cap with a blank capstone turn. No Playwright spec proves the line, which never reaches the screen; CI proves the whole suite on the push, none of its specs walking this path.
