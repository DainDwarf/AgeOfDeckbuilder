# An event names what it needs

**Line:** An event may name what it needs of the chronicle to be dealt: on its due turn an event whose need is not met is not dealt, nothing is dealt that turn, and the next deal is rolled from that turn — held by a rules test on a fixture event, and `docs/CHRONICLE.md` says so.

**Spec:** `docs/CHRONICLE.md` → _Events and the capstone_. Add, after the sentence "An answer the city cannot pay for is unaffordable and is not taken; every event carries an answer that costs no stock, the one whose cost is the harm itself, so a deal is never empty.":

> An event may name what it needs of the chronicle to be dealt, read on its due turn: one whose need is not met is not dealt, nothing is dealt that turn, and the next deal is due from that turn as from any landing. The timeline is rolled as ever, on the turn alone, so a seed still rolls the same events whatever is played; what the player does decides only whether one of them finds what it needs. A weight reading the chronicle was rejected: the events a seed deals would follow where the city settled, and it would be read a deal ahead of the turn it matters on.

And in _The turn_, step 1, after "On a due turn the schedule deals one of its events and that event deals its answers as cards": no change — the step already reads right for an event that is dealt, and the need lives in the events section alone.

No player-facing sentence: a turn that deals nothing already plays out as one.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:** In: the optional need on an event, read by the events phase on the due turn; the fixture event that carries one; the rules tests. Out: any content using it (Wildfire is the next line, and the first to), any weight reading the chronicle, any UI — the `no-deal` stage exists and is played out already. Corner cases decided here: the capstone's turn still lands the capstone alone, whatever was due and whatever it needed; a need is read once, on the due turn, on the chronicle as the events phase finds it, and never when the timeline is rolled; an event with no need is dealt as today, so no existing content changes; the need draws nothing — it reads the chronicle and steps no generator, neither the chronicle's nor the timeline's.

**Traps:**

- The timeline is rolled a deal ahead from its own generator and `docs/CHRONICLE.md` holds that "nothing the player does steps that generator": the unmet need must leave the timeline's generator exactly where a dealt event would — one `rolledFrom` from the due turn, as the existing `no-deal` path does — or every later deal of the seed shifts.
- The `no-deal` phase already exists for a due turn whose schedule weighed nothing; the chronicle's stage list and three UI switches (`hand`, `piles`, `map`) already handle it. Reuse it; a new phase name would have to be threaded through all of them.
- Comments are for traps only: no docblock retelling a signature.

**Plan:** `src/rules/catalogue.ts` — `ScheduledEvent` gains an optional need, a predicate of the catalogue and the chronicle. `src/rules/schedule.ts` — `events` owns the invariant: on the due turn, an event whose need fails takes the `no-deal` path. `src/rules/fixtures.ts` — one fixture event with a need a test can fail and meet (the upheaval's tile is there to read). `src/rules/schedule.test.ts` — the need unmet deals nothing and rolls the next deal from that turn, with the timeline's generator where a dealt event leaves it; the need met deals as any event.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No e2e spec: nothing on screen changes.
