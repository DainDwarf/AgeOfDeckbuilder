# A chronicle begins answering its changes

**Line:** `beginChronicle` answers the stages it raised beside the chronicle they leave — one `enter` per camp in tile order, the guards those entered, then the `reached` changes of the achievements met at the launch — `launched` passes them on, the chronicle screen logs a runtime-error among them to the console as it logs a command's, and one rules test on the fixture holds the shape.

**Spec:** `DOGMAS.md` → _Architecture_: "A rules helper that changes the chronicle answers the changes it raised, none where it moved nothing … Two helpers for one change, one answering the chronicle and one the changes, is the shape this forbids." and "One change moves no row: `runtime-error` … answered in place of the change it could not make, and play goes on wherever it can." The opening today keeps the chronicle off each guard's entry and off each achievement reached and drops the changes: the forbidden shape. No `docs/` sentence changes and no player-facing sentence is foreseen: the design pages state nothing about the flow, and the dogma is stated once, on no page.

**Doc-impact:** none — the rule is a dogma, the design pages say nothing about the flow, and nothing the player sees changes.

**Scope:**

- In: the opening answers its stages and the chronicle they leave; the launch passes them on; every caller reads the chronicle off the answer; the chronicle screen's launch logs every runtime-error among the stages and stands on the chronicle, as today; the logger reads a change wherever it stands, inside a group or outside one, and names the group where one holds it.
- Out: playing the opening's stages out on the screen — the guards enter on uncharted camps the map does not draw, a `reached` has no motion on any part, and the screen's parts are not built when the chronicle begins; a group name for the opening — a group over the whole of an answer names nothing, and a new member would reach six exhaustive switches that never play it; any `docs/` edit.
- Corner cases decided here: an opening on a map with no camp and no achievement met raises no stage, and the answer carries the chronicle beside the stages, as every landing does — nothing reads the last stage's chronicle off an empty list. Every stage's chronicle is charted as a command's stages are charted, so the chronicle the answer leaves is the last stage's wherever a stage stands and is the very chronicle the launch answers today — the existing launch tests hold through it unchanged in what they assert. Nothing today raises a runtime-error at the opening — a guard's entry, the charting and an achievement's count all answer without one — so the console half is wiring, read in review, and no test fakes a change to reach it.
- Reconcile: the console's `unit` entry already raises stages outside a command and plays them through the screen's play-out, which logs. The opening goes through the same logger as it is; the difference that is meant, and the only one, is that the opening's stages are not played out.

**Traps:**

- The screen's logger skips every change outside a group, on a comment saying content only runs inside one. The opening's changes stand in no group, so left as it is the logger would skip a runtime-error among them silently and the line would be false. The comment goes with the skip.
- `outcome` reads the last stage's chronicle and fails on no stage; the fixture that opens on a bare field raises none.
- `launched` is read by the scene, by `src/rules/fixtures.ts`, by the rules tests and by `src/content/catalogue.test.ts`, every one taking the chronicle today; `beginChronicle` by the fixture's `opening` and one catalogue test. None in `e2e/` or `tools/`.
- A camp's entry answers nothing where no kind of its opening table stands on its tile; such a camp is refused when the catalogue is built, so every camp raises one `enter`.
- The scene begins its chronicle in `init`, before `create` builds the parts, so no play-out can run there; the console's `seed` entry launches through the same path, by restarting the scene.
- `src/ui/` never mutates state and reads the catalogue only in a scene's own methods (`DOGMAS.md` → _Stack_); `docs/PHASER.md` is not touched by this line.

**Plan:**

1. `src/rules/chronicle.ts`: the opening answers its stages — the guards entered, every stage charted as a command's are, then the achievements reached — beside the chronicle they leave, and the launch passes the answer on; `src/rules/fixtures.ts`, the rules tests and `src/content/catalogue.test.ts` read the chronicle off the answer. Leaves `npm run check` and `npm test` green with the launch tests asserting what they assert today.
2. `src/rules/chronicle.test.ts`: one test on the fixture — an opening on a map with camps answers one `enter` per camp in tile order and the guards those entered, then the `reached` changes of the achievements met at the launch, each stage's chronicle charted and the last one's the chronicle the answer leaves; an opening on a map with no camp and nothing met answers no stage and the chronicle. The test on an achievement met at the launch may assert its `reached` is answered. Leaves `npm test` green.
3. `src/ui/chronicle-scene.ts`: the launch logs every runtime-error among the stages and keeps the chronicle as the save, as today; the logger reads a change inside a group or outside one. Leaves `npm run check` and `npm run lint` green.
4. `workflow/BOARD.md`: the line deleted.

**Verify:** `npm run check`, `npm test`, `npm run lint`. The proof spec: `npx playwright test e2e/launch.spec.ts` — Launch opens the chronicle the rules launch, and nothing is logged. CI proves on the push every spec that launches a chronicle, `settle.spec.ts`, `console.spec.ts`, `camps.spec.ts` and `resume.spec.ts` among them.
