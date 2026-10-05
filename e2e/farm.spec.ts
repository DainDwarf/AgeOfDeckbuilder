import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { gained } from '../src/rules/cards';
import { cardOf } from '../src/rules/catalogue';
import { apply, outcome, refusalOf } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileKey } from '../src/rules/map';
import { type Chronicle, playable } from '../src/rules/state';
import {
  admits,
  aimed,
  chronicleOf,
  cityTileOf,
  claimedAt,
  click,
  dragOut,
  firstSeed,
  idsOf,
  marksIn,
  openSaved,
  playedOut,
  settledOn,
  unitEntered,
  WORKER,
  watch,
  withCard,
} from './chronicle-screen';

/** The card that builds the farm. */
const FARM = 'farm';

/**
 * The first seed's turn 1 with the farm in hand, a copy added to the first civilization's deck: a
 * claim's culture gained, a tile beside the city claimed, the farm's cost gained and a worker
 * entered there, the farm's aim admitting the tile.
 */
function farmAdmitted(): { chronicle: Chronicle; tile: TileCoords; index: number } {
  const civilization = withCard(FARM);
  const { cost } = cardOf(CATALOGUE, FARM);
  return firstSeed('opens turn 1 on a farm to build beside the city', (seed) => {
    const opened = settledOn(seed, [], civilization);
    if (!idsOf(opened.hand).includes(FARM)) return undefined;
    for (const tile of neighbours(cityTileOf(opened))) {
      const claimed = claimedAt(opened, tile);
      if (claimed === undefined) continue;
      const paid = gained(claimed, cost).chronicle;
      const chronicle = unitEntered(paid, { type: WORKER, faction: 'player', tile });
      if (!playable(refusalOf(CATALOGUE, chronicle, FARM))) continue;
      const index = idsOf(chronicle.hand).indexOf(FARM);
      if (admits(chronicle, index, tile)) return { chronicle, tile, index };
    }
    return undefined;
  });
}

test('the farm played at the tile inside the border its worker stands on builds a farm there', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile, index } = farmAdmitted();
  const built = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));

  await openSaved(page, chronicle);
  const before = await marksIn(page, 'buildings');
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);

  await expect.poll(() => chronicleOf(page)).toEqual(built);
  expect(await marksIn(page, 'buildings')).toBe(before + 1);
  expect(problems).toEqual([]);
});
