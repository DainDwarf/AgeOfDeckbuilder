import { expect, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { cardOf, placingOf } from '../src/rules/catalogue';
import { buildingKind } from '../src/rules/map-kinds';
import { RESOURCES, type Resources } from '../src/rules/resources';
import { glyphFileOf } from '../src/ui/marks';
import { text } from '../src/ui/text';
import {
  campaignWith,
  firstSeed,
  idsOf,
  liftedName,
  nameOnScreen,
  onScreen,
  openSaved,
  readings,
  referenceOnFace,
  settledOn,
  watch,
} from './chronicle-screen';

/** The card the spec reads: one that builds a building on several terrains, giving and taking. */
const MEGALITH = 'megalith';

const CAMPAIGN = campaignWith([MEGALITH]);

/**
 * What a row reads of the amounts after the sign: the sign, then the glyph frames one to each point in
 * the order the resource bar reads; nothing where the amounts hold no point.
 */
function signed(sign: string, amounts: Partial<Resources>): string[] {
  const glyphs = RESOURCES.flatMap((resource) =>
    Array<string>(amounts[resource] ?? 0).fill(glyphFileOf(resource)),
  );
  return glyphs.length === 0 ? [] : [sign, ...glyphs];
}

test('a card that builds a building reads at the foot of its window the terrains its building goes on, and over its text what the building gives and takes; a rest on a terrain’s mark raises that terrain’s small card', async ({
  page,
}) => {
  const problems = watch(page);
  const placing = placingOf(cardOf(CATALOGUE, MEGALITH));
  if (placing?.thing !== 'building') throw new Error(`${MEGALITH} builds no building`);
  const building = buildingKind(CATALOGUE, placing.building);
  expect(placing.over).toBeUndefined();
  expect(building.features).toBeUndefined();
  expect(building.river).toBeUndefined();
  const marks = building.terrains.map((id) => ({ kind: 'terrain', id }));
  const { chronicle, index } = firstSeed('opens turn 1 with the megalith in hand', (seed) => {
    const opened = settledOn(seed, [], CAMPAIGN);
    const at = idsOf(opened.hand).indexOf(MEGALITH);
    return at === -1 ? undefined : { chronicle: opened, index: at };
  });
  const face = `hand-${index}`;

  await openSaved(page, chronicle, CAMPAIGN);
  const seen = (await readings(page, [face]))(face);
  expect(seen.card).toBe(MEGALITH);
  expect(seen.references).toEqual(marks);
  expect(seen.numbers).toEqual([
    ...signed(text('face.gives'), building.yields),
    ...signed(text('face.takes'), building.upkeep ?? {}),
  ]);

  const last = marks.length - 1;
  const card = await onScreen(page, face);
  const lying = await nameOnScreen(page, face, last);
  await page.mouse.move(card.x, card.y);
  const mark = await liftedName(page, lying, face, last);
  await page.mouse.move(mark.x, mark.y, { steps: 5 });
  await expect.poll(() => referenceOnFace(page, 'small-card-0')).toEqual(marks[last]);

  expect(problems).toEqual([]);
});
