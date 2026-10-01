import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { cardOf } from '../src/rules/catalogue';
import { freshCampaign } from '../src/rules/save';
import { browseOf } from '../src/ui/collection-layout';
import { cardName, civilizationName, text } from '../src/ui/text';
import type { Reference } from '../src/ui/text-run';
import {
  cardOnFace,
  namedOn,
  onScreen,
  openLaunch,
  type Reading,
  reading,
  readings,
  readOrder,
  rested,
  standing,
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

/** What the first name a face draws names, and nothing where no face stands or it draws none. */
function firstNamed(face: Reading): Reference | undefined {
  return face.standing ? face.references[0] : undefined;
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
  const opened = await reading(page, CITY_CARD);
  expect(opened.card).toBe(OWNED.city.card.id);

  const label = opened.kindLabelOnScreen;
  await page.mouse.move(label.x, label.y);
  await expect.poll(() => tooltipUp(page, 'tooltip-launch')).toBe(true);
  expect(await tooltipText(page, 'tooltip-launch')).toBe(
    text(`tooltip.${cardOf(CATALOGUE, OWNED.city.card.id).kind}`),
  );

  const card = await onScreen(page, CITY_CARD);
  await page.mouse.click(card.x, card.y, { button: 'right' });
  await expect.poll(() => standing(page, BROWSE)).toBe(true);
  await rested(page);
  const seen = await readings(page, [
    'inspection',
    ...STACKS.flatMap((_, at) => [`${BROWSE}-card-${at}`, `${BROWSE}-card-${at}-copies`]),
    `${BROWSE}-card-${STACKS.length}`,
  ]);
  expect(seen('inspection').standing).toBe(false);
  expect(await titleOf(page, BROWSE)).toBe(
    text('browse.civilization', { civilization: civilizationName(CIVILIZATION), count: CARDS }),
  );
  for (const [at, { id, copies }] of STACKS.entries()) {
    expect(seen(`${BROWSE}-card-${at}`).card).toBe(id);
    expect(seen(`${BROWSE}-card-${at}-copies`).text).toBe(
      text('collection.row-copies', { copies }),
    );
  }
  expect(seen(`${BROWSE}-card-${STACKS.length}`).standing).toBe(false);
  const indices = STACKS.map((_, index) => index);
  expect(readOrder(indices, (index) => seen(`${BROWSE}-card-${index}`).place)).toEqual(indices);

  const first = seen(`${BROWSE}-card-0`).onScreen;
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
  const closed = await readings(page, ['menu', CITY_CARD]);
  expect(closed('menu').standing).toBe(false);

  const named = firstNamed(closed(CITY_CARD));
  expect(named).toBeDefined();
  const name = closed(CITY_CARD).nameOnScreen;
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
  const opened = await reading(page, CITY_CARD);
  const named = firstNamed(opened);
  expect(named).toBeDefined();

  const name = opened.nameOnScreen;
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => namedOn(page, 'small-card-0')).toEqual(named);

  await page.mouse.click(name.x, name.y);
  await rested(page);
  expect(await pileSelected(page)).toBe(true);
  const clicked = await readings(page, [CITY_CARD, 'small-card-0', 'inspection']);
  expect(clicked(CITY_CARD).ringed).toBe(true);
  expect(clicked('small-card-0').standing).toBe(false);
  expect(clicked('inspection').standing).toBe(false);

  expect(problems).toEqual([]);
});
