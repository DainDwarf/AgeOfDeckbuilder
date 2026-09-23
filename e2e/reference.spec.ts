import { expect, test } from '@playwright/test';
import {
  besideTheDeal,
  budget,
  cardOnFace,
  cursorOverCanvas,
  dealRun,
  nameOnScreen,
  onScreen,
  open,
  rested,
  standing,
  stoppedTurn,
  watch,
} from './chronicle-screen';

/** The cursor over something that answers a press. */
const HAND = 'pointer';

/** Longer than the hand-over a small card waits out before it goes down, so one going has gone. */
const PAST_HANDOVER = 400;

test('a card named on a card raises it small at a rest and shows it large at a right click, and one named on a card shown large stands it beside that one', async ({
  page,
}) => {
  const problems = watch(page);
  const run = dealRun();
  test.setTimeout(budget(run.due));

  await open(page, run.seed, 'PH_Deck');
  for (let turn = 1; turn < run.due; turn++) await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);
  await rested(page);
  expect(await cardOnFace(page, 'deal-card-1')).toBe('PH_Famine');

  const name = await nameOnScreen(page, 'deal-card-1');
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe('PH_Hunger');

  const small = await onScreen(page, 'small-card-0');
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await page.waitForTimeout(PAST_HANDOVER);
  expect(await standing(page, 'small-card-0')).toBe(true);

  const beside = await besideTheDeal(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe('PH_Hunger');
  expect(await standing(page, 'inspection-0')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

  const second = await onScreen(page, 'deal-card-1');
  await page.mouse.click(second.x, second.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe('PH_Famine');
  await rested(page);

  const large = await onScreen(page, 'inspection');
  await page.mouse.move(large.x, large.y);
  await expect.poll(() => cursorOverCanvas(page)).not.toBe(HAND);
  const named = await nameOnScreen(page, 'inspection');
  await page.mouse.move(named.x, named.y);
  await expect.poll(() => cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(named.x, named.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe('PH_Hunger');
  expect(await cardOnFace(page, 'inspection-0')).toBe('PH_Famine');

  await page.keyboard.press('Escape');
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe('PH_Famine');
  expect(await standing(page, 'inspection-0')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

  expect(problems).toEqual([]);
});
