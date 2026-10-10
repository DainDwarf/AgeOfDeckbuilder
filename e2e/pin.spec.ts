import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { pinned, unpinned } from '../src/rules/campaign';
import { achievementOf, firstAge } from '../src/rules/catalogue';
import { countOn } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import type { Chronicle } from '../src/rules/state';
import { openingChoices, withAge } from '../src/ui/launch-layout';
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
  pinnedAchievement,
  plantCampaign,
  playedOn,
  playedOut,
  pressed,
  reachedByClaims,
  readings,
  readNames,
  rowOf,
  settledOn,
  standing,
  textOf,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** The technology whose achievement counts the hunts played. */
const HUNTING = 'trapping';

/** What the technology's pinned achievement draws, read in one question. */
function partsOf(technology: string): string[] {
  return ['name', 'goal', 'goal-run', 'count', 'well'].map(
    (part) => `${pinnedAchievement(technology)}-${part}`,
  );
}

/** The technologies the campaign pins whose achievements the chronicle reads, in its order. */
function stackedIn(chronicle: Chronicle, pins: readonly string[]): string[] {
  return chronicle.achievements
    .map(({ id }) => achievementOf(CATALOGUE, chronicle.age, id).technology)
    .filter((technology) => pins.includes(technology));
}

/** Whether each plate wears the pin's marking, read in one question. */
function marked(page: Page, technologies: readonly string[]): Promise<boolean[]> {
  return page.evaluate(
    (names) =>
      names.map(
        (name) =>
          (window.named?.(`plate-${name}-pin`)?.object as Phaser.GameObjects.Graphics | undefined)
            ?.visible === true,
      ),
    technologies,
  );
}

test('on a campaign that has learned the first age’s technology, every available plate wears its pin; a left click on a pinned plate takes its pin off in the save, the others standing, and a left click on a plate not pinned pins it again', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const [first, second] = campaign.pins;
  expect(second).toBeDefined();
  await readNames(page);
  await plantCampaign(page, campaign);
  await page.goto('/');
  await campaignShown(page);
  expect(await marked(page, [first, second])).toEqual([true, true]);

  const offFirst = await pressed(page, `plate-${first}-name`, campaign, (held) =>
    unpinned(held, first),
  );
  expect(await marked(page, [first, second])).toEqual([false, true]);

  const offBoth = await pressed(page, `plate-${second}-name`, offFirst, (held) =>
    unpinned(held, second),
  );
  expect(await marked(page, [first, second])).toEqual([false, false]);

  await pressed(page, `plate-${first}-name`, offBoth, (held) => pinned(CATALOGUE, held, first));
  expect(await marked(page, [first, second])).toEqual([true, false]);

  expect(problems).toEqual([]);
});

test('a chronicle of the second age beside a campaign pinning a technology it reads shows that technology’s name, its goal and its count over its need, and a card played on screen that moves the count moves the reading', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const campaign = wonCampaign();
  const paid = paidOnDeer(HUNT, [], campaign);
  const hunted = playedOn(paid.chronicle, paid.index, paid.tile);
  const { id } = rowOf(paid.chronicle, HUNTING);
  const { need } = achievementOf(CATALOGUE, paid.chronicle.age, id);
  const countIn = (chronicle: Chronicle): string =>
    text('achievement.count', {
      count: countOn(CATALOGUE, chronicle, rowOf(chronicle, HUNTING)),
      need,
    });
  const [name, goal, run, count, well] = partsOf(HUNTING);
  expect(campaign.pins).toContain(HUNTING);
  expect(need).toBeGreaterThan(1);
  expect(countIn(hunted)).not.toBe(countIn(paid.chronicle));

  await openSaved(page, paid.chronicle, campaign);
  const seen = await readings(page, partsOf(HUNTING));
  expect(seen(name).text).toBe(technologyName(HUNTING));
  expect(seen(goal).text).toBe(achievementGoal(id, need));
  expect(seen(run).shows).toBe(true);
  expect(seen(count).text).toBe(countIn(paid.chronicle));
  expect(seen(count).shows).toBe(true);
  expect(seen(well).shows).toBe(false);

  await dragOut(page, paid.index);
  await aimed(page);
  await click(page, `tile-${tileKey(paid.tile)}`);
  await playedOut(page);
  await expect.poll(() => chronicleOf(page)).toEqual(hunted);
  expect(await textOf(page, count)).toBe(countIn(hunted));

  expect(problems).toEqual([]);
});

test('a chronicle of the second age stacks the pinned achievements it reads in its order, and one it has reached stands sunk, reading the check mark and its name alone, as tall as that line, those under it closing up', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const reached = reachedByClaims(campaign);
  const stack = stackedIn(reached, campaign.pins);
  const at = stack.indexOf(HOLDING);
  const [name, , run, count, well] = partsOf(HOLDING);
  expect(stack.length).toBeGreaterThan(2);
  expect(at).toBeGreaterThanOrEqual(0);
  expect(at).toBeLessThan(stack.length - 1);
  const stops = stack.map((technology) => `${pinnedAchievement(technology)}-stop`);

  await openSaved(page, reached, campaign);
  const seen = await readings(page, [...partsOf(HOLDING), ...stops]);
  expect(seen(name).text).toBe(
    text('achievement.reached', { achievement: technologyName(HOLDING) }),
  );
  expect(seen(run).shows).toBe(false);
  expect(seen(count).shows).toBe(false);
  expect(seen(well).shows).toBe(true);

  const boxes = stops.map((stop) => seen(stop).boundsOnScreen);
  const [gap, ...gaps] = boxes
    .slice(1)
    .map((box, above) => box.y - (boxes[above].y + boxes[above].height));
  expect(gap).toBeGreaterThan(0);
  for (const each of gaps) expect(each).toBeCloseTo(gap);
  for (const [index, technology] of stack.entries()) {
    const { height } = boxes[index];
    if (rowOf(reached, technology).reached) expect(height).toBeCloseTo(boxes[at].height);
    else expect(height).toBeGreaterThan(boxes[at].height);
  }

  expect(problems).toEqual([]);
});

test('a chronicle of the first age beside a campaign pinning a technology of the second shows nothing of it', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  const choices = withAge(
    CATALOGUE,
    campaign,
    openingChoices(CATALOGUE, campaign),
    firstAge(CATALOGUE),
  );
  const chronicle = settledOn(1, [], campaign, choices);
  expect(campaign.pins).toContain(HUNTING);

  await openSaved(page, chronicle, campaign, choices);
  expect(await standing(page, pinnedAchievement(HUNTING))).toBe(false);

  expect(problems).toEqual([]);
});
