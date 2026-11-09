# Cut CHRONICLE.md at its seams

**Line:** Cut CHRONICLE.md at its seams — `docs/FACTIONS.md` holds Enemies and camps, The neutral and Sites, `docs/SCHEDULE.md` holds The schedule and The capstone, every sentence moved verbatim, `docs/CHRONICLE.md` holding a pointer section where each stood, and the design page, the index and both age pages name the two.

**Spec:** the pages themselves; this is a move of settled text, and no rule changes. The sentences written here are the only ones the ship authors.

- `docs/FACTIONS.md`, new. Title `# Factions`. Preamble, as a blockquote like every design page's: "The other factions on the map and what is nobody's: the enemies and their camps, the neutral, and the sites. A design page, under [`DESIGN.md`](DESIGN.md)'s legend. The rules a chronicle is played by are [`CHRONICLE.md`](CHRONICLE.md)'s, and the map they stand on is [`MAP.md`](MAP.md)'s." Then the three level-2 sections `## Enemies and camps ✅`, `## The neutral ✅`, `## Sites ✅`, in that order, every paragraph as it stands in `docs/CHRONICLE.md` today, with one edit: in _The neutral_, "It is a city in everything _The city_ says" becomes "It is a city in everything [`CHRONICLE.md`](CHRONICLE.md)'s _The city_ says".
- `docs/SCHEDULE.md`, new. Title `# Schedule`. Preamble: "The schedule a chronicle lives through: its events and its capstone. A design page, under [`DESIGN.md`](DESIGN.md)'s legend. The rules a chronicle is played by are [`CHRONICLE.md`](CHRONICLE.md)'s, and the region that names a schedule is [`MAP.md`](MAP.md)'s." Then the two sections of today's _Events and the capstone_, `## The schedule ✅` and `## The capstone ✅`, raised from level 3 to level 2, every paragraph as it stands. The level-2 heading _Events and the capstone_ itself moves nowhere: the page's title and preamble take its place.
- `docs/CHRONICLE.md`. The preamble's last sentence becomes: "The map they are played on is [`MAP.md`](MAP.md); the other factions on it are [`FACTIONS.md`](FACTIONS.md)'s and the schedule they live through [`SCHEDULE.md`](SCHEDULE.md)'s; the screen that shows them is [`CHRONICLE-SCREEN.md`](CHRONICLE-SCREEN.md)." Where _Enemies and camps_, _The neutral_ and _Sites_ stood, one pointer section shaped as _The map_ is: `## The other factions` with the one paragraph "The enemies and their camps, the neutral and the sites are [`FACTIONS.md`](FACTIONS.md)'s." Where _Events and the capstone_ stood: `## The schedule` with "The schedule, its events and the capstone are [`SCHEDULE.md`](SCHEDULE.md)'s." In _Units and combat_, the bullet "A unit enters the map on its city's tile" ends "the neutral's landing around it as [`FACTIONS.md`](FACTIONS.md) says." in place of "as _The neutral_ says."
- `docs/DESIGN.md`, the paragraph naming the design pages: after "the map it is played on is [`MAP.md`](MAP.md);" insert "the other factions on it are [`FACTIONS.md`](FACTIONS.md); the schedule it lives through is [`SCHEDULE.md`](SCHEDULE.md);".
- `docs/index.md`, two lines after the `MAP.md` line: "- [`FACTIONS.md`](FACTIONS.md) — the other factions on the map: the enemies and their camps, the neutral, and the sites nobody holds." and "- [`SCHEDULE.md`](SCHEDULE.md) — the schedule a chronicle lives through: its events and its capstone."
- `docs/MAP.md`, _The region_: "and the schedule it deals, as [`SCHEDULE.md`](SCHEDULE.md) says" in place of "as [`CHRONICLE.md`](CHRONICLE.md) says".
- `docs/ages/NOMADIC.md` and `docs/ages/STONE.md`, the preamble: "The rules it is played by are [`CHRONICLE.md`](../CHRONICLE.md)'s, its map [`MAP.md`](../MAP.md)'s, its factions [`FACTIONS.md`](../FACTIONS.md)'s and its schedule [`SCHEDULE.md`](../SCHEDULE.md)'s, and this page repeats none of them" in place of "The rules it is played by are [`CHRONICLE.md`](../CHRONICLE.md)'s and its map [`MAP.md`](../MAP.md)'s, and this page repeats none of them".

**Doc-impact:** `docs/CHRONICLE.md`, `docs/FACTIONS.md` (new), `docs/SCHEDULE.md` (new), `docs/DESIGN.md`, `docs/index.md`, `docs/MAP.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md`.

**Scope:** In: the move, the pointer sections, the three cross-reference edits named above, the index and the preambles. Out: every other sentence; no rule is reworded, reordered, merged or trimmed, and the enemy-phase paragraph of _The turn_ stays where it is, repeating nothing new. `docs/META.md`, `docs/SIMULATOR.md`, `docs/CHRONICLE-SCREEN.md` and `CLAUDE.md` cite the chronicle page for what stays on it and change nowhere. The code comment on the enemy phase in `src/rules/chronicle.ts` cites _The turn_, which stays, and changes nowhere. Reconcile: the one standing likeness is the September split of `docs/MAP.md` out of the chronicle page; this line goes through its shape as it is, the pointer section and the preamble sentence included.

**Traps:**

- Every paragraph moves verbatim: the done-condition is checked by reading the chronicle page's removed lines against the new pages' added lines, and the only differences allowed are the two heading levels raised and the three cross-reference edits the Spec names. A word improved on the way is a deviation.
- `docs/` states what is: neither new page says where its text came from, and the pointer sections say what the page holds, never that it was moved.
- A paragraph is one line and Prettier keeps it so: `npm run fmt` after the edits, `npm run lint` refuses a wrapped one.
- A tracked file changes through Read and Edit/Write alone, never a shell edit.
- The glossary binds the titles and the index lines: faction, enemy, camp, neutral, site, schedule, event, capstone are its words; nothing else of theirs is coined.

**Plan:**

1. `docs/FACTIONS.md` and `docs/SCHEDULE.md` written from the chronicle page's text, leaving two complete pages that lint.
2. `docs/CHRONICLE.md` cut: the sections removed, the two pointer sections and the preamble sentence in, the one bullet's cross-reference repointed, leaving the chronicle page reading settle, turn, map, sight, city, units, the other factions, cards, the schedule.
3. `docs/DESIGN.md`, `docs/index.md`, `docs/MAP.md`, `docs/ages/NOMADIC.md`, `docs/ages/STONE.md` repointed, leaving every page reachable from the index and no page citing the chronicle page for what left it.
4. The board line deleted.

**Verify:** `npm run fmt` then `npm run lint`; `npm run check` and `npm test` for the whole tree, nothing in them reads `docs/`. The verbatim check of the Traps, reported in the Verification section with its method. No spec proves the line: it never reaches the screen. CI proves the whole suite on the push; no spec walks a docs change.
