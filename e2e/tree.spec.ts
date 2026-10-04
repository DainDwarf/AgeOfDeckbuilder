import { expect, type Page, test } from '@playwright/test';
import type Phaser from 'phaser';
import { CATALOGUE } from '../src/content/catalogue';
import { paidInto } from '../src/rules/campaign';
import { ageOf, firstAge, technologyOf } from '../src/rules/catalogue';
import { apply, outcome } from '../src/rules/chronicle';
import { freshCampaign } from '../src/rules/save';
import { DEFAULTS } from '../src/ui/bindings';
import { achievementGoal, ageName, technologyName, text } from '../src/ui/text';
import { WASH } from '../src/ui/tree-layout';
import {
  campaignShown,
  cardOnFace,
  idsOf,
  landed,
  namedIn,
  nameOnScreen,
  onScreen,
  plantCampaign,
  readings,
  readNames,
  rested,
  SHELTER,
  standing,
  textOf,
  waitGameClock,
  watch,
} from './chronicle-screen';

/** The first age of the catalogue, its first achievement, and the technology that achievement earns. */
const AGE = firstAge(CATALOGUE);
const [[ACHIEVEMENT, EARNED]] = Object.entries(ageOf(CATALOGUE, AGE).achievements);
const TECHNOLOGY = EARNED.technology;
const PLATE = `plate-${TECHNOLOGY}`;

/** The age the first age's technology unlocks, and the last age of the catalogue. */
const NEXT = technologyOf(CATALOGUE, TECHNOLOGY).unlocks.age;
const LAST = Object.keys(CATALOGUE.ages).at(-1);

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
async function plateReads(
  page: Page,
  plate: string,
): Promise<{ state: string; name: string; goal: string; reward: string[] }> {
  const state = await page.evaluate((named) => {
    const face = window.named?.(named)?.object;
    if (face === undefined) throw new Error(`there is no ${named}`);
    return face.getData('state') as string;
  }, plate);
  const reward: string[] = [];
  for (let at = 0; ; at++) {
    const line = await textOf(page, `${plate}-reward-${at}`);
    if (line === undefined) break;
    reward.push(line);
  }
  return {
    state,
    name: (await textOf(page, `${plate}-name`)) ?? '',
    goal: (await textOf(page, `${plate}-goal`)) ?? '',
    reward,
  };
}

/**
 * Where the tree's two ends stand, in design units: its left end, and its right end half a wash past
 * where the last age's ground ends.
 */
function treeEnds(page: Page): Promise<{ left: number; right: number }> {
  return page.evaluate(
    ({ last, wash }) => {
      const tree = window.named?.('tree')?.object as Phaser.GameObjects.Container | undefined;
      const ground = window.named?.(`ground-${last}`)?.object as
        | Phaser.GameObjects.Rectangle
        | undefined;
      if (tree === undefined || ground === undefined) throw new Error('there is no tree');
      return { left: tree.x, right: tree.x + ground.x + ground.width + wash / 2 };
    },
    { last: LAST, wash: WASH },
  );
}

/** The room's two edges, in design units: the navbar's right edge, and the screen's. */
function roomEdges(page: Page): Promise<{ left: number; right: number }> {
  return page.evaluate(() => {
    const navbar = window.named?.('navbar')?.object as Phaser.GameObjects.Rectangle | undefined;
    const right = window.game?.scene.getScene('campaign').cameras.main.worldView.right;
    if (navbar === undefined || right === undefined) throw new Error('there is no campaign screen');
    return { left: navbar.getBounds().right, right };
  });
}

/** The campaign screen booted on the campaign, its tree standing. */
async function openCampaign(page: Page, campaign = freshCampaign(CATALOGUE)) {
  await readNames(page);
  await plantCampaign(page, campaign);
  await page.goto('/');
  await campaignShown(page);
}

test('on a new campaign the first age’s technology stands available on the border between its age’s ground and the next age’s, reading its name, its goal and its reward, and the pointer resting on the name in its goal raises that card small', async ({
  page,
}) => {
  const problems = watch(page);
  await openCampaign(page);

  expect(await plateReads(page, PLATE)).toEqual({
    state: 'available',
    name: technologyName(TECHNOLOGY),
    goal: achievementGoal(ACHIEVEMENT, EARNED.need),
    reward: rewardOf(),
  });
  const seen = await readings(page, [`ground-${AGE}`, `ground-${NEXT}`, PLATE]);
  const border = seen(`ground-${AGE}`).across.right;
  expect(seen(`ground-${NEXT}`).across.left).toBe(border);
  expect(seen(PLATE).across.left).toBeLessThan(border);
  expect(seen(PLATE).across.right).toBeGreaterThan(border);

  const [named] = namedIn(achievementGoal(ACHIEVEMENT, EARNED.need));
  expect(named?.kind).toBe('card');
  const name = await nameOnScreen(page, PLATE);
  await page.mouse.move(name.x, name.y);
  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named?.id);

  expect(problems).toEqual([]);
});

test('on a new campaign a right click on the name in the available plate’s goal shows that card large, the back key takes it down and raises no menu, and a right click on the small card the name raises shows it large again', async ({
  page,
}) => {
  const problems = watch(page);
  await openCampaign(page);
  const [named] = namedIn(achievementGoal(ACHIEVEMENT, EARNED.need));
  expect(named?.kind).toBe('card');

  const name = await nameOnScreen(page, PLATE);
  await page.mouse.click(name.x, name.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named?.id);
  await rested(page);

  await page.keyboard.press('Escape');
  await expect.poll(() => standing(page, 'inspection')).toBe(false);
  await rested(page);
  expect(await standing(page, 'menu')).toBe(false);

  await expect.poll(() => cardOnFace(page, 'small-card-0')).toBe(named?.id);
  await rested(page);
  const small = await onScreen(page, 'small-card-0');
  await page.mouse.move(small.x, small.y, { steps: 5 });
  await rested(page);
  await page.mouse.click(small.x, small.y, { button: 'right' });
  await expect.poll(() => cardOnFace(page, 'inspection')).toBe(named?.id);

  expect(problems).toEqual([]);
});

test('on a campaign a won chronicle paid into, its technology stands learned, the check mark before its name', async ({
  page,
}) => {
  const problems = watch(page);
  const { chronicle, tile } = landed();
  const index = idsOf(chronicle.hand).indexOf(SHELTER);
  const won = outcome(apply(CATALOGUE, chronicle, { type: 'play', index, aim: 'tile', tile }));
  const { campaign } = paidInto(CATALOGUE, freshCampaign(CATALOGUE), won);
  expect(campaign.technologies).toContain(TECHNOLOGY);

  await openCampaign(page, campaign);

  expect(await plateReads(page, PLATE)).toEqual({
    state: 'learned',
    name: text('plate.learned', { technology: technologyName(TECHNOLOGY) }),
    goal: achievementGoal(ACHIEVEMENT, EARNED.need),
    reward: rewardOf(),
  });
  expect(await page.evaluate((well) => window.named?.(well) !== undefined, `${PLATE}-well`)).toBe(
    true,
  );

  expect(problems).toEqual([]);
});

test('a tree wider than the room moves under the two pan keys and a drag, stopping at its ends, and not under a wheel notch', async ({
  page,
}) => {
  const problems = watch(page);
  await openCampaign(page);
  await rested(page);

  const room = await roomEdges(page);
  const opened = await treeEnds(page);
  const span = opened.right - opened.left;
  expect(span).toBeGreaterThan(room.right - room.left);
  /** Where the tree's left end stands with its right end on the room's right edge. */
  const rightEnd = room.right - span;
  /** The key held until the tree stands at that end, then held on past it, and let go. */
  const heldPast = async (code: string, end: number): Promise<void> => {
    await page.keyboard.down(code);
    await expect.poll(async () => (await treeEnds(page)).left).toBeCloseTo(end);
    await waitGameClock(page, 200);
    await page.keyboard.up(code);
    await rested(page);
    expect((await treeEnds(page)).left).toBeCloseTo(end);
  };

  const [first] = DEFAULTS['pan-left'];
  if (first === undefined) throw new Error('pan-left holds no key by default');
  await heldPast(first.code, room.left);
  for (const [at, rightward] of DEFAULTS['pan-right'].entries()) {
    const leftward = DEFAULTS['pan-left'][at];
    if (rightward === undefined || leftward === undefined) continue;
    await heldPast(rightward.code, rightEnd);
    await heldPast(leftward.code, room.left);
  }

  const press = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + rect.width * 0.8, y: rect.top + rect.height * 0.8 };
  });
  await page.mouse.move(press.x, press.y);
  await page.mouse.down();
  await page.mouse.move(press.x - 300, press.y, { steps: 10 });
  await rested(page);
  const dragged = (await treeEnds(page)).left;
  expect(dragged).toBeLessThan(room.left);
  await page.mouse.up();
  await rested(page);
  expect((await treeEnds(page)).left).toBe(dragged);

  await page.mouse.wheel(0, 100);
  await rested(page);
  expect((await treeEnds(page)).left).toBe(dragged);

  expect(problems).toEqual([]);
});
