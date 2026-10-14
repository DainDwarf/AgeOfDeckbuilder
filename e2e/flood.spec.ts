import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import type { Campaign } from '../src/rules/campaign';
import { improvementPlaced, terraformed } from '../src/rules/cards';
import { apply, outcome } from '../src/rules/chronicle';
import { type TileCoords, tileAt, tileKey } from '../src/rules/map';
import { improvementKind } from '../src/rules/map-kinds';
import { answerOf } from '../src/rules/schedule';
import { followed } from '../src/rules/stages';
import type { Chronicle } from '../src/rules/state';
import { eventLore } from '../src/ui/lore';
import { eventName } from '../src/ui/text';
import {
  budget,
  chronicleOf,
  cityTileOf,
  dealtAlone,
  firstSeed,
  offeredOn,
  openSaved,
  readings,
  rested,
  settledOn,
  standing,
  stoppedOnDeal,
  take,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The event the spec opens on. */
const FLOOD = 'flood';

/** The answer of the flood that removes what stands inside the border. */
const LOSE_THE_FIELDS = 'lose-the-fields';

/** The improvement the spec places on the city's tile. */
const CLAY_PIT = 'clay-pit';

/**
 * The first seed's turn 1 from the campaign, settled bare, a clay pit placed on its city's tile, whose
 * first deal is the flood alone, losing the fields taking improvements alone: that chronicle stopped
 * on the deal, and the city's tile.
 */
function flooding(campaign: Campaign): { dealt: Chronicle; city: TileCoords } {
  const [terrain] = improvementKind(CATALOGUE, CLAY_PIT).terrains;
  const { reads } = answerOf(CATALOGUE, FLOOD, LOSE_THE_FIELDS);
  return firstSeed('deals the flood alone first, taking improvements alone', (seed) => {
    const settled = settledOn(seed, [], campaign);
    const city = cityTileOf(settled);
    const clayed = followed(terraformed(CATALOGUE, settled, city, terrain), (left) =>
      improvementPlaced(CATALOGUE, left, city, CLAY_PIT),
    ).chronicle;
    const dealt = stoppedOnDeal(clayed);
    if (!dealtAlone(dealt, FLOOD)) return undefined;
    const read = reads(CATALOGUE, dealt);
    return read.buildings === 0 && read.city === 0 ? { dealt, city } : undefined;
  });
}

test('the flood deals its answers, and losing the fields removes the clay pit standing on the city’s tile', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const { dealt, city } = flooding(campaign);
  const answers = offeredOn(dealt);
  const at = answers.indexOf(LOSE_THE_FIELDS);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at }));
  const mark = `improvement-${CLAY_PIT}-${tileKey(city)}`;
  expect(tileAt(after.tiles, city)?.improvements).not.toContain(CLAY_PIT);

  await openSaved(page, dealt, campaign);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  const faces = answers.map((_, place) => `deal-card-${place}`);
  const shown = await readings(page, ['deal-title', 'deal-lore', mark, ...faces]);
  expect(shown('deal-title').text).toBe(eventName(FLOOD));
  expect(shown('deal-lore').text).toBe(eventLore(FLOOD));
  expect(faces.map((face) => shown(face).card)).toEqual(answers);
  expect(shown(mark).standing).toBe(true);

  await take(page, at);

  expect(await chronicleOf(page)).toEqual(after);
  const left = await readings(page, ['deal', mark]);
  expect([left('deal').standing, left(mark).standing]).toEqual([false, false]);

  expect(problems).toEqual([]);
});
