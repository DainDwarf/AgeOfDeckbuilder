import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { cardOf } from '../src/rules/catalogue';
import { freshCampaign } from '../src/rules/save';
import { text } from '../src/ui/text';
import type { Reference } from '../src/ui/text-run';
import {
  campaignShown,
  cardOnFace,
  chronicleButton,
  kindLabelOnScreen,
  nameOnScreen,
  onScreen,
  readNames,
  referenceOnFace,
  rested,
  standing,
  tooltipText,
  tooltipUp,
  watch,
} from './chronicle-screen';

/** The civilization a new campaign owns first, and the card its city section holds. */
const [[CIVILIZATION, OWNED]] = Object.entries(freshCampaign(CATALOGUE).civilizations);
const PILE = `launch-civilization-${CIVILIZATION}`;
const CITY_CARD = `${PILE}-card`;

/** The launch screen Chronicle opens from the campaign screen of a bare boot. */
async function openLaunch(page: Page): Promise<void> {
  await readNames(page);
  await page.goto('/');
  await campaignShown(page);
  await chronicleButton(page);
}

/** What the first name on the city card names, read off the face itself. */
function firstNamed(page: Page): Promise<Reference | undefined> {
  return page.evaluate((target) => {
    const face = window.named?.(target)?.object;
    const names = face?.getData('names') as { reference: Reference }[] | undefined;
    return names?.[0]?.reference;
  }, CITY_CARD);
}

/** What the named card a name raised stands: a card by its face, any other thing by its reference. */
async function namedOn(
  page: Page,
  name: string,
): Promise<{ kind: string; id: string } | undefined> {
  const card = await cardOnFace(page, name);
  return card === undefined ? referenceOnFace(page, name) : { kind: 'card', id: card };
}

function chosen(page: Page): Promise<boolean> {
  return page.evaluate((target) => window.named?.(target)?.object.getData('chosen') === true, PILE);
}

test('on the launch screen the pointer resting on the civilization’s city card’s kind label raises what the kind is, a right click on the card shows it large, and the back key takes it down and raises no menu', async ({
  page,
}) => {
  const problems = watch(page);
  await openLaunch(page);
  expect(await cardOnFace(page, CITY_CARD)).toBe(OWNED.city.card.id);

  const label = await kindLabelOnScreen(page, CITY_CARD);
  await page.mouse.move(label.x, label.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-launch')).toBe(true);
  expect(await tooltipText(page, 'tooltip-launch')).toBe(
    text(`tooltip.${cardOf(CATALOGUE, OWNED.city.card.id).kind}`),
  );

  const card = await onScreen(page, CITY_CARD);
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(OWNED.city.card.id);
  await rested(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  await rested(page);
  expect(await standing(page, 'menu')).toBe(false);

  expect(problems).toEqual([]);
});

test('on the launch screen the pointer resting on a name on the city card raises the named thing small, and a left click there leaves the civilization chosen and takes the small card down', async ({
  page,
}) => {
  const problems = watch(page);
  await openLaunch(page);
  const named = await firstNamed(page);
  expect(named).toBeDefined();

  const name = await nameOnScreen(page, CITY_CARD);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => namedOn(page, 'small-card-0')).toEqual(named);

  await page.mouse.click(name.x, name.y);
  await rested(page);
  expect(await chosen(page)).toBe(true);
  expect(await standing(page, 'small-card-0')).toBe(false);
  expect(await standing(page, 'inspection')).toBe(false);

  expect(problems).toEqual([]);
});
