# Board

A shrinking list whose goal is zero. One line per item; **priority is order; completion is
deletion.** Every line has a done-condition, machine-verifiable where possible. A line that cannot
be completed is documentation — it moves to `docs/`. A line reaches this file only through
`/intake`; a passing thought goes to [`IDEAS.md`](IDEAS.md) instead.

An in-flight line may link a task file `board/<slug>.md` holding its contract — scope, doc-impact,
hazards, plan — written once, on the settled state, and deleted with the line.

Format: `- **Title** — done-condition. Doc-impact: <`docs/` pages, or none>. [task file]`

---

- **The order kind goes** — an order is an instant aimed at a unit: the Cards section lists three
  kinds, `PH_March` is an instant with a unit target that refreshes move points, its refusals
  unchanged, and the code, the text keys and the tests carry no order kind. The glossary's *order*
  row goes, the *instant* row absorbs "one thing with one unit", and every mention of orders
  (military's job, the refresh rows) is edited. Rules tests pin the refresh and its refusals as an
  instant. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **Enemies move and attack at once** — the intent goes: in the enemy phase each enemy moves by
  its script and attacks a unit of the player's within its range in the same phase, from the
  same pool a warrior has, and the combat phase is gone from the turn; capture stays as it is.
  The turn list, the sight section, and the glossary's *intent* and *combat* are edited. Rules
  tests pin an enemy reaching and attacking in one phase and the capture unchanged; the intent
  rings leave the map. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **Sight is a line over the ground** — sight is a unit's stat and the city's own number;
  every terrain has an elevation, and a tile within a unit's sight is seen when a line from the
  unit runs over flat ground and meets no raised tile as high as the unit's own before it, the
  target's own height never hiding it; every held tile is in sight. Rules tests on a synthetic
  fixture pin flat ground running free, a forest stopping a plain, hills seeing over a forest and
  stopped by hills, the far mountain seen, and a tile on two paths seen when either is clear; the
  infopanel's unit card gains the row. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
  [board/sight.md](board/sight.md)
- **The map is hidden** — the chronicle keeps a snapshot of every tile that has been in sight,
  taken after every stage; the map draws a tile in sight live, a tile in fog as its snapshot under
  a scrim, and an uncharted tile not at all, the disc's rim a grey line; a unit is not moved onto
  an uncharted tile, and a stage on tiles out of sight moves neither marker nor frame. Rules tests
  pin that the snapshot keeps what was seen after the unit leaves, that a killed unit reveals
  nothing more, and the refused move; an e2e spec on a fixed deck reads all three states.
  Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`. [board/map-hidden.md](board/map-hidden.md)
- **Two debug commands for the fog** — the game's first debug commands, off by default: one shows
  what has never been seen, one shows what is out of sight. Both reachable in the running game and
  stepped by an e2e spec. Doc-impact: `docs/DESIGN.md`.
- **Fog on the rest of the screen** — the yield overlay, the infopanel and city mode stop reading
  through fog: no glyphs on a tile never seen, no occupant on a card outside sight. Pinned by an
  e2e spec on a fixed seed. Doc-impact: `docs/DESIGN.md`.
- **Movement costs what the tile says** — the flat one-per-tile goes; every terrain names its
  movement cost and `reachable` charges it, so the map's and the units' sections of the design
  agree on one rule. Rules tests on a fixed seed. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **What a river costs to cross** — the design settles what crossing a river edge costs, and every
  path over the map pays it. A rules test on a seed whose river cuts a unit's reach.
  Doc-impact: `docs/DESIGN.md`.
- **Placeholder road card** — a stand-in improvement card lays a road that lowers its tile's
  movement cost; a rules test shows a unit reaching further over it than beside it.
  Doc-impact: none.
- **Camps on the map** — the generator places camps, each hidden until seen, and an event that
  spawns enemies spawns them at a camp instead of the outer ring. Rules test on a fixed seed plus
  an e2e spec. Doc-impact: `docs/DESIGN.md`.
- **Capturing a camp** — a unit standing on a camp through a full turn captures it; a captured camp
  spawns nothing again and pays a one-use stand-in card that joins the chronicle's deck and is gone
  when played. Rules tests for the capture, the silenced camp and the card's one use.
  Doc-impact: `docs/DESIGN.md`.
- **The schedule** — events become a weighted table whose weights shift with the turn, drawn from
  the chronicle's own generator: the same seed deals the same schedule, the harshest entries carry
  no weight early, and a raid drawn late is larger than one drawn early. Rules tests pin all three.
  Doc-impact: `docs/DESIGN.md`.
- **The events phase deals a choice** — the phase offers several of the schedule's events as cards
  and the player takes one, which resolves; this replaces the design's "land and resolve at once".
  An e2e spec plays a turn through the deal. Doc-impact: `docs/DESIGN.md`, `docs/GLOSSARY.md`.
- **The chronicle has a length** — the capstone's turn is fixed at the founding and read on the
  chronicle screen; the end-turn button's readout is re-judged against it.
  Doc-impact: `docs/DESIGN.md`.
- **The capstone, and victory** — `PH_Siege` lands on its fixed turn, spans its turns and ends the
  chronicle: victory while the city holds, defeat when it does not. A victory screen mirrors the
  defeat screen, and rules tests pin both endings. Doc-impact: `docs/DESIGN.md`,
  `docs/GLOSSARY.md`.