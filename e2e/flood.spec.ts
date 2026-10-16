import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { improvementPlaced, terraformed } from '../src/rules/cards';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import { answerOf } from '../src/rules/schedule';
import { followed } from '../src/rules/stages';
import { type Chronicle, holderOf } from '../src/rules/state';
import {
  budget,
  chronicleOf,
  playerCityTile,
  dealtAloneOn,
  eventDealRead,
  firstSeed,
  offeredOn,
  openSaved,
  readings,
  restedOnDeal,
  take,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The event the spec opens on. */
const FLOOD = 'flood';

/** The answer of the flood that removes improvements near the city. */
const LOSE_THE_FIELDS = 'lose-the-fields';

/** The improvement the spec places on the city's tile. */
const CLAY_PIT = 'clay-pit';

/** Every improvement standing outside the neutral's border, each read with its tile. */
function improvementsOutsideTheNeutral(chronicle: Chronicle): string[] {
  return chronicle.tiles.flatMap((tile) =>
    holderOf(chronicle, tile) === 'neutral'
      ? []
      : tile.improvements.map((improvement) => `${tileKey(tile)} ${improvement}`),
  );
}

/**
 * The first seed's turn 1 from the campaign, settled bare, a clay pit placed on its city's tile, whose
 * first deal is the flood alone, the clay pit the one improvement outside the neutral's border and
 * losing the fields taking improvements alone: that chronicle stopped on the deal, and the city's tile.
 */
function flooding(campaign: Campaign): { dealt: Chronicle; city: TileCoords } {
  const [terrain] = improvementKind(CATALOGUE, CLAY_PIT).terrains;
  const { reads } = answerOf(CATALOGUE, FLOOD, LOSE_THE_FIELDS);
  return firstSeed('deals the flood alone first, taking the clay pit alone', (seed) => {
    const dealt = dealtAloneOn(seed, FLOOD, campaign, (settled) => {
      const city = playerCityTile(settled);
      return followed(terraformed(CATALOGUE, settled, city, terrain), (left) =>
        improvementPlaced(CATALOGUE, left, city, CLAY_PIT),
      ).chronicle;
    });
    if (dealt === undefined) return undefined;
    const city = playerCityTile(dealt);
    const read = reads(CATALOGUE, dealt);
    const alone =
      improvementsOutsideTheNeutral(dealt).join() === `${tileKey(city)} ${CLAY_PIT}` &&
      read.buildings === 0 &&
      read.city === 0;
    return alone ? { dealt, city } : undefined;
  });
}

test('the flood deals its answers, and losing the fields removes the clay pit standing on the city’s tile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { dealt, city } = flooding(campaign);
  const at = offeredOn(dealt).indexOf(LOSE_THE_FIELDS);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const mark = `improvement-${CLAY_PIT}-${tileKey(city)}`;
  expect(tileAt(after.tiles, city)?.improvements).not.toContain(CLAY_PIT);

  await openSaved(page, dealt, campaign);
  await restedOnDeal(page);
  const shown = await eventDealRead(page, dealt, FLOOD, [mark]);
  expect(shown(mark).standing).toBe(true);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', mark]);
  expect([left('deal').standing, left(mark).standing]).toEqual([false, false]);

  expect(problems).toEqual([]);
});
