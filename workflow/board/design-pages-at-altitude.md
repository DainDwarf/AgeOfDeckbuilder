# The design pages at altitude

**Line:** **The design pages at altitude** — a Docs dogma says what a design page carries and what it never does: stand-in names, content detail, future implementation, history retold; the three design pages and the age page are re-read against it. Done when the dogma stands in `DOGMAS.md` → _Docs_ and the four pages carry none of what it forbids.

**Spec:** `DOGMAS.md` → _Docs_ is the spec, and this dossier writes every sentence. The pages the dogma is read against are `docs/DESIGN.md`, `docs/INTERFACE.md`, `docs/CHRONICLE.md` and `docs/ages/NOMADIC.md`; the four ideas the pages lose go to `workflow/IDEAS.md` → _Game_.

The dogma, one line under _Docs_, placed after "Each doc owns one altitude":

> **A design page is at altitude.** It states the rules and the shapes the player meets, in the glossary's words and the map's own — a terrain, a biome — and a content page states what an age is made of. A number the content names — a cost, a yield, a stat, a radius, a share, a count of copies — stands in the content and on no page; a rule's own number stands with the rule, provisional or decided. No page names a stand-in's content or a label that stands in until the look, and no example names a piece of content — a card, a building, a feature, a unit kind, an achievement — real, stand-in or to come: a rule is illustrated by the things the rules define. No page holds a door open for content that does not exist or defers a question to a later piece of content: an open question is a board line, a wish is an idea. A pivot leaves no trace, a rejected alternative gets its one line of why, and a dogma is stated here and on no page. Why: a door, a stand-in and an example read as decided to the session that finds them.

The four idea lines, appended under `workflow/IDEAS.md` → _Game_, each one line:

- **A building's yield reads its neighbours**: adjacency as content — a building yielding by what stands on the tiles around it.
- **A tile that adds sight**: a layer of a tile, a building or an improvement, adding to the sight of the unit standing on it.
- **A building that adds an entry point**: units enter the map on the city's tile alone; a keyword for a building that opens another door.
- **A rolled centre part**: the centre part's radius rolled by the generator instead of named by the region; a generator change, pitched running.

The edits, page by page, each the sentence as it stands and the sentence that replaces it. A sentence not listed is not touched.

`docs/DESIGN.md`:

- The second paragraph ends "…what exists only inside a chronicle is [`CHRONICLE.md`](CHRONICLE.md). A standing decision carries one line of rationale, and only when the rejected alternative is attractive enough that a future session would plausibly redo it. When a decision is overturned, the page changes in the same unit of work; it never keeps the old version." → it ends "…what exists only inside a chronicle is [`CHRONICLE.md`](CHRONICLE.md)."
- "The three are **the design pages**, and they are the **spec**. Code that disagrees with them is wrong; a gap found during implementation is reported as a deviation, never closed by editing a page down." → "The three are **the design pages**, and they are the **spec**."
- "Standing things do their standing thing for free — a farm with a person assigned yields — and" → "Standing things do their standing thing for free — a tile with a population assigned yields — and".
- "so a chronicle replays from its seed — for replay, undo and debugging first; a headless simulator is possible but not promised." → "so a chronicle replays from its seed."
- "**The map is the draft.** 🔧 Trading with a neutral, clearing a ruin, taming a terrain can yield a card that joins the deck for this chronicle only." → "**The map is the draft.** 🔧 What the map holds can yield a card that joins the deck for this chronicle only: a camp's capture deals its rewards."
- "and some achievements are reachable only from a region that has what they need — _Sailing_ wants a coast. 🔧" → "and some achievements are reachable only from a region that has what they need. 🔧"

`docs/INTERFACE.md`:

- The header's "A design page, under [`DESIGN.md`](DESIGN.md)'s legend and rule: the spec, never edited down to match the code." → "A design page, under [`DESIGN.md`](DESIGN.md)'s legend."
- _The launch page_ is untouched, by the user's decision: its stand-in framing and the test suite's door stay as they are.

`docs/CHRONICLE.md`:

- The header's "A design page, under [`DESIGN.md`](DESIGN.md)'s legend and rule: the spec, never edited down to match the code." → "A design page, under [`DESIGN.md`](DESIGN.md)'s legend."
- _The turn_: "the tiles within a radius of the disc's centre the region names, 🔧 three — is in sight" → "the tiles within a radius of the disc's centre the region names — is in sight".
- _The turn_, Draw: "a **hand** of **five** cards from the draw pile. 🔧" stays: the hand's size is the rule's own number.
- _The turn_, Income: "a farm built this turn feeds the next." → "a building built this turn yields from the next."
- _The turn_, Enemy phase: "each camp whose tile is free rolls whether a warrior enters on it." → "each camp whose tile is free rolls whether an enemy enters on it."
- _Sight_: "and the city has a sight of its own, a number on its content. 🔧 A worker and a warrior see two tiles, and so does the city." → "and the city has a sight of its own, a number on its content."
- _Sight_: "**Every terrain has an elevation**, how high it stands over the ground: plain, coast, deep water and urban 0, forest 1, hills 2, mountain 3. 🔧" → "**Every terrain has an elevation**, how high it stands over the ground, a number on its content; flat ground stands at nothing." The illustration after it — the forest, the plain, the hills — stays.
- _Sight_: "Melee needs no rule of its own — an adjacent tile is always in sight — and whether a ranged attack needs its target in sight waits for the first ranged unit. The enemies read the whole map" → "Melee needs no rule of its own: an adjacent tile is always in sight. The enemies read the whole map".
- _Cards_, Building: "no free tile of the right terrain, no farm — and a building card" → "no free tile of a terrain it names, no building — and a building card".
- _Cards_, Unit: "one population off the tiles becomes the warrior, the worker, later the trader, and is gone when the unit is killed." → "one population off the tiles becomes the unit, and is gone when the unit is killed."
- _Cards_, Instant: "an immediate effect: draw two, gain food, negotiate with a neutral," → "an immediate effect: draw cards, gain a resource, negotiate with a neutral,".
- _Population_: "how many idle is content. 🔧 Two. Assigning is free" → "how many idle is content. Assigning is free".
- _The map_, Feature: "dealt by the generator or by an event's answer: a fertile plain. A feature lies" → "dealt by the generator or by an event's answer. A feature lies".
- _The map_, Improvement: "two properties a layer declares, a building's or an improvement's alike; the road is the one layer that carries either." → "two properties a layer declares, a building's or an improvement's alike."
- _The map_: the paragraph "🔧 A building's yield may read its neighbours. Nothing in the first playable does; the door is there so that adjacency is content when it comes." is deleted.
- _The map_: the paragraph "🔧 A tile's layers may add to the sight of a unit standing on it. Nothing does; the door is there so that seeing further from a tile is content when it comes." is deleted.
- _The map_, the generator's first layer: "the centre's biome is dealt land, and its origin is the disc's centre tile." → "the centre's biome is dealt the kind the region names, and its origin is the disc's centre tile."
- _The map_, the second layer: "So a sea is rimmed with coast, zero to two tiles wide, and a mountain range with hills, zero to one; where two biomes" → "So a sea is rimmed with coast and a mountain range with hills, each as wide as its biome's odds roll; where two biomes".
- _The map_, the fifth layer: "A river rises at a corner of a mountain range that is not at the water already" → "A river rises at a corner of the biome the region names for its rivers, a mountain range, one that is not at the water already".
- _The map_, the fifth layer: "every range dealt is worth up to two rivers, so a range hugging the coast may yield fewer" → "every range dealt is worth some rivers, so a range hugging the coast may yield fewer".
- _The map_, the seventh layer: "every tile within a radius of the disc's centre the region names, 🔧 three, handed out with the map; it is what the chronicle sees on turn 0 and where the settle lands. A rolled centre is a generator change when it comes." → "every tile within a radius of the disc's centre the region names 🔧, handed out with the map; it is what the chronicle sees on turn 0 and where the settle lands."
- _The map_, the region: "how many biomes it is cut into and which kinds are dealt in what shares, the share of each feature" → "how many biomes it is cut into and which kinds are dealt in what shares, the centre's among them, the share of each feature".
- _The map_, the river: "A river gives a tile it runs along **one food** where that tile is plain or forest, and nothing to a tile of any other terrain." → "A river gives a tile it runs along a yield the tile's terrain decides, and nothing to a tile of a terrain that takes none; which terrains and what is content."
- _The map_, the river: "The terrain decides, so terraforming a plain a river runs along into urban ends what the river gives it while the river stays exactly where it runs." → "The terrain decides, so terraforming a fed tile into a terrain that takes nothing ends what the river gave it while the river stays exactly where it runs."
- _The map_, the river: the sentence "🔧 Which terrains a river feeds and what it gives them are tuning." is deleted; the rule now says it.
- _The map_, the border: "🔧 Whether a card may claim too is not settled; only the stand-in has one." is deleted.
- _The map_: "Units enter the map on the city's tile. 🔧 A building that adds an entry point is a keyword for later content." → "Units enter the map on the city's tile."
- _Units and combat_, the move: "Coast and deep water name no movement cost at all and are crossed by nothing." → "A terrain may name no movement cost at all, and is then crossed by nothing."
- _Units and combat_, the move: "A **road** names its tile's cost outright over the sum its layers make, 🔧 half a move point to enter, whatever lies under it;" → "A **road** names its tile's cost outright over the sum its layers make, whatever lies under it;".
- _Units and combat_, the action: "A worker holds one action and attacks nothing because it is a worker" → "A worker attacks nothing because it is a worker".
- _Events and the capstone_, the camps: "each camp whose tile is free rolls, seeded, whether a warrior enters on it" → "each camp whose tile is free rolls, seeded, whether an enemy enters on it".
- _Events and the capstone_, the capstone: "🔧 The schedule keeps dealing through the capstone's own turns — the fewest special rules until play says which feel best." → "🔧 The schedule keeps dealing through the capstone's own turns: the fewest special rules."
- _The chronicle screen_, the infopanel: "in move points, "Mv" before it, and a dash where nothing crosses the tile at all; "Mv" stands in until the look brings a movement glyph." → "in move points, and a dash where nothing crosses the tile at all."
- _The chronicle screen_, the aim: "a recall admits a card of the aim window, and a card aimed at the hand — none is written yet — would admit another card of the hand." → "and a recall admits a card of the aim window."
- _The chronicle screen_, the deal window: "how many warriors it enters, that it lays a hazard" → "how many enemies it enters, that it lays a hazard".

`docs/ages/NOMADIC.md`:

- The header's "A content page under [`DESIGN.md`](../DESIGN.md)'s legend and rule: the spec for this age's content, never edited down to match the code. The rules it is played by are [`CHRONICLE.md`](../CHRONICLE.md)'s, and this page repeats none of them. Every number — a cost, a yield, a stat, a share, a span, a count of copies — is tuning and stands nowhere on this page; the page says which resource a thing costs or gives, never how much." → "A content page under [`DESIGN.md`](../DESIGN.md)'s legend. The rules it is played by are [`CHRONICLE.md`](../CHRONICLE.md)'s, and this page repeats none of them; no number stands on it: the page says which resource a thing costs or gives, never how much."
- _The land_: "and the river gives its food along plain and forest as the rules say." → "and the river gives food along plain and forest."
- _The land_, after "a new player learns that hills are the lookout and forest the slow ground.", one sentence is added to the same paragraph: "Forest is raised, hills higher and mountain highest, and the rest lies flat; coast and deep water are crossed by nothing."
- _The cards_, Trapping: "inside the border at income, outside it through Gather. Kept on trial: it is the one card of the deck judged in play." → "inside the border at income, outside it through Gather."
- _The cards_: "the deck's size and the hand's are tuning." → "the deck's size is tuning."
- _The events_: the sentence "An event with more than two answers is content when it comes." is deleted.

**Doc-impact:** `DOGMAS.md`, `docs/DESIGN.md`, `docs/INTERFACE.md`, `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`; `workflow/IDEAS.md` gains the four lines.

**Scope:** In: the dogma line, the edits above, the four idea lines. Out: `docs/GLOSSARY.md` and `docs/index.md`, which the line does not name; the code, since every number a page loses already lives in `src/content/`; the 27 "was rejected" sentences, which are the one line of why the dogma allows; every terrain and biome name that illustrates a rule, which the user kept; _The launch page_ in `INTERFACE.md`, kept as it stands; the pitch's Prelude sentence and the graphics sentence in `DESIGN.md`, kept as design; the hand of five, kept as the rule's own number. Corner cases decided here: a `🔧` that marked a number alone goes with the number (the idle count, the elevation table, the river's terrains); one that marked the sentence stays (the centre part, the capstone's turns, Trapping). The pages' headers keep one clause pointing at `DESIGN.md`'s legend and lose the dogma they restated.

**Traps:**

- `HAND_SIZE` is a constant in `src/rules/chronicle.ts`, not content; that is why the five stays on the page and "the hand's" leaves the age page. Nothing in the code moves.
- Prettier 3.9.6 nests a quoted line that starts with a literal `>` one level per run; the page headers are quoted lines, so no literal `>` goes inside one.
- The glossary lint hook is advisory and fires on every edit under `docs/`; "warrior" is not a glossary word and "worker" is, which is why the warrior mentions become "an enemy" or "a unit" and the worker ones stay.
- `INTERFACE.md` → _The launch page_ still says "a stand-in for the meta's launch screen" and "the test suite's" after this line lands. That is the user's decision, not an oversight: the dogma forbids a stand-in's content and a stand-in label, not a screen naming what it stands for.
- The design page's default enemy script sentence ("moves toward the nearest") differs from the code's chooser; the user has ruled it is not a defect. Leave it.

**Plan:**

1. `DOGMAS.md`: the dogma line lands under _Docs_, after "Each doc owns one altitude".
2. `docs/DESIGN.md`, `docs/INTERFACE.md`, `docs/CHRONICLE.md`, `docs/ages/NOMADIC.md`: the edits above, each page left reading clean against the dogma.
3. `workflow/IDEAS.md`: the four idea lines appended under _Game_.
4. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run lint` passes. Then, over `docs/DESIGN.md`, `docs/INTERFACE.md`, `docs/CHRONICLE.md` and `docs/ages/NOMADIC.md`, a search for each of `when it comes`, `for later`, `none is written yet`, `the door is there`, `stands in until`, `is not settled`, `waits for the first`, `Kept on trial`, `until play says`, `not promised`, `farm`, `Sailing`, `ruin`, `trader`, `warrior`, `fertile plain`, `"Mv"`, `🔧 three`, `🔧 Two`, `half a move point`, `up to two rivers`, `zero to two`, `one food`, `see two tiles`, `never edited down`, `the rejected alternative is attractive`, `never keeps the old version` and `editing a page down` finds nothing, except `warrior` in `docs/ages/NOMADIC.md`, the age's own unit; and `stand-in` is found in `docs/INTERFACE.md` → _The launch page_ alone. No spec: the line touches no code.
