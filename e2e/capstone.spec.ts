import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { capstoneReading } from '../src/rules/schedule';
import { capstoneText } from '../src/ui/event-text';
import { capstoneLore } from '../src/ui/lore';
import { text } from '../src/ui/text';
import {
  beforeTheLanding,
  cardOnFace,
  chronicleOf,
  click,
  loreOf,
  namedIn,
  nameOnScreen,
  openSaved,
  playedOut,
  readings,
  rested,
  standing,
  stoppedTurn,
  titleOf,
  watch,
} from './chronicle-screen';

test('the capstone’s landing holds the end of turn on its window over the hand the turn drew, a right click on a card its text names shows that card large and one on its paper nothing, and the landing plays out once it closes', async ({
  page,
}) => {
  const problems = watch(page);
  const { before, landed } = beforeTheLanding(
    'stands on an open turn the turn before the capstone lands',
    (before, landed) => ({ before, landed }),
  );
  const capstone = before.timeline.capstone.id;
  const names = namedIn(capstoneText(capstone, capstoneReading(CATALOGUE, landed, capstone)));
  const naming = names.findIndex((reference) => reference.kind === 'card');
  if (naming === -1) throw new Error(`the text of the ${capstone} names no card`);
  const named = names[naming].id;

  await openSaved(page, before);
  expect(await standing(page, 'capstone')).toBe(false);

  await stoppedTurn(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  expect(await titleOf(page, 'capstone')).toBe(text('capstone.title'));
  expect(await loreOf(page, 'capstone')).toBe(capstoneLore(capstone, 'landing'));
  expect(await cardOnFace(page, 'capstone-card-0')).toBe(capstone);
  expect((await chronicleOf(page)).hand).toEqual(landed.hand);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length}`)).toBe(false);

  await rested(page);
  const drawn = (await readings(page, ['capstone-card-0']))('capstone-card-0');
  const { x, y, width } = drawn.boundsOnScreen;
  const title = drawn.answerNameOnScreen;
  const paper = { x: x + width / 2, y: (y + title.y - title.height / 2) / 2 };
  await page.mouse.click(paper.x, paper.y, { button: 'right' });
  await rested(page);
  const offNames = await readings(page, ['inspection', 'capstone']);
  expect([offNames('inspection').standing, offNames('capstone').standing]).toEqual([false, true]);

  const name = await nameOnScreen(page, 'capstone-card-0', naming);
  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'capstone')).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);

  await click(page, 'capstone-card-0');
  await playedOut(page);
  expect(await standing(page, 'capstone')).toBe(false);
  await expect.poll(() => chronicleOf(page)).toEqual(landed);
  expect(await standing(page, `hand-${landed.hand.length - 1}`)).toBe(true);
  expect(await standing(page, `hand-${landed.hand.length}`)).toBe(false);

  await rested(page);
  expect(await standing(page, 'capstone')).toBe(false);
  expect(problems).toEqual([]);
});
