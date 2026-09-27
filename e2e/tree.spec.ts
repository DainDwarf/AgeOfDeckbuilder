import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { newCampaign, paidInto } from '../src/rules/campaign';
import { ageOf, firstAge, technologyOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { DEFAULTS } from '../src/ui/bindings';
import { achievementGoal, ageName, referenceName, technologyName, text } from '../src/ui/text';
import { layOutRun, type Reference } from '../src/ui/text-run';
import { WASH } from '../src/ui/tree-layout';
import {
  campaignShown,
  cardOnFace,
  firstsOf,
  idsOf,
  landed,
  nameOnScreen,
  plantCampaign,
  readNames,
  rested,
  SHELTER,
  waitGameClock,
  watch,
} from './chronicle-screen';

/** The first age of the catalogue, its first achievement, and the technology that achievement earns. */
const AGE = firstAge(CATALOGUE);
const [[ACHIEVEMENT, EARNED]] = Object.entries(ageOf(CATALOGUE, AGE).achievements);
const TECHNOLOGY = EARNED.technology;
const PLATE = `plate-${TECHNOLOGY}`;

/** What an entry names, laid out as a run on a measure of one to the character. */
function namedIn(entry: string): Reference[] {
  const measure = (content: string): number => content.length;
  const metrics = { width: Number.POSITIVE_INFINITY, glyph: 1, bearing: 0, space: 1 };
  return layOutRun(entry, measure, metrics, referenceName).names.map((name) => name.reference);
}

/** What the plate's reward reads, line by line: what the technology unlocks, and the influence. */
function rewardOf(): string[] {
  const { unlocks } = technologyOf(CATALOGUE, TECHNOLOGY);
  return [
    ...Object.entries(unlocks.cards).map(([card, copies]) => text('plate.cards', { copies, card })),
    ...(unlocks.age === undefined ? [] : [text('plate.age', { age: ageName(unlocks.age) })]),
    ...(EARNED.influence > 0 ? [String(EARNED.influence)] : []),
  ];
}

/** What a plate stands as and reads: its state, its name, its goal, and its reward's lines. */
function plateReads(
  page: Page,
  plate: string,
): Promise<{ state: string; name: string; goal: string; reward: string[] }> {
  return page.evaluate((named) => {
    const read = (name: string): string | undefined =>
      (window.named?.(name)?.object as Phaser.GameObjects.Text | undefined)?.text;
    const face = window.named?.(named)?.object;
    if (face === undefined) throw new Error(`there is no ${named}`);
    const reward: string[] = [];
    for (let at = 0; read(`${named}-reward-${at}`) !== undefined; at++) {
      reward.push(read(`${named}-reward-${at}`) ?? '');
    }
    return {
      state: face.getData('state') as string,
      name: read(`${named}-name`) ?? '',
      goal: read(`${named}-goal`) ?? '',
      reward,
    };
  }, plate);
}

/** Where the named object spans across the screen, in design units. */
function spanOf(page: Page, name: string): Promise<{ left: number; right: number }> {
  return page.evaluate((target) => {
    const found = window.named?.(target)?.object as
      | (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.GetBounds)
      | undefined;
    if (found === undefined) throw new Error(`there is no ${target}`);
    const bounds = found.getBounds();
    return { left: bounds.left, right: bounds.right };
  }, name);
}

/** Where the tree stands: its left end, in design units. */
function treeAt(page: Page): Promise<number> {
  return page.evaluate(() => {
    const tree = window.named?.('tree')?.object as Phaser.GameObjects.Container | undefined;
    if (tree === undefined) throw new Error('there is no tree');
    return tree.x;
  });
}

/** The campaign screen booted on the campaign, its tree standing. */
async function openCampaign(page: Page, campaign = newCampaign(CATALOGUE, firstsOf().deck)) {
  await readNames(page);
  await plantCampaign(page, campaign);
  await page.goto('/');
  await campaignShown(page);
}

test('on a new campaign the first age’s technology stands within reach on its age’s ground, reading its name, its goal and its reward, and the pointer resting on the name in its goal raises that card small', async ({
  page,
}) => {
  const problems = watch(page);
  await openCampaign(page);

  expect(await plateReads(page, PLATE)).toEqual({
    state: 'within-reach',
    name: technologyName(TECHNOLOGY),
    goal: achievementGoal(ACHIEVEMENT),
    reward: rewardOf(),
  });
  const ground = await spanOf(page, `ground-${AGE}`);
  const plate = await spanOf(page, PLATE);
  expect(plate.left).toBeGreaterThan(ground.left);
  expect(plate.right).toBeLessThan(ground.right);

  const [named] = namedIn(achievementGoal(ACHIEVEMENT));
  expect(named?.kind).toBe('card');
  const name = await nameOnScreen(page, PLATE);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named?.id);

  expect(problems).toEqual([]);
});

test('on a campaign a won chronicle paid into, its technology stands unlocked, the check mark before its name', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  const { campaign } = paidInto(CATALOGUE, newCampaign(CATALOGUE, firstsOf().deck), won);
  expect(campaign.technologies).toContain(TECHNOLOGY);

  await openCampaign(page, campaign);

  expect(await plateReads(page, PLATE)).toEqual({
    state: 'unlocked',
    name: text('plate.unlocked', { technology: technologyName(TECHNOLOGY) }),
    goal: achievementGoal(ACHIEVEMENT),
    reward: rewardOf(),
  });
  expect(await page.evaluate((well) => window.named?.(well) !== undefined, `${PLATE}-well`)).toBe(
    true,
  );

  expect(problems).toEqual([]);
});

test('a tree the room holds whole stands where it is under the two pan keys, a drag and a wheel notch', async ({
  page,
}) => {
  const problems = watch(page);
  await openCampaign(page);

  const ground = await spanOf(page, `ground-${AGE}`);
  const right = await page.evaluate(
    () => window.game?.scene.getScene('campaign').cameras.main.worldView.right ?? 0,
  );
  expect(ground.right + WASH / 2).toBeLessThanOrEqual(right);
  const standing = await treeAt(page);

  for (const control of ['pan-left', 'pan-right'] as const) {
    for (const slot of DEFAULTS[control]) {
      if (slot === undefined) continue;
      await page.keyboard.down(slot.code);
      await waitGameClock(page, 200);
      await page.keyboard.up(slot.code);
      await rested(page);
      expect(await treeAt(page)).toBe(standing);
    }
  }

  const room = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width * 0.8, y: rect.top + rect.height * 0.8 };
  });
  await page.mouse.move(room.x, room.y);
  await page.mouse.down();
  await page.mouse.move(room.x - 300, room.y, { steps: 10 });
  await rested(page);
  expect(await treeAt(page)).toBe(standing);
  await page.mouse.up();
  await rested(page);
  expect(await treeAt(page)).toBe(standing);

  await page.mouse.wheel(0, 100);
  await rested(page);
  expect(await treeAt(page)).toBe(standing);

  expect(problems).toEqual([]);
});
