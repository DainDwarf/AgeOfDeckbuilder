# The cell's schedule knobs

**Line:** The cell's schedule knobs — `npm run sim` plays a cell with its region's schedule cut to the events named, its capstone named instead of drawn, or an event's answer fixed, the cell's record naming each as given, so [`EVENTS.md`](../EVENTS.md)'s cells can run. Doc-impact: `docs/SIMULATOR.md`, `CLAUDE.md`.

**Spec:** [`docs/SIMULATOR.md`](../../docs/SIMULATOR.md) → _The cell, the row, the query_ is the spec, with these sentences added.

After the sentence ending "the stop on the cap's turn is such a cell's ending, not an error.":

> A cell may also be played with its region's schedule cut to the events named, each at the weight the schedule gives it, or with its capstone named instead of drawn, the content changed for that cell alone as when something is switched off; the timeline's generator steps once per draw whatever it draws among, so a cut schedule deals on the turns the whole one deals on, and a capstone named lands on the turn the seed would have drawn, or never where the capstone is off, the goal gambits then going for one trial on every seed. A cell may fix the answer taken to an event: whenever that event is dealt, the cell takes the answer named ahead of the persona's walk, the trace naming the knob where it names a gambit, and a deal on which that answer is refused stops the chronicle as stuck, the stop being the reading. What a cell cuts to, names or fixes is the region's schedule's own, and nothing is cut or fixed on a schedule whose events are switched off.

In the record sentence, after "what is switched off where anything is,":

> the events the schedule is cut to, the capstone named and the answers fixed where any are, each as given,

[`CLAUDE.md`](../../CLAUDE.md) → _Commands_, the `npm run sim` row, after the `--off` clause:

> `--event <id>[,<id>...]` cuts the region's schedule to the events named, each at its weight; `--capstone <id>` names the capstone instead of drawing it; `--answer <event>:<answer>[,...]` fixes the answer taken whenever that event is dealt, the chronicle stopping as stuck on a deal that refuses it;

[`workflow/EVENTS.md`](../EVENTS.md), the flags its cells run with, written out:

- _One event alone_, after its first paragraph: "The cell is the whole game's flags with `--event <id>` and `--off capstone`, one cell per answer with `--answer <id>:<answer>` and one with none; `--capstone <id>` beside them names the trial the goal gambits go for, the same on every seed."
- The Nomadic paragraph of the same section: "`--answer rival-band:fight` and `--answer rival-band:make-room`, one cell each."
- _One trial named_, after its first sentence: "The cell is the whole game's flags with `--capstone <id>`, one cell per trial."

The usage lines the simulator prints carry the three flags beside `--off`, in the shape above. No player-facing sentence: nothing reaches the screen.

**Doc-impact:** `docs/SIMULATOR.md`, `CLAUDE.md`; `workflow/EVENTS.md` beside them, being the cells' own page.

**Scope:**

- In: three flags of the simulator. `--event` takes a comma list of event ids and cuts the region's schedule to those, keeping each one's weight; `--capstone` takes one capstone id and cuts the region's capstones to it; `--answer` takes a comma list of `<event>:<answer>` and, whenever a deal of that event stands, takes that answer ahead of the persona's walk. The record carries each under its flag's name as given: `event` the list, `capstone` the string, `answer` the list of `<event>:<answer>` strings, each dropped where unset. A trace line for a fixed take puts the flag item as given, e.g. `flood:dig-channels`, where the gambit's sentence stands.
- Refused, before anything is written, each naming what is allowed: an event `--event` or `--answer` names that the region's schedule does not deal, naming the schedule's events; a capstone the region's schedule does not name, naming its capstones; an answer the event does not deal, naming the event's answers; an `--answer` item without a colon; an event cut, named or fixed twice; `--event` or `--answer` beside `--off events`. `--answer` for an event `--event` has cut away is refused as an event the cell does not deal.
- A fixed answer refused on a deal, unaffordable or blocked: the chronicle stops as `stuck` on that turn, the existing stop cause. No fall-through to the persona.
- `--capstone` beside `--off capstone` is allowed: the trial named is drawn and never lands; the goal gambits go for it.
- `--capstone` beside `--goal` composes as the switch does: the goal gambits go for the technology's achievement while unreached and the named trial after.
- Out: fixing a capture's reward, a weight of the cell's own, cutting to an event the region does not deal, any change to the personas, the rules or the content. No measurement runs in this line.
- Reconcile: the cut schedule and the named capstone go through the simulator's standing switch-off door as it is, the region reshaped before the content is validated, since that door already changes the region for the cell alone; the fixed answer stays apart from the personas' take gambits, a difference that is meant, the knob being the cell's and naming content where a gambit never does, and it is never a gambit in the persona's list; the fixture's reschedule helper is a test helper and stays one.

**Traps:**

- The generator steps once per draw in `src/rules/rng.ts` whatever the list's length, for the weighted draw and the uniform one alike. The seed pairing the spec promises rests on that; the test proving it compares a seed's deal turns and capstone turn between the whole schedule and the cut one.
- The switch for the events sets the schedule's spacing past the cap and leaves its entries in place; a cut composed over it would read as a cell dealing events. Refuse the pair instead.
- The simulator's record is one JSON line whose key order is asserted by a regex in the last test of `tools/sim.test.ts`, with unset keys dropped by the JSON; the new keys are dropped when unset, so every record on disk and the regex stay as they are, and the record and the test agree on where the keys sit.
- The persona's gambits read a deal's entries through the rules' own `offered`; nothing narrows what they see. The fix is applied by the driver before the walk, so `--without` numbers stay as `--personas` prints them and no persona changes.
- The stop causes are a closed set; `stuck` is reused, not widened.
- The row already has a `capstone` column; the record's `capstone` key is on the comment line and collides with nothing a query reads.
- The fixture: the first age's schedule deals two events and names one capstone; the quiet age names two capstones and deals nothing before the far turn; `rescheduled` in `src/rules/fixtures.ts` lays any schedule over an age for a test. A refusable fixed answer is authored on the fixture, as the builder's deal tests author events.
- `workflow/EVENTS.md`'s DuckDB queries read the record as a comment; nothing in them changes.

**Plan:**

1. `tools/sim-body.ts`: the cell reshaped — `--event` and `--capstone` read, refused as Scope lists, applied through the switch-off door, and carried in the record; the usage lines. `tools/sim.test.ts`: the cut schedule deals the named event alone on the same turns as the whole one on a seed; the named capstone lands on the turn the drawn one would have, and is drawn with the capstone off; the refusals.
2. `tools/sim-driver.ts` and `tools/sim-body.ts`: `--answer` read, refused, carried in the record, applied ahead of the walk, the trace naming it; the stop as stuck on a refused deal. `tools/sim.test.ts`: every deal of the fixed event takes the answer named, on the trace too; a refused fixed answer stops the chronicle as stuck on that turn; the refusals.
3. `docs/SIMULATOR.md`, `CLAUDE.md`, `workflow/EVENTS.md` as Spec writes them; the board line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — nothing reaches the screen. CI proves the whole Playwright suite on the push; no spec walks this path.
