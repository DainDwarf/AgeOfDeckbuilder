import { expect, type Page, test } from '@playwright/test';
import { STAND_IN } from '../src/content/stand-in';
import { deckOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { text } from '../src/ui/text';
import {
  budget,
  cardOf,
  chronicleOf,
  click,
  endedTurn,
  firstSeed,
  launch,
  onScreen,
  open,
  ringed,
  standing,
  stoppedTurn,
  take,
  titleOf,
  watch,
} from './chronicle-screen';

/** The earliest turn the schedule can bring an event on: the spacing's least. */
const DUE = 3;

/**
 * The first seed whose first event is due on that turn and whose deal offers the raid first, with a
 * camp free for it to enter a warrior on: what the take lands is then a warrior standing on the map.
 */
function dealRun(): number {
  return firstSeed('deals a raid first on its third turn', (seed) => {
    const opened = launch(seed, deckOf(STAND_IN, 'PH_Deck'));
    if (opened.nextEvent !== DUE) return undefined;

    let chronicle = opened;
    for (let turn = 1; turn < DUE - 1; turn++) chronicle = endedTurn(chronicle);
    const dealt = outcome(apply(STAND_IN, chronicle, { type: 'end-turn' }));
    if (dealt.deal[0] !== 'PH_Raid') return undefined;

    const landed = outcome(apply(STAND_IN, dealt, { type: 'take', event: 'PH_Raid' }));
    return landed.units.some((unit) => unit.faction === 'enemy') ? seed : undefined;
  });
}

/**
 * A point on the scrim beside the window's cards: at the left edge, clear of the frame they are laid
 * in and of the resource bar, which stands over the scrim while a deal waits to be taken.
 */
async function besideTheDeal(page: Page): Promise<{ x: number; y: number }> {
  return page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + 8, y: rect.top + rect.height / 2 };
  });
}

test('the events phase deals a choice, and the turn plays on from the one taken', async ({
  page,
}) => {
  const problems = watch(page);
  // The turns ended up to the due one, and the take that plays the rest of it out.
  test.setTimeout(budget(DUE));

  await open(page, dealRun(), 'PH_Deck');
  for (let turn = 1; turn < DUE; turn++) await stoppedTurn(page);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  const dealt = await chronicleOf(page);
  expect(dealt.turn).toBe(DUE);
  expect(dealt.hand).toEqual([]);
  expect(await titleOf(page, 'deal')).toBe(text('deal.title'));
  for (const [at, event] of dealt.deal.entries()) {
    expect(await cardOf(page, `deal-card-${at}`)).toBe(event);
  }

  const second = await onScreen(page, 'deal-card-1');
  await page.mouse.click(second.x, second.y, { button: 'right' });
  await expect.poll(() => cardOf(page, 'inspection')).toBe(dealt.deal[1]);

  const beside = await besideTheDeal(page);
  await page.mouse.click(beside.x, beside.y);
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  expect(await standing(page, 'deal')).toBe(true);

  await click(page, 'deal-card-0');
  await expect.poll(() => ringed(page, 'deal-card-0')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => ringed(page, 'deal-card-0')).toBe(false);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'menu')).toBe(false);
  await expect.poll(() => standing(page, 'deal')).toBe(true);

  await take(page, 0);

  const after = await chronicleOf(page);
  expect(await standing(page, 'deal')).toBe(false);
  expect(after.deal).toEqual([]);
  expect(after.turn).toBe(DUE);
  expect(after.nextEvent).toBeGreaterThan(DUE);
  expect(after.hand).toHaveLength(5);
  expect(after.units.some((unit) => unit.faction === 'enemy')).toBe(true);

  expect(problems).toEqual([]);
});
