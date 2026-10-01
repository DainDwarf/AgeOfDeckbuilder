import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { cardOf } from '../src/rules/catalogue';
import { freshCampaign } from '../src/rules/save';
import { browseOf } from '../src/ui/collection-layout';
import { cardName, civilizationName, text } from '../src/ui/text';
import type { Reference } from '../src/ui/text-run';
import {
  cardOnFace,
  kindLabelOnScreen,
  namedOn,
  nameOnScreen,
  onScreen,
  openLaunch,
  placeOf,
  rested,
  ringed,
  standing,
  textOf,
  titleOf,
  tooltipText,
  tooltipUp,
  watch,
} from './chronicle-screen';

/** A new campaign, as the bare address with no save opens on. */
const CAMPAIGN = freshCampaign(CATALOGUE);

/** The civilization a new campaign owns first, and the card its city section holds. */
const [[CIVILIZATION, OWNED]] = Object.entries(CAMPAIGN.civilizations);
const PILE = `launch-civilization-${CIVILIZATION}`;
const CITY_CARD = `${PILE}-card`;

const BROWSE = 'civilization-browse';

/** The civilization's browse: the count of its cards, and its stacks in the order the browse stands them in. */
const { count: CARDS, stacks: STACKS } = browseOf(CATALOGUE, CAMPAIGN, CIVILIZATION, cardName);

/** What the first name on the city card names, read off the face itself. */
function firstNamed(page: Page): Promise<Reference | undefined> {
  return page.evaluate((target) => {
    const face = window.named?.(target)?.object;
    const names = face?.getData('names') as { reference: Reference }[] | undefined;
    return names?.[0]?.reference;
  }, CITY_CARD);
}

function pileSelected(page: Page): Promise<boolean> {
  return page.evaluate(
    (target) => window.named?.(target)?.object.getData('selected') === true,
    PILE,
  );
}

test('on the launch screen the kind label on the civilization’s pile raises what the kind is; a right click on the pile raises its browse, the civilization’s name and count over a stack per card it holds, the city section’s card first, each reading its copies; a right click on a stack shows its card large, the back key takes it down onto the browse, then closes the browse and raises no menu; a right click on a name on the pile shows the named thing large and raises no browse', async ({
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
  await expect.poll(() => standing(page, BROWSE)).toBe(true);
  await rested(page);
  expect(await standing(page, 'inspection')).toBe(false);
  expect(await titleOf(page, BROWSE)).toBe(
    text('browse.civilization', { civilization: civilizationName(CIVILIZATION), count: CARDS }),
  );
  const placed: { x: number; y: number }[] = [];
  for (const [at, { id, copies }] of STACKS.entries()) {
    expect(await cardOnFace(page, `${BROWSE}-card-${at}`)).toBe(id);
    expect(await textOf(page, `${BROWSE}-card-${at}-copies`)).toBe(
      text('collection.row-copies', { copies }),
    );
    placed.push(await placeOf(page, `${BROWSE}-card-${at}`));
  }
  expect(await standing(page, `${BROWSE}-card-${STACKS.length}`)).toBe(false);
  const read = placed.map((at, index) => ({ at, index }));
  read.sort((a, b) => a.at.y - b.at.y || a.at.x - b.at.x);
  expect(read.map(({ index }) => index)).toEqual(STACKS.map((_, index) => index));

  const first = await onScreen(page, `${BROWSE}-card-0`);
  await page.mouse.click(first.x, first.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(OWNED.city.card.id);
  await rested(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  await rested(page);
  expect(await standing(page, BROWSE)).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, BROWSE)).toBe(false);
  await rested(page);
  expect(await standing(page, 'menu')).toBe(false);

  const named = await firstNamed(page);
  expect(named).toBeDefined();
  const name = await nameOnScreen(page, CITY_CARD);
  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => namedOn(page, 'inspection')).toEqual(named);
  await rested(page);
  expect(await standing(page, BROWSE)).toBe(false);

  expect(problems).toEqual([]);
});

test('on the launch screen the pointer resting on a name on the city card raises the named thing small, and a left click there leaves the civilization selected, its card ringed, and takes the small card down', async ({
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
  expect(await pileSelected(page)).toBe(true);
  expect(await ringed(page, CITY_CARD)).toBe(true);
  expect(await standing(page, 'small-card-0')).toBe(false);
  expect(await standing(page, 'inspection')).toBe(false);

  expect(problems).toEqual([]);
});
