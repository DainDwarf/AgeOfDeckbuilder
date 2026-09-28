import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { paidInto } from '../src/rules/campaign';
import { achievementOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import { freshCampaign, readSave } from '../src/rules/save';
import { SAVE_ENTRY } from '../src/ui/save-entry';
import { technologyName, text } from '../src/ui/text';
import {
  aimed,
  budget,
  campaignShown,
  chronicleButton,
  click,
  dragOut,
  idsOf,
  landed,
  openSaved,
  playedOut,
  rested,
  SHELTER,
  standing,
  textOf,
  victoryShown,
  watch,
} from './chronicle-screen';

test('the play that ends the chronicle pays it into the campaign: the ending screen reads what it paid, the save holds the campaign paid into and no chronicle, and the campaign screen its End chronicle opens reads the influence paid', async ({
  page,
}) => {
  const problems = watch(page);
  test.setTimeout(budget(1));
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  const paid = paidInto(CATALOGUE, freshCampaign(CATALOGUE), won);

  await openSaved(page, chronicle);
  await dragOut(page, index);
  await aimed(page);
  await click(page, `tile-${tileKey(tile)}`);
  await playedOut(page);
  await expect.poll(() => victoryShown(page)).toBe(true);

  expect(paid.achievements.length).toBeGreaterThan(0);
  expect(paid.influence).toBeGreaterThan(0);
  for (const [at, id] of paid.achievements.entries()) {
    const { technology, influence } = achievementOf(CATALOGUE, won.age, id);
    expect(await textOf(page, `ending-row-${at}`)).toBe(
      text('ending.reached', { achievement: technologyName(technology) }),
    );
    expect(await textOf(page, `ending-row-${at}-influence`)).toBe(
      influence > 0 ? String(influence) : undefined,
    );
  }
  expect(await textOf(page, `ending-row-${paid.achievements.length}`)).toBeUndefined();
  expect(await textOf(page, 'ending-total-label')).toBe(text('label.influence'));
  expect(await textOf(page, 'ending-total')).toBe(String(paid.influence));

  const saved = await page.evaluate((entry) => window.localStorage.getItem(entry), SAVE_ENTRY);
  if (saved === null) throw new Error('the game keeps no save');
  expect(readSave(CATALOGUE, saved)).toEqual({
    campaign: paid.campaign,
    chronicle: undefined,
    dropped: [],
  });

  expect(await textOf(page, 'end-chronicle-label')).toBe(text('ending.end-chronicle'));
  await rested(page);
  await click(page, 'end-chronicle');
  await campaignShown(page);
  expect(await textOf(page, 'reading-influence-value')).toBe(String(paid.campaign.influence));
  await chronicleButton(page);
  expect(await standing(page, 'launch-continue')).toBe(false);

  expect(problems).toEqual([]);
});
