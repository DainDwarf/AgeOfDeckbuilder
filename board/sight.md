# Sight is a line over the ground

The contract for the board line of that name. Converged with the user on the mockup *The Map
Hidden*, run on seeds 1 and 2.

## Scope

- **Sight** is a unit's stat, beside health, damage, range, move and action; the city has a sight
  of its own. A tile's layers may add to a unit's sight, as the design's map section already says;
  no content does yet, and the implementer widens no declaration for it.
- **Elevation** is one number per terrain: plain, coast, deep and urban 0; forest 1; hills 2;
  mountain 3. Not a fork: the user settled the table.
- **The line.** A tile within a unit's sight is in sight when the line from the unit's tile to it
  meets no tile *between* them that is raised (elevation above 0) and at least as high as the
  tile the unit stands on. Flat ground never stops a line. The target's own elevation is never
  checked, or no mountain could be seen. The line is the standard hex line on cube coordinates,
  nudged off exact edges; a tile whose line runs along the shared edge of two paths is seen when
  **either** path is clear — the generous rule, chosen on the mockup over strict and one-line.
- **Every held tile is in sight** — an inhabitant works it. 🔧 Provisional.
- **Provisional numbers** 🔧: worker 2, warrior 2, city 2.
- The city's sight is a number on the city, not a layer; the layer door stays open and empty.
- Melee attacks need no sight rule: an adjacent tile is always in sight. Whether a ranged attack
  needs its target in sight waits for the first ranged unit.
- Enemies read the whole map: scripts ignore sight.

## Doc-impact

- `docs/DESIGN.md`: the Sight section rewritten to the line rule with the elevation table and the
  provisional numbers; the units section lists sight among the stats; the map section's "sight
  is the sum of its layers" becomes the modifier added to the unit's.
- `docs/GLOSSARY.md`: **sight** redefined as the stat and the tiles it reaches ("line of sight"
  stays forbidden: prose says "a line from the unit"); **elevation** added.

## Hazards

- Rounding on the cube line: the nudge must be the same in both directions of a pair, or the
  generous rule is not symmetric. Pin the edge tile in a test on a fixture where the line runs
  exactly along an edge.
- The infopanel's unit card reads its stats from a fixed list; sight joins it.

## Verify

`npm run check`, `npm test`, `npm run lint`; the e2e spec that inspects a unit card if it
asserts the row count.
