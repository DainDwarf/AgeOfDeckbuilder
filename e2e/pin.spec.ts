import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { available, pinned, unpinned } from '../src/rules/campaign';
import { achievementOf, firstAge } from '../src/rules/catalogue';
import { countOn } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { achievementGoal, technologyName, text } from '../src/ui/text';
import {
  aimed,
  budget,
  campaignShown,
  chronicleOf,
  click,
  dragOut,
  HOLDING,
  HUNT,
  openSaved,
  paidOnDeer,
  plantCampaign,
  playedOn,
  playedOut,
  pressed,
  reachedByClaims,
  readings,
  readNames,
  rowOf,
  secondEra,
  settledOn,
  standing,
  textOf,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The technology whose achievement counts the hunts played. */
const HUNTING = 'trapping';

/** What the pinned achievement draws, read in one question. */
const PARTS = [
  'pinned-achievement-name',
  'pinned-achievement-goal',
  'pinned-achievement-count',
  'pinned-achievement-well',
] as const;

/** Whether each plate wears the pin's edge, read in one question. */
function edged(page: Page, technologies: readonly string[]): Promise<boolean[]> {
  return page.evaluate(
    (names) =>
      names.map(
        (name) =>
          (window.named?.(`plate-${name}-pin`)?.object as Phaser.GameObjects.Rectangle | undefined)
            ?.visible === true,
      ),
    technologies,
  );
}

test('on a campaign that has learned the first age’s technology, a left click on an available plate pins it in the save and edges the plate, a click on another plate moves the pin, and a click on the pinned plate takes it off', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const [first, second] = Object.keys(CATALOGUE.technologies).filter((technology) =>
    available(CATALOGUE, technology, campaign.technologies),
  );
  expect(second).toBeDefined();
  await readNames(page);
  await plantCampaign(page, campaign);
  await page.goto('/');
  await campaignShown(page);

  const onFirst = await pressed(page, `plate-${first}-name`, campaign, (held) =>
    pinned(CATALOGUE, held, first),
  );
  expect(await edged(page, [first, second])).toEqual([true, false]);

  const onSecond = await pressed(page, `plate-${second}-name`, onFirst, (held) =>
    pinned(CATALOGUE, held, second),
  );
  expect(await edged(page, [first, second])).toEqual([false, true]);

  await pressed(page, `plate-${second}-name`, onSecond, unpinned);
  expect(await edged(page, [first, second])).toEqual([false, false]);

  expect(problems).toEqual([]);
});

test('a chronicle of the second age beside a campaign pinning a technology it reads shows that technology’s name, its goal and its count over its need, and a card played on screen that moves the count moves the reading', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = pinned(CATALOGUE, wonCampaign(), HUNTING);
  const era = secondEra(campaign);
  const paid = paidOnDeer(HUNT, [], undefined, era);
  const hunted = playedOn(paid.chronicle, paid.index, paid.tile);
  const { id } = rowOf(paid.chronicle, HUNTING);
  const { need } = achievementOf(CATALOGUE, era.age, id);
  const countIn = (chronicle: Chronicle): string =>
    text('achievement.count', {
      count: countOn(CATALOGUE, chronicle, rowOf(chronicle, HUNTING)),
      need,
    });
  expect(need).toBeGreaterThan(1);
  expect(countIn(hunted)).not.toBe(countIn(paid.chronicle));

  await openSaved(page, paid.chronicle, campaign);
  const seen = await readings(page, PARTS);
  expect(seen('pinned-achievement-name').text).toBe(technologyName(HUNTING));
  expect(seen('pinned-achievement-goal').text).toBe(achievementGoal(id, need));
  expect(seen('pinned-achievement-count').text).toBe(countIn(paid.chronicle));
  expect(seen('pinned-achievement-count').shows).toBe(true);
  expect(seen('pinned-achievement-well').shows).toBe(false);

  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(hunted);
  expect(await textOf(page, 'pinned-achievement-count')).toBe(countIn(hunted));

  expect(problems).toEqual([]);
});

test('a chronicle of the second age that has reached the pinned technology’s achievement shows it sunk, the check mark before its name, and reads no count', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = pinned(CATALOGUE, wonCampaign(), HOLDING);
  const reached = reachedByClaims(secondEra(campaign));

  await openSaved(page, reached, campaign);
  const seen = await readings(page, PARTS);
  expect(seen('pinned-achievement-name').text).toBe(
    text('achievement.reached', { achievement: technologyName(HOLDING) }),
  );
  expect(seen('pinned-achievement-count').shows).toBe(false);
  expect(seen('pinned-achievement-well').shows).toBe(true);

  expect(problems).toEqual([]);
});

test('a chronicle of the first age beside a campaign pinning a technology of the second shows nothing of it', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = pinned(CATALOGUE, wonCampaign(), HUNTING);
  const chronicle = settledOn(1, [], undefined, {
    age: firstAge(CATALOGUE),
    learned: campaign.technologies,
  });

  await openSaved(page, chronicle, campaign);
  expect(await standing(page, 'pinned-achievement')).toBe(false);

  expect(problems).toEqual([]);
});
