# The Nomadic events

**Line:** The Nomadic events — A rival band deals Make room, placing its camp or raiding where no tile takes one, and Show your spears, military paid; Cut a firebreak costs as much production as the fire takes in food; both measured on the whole-game Nomadic cell with the rival band's answer fixed each way, the persona's own rows standing as the events baseline's first Nomadic folders. Doc-impact: `docs/ages/NOMADIC.md`.

**Spec:** `docs/ages/NOMADIC.md` _The events_ and _The camps_; `docs/CHRONICLE.md` _The schedule_ for what an answer may declare and how a camp an answer places is drawn; `docs/ages/STONE.md` _The events_ for what the Stone Age deals of the band's.

The rival band's bullet in _The events_ becomes:

> - **A rival band.** _Make room_: a new camp is placed near the player's city with its guards on and around it, one at first — a door for the raids to come, and a capture with its rewards for a band bold enough; where no tile takes a camp, the same warriors enter the map as one raid and come, and the answer reads whichever of the two stands. _Show your spears_: military paid, more on a later turn, and the band goes elsewhere. A rival band is military now against a camp beside the player's city for good.

The section's opening sentence on escalation, "a later rival band is larger either way", becomes "a later rival band is larger and dearer to turn away". The section's closing line becomes:

> Lean season is food against a raid, a rival band is military now against a camp for good, and Wildfire is food against production.

The Wildfire bullet stands as written: the page names no number, and the firebreak's price is tuning.

In _The camps_, the sentence naming what enters becomes:

> The chronicle opens with a guard on each camp, the camp's roll enters a guard, Lean season's _Keep to yourself_ enters raiders, and the rival band's _Make room_ enters guards, or raiders where no tile takes a camp.

The player-facing entries, in `src/ui/text.ts`, the `fight` pair deleted with its glossary-exception comments:

- `answer.make-room`: `Make room` (unchanged)
- `answer-rules.make-room.camp`: `A [building:{camp}] with {warriors} [enemy:warrior] is placed near your [building:{building}]`
- `answer-rules.make-room.raid`: `Your [building:{building}] is attacked by {warriors} [enemy:warrior]`
- `answer.show-your-spears`: `Show your spears`
- `answer-rules.show-your-spears`: `Pay {military}[military]`

The lore entry stands. The event's answers are dealt in this order: Make room, then Show your spears, the free answer first as Wildfire's and Lean season's are.

**Doc-impact:** `docs/ages/NOMADIC.md` — _The events_ and _The camps_ as above. `docs/ages/STONE.md` stands: "It deals A rival band and The herd as the band knew them" stays true. `workflow/EVENTS.md` is ephemeral and is edited, not doc-impact: its Nomadic paragraph names the two fixed answers `rival-band:show-your-spears` and `rival-band:make-room`, and the baseline's Nomadic folders `<persona>-nomadic-age`, since `<persona>-nomadic` is the economy pass's name for the nomadic deck on the Stone Age.

**Scope:**

In:

- A rival band loses Fight them and gains Show your spears. Make room declares two cases, `camp` and `raid`, names `camp` where a tile takes a camp, apart from every camp standing as today, and `raid` otherwise, and lands through the camp-or-raid helper the Stone Grievance's Escalate lands through, with the same count as today: one warrior, and one more for every ten turns. It is blocked by nothing, so it is the event's free answer. Show your spears costs military read off the chronicle, 2 for each warrior the band would be on that turn, the Warrior card's price per warrior, so 2 on the first deal and 2 more for every ten turns; it reads that cost and lands the chronicle unchanged, as Cut a firebreak and the Grievance's Send gifts do.
- Cut a firebreak's production cost becomes what Let the fields burn takes in food on the same turn: 2 at first and 2 more for every five turns. The two numbers match as a trial; the firebreak keeps a function of its own, since the two are not one fact.
- Both changes reach the Stone Age as they are: the Stone schedules deal `rival-band` by its id and the Stone Wildfire builds its Let the fields burn and Cut a firebreak from the Nomadic answers themselves. Decided at intake; the Stone Wildfire's own balance is its line's.
- The measurement, the whole-game Nomadic cell of `workflow/EVENTS.md`, both personas, seeds 1 to 20, `--every 1`, run three ways per persona: the persona's own choice, and the rival band's answer fixed to `show-your-spears` and to `make-room`. The own-choice rows are committed under `workflow/events/builder-nomadic-age/` and `warlord-nomadic-age/`, one file per five seeds, as the baseline's first Nomadic folders; the fixed cells stay in the scratchpad and are reported at the hand-back as one table over the six cells: the endings with their causes and counts, the capture turn's median and first, the rival band's deals taken, and the enemy warriors standing at the end. The same cells at this intake, on today's content, read 16 and 15 captures of 20 under Fight, none under Make room.

Out:

- Lean season and The herd stand as they are.
- The first raid's one warrior capturing a band that has no military before turn 10: not this line's; the user may `/todo` it.
- The persona's deal gambit: unchanged. Show your spears' trial raises no enemy and qualifies, so the persona takes it whenever it can pay and Make room otherwise, as a player would.

Corner cases decided here:

- A rival band dealt while no tile takes a camp: the raid case, the same warriors entering as a raid through the raid's door. No deal was refused in 75 at this intake, so the case is rare and real.
- Show your spears while the military stock falls short: unaffordable, not chosen, as any paid answer; Make room is the deal.

Reconcile: Make room's camp-or-raid goes through the Grievance Escalate's helper as it is, the case naming reading the camp-placeable question as Escalate's does; Show your spears is the firebreak's shape, a cost read off the chronicle and an unchanged landing, nothing to reshape; the band's count stays the one function Lean season's Keep to yourself reads, Show your spears' price reading it too.

**Traps:**

- The catalogue refuses an event with no answer that costs nothing and is blocked by nothing (`src/rules/catalogue.ts`); with Fight gone, Make room must carry no `blocked`, which is why it declares cases instead.
- A case's text is read by the coherence test for every declared case, keyed `answer-rules.<answer>.<case>`, so both case entries must stand or `npm test` fails at the catalogue.
- The camp-or-raid helper lives in `src/content/scripts.ts`, which `src/content/nomadic.ts` already imports from; the raid case draws the age's camp's raider script, the Nomadic one.
- `nomadicAnswer` in `src/content/stone.ts` hands the Nomadic answers to the Stone Wildfire by reference, so the firebreak's new price is the Stone Age's with no edit there; the Stone schedules name `rival-band` in two entries, which stay.
- The glossary lint hook flags `fight` without its exception comment; the deleted pair takes its comments with it, and no new entry needs one.
- A persona never names an event or an answer; `--answer rival-band:show-your-spears` is the cell's knob, and a fixed answer refused stops the chronicle as stuck, which with Make room blocked by nothing can only be Show your spears unaffordable, the stop then being the reading.
- The sim skill's split runs parts of five seeds; four Nomadic cells of 20 seeds took 117 s at this intake.

**Plan:**

1. `src/content/nomadic.ts`: the rival band's answers replaced, Make room with its cases and the camp-or-raid landing, Show your spears with its cost and reading; the firebreak's price lowered; imports shaved to what is used.
2. `src/ui/text.ts`: the `fight` pair deleted, the Make room rules entry replaced by its two case entries, the Show your spears pair added.
3. `docs/ages/NOMADIC.md`: the Spec's sentences.
4. `workflow/EVENTS.md`: the Nomadic paragraph's fixed answers and folder names.
5. `npm run check`, `npm test`, `npm run lint`.
6. The measurement: the six Nomadic cells through the sim skill's split, the own-choice folders into `workflow/events/`, the table for the hand-back.
7. `workflow/BOARD.md`: the line deleted. One commit: the content, its measurement, the page.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec: none — the line reaches the screen only through text entries the coherence test reads. CI proves on the push: `e2e/wildfire.spec.ts`, which deals the Stone Wildfire and reads Let the fields burn off the rules, and the rest of the suite.
