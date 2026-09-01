# Tile inspection

## Scope

Building and terrain infopanels, plugged into the tile-click inspection seam the unit panel
shipped. What each panel *shows* is not settled — that is this line's pitch, with a mockup.

## Settled UX (decided with the user, 2026-09-01)

- Clicking a tile while no order is aimed inspects its topmost layer; repeat clicks on the same
  tile go one layer deeper: unit → building → the tile itself with its improvements.
- A click past the last layer wraps to the first.
- Absent layers are skipped: a tile with only a building opens on the building; an empty tile
  opens on the terrain.
- Clicking out of the map dismisses the infopanel; so does Escape.
- The infopanel floats beside the inspected tile; stat names carry hover tooltips.

## Open

- Content of the building panel and of the terrain panel (yields? improvements how?).
- Player-facing text keys for terrain and building names do not exist yet.

## Doc-impact

None.
