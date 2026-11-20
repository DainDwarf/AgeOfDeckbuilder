import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import {
  besideTiles,
  chronicleOf,
  onScreen,
  openSaved,
  pieceWorn,
  rested,
  settledOn,
  watch,
} from './chronicle-screen';

test('End turn wears its hover look under the pointer and its pressed look while a press landed on it is held, and the turn ends as the press is let go', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1);

  await openSaved(page, opened);
  const button = await onScreen(page, 'end-turn');
  expect(await pieceWorn(page, 'end-turn')).toEqual({ piece: 'gold', look: 'normal' });

  await page.mouse.move(button.x, button.y, { steps: 5 });
  await expect.poll(() => pieceWorn(page, 'end-turn')).toEqual({ piece: 'gold', look: 'hover' });

  await page.mouse.down();
  await expect.poll(() => pieceWorn(page, 'end-turn')).toEqual({ piece: 'gold', look: 'pressed' });
  await rested(page);
  expect(await chronicleOf(page)).toEqual(opened);

  await page.mouse.up();
  await expect
    .poll(() => chronicleOf(page))
    .toEqual(outcome(apply(CATALOGUE, opened, { type: 'end-turn' })));

  expect(problems).toEqual([]);
});

test('a press held on End turn and dragged off it leaves its normal look, and its release there ends no turn', async ({
  page,
}) => {
  const problems = watch(page);
  const opened = settledOn(1);

  await openSaved(page, opened);
  const button = await onScreen(page, 'end-turn');
  const away = await besideTiles(page);

  await page.mouse.move(button.x, button.y, { steps: 5 });
  await page.mouse.down();
  await expect.poll(() => pieceWorn(page, 'end-turn')).toEqual({ piece: 'gold', look: 'pressed' });

  await page.mouse.move(away.x, away.y, { steps: 5 });
  await expect.poll(() => pieceWorn(page, 'end-turn')).toEqual({ piece: 'gold', look: 'normal' });
  await page.mouse.up();
  await rested(page);
  expect(await chronicleOf(page)).toEqual(opened);

  expect(problems).toEqual([]);
});
