# The code says place for an improvement

**Line:** The code says place for an improvement — under `src/` and `e2e/` no identifier, comment or test title says improve, improved or unimproved as a verb, the refusal reason `improvement-laid` is `improvement-placed`, and no comment says lay of a thing on a tile; the two rules helpers are `improvementPlaced` and `improvementAbsent`, and the refusal's sentence reads as it did; `e2e/worker-instants.spec.ts` proves it.

**Spec:** `docs/GLOSSARY.md`, the row **place**: to put a thing onto a tile, an improvement among them; improve and lay are forbidden. No `docs/` sentence is added or changed. The names, settled with the user:

- the effect `improved` becomes `improvementPlaced`;
- the aim's check `unimproved` becomes `improvementAbsent`;
- the refusal reason `improvement-laid` becomes `improvement-placed`, and the text key `refusal.improvement-laid` becomes `refusal.improvement-placed`.

The one player-facing sentence, kept word for word: `'refusal.improvement-placed': 'That improvement is already here'`.

**Doc-impact:** none — the glossary already says place, and no page names a helper or a reason.

**Scope:**

- In: the two helpers in `src/rules/cards.ts` and every site that names them — `src/content/nomadic.ts`, `src/rules/fixtures.ts`, `src/rules/cards.test.ts`.
- In: the reason, in `src/rules/state.ts`, `src/rules/cards.ts`, the two expectations of `src/rules/cards.test.ts`, and the text key in `src/ui/text.ts`.
- In: the comments that say it — `src/rules/cards.ts` over the effect ("an instant lays"), `src/rules/map.ts` over `Tile` ("improved with"), `src/ui/map.ts` ("an improvement is improved onto it") — reworded with place.
- In: the test titles that say it — three in `src/rules/cards.test.ts` ("the mine card improves…", "a mine improved onto a tile…", "the road card improves…") and one in `src/rules/map.test.ts` ("the generator improves nothing…") — reworded with place; what each test asserts does not move.
- In: the test helper `improvedWith` in `src/rules/units.test.ts` and the local `improved` that names the map's group of improvement marks in `src/ui/map.ts`; each takes a name holding no forbidden word, the implementer's to choose. The group's own name on screen, `'improvements'`, stays: specs read it.
- In: the comment over `terraformed` in `src/rules/cards.ts`, "the feature that lay on the old terrain": it is the past of lie, but reads as lay of a thing on a tile to a search, and is reworded.
- Out: lay, lays and laid said of a card put on a pile — the rules helper and the change `laid`, the `'laid'` cases in `src/ui/`, the comments and test titles that say an event or a reward lays a card, `e2e/chronicle-screen.ts`'s "the card the capstone's landing lays" — and the design pages that say so. The user ruled that this is a line of its own, which stands at the end of the board.
- Out: lay said of layout — "laid out", `lay()`, `layGrid`, a local `laid` holding a layout. It is not gameplay vocabulary.
- Out: "lies on", of the terrains a building, an improvement or a camp goes on. It is lie, not lay.
- Out: `CHANGELOG.md`, which a rename sweep skips.
- Corner, decided: a bare `placed` was rejected for the effect: it reads as placing a unit or a camp and takes an improvement alone.
- Corner, decided: the refusal's sentence keeps its wording; "is already placed here" was rejected as longer and no clearer.

**Traps:**

- The reason is a member of the closed union `TileBlock`, and the text table is keyed on it as `refusal.<reason>` through a template: the union member and the text key change together, or the refusal throws at the first draw. The catalogue's and the text's coherence tests catch a miss.
- A save holds no reason and no helper name: nothing in the save format moves, and no save version changes.
- `schedule.ts` and `map.ts` already hold `placed` as a field and a local, of camps. The new names do not collide with them, and those stay.
- `src/ui/text.ts` is under the glossary lint hook; the sentence kept holds no forbidden word.
- The line ahead of this one moves where the specs read a refusal's lines from; this one ships after it and touches no spec's composition.
- Comments are for traps only: each docblock touched is shaved as it is reworded.

**Plan:**

1. `src/rules/` — the two helpers and the reason carry their new names, in `cards.ts` and `state.ts`, with the comments of `cards.ts` and `map.ts` reworded; `fixtures.ts` and the tests follow, their titles and the helper of `units.test.ts` included. `npm run check` and `npm test` pass.
2. `src/content/nomadic.ts` names the new helpers.
3. `src/ui/` — the text key follows the reason in `text.ts`; the local and the comment of `map.ts` are reworded.
4. The searches of Verify match nothing.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Two searches under `src/` and `e2e/`, each matching nothing: `\b(improve|improves|improving|improved|unimproved|improvedWith)\b`, and `improvement-laid`. A third, `\b(lay|lays|laid|laying)\b`, read hit by hit: every hit left is of a card put on a pile or of layout. The proof spec: `npx playwright test e2e/worker-instants.spec.ts`. CI's on the push: `e2e/refuse.spec.ts`, `e2e/inspect.spec.ts`.
