import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { tileKey } from '../src/rules/map';
import { answerCost, answerOf, answerRefusal, offered } from '../src/rules/schedule';
import { eventLore } from '../src/ui/lore';
import { refused } from '../src/ui/refusal-lines';
import {
  besideTheDeal,
  capstoneClosed,
  chronicleOf,
  click,
  continued,
  cursorAt,
  enemiesOf,
  eventDealRead,
  type Frame,
  firstDealtAlone,
  offeredOn,
  openSaved,
  pieceOnScreenOf,
  plantSaved,
  playerCityTile,
  readings,
  refusalLines,
  rested,
  restedOnDeal,
  standing,
  take,
  tooltipText,
  tooltipUp,
  unpaidDealt,
  watch,
} from './chronicle-screen';

/** The event the first spec opens on. */
const LEAN_SEASON = 'lean-season';

/** The answer of the lean season that enters warriors. */
const RATION = 'ration';

/** The bubble every hover on the scrim raises. */
const TOOLTIP = 'tooltip-overlay';

/**
 * The window's ribbon, its own box on the page, read in one question with its title standing on it,
 * its lore under it and its first entry under the lore, each asserted.
 */
async function titledDownward(page: Page, window: string): Promise<Frame> {
  const seen = await readings(
    page,
    ['ribbon', 'title', 'lore', 'card-0'].map((part) => `${window}-${part}`),
  );
  const ribbon = pieceOnScreenOf(seen(`${window}-ribbon`));
  const title = seen(`${window}-title`).boundsOnScreen;
  const lore = seen(`${window}-lore`).boundsOnScreen;
  const row = seen(`${window}-card-0`).boundsOnScreen;
  expect(title.x).toBeGreaterThanOrEqual(ribbon.x);
  expect(title.x + title.width).toBeLessThanOrEqual(ribbon.x + ribbon.width);
  expect(title.y).toBeGreaterThanOrEqual(ribbon.y);
  expect(title.y + title.height).toBeLessThanOrEqual(ribbon.y + ribbon.height);
  expect(lore.y).toBeGreaterThanOrEqual(ribbon.y + ribbon.height);
  expect(row.y).toBeGreaterThanOrEqual(lore.y + lore.height);
  return ribbon;
}

test('the events phase deals a choice, and the turn plays on from the one a left click takes', async ({
  page,
}) => {
  const problems = watch(page);
  const dealt = firstDealtAlone(LEAN_SEASON);
  const answers = offeredOn(dealt);
  const ration = answers.indexOf(RATION);
  if (ration === -1) throw new Error(`the ${LEAN_SEASON} offers no ${RATION}`);
  const after = outcome(apply(CATALOGUE, dealt, { type: 'take', at: ration }));

  await openSaved(page, dealt);
  await restedOnDeal(page);
  const city = `tile-${tileKey(playerCityTile(dealt))}`;
  const shown = await eventDealRead(page, dealt, LEAN_SEASON, [city]);

  const first = shown('deal-card-0').onScreen;
  const second = shown('deal-card-1').onScreen;
  // The pointer never rests on a name of an answer: the small card a rest raises stands over the
  // answer's padding, and a right click on it shows the named thing large.
  const { x, y, width } = shown('deal-card-1').boundsOnScreen;
  const inset = 2 * second.unit;
  const offNames = {
    x: Math.min(Math.max(shown(city).onScreen.x, x + inset), x + width - inset),
    y: y + 6 * second.unit,
  };
  const unpayable = answerRefusal(CATALOGUE, dealt, LEAN_SEASON, answers[1]).unaffordable;
  expect(await cursorAt(page, { x: (first.x + second.x) / 2, y: first.y })).toBe('arrow');
  expect(await cursorAt(page, offNames)).toBe(
    unpayable.length > 0 ? 'not-allowed sign' : 'pointing hand',
  );

  // In the answer's padding over its name, as near the city's tile beneath as the answer reaches.
  await page.mouse.click(offNames.x, offNames.y, { button: 'right' });
  await rested(page);
  const inspected = await readings(page, [
    'inspection',
    'infopanel',
    'deal',
    'deal-card-1',
    'deal-lore',
  ]);
  expect([inspected('inspection').standing, inspected('infopanel').standing]).toEqual([
    false,
    false,
  ]);
  expect(inspected('deal').standing).toBe(true);
  expect(inspected('deal-card-1').standing).toBe(true);
  expect(inspected('deal-lore').text).toBe(eventLore(LEAN_SEASON));

  const beside = await besideTheDeal(page);
  await page.mouse.click(beside.x, beside.y);
  await rested(page);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await chronicleOf(page)).toEqual(dealt);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  await take(page, ration);

  expect(await standing(page, 'deal')).toBe(false);
  expect(await chronicleOf(page)).toEqual(after);
  expect(enemiesOf(after).length).toBeGreaterThan(enemiesOf(dealt).length);

  expect(problems).toEqual([]);
});

test('the capstone’s window and a deal’s each stand their title on the ribbon, the ribbon at one height, the lore under the title and the row under the lore', async ({
  page,
}) => {
  const problems = watch(page);

  await plantSaved(page, firstDealtAlone(LEAN_SEASON));
  await continued(page);
  await expect.poll(() => standing(page, 'capstone')).toBe(true);
  await rested(page);
  const capstone = await titledDownward(page, 'capstone');

  await capstoneClosed(page);
  await restedOnDeal(page);
  const deal = await titledDownward(page, 'deal');
  expect(deal.y).toBeCloseTo(capstone.y, 3);
  expect(deal.height).toBeCloseTo(capstone.height, 3);

  expect(problems).toEqual([]);
});

test('the pointer resting on an answer the city cannot pay for says why over it, and a left click on it takes that down and says it again in the note, takes and pays nothing, and the inspection key then shows nothing', async ({
  page,
}) => {
  const problems = watch(page);
  const { dealt, answer } = unpaidDealt();
  const [deal] = dealt.deals;
  if (deal?.of !== 'event') throw new Error(`turn ${dealt.turn} deals no event`);
  const at = offered(CATALOGUE, dealt, deal).indexOf(answer);
  const said = refused(
    answerCost(CATALOGUE, dealt, answerOf(CATALOGUE, deal.event, answer)),
    answerRefusal(CATALOGUE, dealt, deal.event, answer),
  );

  await openSaved(page, dealt);
  await restedOnDeal(page);

  const refusedAnswer = `deal-card-${at}`;
  const seen = await readings(page, [refusedAnswer]);
  const box = seen(refusedAnswer).boundsOnScreen;
  const { unit } = seen(refusedAnswer).onScreen;
  // In the answer's padding over its name, off every name its text draws.
  await page.mouse.move(box.x + 12 * unit, box.y + 6 * unit);
  await expect.poll(() => tooltipUp(page, TOOLTIP)).toBe(true);
  expect(await tooltipText(page, TOOLTIP)).toBe(said.join('\n'));
  const bubble = await readings(page, [TOOLTIP, refusedAnswer]);
  const over = bubble(TOOLTIP).boundsOnScreen;
  expect(over.y + over.height).toBeLessThanOrEqual(bubble(refusedAnswer).boundsOnScreen.y);

  await click(page, refusedAnswer);
  await expect.poll(() => refusalLines(page)).toEqual(said);
  expect(await tooltipUp(page, TOOLTIP)).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);
  expect(await chronicleOf(page)).toEqual(dealt);

  await page.keyboard.press('i');
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(false);

  expect(problems).toEqual([]);
});
