# The stage tree is written

**Line:** The stage tree is written — the Stack paragraph of `docs/DOGMAS.md` on `apply` says the two products, the row grain, the tree, and the Code section holds the line that every helper answers its changes and the caller groups them. Doc-impact: `docs/DOGMAS.md`.

**Spec:** `docs/DOGMAS.md` alone; the design it writes is the _The design_ section of `BRANCH.md`. Two edits, both written out here.

In → _Stack_, the first bullet under the table, the sentence beginning "The game is one pure function" is replaced by:

> The game is one pure function, `apply(catalogue, state, command) → stages`, with two products: the state the command leaves and the flow of changes that led there. The state is what is drawn and what a command's legality is read on; the flow is what listens to it plays — the chronicle screen's animations, a simulator's log — and what a closure may read to branch on what its own helper did. The flow is a tree of **stages**, every one carrying the chronicle it leaves. A **change** is one row of the chronicle moved — a unit, a tile, the stock, the population, a pile, the turn, the timeline, the deals, the ending; a card carries no identity, so the piles are the rows and one movement between them is one change however many cards it carries — named for the fact that moved, its direction and amount read off the chronicles before and after, and carrying only what those cannot say: the tile, the two ends of a crossing. A **group** is a name for why, over stages, carrying what the link needs, the attacker and the target; a command resolves as at least one stage, and a refusal is a group holding nothing, the name being the fact. The change names and the group names are the closed sets `src/rules/stages.ts` holds.

In the same bullet, the sentence beginning "Why stages and not the state alone" is replaced by:

> Why two products: what happened — which tile attacked which — is not in the state that follows it. Why rows: the vocabulary is the chronicle's own and no listener's, so it holds whatever comes to listen.

Every other sentence of the bullet stands as it is. In → _Code_, after the bullet beginning "An aim predicate and an effect closure are pure over the chronicle", one bullet is added:

> - **A rules helper that changes the chronicle answers the changes it raised**, none where it moved nothing, and so does every closure content composes them into; the caller groups what it is handed under the name of why, and never drops a change. Two helpers for one change, one answering the chronicle and one the changes, is the shape this forbids. Why: a listener can only play what reached it, and a change dropped on its way up is a snare for the next thing that listens.

**Doc-impact:** `docs/DOGMAS.md`.

**Scope:** In: the two edits above, verbatim. Out: every other page — the change and group vocabularies are code, held in `src/rules/stages.ts` by the lines after this one, and no `docs/` page lists them; `docs/CHRONICLE.md` changes nothing, its rules being unchanged; the glossary changes nothing, a stage being a development internal outside it. The code stays as it is: this line makes the dogmas disagree with the code on purpose, and the three lines after it make the code agree.

**Traps:** A paragraph is one line — no hard wrap; `npm run lint` refuses a wrapped one. The Stack bullet is one long line holding several sentences; only the two named sentences change, and the catalogue sentences between them stay word for word. The Code bullet's _Why_ follows the section's shape: one clause, only because the alternative is attractive.

**Plan:** `docs/DOGMAS.md`, the two edits, in one pass. Nothing else.

**Verify:** `npm run lint`. No spec: nothing on screen changes.
