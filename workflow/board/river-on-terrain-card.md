# The river named on the terrain card

**Line:** The river named on the terrain card — add the [River] reference on terrains next to a river. Done when a terrain card read off a tile a river runs along names `[River]` last in its text, a tile no river runs along names none, the terrain face's Vitest covers both, and `docs/MAP-SCREEN.md` and `docs/INTERFACE.md` say so.

**Spec:**

- `docs/MAP-SCREEN.md`, the paragraph opening **The terrain card is the face of the terrain the tile stands on, read off the tile**. The sentence "Under the row its text names each of those things but the terrain, in that order: the feature, each improvement in the order it was placed, and each kind of building beside it that gives to it, once however many of its kind stand there." becomes: "Under the row its text names each of those things but the terrain, in that order: the feature, each improvement in the order it was placed, and each kind of building beside it that gives to it, once however many of its kind stand there; and last the river, once, where one runs along any of its edges, though it gives nothing."
- `docs/INTERFACE.md`, _A card's names and its label_. After the first sentence of the paragraph opening **A thing named in a card's text stands in brackets**, add: "The river named on a terrain card stands in brackets too and reacts to no press and no rest, the river having no card, as its mark at a card's foot raises nothing."
- Player-facing text: the river's name, drawn in the card's text as `[River]`.

**Doc-impact:** `docs/MAP-SCREEN.md`, `docs/INTERFACE.md`.

**Scope:**

- In: the terrain card read off a tile (the infopanel's terrain card and anything else built from the tile's reading) names `[River]` after everything it already names, once however many rivers or edges run along the tile.
- In: the name is drawn as any bracketed name is, and raises nothing — no small card on a rest, nothing large on a right click. Decided at intake by the precedent of the river's foot mark; the line asked for the bracket.
- Out: the bare terrain face (collection, a name's small card of a terrain) names nothing, as today — it reads no tile.
- Out: the river gives no yield; the row is unchanged.
- Corner: an impassable tile a river runs along (a mountain at a source, the water at a mouth) reads `[River]` above Impassable, as a named feature does today.
- Corner: a tile in fog or uncharted-veil-off reads what the map draws of it; the river never moves, so it is named wherever the tile is inspectable.
- Reconcile: the river already appears as a "goes on" mark at a card's foot that raises nothing (`card-face.ts` skips it when marking). The name goes the same way — one notion of "the river raises nothing", not a second.

**Traps:**

- `REFERENCE_KINDS` / `Reference` in `src/ui/text-run.ts` today hold only things with a face; every name in a run is answered to the hover and right-click code as a reference. A river name must reach the run without that code trying to build a face for it.
- `runsAlong` in `src/rules/map.ts` already answers whether a river runs along a tile; `terrainOnTile` in `src/ui/face.ts` already filters `chronicle.rivers` with it.
- A terrain card's text is `ledBy(named, Impassable-or-empty)`; the river joins `named`, nothing else moves.

**Plan:**

1. `src/ui/face.ts` (and `src/ui/text-run.ts` / `src/ui/text.ts` as the name needs): the terrain reading names the river last where one runs along the tile; the river's name reads River in brackets and raises nothing. Leaves the infopanel showing `[River]` on such tiles.
2. `src/ui/face.test.ts`: a tile with a river along it names it last, after a feature/improvement/building beside; a tile without names none; and wherever the hover code is tested, the river name raises nothing.
3. The two docs edits above.

**Verify:** `npm run check`, `npm test`, `npm run lint`. No proof spec: the face's Vitest proves the line. CI's `npm run e2e` proves the rest on the push.
