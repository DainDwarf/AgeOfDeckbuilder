import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { aimOf, gained } from '../src/rules/cards';
import { cardOf, entered } from '../src/rules/catalogue';
import { admitted, apply, outcome, refusalOf } from '../src/rules/chronicle';
import { neighbours, type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { charted } from '../src/rules/sight';
import { type Chronicle, playable } from '../src/rules/state';
import {
  aimed,
  budget,
  chronicleOf,
  cityTileOf,
  click,
  dragOut,
  endedTurn,
  firstSeed,
  idsOf,
  openSaved,
  playedOut,
  settledOn,
  victoryShown,
  watch,
} from './chronicle-screen';

/** The card the capstone's landing lays, and the building its play builds. */
const SHELTER = 'shelter';

/**
 * The first seed's capstone landing turn, the shelter in the hand, with a tile beside the city
 * claimed, the shelter's cost gained and a worker entered on that tile, and the tile: the shelter's
 * aim admits it.
 */
function landed(): { chronicle: Chronicle; tile: TileCoords } {
  const card = cardOf(CATALOGUE, SHELTER);
  const aim = aimOf(card);
  if (aim.aim !== 'tile') throw new Error(`${SHELTER} is aimed at no tile`);
  return firstSeed('lands its capstone with a shelter to build beside the city', (seed) => {
    let turned = settledOn(seed);
    while (turned.turn < turned.timeline.capstone.turn && turned.ending === undefined) {
      turned = endedTurn(turned);
    }
    if (turned.ending !== undefined || !idsOf(turned.hand).includes(SHELTER)) return undefined;

    for (const tile of neighbours(cityTileOf(turned))) {
      const claimed = outcome(apply(CATALOGUE, turned, { type: 'claim', tile }));
      if (claimed === turned) continue;
      const paid = gained(claimed, card.cost).chronicle;
      const worked = entered(CATALOGUE, paid, {
        type: 'worker',
        faction: 'player',
        tile,
      }).chronicle;
      const chronicle = charted(CATALOGUE, worked);
      if (!playable(refusalOf(CATALOGUE, chronicle, SHELTER))) continue;
      if (admitted(CATALOGUE, chronicle, aim).some((coord) => tileKey(coord) === tileKey(tile))) {
        return { chronicle, tile };
      }
    }
    return undefined;
  });
}

test('the play whose building passes the capstone wins on the play, and the victory screen rises', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));

  await openSaved(page, chronicle);
  expect(await victoryShown(page)).toBe(false);
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);

  expect(await chronicleOf(page)).toEqual(won);
  expect(tileAt(won.tiles, tile)?.building).toBe(SHELTER);
  expect(won.ending).toEqual({ outcome: 'victory', turn: chronicle.turn });
  await expect.poll(() => victoryShown(page)).toBe(true);
  expect(problems).toEqual([]);
});
