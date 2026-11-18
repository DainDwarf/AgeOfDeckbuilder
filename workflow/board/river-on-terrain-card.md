# The river named on the terrain card

**Line:** The river named on the terrain card — add the [River] reference on terrains next to a river. Widened at intake: the river gets a face of its own, the River card, and both the `[River]` name and the river's mark at the foot of a card's window (Irrigation's) raise it. Done when a terrain card read off a tile a river runs along names `[River]` last in its text and a tile no river runs along names none; the `[River]` name and the river's foot mark raise the River's face small at a rest and large at a right click, as a terrain's name and mark do; the River's face reads as the Spec says; the terrain label's hover reads the new sentence; the face's Vitest and the one proof spec below pass; and `docs/MAP-SCREEN.md`, `docs/INTERFACE.md` and `docs/LOOK.md` say so.

**Spec:**

- `docs/MAP-SCREEN.md`, the paragraph opening **The terrain card is the face of the terrain the tile stands on, read off the tile**. The sentence "Under the row its text names each of those things but the terrain, in that order: the feature, each improvement in the order it was placed, and each kind of building beside it that gives to it, once however many of its kind stand there." becomes: "Under the row its text names each of those things but the terrain, in that order: the feature, each improvement in the order it was placed, and each kind of building beside it that gives to it, once however many of its kind stand there; and last the river, once, where one runs along any of its edges."
- `docs/MAP-SCREEN.md`, the paragraph opening "A name on a card, or a mark at the foot of a card's window, that names a terrain or a feature shows that thing as a face of its own". "that names a terrain or a feature" becomes "that names a terrain, a feature or the river". After the sentence "A feature's face reads what it gives at income.", add: "The river's face is drawn as a terrain's is, the river's name on the plate and its label reading Terrain; it reads no row and no disc, and its text reads Crossing it ends the move."
- `docs/INTERFACE.md`, _A card's names and its label_. In the paragraph opening **A thing named in a card's text stands in brackets**, "a card, a terrain, a feature, an improvement, a building or a unit kind" becomes "a card, a terrain, a feature, the river, an improvement, a building or a unit kind". In the paragraph opening **A mark of what a card goes on reacts as a name does.**, "The pointer resting on a terrain, a feature or a building marked at the window's foot" becomes "The pointer resting on a terrain, a feature, the river or a building marked at the window's foot", and the clause "; the river's mark raises nothing, the river having no card" is deleted, so the sentence ends at "would".
- `docs/LOOK.md`, **The frame**: "A terrain's face wears the oval window too." becomes "A terrain's face and the river's wear the oval window too."; "and loam brown for a terrain's face" becomes "and loam brown for a terrain's face and the river's".
- `docs/LOOK.md`, **The art box**: before the sentence opening "On the infopanel the terrain's face holds the tile inspected lit", add: "The river's face holds a river falling across its window from the upper left to the lower right through the window's middle, at its own light, over a plain ground dimmed as any card's ground, no tile of it lit."
- Player-facing text, all written here:
  - The river's name: `River` (on the plate, and in a card's text as `[River]`).
  - The River face's text: `Crossing it ends the move` (written by Claude at intake from the user's pick between two takes; kept by the user after the glossary note that **move** is also the stat's name).
  - The terrain label's hover, `kind-tooltip.terrain` in `src/ui/text.ts`, today "Every tile has one: what it yields and what entering it costs", becomes: `What it yields and what crossing it costs` (the user's own trim of a take served at intake).

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`, `docs/LOOK.md`.

**Scope:**

- In: the terrain card read off a tile names `[River]` after everything it already names, once however many rivers or edges run along the tile.
- In: the River's face. Front: the terrain face's (plain front, loam brown, oval window). Plate: River. Label: Terrain, raising the terrain hover as every terrain face's label does. Text: Crossing it ends the move. No row (the river gives nothing). No disc. No marks at its window's foot.
- In: the window, the **diagonal** picked by the user from seven shot proposals: on the corner lattice of `src/rules/map.ts` (a tile's middle at `(2q + r, 3r)`, its corners an arm away), the course from corner `(-4, -8)` alternating a step of `(+1, +1)` and one of `(0, +2)`, twelve edges, the window's middle standing at lattice point `(-0.5, 0.5)` about the centre tile, so the course crosses the middle. Plain ground, every tile dimmed as any card's ground, the river at its own light, painted by the same river painter the map and Irrigation's window use. The course data is the look; how it is built is the implementer's.
- In: the `[River]` name and the river's mark at a card's window's foot (Irrigation's, and any card whose layer names the river) raise the River's face small at a rest and large at a right click, through the same door a terrain's name and mark use. A small River card is a card face like any other: it stays up while the pointer is on it, as the page says of every small card.
- In: the terrain label's hover reworded, once, for every terrain face and the River's.
- Out: the bare terrain faces name nothing, as today. Irrigation's own window is unchanged (reconcile 3). The glossary's **river** row is unchanged.
- Corner: an impassable tile a river runs along (a mountain at a source, the water at a mouth) reads `[River]` above Impassable, as a named feature does today.
- Corner: a tile in fog, or drawn with the uncharted veil off, reads what the map draws of it; the river never moves, so it is named wherever the tile is inspectable.
- Corner: a right click on `[River]` while a stack of large cards stands puts the River's face on top as any name does, the twelve-card cap included.
- Reconcile, taken whole ("go"): (1) the name and the foot mark become one door, the one terrain and feature names go through; (2) the River's face is built as a terrain face is, its differences (no row, no disc, a sentence) the only parameters; (3) the River's window and Irrigation's stay apart, both through the shared river painter; (4) one terrain hover entry, reworded, no second one for the river.

**Traps:**

- `REFERENCE_KINDS` / `Reference` in `src/ui/text-run.ts` hold the kinds a name can be; the river is not one today. Every name in a run is answered to the rest and right-click code as a reference that must resolve to a face.
- The river's foot mark is a `GoesOn` of kind `river` in `src/ui/face.ts`; `src/ui/card-face.ts` (around line 945) deliberately skips it when it lists the marks that react. That skip goes.
- `e2e/inspect.spec.ts`'s `faceDrawn` filters river marks out of a face's references (around line 249); once the mark reacts, that filter is wrong and every inspect spec reading a card with a river mark will disagree with the page.
- The art sheet (`artSheet` in `src/ui/art-sheet.ts`) paints every picture a face's window can hold up front, by its frame key; the River's picture must be among them, or its window shows pale. Irrigation's river window (`groundRiver`, `DITCHES_DROP`) is a different picture and stays.
- `terrainOnTile` in `src/ui/face.ts` already filters `chronicle.rivers` with `runsAlong`; the river joins its `names`, and the text is `ledBy(named, Impassable-or-empty)`, so nothing else moves.
- `docs/PHASER.md` for anything the small-card and inspection stack code touches.

**Plan:**

1. `src/ui/text.ts`: the river's name, the River face's text, and the reworded terrain hover. Leaves the words standing.
2. `src/ui/face.ts`, `src/ui/text-run.ts`, `src/ui/art-sheet.ts`: the River's face and its window; the river becomes a thing a name or a mark can name; the terrain reading names it last. Leaves `[River]` on the infopanel's terrain card and the face buildable.
3. `src/ui/card-face.ts` and whatever raises a small or large card from a reference: the river's name and mark raise the River's face. Leaves both doors working.
4. `src/ui/face.test.ts` (and `text-run.test.ts` where the reference kind is tested): a tile with a river names it last; a tile without names none; the River's face reads its name, label, text, no row, no disc, and its window's picture.
5. `e2e/reference.spec.ts`: the proof spec below; `e2e/inspect.spec.ts`'s `faceDrawn` stops filtering the river.
6. The docs edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. Proof spec, run alone: `npx playwright test e2e/reference.spec.ts`, holding a new test titled "the river marked on Irrigation's card raises the River's face small at a rest and shows it large at a right click", built like the settle card's terrain-mark test there, on a save whose hand holds Irrigation (the forge or a planted save, the implementer's choice). CI's `npm run e2e` proves the rest on the push, `e2e/inspect.spec.ts` and `e2e/card-reads.spec.ts` among them.
