# Cut `src/ui/map.ts`

**Line:** **Cut `src/ui/map.ts`** — the map's one file is cut by concern into modules, each behind a door narrower than what it hides, nothing renamed and the game unchanged. Doc-impact: none.

**Spec:** no `docs/` page states the file's shape; the spec is `DOGMAS.md` _Code_ — Locality first (a module is extracted only behind an interface much narrower than what it hides; layering ceremony is the anti-pattern), KISS is trap avoidance, Single source of truth for facts, Comments are for traps only — and _Stack_ (a game object is made once and changed in place; every function under `src/ui/` outside a scene receives the catalogue as an argument). No player-facing sentence; no `docs/` sentence.

**Doc-impact:** none — no page cites the file, and the layout in `DOGMAS.md` names `src/ui/` as a whole.

**Scope:**

In: code moved out of `src/ui/map.ts` into modules by concern; the constants and types each module alone reads going with it; the import paths of `src/ui/infopanel.ts`, `src/ui/refusal-note.ts` and `src/ui/chronicle-scene.ts` following the exports they use; the comment blocks the hook flags on the move re-shaved to their trap. One commit.

Out: any behaviour change; any rename of a named game object or of a layer; any change to what the scene's door (`MapView` today) means; a size cap of any kind — the user struck a number from the done-condition, since a number bends the cut rather than making it logical; `src/ui/chronicle-scene.ts`, `e2e/` and the rules.

The shape the brief suggests, where a function lives being the implementer's and the report naming the shape chosen:

| Module | What it holds | ~lines |
| --- | --- | --- |
| the map, as is | the state, what is drawn of a chronicle, the paints, the render, the door the scene uses | 820 |
| the marks | how a tile's face, a building, a feature, a river, an improvement, a unit on its hull, a diamond, the badge and the threshold are drawn; what the infopanel already imports | 460 |
| the motion | the stage plays: slide, lunge, bump, shrink, arrival, a tile changing between two faces | 440 |
| the camera | the frame: pan, zoom, the hold on a stage's tiles, the press that pans, the catcher zones | 260 |
| the hold | what a left press takes: a unit or population dragged, let go, slid home, the command it becomes | 220 |

Corner cases decided here: a constant two modules read has one home, exported by the module that owns the concept; a type two modules need is exported by the one that owns it, never declared twice; a module that needs one of the closure's states reads it through a function the owner hands it, never a second variable. The implementer may cut otherwise than the table where the rule — a door much narrower than what it hides — says so, and reports the shape.

Reconcile: the mark constructors stay apart from `src/ui/marks.ts`, which keeps the tables of corners and colours alone. The difference is meant: `src/content/catalogue.test.ts` reads those tables in Node, Phaser-free, and the constructors are Phaser — the split the tree keeps between its layout module and its drawing.

**Traps:**

- The closure shares mutable state its parts read and write: the chronicle shown; what is drawn, live and charted; the zoom and the centre; the selection and the unit lit; the city marks' and the overlay's switches; the threshold; what a press holds; the motion token in flight; the veils. A seam that leaves two files writing one of these is a trap, not a cut. Each has one home.
- Twenty-five specs read the map's objects by name — `tile-`, `unit-`, `unit-dim-`, `fog-`, `population-`, `feature-`, `building-`, `improvement-`, `prepared-`, `yield-` and the plain `press`, `aim`, `river`, `rim`, `claimable`, `assigned`, `city-dim`, `threshold`, `yield-dim`, and the layers' names. Nothing is renamed and no name moves to another object.
- A new module under `src/ui/` takes the catalogue as an argument from its caller and never imports `src/content/` (`DOGMAS.md` _Stack_).
- The comment hook flags five blocks of four and five lines when they move, measured by running the hook over the whole file as a Write. Each is cut to its trap or the report says why it stays. The blocks that are traps cite `docs/PHASER.md` and travel with the code they guard: the stroked diamond coming out open, the hit test run in a microtask after the release's dispatch, the cropped camera cut in `place` alone, the resize subscription made after the map scene's own.
- Both resize subscriptions are made at construction, so the order the modules are built in is the order they hear a resize; today the camera's placement is subscribed before the texts' re-rasterisation, and both after the map scene's own.
- No Vitest test covers the file; none moves, and the move adds none.
- The rim and the catcher zones are added to the terrain stratum's layer directly, the yield dim to the dim stratum's: `MapStrata` in `src/ui/map-scene.ts` is the door to the strata, and nothing is drawn outside it.
- Phaser is read, never remembered: `docs/PHASER.md`, then `node_modules/phaser/skills/`.

**Plan:**

1. The marks out of `src/ui/map.ts` into a module of their own, with the placeholder constants they alone read; `src/ui/infopanel.ts` and `src/ui/refusal-note.ts` import from where the exports now stand. Leaves the typecheck green and the game unchanged.
2. The camera out, with the pan and zoom constants. Leaves the same.
3. The motion out. Leaves the same.
4. The hold out. Leaves the same.
5. What is left in `src/ui/map.ts` re-read once: a constant or a type one module alone uses goes with it, a flagged comment is shaved, and nothing is declared twice. Leaves every check green.

**Verify:** `npm run check`, `npm run lint`, `npm test`. The proof spec: `npx playwright test e2e/map.spec.ts`. CI proves on the push every spec that opens a chronicle, the readers of the map's names among them: `archer`, `camps`, `console`, `city-mode`, `controls`, `farm`, `fishery`, `hover`, `fog`, `irrigation`, `inspect`, `long-winter`, `menu`, `neutral`, `pillage`, `population-badge`, `press`, `refuse`, `rivers`, `settle`, `tannery`, `trapping`, `worker-instants`, `yields`.
