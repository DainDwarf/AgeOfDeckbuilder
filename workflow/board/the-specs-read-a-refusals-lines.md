# The specs read a refusal's lines from the game's one function

**Line:** The specs read a refusal's lines from the game's one function — no file under `e2e/` builds a `refusal.*` text itself: `e2e/refuse.spec.ts`, `e2e/deal.spec.ts` and `e2e/city-mode.spec.ts` read what a refusal note says from the two functions the game says it with, which stand in a module that loads without Phaser, and one Vitest test beside them holds the rule — of what a thing costs, only what the city cannot pay, then what stands in the way; `e2e/refuse.spec.ts` proves it.

**Spec:** no `docs/` page is the spec and none changes. The rule the unit test holds is the one the game's function already states: a refusal note says, of what the refused thing costs, only the resources the city cannot pay, in the order the cost reads them, then each thing standing in the way, in the order the refusal reads them. No player-facing sentence is added or changed.

**Doc-impact:** none — no page states where the note's lines are composed, and what the player reads does not move.

**Scope:**

- In: the two functions that compose a note's lines — the one over anything refused that carries a cost, the one over a tile an aim refuses — stand in a module a spec and a Vitest test can import; the game's three callers (`src/ui/hand.ts`, `src/ui/overlay.ts`, `src/ui/chronicle-scene.ts`) read them from there.
- In: the four sites in the specs. `e2e/refuse.spec.ts`'s own composition of a card's reasons, and its one hand-built line for an aim's refusal; `e2e/deal.spec.ts`'s composition of an unpaid answer's lines; `e2e/city-mode.spec.ts`'s hand-built culture line for a claim the city cannot pay for, which reads the game's function on the tile's cost and the tile's refusal from the rules, as the chronicle scene does.
- In: one Vitest test, on a cost and a refusal of its own: a cost of two resources of which one is unaffordable, and one thing standing in the way; it expects the unaffordable resource's line, then the block's line, and nothing for the resource the city can pay.
- Out: the bubble, its placement and everything the note draws. No spec assertion is added, removed or loosened: each expectation keeps its shape and only changes where its lines come from.
- Corner, decided: the user ruled that this is not a render reshaped for a test. It is the cut of pure UI apart from Phaser, taken now because it bites now.
- Corner, decided: where a spec helper the old line used is left with no caller after the change, it is deleted with it.

**Traps:**

- `src/ui/refusal-note.ts` cannot be imported by a spec or a Vitest test as it stands: it imports `src/ui/design-space.ts` and the type of `src/ui/map.ts`, and `design-space.ts` imports Phaser at run time, which throws `window is not defined` in Node. The module the two functions stand in imports no Phaser and nothing that does; `src/ui/text.ts` is safe, its imports being types alone. `src/ui/face.ts` with `face.test.ts` and `e2e/reference.spec.ts` is the precedent.
- The done-condition is a search: `refusal\.` inside a `text(` call matches nothing under `e2e/`, and under `src/` matches only the module the two functions stand in.
- The unit test's sentences come from the game's text table through `text`, never a literal: the rule it holds is which lines are said and in what order, not their wording.
- `e2e/city-mode.spec.ts`'s refused tile is one the city does not hold; the rules' refusal for a tile answers `undefined` where the city has no act on it, and the spec throws on that as its siblings do on a fixture that does not hold, rather than expect nothing.
- Comments are for traps only: the docblocks the two functions carry move with them, shaved where they paraphrase.

**Plan:**

1. `src/ui/` — the two functions and the type of what a note says stand in a Phaser-free module; `refusal-note.ts` keeps the bubble. The game's callers import from the new home. `npm run check` passes and the game says what it said.
2. The Vitest test stands beside the module and passes.
3. `e2e/refuse.spec.ts`, `e2e/deal.spec.ts`, `e2e/city-mode.spec.ts` read their expected lines from the two functions; imports left unused go.

**Verify:** `npm run check`, `npm test`, `npm run lint`; the search of the second trap. The proof spec: `npx playwright test e2e/refuse.spec.ts`. CI's on the push: `e2e/deal.spec.ts`, `e2e/city-mode.spec.ts`.
