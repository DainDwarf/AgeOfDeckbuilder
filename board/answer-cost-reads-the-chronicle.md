# An answer's cost reads the chronicle

**Line:** **An answer's cost reads the chronicle** — an answer declares its cost as a flat price or as a reading of the chronicle; the deal window shows, the refusal weighs and the take pays the one price read on the chronicle as it stands; the catalogue still refuses an event with no answer of a flat price of nothing; `npm test`, `npm run check` and `npm run lint` pass, and so does `e2e/deal.spec.ts`.

**Spec:** [`docs/CHRONICLE.md`](../docs/CHRONICLE.md) → _Events and the capstone_. Two edits in its first paragraph, nothing else on the page:

- After "An answer the city cannot pay for is unaffordable and is not taken;" the sentence about the free answer becomes: "every event carries an answer that costs no stock whatever the chronicle, the one whose cost is the harm itself, so a deal is never empty."
- Right after "The player takes one; it pays its cost, then lands on the chronicle as it stands." add: "An answer's cost may read the chronicle; the deal shows it as the chronicle stands, and the take pays that."

No player-facing sentence is foreseen: no text-table entry changes, no answer changes its price.

**Doc-impact:** `docs/CHRONICLE.md`.

**Scope:**

- In: the declaration of an answer's cost, the one function that reads it, its three readers (the refusal, the take, the answer's face in the deal window), the catalogue's free-answer check, one fixture answer whose cost reads the chronicle, one mechanism test, the catalogue test's free-answer case.
- Out: a card's cost stays a flat price — no card's price moves, and widening it is the user's to order. No real content changes: every answer of `src/content/nomadic.ts` and `src/content/stand-in.ts` keeps its flat price as written, which the new declaration still accepts. Departure, the first answer to use a reading, is the next line and none of it lands here.
- Decided: a cost is **either** a flat price **or** a reading (a closure over the catalogue and the chronicle, as `reads` and `lands` are) — the user chose the two shapes over making every cost a closure, so the free answer stays a flat fact checked when the catalogue is built. A reading never counts as the free answer, even one that would come to nothing on some chronicle. A flat price of nought of a stock (`{ food: 0 }`) still counts as free, as today.
- Decided: a reading that comes to nothing on the chronicle costs nothing there — no cost chip, never unaffordable. Nothing special: it is what the flat path already does with an empty price.

**Traps:**

- The refusal is asked on the chronicle with the deal standing; the take pays on the chronicle the deal was popped from. Both must go through the same function, and nothing else may read an answer's cost field: `src/ui/card-face.ts` reads it directly today.
- The catalogue's check runs when the catalogue is built, with no chronicle: it must not call a reading. It tells the two shapes apart and counts only a flat one.
- `src/ui/` only renders: the face asks the rules for the price, it does not tell the shapes apart itself.
- Closures live on content, never in the state; the price is read each time, never stored on the deal.
- Comments are for traps only: no docblock retelling a signature.

**Plan:**

1. `src/rules/catalogue.ts` — `Answer`'s cost becomes the flat price or the reading; the free-answer check in `catalogued` counts flat prices only.
2. `src/rules/schedule.ts` — one exported function, beside `answerOf`, answers what an answer costs on a chronicle, as the `Cost[]` the refusal and the face already speak. It owns the invariant: `answerRefusal` and `answered` go through it.
3. `src/ui/card-face.ts` — `answerFace` takes its costs from that function, with the chronicle it is already handed.
4. `src/rules/fixtures.ts` — one fixture event, or one more answer on an event already there, whose cost reads the chronicle on a number of the fixture's own (a stock price equal to the population, say), beside a flat free answer.
5. Tests: one mechanism test in `src/rules/schedule.test.ts`, through `apply` and the take — the same answer is unaffordable on a chronicle its reading outprices and, on one it does not, the take pays exactly what the reading says there. In `src/rules/catalogue.test.ts`, the free-answer test gains the case of an event whose only costless answer is a reading coming to nothing: refused.
6. The `docs/CHRONICLE.md` edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`, and `npx playwright test e2e/deal.spec.ts` — the deal window's cost chip and unaffordable answer must read as before.
