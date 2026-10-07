import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { ageOf, firstAge, technologyOf } from '../src/rules/catalogue';
import { freshCampaign } from '../src/rules/save';
import { browseOf } from '../src/ui/collection-layout';
import { cardFaceAtStart, kindTooltip } from '../src/ui/face';
import { openingChoices } from '../src/ui/launch-layout';
import { ageName, cardName, civilizationName, text } from '../src/ui/text';
import type { Reference } from '../src/ui/text-run';
import {
  cardOnFace,
  chronicleOf,
  click,
  launchedAs,
  launchedFromScreen,
  namedOn,
  onScreen,
  openLaunch,
  optionsSelected,
  plantCampaign,
  type Reading,
  reading,
  readings,
  readOrder,
  readsOf,
  rested,
  standing,
  titleOf,
  tooltipText,
  tooltipUp,
  watch,
  wonCampaign,
} from './chronicle-screen';

/** A new campaign, as the bare address with no save opens on. */
const CAMPAIGN = freshCampaign(CATALOGUE);

/** The civilization a new campaign owns first, and the card its city section holds. */
const [[CIVILIZATION, OWNED]] = Object.entries(CAMPAIGN.civilizations);
const PILE = `launch-civilization-${CIVILIZATION}`;
const CITY_CARD = `${PILE}-card`;

const BROWSE = 'civilization-browse';

/** The first age, a technology its achievements earn that unlocks an age, and that age. */
const FIRST = firstAge(CATALOGUE);
const { technology: UNLOCKER, age: UNLOCKED } = (() => {
  for (const { technology } of Object.values(ageOf(CATALOGUE, FIRST).achievements)) {
    const { age } = technologyOf(CATALOGUE, technology).unlocks;
    if (age !== undefined) return { technology, age };
  }
  throw new Error(`no technology the age ${FIRST} earns unlocks an age`);
})();

/** The segments of the two ages on the time arrow. */
const FIRST_AGE = `launch-age-${FIRST}`;
const UNLOCKED_AGE = `launch-age-${UNLOCKED}`;

/** The civilization's browse: the count of its cards, and its stacks in the order the browse stands them in. */
const { count: CARDS, stacks: STACKS } = browseOf(CATALOGUE, CAMPAIGN, CIVILIZATION, cardName);

/** What the first name a face draws names, and nothing where no face stands or it draws none. */
function firstNamed(face: Reading): Reference | undefined {
  return face.standing ? face.references[0] : undefined;
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
    kindTooltip(cardFaceAtStart(CATALOGUE, OWNED.city.card.id).kind),
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
  const clicked = await readings(page, [PILE, CITY_CARD, 'small-card-0', 'inspection']);
  expect(clicked(PILE).selected).toBe(true);
  expect(clicked(CITY_CARD).ringed).toBe(true);
  expect(clicked('small-card-0').standing).toBe(false);
  expect(clicked('inspection').standing).toBe(false);

  expect(problems).toEqual([]);
});

test('on a new campaign the age the first age’s technology unlocks stands on the time arrow reading ??? alone, and a press on it leaves the first age selected', async ({
  page,
}) => {
  const problems = watch(page);
  await openLaunch(page);
  expect(await readsOf(page, [FIRST_AGE, UNLOCKED_AGE])).toEqual([
    [ageName(FIRST)],
    [text('launch.unknown-age')],
  ]);

  await click(page, UNLOCKED_AGE);
  await rested(page);
  expect(await optionsSelected(page, [FIRST_AGE, UNLOCKED_AGE])).toEqual([true, false]);

  expect(problems).toEqual([]);
});

test('on a campaign that has learned the first age’s technology the launch screen opens on the age it unlocks and the first region of that age the campaign has reached; a press on the first age selects it and keeps the region, a press on the unlocked age selects it again, and Launch opens the chronicle the rules launch on that age, that region, the campaign’s civilization and the seed drawn, with the campaign’s technologies learned', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = wonCampaign();
  expect(campaign.technologies).toContain(UNLOCKER);
  const { region } = openingChoices(CATALOGUE, campaign);
  expect(Object.keys(ageOf(CATALOGUE, FIRST).regions)).toContain(region);
  const [civilization] = Object.keys(campaign.civilizations);

  await plantCampaign(page, campaign);
  await openLaunch(page);
  const options = [FIRST_AGE, UNLOCKED_AGE, `launch-region-${region}`];
  expect(await optionsSelected(page, options)).toEqual([false, true, true]);

  await click(page, FIRST_AGE);
  await expect.poll(() => optionsSelected(page, options)).toEqual([true, false, true]);
  await rested(page);

  await click(page, UNLOCKED_AGE);
  await expect.poll(() => optionsSelected(page, options)).toEqual([false, true, true]);

  await launchedFromScreen(page);
  const chronicle = await chronicleOf(page);
  expect(chronicle).toEqual(
    launchedAs(campaign, { age: UNLOCKED, region, civilization }, chronicle.seed),
  );

  expect(problems).toEqual([]);
});
