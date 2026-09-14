import { type Catalogue, entered } from './catalogue';
import type { TileCoords } from './map';
import { nextRng } from './rng';
import type { Chronicle } from './state';
import { unitAt } from './units';

/**
 * One enemy entering the map from a camp: it stands on a camp whose tile no unit stands on, drawn
 * from the seeded generator, with its move points and its action full. With no such camp it enters
 * nowhere and draws nothing.
 */
export function enteredFromCamp(catalogue: Catalogue, chronicle: Chronicle): Chronicle {
  const camps = chronicle.tiles.filter(
    (tile) => tile.building === 'PH_Camp' && unitAt(chronicle.units, tile) === undefined,
  );
  if (camps.length === 0) return chronicle;

  const step = nextRng(chronicle.rng);
  const { q, r } = camps[Math.floor(step.value * camps.length)];
  return enteredOnCamp(catalogue, { ...chronicle, rng: step.rng }, { q, r });
}

/** The one enemy a camp enters, on the camp's own tile: the unit and script the catalogue names. */
export function enteredOnCamp(
  catalogue: Catalogue,
  chronicle: Chronicle,
  tile: TileCoords,
): Chronicle {
  return entered(catalogue, chronicle, {
    type: catalogue.camp.unit,
    faction: 'enemy',
    tile,
    script: catalogue.camp.script,
  });
}
