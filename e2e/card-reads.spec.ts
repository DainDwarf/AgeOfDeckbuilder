import { expect, type Page, test } from '@playwright/test';
import { CATALOGUE } from '../src/content/catalogue';
import { STONE } from '../src/content/stone';
import type { Campaign } from '../src/rules/campaign';
import { cardOf, placingOf, unitKind } from '../src/rules/catalogue';
import { buildingKind } from '../src/rules/map-kinds';
import { RESOURCES, type Resources } from '../src/rules/resources';
import type { Chronicle } from '../src/rules/state';
import { artFrameOf } from '../src/ui/art-sheet';
import { BADGES } from '../src/ui/card-frames';
import { glyphFileOf } from '../src/ui/cast';
import {
  BADGE_STATS,
  BOX_STATS,
  type CardStat,
  cardFace,
  frontWindowOf,
  statReading,
} from '../src/ui/face';
import { text } from '../src/ui/text';
import {
  campaignWith,
  cardOnFace,
  firstSeed,
  idsOf,
  liftedName,
  liftedPart,
  nameOnScreen,
  onScreen,
  openSaved,
  reading,
  readings,
  type StatShown,
  settledOn,
  standsFor,
  tooltipLines,
  tooltipUp,
  WORKER,
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

/** Where the number of a stat a face shows sits on the page; a stat it does not show throws. */
function statOnScreen(stats: readonly StatShown[], stat: CardStat): { x: number; y: number } {
  const shown = stats.find((one) => one.stat === stat);
  if (shown === undefined) throw new Error(`the face shows no ${stat}`);
  return shown.onScreen;
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
  const marks = building.terrains.map((id) => ({ kind: 'terrain' as const, id }));
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
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(standsFor(marks[last]));

  expect(problems).toEqual([]);
});

/** Each card of the chronicle's hand, opened on the campaign, wears in its art box the picture its card holds. */
async function handWearsItsPictures(
  page: Page,
  chronicle: Chronicle,
  campaign?: Campaign,
): Promise<void> {
  const city = chronicle.citySection.building;
  const faces = chronicle.hand.map((_, at) => `hand-${at}`);
  const held = chronicle.hand.map((card) => {
    const { art, front } = cardFace(CATALOGUE, card, city);
    if (art === undefined) throw new Error(`the card ${card.id} holds no painting`);
    return { card: card.id, art: artFrameOf(art, frontWindowOf(front)) };
  });

  await openSaved(page, chronicle, campaign);
  const read = await readings(page, faces);
  expect(faces.map((face) => ({ card: read(face).card, art: read(face).art }))).toEqual(held);
}

test('each card of a Nomadic hand wears in its art box the picture its card holds, the oval window’s and the arched one’s alike', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle } = firstSeed('opens turn 1 with cards of both windows in hand', (seed) => {
    const opened = settledOn(seed);
    const city = opened.citySection.building;
    const windows = opened.hand.map((card) => frontWindowOf(cardFace(CATALOGUE, card, city).front));
    return new Set(windows).size === 2 ? { chronicle: opened } : undefined;
  });

  await handWearsItsPictures(page, chronicle);

  expect(problems).toEqual([]);
});

test('each card of a hand of a Stone deck wears in its art box the picture its card holds, a card that places an improvement among them', async ({
  page,
}) => {
  const problems = watch(page);
  const campaign = campaignWith(
    Object.values(STONE.brings.technologies ?? {}).flatMap(({ unlocks }) =>
      Object.keys(unlocks.cards),
    ),
  );
  const { chronicle } = firstSeed(
    'opens turn 1 with a card that places an improvement in hand',
    (seed) => {
      const opened = settledOn(seed, [], campaign);
      const improving = opened.hand.some(
        ({ id }) => placingOf(cardOf(CATALOGUE, id))?.thing === 'improvement',
      );
      return improving ? { chronicle: opened } : undefined;
    },
  );

  await handWearsItsPictures(page, chronicle, campaign);

  expect(problems).toEqual([]);
});

test('a card that places a unit reads its unit’s damage and health on the badges at its foot and its move, action, range and sight as glyphs and numbers in its text box; a rest on a stat raises its name over its sentence', async ({
  page,
}) => {
  const problems = watch(page);
  const placing = placingOf(cardOf(CATALOGUE, WORKER));
  if (placing?.thing !== 'unit') throw new Error(`${WORKER} places no unit`);
  const kind = unitKind(CATALOGUE, placing.unit);
  const { chronicle, index } = firstSeed('opens turn 1 with a worker in hand', (seed) => {
    const opened = settledOn(seed);
    const at = idsOf(opened.hand).indexOf(WORKER);
    return at === -1 ? undefined : { chronicle: opened, index: at };
  });
  const face = `hand-${index}`;
  const byStat = (one: { stat: string }, other: { stat: string }): number =>
    one.stat.localeCompare(other.stat);
  const shown = [
    ...BADGE_STATS.map((stat) => ({ stat, sign: BADGES[stat].frame })),
    ...BOX_STATS.flat().map((stat) => ({ stat, sign: glyphFileOf(stat) })),
  ].map(({ stat, sign }) => ({ stat, sign, number: statReading(stat, kind[stat]) }));

  await openSaved(page, chronicle);
  const lying = await reading(page, face);
  expect(lying.card).toBe(WORKER);
  expect(lying.rules).toBe(
    cardFace(CATALOGUE, chronicle.hand[index], chronicle.citySection.building).rules,
  );
  expect(
    lying.stats.map(({ stat, sign, number }) => ({ stat, sign, number })).sort(byStat),
  ).toEqual(shown.sort(byStat));

  const card = await onScreen(page, face);
  await page.mouse.move(card.x, card.y, { steps: 5 });
  for (const stat of ['health', 'move'] as const) {
    const lifted = await liftedPart(
      page,
      async () => statOnScreen((await reading(page, face)).stats, stat),
      statOnScreen(lying.stats, stat),
    );
    await page.mouse.move(lifted.x, lifted.y, { steps: 5 });
    await expect
      .poll(() => tooltipLines(page, 'tooltip-ui'))
      .toEqual([
        { text: text(`label.${stat}`), bold: true },
        { text: text(`tooltip.${stat}`), bold: false },
      ]);
    expect(await tooltipUp(page, 'tooltip-ui')).toBe(true);
  }

  expect(problems).toEqual([]);
});
