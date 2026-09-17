# Wildfire

**Line:** Wildfire is the nomadic schedule's third event: _Let it burn_ starts a fire on a forest tile drawn within 4 of the city and burns every forest tile within 1 of it to plain, killing the population on them and damaging the units on them, its card reading the exact price; _Cut a firebreak_ costs production and changes nothing; it weighs nothing before turn 8 and is not dealt with no forest to start on — held by rules tests on the nomadic catalogue, and `docs/ages/NOMADIC.md` says so.

**Spec:** `docs/ages/NOMADIC.md` → _The events_. Replace the Wildfire bullet with:

> - **Wildfire.** _Let it burn_: a fire starts on a forest tile near the city, drawn seeded, and that tile and every forest tile around it become plain, so the map has visibly changed; the fire is a terraform, so the game and the trapping go with the forest, the population working a burned tile is killed, the city's own tile and the city's last no exception, and a unit standing on one, whatever its faction, takes damage enough to kill a worker. The answer reads what the fire costs before it is taken — the tiles burned, the population killed, the player's units caught in it — and never where it burns. _Cut a firebreak_: production paid, the forest stands. Wildfire needs a forest near the city to start on, and is not dealt without one. Every forest in sight of the city burning was rejected: a harm aimed at the city reads as unjust, where a fire somewhere in the band's country may or may not find it.

The page carries no number; 4, 1, 2, 3 and 8 below are tuning and live in the content alone.

The text table, written out:

- `event.wildfire`: `Wildfire`
- `answer.let-it-burn`: `Let it burn`
- `answer-rules.let-it-burn`: `A fire starts in a forest near the city and burns the forest around it to plain: {tiles} tiles, {population} population killed, {units} of your units take {damage} damage`
- `answer.firebreak`: `Cut a firebreak`
- `answer-rules.firebreak`: `The forest stands`

**Doc-impact:** `docs/ages/NOMADIC.md`.

**Scope:** In: the event with its two answers in the nomadic catalogue, its need, its schedule entry, its five text entries, the rules function the fire is, and the tests. Out: showing where the fire burns (an overhaul of the deal window, no line yet), a fire spreading through connected forest, any UI code — the deal window, the landing's play-out and the map's redraw are there already; if the map does not redraw a burned tile or a killed unit after the landing, report it, do not fix it here.

The numbers, all content: the start is drawn among forest tiles within **4** of the city's tile, the city's own tile among them when it is forest; the fire burns every forest tile within **1** of the start, the start included; a unit on a burned tile takes **2** damage; the firebreak costs **3 production**; the schedule entry weighs **0 before turn 8 and 1 from it**.

Corner cases decided here:

- **All of it burns**, no roll per tile: every forest tile within the radius, charted or not, held or not, in sight or not. A burned tile out of sight keeps its fog snapshot until seen again, as the sight rules say.
- **The city's tile is not spared**: plain is a terrain the city's building stands on, so the terraform reaches it, and the one working it is killed.
- **The city's last is not spared**: a fire that kills the whole population is a defeat, by the check that already follows every command.
- **A camp on a burned tile stays** — the camp's building stands on plain — and the warrior on it takes the damage; an event's terraform is not refused on a camp's tile, only the player's is.
- **Every unit on a burned tile takes the damage, whatever its faction; the card counts the player's alone** — `{units}` is how many of the player's units stand on burning tiles, hit, not killed.
- `{population}` is how many assigned tiles burn; idle population is on no tile and never burns.
- A river keeps feeding the tile as plain. Game and trapping go with the forest by the terraform's own rule; nothing extra is written for them.
- The need: some forest tile within 4 of the city's tile. It uses the mechanism of the line before this one.
- _Cut a firebreak_ draws nothing and changes nothing but the stock.

**Traps:**

- **The card and the landing must make the same draw.** `reads` runs on the chronicle the deal stands on, `lands` on that chronicle with the cost paid; between them the chronicle takes no command but the take, and neither paying nor a reward laid in the discard pile steps `chronicle.rng`. So one function answers "which tiles burn" from the chronicle's generator, `reads` calls it and throws the stepped generator away, `lands` calls it and keeps it. Two implementations of the draw is the defect to avoid; a test holds that what the card read is what landed.
- The user reads "pure" as parametric: the rules function takes the terrain burned, the terrain left, the two distances and the damage as arguments; the nomadic catalogue passes `forest`, `plain`, 4, 1, 2. No constant of these in `src/rules/`.
- `populationKilled`, `unitDamaged` and `terraformed` exist and do each part; on one tile, kill the population, then terraform, then damage — the order changes nothing today (every unit stands on plain) and is fixed so it never does silently.
- Draw the start uniformly among the candidate tiles in `chronicle.tiles` order, one `nextRng` step, as `besieged` draws a camp.
- The glossary lint will flag nothing here, but the vocabulary is closed: `population`, `killed`, `damage`, `terraform`; never "inhabitants", "destroyed", "lost".
- Trap-only comments; no docblock retelling a signature. Whole-file rewrites over many small edits where a file changes much.

**Plan:** `src/rules/schedule.ts` — the fire: one function drawing the start and naming the burning tiles, one landing them; it owns the same-draw invariant. `src/content/nomadic.ts` — the `wildfire` event (answers `let-it-burn`, `firebreak`, in that order), its need, its schedule entry. `src/ui/text.ts` — the five entries. Tests: `src/rules/schedule.test.ts` on a hand-made chronicle for the fire itself (the radius, the population killed, the damage on both factions, the city's tile, a camp's tile, the generator stepped once); `src/content/nomadic.test.ts` for the content (the weight before and from turn 8, the need, the card reading what lands). `docs/ages/NOMADIC.md` — the bullet.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No e2e spec: the suite plays the stand-in catalogue, which deals no Wildfire.
