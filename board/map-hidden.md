# The map is hidden

The contract for the board line of that name. Converged with the user on the mockup *The Map
Hidden*, run on seeds 1 and 2. Depends on *Sight is a line over the ground* for the sight set,
and on the movement lines for how a unit is moved.

## Scope

- **Three states**, one per tile: **in sight**, **fog** (seen before, out of sight now) and
  **uncharted** (never seen).
- **The snapshot.** The chronicle keeps, for every tile that has ever been in sight, the tile as
  it was last seen: terrain, feature, improvements, building, and the non-player unit standing on
  it. Rivers never change and need no snapshot. The player's own units carry sight and are never
  stale. The snapshot is taken at one choke point after every stage a command resolves as, so an
  enemy crossing in sight is seen tile by tile and a unit killed reveals nothing further.
- **Stale enemies** stay in the snapshot until the tile is seen again. 🔧 Provisional; the
  alternative, the end of turn clearing units from the snapshot, is one rule away.
- **Drawing.** A tile in sight is drawn live, as today. A tile in fog is drawn from its snapshot
  under a dark scrim, nothing live on it. An uncharted tile is not drawn at all. The disc's rim
  is a plain grey line — a placeholder; the rim's look is v0.0.6's.
- **A unit is not moved onto an uncharted tile.** Movement in steps means this blocks nobody.
- **Stages out of sight.** A move or an attack on tiles out of sight moves no marker and pans the
  frame nowhere; the map renders the state when the stage ends.
- The yield overlay, the infopanel and city mode still read through fog: that is the later line
  *Fog on the rest of the screen*.

## Doc-impact

- `docs/DESIGN.md`: the Sight section gains the snapshot, the three states, the stale-enemy
  provisional and the uncharted-move rule.
- `docs/GLOSSARY.md`: **fog** redefined as a tile seen before and out of sight now, drawn as
  last seen; **uncharted** added for a tile never seen.

## Hazards

- The e2e helpers find tiles by name over the whole map; an uncharted tile not drawn has no
  object. Every spec that names a tile far from the city (`tile-8,0`, `tile-0,8`, `tile-0,-3`)
  must either see it first or be rewritten to a tile in sight.
- The map view indexes unit markers by their place in `units`; hiding units must keep that
  alignment or the stage motions pick the wrong marker.

## Verify

`npm run check`, `npm test`, `npm run lint`, `npx playwright test e2e/fog.spec.ts` plus every
spec the hazard above touches.
