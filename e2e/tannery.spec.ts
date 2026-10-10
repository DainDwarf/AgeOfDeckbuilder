import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { neighbours, tileKey } from '../src/rules/map';
import { buildingKind } from '../src/rules/map-kinds';
import type { CardId } from '../src/rules/state';
import {
  aimed,
  campaignWith,
  chronicleOf,
  cityTileOf,
  claimedAt,
  click,
  dragOut,
  HUNT,
  marksIn,
  onFeature,
  openSaved,
  type Paid,
  paidOnGround,
  playedOn,
  playedOut,
  watch,
} from './chronicle-screen';

/** The card that builds the tannery, and the building it builds. */
const TANNERY = 'tannery';

const CAMPAIGN = campaignWith([TANNERY]);

/** The features the tannery is built on. */
const FEATURES = (() => {
  const { features } = buildingKind(CATALOGUE, TANNERY);
  if (features === undefined) throw new Error(`${TANNERY} names no feature`);
  return features;
})();

/**
 * The first seed's turn 1 with the card in hand and paid for, on the first tile beside the city it
 * can claim, claimed and made the feature, the building, where one is named, built there, and a
 * worker entered there.
 */
function paidOnFeature(card: CardId, feature: string, building?: string): Paid {
  return paidOnGround(
    card,
    (opened) => {
      for (const tile of neighbours(cityTileOf(opened))) {
        const claimed = claimedAt(opened, tile);
        if (claimed === undefined) continue;
        return { chronicle: onFeature(claimed, tile, feature, [], building), tile };
      }
      return undefined;
    },
    CAMPAIGN,
  );
}

for (const feature of FEATURES) {
  test(`the tannery played at a tile inside the border carrying ${feature} that its worker stands on builds a tannery there`, async ({
    page,
  }) => {
    const problems = watch(page);
    const paid = paidOnFeature(TANNERY, feature);
    const built = playedOn(paid.chronicle, paid.index, paid.tile);

    await openSaved(page, paid.chronicle, CAMPAIGN);
    const before = await marksIn(page, 'buildings');
    await dragOut(page, paid.index);
    await aimed(page);
    await click(page, `tile-${tileKey(paid.tile)}`);
    await playedOut(page);

    await expect.poll(() => chronicleOf(page)).toEqual(built);
    expect(await marksIn(page, 'buildings')).toBe(before + 1);
    expect(problems).toEqual([]);
  });
}

{
  const feature = FEATURES[0];
  test(`the hunt card played on ${feature} carrying a tannery removes the ${feature} and the tannery with it`, async ({
    page,
  }) => {
    const problems = watch(page);
    const paid = paidOnFeature(HUNT, feature, TANNERY);
    const hunted = playedOn(paid.chronicle, paid.index, paid.tile);

    await openSaved(page, paid.chronicle, CAMPAIGN);
    const featureMarks = await marksIn(page, 'features');
    const buildingMarks = await marksIn(page, 'buildings');
    await dragOut(page, paid.index);
    await aimed(page);
    await click(page, `tile-${tileKey(paid.tile)}`);
    await playedOut(page);

    await expect.poll(() => chronicleOf(page)).toEqual(hunted);
    expect(await marksIn(page, 'features')).toBe(featureMarks - 1);
    expect(await marksIn(page, 'buildings')).toBe(buildingMarks - 1);
    expect(problems).toEqual([]);
  });
}
