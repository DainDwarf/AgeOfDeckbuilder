# The pointer's answers renamed

**Line:** The pointer's answers renamed — in `src/ui/` and `e2e/` no identifier, comment or test title says "answer" for a thing on the screen reacting to an input, the family reading `Reactions`, `reactionsOf`, `reactionsOfNames`, `reactionsAround`, `Held.reactions`, `RowReactions` and `reactsToPress`; `npm run check`, `npm test` and `npm run lint` pass, and `e2e/browse.spec.ts` passes.

**Spec:** `docs/INTERFACE.md`, _The presses_ and the paragraphs after it, with `docs/META-SCREENS.md`, `docs/CHRONICLE-SCREEN.md`, `docs/MAP-SCREEN.md` and `docs/LOOK.md`: the pages already say that a thing on the screen **reacts to** a press, a click, the rest, the wheel or a key, and call a mark the screen draws back "the screen's reaction". The code follows them; no sentence of a page changes. No player-facing sentence is written or changed: this is a rename, and the player sees nothing of it.

The word, settled with the user: **react**, **reaction**. "Response" and "reply" are forbidden synonyms of **answer** and are never the replacement.

The names the user settled:

| Today | Becomes |
| --- | --- |
| `Answers` (`src/ui/stack.ts`) | `Reactions` |
| `answersOf` | `reactionsOf` |
| `answersOfNames` | `reactionsOfNames` |
| `answersAround` | `reactionsAround` |
| `Held.answers` (`src/ui/panel.ts`), and the same field on every type that feeds it | `reactions` |
| `RowAnswers` (`src/ui/infopanel.ts`) | `RowReactions` |
| `answersPress` (`src/ui/design-space.ts`) | `reactsToPress` |

Every other name holding the word in this sense follows the same word, its exact form the implementer's: the users of the family (`rowAnswersOf`, `ANSWERS_NOTHING`), the locals that hold a value of these types or of `RunNames` (in `plate.ts`, `tree.ts`, `piles.ts`, `browse.ts`, `overlay.ts`, `infopanel.ts`), the `answering` map of `design-space.ts`, the `answering` local of `hand.ts`, and the specs' `answered(page)` helper (`city-mode.spec.ts`, `inspect.spec.ts`, `yields.spec.ts`).

**Doc-impact:** none — the pages already read "reacts"; no page cites one of these identifiers.

**Scope:**

In: `src/ui/` and `e2e/`, the identifiers, the comments and the test titles. The sense that moves is one: **a thing on the screen responding to an input — a press, a click, the rest, the wheel, a key.** As a verb it becomes "reacts to" ("answers no press" → "reacts to no press", "answers the rest and the right click" → "reacts to the rest and the right click", "what a face answers the pointer with" → "what a face reacts to the pointer with", "marked as answering a press" → "marked as reacting to a press"); as a noun, "reaction" ("the face's answers" → "the face's reactions"). Where the press or the key is the subject, the screen or the thing takes its place, as the pages do: "The screen reacts to a press as it is let go", never "a press reacts".

Out, each left exactly as it stands:

- The glossary's **answer**, everywhere: the rules' and the content's `answers`, `answer-plate.ts`, `event-text.ts` and its keys, `offered.answer`, the stage kind `'answer'` in every `case`, the specs' `answers = offeredOn(…)`, `reference.spec.ts`'s `answering` (the name of an answer's plate).
- A function or a helper handing back a value: "answers whether one was", "answers the way to take it down", "`found` answers", "it answers true for a family the set does not hold".
- The rules answering: "the rules' answer", "the rules answer it", "the bubble a cost and a refusal answer with".
- A question answered: "is the map's to answer".
- The debug console: `Ran.answer`, `Line.answer`, `ANSWER_INK`, the console's comments, `console-line.test.ts`'s and `console.spec.ts`'s titles.
- What the page reads back to a spec: `e2e/chronicle-screen.ts`'s `answers` locals and "what the page answers of a name".
- `tools/` whole, `tools/sim.test.ts`'s `answersOf` and `goalAnswers` among it: a gambit's commands, another sense, the user's call.
- `src/ui/text.ts`, every entry: "Their band will answer in kind" is the player's text and is not this sense.
- `docs/` whole, `docs/PHASER.md` included, and `CHANGELOG.md`.
- `RunNames`, `PilePresses`, `Inspecting`: they hold pointer behaviour and no "answer" in their names; they keep them.

A sentence that could be read either way is read by its subject: a drawn thing or the screen, facing an input, moves; anything else stays. Each such call goes in the report, one line each, with the sentence as it now reads.

Reconcile: nothing in the tree says "react" today, so no standing name does this job and none is merged with. The three types that describe pointer behaviour — the `Answers` family, `RunNames`, `RowAnswers` — stay three types; this line changes names and no shape.

**Traps:**

- "answer" stands some 370 times in `src/ui/` and `e2e/`, and most of them are the glossary's. A replace over the word breaks the text keys (`'answer.share'`), the stage kind and the rules' types. Each occurrence is read.
- A symbol rename carries the identifiers and their users; it carries no comment and no test title, and those are half the line.
- `tools/sim.test.ts` declares its own `answersOf`, same spelling, another sense: a tree-wide search for the name finds it, and it stays.
- `answersPress` is called from 15 files of `src/ui/`; the cursor's hand on every screen rests on it.
- No behaviour changes, so no fact of `docs/PHASER.md` bears on the line; a diff that changes what a thing does under the pointer is a deviation to report, never part of the rename.
- A comment is reworded, never added: the line leaves as many comments as it found.

**Plan:**

1. `src/ui/stack.ts`, `panel.ts` and the family's users (`browse.ts`, `civilization-pile.ts`, `collection-stack.ts`, `collection-screen.ts`, `deck-panel.ts`, `overlay.ts`, `launch-screen.ts`): the family reads `Reactions`, the type checker passing.
2. `src/ui/design-space.ts` and the 15 files calling it: `reactsToPress`, the type checker passing.
3. `src/ui/infopanel.ts`, `plate.ts`, `tree.ts`, `piles.ts`, `hand.ts`: `RowReactions` and the locals.
4. The comments and the test titles of `src/ui/`, read one by one against the Scope's rule.
5. `e2e/`: the `answered` helper, the comments ("the cursor over something that reacts to a left click or a rest") and the titles.
6. A search of `src/ui/` and `e2e/` for `answer` in every form, each occurrence left being one of the Scope's "out" senses.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec is `e2e/browse.spec.ts`: it goes through the renamed family on a pile and on a browse's stacks, through the panel's held things and through the cursor's reading. CI proves the whole suite on the push, the hand on every screen resting on `reactsToPress`; the specs whose own text the line edits are `browse`, `civilization-mode`, `collection`, `deal`, `deck-editing`, `ending`, `hover`, `reference`, `city-mode`, `inspect` and `yields`.
