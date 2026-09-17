# The event is drawn on its due turn

**Line:** The timeline rolls the turn the next deal is due on and no longer its event: the event is drawn on that turn, from the timeline's generator, among the events that weigh anything on it and whose need — what an event may name of the chronicle to be dealt — is met on the chronicle as it stands, so no event is dealt that does nothing — held by rules tests on fixture events, and `docs/CHRONICLE.md` and `docs/GLOSSARY.md` say so.

**Spec:** `docs/CHRONICLE.md` → _Events and the capstone_.

Replace, in the first paragraph, from "The schedule is rolled a deal ahead into the chronicle's **timeline**" to "The player is never shown the timeline." with:

> The schedule is rolled into the chronicle's **timeline**, from a generator of the timeline's own that the opening seeds: the capstone's turn, and the turn the next deal is due on, rolled from the spacing by the landing before it. The event is drawn on that turn and no sooner, seeded and weighted, among the events that weigh anything on it and whose need is met: an event may name what it needs of the chronicle to be dealt, and one whose need is not met on its turn weighs nothing, so no event is dealt that does nothing. Nothing the player does steps that generator, so a seed deals on the same turns whatever is played, and the same events wherever the same ones can be dealt; and the chronicle has no last turn: the schedule deals for as long as the city stands. The player is never shown the timeline. An event drawn a deal ahead was rejected: what it needs would be read turns before it lands, and a deal that comes to nothing on its turn is a slot the player empties by making the event impossible.

Replace the second paragraph's opening two sentences — "Events are not announced: the player learns the next one when it lands. Announcing them is something a technology or a civilization's rule can grant." — with:

> Events are not announced: the player learns each one when it lands.

The rest of that paragraph, the capstone's exception, stands.

`docs/GLOSSARY.md`, the **timeline** row's meaning becomes:

> One chronicle's roll of its schedule, from a generator of its own: the turn the next deal is due on, and the capstone's turn; the event is drawn on its due turn. Internal: the player is never shown it, and learns each event when it lands.

No player-facing sentence.

**Doc-impact:** `docs/CHRONICLE.md`, `docs/GLOSSARY.md`.

**Scope:** In: the timeline carrying a due turn and no event; the draw moved to the events phase of the due turn; the optional need on an event; fixture events to test both; the tests and the two e2e helpers that read the timeline's next deal. Out: any content naming a need (Wildfire is the next line and the first to), a weight reading the chronicle — the schedule's weights stay functions of the turn, and the need lives on the event, said once whichever schedule deals it — and any UI.

Corner cases decided here:

- **The next due turn is still rolled in the events phase**, on the due turn, before the take — never at the take. The take happens on that same turn and the generator is the timeline's own, so the roll is the same either way, and one path serves a dealt event, a capstone's landing and a turn that deals nothing.
- **No event can be dealt on a due turn** — none weighs anything, or none's need is met: nothing is dealt, the existing `no-deal` path. It is a guard of the code, not a rule of the design, and no design page says it: a schedule is not expected to come to that.
- **The capstone's turn** lands the capstone alone, draws no event, and rolls the next due turn from it, as today.
- A need is read once, on the due turn, on the chronicle as the events phase finds it. It reads the chronicle and steps no generator.
- An event with no need is dealt as today, so no existing content changes.

**Traps:**

- **The timeline's generator is stepped the same number of times whatever the player does**: one draw for the event on every due turn that is not the capstone's, then one roll for the next due turn. The draw is made — its step taken — even on a due turn no need lets anything be dealt on; else the turns a seed deals on would follow the play, and the page says they do not. Where no event weighs anything by the turn alone, today's code draws nothing: that case is the schedule's and the same for every play, so it may stay as it is.
- **The order of steps does not change**: today it is capstone, due turn, event, due turn, event…; drawn on its turn it is capstone, due turn, event, due turn, event… So every seed deals what it dealt, on the turns it dealt, wherever every need is met — and no existing content names a need — up to the capstone's turn. The capstone's landing throws away the deal that stood ahead and rolls the next from its own turn: today that deal's event was already drawn, from now on it never is, so past the capstone a seed's steps sit one earlier and its deals may move. Before the capstone, the e2e specs' seed searches and the rules tests' seeds should hold as they are, and one that moves is a sign the order was broken, not a number to re-pick; past it, a moved seed is expected, and a spec that searches for its seed finds another by itself.
- `Timeline` in `src/rules/state.ts` says "a test hands one in to name the deal it wants on the turn it wants", and `schedule.test.ts`'s `dueOn(turn, event)` with a fixture helper do exactly that, eleven times. With no event on the timeline a test names the deal another way — the timeline already carries its schedule's id, so a fixture schedule of one entry is one — and how is the implementer's call.
- `e2e/deal.spec.ts` `dealRun` reads `timeline.next.event`; it plays to the deal right after and checks what is offered, so the read goes and the search holds. `e2e/camps.spec.ts` reads the due turn alone.
- The `no-deal` phase exists and the chronicle's stages, `hand`, `piles` and `map` handle it. No new phase name.
- Comments are for traps only: the `Timeline` docblock is rewritten to what is true, not grown.

**Plan:** `src/rules/state.ts` — `Timeline.next` is the due turn alone. `src/rules/catalogue.ts` — `ScheduledEvent` gains the optional need, a predicate of the catalogue and the chronicle. `src/rules/schedule.ts` — `timelineOf` and `rolledFrom` roll turns only; `events` owns both invariants: the draw on the due turn over weight and need, and the constant step count. `src/rules/fixtures.ts` — a fixture event with a need a test can fail and meet, and whatever names a deal for a test. Tests: a need unmet is never drawn while another event can be; a need met is drawn as any; nothing to deal deals nothing and leaves the generator where a deal leaves it; two chronicles of one seed played differently are due on the same turns. Then the e2e helper, and the two docs pages.

**Verify:** `npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/deal.spec.ts`.
