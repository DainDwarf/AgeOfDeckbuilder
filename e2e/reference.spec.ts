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

/** The most cards shown large a stack holds. */
const STACK_HOLDS = 12;

test('a card named on a card raises it small at a rest and shows it large at a right click on the name or on the small card, and one named on a card shown large stands a new copy on top of the stack, twelve at most', async ({
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
  expect(await cursorOverCanvas(page)).toBe(HAND);

  const beside = await besideTheDeal(page);
  await page.mouse.move(beside.x, beside.y, { steps: 5 });
  await expect.poll(() => standing(page, 'small-card-0')).toBe(false);

  await page.mouse.move(name.x, name.y, { steps: 5 });
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe('PH_Hunger');
  await page.mouse.move(small.x, small.y, { steps: 5 });
  const deeper = await nameOnScreen(page, 'small-card-0');
  await page.mouse.move(deeper.x, deeper.y, { steps: 5 });
  await expect.poll(() => cardOnFace(page, 'small-card-1')).toBe('PH_Hunger');
  // The deeper card stands above the name that raised it: the body it leaves clear is below that name.
  const body = { x: small.x, y: (deeper.y + name.y) / 2 };
  await page.mouse.move(body.x, body.y, { steps: 5 });
  await page.waitForTimeout(PAST_HANDOVER);
  expect(await standing(page, 'small-card-1')).toBe(false);
  expect(await cursorOverCanvas(page)).toBe(HAND);

  await page.mouse.click(body.x, body.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe('PH_Hunger');
  expect(await standing(page, 'small-card-0')).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

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
  await rested(page);

  // Hunger names itself: each right click on the newest card's name stands another copy on top.
  for (let count = 3; count <= STACK_HOLDS; count++) {
    const own = await nameOnScreen(page, 'inspection');
    await page.mouse.click(own.x, own.y, { button: 'right' });
    await expect.poll(() => standing(page, `inspection-${count - 2}`)).toBe(true);
    expect(await cardOnFace(page, 'inspection')).toBe('PH_Hunger');
    expect(await cardOnFace(page, `inspection-${count - 2}`)).toBe('PH_Hunger');
    expect(await cardOnFace(page, 'inspection-0')).toBe('PH_Famine');
    await rested(page);
  }

  // Measured on two copies of one card: two different faces place their names differently.
  const full = await nameOnScreen(page, 'inspection');
  const beneath = await nameOnScreen(page, `inspection-${STACK_HOLDS - 2}`);
  expect(beneath.x).toBeLessThan(full.x);
  expect(beneath.y).toBeLessThan(full.y);
  await page.mouse.click(full.x, full.y, { button: 'right' });
  await rested(page);
  expect(await standing(page, `inspection-${STACK_HOLDS - 1}`)).toBe(false);
  expect(await standing(page, `inspection-${STACK_HOLDS - 2}`)).toBe(true);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe('PH_Hunger');

  for (let left = STACK_HOLDS - 1; left >= 1; left--) {
    await page.keyboard.press('Escape');
    await expect.poll(() => standing(page, `inspection-${left - 1}`)).toBe(false);
    expect(await standing(page, 'inspection')).toBe(true);
    if (left >= 2) expect(await standing(page, `inspection-${left - 2}`)).toBe(true);
  }
  expect(await cardOnFace(page, 'inspection')).toBe('PH_Famine');

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

  expect(problems).toEqual([]);
});
