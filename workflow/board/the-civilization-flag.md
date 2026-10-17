# The civilization flag

**Line:** `--civilization` on `npm run sim` hands in the civilization played, a JSON inline or in a file in the content's own format, its city section and its deck, in place of the campaign's first, played as written and carried whole on the cell's record; the name form is gone and the `sim` skill says so.

**Spec:** `docs/SIMULATOR.md` _The cell, the row, the query_, where the first paragraph's second sentence, "The campaign is built through the rules as the forge builds one: the technologies that reach the age and unlock the region learned first, each with its needs, then the ones the cell names, then copies bought and the deck edited.", becomes:

> The campaign is built through the rules as the forge builds one: the technologies that reach the age and unlock the region learned first, each with its needs, then the ones the cell names. The civilization is the campaign's first, or one handed in whole as the content authors one, its city section and its deck, played as written: the technologies learned decide what the chronicle reads and replace nothing in it.

In the second paragraph, "the age, the region, the civilization, the technologies learned," becomes "the age, the region, the civilization, whole where it was handed in, the technologies learned,".

`CLAUDE.md`'s command table, the `npm run sim` row, where "`--age`, `--region`, `--civilization`, `--persona` and `--seeds` name the cell, each defaulting to what the launch screen opens on, the idle and 20;" becomes "`--age`, `--region`, `--persona` and `--seeds` name the cell, each defaulting to what the launch screen opens on, the idle and 20; `--civilization` hands in the civilization played, a JSON inline or in a file in the content's own format, the campaign's first without it;".

The `sim` skill, step 1 of _Procedure_, the same change in its words, and one sentence after it: a civilization handed in is written to the scratchpad as a JSON file and the file's path given, the inline form being for a one-liner alone. Why: `npm run` on Windows hands the arguments through `cmd.exe`, which strips the double quotes a JSON needs.

The flag's value, in the content's own format, every field required and any other unread:

```json
{
  "city": { "building": "hearth", "sight": 2, "idle": 0, "card": "settle" },
  "settle": ["first-worker", "first-scout"],
  "cards": ["gather", "gather", "worker"]
}
```

The usage line gains `[--civilization <json|path>]` in place of `[--civilization <name>]`.

No player-facing sentence: the simulator is a tool.

**Doc-impact:** `docs/SIMULATOR.md`.

**Scope:**

- In: the flag, taking the JSON itself where the value starts with `{` and a path to a file holding it otherwise; the cell launched on the civilization handed in, its city section as handed and its two lists as handed, the order of `cards` kept since the seed shuffles that list; the record line's `civilization` holding the record whole where the flag was given and the campaign's first civilization's name otherwise; the flag beside `--trace`, the trace opening on the same record; one test on the fixture.
- Out: the name form of `--civilization`, gone; any check of the deck against the collection, the influence or a price, never the simulator's job; a partial record, a section defaulted from the campaign's civilization.
- Refused before anything is written, as every flag misfit is: a path with no file, a value that is not JSON, a value that is not an object holding `city`, `settle` and `cards`; a card id the catalogue does not hold; a card in a section it may not stand in, in the words the catalogue's build and the save's reading use for the same misfit; a city section whose building the catalogue does not hold, whose card is not a settle card, or whose sight or idle is below nought.
- Decided: a section may be empty, the deck having no floor; an id listed twice is two copies; a technology named after the flags is still learned, deciding the achievements the chronicle reads, and its city unlock replaces nothing in a civilization handed in, which is not the campaign's; a field the format does not name goes unread, as the save's reading leaves one.
- Reconcile: the card-in-section check goes through the one rules question the catalogue's build and the save's reading already ask, as it is; the flag stays apart from the save's reading, which drops a misfit while the flag refuses the run, a difference meant. The launch goes through the rules' launch on a civilization handed in whole, which the campaign's launch itself calls, as it is. No tool reads a flag as JSON or a path today; nothing to join.

**Traps:**

- The flags are read non-strictly, so a flag given bare reads `true`, and the string reading refuses it; a value starting with `{` is an ordinary string to that reader.
- The campaign is still built in the cell, with the technologies learned, since the chronicle reads its achievements off them; only the civilization resolved by name from it is replaced. The campaign's own civilization by name is resolved through the rules against its collection by card number; a civilization handed in holds ids, which the launch reads as the content's are read, so no number is dealt for it.
- The fixture catalogue in `src/rules/fixtures.ts` exports its one civilization record whole, by the content's shape; the test hands in a copy of it with another deck, so no fixture is authored by hand.
- The cell's record is one JSON line and the sim test reads it back as such; a civilization whole in it stays one line.
- The skill's rule that a content variant is its own run, with the edit then reverted, is not touched by a civilization handed in: it is the cell's data, no content edited.

**Plan:**

1. `tools/sim-body.ts`: the flag read, the value taken as JSON or as a file's text, the record read in the content's shape and refused on each misfit above; the cell carrying the civilization launched, by name resolved from the campaign or whole as handed in; the launch on it; the record line carrying the name or the record. The usage line.
2. `tools/sim.test.ts`: one test on the fixture, the inline form and the file form in a temp folder both: the record's first line holding the civilization whole, the row showing the chronicle was dealt the handed-in deck and opened on the handed-in city section, and one misfit of each kind refused with nothing printed. The standing cell test keeps the name in the record where no flag was given.
3. `docs/SIMULATOR.md`, `CLAUDE.md` and `.claude/skills/sim/SKILL.md`: the sentences the Spec writes out.
4. `workflow/BOARD.md`: the line deleted, this file with it.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No spec proves the line: it never reaches the screen. CI proves the whole suite on the push; no spec walks this path.
